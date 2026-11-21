"""
Test Audio Recording Object Storage & Secure Presigned Streaming
Verifies:
1. S3 / Cloudflare R2 presigned upload URL creation (PUT)
2. S3 / Cloudflare R2 presigned streaming URL creation (GET)
3. Cryptographic AWS signature & expiration parameters
4. Tenant isolation: DLF cannot stream Godrej's audio recordings
5. Missing recording error handling
"""
import asyncio
import httpx
from app.main import app
from app.core.database import engine, Base
from app.services.storage import recording_storage


async def run_storage_tests():
    print("🔄 Resetting database for Audio Storage tests...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database ready.")

    print("\n--- 1. Testing Storage Service Presigned URLs ---")
    ws_id = 1
    call_sid = "CA-TEST-AUDIO-1234"
    key = recording_storage.get_storage_key(ws_id, call_sid)
    assert key == "recordings/workspace_1/CA-TEST-AUDIO-1234.mp3"
    print(f"✅ Storage key generated: {key}")

    # Upload presigned URL
    upload_url = recording_storage.generate_upload_url(ws_id, call_sid, expires_in=300)
    assert "X-Amz-Signature=" in upload_url
    assert "X-Amz-Expires=300" in upload_url
    print(f"✅ Presigned PUT upload URL verified (expires in 300s).")

    # Streaming presigned URL
    stream_url = recording_storage.generate_streaming_url(key, expires_in=900)
    assert "X-Amz-Signature=" in stream_url
    assert "X-Amz-Expires=900" in stream_url
    print(f"✅ Presigned GET streaming URL verified (expires in 900s).")

    print("\n--- 2. Testing REST API Integration & Tenant Protection ---")
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

        # Webhook: Godrej Call WITH recording
        await client.post("/api/v1/webhooks/telephony", json={
            "call_id": "CA-GODREJ-AUDIO-99",
            "to_phone": "+919876543210",
            "from_phone": "+911145678900",
            "call_status": "completed",
            "call_duration_seconds": 120,
            "recording_url": f"recordings/workspace_{godrej_ws_id}/CA-GODREJ-AUDIO-99.mp3",
            "workspace_id": godrej_ws_id
        })

        # Webhook: Godrej Call WITHOUT recording (e.g. busy call)
        await client.post("/api/v1/webhooks/telephony", json={
            "call_id": "CA-GODREJ-BUSY-88",
            "to_phone": "+919876543211",
            "from_phone": "+911145678900",
            "call_status": "busy",
            "call_duration_seconds": 0,
            "recording_url": None,
            "workspace_id": godrej_ws_id
        })

        # List Godrej calls
        g_calls = (await client.get("/api/v1/calls", headers={"Authorization": f"Bearer {godrej_token}"})).json()["items"]
        rec_call_id = [c["id"] for c in g_calls if c["call_sid"] == "CA-GODREJ-AUDIO-99"][0]
        no_rec_call_id = [c["id"] for c in g_calls if c["call_sid"] == "CA-GODREJ-BUSY-88"][0]

        # Godrej streams their own recording
        stream_resp = await client.get(
            f"/api/v1/calls/{rec_call_id}/recording",
            headers={"Authorization": f"Bearer {godrej_token}"}
        )
        assert stream_resp.status_code == 200
        stream_data = stream_resp.json()
        assert stream_data["call_sid"] == "CA-GODREJ-AUDIO-99"
        assert "X-Amz-Signature=" in stream_data["streaming_url"]
        assert stream_data["expires_in_seconds"] == 900
        print("✅ Godrej successfully obtained secure 15-min streaming audio URL.")

        # DLF attempts to stream Godrej's recording
        hack_resp = await client.get(
            f"/api/v1/calls/{rec_call_id}/recording",
            headers={"Authorization": f"Bearer {dlf_token}"}
        )
        assert hack_resp.status_code == 404
        print(f"✅ Blocked: DLF cannot stream Godrej's recording (Returned 404 Not Found).")

        # Godrej attempts to stream a call without recording
        empty_resp = await client.get(
            f"/api/v1/calls/{no_rec_call_id}/recording",
            headers={"Authorization": f"Bearer {godrej_token}"}
        )
        assert empty_resp.status_code == 404
        assert "not available" in empty_resp.json()["detail"]
        print("✅ Graceful 404 for call without recording verified.")

    await engine.dispose()
    print("\n🎉 ALL AUDIO RECORDING STORAGE & STREAMING TESTS PASSED 100%!")


if __name__ == "__main__":
    asyncio.run(run_storage_tests())
