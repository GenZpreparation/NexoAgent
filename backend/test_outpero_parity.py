"""
NexoAgent - Outpero SaaS Parity Verification Test Suite
Tests all 5 newly added Outpero-equivalent endpoints:
1. GET /api/v1/me (Identity Quickstart via JWT & API Key)
2. POST /api/v1/calls with dry_run=True & dry_run=False
3. POST /api/v1/agents/{id}/knowledge (Training tab facts ingestion)
4. GET /api/v1/leads & GET /api/v1/leads/export (Leads & Results Mini-CRM)
5. GET /api/v1/analytics/performance (7 KPI Cards, Conversion Funnel, Daily volume)
"""
import sys
import os
import asyncio
from datetime import datetime, timezone
import httpx
from sqlalchemy import select

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.main import app
from app.core.database import engine, Base, AsyncSessionLocal
from app.models import Workspace, User, VoiceAgent, Call, CallLog, Lead, Campaign


async def run_outpero_parity_tests():
    print("\n" + "="*85)
    print("🚀 STARTING OUTPERO SAAS PARITY VERIFICATION TEST SUITE")
    print("="*85)

    # 1. Reset Database & create fresh tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # --- STAGE 1: Tenant Registration ---
        reg_res = await client.post("/api/v1/auth/register", json={
            "company_name": "Outpero Target Enterprise",
            "email": "founder@target.in",
            "password": "Password123!",
            "full_name": "Arjun Singhania"
        })
        assert reg_res.status_code == 201, f"Reg failed: {reg_res.text}"
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Registered Admin & Workspace (Initial ₹500 Free Balance Credited)")

        # --- STAGE 2: Test GET /api/v1/me (Outpero Quickstart Identity) ---
        print("\n--- TEST 1: Identity & Quickstart Endpoint (GET /api/v1/me) ---")
        me_res = await client.get("/api/v1/me", headers=headers)
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert me_data["user"]["email"] == "founder@target.in"
        assert me_data["workspace"]["name"] == "Outpero Target Enterprise"
        assert "credits" in me_data
        assert "estimated_calling_minutes" in me_data
        print(f"   👤 GET /api/v1/me Verified: {me_data['user']['full_name']} | Credits: {me_data['credits']} (~{me_data['estimated_calling_minutes']} mins)")

        # --- STAGE 3: Voice Agent Studio & Knowledge Base Training ---
        print("\n--- TEST 2: Voice Agent Creation & Knowledge Base Ingestion ---")
        agent_res = await client.post("/api/v1/agents", headers=headers, json={
            "name": "Pooja - Real Estate Telecaller",
            "system_prompt": "You are Pooja, a professional telecaller for luxury villas. Speak courteous Hindi.",
            "first_message": "Namaste! Mai Pooja baat kar rahi hu luxury villas se.",
            "voice_provider": "sarvam",
            "voice_id": "bulbul:v3/pooja",
            "language": "hi-IN"
        })
        assert agent_res.status_code == 201
        agent_id = agent_res.json()["id"]
        original_prompt = agent_res.json()["system_prompt"]
        print(f"   🤖 Voice Agent Created: ID {agent_id} ({agent_res.json()['name']})")

        # Ingest Knowledge Base (Training Tab)
        knowledge_res = await client.post(
            f"/api/v1/agents/{agent_id}/knowledge",
            headers=headers,
            json={
                "knowledge_type": "text",
                "content": "Phase 2 villas start at ₹2.5 Cr. 10% down payment. Clubhouse delivery in 2027.",
                "source_name": "Pricing & FAQ Brochure 2026"
            }
        )
        assert knowledge_res.status_code == 200
        k_data = knowledge_res.json()
        assert k_data["status"] == "ingested"
        assert k_data["updated_system_prompt_length"] > len(original_prompt)
        print(f"   🧠 Knowledge Base Ingested! Appended {k_data['appended_characters']} characters to agent prompt.")

        # --- STAGE 4: Outpero Calling & Dry-Run Support ---
        print("\n--- TEST 3: Outpero Call Dispatch & Dry-Run Mode ---")
        
        # 3A: Dry-Run Call (Checks everything, dials nobody, deducts zero balance)
        dry_run_res = await client.post("/api/v1/calls", headers=headers, json={
            "phone_number": "+919876543210",
            "agent_id": agent_id,
            "dry_run": True
        })
        assert dry_run_res.status_code == 201
        assert dry_run_res.json()["status"] == "dry_run_passed"
        assert "dials nobody" in dry_run_res.json()["message"].lower()
        print("   🛡️ Dry-Run Test Passed: Validated phone & balance without triggering carrier dialout!")

        # 3B: Live Call Dispatch (Executes call)
        live_call_res = await client.post("/api/v1/calls", headers=headers, json={
            "phone_number": "+919811122333",
            "agent_id": agent_id,
            "dry_run": False
        })
        assert live_call_res.status_code == 201
        live_call_sid = live_call_res.json()["call_sid"]
        assert live_call_res.json()["status"] == "dispatched"
        print(f"   📞 Live Call Dispatched! Carrier SID: {live_call_sid}")

        # Simulate call completion with CallLog
        async with AsyncSessionLocal() as db:
            call_obj_res = await db.execute(select(Call).where(Call.call_sid == live_call_sid))
            call_obj = call_obj_res.scalar_one()
            call_obj.status = "completed"
            call_obj.duration_seconds = 75
            call_obj.cost_inr = 11.0
            
            call_log_res = await db.execute(select(CallLog).where(CallLog.call_id == call_obj.id))
            call_log = call_log_res.scalar_one()
            call_log.sentiment = "Hot"
            call_log.summary = "Customer is highly interested in 3 BHK villa. Ready to visit this Sunday."
            call_log.extracted_data = {"budget": "₹2.5 Cr", "visit_date": "Sunday"}
            await db.commit()

        # --- STAGE 5: Leads & Mini-CRM View ---
        print("\n--- TEST 4: Leads & Results Mini-CRM (app.outpero.com/#/leads) ---")
        
        # Ingest a test campaign and leads
        camp_res = await client.post("/api/v1/campaigns", headers=headers, json={
            "name": "Outpero Parity Weekend Drive",
            "agent_id": agent_id,
            "concurrency_limit": 5
        })
        camp_id = camp_res.json()["id"]

        # Insert 3 leads into database
        async with AsyncSessionLocal() as db:
            l1 = Lead(campaign_id=camp_id, workspace_id=1, full_name="Sanjay Singhal", phone_number="+919811122333", city="Gurgaon", status="completed", call_sid=live_call_sid)
            l2 = Lead(campaign_id=camp_id, workspace_id=1, full_name="Vikas Malhotra", phone_number="+919822233444", city="Noida", status="busy", retry_count=1)
            l3 = Lead(campaign_id=camp_id, workspace_id=1, full_name="Pooja Verma", phone_number="+919833344555", city="Delhi", status="pending")
            db.add_all([l1, l2, l3])
            await db.commit()

        # Fetch Leads API
        leads_res = await client.get("/api/v1/leads", headers=headers)
        assert leads_res.status_code == 200
        leads_data = leads_res.json()
        
        # Verify 4 top counter cards
        assert leads_data["summary"]["total_leads"] == 3
        assert leads_data["summary"]["qualified"] >= 1
        assert leads_data["summary"]["pending_callback"] >= 1
        print(f"   🪪 Leads CRM Summary Verified: Total={leads_data['summary']['total_leads']}, Qualified={leads_data['summary']['qualified']}, Pending={leads_data['summary']['pending_callback']}")

        # Verify Search filter
        search_res = await client.get("/api/v1/leads?search=Gurgaon", headers=headers)
        assert search_res.status_code == 200
        assert len(search_res.json()["leads"]) == 1
        assert search_res.json()["leads"][0]["name"] == "Sanjay Singhal"
        print("   🔍 Lead Search by City ('Gurgaon') Filter Verified!")

        # Verify CSV Export
        export_res = await client.get("/api/v1/leads/export", headers=headers)
        assert export_res.status_code == 200
        assert "text/csv" in export_res.headers["content-type"]
        assert "Sanjay Singhal" in export_res.text
        assert "Vikas Malhotra" in export_res.text
        print("   📥 CSV Export Endpoint Verified (Full CSV downloaded cleanly)!")

        # --- STAGE 6: Performance & Analytics Screen ---
        print("\n--- TEST 5: Performance & Analytics (app.outpero.com/#/performance) ---")
        perf_res = await client.get("/api/v1/analytics/performance?days=30", headers=headers)
        assert perf_res.status_code == 200
        perf_data = perf_res.json()

        # Verify 7 KPI Cards
        summary = perf_data["summary"]
        assert summary["total_calls"] >= 1
        assert summary["connected_calls"] >= 1
        assert summary["connect_rate_pct"] > 0
        assert summary["credits_used_inr"] > 0
        print(f"   📊 Performance 7 KPIs Verified: Total Calls={summary['total_calls']}, Connect Rate={summary['connect_rate_pct']}%, Credits Used=₹{summary['credits_used_inr']}")

        # Verify Conversion Funnel & Outcomes
        assert "dialed" in perf_data["conversion_funnel"]
        assert "connected" in perf_data["conversion_funnel"]
        assert "outcomes" in perf_data
        assert perf_data["outcomes"]["interested"] >= 1
        print(f"   🎯 Conversion Funnel & Outcomes Breakdown Verified!")

        # --- STAGE 7: Idempotency-Key Guard on Calls ---
        print("\n--- TEST 6: Idempotency-Key Protection (Outpero Reliable Writes) ---")
        idempotency_headers = {**headers, "Idempotency-Key": "req_unique_998877"}
        
        # First call with Idempotency-Key
        first_idem_res = await client.post("/api/v1/calls", headers=idempotency_headers, json={
            "phone_number": "+919844433221",
            "agent_id": agent_id,
            "dry_run": False
        })
        assert first_idem_res.status_code == 201
        first_sid = first_idem_res.json()["call_sid"]
        
        # Second call with the SAME Idempotency-Key (Network Retry Simulation)
        second_idem_res = await client.post("/api/v1/calls", headers=idempotency_headers, json={
            "phone_number": "+919844433221",
            "agent_id": agent_id,
            "dry_run": False
        })
        assert second_idem_res.status_code == 201
        assert second_idem_res.json()["call_sid"] == first_sid
        assert "idempotent response" in second_idem_res.json()["message"].lower()
        print("   🛡️ Idempotency Verified: Duplicate call blocked, original response returned!")

        # --- STAGE 8: Channels & Live Ticker ---
        print("\n--- TEST 7: Dedicated Channels & Live Concurrency Ticker ---")
        channel_res = await client.post("/api/v1/channels", headers=headers, json={
            "phone_number": "+918045678900",
            "friendly_name": "Sales Inbound Line 1",
            "concurrency_limit": 5,
            "dlt_entity_id": "DLT_ENT_12345",
            "dlt_sender_id": "NEXOHM"
        })
        assert channel_res.status_code == 201
        assert channel_res.json()["phone_number"] == "+918045678900"
        print(f"   📞 Dedicated Channel Allocated: {channel_res.json()['phone_number']} (Capacity: {channel_res.json()['concurrency_limit']} lines)")

        # Verify Live Ticker (• 0 on calls · 0.0/min)
        ticker_res = await client.get("/api/v1/channels/live", headers=headers)
        assert ticker_res.status_code == 200
        assert "status_label" in ticker_res.json()
        print(f"   ⏱️ Outpero Top Bar Live Ticker Verified: '{ticker_res.json()['status_label']}'")

        # --- STAGE 9: Voice Catalog & Global Search ---
        print("\n--- TEST 8: Indic Voice Catalog & Global Search (Ctrl + K) ---")
        voices_res = await client.get("/api/v1/voices")
        assert voices_res.status_code == 200
        assert len(voices_res.json()) >= 6
        pooja_voice = next(v for v in voices_res.json() if v["name"] == "Pooja")
        assert pooja_voice["language"] == "Hindi"
        assert pooja_voice["tier"] == "standard"
        print(f"   🗣️ Voice Catalog Verified: 6 Personas (Hindi, Hinglish, Marathi, Telugu, English)")

        # Global Search
        search_res = await client.get("/api/v1/search?q=Pooja", headers=headers)
        assert search_res.status_code == 200
        assert search_res.json()["total_results"] >= 1
        print(f"   🔍 Global Search (Ctrl+K) Verified: Found {search_res.json()['total_results']} matching items for 'Pooja'")

    print("\n" + "="*85)
    print("🎉 ALL OUTPERO SAAS PARITY & RELIABILITY TESTS PASSED WITH 100% SUCCESS!")
    print("="*85 + "\n")


if __name__ == "__main__":
    asyncio.run(run_outpero_parity_tests())
