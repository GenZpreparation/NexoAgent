"""
NexoAgent - Task 3 Test Suite: Pre-Dial Wallet Balance Enforcer & Full Billing Integration
Tests:
1. Single Direct Call Dispatch with Pre-Dial Guard (402 Payment Required when balance < ₹10)
2. Bulk Campaign Start with Pre-Dial Guard (402 Payment Required when balance < ₹10)
3. End-to-End Financial Lifecycle:
   Blocked (₹0) -> Recharged via Razorpay (+₹1,000) -> Unblocked -> Dispatched -> Billed -> Ledger Audited
"""
import asyncio
import httpx
from sqlalchemy import select
from app.main import app
from app.core.database import engine, Base, AsyncSessionLocal
from app.models import Workspace, User, VoiceAgent, Campaign, Lead, Call, WalletTransaction
from app.services.razorpay_service import razorpay_service


async def run_predial_tests():
    print("🔄 Setting up isolated database for Pre-Dial Balance Enforcer tests...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register Funded Company (DLF - ₹500 initial bonus)
        dlf_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "telecom@dlf.com",
                "password": "Password123!",
                "full_name": "DLF Admin",
                "company_name": "DLF Phase 5",
                "phone": "+919811122333"
            }
        )
        assert dlf_res.status_code == 201
        dlf_token = dlf_res.json()["access_token"]
        dlf_headers = {"Authorization": f"Bearer {dlf_token}"}

        # 2. Register Broke Company (Zero balance)
        broke_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "broke@startup.com",
                "password": "Password123!",
                "full_name": "Broke Founder",
                "company_name": "Zero Balance Tech",
                "phone": "+919822233444"
            }
        )
        assert broke_res.status_code == 201
        broke_token = broke_res.json()["access_token"]
        broke_headers = {"Authorization": f"Bearer {broke_token}"}

        # Manually drain Broke Company balance to ₹2.0 (< ₹10 threshold)
        async with AsyncSessionLocal() as db:
            broke_ws = (await db.execute(select(Workspace).where(Workspace.id == 2))).scalar_one()
            broke_ws.balance_inr = 2.0
            await db.commit()
            print("✅ Created DLF (Balance: ₹500.0) and Broke Tech (Balance: ₹2.0)")

        # Create Agent for DLF & Broke Tech
        async with AsyncSessionLocal() as db:
            agent1 = VoiceAgent(
                workspace_id=1,
                name="DLF Agent",
                voice_provider="sarvam",
                voice_id="bulbul:v3/pooja",
                language="hi-IN",
                first_message="Namaste!",
                system_prompt="Sales Agent"
            )
            agent2 = VoiceAgent(
                workspace_id=2,
                name="Broke Tech Agent",
                voice_provider="sarvam",
                voice_id="bulbul:v3/pooja",
                language="hi-IN",
                first_message="Hello!",
                system_prompt="Support Agent"
            )
            db.add_all([agent1, agent2])
            await db.commit()
            print("✅ Initialized Voice Agents for both workspaces.")

        # ====================================================================
        # TEST 1: Single Call Dispatch with Pre-Dial Guard
        # ====================================================================
        print("\n--- TEST 1: Single Call Dispatch & Pre-Dial Guard ---")
        # 1A: DLF has ₹500 -> Dispatch should SUCCEED
        dlf_call = await client.post(
            "/api/v1/calls/dispatch",
            headers=dlf_headers,
            json={"phone_number": "+919876543210", "agent_id": 1}
        )
        assert dlf_call.status_code == 201, f"Expected 201, got {dlf_call.status_code}: {dlf_call.text}"
        call_sid = dlf_call.json()["call_sid"]
        print(f"✅ DLF Call Allowed: Call SID {call_sid} queued on carrier.")

        # 1B: Broke Tech has ₹2.0 -> Must be BLOCKED with HTTP 402 Payment Required!
        broke_call = await client.post(
            "/api/v1/calls/dispatch",
            headers=broke_headers,
            json={"phone_number": "+919876543210", "agent_id": 2}
        )
        assert broke_call.status_code == 402, f"Expected 402, got {broke_call.status_code}"
        assert "insufficient wallet balance" in broke_call.json()["detail"].lower()
        print("✅ Pre-Dial Guard Blocked Broke Tech with HTTP 402 Payment Required!")

        # ====================================================================
        # TEST 2: Bulk Campaign Launch Pre-Dial Guard
        # ====================================================================
        print("\n--- TEST 2: Bulk Campaign Start Pre-Dial Guard ---")
        # Create campaign for Broke Tech
        camp_res = await client.post(
            "/api/v1/campaigns",
            headers=broke_headers,
            json={"name": "Zero Balance Campaign", "agent_id": 2, "concurrency_limit": 5}
        )
        assert camp_res.status_code == 201
        camp_id = camp_res.json()["id"]

        # Try to start campaign with ₹2 balance -> Must be BLOCKED with HTTP 402!
        start_res = await client.post(
            f"/api/v1/campaigns/{camp_id}/start",
            headers=broke_headers
        )
        assert start_res.status_code == 402
        assert "minimum ₹10.00 required" in start_res.json()["detail"].lower()
        print("✅ Bulk Campaign Start Blocked with HTTP 402 Payment Required!")

        # ====================================================================
        # TEST 3: End-to-End Unblock via Razorpay Recharge
        # ====================================================================
        print("\n--- TEST 3: Recharge via Razorpay -> Unblock & Dial ---")
        # 3A: Broke Tech creates Razorpay Order for ₹1,000
        order_res = await client.post(
            "/api/v1/billing/create-order",
            headers=broke_headers,
            json={"amount_inr": 1000.0}
        )
        order_id = order_res.json()["order_id"]

        # 3B: Simulate successful payment verification
        pay_id = "pay_unblock_startup_999"
        sig = razorpay_service.generate_signature_for_test(order_id, pay_id)
        verify_res = await client.post(
            "/api/v1/billing/verify-payment",
            headers=broke_headers,
            json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": pay_id,
                "razorpay_signature": sig,
                "amount_inr": 1000.0
            }
        )
        assert verify_res.status_code == 200
        assert verify_res.json()["new_balance_inr"] == 1002.0  # ₹2 + ₹1000 = ₹1002
        print("✅ Broke Tech Recharged ₹1,000! New Balance: ₹1,002.0")

        # 3C: Broke Tech now re-tries the single call dispatch -> MUST SUCCEED!
        unblocked_call = await client.post(
            "/api/v1/calls/dispatch",
            headers=broke_headers,
            json={"phone_number": "+919876543210", "agent_id": 2}
        )
        assert unblocked_call.status_code == 201
        print("✅ Broke Tech is now UNBLOCKED and successfully placed call!")

        # 3D: Simulate call completion (80s = 2 mins @ ₹5.50 = ₹11.00)
        unblocked_call_sid = unblocked_call.json()["call_sid"]
        comp_event = {
            "call_id": unblocked_call_sid,
            "to_phone": "+919876543210",
            "from_phone": "+918045678900",
            "call_status": "completed",
            "call_duration_seconds": 80,
            "workspace_id": 2,
            "agent_id": 2
        }
        hook_res = await client.post("/api/v1/webhooks/telephony", json=comp_event)
        assert hook_res.status_code == 200

        # Verify DB balance deducted: ₹1002 - ₹11 = ₹991.0
        async with AsyncSessionLocal() as db:
            broke_ws = (await db.execute(select(Workspace).where(Workspace.id == 2))).scalar_one()
            assert broke_ws.balance_inr == 991.0
            print(f"✅ Call duration 80s billed as 2 mins. Final balance: ₹{broke_ws.balance_inr}")

            # Verify audit ledger has both credit and debit
            txns = (await db.execute(
                select(WalletTransaction).where(WalletTransaction.workspace_id == 2).order_by(WalletTransaction.id.asc())
            )).scalars().all()
            assert len(txns) == 2
            assert txns[0].transaction_type == "credit"
            assert txns[0].amount_inr == 1000.0
            assert txns[1].transaction_type == "debit"
            assert txns[1].amount_inr == 11.0
            print("✅ Financial audit ledger verified with 100% mathematical precision.")

    print("\n🎉 ALL TASK 3 PRE-DIAL ENFORCER & BILLING TESTS PASSED 100%!")


if __name__ == "__main__":
    asyncio.run(run_predial_tests())
