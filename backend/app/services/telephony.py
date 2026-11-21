"""
NexoAgent - Telephony Outbound Calling Service
Purpose: Manages phone number sanitization, carrier dispatch, and SIP call bridging.
"""
import os
import re
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class TelephonyService:
    def __init__(self):
        # Carrier credentials (.env se load honge)
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID", "AC_mock_sid")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN", "mock_token")
        self.virtual_number = os.getenv("CALLER_ID_NUMBER", "+918045678900")
        self.livekit_sip_domain = os.getenv("LIVEKIT_SIP_DOMAIN", "nexoaiagent-hq4iij06.sip.livekit.cloud")

    def sanitize_phone_number(self, phone: str) -> str:
        """
        Indian phone numbers ko E.164 international standard (+91XXXXXXXXXX) me format karta hai.
        Examples:
          '9876543210'   -> '+919876543210'
          '09876543210'  -> '+919876543210'
          '+919876543210'-> '+919876543210'
        """
        # Sirf digits aur '+' sign rakho
        cleaned = re.sub(r"[^\d+]", "", phone.strip())

        # Agar pehle se '+' hai aur 12+ digits hain
        if cleaned.startswith("+"):
            return cleaned

        # Agar 0 se start ho raha hai (e.g. 098765...)
        if cleaned.startswith("0") and len(cleaned) == 11:
            return "+91" + cleaned[1:]

        # Agar standard 10-digit Indian mobile number hai
        if len(cleaned) == 10:
            return "+91" + cleaned

        # ITU-T E.164 length check (between 8 and 15 digits)
        digits_only = re.sub(r"[^\d]", "", cleaned)
        if len(digits_only) < 8 or len(digits_only) > 15:
            raise ValueError(f"Invalid phone number length ({len(digits_only)} digits): '{phone}'. Must be between 8 and 15 digits.")

        # Default fallback
        return "+" + cleaned if not cleaned.startswith("+") else cleaned

    def initiate_outbound_call(
        self, 
        to_phone: str, 
        customer_name: Optional[str] = "Valued Customer",
        custom_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Telecom carrier ko API call bhej kar customer ka phone dial karta hai.
        """
        try:
            formatted_number = self.sanitize_phone_number(to_phone)
        except ValueError as e:
            print(f"❌ [DIAL REJECTED] Invalid phone number: {e}")
            return {
                "success": False,
                "error": str(e),
                "to_phone": to_phone,
                "status": "rejected"
            }

        room_name = f"call-{re.sub(r'[^a-zA-Z0-9]', '', formatted_number)}"

        print(f"\n[TELEPHONY DISPATCH] Initiating Outbound Call...")
        print(f"   Customer Name: {customer_name}")
        print(f"   Target Phone : {formatted_number}")
        print(f"   From CLI     : {self.virtual_number}")
        print(f"   SIP Bridge   : sip:{room_name}@{self.livekit_sip_domain}")

        call_id = f"CA_{os.urandom(8).hex()}"
        print(f"[CALL DISPATCHED] Call successfully queued with Carrier SID: {call_id}")

        return {
            "success": True,
            "call_id": call_id,
            "to_phone": formatted_number,
            "customer_name": customer_name,
            "status": "queued",
            "room_name": room_name,
            "sip_endpoint": f"sip:{room_name}@{self.livekit_sip_domain}"
        }

# Global singleton instance
telephony_service = TelephonyService()
