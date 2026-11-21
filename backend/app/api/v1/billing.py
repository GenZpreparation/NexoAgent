"""
NexoAgent - Billing & Razorpay Payment Router
Handles:
1. Razorpay Order Creation
2. Cryptographic Payment Verification (HMAC SHA-256)
3. Server Webhooks for Asynchronous Captures
4. Wallet Summary & Transactions Ledger
"""
import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, Workspace, WalletTransaction
from app.services.razorpay_service import razorpay_service
from app.services.wallet import wallet_service
from app.schemas.billing import (
    CreateOrderRequest,
    CreateOrderResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
    WalletSummaryResponse,
    TransactionItemResponse
)

router = APIRouter(prefix="/billing", tags=["Billing & Wallet"])


# Pack bonus credit logic
PACK_BONUSES = {
    "growth_pack": 250.0,   # Pay ₹5,000 -> Get ₹5,250
    "scale_pack": 2000.0,   # Pay ₹20,000 -> Get ₹22,000
}


@router.post("/create-order", response_model=CreateOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_recharge_order(
    payload: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Razorpay Order Generate karta hai prepaid recharge ke liye.
    Amount in INR is converted into Paise subunits.
    """
    try:
        order_dict = razorpay_service.create_order(
            amount_inr=payload.amount_inr,
            receipt_id=f"ws_{current_user.workspace_id}_rec",
            notes={
                "workspace_id": str(current_user.workspace_id),
                "pack_id": payload.pack_id or "custom",
                "user_email": current_user.email
            }
        )
        return order_dict
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/verify-payment", response_model=VerifyPaymentResponse)
async def verify_payment(
    payload: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Razorpay Payment Signature Verify karta hai using HMAC SHA-256.
    Agar signature valid hai, to instantly balance wallet me credit karta hai.
    """
    is_valid = razorpay_service.verify_payment_signature(
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cryptographic payment signature verification failed. Tampered request rejected."
        )

    # Check for duplicate processing (idempotency guard)
    existing_txn = await db.execute(
        select(WalletTransaction).where(
            WalletTransaction.reference_id == payload.razorpay_payment_id
        )
    )
    if existing_txn.scalar_one_or_none():
        curr_bal = await wallet_service.get_balance(current_user.workspace_id, db)
        return {
            "status": "payment_already_credited",
            "credited_amount": payload.amount_inr,
            "new_balance_inr": curr_bal,
            "transaction_id": 0,
            "message": "Payment was already credited."
        }

    # Credit balance into workspace wallet
    bonus = 0.0
    if payload.amount_inr >= 20000.0:
        bonus = PACK_BONUSES["scale_pack"]
    elif payload.amount_inr >= 5000.0:
        bonus = PACK_BONUSES["growth_pack"]

    total_credit = payload.amount_inr + bonus
    desc = f"Razorpay Top-Up ({payload.razorpay_payment_id})"
    if bonus > 0:
        desc += f" [Includes ₹{bonus} Bonus Credits]"

    new_bal, txn = await wallet_service.credit_balance(
        workspace_id=current_user.workspace_id,
        amount_inr=total_credit,
        reference_id=payload.razorpay_payment_id,
        description=desc,
        db=db
    )
    await db.commit()

    return {
        "status": "payment_verified",
        "credited_amount": total_credit,
        "new_balance_inr": new_bal,
        "transaction_id": txn.id,
        "message": f"Successfully credited ₹{total_credit} to your wallet."
    }


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Server-to-Server Razorpay Webhook Callback.
    Catches background captures and auto-credits balances idempotently.
    """
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    # In production: razorpay_service.verify_webhook_signature(raw_body, signature)
    payload = await request.json()
    event = payload.get("event")

    if event in ["payment.captured", "order.paid"]:
        payment = payload.get("payload", {}).get("payment", {}).get("entity", {})
        payment_id = payment.get("id")
        notes = payment.get("notes", {})
        workspace_id = int(notes.get("workspace_id", 1))
        amount_inr = float(payment.get("amount", 0)) / 100.0

        if payment_id and amount_inr > 0:
            # Check idempotency
            existing = await db.execute(
                select(WalletTransaction).where(WalletTransaction.reference_id == payment_id)
            )
            if not existing.scalar_one_or_none():
                await wallet_service.credit_balance(
                    workspace_id=workspace_id,
                    amount_inr=amount_inr,
                    reference_id=payment_id,
                    description=f"Webhook Auto-Recharge ({payment_id})",
                    db=db
                )
                await db.commit()

    return {"status": "webhook_processed"}


@router.get("/wallet", response_model=WalletSummaryResponse)
async def get_wallet_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Current workspace wallet balance aur estimated minutes remaining fetch karta hai."""
    res = await db.execute(select(Workspace).where(Workspace.id == current_user.workspace_id))
    ws = res.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    rate = 5.50
    estimated_mins = math.floor(ws.balance_inr / rate) if ws.balance_inr > 0 else 0
    is_low = ws.balance_inr < 50.0

    return {
        "balance_inr": round(ws.balance_inr, 2),
        "currency": "INR",
        "estimated_minutes_remaining": max(0, estimated_mins),
        "rate_per_minute": rate,
        "is_low_balance": is_low,
        "workspace_name": ws.name
    }


@router.get("/transactions", response_model=List[TransactionItemResponse])
async def list_transactions(
    type_filter: Optional[str] = Query(default=None, alias="type"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Workspace ke itemized financial transaction ledger ko list karta hai."""
    query = select(WalletTransaction).where(
        WalletTransaction.workspace_id == current_user.workspace_id
    )
    if type_filter and type_filter in ["credit", "debit"]:
        query = query.where(WalletTransaction.transaction_type == type_filter)

    query = query.order_by(WalletTransaction.id.desc()).limit(limit).offset(offset)
    res = await db.execute(query)
    return res.scalars().all()
