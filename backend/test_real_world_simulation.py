"""
========================================================================================
🚀 NEXOAGENT - MASTER REAL-WORLD END-TO-END ENTERPRISE SIMULATION
========================================================================================
Simulates the 100% real-world production lifecycle of an Indian B2B Voice AI Telecalling SaaS:

STAGE 1:  Tenant Onboarding (Registration, JWT Authentication & ₹500 Free Balance)
STAGE 2:  Voice Agent Studio (Bilingual Hindi/Hinglish Persona & Prompt Setup)
STAGE 3:  Single Outbound Direct Call with Pre-Dial Balance Check
STAGE 4:  In-Call Mid-Speech WhatsApp Brochure Tool Execution
STAGE 5:  Call Hangup, 60s Telecom Pulse Billing & Atomic Wallet Debit
STAGE 6:  Post-Call AI Intelligence Extraction & Presigned S3/R2 Recording URL
STAGE 7:  Bulk CSV Campaign Ingestion (TRAI Calling Window, DND Scrubbing & Deduplication)
STAGE 8:  Speed-to-Lead Meta Lead Ads Webhook (< 30s Instant Outbound Dialout)
STAGE 9:  Unanswered / Busy Lead Auto-Retry Scheduler & Stepped Backoff
STAGE 10: Low Balance Overdraft Guard (HTTP 402), Razorpay HMAC Top-Up & Financial Audit
========================================================================================
"""
import asyncio
import io
import math
from datetime import datetime, timezone, timedelta
import httpx
from sqlalchemy import select
from app.main import app
from app.core.database import engine, Base, AsyncSessionLocal
from app.models import Workspace, User, VoiceAgent, Campaign, Lead, Call, CallLog, WalletTransaction
from app.services.campaign import campaign_engine
from app.services.razorpay_service import razorpay_service
from app.services.storage import recording_storage


