"""
NexoAgent - Task 2 Test Suite: Razorpay Payment Gateway & Cryptographic Verification
Tests:
1. Razorpay Order Creation (Paise conversion & limits)
2. Valid HMAC SHA-256 Payment Verification & Atomic Wallet Credit
3. Security Test: Rejection of Tampered/Fraudulent Signatures
4. Payment Idempotency (Preventing Double-Credit of same Payment ID)
5. Server-to-Server Razorpay Webhook Ingestion
6. Wallet Summary & Transactions Ledger APIs
"""
import asyncio
import httpx
from sqlalchemy import select
from app.main import app
from app.core.database import engine, Base, AsyncSessionLocal
from app.models import Workspace, User, WalletTransaction
from app.services.razorpay_service import razorpay_service


async def run_billing_tests():
    print("🔄 Setting up isolated database for Razorpay Billing tests...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register a test company user (Godrej Properties)
        reg_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "finance@godrej.com",
                "password": "StrongPassword123!",
                "full_name": "Finance Head",
                "company_name": "Godrej Properties",
                "phone": "+919876543210"
            }
        )
        assert reg_res.status_code == 201
        godrej_token = reg_res.json()["access_token"]
        godrej_headers = {"Authorization": f"Bearer {godrej_token}"}
        print("✅ Registered Godrej Account with Initial ₹500 Bonus.")

        # ====================================================================
        # TEST 1: Razorpay Order Creation
        # ====================================================================
        print("\n--- TEST 1: Razorpay Order Creation ---")
        order_res = await client.post(
            "/api/v1/billing/create-order",
            headers=godrej_headers,
            json={"amount_inr": 1000.0, "pack_id": "starter"}
        )
        assert order_res.status_code == 201
        order_data = order_res.json()
        assert order_data["order_id"].startswith("order_")
        assert order_data["amount_inr"] == 1000.0
        assert order_data["amount_paise"] == 100000  # 1,000 INR = 100,000 Paise
        assert order_data["currency"] == "INR"
        order_id = order_data["order_id"]
        print(f"✅ Generated Razorpay Order: {order_id} (Amount: 100,000 Paise = ₹1,000.0)")

        # Verify minimum amount validation (< ₹100 should fail)
        invalid_res = await client.post(
            "/api/v1/billing/create-order",
            headers=godrej_headers,
            json={"amount_inr": 50.0}
        )
        assert invalid_res.status_code == 422  # Pydantic ge=100.0 validation
        print("✅ Validation guard rejected order < ₹100.")

        # ====================================================================
        # TEST 2: Valid HMAC SHA-256 Payment Verification & Atomic Wallet Credit
        # ====================================================================
        print("\n--- TEST 2: Valid Payment Signature Verification ---")
        payment_id = "pay_test_godrej_101"
        valid_signature = razorpay_service.generate_signature_for_test(order_id, payment_id)

        verify_res = await client.post(
            "/api/v1/billing/verify-payment",
            headers=godrej_headers,
            json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": valid_signature,
                "amount_inr": 1000.0
            }
        )
        assert verify_res.status_code == 200, f"Expected 200, got {verify_res.status_code}: {verify_res.text}"
        verify_data = verify_res.json()
        assert verify_data["status"] == "payment_verified"
        assert verify_data["new_balance_inr"] == 1500.0  # ₹500 initial + ₹1000 recharge
        print("✅ Payment verified with HMAC SHA-256! New Wallet Balance: ₹1,500.0")

        # ====================================================================
        # TEST 3: Security Test - Tampered Signature Rejection
        # ====================================================================
        print("\n--- TEST 3: Security Rejection of Tampered Signature ---")
        tampered_res = await client.post(
            "/api/v1/billing/verify-payment",
            headers=godrej_headers,
            json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": "pay_fake_attacker_999",
                "razorpay_signature": "fake_invalid_hex_signature_1234567890abcdef",
                "amount_inr": 50000.0  # Attacker tries to inject ₹50,000
            }
        )
        assert tampered_res.status_code == 400
        assert "verification failed" in tampered_res.json()["detail"].lower()
        print("✅ Security Guard Passed: Fraudulent payment signature rejected with HTTP 400.")

        # ====================================================================
        # TEST 4: Payment Idempotency Guard (No Double-Crediting)
        # ====================================================================
        print("\n--- TEST 4: Payment Idempotency Guard ---")
        duplicate_res = await client.post(
            "/api/v1/billing/verify-payment",
            headers=godrej_headers,
            json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,  # Same payment ID again
                "razorpay_signature": valid_signature,
                "amount_inr": 1000.0
            }
        )
        assert duplicate_res.status_code == 200
        assert duplicate_res.json()["status"] == "payment_already_credited"
        assert duplicate_res.json()["new_balance_inr"] == 1500.0  # Balance stayed 1500, not 2500!
        print("✅ Idempotency Guard: Re-submitting payment did NOT double-credit wallet.")

        # ====================================================================
        # TEST 5: Server-to-Server Razorpay Webhook Ingestion
        # ====================================================================
        print("\n--- TEST 5: Razorpay Server Webhook Ingestion ---")
        webhook_payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_hook_auto_202",
                        "amount": 50000,  # ₹500 in paise
                        "currency": "INR",
                        "notes": {"workspace_id": 1}
                    }
                }
            }
        }
        hook_res = await client.post("/api/v1/billing/webhook", json=webhook_payload)
        assert hook_res.status_code == 200
        assert hook_res.json()["status"] == "webhook_processed"

        # Verify DB balance incremented by ₹500 via webhook
        async with AsyncSessionLocal() as db:
            ws_res = await db.execute(select(Workspace).where(Workspace.id == 1))
            ws = ws_res.scalar_one_or_none()
            assert ws.balance_inr == 2000.0  # ₹1500 + ₹500 = ₹2000
            print("✅ Server webhook processed asynchronously. Balance: ₹2,000.0")

        # ====================================================================
        # TEST 6: Wallet Summary & Transactions APIs
        # ====================================================================
        print("\n--- TEST 6: Wallet Summary & Transactions APIs ---")
        summary_res = await client.get("/api/v1/billing/wallet", headers=godrej_headers)
        assert summary_res.status_code == 200
        sum_data = summary_res.json()
        assert sum_data["balance_inr"] == 2000.0
        assert sum_data["estimated_minutes_remaining"] == 363  # 2000 / 5.50 = 363 mins
        assert sum_data["is_low_balance"] is False
        print(f"✅ Wallet Summary: Balance=₹{sum_data['balance_inr']}, Approx {sum_data['estimated_minutes_remaining']} calling minutes.")

        # Transactions Ledger list
        txn_res = await client.get("/api/v1/billing/transactions", headers=godrej_headers)
        assert txn_res.status_code == 200
        txns = txn_res.json()
        assert len(txns) == 2  # 1 verify-payment credit + 1 webhook credit
        assert txns[0]["transaction_type"] == "credit"
        print(f"✅ Transactions Ledger API returned {len(txns)} verified audit rows.")

    print("\n🎉 ALL TASK 2 RAZORPAY BILLING & SECURITY TESTS PASSED 100%!")


if __name__ == "__main__":
    asyncio.run(run_billing_tests())
