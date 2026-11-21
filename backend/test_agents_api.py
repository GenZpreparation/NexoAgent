"""
Test Voice Agent Studio CRUD & Multi-Tenant Isolation
Verifies:
1. Agent creation (POST /api/v1/agents)
2. Agent listing (GET /api/v1/agents)
3. Cross-tenant isolation (DLF cannot read, update, or delete Godrej's agents)
4. Partial updates (PATCH /api/v1/agents/{id})
5. Safe deletion (DELETE /api/v1/agents/{id})
"""
import asyncio
import httpx
from app.main import app
from app.core.database import engine, Base


async def run_agent_crud_tests():
    print("🔄 Resetting database for Agent Studio tests...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database ready.")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Step A: Setup Two Workspaces (Godrej & DLF)
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

        print("\n--- 1. Testing Agent Creation for Godrej & DLF ---")
        # Godrej creates Agent 1
        g_agent_resp = await client.post(
            "/api/v1/agents",
            headers={"Authorization": f"Bearer {godrej_token}"},
            json={
                "name": "Pooja - Godrej Woods",
                "system_prompt": "Tu Pooja hai, Godrej Woods luxury residential project ki sales specialist.",
                "first_message": "Namaste! Godrej Woods se Pooja bol rahi hu.",
                "voice_provider": "sarvam",
                "voice_id": "bulbul:v3/pooja",
                "temperature": 0.3
            }
        )
        assert g_agent_resp.status_code == 201
        godrej_agent = g_agent_resp.json()
        godrej_agent_id = godrej_agent["id"]
        print(f"✅ Godrej created Agent ID={godrej_agent_id} ('{godrej_agent['name']}')")

        # DLF creates Agent 2
        d_agent_resp = await client.post(
            "/api/v1/agents",
            headers={"Authorization": f"Bearer {dlf_token}"},
            json={
                "name": "Aman - DLF CyberHub",
                "system_prompt": "Tu Aman hai, DLF CyberHub commercial leasing manager.",
                "first_message": "Good morning! DLF CyberHub se Aman bol raha hu.",
                "voice_provider": "sarvam",
                "voice_id": "bulbul:v3/aman",
                "temperature": 0.4
            }
        )
        assert d_agent_resp.status_code == 201
        dlf_agent = d_agent_resp.json()
        dlf_agent_id = dlf_agent["id"]
        print(f"✅ DLF created Agent ID={dlf_agent_id} ('{dlf_agent['name']}')")

        print("\n--- 2. Testing Tenant-Isolated Agent Listing ---")
        # Godrej list
        g_list_resp = await client.get("/api/v1/agents", headers={"Authorization": f"Bearer {godrej_token}"})
        assert g_list_resp.status_code == 200
        g_agents = g_list_resp.json()
        assert len(g_agents) == 1
        assert g_agents[0]["id"] == godrej_agent_id
        print(f"✅ Godrej sees only their agent: {g_agents[0]['name']}")

        # DLF list
        d_list_resp = await client.get("/api/v1/agents", headers={"Authorization": f"Bearer {dlf_token}"})
        assert d_list_resp.status_code == 200
        d_agents = d_list_resp.json()
        assert len(d_agents) == 1
        assert d_agents[0]["id"] == dlf_agent_id
        print(f"✅ DLF sees only their agent: {d_agents[0]['name']}")

        print("\n--- 3. Testing Cross-Tenant Security Attacks (DLF -> Godrej Agent) ---")
        # DLF tries to GET Godrej Agent 1
        hack_get = await client.get(f"/api/v1/agents/{godrej_agent_id}", headers={"Authorization": f"Bearer {dlf_token}"})
        assert hack_get.status_code == 404
        print(f"✅ Blocked: DLF cannot read Godrej's Agent ID {godrej_agent_id} (Returned 404 Not Found).")

        # DLF tries to PATCH Godrej Agent 1
        hack_patch = await client.patch(
            f"/api/v1/agents/{godrej_agent_id}",
            headers={"Authorization": f"Bearer {dlf_token}"},
            json={"first_message": "HACKED MESSAGE!"}
        )
        assert hack_patch.status_code == 404
        print(f"✅ Blocked: DLF cannot modify Godrej's Agent ID {godrej_agent_id} (Returned 404 Not Found).")

        # DLF tries to DELETE Godrej Agent 1
        hack_delete = await client.delete(f"/api/v1/agents/{godrej_agent_id}", headers={"Authorization": f"Bearer {dlf_token}"})
        assert hack_delete.status_code == 404
        print(f"✅ Blocked: DLF cannot delete Godrej's Agent ID {godrej_agent_id} (Returned 404 Not Found).")

        print("\n--- 4. Testing Legitimate PATCH Update by Godrej ---")
        patch_resp = await client.patch(
            f"/api/v1/agents/{godrej_agent_id}",
            headers={"Authorization": f"Bearer {godrej_token}"},
            json={
                "temperature": 0.2,
                "first_message": "Namaste ji! Godrej Woods luxury villas se Pooja bol rahi hu."
            }
        )
        assert patch_resp.status_code == 200
        updated = patch_resp.json()
        assert updated["temperature"] == 0.2
        assert updated["first_message"] == "Namaste ji! Godrej Woods luxury villas se Pooja bol rahi hu."
        assert updated["name"] == "Pooja - Godrej Woods"  # Unchanged field retained
        print("✅ Godrej successfully updated their agent's first message and temperature.")

        print("\n--- 5. Testing Legitimate DELETE by Godrej ---")
        del_resp = await client.delete(f"/api/v1/agents/{godrej_agent_id}", headers={"Authorization": f"Bearer {godrej_token}"})
        assert del_resp.status_code == 204
        print(f"✅ Godrej deleted their Agent ID {godrej_agent_id} (HTTP 204 No Content).")

        # Verify Godrej agent list is now empty
        g_recheck = await client.get("/api/v1/agents", headers={"Authorization": f"Bearer {godrej_token}"})
        assert len(g_recheck.json()) == 0
        print("✅ Godrej agent list is now empty [].")

        # Verify DLF's agent is still completely safe and unaffected
        d_recheck = await client.get("/api/v1/agents", headers={"Authorization": f"Bearer {dlf_token}"})
        assert len(d_recheck.json()) == 1
        assert d_recheck.json()[0]["id"] == dlf_agent_id
        print(f"✅ DLF's agent '{d_recheck.json()[0]['name']}' remains completely safe and untouched.")

    await engine.dispose()
    print("\n🎉 ALL AGENT STUDIO CRUD & TENANT ISOLATION TESTS PASSED 100%!")


if __name__ == "__main__":
    asyncio.run(run_agent_crud_tests())
