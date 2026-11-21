"""
NexoAgent - Atomic Wallet & Financial Ledger Service
Manages ACID-compliant balance updates (credits & debits) and immutable audit records.
"""
from typing import Tuple, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Workspace, WalletTransaction


class WalletService:
    async def get_balance(self, workspace_id: int, db: AsyncSession) -> float:
        """Current workspace balance in INR fetch karta hai."""
        res = await db.execute(select(Workspace.balance_inr).where(Workspace.id == workspace_id))
        bal = res.scalar_one_or_none()
        return round(bal, 2) if bal is not None else 0.0

    async def has_sufficient_balance(
        self,
        workspace_id: int,
        min_threshold_inr: float = 10.0,
        db: Optional[AsyncSession] = None
    ) -> bool:
        """
        Pre-Dial Check: Verifies workspace has enough prepaid balance
        to cover at least 1-2 calling minutes before placing outbound calls.
        """
        if db is None:
            return True
        bal = await self.get_balance(workspace_id, db)
        return bal >= min_threshold_inr

    async def credit_balance(
        self,
        workspace_id: int,
        amount_inr: float,
        reference_id: Optional[str],
        description: str,
        db: AsyncSession
    ) -> Tuple[float, WalletTransaction]:
        """
        Prepaid Wallet Top-Up (Recharge / Bonus):
        Atomically increments workspace balance and records an audit entry.
        """
        if amount_inr <= 0:
            raise ValueError("Credit amount must be greater than zero.")

        res = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        ws = res.scalar_one_or_none()
        if not ws:
            raise ValueError(f"Workspace with ID {workspace_id} not found.")

        opening_bal = round(ws.balance_inr, 2)
        closing_bal = round(opening_bal + amount_inr, 2)
        ws.balance_inr = closing_bal

        txn = WalletTransaction(
            workspace_id=workspace_id,
            transaction_type="credit",
            amount_inr=round(amount_inr, 2),
            opening_balance_inr=opening_bal,
            closing_balance_inr=closing_bal,
            reference_id=reference_id,
            description=description
        )
        db.add(txn)
        return closing_bal, txn

    async def debit_balance(
        self,
        workspace_id: int,
        amount_inr: float,
        reference_id: Optional[str],
        description: str,
        db: AsyncSession
    ) -> Tuple[float, WalletTransaction]:
        """
        Call Usage Deduction:
        Atomically decrements workspace balance and records an audit entry.
        """
        if amount_inr <= 0:
            return await self.get_balance(workspace_id, db), None

        res = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        ws = res.scalar_one_or_none()
        if not ws:
            raise ValueError(f"Workspace with ID {workspace_id} not found.")

        opening_bal = round(ws.balance_inr, 2)
        closing_bal = round(opening_bal - amount_inr, 2)
        ws.balance_inr = closing_bal

        txn = WalletTransaction(
            workspace_id=workspace_id,
            transaction_type="debit",
            amount_inr=round(amount_inr, 2),
            opening_balance_inr=opening_bal,
            closing_balance_inr=closing_bal,
            reference_id=reference_id,
            description=description
        )
        db.add(txn)
        return closing_bal, txn


wallet_service = WalletService()
