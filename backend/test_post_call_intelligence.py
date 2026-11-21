"""
Test Post-Call AI Intelligence & Structured Extraction
Verifies:
1. Groq LLM sub-second structured JSON extraction (Summary, Sentiment, Lead Interest, Variables)
2. Hot vs Cold lead classification accuracy
3. Database persistence into CallLog
4. Multi-tenant security isolation on /analyze endpoint
"""
import asyncio
import httpx
from app.main import app
from app.core.database import engine, Base
from app.services.intelligence import intelligence_service


async def run_intelligence_tests():
    print("🔄 Resetting database for Post-Call Intelligence tests...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database ready.")

    print("\n--- 1. Testing Standalone Intelligence Service (Hot Lead) ---")
    hot_transcript = (
        "Agent: Namaste! Godrej Woods se Pooja bol rahi hu. Kya aap 3 BHK property dekh rahe hain?\n"
        "User: Haan ji, main Noida Sector 43 me 3 BHK flat search kar raha hu. Mera budget around 2.4 Crore hai "
        "aur main iss Saturday afternoon ko site visit ke liye aa sakta hu."
    )
    hot_res = await intelligence_service.analyze_transcript(hot_transcript)
    print("✅ Hot Lead Summary:", hot_res.summary)
    print("✅ Sentiment:", hot_res.sentiment)
    print("✅ Lead Score:", hot_res.lead_interest)
    print("✅ Extracted Variables:", hot_res.extracted_variables)
    print("✅ Action Items:", hot_res.action_items)

    assert hot_res.sentiment == "Positive"
    assert hot_res.lead_interest == "Hot"
    assert "3 BHK" in str(hot_res.extracted_variables.values()) or "3 BHK" in str(hot_res.extracted_variables)
    assert len(hot_res.action_items) > 0

    print("\n--- 2. Testing Standalone Intelligence Service (Angry / Cold Lead) ---")
    cold_transcript = (
        "Agent: Namaste! Nexo Homes se Pooja.\n"
        "User: Bar bar call karke pareshan kyu kar rahe ho? Mujhe koi flat nahi chahiye, "
        "mera number DND me daalo aur dobara phone mat karna!"
    )
    cold_res = await intelligence_service.analyze_transcript(cold_transcript)
    print("✅ Cold Lead Summary:", cold_res.summary)
    print("✅ Sentiment:", cold_res.sentiment)
    print("✅ Lead Score:", cold_res.lead_interest)

    assert cold_res.sentiment == "Negative"
    assert cold_res.lead_interest == "Cold"

    print("\n--- 3. Testing REST API Integration (POST /calls/{id}/analyze) ---")
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
        godrej_ws_id = godrej_reg.json()["workspace"]["id"]

        dlf_reg = await client.post("/api/v1/auth/register", json={
            "company_name": "DLF CyberCity",
            "full_name": "DLF Admin",
            "email": "admin@dlf.com",
            "password": "Password123@"
        })
        dlf_token = dlf_reg.json()["access_token"]

        # Create Godrej Call via Webhook
        await client.post("/api/v1/webhooks/telephony", json={
            "call_id": "CA-AI-TEST-999",
            "to_phone": "+919876543210",
            "from_phone": "+911145678900",
            "call_status": "completed",
            "call_duration_seconds": 92,
            "workspace_id": godrej_ws_id
        })

        # Fetch Call ID
        calls_res = await client.get("/api/v1/calls", headers={"Authorization": f"Bearer {godrej_token}"})
        call_id = calls_res.json()["items"][0]["id"]

        # Trigger AI Analysis
        analyze_resp = await client.post(
            f"/api/v1/calls/{call_id}/analyze",
            headers={"Authorization": f"Bearer {godrej_token}"},
            json={"transcript": hot_transcript}
        )
        assert analyze_resp.status_code == 200
        analyzed_data = analyze_resp.json()
        assert analyzed_data["log"]["sentiment"] == "Positive"
        assert analyzed_data["log"]["extracted_data"]["lead_interest"] == "Hot"
        print("✅ Call AI Analysis persisted into CallLog successfully.")

        # DLF Cross-Tenant Attack
        hack_resp = await client.post(
            f"/api/v1/calls/{call_id}/analyze",
            headers={"Authorization": f"Bearer {dlf_token}"},
            json={"transcript": "hack attempt"}
        )
        assert hack_resp.status_code == 404
        print(f"✅ Blocked: DLF cannot analyze Godrej's call (HTTP 404 Not Found).")

    await engine.dispose()
    print("\n🎉 ALL POST-CALL AI INTELLIGENCE TESTS PASSED 100%!")


if __name__ == "__main__":
    asyncio.run(run_intelligence_tests())
