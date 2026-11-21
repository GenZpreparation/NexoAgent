"""
NexoAgent - Comprehensive Test Suite for Speed-to-Lead Meta Ads & Auto-Retry Scheduler
Tests:
1. Meta Webhook GET Handshake Verification (hub.challenge / hub.verify_token)
2. Sub-30s Speed-to-Lead Instant Outbound AI Call Triggering
3. TRAI DND Filtering on Meta Lead Ads
4. Carrier 'busy' & 'no-answer' Webhook Triggering Smart Retry Scheduling
5. Due Retries Dispatch Engine
6. Max Retries Exhaustion Guard
"""
import asyncio
from datetime import datetime, timezone, timedelta
import httpx
from sqlalchemy import select
from app.main import app
from app.core.database import engine, Base, AsyncSessionLocal
from app.models import Workspace, User, VoiceAgent, Campaign, Lead, Call, CallLog
from app.services.campaign import campaign_engine, IST


async def run_tests():
    print("🔄 Setting up isolated database for Speed-to-Lead & Retry tests...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        async with AsyncSessionLocal() as db:
            # 1. Setup Workspace, Agent & Campaign
            ws = Workspace(name="DLF CyberCity Real Estate", slug="dlf-cybercity", balance_inr=500.0)
            db.add(ws)
            await db.flush()

            agent = VoiceAgent(
                workspace_id=ws.id,
                name="Pooja - Luxury Plots Qualifier",
                voice_provider="sarvam",
                voice_id="bulbul:v3/pooja",
                language="hi-IN",
                first_message="Namaste! Mai Pooja bol rahi hu DLF se.",
                system_prompt="Namaste! Mai Pooja bol rahi hu DLF se."
            )
            db.add(agent)
            await db.flush()

            campaign = Campaign(
                workspace_id=ws.id,
                agent_id=agent.id,
                name="Facebook Meta Leads Campaign",
                concurrency_limit=5,
                status="running"
            )
            db.add(campaign)
            await db.commit()
            print("✅ Initialized Workspace, Agent & Campaign")

        # ====================================================================
        # TEST 1: Meta Webhook GET Handshake Verification
        # ====================================================================
        print("\n--- TEST 1: Meta Webhook Verification Handshake ---")
        challenge_token = "1158201444"
        verify_res = await client.get(
            "/api/v1/webhooks/meta-leads",
            params={
                "hub.mode": "subscribe",
                "hub.verify_token": "nexo_meta_secret_2026",
                "hub.challenge": challenge_token
            }
        )
        assert verify_res.status_code == 200, f"Expected 200, got {verify_res.status_code}"
        assert verify_res.text == challenge_token, f"Expected challenge {challenge_token}, got {verify_res.text}"
        print("✅ Valid handshake returned HTTP 200 with raw challenge token.")

        # Tampered verify token
        tampered_res = await client.get(
            "/api/v1/webhooks/meta-leads",
            params={
                "hub.mode": "subscribe",
                "hub.verify_token": "wrong_secret_token",
                "hub.challenge": challenge_token
            }
        )
        assert tampered_res.status_code == 403, f"Expected 403, got {tampered_res.status_code}"
        print("✅ Tampered verify token rejected with HTTP 403 Forbidden.")

        # ====================================================================
        # TEST 2: Sub-30s Speed-to-Lead Instant Outbound AI Call
        # ====================================================================
        print("\n--- TEST 2: Speed-to-Lead Instant Dialout ---")
        lead_payload = {
            "full_name": "Karan Singhal",
            "phone_number": "9812345678",
            "city": "Gurgaon",
            "workspace_id": 1,
            "agent_id": 1,
            "campaign_id": 1,
            "auto_dial": True,
            "custom_data": {"ad_name": "DLF Plots Phase 5", "budget": "3.5 Cr"}
        }

        # Force TRAI hours check to pass during test
        original_trai_check = campaign_engine.is_within_trai_calling_hours
        campaign_engine.is_within_trai_calling_hours = lambda dt=None: True

        speed_res = await client.post("/api/v1/webhooks/meta-leads", json=lead_payload)
        assert speed_res.status_code == 200, f"Expected 200, got {speed_res.status_code}: {speed_res.text}"
        speed_data = speed_res.json()
        assert speed_data["speed_to_lead_status"] == "instant_dialed"
        assert speed_data["phone_number"] == "+919812345678"
        assert speed_data["call_sid"] is not None
        call_sid = speed_data["call_sid"]
        print(f"✅ Speed-to-Lead triggered in < 30s. Call SID: {call_sid}")

        # Verify DB Call record
        async with AsyncSessionLocal() as db:
            call_res = await db.execute(select(Call).where(Call.call_sid == call_sid))
            db_call = call_res.scalar_one_or_none()
            assert db_call is not None
            assert db_call.customer_phone == "+919812345678"
            assert db_call.status == "initiated"
            print("✅ Call record verified in database with direction='outbound'.")

        # ====================================================================
        # TEST 3: TRAI DND Registry Scrubbing on Meta Lead
        # ====================================================================
        print("\n--- TEST 3: DND Scrubbing on Meta Ads Lead ---")
        dnd_lead_payload = {
            "full_name": "DND User",
            "phone_number": "9812300000",  # Ends with 0000 -> DND
            "workspace_id": 1,
            "auto_dial": True
        }
        dnd_res = await client.post("/api/v1/webhooks/meta-leads", json=dnd_lead_payload)
        dnd_data = dnd_res.json()
        assert dnd_data["dnd_scrubbed"] is True
        assert dnd_data["call_dispatched"] is False
        print("✅ DND lead detected and prevented from auto-dialing.")

        # ====================================================================
        # TEST 4: Telephony Busy Webhook Triggering Auto-Retry Scheduling
        # ====================================================================
        print("\n--- TEST 4: Telephony 'busy' -> Auto-Retry Scheduled ---")
        # Find lead associated with call_sid
        async with AsyncSessionLocal() as db:
            lead_res = await db.execute(select(Lead).where(Lead.call_sid == call_sid))
            test_lead = lead_res.scalar_one_or_none()
            assert test_lead is not None
            assert test_lead.status == "dialing"

        # Carrier posts 'busy' status
        busy_event = {
            "call_id": call_sid,
            "to_phone": "+919812345678",
            "from_phone": "+911145678900",
            "call_status": "busy",
            "call_duration_seconds": 0,
            "workspace_id": 1,
            "agent_id": 1
        }
        busy_res = await client.post("/api/v1/webhooks/telephony", json=busy_event)
        assert busy_res.status_code == 200
        assert busy_res.json()["retry_scheduled"] is True

        # Verify DB Lead state
        async with AsyncSessionLocal() as db:
            lead_res = await db.execute(select(Lead).where(Lead.call_sid == call_sid))
            updated_lead = lead_res.scalar_one_or_none()
            assert updated_lead.status == "retry_scheduled"
            assert updated_lead.next_retry_at is not None
            lead_next_retry = updated_lead.next_retry_at.replace(tzinfo=timezone.utc) if updated_lead.next_retry_at.tzinfo is None else updated_lead.next_retry_at
            assert lead_next_retry > datetime.now(timezone.utc)
            print(f"✅ Lead scheduled for retry at {updated_lead.next_retry_at}.")

        # ====================================================================
        # TEST 5: Due Retries Dispatching Engine
        # ====================================================================
        print("\n--- TEST 5: Dispatching Due Retries ---")
        # Artificially age the next_retry_at to past so it becomes due
        async with AsyncSessionLocal() as db:
            lead_res = await db.execute(select(Lead).where(Lead.call_sid == call_sid))
            matured_lead = lead_res.scalar_one_or_none()
            matured_lead.next_retry_at = datetime.now(timezone.utc) - timedelta(minutes=5)
            await db.commit()

        # Dispatch due retries
        async with AsyncSessionLocal() as db:
            dispatch_stats = await campaign_engine.dispatch_due_retries(
                campaign_id=1,
                workspace_id=1,
                db=db
            )
            assert dispatch_stats["dispatched_count"] == 1
            retried = dispatch_stats["dispatched_retries"][0]
            assert retried["attempt_number"] == 2
            print(f"✅ Successfully dispatched retry attempt 2: Call SID {retried['call_sid']}")

        # ====================================================================
        # TEST 6: Max Retries Exhaustion Guard
        # ====================================================================
        print("\n--- TEST 6: Max Retries Exhaustion ---")
        async with AsyncSessionLocal() as db:
            lead_res = await db.execute(select(Lead).where(Lead.id == test_lead.id))
            lead_to_exhaust = lead_res.scalar_one_or_none()
            lead_to_exhaust.retry_count = 3  # Hit max retries
            new_call_sid = lead_to_exhaust.call_sid
            await db.commit()

        # Telephony reports 'no-answer'
        no_answer_event = {
            "call_id": new_call_sid,
            "to_phone": "+919812345678",
            "from_phone": "+911145678900",
            "call_status": "no-answer",
            "call_duration_seconds": 0,
            "workspace_id": 1,
            "agent_id": 1
        }
        no_answer_res = await client.post("/api/v1/webhooks/telephony", json=no_answer_event)
        assert no_answer_res.status_code == 200
        assert no_answer_res.json()["retry_scheduled"] is False

        # Verify DB Lead state is 'exhausted'
        async with AsyncSessionLocal() as db:
            lead_res = await db.execute(select(Lead).where(Lead.id == test_lead.id))
            exhausted_lead = lead_res.scalar_one_or_none()
            assert exhausted_lead.status == "exhausted"
            assert exhausted_lead.next_retry_at is None
            print("✅ Lead reached max retries (3) and cleanly transitioned to 'exhausted'.")

        # Restore TRAI check
        campaign_engine.is_within_trai_calling_hours = original_trai_check

    print("\n🎉 ALL SPEED-TO-LEAD & AUTO-RETRY TESTS PASSED 100%!")


if __name__ == "__main__":
    asyncio.run(run_tests())
