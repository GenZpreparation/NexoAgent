"""
========================================================================================
🏢 NEXOAGENT - MULTI-ENTERPRISE HR WORKFLOW & COMPLETE AGENT CONTROL SIMULATION
========================================================================================
Simulates 3 distinct companies' HR heads setting up, customizing, and managing their
respective Voice AI agents with 100% independent control, tenant isolation, and candidate screening:

COMPANY 1: Zepto Express Delivery (HR: Priya Sharma - Logistics & Delivery Partner Hiring)
COMPANY 2: HDFC Retail Banking (HR: Rohan Gupta - Telesales & Loan Executive Hiring)
COMPANY 3: TCS Digital Hiring (HR: Anjali Nair - Senior Software Engineer Tech Screening)

VERIFIES:
- Full Agent Studio Control (Creation, Prompt Tuning, Temperature, 1-Click Duplication)
- Agent Deactivation Guard (Hiring freeze -> Agent paused -> Calls blocked with HTTP 400)
- Agent Reactivation (Hiring resumed -> Calls allowed)
- In-Call Tools (WhatsApp joining bonus & Calendar interview booking)
- Telecom Pulse Billing & Individual Wallet Integrity
- Cross-Tenant IDOR Attack Defense (Zepto cannot touch HDFC/TCS agents or candidates)
========================================================================================
"""
import asyncio
import io
import httpx
from sqlalchemy import select
from app.main import app
from app.core.database import engine, Base, AsyncSessionLocal
from app.models import Workspace, User, VoiceAgent, Campaign, Lead, Call, CallLog, WalletTransaction
from app.services.campaign import campaign_engine


