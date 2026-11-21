"""
Test Call Ledger & Live Telephony Webhook Database Sync
Verifies:
1. Real-time Webhook lifecycle events writing into database (Call & CallLog)
2. Automated telecom minute-pulse billing deduction from Workspace wallet
3. Zero-billing for busy/unanswered calls
4. Paginated Call Ledger listing with status filters
5. Cross-tenant isolation on call recordings and transcripts
"""
import asyncio
import httpx
from sqlalchemy import select
from app.main import app
from app.core.database import engine, Base, AsyncSessionLocal
from app.models import CallLog, Workspace


async def run_call_ledger_tests():
    print("🔄 Resetting database for Call Ledger tests...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database ready.")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register Two Companies
        godrej_reg = await client.post("/api/v1/auth/register", json={
            "company_name": "Godrej Properties",
            "full_name": "Godrej Admin",
            "email": "admin@godrej.com",
            "password": "Password123@"
        })
        godrej_data = godrej_reg.json()
        godrej_token = godrej_data["access_token"]
        godrej_ws_id = godrej_data["workspace"]["id"]

        dlf_reg = await client.post("/api/v1/auth/register", json={
            "company_name": "DLF CyberCity",
            "full_name": "DLF Admin",
            "email": "admin@dlf.com",
            "password": "Password123@"
        })
        dlf_data = dlf_reg.json()
        dlf_token = dlf_data["access_token"]
        dlf_ws_id = dlf_data["workspace"]["id"]

        print("\n--- 1. Testing Webhook Event 1 (Godrej Call Answered & Completed) ---")
        # Step A: initiated
        init_res = await client.post("/api/v1/webhooks/telephony", json={
            "call_id": "CA-GODREJ-001",
            "to_phone": "+919876543210",
            "from_phone": "+911145678900",
            "call_status": "initiated",
            "workspace_id": godrej_ws_id
        })
        assert init_res.status_code == 200

        # Step B: completed with 75 seconds duration (2 mins pulse = Rs. 11.00)
        comp_res = await client.post("/api/v1/webhooks/telephony", json={
            "call_id": "CA-GODREJ-001",
            "to_phone": "+919876543210",
            "from_phone": "+911145678900",
            "call_status": "completed",
            "call_duration_seconds": 75,
            "recording_url": "https://storage.nexoagent.com/recordings/CA-GODREJ-001.mp3",
            "workspace_id": godrej_ws_id
        })
        assert comp_res.status_code == 200
        assert comp_res.json()["billed_cost_inr"] == 11.00
        print("✅ Godrej Call 1 completed. 75s billed as 2 mins = Rs. 11.00")

        # Verify Godrej Wallet Balance Deducted (Rs. 500.00 - Rs. 11.00 = Rs. 489.00)
        godrej_me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {godrej_token}"})
        assert godrej_me.json()["workspace"]["balance_inr"] == 489.00
        print(f"✅ Godrej wallet deducted accurately: ₹{godrej_me.json()['workspace']['balance_inr']}")

        print("\n--- 2. Testing Webhook Event 2 (Godrej Call Busy / Zero Billing) ---")
        busy_res = await client.post("/api/v1/webhooks/telephony", json={
            "call_id": "CA-GODREJ-002",
            "to_phone": "+919811122233",
            "from_phone": "+911145678900",
            "call_status": "busy",
            "workspace_id": godrej_ws_id
        })
        assert busy_res.status_code == 200
        assert busy_res.json()["billed_cost_inr"] == 0.00
        print("✅ Godrej Call 2 busy cleanly processed with Rs. 0.00 charge.")

        # Wallet should still be 489.00
        godrej_me2 = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {godrej_token}"})
        assert godrej_me2.json()["workspace"]["balance_inr"] == 489.00

        print("\n--- 3. Testing Webhook Event 3 (DLF Call Completed) ---")
        dlf_call_res = await client.post("/api/v1/webhooks/telephony", json={
            "call_id": "CA-DLF-555",
            "to_phone": "+919998887776",
            "from_phone": "+911145678900",
            "call_status": "completed",
            "call_duration_seconds": 125,  # 125s -> 3 mins = Rs. 16.50
            "workspace_id": dlf_ws_id
        })
        assert dlf_call_res.status_code == 200
        assert dlf_call_res.json()["billed_cost_inr"] == 16.50
        print("✅ DLF Call completed. 125s billed as 3 mins = Rs. 16.50")

        # DLF balance deducted (500.0 - 16.50 = 483.50)
        dlf_me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {dlf_token}"})
        assert dlf_me.json()["workspace"]["balance_inr"] == 483.50
        print(f"✅ DLF wallet deducted accurately: ₹{dlf_me.json()['workspace']['balance_inr']}")

        print("\n--- 4. Testing Call Ledger APIs & Status Filters ---")
        # List all Godrej calls
        g_calls_resp = await client.get("/api/v1/calls", headers={"Authorization": f"Bearer {godrej_token}"})
        assert g_calls_resp.status_code == 200
        g_calls = g_calls_resp.json()
        assert g_calls["total"] == 2
        assert len(g_calls["items"]) == 2
        godrej_call_1_id = g_calls["items"][1]["id"] if g_calls["items"][1]["call_sid"] == "CA-GODREJ-001" else g_calls["items"][0]["id"]
        print(f"✅ Godrej sees exactly their 2 calls. DLF's call is completely hidden.")

        # Filter by status="completed"
        g_comp_resp = await client.get("/api/v1/calls?status=completed", headers={"Authorization": f"Bearer {godrej_token}"})
        assert g_comp_resp.status_code == 200
        assert g_comp_resp.json()["total"] == 1
        assert g_comp_resp.json()["items"][0]["call_sid"] == "CA-GODREJ-001"
        print("✅ Status filter ('completed') successfully returned 1 matching call.")

        # Filter by status="busy"
        g_busy_resp = await client.get("/api/v1/calls?status=busy", headers={"Authorization": f"Bearer {godrej_token}"})
        assert g_busy_resp.status_code == 200
        assert g_busy_resp.json()["total"] == 1
        assert g_busy_resp.json()["items"][0]["call_sid"] == "CA-GODREJ-002"
        print("✅ Status filter ('busy') successfully returned 1 matching call.")

        print("\n--- 5. Testing Cross-Tenant IDOR Attack on Calls ---")
        # Fetch DLF call ID
        d_calls_resp = await client.get("/api/v1/calls", headers={"Authorization": f"Bearer {dlf_token}"})
        dlf_call_id = d_calls_resp.json()["items"][0]["id"]

        # Godrej tries to view DLF's call
        leak_try = await client.get(f"/api/v1/calls/{dlf_call_id}", headers={"Authorization": f"Bearer {godrej_token}"})
        assert leak_try.status_code == 404
        print(f"✅ Blocked: Godrej cannot view DLF's call ID {dlf_call_id} (Returned 404 Not Found).")

        # DLF tries to view Godrej's call
        leak_try_2 = await client.get(f"/api/v1/calls/{godrej_call_1_id}", headers={"Authorization": f"Bearer {dlf_token}"})
        assert leak_try_2.status_code == 404
        print(f"✅ Blocked: DLF cannot view Godrej's call ID {godrej_call_1_id} (Returned 404 Not Found).")

        print("\n--- 6. Testing Detailed Call Inspection with Post-Call Intelligence ---")
        # Simulate AI post-call intelligence insertion into CallLog
        async with AsyncSessionLocal() as session:
            log_res = await session.execute(select(CallLog).where(CallLog.call_id == godrej_call_1_id))
            log = log_res.scalar_one()
            log.transcript = "Agent: Namaste! Godrej Woods se Pooja. User: 3 BHK ka price kya hai?"
            log.summary = "Customer inquired about 3 BHK unit pricing."
            log.sentiment = "Positive"
            log.extracted_data = {"budget": "2.1 Cr", "unit": "3 BHK"}
            log.whatsapp_status = "sent"
            await session.commit()

        # Query single call API
        single_call_resp = await client.get(f"/api/v1/calls/{godrej_call_1_id}", headers={"Authorization": f"Bearer {godrej_token}"})
        assert single_call_resp.status_code == 200
        single_data = single_call_resp.json()
        assert single_data["call_sid"] == "CA-GODREJ-001"
        assert single_data["duration_seconds"] == 75
        assert single_data["cost_inr"] == 11.00
        assert single_data["recording_url"] == "https://storage.nexoagent.com/recordings/CA-GODREJ-001.mp3"
        assert single_data["log"]["sentiment"] == "Positive"
        assert single_data["log"]["extracted_data"]["budget"] == "2.1 Cr"
        assert single_data["log"]["whatsapp_status"] == "sent"
        print("✅ Single call details and AI post-call intelligence verified with 100% accuracy!")

    await engine.dispose()
    print("\n🎉 ALL CALL LEDGER & TELEPHONY WEBHOOK SYNC TESTS PASSED 100%!")


if __name__ == "__main__":
    asyncio.run(run_call_ledger_tests())