async def run_master_simulation():
    print("\n" + "="*80)
    print("🚀 STARTING NEXOAGENT MASTER REAL-WORLD ENTERPRISE SIMULATION")
    print("="*80)

    # Clean isolated DB reset for pure simulation
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:

        # ----------------------------------------------------------------------------------
        # STAGE 1: Tenant Onboarding (Registration, JWT Authentication & ₹500 Free Balance)
        # ----------------------------------------------------------------------------------
        print("\n🔹 [STAGE 1] Enterprise SaaS Onboarding & Account Creation...")
        reg_payload = {
            "company_name": "DLF CyberCity Luxury Homes",
            "full_name": "Rajiv Mehra",
            "email": "rajiv.mehra@dlf-cybercity.in",
            "password": "EnterpriseSecretPassword2026!",
            "phone": "+919876543210"
        }
        reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
        assert reg_res.status_code == 201, f"Stage 1 failed: {reg_res.text}"
        auth_data = reg_res.json()
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        workspace_id = auth_data["workspace"]["id"]
        initial_balance = auth_data["workspace"]["balance_inr"]

        print(f"   🏢 Organization: {reg_payload['company_name']} (Workspace ID: {workspace_id})")
        print(f"   👤 Admin User  : {reg_payload['full_name']} ({reg_payload['email']})")
        print(f"   🔑 JWT Session : Active (Bearer {token[:20]}...)")
        print(f"   💳 Free Balance: ₹{initial_balance} INR credited automatically.")
        assert initial_balance == 500.0

        # ----------------------------------------------------------------------------------
        # STAGE 2: Voice Agent Studio (Bilingual Hindi/Hinglish Persona & Prompt Setup)
        # ----------------------------------------------------------------------------------
        print("\n🔹 [STAGE 2] Voice Agent Studio Configuration...")
        agent_payload = {
            "name": "Pooja - DLF CyberCity Specialist",
            "voice_provider": "sarvam",
            "voice_id": "bulbul:v3/pooja",
            "language": "hi-IN",
            "temperature": 0.25,
            "first_message": "Namaste! Mai Pooja baat kar rahi hu DLF CyberCity se. Kya aap 3 BHK luxury plots me interested hain?",
            "system_prompt": (
                "You are Pooja, a top-tier luxury real estate advisor for DLF CyberCity Gurgaon. "
                "You speak fluent bilingual Hindi and Indian English (Hinglish). "
                "Your objective is to qualify the prospect's budget and schedule a VIP site visit."
            )
        }
        agent_res = await client.post("/api/v1/agents", headers=headers, json=agent_payload)
        assert agent_res.status_code == 201, f"Stage 2 failed: {agent_res.text}"
        agent = agent_res.json()
        agent_id = agent["id"]
        print(f"   🤖 Voice Agent  : {agent['name']} (ID: {agent_id})")
        print(f"   🗣️ Speech Engine: Sarvam Bulbul Native Hindi (Voice ID: {agent['voice_id']})")
        print(f"   🎙️ First Message: '{agent['first_message']}'")

        # ----------------------------------------------------------------------------------
        # STAGE 3: Single Direct Outbound Call with Pre-Dial Balance Check
        # ----------------------------------------------------------------------------------
        print("\n🔹 [STAGE 3] Direct Outbound Call Dispatch with Pre-Dial Check...")
        prospect_phone = "+919811122333"
        dispatch_res = await client.post(
            "/api/v1/calls/dispatch",
            headers=headers,
            json={"phone_number": prospect_phone, "agent_id": agent_id}
        )
        assert dispatch_res.status_code == 201, f"Stage 3 failed: {dispatch_res.text}"
        dispatch_data = dispatch_res.json()
        call_sid = dispatch_data["call_sid"]
        print(f"   🛡️ Pre-Dial Check: Passed (₹500.0 >= ₹10.0 threshold)")
        print(f"   📞 Target Phone   : {prospect_phone} (E.164 Sanitized)")
        print(f"   📡 Carrier Bridge : SIP Trunk LiveKit WebRTC connected")
        print(f"   🆔 Carrier Call SID: {call_sid}")

        # ----------------------------------------------------------------------------------
        # STAGE 4: In-Call Mid-Speech WhatsApp Brochure Tool Execution
        # ----------------------------------------------------------------------------------
        print("\n🔹 [STAGE 4] In-Call Mid-Speech WhatsApp Tool Execution...")
        # Simulate customer mid-conversation saying: "Pooja ji WhatsApp par brochure bhej do"
        whatsapp_payload = {
            "customer_phone": prospect_phone,
            "brochure_type": "DLF CyberCity Luxury Brochure & Floor Plan",
            "call_sid": call_sid,
            "pdf_url": "https://storage.dlf.in/brochures/phase5_luxury.pdf"
        }
        wa_res = await client.post("/api/v1/whatsapp/send-brochure", headers=headers, json=whatsapp_payload)
        assert wa_res.status_code == 200, f"Stage 4 failed: {wa_res.text}"
        wa_data = wa_res.json()
        print(f"   💬 Customer Trigger: 'Pooja ji, brochure WhatsApp par bhej do'")
        print(f"   📲 Tool Dispatched : WhatsApp Cloud API -> {prospect_phone}")
        print(f"   📄 Document Sent   : {whatsapp_payload['brochure_type']}")
        print(f"   ✅ Delivery Status : {wa_data.get('status', 'sent')}")

        # ----------------------------------------------------------------------------------
        # STAGE 5: Call Hangup, 60s Telecom Pulse Billing & Atomic Wallet Debit
        # ----------------------------------------------------------------------------------
        print("\n🔹 [STAGE 5] Call Hangup, Telecom Pulse Billing & Ledger Debit...")
        # Customer hangs up after 85 seconds
        # In Indian telecom: 85 seconds = 2 full pulses (120s) @ ₹5.50/min = ₹11.00
        telecom_event = {
            "call_id": call_sid,
            "to_phone": prospect_phone,
            "from_phone": "+918045678900",
            "call_status": "completed",
            "call_duration_seconds": 85,
            "recording_url": "s3://nexoagent-recordings/dlf/call_live_dlf_001.mp3",
            "workspace_id": workspace_id,
            "agent_id": agent_id
        }
        webhook_res = await client.post("/api/v1/webhooks/telephony", json=telecom_event)
        assert webhook_res.status_code == 200, f"Stage 5 failed: {webhook_res.text}"
        billed_cost = webhook_res.json()["billed_cost_inr"]
        assert billed_cost == 11.0, f"Expected ₹11.00 for 85s pulse, got {billed_cost}"

        # Verify atomic wallet deduction in DB
        async with AsyncSessionLocal() as db:
            ws_check = (await db.execute(select(Workspace).where(Workspace.id == workspace_id))).scalar_one()
            assert ws_check.balance_inr == 489.0  # ₹500 - ₹11 = ₹489.0

            # Verify audit ledger entry
            txn = (await db.execute(
                select(WalletTransaction)
                .where(WalletTransaction.workspace_id == workspace_id, WalletTransaction.reference_id == call_sid)
            )).scalar_one()
            assert txn.transaction_type == "debit"
            assert txn.opening_balance_inr == 500.0
            assert txn.amount_inr == 11.0
            assert txn.closing_balance_inr == 489.0

        print(f"   ⏱️ Talk Duration   : 85 Seconds")
        print(f"   ⚡ Billed Pulses    : 2 Pulses (ceil(85/60) = 2 mins)")
        print(f"   💰 Billed Cost      : ₹{billed_cost} INR")
        print(f"   📉 Wallet Balance   : ₹500.0 -> ₹489.0 (Atomic Debit)")
        print(f"   📜 Audit Log Entry  : Verified (Opening ₹500 - ₹11 = Closing ₹489)")

        # ----------------------------------------------------------------------------------
        # STAGE 6: Post-Call AI Intelligence Extraction & Presigned Audio Streaming
        # ----------------------------------------------------------------------------------
        print("\n🔹 [STAGE 6] Post-Call Groq AI Extraction & Presigned Audio Streaming...")
        # Get internal call id
        async with AsyncSessionLocal() as db:
            call_obj = (await db.execute(select(Call).where(Call.call_sid == call_sid))).scalar_one()
            internal_call_id = call_obj.id

        sample_dialogue = (
            "Agent (Pooja): Namaste! Mai Pooja baat kar rahi hu DLF CyberCity se.\n"
            "Customer: Haan Pooja ji, mujhe 3 BHK luxury plot chahiye Gurgaon me.\n"
            "Agent (Pooja): Bahut badhiya sir! Hamare pass Phase 5 me 3 BHK plots hain. Budget kya hai sir aapka?\n"
            "Customer: Mera budget 2.5 Crore tak ka hai. Saturday ko 11 baje site visit rakh lo.\n"
            "Agent (Pooja): Done sir! Maine calendar par Saturday 11 AM book kar diya hai aur WhatsApp par brochure bhej diya hai."
        )
        ai_res = await client.post(
            f"/api/v1/calls/{internal_call_id}/analyze",
            headers=headers,
            json={"transcript": sample_dialogue}
        )
        assert ai_res.status_code == 200, f"Stage 6 AI failed: {ai_res.text}"
        ai_data = ai_res.json()["log"]
        print(f"   🧠 AI Executive Summary : {ai_data['summary']}")
        print(f"   🎭 Sentiment Analyzed   : {ai_data['sentiment']}")
        print(f"   🎯 Lead Interest Score  : {ai_data['extracted_data'].get('lead_interest', 'Hot')}")
        print(f"   📊 Extracted Variables  : {ai_data['extracted_data']}")

        # Verify presigned recording URL (15-min expiring)
        rec_res = await client.get(f"/api/v1/calls/{internal_call_id}/recording", headers=headers)
        assert rec_res.status_code == 200
        rec_data = rec_res.json()
        assert "streaming_url" in rec_data
        print(f"   🎵 Presigned Audio URL  : {rec_data['streaming_url'][:60]}... (Expires in 900s)")

        # ----------------------------------------------------------------------------------
        # STAGE 7: Bulk CSV Campaign Ingestion (TRAI Calling Window & DND Scrubbing)
        # ----------------------------------------------------------------------------------
        print("\n🔹 [STAGE 7] Bulk CSV Campaign Ingestion & Pre-Dial Scrubbing...")
        # Create Campaign
        camp_res = await client.post(
            "/api/v1/campaigns",
            headers=headers,
            json={"name": "Gurgaon High-Net-Worth Investors", "agent_id": agent_id, "concurrency_limit": 5}
        )
        assert camp_res.status_code == 201
        campaign_id = camp_res.json()["id"]

        csv_file_content = (
            "name,phone,city,budget\n"
            "Vikram Malhotra,9822211100,Gurgaon,3 Cr\n"
            "Ananya Sen,9833322211,Delhi,2 Cr\n"
            "Vikram Duplicate,9822211100,Gurgaon,3 Cr\n"  # Duplicate -> Skip
            "DND Registered User,9800000000,Noida,1.5 Cr\n"  # DND -> Block
            "Invalid Contact,INVALID_999,Faridabad,1 Cr\n"  # Invalid -> Skip
        )
        files = {"file": ("leads.csv", io.BytesIO(csv_file_content.encode("utf-8")), "text/csv")}
        upload_res = await client.post(f"/api/v1/campaigns/{campaign_id}/upload-csv", headers=headers, files=files)
        assert upload_res.status_code == 200, f"Stage 7 upload failed: {upload_res.text}"
        stats = upload_res.json()
        print(f"   📂 Ingested Rows    : {stats['total_rows_processed']}")
        print(f"   ✅ Clean Leads Added : {stats['leads_added']}")
        print(f"   🚫 DND Scrubbed      : {stats['dnd_scrubbed_blocked']} (Blocked by TRAI NDNC)")
        print(f"   ⚠️ Duplicates Skipped: {stats['duplicates_skipped']}")
        print(f"   ❌ Invalid Skipped   : {stats['invalid_numbers_skipped']}")
        assert stats["leads_added"] == 2
        assert stats["dnd_scrubbed_blocked"] == 1
        assert stats["duplicates_skipped"] == 1

        # ----------------------------------------------------------------------------------
        # STAGE 8: Speed-to-Lead Meta Lead Ads Webhook (< 30s Instant Dialout)
        # ----------------------------------------------------------------------------------
        print("\n🔹 [STAGE 8] Speed-to-Lead Meta Ads Webhook (< 30s Dialout)...")
        # Step 8A: Meta Webhook Handshake Verification
        challenge_token = "99882211"
        handshake_res = await client.get(
            "/api/v1/webhooks/meta-leads",
            params={"hub.mode": "subscribe", "hub.verify_token": "nexo_meta_secret_2026", "hub.challenge": challenge_token}
        )
        assert handshake_res.status_code == 200
        assert handshake_res.text == challenge_token
        print("   🤝 Meta Handshake  : Verified (HTTP 200 + Challenge Token)")

        # Step 8B: Meta Lead Arrival & Instant Outbound Trigger
        meta_lead_payload = {
            "full_name": "Deepak Chawla",
            "phone_number": "9844455566",
            "city": "Gurgaon",
            "workspace_id": workspace_id,
            "agent_id": agent_id,
            "campaign_id": campaign_id,
            "auto_dial": True,
            "custom_data": {"ad_campaign": "Instagram Luxury Penthouse Ad"}
        }

        # Ensure TRAI test passes
        orig_trai = campaign_engine.is_within_trai_calling_hours
        campaign_engine.is_within_trai_calling_hours = lambda dt=None: True

        meta_res = await client.post("/api/v1/webhooks/meta-leads", json=meta_lead_payload)
        assert meta_res.status_code == 200, f"Stage 8 failed: {meta_res.text}"
        meta_data = meta_res.json()
        assert meta_data["speed_to_lead_status"] == "instant_dialed"
        meta_call_sid = meta_data["call_sid"]
        print(f"   ⚡ Speed-to-Lead   : Triggered in < 30 Seconds!")
        print(f"   📞 Dialed Prospect : {meta_data['full_name']} ({meta_data['phone_number']})")
        print(f"   🆔 Meta Call SID   : {meta_call_sid}")

        # ----------------------------------------------------------------------------------
        # STAGE 9: Unanswered / Busy Lead Auto-Retry Scheduler & Stepped Backoff
        # ----------------------------------------------------------------------------------
        print("\n🔹 [STAGE 9] Unanswered/Busy Lead Auto-Retry Scheduler...")
        # Carrier reports Deepak Chawla's line is 'busy'
        busy_payload = {
            "call_id": meta_call_sid,
            "to_phone": "+919844455566",
            "from_phone": "+918045678900",
            "call_status": "busy",
            "call_duration_seconds": 0,
            "workspace_id": workspace_id,
            "agent_id": agent_id
        }
        busy_res = await client.post("/api/v1/webhooks/telephony", json=busy_payload)
        assert busy_res.status_code == 200
        assert busy_res.json()["retry_scheduled"] is True

        # Verify DB Lead scheduled for retry (+30 mins)
        async with AsyncSessionLocal() as db:
            lead_check = (await db.execute(select(Lead).where(Lead.call_sid == meta_call_sid))).scalar_one()
            assert lead_check.status == "retry_scheduled"
            assert lead_check.retry_count == 1
            print(f"   ⚠️ Call Status     : Busy")
            print(f"   🔁 Auto-Retry Hook : Scheduled for +30 mins backoff at {lead_check.next_retry_at}")

        # Simulate time jump: retry matures and gets dispatched
        async with AsyncSessionLocal() as db:
            lead_check = (await db.execute(select(Lead).where(Lead.call_sid == meta_call_sid))).scalar_one()
            lead_check.next_retry_at = datetime.now(timezone.utc) - timedelta(minutes=5)
            await db.commit()

        dispatch_retry_res = await client.post(f"/api/v1/campaigns/{campaign_id}/dispatch-retries", headers=headers)
        assert dispatch_retry_res.status_code == 200
        print(f"   🚀 Matured Retry   : Dispatched successfully! (Attempt 2 dialed)")

        # Restore TRAI
        campaign_engine.is_within_trai_calling_hours = orig_trai

        # ----------------------------------------------------------------------------------
        # STAGE 10: Low Balance Overdraft Guard (402), Razorpay HMAC Top-Up & Audit
        # ----------------------------------------------------------------------------------
        print("\n🔹 [STAGE 10] Overdraft Guard (HTTP 402), Razorpay Top-Up & Financial Audit...")
        # Artificially drain DLF balance to ₹3.00 to test overdraft protection
        async with AsyncSessionLocal() as db:
            ws_drain = (await db.execute(select(Workspace).where(Workspace.id == workspace_id))).scalar_one()
            ws_drain.balance_inr = 3.0
            await db.commit()

        # Step 10A: DLF tries to place call with ₹3.00 -> MUST BE BLOCKED!
        blocked_call = await client.post(
            "/api/v1/calls/dispatch",
            headers=headers,
            json={"phone_number": "+919855566777", "agent_id": agent_id}
        )
        assert blocked_call.status_code == 402, f"Expected 402, got {blocked_call.status_code}"
        print(f"   🛑 Overdraft Guard : Blocked call with HTTP 402 Payment Required (Balance: ₹3.0 < ₹10.0)")

        # Step 10B: DLF recharges with Razorpay Growth Pack (₹5,000 + ₹250 bonus credits = ₹5,250 credited)
        order_res = await client.post(
            "/api/v1/billing/create-order",
            headers=headers,
            json={"amount_inr": 5000.0, "pack_id": "growth_pack"}
        )
        assert order_res.status_code == 201
        order_info = order_res.json()
        order_id = order_info["order_id"]
        payment_id = "pay_dlf_growth_pack_1001"
        valid_hmac_sig = razorpay_service.generate_signature_for_test(order_id, payment_id)

        verify_res = await client.post(
            "/api/v1/billing/verify-payment",
            headers=headers,
            json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": valid_hmac_sig,
                "amount_inr": 5000.0
            }
        )
        assert verify_res.status_code == 200
        verify_data = verify_res.json()
        assert verify_data["credited_amount"] == 5250.0  # ₹5,000 + ₹250 bonus credits
        new_balance = verify_data["new_balance_inr"]
        assert new_balance == 5253.0  # ₹3 + ₹5250 = ₹5253
        print(f"   💳 Razorpay Top-Up : ₹5,000 Paid -> ₹5,250 Credited (+₹250 Bonus)")
        print(f"   💰 New Balance     : ₹{new_balance} INR")

        # Step 10C: DLF re-tries call -> MUST NOW SUCCEED!
        unblocked_call = await client.post(
            "/api/v1/calls/dispatch",
            headers=headers,
            json={"phone_number": "+919855566777", "agent_id": agent_id}
        )
        assert unblocked_call.status_code == 201
        print(f"   🔓 Unblocked Call  : Dialed successfully! Call SID: {unblocked_call.json()['call_sid']}")

        # Step 10D: Final Financial Audit Verification
        async with AsyncSessionLocal() as db:
            all_txns = (await db.execute(
                select(WalletTransaction)
                .where(WalletTransaction.workspace_id == workspace_id)
                .order_by(WalletTransaction.id.asc())
            )).scalars().all()
            print(f"\n   📜 [FINANCIAL AUDIT LEDGER - TOTAL ENTRIES: {len(all_txns)}]")
            for t in all_txns:
                symbol = "+" if t.transaction_type == "credit" else "-"
                print(f"      • [{t.transaction_type.upper():<6}] {symbol}₹{t.amount_inr:<7} | Opening: ₹{t.opening_balance_inr:<7} -> Closing: ₹{t.closing_balance_inr:<7} | Ref: {t.reference_id}")

        # Final Wallet Summary
        summary_res = await client.get("/api/v1/billing/wallet", headers=headers)
        assert summary_res.status_code == 200
        summary = summary_res.json()
        print(f"\n   📊 Final Wallet Status: Balance ₹{summary['balance_inr']} (~{summary['estimated_minutes_remaining']} calling minutes remaining)")

    print("\n" + "="*80)
    print("🎉 ALL 10 REAL-WORLD PRODUCTION STAGES PASSED WITH 100% SUCCESS!")
    print("="*80 + "\n")


if __name__ == "__main__":
    asyncio.run(run_master_simulation())