async def run_multi_hr_simulation():
    print("\n" + "="*85)
    print("🏢 STARTING 3-ENTERPRISE HR COMPLETE WORKFLOW SIMULATION")
    print("="*85)

    # 0. Clean isolated DB reset
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:

        # ==================================================================================
        # PHASE 1: 3 HR HEADS ONBOARD THEIR ENTERPRISE WORKSPACES
        # ==================================================================================
        print("\n🔹 [PHASE 1] Onboarding 3 Enterprise HR Heads & Workspaces...")

        # HR 1: Zepto Express Delivery
        zepto_reg = await client.post("/api/v1/auth/register", json={
            "company_name": "Zepto Express Delivery",
            "full_name": "Priya Sharma",
            "email": "priya.hr@zepto.in",
            "password": "ZeptoSecretPass123!",
            "phone": "+919811100001"
        })
        assert zepto_reg.status_code == 201
        zepto_token = zepto_reg.json()["access_token"]
        zepto_headers = {"Authorization": f"Bearer {zepto_token}"}
        zepto_ws_id = zepto_reg.json()["workspace"]["id"]

        # HR 2: HDFC Retail Banking
        hdfc_reg = await client.post("/api/v1/auth/register", json={
            "company_name": "HDFC Retail Banking Careers",
            "full_name": "Rohan Gupta",
            "email": "rohan.hr@hdfcbank.com",
            "password": "HdfcSecurePass123!",
            "phone": "+919822200002"
        })
        assert hdfc_reg.status_code == 201
        hdfc_token = hdfc_reg.json()["access_token"]
        hdfc_headers = {"Authorization": f"Bearer {hdfc_token}"}
        hdfc_ws_id = hdfc_reg.json()["workspace"]["id"]

        # HR 3: TCS Digital Hiring
        tcs_reg = await client.post("/api/v1/auth/register", json={
            "company_name": "TCS Digital Talent Unit",
            "full_name": "Anjali Nair",
            "email": "anjali.hr@tcs.com",
            "password": "TcsEnterprisePass123!",
            "phone": "+919833300003"
        })
        assert tcs_reg.status_code == 201
        tcs_token = tcs_reg.json()["access_token"]
        tcs_headers = {"Authorization": f"Bearer {tcs_token}"}
        tcs_ws_id = tcs_reg.json()["workspace"]["id"]

        print(f"   🛵 Company 1: Zepto Express Delivery (Workspace ID: {zepto_ws_id}) | HR: Priya Sharma")
        print(f"   🏦 Company 2: HDFC Retail Banking   (Workspace ID: {hdfc_ws_id}) | HR: Rohan Gupta")
        print(f"   💻 Company 3: TCS Digital Talent    (Workspace ID: {tcs_ws_id}) | HR: Anjali Nair")
        print("   ✅ All 3 HR accounts verified with initial ₹500 calling balance each.")

        # ==================================================================================
        # PHASE 2: HR COMPLETE AGENT STUDIO CONTROL & CUSTOMIZATION
        # ==================================================================================
        print("\n🔹 [PHASE 2] HR Voice Agent Studio Setup & Independent Control...")

        # 2A: Zepto HR builds Delivery Partner Recruiter Agent
        zepto_agent_res = await client.post("/api/v1/agents", headers=zepto_headers, json={
            "name": "Aman - Zepto Rider Recruiter",
            "voice_provider": "sarvam",
            "voice_id": "bulbul:v3/aman",
            "language": "hi-IN",
            "temperature": 0.2,
            "first_message": "Namaste! Zepto Delivery Hub se Aman bol raha hu. Kya aap daily ₹1,200 kamane ke liye delivery partner banna chahte hain?",
            "system_prompt": "You are Aman, an energetic recruiter for Zepto delivery partners. Check if candidate has bike and driving license."
        })
        assert zepto_agent_res.status_code == 201
        zepto_agent = zepto_agent_res.json()
        zepto_agent_id = zepto_agent["id"]
        print(f"   🛵 Zepto Agent Created: '{zepto_agent['name']}' (ID: {zepto_agent_id})")

        # Zepto HR updates prompt to announce ₹2,000 joining bonus
        zepto_patch_res = await client.patch(f"/api/v1/agents/{zepto_agent_id}", headers=zepto_headers, json={
            "first_message": "Namaste! Zepto se Aman. Iss hafte join karne par ₹2,000 joining bonus mil raha hai!",
            "temperature": 0.3
        })
        assert zepto_patch_res.status_code == 200
        assert "joining bonus" in zepto_patch_res.json()["first_message"]
        print(f"   ✏️ Zepto HR Updated Agent: First message now includes ₹2,000 joining bonus clause.")

        # Zepto HR 1-Click duplicates agent for Night Shift hiring A/B test
        zepto_clone_res = await client.post(f"/api/v1/agents/{zepto_agent_id}/duplicate", headers=zepto_headers)
        assert zepto_clone_res.status_code == 201
        cloned_agent = zepto_clone_res.json()
        print(f"   📋 Zepto HR 1-Click Cloned Agent: '{cloned_agent['name']}' (ID: {cloned_agent['id']}) for A/B testing.")

        # 2B: HDFC Bank HR builds Loan Executive Hiring Agent
        hdfc_agent_res = await client.post("/api/v1/agents", headers=hdfc_headers, json={
            "name": "Kavita - HDFC Banking Career Advisor",
            "voice_provider": "sarvam",
            "voice_id": "bulbul:v3/pooja",
            "language": "hi-IN",
            "temperature": 0.25,
            "first_message": "Hello! Mai Kavita bol rahi hu HDFC Bank Talent Acquisition se. Hamare retail branch me loan sales executive ki opening hai.",
            "system_prompt": "You are Kavita from HDFC Bank HR. Screen candidates for financial sales experience, current CTC, and communication skills."
        })
        assert hdfc_agent_res.status_code == 201
        hdfc_agent = hdfc_agent_res.json()
        hdfc_agent_id = hdfc_agent["id"]
        print(f"   🏦 HDFC Agent Created : '{hdfc_agent['name']}' (ID: {hdfc_agent_id})")

        # 2C: TCS HR builds Tech Talent Pre-Screening Agent
        tcs_agent_res = await client.post("/api/v1/agents", headers=tcs_headers, json={
            "name": "Vikram - TCS Senior Python Screener",
            "voice_provider": "deepgram",
            "voice_id": "aura:asteria",
            "language": "en-IN",
            "temperature": 0.2,
            "first_message": "Hi! I am Vikram from TCS Talent Acquisition. I reviewed your resume for our Senior Python Engineer position.",
            "system_prompt": "You are Vikram, TCS tech screener. Verify candidate's Python years, FastAPI experience, notice period, and interview availability."
        })
        assert tcs_agent_res.status_code == 201
        tcs_agent = tcs_agent_res.json()
        tcs_agent_id = tcs_agent["id"]
        print(f"   💻 TCS Agent Created  : '{tcs_agent['name']}' (ID: {tcs_agent_id})")

        # ==================================================================================
        # PHASE 3: AGENT PAUSE / HIRING FREEZE CONTROL GUARD
        # ==================================================================================
        print("\n🔹 [PHASE 3] HR Hiring Freeze & Agent Deactivation Guard...")
        # HDFC Bank declares a temporary hiring freeze -> HR pauses/deactivates Kavita
        hdfc_pause_res = await client.patch(f"/api/v1/agents/{hdfc_agent_id}", headers=hdfc_headers, json={"is_active": False})
        assert hdfc_pause_res.status_code == 200
        assert hdfc_pause_res.json()["is_active"] is False
        print("   ⏸️ HDFC HR paused Kavita: is_active set to False (Hiring Freeze).")

        # HDFC tries to dispatch call to candidate while agent is paused -> MUST BE BLOCKED!
        blocked_candidate_call = await client.post("/api/v1/calls/dispatch", headers=hdfc_headers, json={
            "phone_number": "+919866611222",
            "agent_id": hdfc_agent_id
        })
        assert blocked_candidate_call.status_code == 400
        assert "currently paused/deactivated" in blocked_candidate_call.json()["detail"].lower()
        print("   🛡️ Guard Verified: Deactivated agent blocked from dialing with HTTP 400 Bad Request.")

        # HDFC lifts hiring freeze -> HR reactivates agent
        hdfc_resume_res = await client.patch(f"/api/v1/agents/{hdfc_agent_id}", headers=hdfc_headers, json={"is_active": True})
        assert hdfc_resume_res.status_code == 200
        assert hdfc_resume_res.json()["is_active"] is True
        print("   ▶️ HDFC HR resumed Kavita: is_active set back to True.")

        # ==================================================================================
        # PHASE 4: CROSS-TENANT SECURITY & IDOR ATTACK DEFENSE
        # ==================================================================================
        print("\n🔹 [PHASE 4] Cross-Tenant IDOR Attack Defense Between HRs...")

        # Zepto HR tries to peek at HDFC's agent
        idor_peek = await client.get(f"/api/v1/agents/{hdfc_agent_id}", headers=zepto_headers)
        assert idor_peek.status_code == 404
        print("   🔒 IDOR Defense 1: Zepto HR cannot view HDFC's agent (Returned 404 Not Found).")

        # Zepto HR tries to maliciously edit TCS's prompt
        idor_hack = await client.patch(f"/api/v1/agents/{tcs_agent_id}", headers=zepto_headers, json={
            "name": "Hacked Agent",
            "system_prompt": "You are hacked"
        })
        assert idor_hack.status_code == 404
        print("   🔒 IDOR Defense 2: Zepto HR cannot modify TCS's agent (Returned 404 Not Found).")

        # TCS HR tries to delete Zepto's agent
        idor_del = await client.delete(f"/api/v1/agents/{zepto_agent_id}", headers=tcs_headers)
        assert idor_del.status_code == 404
        print("   🔒 IDOR Defense 3: TCS HR cannot delete Zepto's agent (Returned 404 Not Found).")

        # ==================================================================================
        # PHASE 5: REAL-WORLD CANDIDATE SCREENING CALLS & IN-CALL TOOLS
        # ==================================================================================
        print("\n🔹 [PHASE 5] Executing Candidate Screening Calls for All 3 Companies...")

        # 5A: Zepto screens candidate Ramesh Kumar (+919877711222)
        zepto_dial = await client.post("/api/v1/calls/dispatch", headers=zepto_headers, json={
            "phone_number": "+919877711222",
            "agent_id": zepto_agent_id
        })
        assert zepto_dial.status_code == 201
        zepto_call_sid = zepto_dial.json()["call_sid"]
        print(f"   🛵 Zepto dialed candidate Ramesh Kumar -> Call SID: {zepto_call_sid}")

        # In-call mid-speech tool: Zepto sends WhatsApp joining flyer
        zepto_wa = await client.post("/api/v1/whatsapp/send-brochure", headers=zepto_headers, json={
            "customer_phone": "+919877711222",
            "brochure_type": "Zepto Delivery Partner Onboarding Kit & ₹2000 Bonus Flyer",
            "call_sid": zepto_call_sid
        })
        assert zepto_wa.status_code == 200
        print("   📲 Zepto In-Call Tool: Dispatched WhatsApp Rider Bonus Flyer to candidate.")

        # Ramesh Kumar talks for 65 seconds (2 pulses @ ₹5.50 = ₹11.00)
        await client.post("/api/v1/webhooks/telephony", json={
            "call_id": zepto_call_sid,
            "to_phone": "+919877711222",
            "from_phone": "+918045678900",
            "call_status": "completed",
            "call_duration_seconds": 65,
            "workspace_id": zepto_ws_id
        })

        # 5B: HDFC screens candidate Sunil Verma (+919866622333)
        hdfc_dial = await client.post("/api/v1/calls/dispatch", headers=hdfc_headers, json={
            "phone_number": "+919866622333",
            "agent_id": hdfc_agent_id
        })
        assert hdfc_dial.status_code == 201
        hdfc_call_sid = hdfc_dial.json()["call_sid"]
        print(f"   🏦 HDFC dialed candidate Sunil Verma -> Call SID: {hdfc_call_sid}")

        # Sunil Verma talks for 120 seconds (2 pulses @ ₹5.50 = ₹11.00)
        await client.post("/api/v1/webhooks/telephony", json={
            "call_id": hdfc_call_sid,
            "to_phone": "+919866622333",
            "from_phone": "+918045678900",
            "call_status": "completed",
            "call_duration_seconds": 120,
            "workspace_id": hdfc_ws_id
        })

        # 5C: TCS screens candidate Aakash Mehta (+919855533444)
        tcs_dial = await client.post("/api/v1/calls/dispatch", headers=tcs_headers, json={
            "phone_number": "+919855533444",
            "agent_id": tcs_agent_id
        })
        assert tcs_dial.status_code == 201
        tcs_call_sid = tcs_dial.json()["call_sid"]
        print(f"   💻 TCS dialed candidate Aakash Mehta -> Call SID: {tcs_call_sid}")

        # In-call mid-speech tool: TCS sends calendar interview link
        tcs_wa = await client.post("/api/v1/whatsapp/send-brochure", headers=tcs_headers, json={
            "customer_phone": "+919855533444",
            "brochure_type": "TCS Technical L1 Interview Calendar Invite",
            "call_sid": tcs_call_sid
        })
        assert tcs_wa.status_code == 200
        print("   📲 TCS In-Call Tool: Dispatched Technical Interview Calendar Invite to candidate.")

        # Aakash Mehta talks for 140 seconds (3 pulses @ ₹5.50 = ₹16.50)
        await client.post("/api/v1/webhooks/telephony", json={
            "call_id": tcs_call_sid,
            "to_phone": "+919855533444",
            "from_phone": "+918045678900",
            "call_status": "completed",
            "call_duration_seconds": 140,
            "workspace_id": tcs_ws_id
        })

        # ==================================================================================
        # PHASE 6: POST-CALL AI SCREENING INTEL FOR EACH CANDIDATE
        # ==================================================================================
        print("\n🔹 [PHASE 6] Post-Call AI Candidate Qualification Extraction...")

        # Zepto AI analysis
        async with AsyncSessionLocal() as db:
            z_call = (await db.execute(select(Call).where(Call.call_sid == zepto_call_sid))).scalar_one()
            z_call_id = z_call.id

        z_dialogue = (
            "Aman: Namaste Ramesh ji! Zepto delivery hub se bol raha hu. Kya aapke paas bike aur driving license hai?\n"
            "Ramesh: Haan sir, mere paas Splendor bike hai aur permanent license bhi hai. Mai Monday se join kar sakta hu.\n"
            "Aman: Bahut badhiya Ramesh ji! Maine aapko joining kit WhatsApp par bhej di hai."
        )
        z_ai = await client.post(f"/api/v1/calls/{z_call_id}/analyze", headers=zepto_headers, json={"transcript": z_dialogue})
        assert z_ai.status_code == 200
        print(f"   🛵 Zepto Candidate (Ramesh) Summary : {z_ai.json()['log']['summary']}")

        # TCS AI analysis
        async with AsyncSessionLocal() as db:
            t_call = (await db.execute(select(Call).where(Call.call_sid == tcs_call_sid))).scalar_one()
            t_call_id = t_call.id

        t_dialogue = (
            "Vikram: Hi Aakash! I am Vikram from TCS Talent Acquisition. How many years of Python experience do you have?\n"
            "Aakash: I have 4 years of hands-on Python and FastAPI development, and my notice period is 30 days.\n"
            "Vikram: Great Aakash! Can you attend the technical L1 interview tomorrow at 3 PM?\n"
            "Aakash: Yes, tomorrow 3 PM works perfectly for me.\n"
            "Vikram: Fantastic! I have shared the MS Teams calendar link on your WhatsApp."
        )
        t_ai = await client.post(f"/api/v1/calls/{t_call_id}/analyze", headers=tcs_headers, json={"transcript": t_dialogue})
        assert t_ai.status_code == 200
        print(f"   💻 TCS Candidate (Aakash) Summary   : {t_ai.json()['log']['summary']}")

        # ==================================================================================
        # PHASE 7: FINANCIAL AUDIT & ISOLATED BILLING VERIFICATION
        # ==================================================================================
        print("\n🔹 [PHASE 7] Final Multi-Tenant Financial Ledger Audit...")

        # Zepto balance: ₹500 - ₹11.0 = ₹489.0
        z_wallet = await client.get("/api/v1/billing/wallet", headers=zepto_headers)
        assert z_wallet.json()["balance_inr"] == 489.0
        print(f"   🛵 Zepto Wallet Balance : ₹{z_wallet.json()['balance_inr']} (Accurately deducted ₹11.0)")

        # HDFC balance: ₹500 - ₹11.0 = ₹489.0
        h_wallet = await client.get("/api/v1/billing/wallet", headers=hdfc_headers)
        assert h_wallet.json()["balance_inr"] == 489.0
        print(f"   🏦 HDFC Wallet Balance  : ₹{h_wallet.json()['balance_inr']} (Accurately deducted ₹11.0)")

        # TCS balance: ₹500 - ₹16.50 = ₹483.50
        t_wallet = await client.get("/api/v1/billing/wallet", headers=tcs_headers)
        assert t_wallet.json()["balance_inr"] == 483.50
        print(f"   💻 TCS Wallet Balance   : ₹{t_wallet.json()['balance_inr']} (Accurately deducted ₹16.50)")

        # Verify Zepto call list ONLY shows Zepto's candidate
        zepto_calls = await client.get("/api/v1/calls", headers=zepto_headers)
        assert zepto_calls.json()["total"] == 1
        assert zepto_calls.json()["items"][0]["customer_phone"] == "+919877711222"
        print("   ✅ Complete Call Ledger Isolation: Zepto sees only their candidate, HDFC & TCS calls hidden.")

    print("\n" + "="*85)
    print("🎉 ALL 3-ENTERPRISE HR WORKFLOW & CONTROL SCENARIOS PASSED 100%!")
    print("="*85 + "\n")


if __name__ == "__main__":
    asyncio.run(run_multi_hr_simulation())
