"""
NexoAgent - Wallet Transaction Model
Maintains an immutable financial audit ledger for all wallet recharges (credits)
and call deductions (debits) with mathematical opening/closing balance integrity.
"""
from typing import Optional
from sqlalchemy import String, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin


class WalletTransaction(Base, TimestampMixin):
    __tablename__ = "wallet_transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Transaction Type: "credit" (Recharge / Bonus) or "debit" (Call Deduction)
    transaction_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    
    # Financial Amounts in INR
    amount_inr: Mapped[float] = mapped_column(Float, nullable=False)
    opening_balance_inr: Mapped[float] = mapped_column(Float, nullable=False)
    closing_balance_inr: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Reference Tracking (Razorpay Payment ID or Carrier Call SID)
    reference_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Optional metadata or invoice notes
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    workspace = relationship("Workspace")
