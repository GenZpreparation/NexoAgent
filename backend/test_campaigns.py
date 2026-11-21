"""
Test Bulk Campaign Engine, CSV Ingestion & Pacing Dispatcher
Verifies:
1. TRAI 10 AM - 7 PM Calling Hours Enforcement
2. DND Registry Scrubbing (auto-blocking DND numbers)
3. CSV upload, phone sanitization (+91), deduplication, and corrupt number rejection
4. Pacing Engine Concurrency Control (batch dialing without choking trunk)
5. Tenant isolation (DLF cannot view or start Godrej's campaign)
"""
import io
import asyncio
from datetime import datetime, timezone, timedelta
import httpx
from app.main import app
from app.core.database import engine, Base
from app.services.campaign import campaign_engine, IST


async def run_campaign_tests():
    print("🔄 Resetting database for Campaign Engine tests...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database ready.")

    print("\n--- 1. Testing TRAI Compliance & DND Scrubber ---")
    # Test TRAI calling hours (10:00 - 19:00 IST)
    time_11_am_ist = datetime(2026, 11, 11, 5, 30, tzinfo=timezone.utc)  # 11:00 AM IST
    time_08_am_ist = datetime(2026, 11, 11, 2, 30, tzinfo=timezone.utc)  # 08:00 AM IST
    time_08_pm_ist = datetime(2026, 11, 11, 14, 30, tzinfo=timezone.utc) # 08:00 PM IST

    assert campaign_engine.is_within_trai_calling_hours(time_11_am_ist) is True
    assert campaign_engine.is_within_trai_calling_hours(time_08_am_ist) is False
    assert campaign_engine.is_within_trai_calling_hours(time_08_pm_ist) is False
    print("✅ TRAI calling window rule (10 AM - 7 PM IST) strictly verified.")

    # Test DND scrubber
    assert campaign_engine.is_dnd_registered("+919876540000") is True
    assert campaign_engine.is_dnd_registered("+919876543210") is False
    print("✅ DND scrubber verified.")

    print("\n--- 2. Testing Campaign Creation & Agent Binding ---")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Register Godrej & DLF
        godrej_reg = await client.post("/api/v1/auth/register", json={
            "company_name": "Godrej Properties",
            "full_name": "Godrej Admin",
            "email": "admin@godrej.com",
            "password": "Password123@"
        })
        godrej_token = godrej_reg.json()["access_token"]

        dlf_reg = await client.post("/api/v1/auth/register", json={
            "company_name": "DLF CyberCity",
            "full_name": "DLF Admin",
            "email": "admin@dlf.com",
            "password": "Password123@"
        })
        dlf_token = dlf_reg.json()["access_token"]

        # Godrej creates Voice Agent
        agent_resp = await client.post(
            "/api/v1/agents",
            headers={"Authorization": f"Bearer {godrej_token}"},
            json={
                "name": "Pooja - Godrej Woods",
                "system_prompt": "Tu Pooja hai, Godrej Woods sales specialist.",
                "first_message": "Namaste! Godrej Woods se Pooja.",
                "voice_provider": "sarvam",
                "voice_id": "bulbul:v3/pooja"
            }
        )
        agent_id = agent_resp.json()["id"]

        # Godrej creates Campaign
        camp_resp = await client.post(
            "/api/v1/campaigns",
            headers={"Authorization": f"Bearer {godrej_token}"},
            json={
                "name": "Noida Sector 43 HNI Campaign",
                "agent_id": agent_id,
                "concurrency_limit": 3
            }
        )
        assert camp_resp.status_code == 201
        camp_data = camp_resp.json()
        campaign_id = camp_data["id"]
        assert camp_data["name"] == "Noida Sector 43 HNI Campaign"
        assert camp_data["concurrency_limit"] == 3
        assert camp_data["status"] == "draft"
        print(f"✅ Campaign created ID={campaign_id} with Concurrency Limit = 3.")

        print("\n--- 3. Testing Real-World CSV Lead Ingestion ---")
        csv_sample = (
            "name,phone,city,budget\n"
            "Aman Verma,9876543210,Noida,2.5 Cr\n"
            "Priya Sharma, (98111) 22-333 ,Delhi,1.8 Cr\n"
            "DND Customer,9899990000,Gurgaon,3.0 Cr\n"
            "Duplicate Aman,9876543210,Noida,2.5 Cr\n"
            "Corrupt Lead,12345,Faridabad,None\n"
        )
        
        upload_resp = await client.post(
            f"/api/v1/campaigns/{campaign_id}/upload-csv",
            headers={"Authorization": f"Bearer {godrej_token}"},
            files={"file": ("leads.csv", csv_sample.encode("utf-8"), "text/csv")}
        )
        assert upload_resp.status_code == 200
        stats = upload_resp.json()
        print("✅ Ingestion Stats:", stats)
        assert stats["leads_added"] == 2  # Aman + Priya
        assert stats["dnd_scrubbed_blocked"] == 1  # DND Customer
        assert stats["duplicates_skipped"] == 1  # Duplicate Aman
        assert stats["invalid_numbers_skipped"] == 1  # 12345

        # Check Leads in Database
        leads_res = await client.get(f"/api/v1/campaigns/{campaign_id}/leads", headers={"Authorization": f"Bearer {godrej_token}"})
        leads = leads_res.json()
        assert len(leads) == 3  # 2 pending + 1 dnd_blocked
        assert any(l["status"] == "dnd_blocked" for l in leads)
        assert any(l["phone_number"] == "+919876543210" for l in leads)
        print("✅ Leads saved in database with proper statuses (pending & dnd_blocked).")

        print("\n--- 4. Testing Pacing Engine & Batch Dispatch ---")
        start_resp = await client.post(
            f"/api/v1/campaigns/{campaign_id}/start",
            headers={"Authorization": f"Bearer {godrej_token}"}
        )
        assert start_resp.status_code == 200
        start_data = start_resp.json()
        print(f"✅ Campaign Started! Dispatched {start_data['dispatched_count']} calls (Concurrency Limit: {start_data['concurrency_limit']})")
        assert start_data["status"] == "campaign_running"
        assert start_data["dispatched_count"] == 2  # Aman + Priya dispatched
        for d in start_data["dispatched_leads"]:
            print(f"   📞 Dialed: {d['name']} ({d['phone']}) -> Call SID: {d['call_sid']}")

        print("\n--- 5. Testing Tenant Isolation on Campaigns ---")
        # DLF tries to view Godrej's campaign
        hack_view = await client.get(f"/api/v1/campaigns/{campaign_id}", headers={"Authorization": f"Bearer {dlf_token}"})
        assert hack_view.status_code == 404
        print(f"✅ Blocked: DLF cannot view Godrej's campaign (Returned 404 Not Found).")

        # DLF tries to start Godrej's campaign
        hack_start = await client.post(f"/api/v1/campaigns/{campaign_id}/start", headers={"Authorization": f"Bearer {dlf_token}"})
        assert hack_start.status_code == 404
        print(f"✅ Blocked: DLF cannot start Godrej's campaign (Returned 404 Not Found).")

    await engine.dispose()
    print("\n🎉 ALL BULK CAMPAIGN & PACING DISPATCHER TESTS PASSED 100%!")


if __name__ == "__main__":
    asyncio.run(run_campaign_tests())
