"""
NexoAgent - Telephony Webhook Verification Test
Purpose: Test webhook payload handling, call state transitions, and per-minute cost calculations.
"""
from app.api.v1.webhooks import handle_telephony_webhook, CallStatusEvent, calculate_call_cost

def test_call_cost_calculation():
    print("Testing Call Cost Billing Formula...")
    assert calculate_call_cost(0) == 0.0, "0s call should be Rs. 0"
    assert calculate_call_cost(45) == 5.50, "45s call should be Rs. 5.50 (1 min)"
    assert calculate_call_cost(60) == 5.50, "60s call should be Rs. 5.50 (1 min)"
    assert calculate_call_cost(61) == 11.00, "61s call should be Rs. 11.00 (2 mins)"
    assert calculate_call_cost(120) == 11.00, "120s call should be Rs. 11.00 (2 mins)"
    print("SUCCESS: Per-minute billing logic verified with round-up accuracy!\n")

def test_telephony_webhooks():
    print("Testing Telephony Webhook Event Handlers...\n")

    # 1. Test In-Progress (Call Answered)
    print("--- Test 1: Customer Answered Call ---")
    event_answered = CallStatusEvent(
        call_id="CA_test_001",
        to_phone="+919876543210",
        from_phone="+918045678900",
        call_status="in-progress",
        call_duration_seconds=0
    )
    res1 = handle_telephony_webhook(event_answered)
    assert res1["processed_state"] == "in-progress"
    assert res1["billed_cost_inr"] == 0.0
    print("Verified: In-progress webhook processed cleanly.\n")

    # 2. Test Completed (Call Finished after 75s)
    print("--- Test 2: Call Completed (75s duration) ---")
    event_completed = CallStatusEvent(
        call_id="CA_test_001",
        to_phone="+919876543210",
        from_phone="+918045678900",
        call_status="completed",
        call_duration_seconds=75,
        recording_url="https://storage.nexoagent.ai/recordings/CA_test_001.mp3"
    )
    res2 = handle_telephony_webhook(event_completed)
    assert res2["processed_state"] == "completed"
    assert res2["billed_cost_inr"] == 11.00
    print(f"Verified: Completed call calculated 75s -> Rs. {res2['billed_cost_inr']}.\n")

    # 3. Test Busy Call (Zero Cost)
    print("--- Test 3: Customer Busy / Rejected Call ---")
    event_busy = CallStatusEvent(
        call_id="CA_test_002",
        to_phone="+919876543211",
        from_phone="+918045678900",
        call_status="busy",
        call_duration_seconds=0
    )
    res3 = handle_telephony_webhook(event_busy)
    assert res3["processed_state"] == "busy"
    assert res3["billed_cost_inr"] == 0.0
    print("Verified: Busy call processed with Rs. 0.00 charge.\n")

    print("ALL TELEPHONY WEBHOOK TESTS PASSED SUCCESSFULLY! 🎉")

if __name__ == "__main__":
    test_call_cost_calculation()
    test_telephony_webhooks()
