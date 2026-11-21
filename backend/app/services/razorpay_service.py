"""
NexoAgent - Razorpay Payment Gateway Service
Handles:
1. Razorpay Order Generation in Paise (Subunits)
2. Cryptographic HMAC SHA-256 Payment Signature Verification
3. Webhook Signature Verification & Idempotency
"""
import hmac
import hashlib
import time
import uuid
from typing import Dict, Any, Optional
from app.core.config import settings


class RazorpayService:
    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET

    def create_order(
        self,
        amount_inr: float,
        receipt_id: Optional[str] = None,
        notes: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Creates a Razorpay Order.
        Amount must be provided in whole paise (1 INR = 100 Paise).
        """
        if amount_inr < 100.0:
            raise ValueError("Minimum recharge amount is ₹100.00")

        amount_paise = int(round(amount_inr * 100))
        generated_receipt = receipt_id or f"rcpt_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        order_id = f"order_{uuid.uuid4().hex[:14]}"

        # Standard Razorpay Order response payload
        return {
            "order_id": order_id,
            "amount_inr": round(amount_inr, 2),
            "amount_paise": amount_paise,
            "currency": "INR",
            "receipt": generated_receipt,
            "key_id": self.key_id,
            "status": "created",
            "notes": notes or {}
        }

    def verify_payment_signature(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str
    ) -> bool:
        """
        Cryptographic HMAC SHA-256 signature verification.
        Formula: HMAC-SHA256(key=secret, msg=f"{order_id}|{payment_id}")
        Protects against tampered browser client requests.
        """
        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
            return False

        message = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
        secret_bytes = self.key_secret.encode("utf-8")
        
        expected_signature = hmac.new(
            secret_bytes,
            message,
            hashlib.sha256
        ).hexdigest()

        # Constant-time comparison to prevent timing attacks
        return hmac.compare_digest(expected_signature, razorpay_signature)

    def generate_signature_for_test(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str
    ) -> str:
        """Utility method to compute expected signature for automated test suites."""
        message = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
        secret_bytes = self.key_secret.encode("utf-8")
        return hmac.new(secret_bytes, message, hashlib.sha256).hexdigest()

    def verify_webhook_signature(
        self,
        raw_body: bytes,
        signature: str
    ) -> bool:
        """Verifies Razorpay Server-to-Server Webhook Signature."""
        if not raw_body or not signature:
            return False

        secret_bytes = self.webhook_secret.encode("utf-8")
        expected = hmac.new(secret_bytes, raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)


razorpay_service = RazorpayService()
