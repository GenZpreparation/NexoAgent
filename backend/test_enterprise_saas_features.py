"""
========================================================================================
🏢 NEXOAGENT - ENTERPRISE SAAS MASTER TEST SUITE
========================================================================================
Tests:
1. Developer API Key Generation, SHA-256 Storage & Prefixes
2. Programmatic Outbound Call Dispatch via `X-API-Key` (Direct CRM Integration)
3. API Key Revocation & Security Enforcement
4. Outbound CRM Webhook Subscriptions (Registration, HMAC Signatures & Test Ping)
5. Workspace Team Members & RBAC Security:
   - Admin invites Manager & Member teammates
   - RBAC Guard: Member/Caller blocked from Admin actions (403 Forbidden)
   - Self-deactivation prevention for Admin
========================================================================================
"""
import asyncio
import httpx
from sqlalchemy import select
from app.main import app
from app.core.database import engine, Base, AsyncSessionLocal
from app.models import Workspace, User, VoiceAgent, ApiKey, WebhookSubscription


async def run_enterprise_saas_tests():
    print("\n" + "="*85)
    print("🏢 STARTING ENTERPRISE SAAS ADVANCED FEATURES TEST SUITE")
    print("="*85)

    # Clean DB reset
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:

        # ----------------------------------------------------------------------------------
        # SETUP: Register Admin User & Workspace (Godrej Properties)
        # ----------------------------------------------------------------------------------
        reg_res = await client.post("/api/v1/auth/register", json={
            "company_name": "Godrej Properties Enterprise",
            "full_name": "Aditya Godrej",
            "email": "aditya.admin@godrej.com",
            "password": "AdminStrongPassword123!",
            "phone": "+919811122334"
        })
        assert reg_res.status_code == 201
        admin_token = reg_res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        workspace_id = reg_res.json()["workspace"]["id"]
        print(f"✅ Registered Admin (Godrej Properties, Workspace ID: {workspace_id})")

        # Create Voice Agent for Godrej
        agent_res = await client.post("/api/v1/agents", headers=admin_headers, json={
            "name": "Pooja - Godrej Sales Specialist",
            "voice_provider": "sarvam",
            "voice_id": "bulbul:v3/pooja",
            "language": "hi-IN",
            "temperature": 0.3,
            "first_message": "Namaste! Godrej Properties se bol rahi hu.",
            "system_prompt": "You are Pooja from Godrej. Qualify buyer budget."
        })
        assert agent_res.status_code == 201
        agent_id = agent_res.json()["id"]

        # ==================================================================================
        # TEST 1: Developer API Key Generation & Listing
        # ==================================================================================
        print("\n--- TEST 1: Developer API Key Generation & Prefixes ---")
        key_res = await client.post("/api/v1/api-keys", headers=admin_headers, json={
            "name": "HubSpot & Salesforce CRM Sync Key"
        })
        assert key_res.status_code == 201, f"API key generation failed: {key_res.text}"
        key_data = key_res.json()
        assert key_data["api_key"].startswith("nexo_live_")
        assert key_data["key_prefix"].startswith("nexo_live_")
        raw_api_key = key_data["api_key"]
        api_key_id = key_data["id"]
        print(f"   🔑 Generated Key : {key_data['key_prefix']} (Full Secret Revealed Once)")

        # Verify DB storage: secret must be stored as SHA-256 hash, NOT raw text!
        async with AsyncSessionLocal() as db:
            db_key = (await db.execute(select(ApiKey).where(ApiKey.id == api_key_id))).scalar_one()
            assert db_key.hashed_key != raw_api_key
            assert len(db_key.hashed_key) == 64  # SHA-256 hex length
            assert db_key.is_active is True
            print("   🔒 Security Verified: Secret is stored safely as SHA-256 hash.")

        # List keys
        list_keys_res = await client.get("/api/v1/api-keys", headers=admin_headers)
        assert list_keys_res.status_code == 200
        keys_list = list_keys_res.json()
        assert len(keys_list) == 1
        assert "api_key" not in keys_list[0]  # Raw key is never exposed again in list API!
        print("   📋 List Keys API Verified: Prefix shown, raw secret masked.")

        # ==================================================================================
        # TEST 2: Programmatic Outbound Call Dispatch via `X-API-Key`
        # ==================================================================================
        print("\n--- TEST 2: Programmatic Outbound Dialing via X-API-Key ---")
        # External CRM sends call dispatch request with X-API-Key (NO JWT token!)
        crm_headers = {"X-API-Key": raw_api_key}
        prog_call = await client.post(
            "/api/v1/calls/dispatch",
            headers=crm_headers,
            json={"phone_number": "+919877788999", "agent_id": agent_id}
        )
        assert prog_call.status_code == 201, f"Programmatic dial failed: {prog_call.text}"
        call_sid = prog_call.json()["call_sid"]
        print(f"   📞 CRM Programmatic Dial Succeeded! Call SID: {call_sid}")

        # Verify last_used_at timestamp updated
        async with AsyncSessionLocal() as db:
            db_key = (await db.execute(select(ApiKey).where(ApiKey.id == api_key_id))).scalar_one()
            assert db_key.last_used_at is not None
            print("   ⏱️ API Key last_used_at timestamp updated in database.")

        # ==================================================================================
        # TEST 3: API Key Revocation & Security Enforcement
        # ==================================================================================
        print("\n--- TEST 3: API Key Revocation & Security Enforcement ---")
        # Invalid / Fake key test
        fake_call = await client.post(
            "/api/v1/calls/dispatch",
            headers={"X-API-Key": "nexo_live_fake_attacker_key_9999"},
            json={"phone_number": "+919877788999", "agent_id": agent_id}
        )
        assert fake_call.status_code == 401
        print("   🛡️ Fake API Key rejected with HTTP 401 Unauthorized.")

        # Revoke the active key
        del_key_res = await client.delete(f"/api/v1/api-keys/{api_key_id}", headers=admin_headers)
        assert del_key_res.status_code == 204
        print("   🗑️ Revoked API Key.")

        # Subsequent call with revoked key must fail
        revoked_call = await client.post(
            "/api/v1/calls/dispatch",
            headers=crm_headers,
            json={"phone_number": "+919877788999", "agent_id": agent_id}
        )
        assert revoked_call.status_code == 401
        print("   🛡️ Revoked API Key cleanly rejected with HTTP 401 Unauthorized.")

        # ==================================================================================
        # TEST 4: Outbound CRM Webhook Subscriptions & Test Ping
        # ==================================================================================
        print("\n--- TEST 4: Outbound CRM Webhook Subscriptions ---")
        wh_res = await client.post(
            "/api/v1/integrations/webhooks",
            headers=admin_headers,
            json={
                "target_url": "https://crm.godrej.com/api/nexo-lead-webhook",
                "description": "HubSpot Inbound Lead Pipeline",
                "subscribed_events": ["call.completed", "lead.qualified"]
            }
        )
        assert wh_res.status_code == 201
        wh_data = wh_res.json()
        webhook_id = wh_data["id"]
        assert wh_data["secret"].startswith("whsec_")
        print(f"   📡 Registered CRM Webhook ID {webhook_id}: {wh_data['target_url']}")

        # Test Ping webhook
        ping_res = await client.post(f"/api/v1/integrations/webhooks/{webhook_id}/test-ping", headers=admin_headers)
        assert ping_res.status_code == 200
        ping_data = ping_res.json()
        assert ping_data["signature_sent"].startswith("sha256=")
        print(f"   🏓 Webhook Test-Ping dispatched with HMAC Signature: {ping_data['signature_sent'][:25]}...")

        # ==================================================================================
        # TEST 5: Team Members & Role-Based Access Control (RBAC)
        # ==================================================================================
        print("\n--- TEST 5: Team Members & RBAC Security ---")

        # 5A: Admin invites Manager teammate
        mgr_res = await client.post(
            "/api/v1/workspace/members",
            headers=admin_headers,
            json={
                "full_name": "Ramesh Manager",
                "email": "ramesh.manager@godrej.com",
                "password": "ManagerPass123!",
                "role": "manager"
            }
        )
        assert mgr_res.status_code == 201
        mgr_id = mgr_res.json()["id"]
        print(f"   👥 Invited Manager : {mgr_res.json()['full_name']} (Role: manager)")

        # 5B: Admin invites Member/Caller teammate
        caller_res = await client.post(
            "/api/v1/workspace/members",
            headers=admin_headers,
            json={
                "full_name": "Neha Caller",
                "email": "neha.caller@godrej.com",
                "password": "CallerPass123!",
                "role": "member"
            }
        )
        assert caller_res.status_code == 201
        caller_id = caller_res.json()["id"]
        print(f"   👥 Invited Member  : {caller_res.json()['full_name']} (Role: member)")

        # List members
        members_res = await client.get("/api/v1/workspace/members", headers=admin_headers)
        assert members_res.status_code == 200
        assert len(members_res.json()) == 3  # Admin + Manager + Member
        print("   📋 Team Members list verified: 3 Active Teammates.")

        # Workspace Profile Check
        prof_res = await client.get("/api/v1/workspace/profile", headers=admin_headers)
        assert prof_res.status_code == 200
        assert prof_res.json()["total_members"] == 3
        print(f"   🏢 Workspace Profile verified: {prof_res.json()['name']} (Total Members: 3)")

        # 5C: RBAC Security Test: Log in as Member/Caller
        login_res = await client.post("/api/v1/auth/login", json={
            "email": "neha.caller@godrej.com",
            "password": "CallerPass123!"
        })
        assert login_res.status_code == 200
        member_token = login_res.json()["access_token"]
        member_headers = {"Authorization": f"Bearer {member_token}"}

        # Member attempts an ADMIN action (Generating Developer API Key) -> MUST BE BLOCKED!
        unauthorized_key_attempt = await client.post(
            "/api/v1/api-keys",
            headers=member_headers,
            json={"name": "Hacker Key"}
        )
        assert unauthorized_key_attempt.status_code == 403
        assert "admin privilege required" in unauthorized_key_attempt.json()["detail"].lower()
        print("   🛡️ RBAC Guard: Member/Caller blocked from generating API Keys with HTTP 403 Forbidden!")

        # Member attempts to invite teammates -> MUST BE BLOCKED!
        unauthorized_invite = await client.post(
            "/api/v1/workspace/members",
            headers=member_headers,
            json={
                "full_name": "Unauthorized User",
                "email": "unauth@godrej.com",
                "password": "Pass123!",
                "role": "admin"
            }
        )
        assert unauthorized_invite.status_code == 403
        print("   🛡️ RBAC Guard: Member/Caller blocked from inviting team members with HTTP 403 Forbidden!")

        # 5D: Admin attempts self-deactivation guard
        admin_self_deactivate = await client.patch(
            f"/api/v1/workspace/members/{reg_res.json()['user']['id']}",
            headers=admin_headers,
            json={"is_active": False}
        )
        assert admin_self_deactivate.status_code == 400
        assert "cannot deactivate their own account" in admin_self_deactivate.json()["detail"].lower()
        print("   🛡️ Safety Guard: Admin prevented from accidentally deactivating their own account.")

    print("\n" + "="*85)
    print("🎉 ALL ADVANCED ENTERPRISE SAAS FEATURES PASSED 100%!")
    print("="*85 + "\n")


if __name__ == "__main__":
    asyncio.run(run_enterprise_saas_tests())
