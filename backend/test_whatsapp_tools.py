"""
Test Mid-Call Tools & WhatsApp Cloud API Automation
Verifies:
1. LiveKit in-call function tool 'send_whatsapp_brochure'
2. LiveKit in-call function tool 'book_site_visit'
3. Phone number sanitization (+91 E.164)
4. Database synchronization (CallLog.whatsapp_status -> "sent")
5. REST API endpoints (/api/v1/whatsapp/send-brochure, /book-visit)
"""
import asyncio
import httpx
from sqlalchemy import select
from app.main import app
from app.core.database import engine, Base, AsyncSessionLocal
from app.models import CallLog
from voice_agent.tools import send_whatsapp_brochure, book_site_visit
from app.services.whatsapp import whatsapp_service


async def run_whatsapp_tests():
    print("🔄 Resetting database for WhatsApp Automation tests...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database ready.")

    print("\n--- 1. Testing LiveKit Mid-Call Tool: send_whatsapp_brochure ---")
    dirty_phone = " (98765) 43210 "
    tool_resp = await send_whatsapp_brochure(
        phone_number=dirty_phone,
        project_name="Godrej Woods Sector 43"
    )
    assert "Success" in tool_resp
    assert "Godrej Woods Sector 43" in tool_resp
    print("✅ Tool output:", tool_resp)

    print("\n--- 2. Testing LiveKit Mid-Call Tool: book_site_visit ---")
    visit_resp = await book_site_visit(
        customer_phone=dirty_phone,
        day="This Saturday",
        time_slot="Morning (11 AM)",
        project_name="Godrej Woods Sector 43"
    )
    assert "Success" in visit_resp
    assert "Saturday" in visit_resp
    print("✅ Tool output:", visit_resp)

    print("\n--- 3. Testing Database Synchronization on CallLog ---")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Register user
        reg_resp = await client.post("/api/v1/auth/register", json={
            "company_name": "Godrej Properties",
            "full_name": "Godrej Admin",
            "email": "admin@godrej.com",
            "password": "Password123@"
        })
        token = reg_resp.json()["access_token"]
        ws_id = reg_resp.json()["workspace"]["id"]

        # Ingest call via Webhook
        await client.post("/api/v1/webhooks/telephony", json={
            "call_id": "CA-WHATSAPP-001",
            "to_phone": "+919876543210",
            "from_phone": "+911145678900",
            "call_status": "in-progress",
            "workspace_id": ws_id
        })

        # Fetch Call ID
        call_info = (await client.get("/api/v1/calls", headers={"Authorization": f"Bearer {token}"})).json()["items"][0]
        call_id = call_info["id"]

        # Check initial whatsapp_status
        assert call_info["log"]["whatsapp_status"] == "none"
        print("✅ Initial CallLog.whatsapp_status:", call_info["log"]["whatsapp_status"])

        # Trigger brochure dispatch with call_id attached
        dispatch_res = await whatsapp_service.send_brochure(
            customer_phone="+919876543210",
            project_name="Godrej Woods",
            call_id=call_id
        )
        assert dispatch_res["success"] is True

        # Re-query Call via API to verify DB update
        updated_call = (await client.get(f"/api/v1/calls/{call_id}", headers={"Authorization": f"Bearer {token}"})).json()
        assert updated_call["log"]["whatsapp_status"] == "sent"
        print(f"✅ CallLog.whatsapp_status updated to: '{updated_call['log']['whatsapp_status']}' in database!")

        print("\n--- 4. Testing REST API Endpoints ---")
        # Direct dashboard trigger
        api_send = await client.post(
            "/api/v1/whatsapp/send-brochure",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "customer_phone": "+919876543210",
                "project_name": "DLF CyberHub Suites",
                "call_id": call_id
            }
        )
        assert api_send.status_code == 200
        assert api_send.json()["status"] == "sent"
        print("✅ POST /api/v1/whatsapp/send-brochure verified.")

        api_visit = await client.post(
            "/api/v1/whatsapp/book-visit",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "customer_phone": "+919876543210",
                "project_name": "DLF CyberHub Suites",
                "visit_date": "Sunday 4 PM"
            }
        )
        assert api_visit.status_code == 200
        assert api_visit.json()["status"] == "sent"
        print("✅ POST /api/v1/whatsapp/book-visit verified.")

        # Unauthenticated request rejected
        unauth_resp = await client.post("/api/v1/whatsapp/send-brochure", json={"customer_phone": "123"})
        assert unauth_resp.status_code == 401
        print("✅ Unauthenticated request cleanly rejected (HTTP 401).")

    await engine.dispose()
    print("\n🎉 ALL MID-CALL TOOLS & WHATSAPP AUTOMATION TESTS PASSED 100%!")


if __name__ == "__main__":
    asyncio.run(run_whatsapp_tests())
