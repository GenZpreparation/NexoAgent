"""
NexoAgent - Week 2 Real-World Production Telephony Test Suite
Covers: Dirty numbers, invalid inputs, lifecycle state machine events,
extreme billing pulse edge cases, and corrupt payload guards.
"""
import asyncio
import httpx
from app.services.telephony import telephony_service
from app.api.v1.webhooks import calculate_call_cost
from app.main import app
from app.core.database import engine, Base


def test_dirty_and_extreme_phone_numbers():
    print("\n--- 1. Testing Extreme Phone Number Edge Cases ---")
    assert telephony_service.sanitize_phone_number("  (98765) 43210  ") == "+919876543210"
    print("✅ Passed: '(98765) 43210' -> '+919876543210'")

    assert telephony_service.sanitize_phone_number("9876.543.210") == "+919876543210"
    print("✅ Passed: '9876.543.210' -> '+919876543210'")

    assert telephony_service.sanitize_phone_number("01123456789") == "+911123456789"
    print("✅ Passed: '01123456789' -> '+911123456789'")

    res_rejected = telephony_service.initiate_outbound_call("12345")
    assert res_rejected["success"] is False
    assert res_rejected["status"] == "rejected"
    print("✅ Passed: Corrupt 5-digit number ('12345') cleanly rejected before carrier API call.")


def test_extreme_billing_pulse_edges():
    print("\n--- 2. Testing Extreme Telecom Billing Calculations ---")
    assert calculate_call_cost(0) == 0.0, "Zero duration must be Rs. 0"
    assert calculate_call_cost(1) == 5.50, "1 second call must bill 1 full minute (Rs. 5.50)"
    assert calculate_call_cost(59) == 5.50, "59 seconds must bill 1 minute"
    assert calculate_call_cost(60) == 5.50, "Exact 60 seconds must bill 1 minute"
    assert calculate_call_cost(61) == 11.00, "61 seconds must round up to 2 minutes (Rs. 11.00)"
    assert calculate_call_cost(119) == 11.00, "119 seconds must bill 2 minutes"
    assert calculate_call_cost(120) == 11.00, "Exact 120 seconds must bill 2 minutes"
    assert calculate_call_cost(121) == 16.50, "121 seconds must round up to 3 minutes (Rs. 16.50)"
    assert calculate_call_cost(3600) == 330.00, "1 Hour call must bill Rs. 330.00"
    print("✅ Passed: Boundary checks (1s, 59s, 60s, 61s, 120s, 3600s) verified.")

    assert calculate_call_cost(-10) == 0.0, "Negative duration must be safely treated as Rs. 0.0"
    print("✅ Passed: Negative duration glitch guarded safely.")


async def test_async_webhooks_and_state_machine():
    print("\n--- 3. Testing Real-World Telephony Webhook Lifecycle ---")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        call_id = "CA_real_world_99"
        customer_phone = "+919876543210"

        # Step A: Initiated
        res_init = await client.post("/api/v1/webhooks/telephony", json={
            "call_id": call_id,
            "to_phone": customer_phone,
            "from_phone": "+918045678900",
            "call_status": "initiated"
        })
        assert res_init.status_code == 200
        assert res_init.json()["processed_state"] == "initiated"
        assert res_init.json()["billed_cost_inr"] == 0.0
        print("✅ Step A: Initiated processed (Rs. 0 billed).")

        # Step B: Ringing
        res_ring = await client.post("/api/v1/webhooks/telephony", json={
            "call_id": call_id,
            "to_phone": customer_phone,
            "from_phone": "+918045678900",
            "call_status": "ringing"
        })
        assert res_ring.status_code == 200
        assert res_ring.json()["processed_state"] == "ringing"
        assert res_ring.json()["billed_cost_inr"] == 0.0
        print("✅ Step B: Ringing processed (Rs. 0 billed).")

        # Step C: In-Progress
        res_answer = await client.post("/api/v1/webhooks/telephony", json={
            "call_id": call_id,
            "to_phone": customer_phone,
            "from_phone": "+918045678900",
            "call_status": "in-progress"
        })
        assert res_answer.status_code == 200
        assert res_answer.json()["processed_state"] == "in-progress"
        assert res_answer.json()["billed_cost_inr"] == 0.0
        print("✅ Step C: In-Progress answered (Rs. 0 billed until completion).")

        # Step D: Completed (142s -> 3 mins billed Rs. 16.50)
        res_complete = await client.post("/api/v1/webhooks/telephony", json={
            "call_id": call_id,
            "to_phone": customer_phone,
            "from_phone": "+918045678900",
            "call_status": "completed",
            "call_duration_seconds": 142,
            "recording_url": "https://storage.nexoagent.ai/recordings/CA_real_world_99.mp3"
        })
        assert res_complete.status_code == 200
        assert res_complete.json()["processed_state"] == "completed"
        assert res_complete.json()["billed_cost_inr"] == 16.50
        print(f"✅ Step D: Completed (142s -> 3 mins billed Rs. {res_complete.json()['billed_cost_inr']}).")

        # Busy / Failed calls
        print("\n--- 4. Testing Busy, No-Answer & Failed Scenarios ---")
        for status_val in ["busy", "no-answer", "failed"]:
            res_fail = await client.post("/api/v1/webhooks/telephony", json={
                "call_id": f"CA_fail_{status_val}",
                "to_phone": "+919876543299",
                "from_phone": "+918045678900",
                "call_status": status_val
            })
            assert res_fail.status_code == 200
            assert res_fail.json()["billed_cost_inr"] == 0.0
            print(f"✅ Passed: Status '{status_val}' resulted in Rs. 0.00 charge.")

    await engine.dispose()


if __name__ == "__main__":
    print("🚀 STARTING WEEK 2 REAL-WORLD TELEPHONY TEST SUITE...")
    test_dirty_and_extreme_phone_numbers()
    test_extreme_billing_pulse_edges()
    asyncio.run(test_async_webhooks_and_state_machine())
    print("\n🏆 ALL REAL-WORLD TEST SUITES PASSED WITH ZERO FAILURES!")
