"""
NexoAgent - Task 1 Test Suite: Financial Wallet Ledger & Audit Integrity
Tests:
1. Workspace initial balance
2. Atomic Credit (Recharge) with mathematical opening/closing balance verification
3. Atomic Debit (Call usage via telephony webhook) with immutable transaction recording
4. Pre-dial threshold balance check (has_sufficient_balance)
5. Multi-tenant ledger isolation
"""
import asyncio
import httpx
from sqlalchemy import select
from app.main import app
from app.core.database import engine, Base, AsyncSessionLocal
from app.models import Workspace, WalletTransaction
from app.services.wallet import wallet_service


async def run_wallet_tests():
    print("🔄 Setting up isolated database for Wallet Ledger tests...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create 2 Workspaces
        async with AsyncSessionLocal() as db:
            ws1 = Workspace(name="Godrej Properties", slug="godrej-prop", balance_inr=500.0)
            ws2 = Workspace(name="DLF CyberCity", slug="dlf-cyber", balance_inr=100.0)
            db.add_all([ws1, ws2])
            await db.commit()
            await db.refresh(ws1)
            await db.refresh(ws2)
            print("✅ Initialized Workspaces (Godrej: ₹500.0, DLF: ₹100.0)")

        # ====================================================================
        # TEST 1: Atomic Credit (Recharge Top-up)
        # ====================================================================
        print("\n--- TEST 1: Wallet Credit (Recharge Top-Up) ---")
        async with AsyncSessionLocal() as db:
            new_bal, txn = await wallet_service.credit_balance(
                workspace_id=ws1.id,
                amount_inr=1000.0,
                reference_id="pay_test_998877",
                description="Razorpay Recharge: Growth Pack (₹1,000)",
                db=db
            )
            await db.commit()

            assert new_bal == 1500.0
            assert txn.transaction_type == "credit"
            assert txn.opening_balance_inr == 500.0
            assert txn.amount_inr == 1000.0
            assert txn.closing_balance_inr == 1500.0
            assert txn.reference_id == "pay_test_998877"
            print(f"✅ Credit Verified: Opening=₹{txn.opening_balance_inr} + ₹{txn.amount_inr} -> Closing=₹{txn.closing_balance_inr}")

        # ====================================================================
        # TEST 2: Atomic Debit via Telephony Webhook Call Completion
        # ====================================================================
        print("\n--- TEST 2: Wallet Debit via Completed Call Webhook ---")
        # Simulate completed call of 75 seconds (2 minute pulse @ ₹5.50 = ₹11.00)
        call_event = {
            "call_id": "CA_WALLET_TEST_101",
            "to_phone": "+919876543210",
            "from_phone": "+918045678900",
            "call_status": "completed",
            "call_duration_seconds": 75,
            "workspace_id": ws1.id,
            "agent_id": 1
        }
        res = await client.post("/api/v1/webhooks/telephony", json=call_event)
        assert res.status_code == 200
        assert res.json()["billed_cost_inr"] == 11.0

        # Verify DB balance and WalletTransaction row
        async with AsyncSessionLocal() as db:
            curr_bal = await wallet_service.get_balance(ws1.id, db)
            assert curr_bal == 1489.0

            txn_res = await db.execute(
                select(WalletTransaction)
                .where(WalletTransaction.workspace_id == ws1.id)
                .order_by(WalletTransaction.id.desc())
            )
            debit_txn = txn_res.scalars().first()
            assert debit_txn is not None
            assert debit_txn.transaction_type == "debit"
            assert debit_txn.amount_inr == 11.0
            assert debit_txn.opening_balance_inr == 1500.0
            assert debit_txn.closing_balance_inr == 1489.0
            assert debit_txn.reference_id == "CA_WALLET_TEST_101"
            print(f"✅ Debit Verified: Opening=₹{debit_txn.opening_balance_inr} - ₹{debit_txn.amount_inr} -> Closing=₹{debit_txn.closing_balance_inr}")

        # ====================================================================
        # TEST 3: Pre-Dial Sufficient Balance Check
        # ====================================================================
        print("\n--- TEST 3: Pre-Dial Sufficient Balance Check ---")
        async with AsyncSessionLocal() as db:
            # Godrej has ₹1489.0 -> Sufficient
            can_dial_godrej = await wallet_service.has_sufficient_balance(ws1.id, min_threshold_inr=10.0, db=db)
            assert can_dial_godrej is True

            # Create broke workspace with ₹2.0
            ws_broke = Workspace(name="Broke Real Estate", slug="broke-corp", balance_inr=2.0)
            db.add(ws_broke)
            await db.commit()
            await db.refresh(ws_broke)

            can_dial_broke = await wallet_service.has_sufficient_balance(ws_broke.id, min_threshold_inr=10.0, db=db)
            assert can_dial_broke is False
            print("✅ Pre-dial guard passed: Allowed ₹1489 balance, blocked ₹2 balance (< ₹10 threshold).")

        # ====================================================================
        # TEST 4: Multi-Tenant Ledger Isolation
        # ====================================================================
        print("\n--- TEST 4: Multi-Tenant Ledger Isolation ---")
        async with AsyncSessionLocal() as db:
            # DLF performs recharge of ₹200
            await wallet_service.credit_balance(
                workspace_id=ws2.id,
                amount_inr=200.0,
                reference_id="pay_dlf_001",
                description="DLF Recharge",
                db=db
            )
            await db.commit()

            # Godrej should only see their 2 transactions (1 credit, 1 debit)
            godrej_txns = (await db.execute(
                select(WalletTransaction).where(WalletTransaction.workspace_id == ws1.id)
            )).scalars().all()
            assert len(godrej_txns) == 2

            # DLF should only see their 1 transaction
            dlf_txns = (await db.execute(
                select(WalletTransaction).where(WalletTransaction.workspace_id == ws2.id)
            )).scalars().all()
            assert len(dlf_txns) == 1
            print("✅ Strict tenant isolation verified: Godrej cannot see DLF ledger.")

    print("\n🎉 ALL TASK 1 WALLET LEDGER & AUDIT TESTS PASSED 100%!")


if __name__ == "__main__":
    asyncio.run(run_wallet_tests())
