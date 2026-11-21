"""
NexoAgent - Telephony Outbound Service Verification
Purpose: Verify phone sanitization, carrier dispatch payload, and SIP endpoint formatting.
"""
from app.services.telephony import telephony_service

def test_telephony():
    print("Testing Telephony Service & Outbound Dialing Engine...\n")

    # 1. Test Number Sanitization Logic (India E.164 standard)
    test_cases = [
        ("9876543210", "+919876543210"),
        ("09876543210", "+919876543210"),
        ("+919876543210", "+919876543210"),
        (" 98765-43210 ", "+919876543210"),
    ]

    for raw, expected in test_cases:
        cleaned = telephony_service.sanitize_phone_number(raw)
        assert cleaned == expected, f"Failed: {raw} -> {cleaned} != {expected}"
        print(f"Sanitized: '{raw}' -> '{cleaned}'")

    # 2. Test Outbound Call Dispatch
    print("\n--- Testing Outbound Dial Dispatch ---")
    result = telephony_service.initiate_outbound_call(
        to_phone="9876543210",
        customer_name="Rahul Sharma",
        custom_metadata={"property_interest": "2 BHK", "campaign": "Meta Ads Noida"}
    )

    assert result["success"] is True
    assert result["status"] == "queued"
    assert result["to_phone"] == "+919876543210"
    assert result["sip_endpoint"].startswith("sip:")

    print("\nDispatch Response Payload:")
    for key, value in result.items():
        print(f"   {key}: {value}")

    print("\nSUCCESS: Telephony Service verified and ready for PSTN carrier routing!")

if __name__ == "__main__":
    test_telephony()
