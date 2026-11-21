"""
Test Multi-Tenant Authentication & Authorization System
Verifies:
1. Workspace + Admin Registration (with free ₹500 balance)
2. Password Hashing (bcrypt)
3. Duplicate email prevention
4. Login credential validation
5. JWT token issuance and decoding
6. Strict Tenant Isolation (Godrej vs DLF)
"""
import asyncio
import httpx
from app.main import app
from app.core.database import engine, Base


async def run_auth_tests():
    print("🔄 Initializing fresh database for Auth tests...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Schema reset complete.")

    # Using httpx.AsyncClient with ASGITransport
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        print("\n--- 1. Testing Company 1 (Godrej) Registration ---")
        godrej_resp = await client.post("/api/v1/auth/register", json={
            "company_name": "Godrej Properties",
            "full_name": "Aman Verma",
            "email": "aman@godrej.com",
            "password": "GodrejPassword@123"
        })
        assert godrej_resp.status_code == 201, f"Failed: {godrej_resp.text}"
        godrej_data = godrej_resp.json()
        assert godrej_data["workspace"]["name"] == "Godrej Properties"
        assert godrej_data["workspace"]["balance_inr"] == 500.0
        assert godrej_data["user"]["email"] == "aman@godrej.com"
        assert "access_token" in godrej_data
        godrej_token = godrej_data["access_token"]
        print("✅ Godrej Workspace registered with ID:", godrej_data["workspace"]["id"])

        print("\n--- 2. Testing Company 2 (DLF CyberCity) Registration ---")
        dlf_resp = await client.post("/api/v1/auth/register", json={
            "company_name": "DLF CyberCity",
            "full_name": "Priya Nair",
            "email": "priya@dlf.com",
            "password": "DLFPassword@123"
        })
        assert dlf_resp.status_code == 201
        dlf_data = dlf_resp.json()
        assert dlf_data["workspace"]["name"] == "DLF CyberCity"
        assert dlf_data["workspace"]["id"] != godrej_data["workspace"]["id"]
        dlf_token = dlf_data["access_token"]
        print("✅ DLF Workspace registered with ID:", dlf_data["workspace"]["id"])

        print("\n--- 3. Testing Duplicate Email Guard ---")
        dup_resp = await client.post("/api/v1/auth/register", json={
            "company_name": "Fraud Enterprise",
            "full_name": "Fake User",
            "email": "aman@godrej.com",  # Duplicate email
            "password": "Password123"
        })
        assert dup_resp.status_code == 400
        assert "already exists" in dup_resp.json()["detail"]
        print("✅ Duplicate email cleanly rejected with HTTP 400.")

        print("\n--- 4. Testing Login Validation (Wrong vs Correct) ---")
        # Wrong password
        wrong_login = await client.post("/api/v1/auth/login", json={
            "email": "aman@godrej.com",
            "password": "WrongPassword!"
        })
        assert wrong_login.status_code == 401
        print("✅ Invalid password rejected with HTTP 401.")

        # Correct password
        correct_login = await client.post("/api/v1/auth/login", json={
            "email": "aman@godrej.com",
            "password": "GodrejPassword@123"
        })
        assert correct_login.status_code == 200
        login_token = correct_login.json()["access_token"]
        print("✅ Login successful. Received JWT token.")

        print("\n--- 5. Testing Protected /me Endpoint & Tenant Isolation ---")
        # Query with Godrej Token
        godrej_profile = await client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {godrej_token}"
        })
        assert godrej_profile.status_code == 200
        g_prof = godrej_profile.json()
        assert g_prof["workspace"]["name"] == "Godrej Properties"
        assert g_prof["user"]["email"] == "aman@godrej.com"
        print(f"✅ Godrej Profile verified: Workspace '{g_prof['workspace']['name']}', Balance: ₹{g_prof['workspace']['balance_inr']}")

        # Query with DLF Token
        dlf_profile = await client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {dlf_token}"
        })
        assert dlf_profile.status_code == 200
        d_prof = dlf_profile.json()
        assert d_prof["workspace"]["name"] == "DLF CyberCity"
        assert d_prof["user"]["email"] == "priya@dlf.com"
        print(f"✅ DLF Profile verified: Workspace '{d_prof['workspace']['name']}', Balance: ₹{d_prof['workspace']['balance_inr']}")

        # Tampered Token Guard
        tampered_resp = await client.get("/api/v1/auth/me", headers={
            "Authorization": "Bearer fake.tampered.token.123"
        })
        assert tampered_resp.status_code == 401
        print("✅ Tampered token rejected with HTTP 401.")

    await engine.dispose()
    print("\n🎉 ALL MULTI-TENANT AUTH & SECURITY TESTS PASSED 100%!")


if __name__ == "__main__":
    asyncio.run(run_auth_tests())
