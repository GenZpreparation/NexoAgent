"""
NexoAgent - Bulk Campaign Engine & Pacing Dispatcher
Handles:
1. CSV/JSON lead ingestion with E.164 sanitization and deduplication
2. TRAI Regulatory Compliance (DND scrubbing & 10 AM - 7 PM calling window)
3. Pacing dispatcher (controls concurrency to avoid choking telecom trunks)
"""
import io
import csv
from datetime import datetime, time, timezone, timedelta
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Campaign, Lead, VoiceAgent
from app.services.telephony import telephony_service

# India Standard Time (UTC + 5:30)
IST = timezone(timedelta(hours=5, minutes=30))


class CampaignEngine:
    @staticmethod
    def is_within_trai_calling_hours(dt: Optional[datetime] = None) -> bool:
        """
        TRAI (Telecom Regulatory Authority of India) Rule:
        Outbound telemarketing calls are strictly permitted only between
        10:00 AM (10:00) and 07:00 PM (19:00) IST.
        """
        now_ist = (dt or datetime.now(timezone.utc)).astimezone(IST).time()
        start_time = time(10, 0, 0)
        end_time = time(19, 0, 0)
        return start_time <= now_ist <= end_time

    @staticmethod
    def is_dnd_registered(phone_number: str) -> bool:
        """
        DND (Do-Not-Disturb) Scrubber.
        Checks against registry. In real-world, queries TRAI NDNC API.
        Numbers ending with '0000' or in test blacklist are flagged as DND.
        """
        return phone_number.endswith("0000") or "DND" in phone_number

    async def ingest_leads_from_csv(
        self,
        campaign_id: int,
        workspace_id: int,
        csv_content: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Parses CSV data, sanitizes phone numbers, removes duplicate leads,
        flags DND numbers, and stores clean leads into the database.
        """
        reader = csv.DictReader(io.StringIO(csv_content))
        added_count = 0
        duplicate_count = 0
        dnd_blocked_count = 0
        invalid_count = 0
        seen_phones = set()

        # Query existing phones in this campaign to prevent duplicates
        existing_res = await db.execute(
            select(Lead.phone_number).where(
                Lead.campaign_id == campaign_id,
                Lead.workspace_id == workspace_id
            )
        )
        for p in existing_res.scalars().all():
            seen_phones.add(p)

        leads_to_insert = []
        for row in reader:
            # Flexible column header mapping (name, full_name, phone, mobile, contact)
            name = row.get("name") or row.get("full_name") or row.get("Customer") or "Customer"
            raw_phone = row.get("phone") or row.get("phone_number") or row.get("mobile") or row.get("contact")
            city = row.get("city") or row.get("location") or None

            if not raw_phone:
                invalid_count += 1
                continue

            try:
                clean_phone = telephony_service.sanitize_phone_number(raw_phone)
            except ValueError:
                invalid_count += 1
                continue

            # Duplicate check
            if clean_phone in seen_phones:
                duplicate_count += 1
                continue
            seen_phones.add(clean_phone)

            # DND Scrubbing Check
            is_dnd = self.is_dnd_registered(clean_phone)
            status_val = "dnd_blocked" if is_dnd else "pending"
            if is_dnd:
                dnd_blocked_count += 1
            else:
                added_count += 1

            lead = Lead(
                campaign_id=campaign_id,
                workspace_id=workspace_id,
                full_name=name.strip(),
                phone_number=clean_phone,
                city=city.strip() if city else None,
                custom_data={k: v for k, v in row.items() if k not in ["name", "phone", "mobile", "contact", "city"]},
                status=status_val
            )
            leads_to_insert.append(lead)

        db.add_all(leads_to_insert)

        # Update campaign total_leads count
        camp_res = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
        campaign = camp_res.scalar_one_or_none()
        if campaign:
            campaign.total_leads += added_count + dnd_blocked_count

        await db.commit()

        return {
            "total_rows_processed": len(leads_to_insert) + duplicate_count + invalid_count,
            "leads_added": added_count,
            "dnd_scrubbed_blocked": dnd_blocked_count,
            "duplicates_skipped": duplicate_count,
            "invalid_numbers_skipped": invalid_count
        }

    async def dispatch_next_batch(
        self,
        campaign_id: int,
        workspace_id: int,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Pacing Engine: Pulls up to `concurrency_limit` pending leads
        and initiates outbound calls without overwhelming the SIP trunk.
        """
        # 1. Fetch Campaign
        camp_res = await db.execute(
            select(Campaign).where(
                Campaign.id == campaign_id,
                Campaign.workspace_id == workspace_id
            )
        )
        campaign = camp_res.scalar_one_or_none()
        if not campaign or campaign.status not in ["running", "draft"]:
            return {"dispatched": 0, "status": "campaign_not_active"}

        # 2. Check active calls count (currently dialing)
        active_res = await db.execute(
            select(Lead).where(
                Lead.campaign_id == campaign_id,
                Lead.status == "dialing"
            )
        )
        active_count = len(active_res.scalars().all())
        slots_available = max(0, campaign.concurrency_limit - active_count)

        if slots_available <= 0:
            return {"dispatched": 0, "status": "concurrency_limit_reached", "active_calls": active_count}

        # 3. Pull next pending leads
        pending_res = await db.execute(
            select(Lead)
            .where(
                Lead.campaign_id == campaign_id,
                Lead.status == "pending"
            )
            .limit(slots_available)
        )
        pending_leads = pending_res.scalars().all()

        dispatched = []
        for lead in pending_leads:
            # Place outbound call via telephony service
            call_result = telephony_service.initiate_outbound_call(lead.phone_number)
            lead.status = "dialing"
            lead.call_sid = call_result.get("call_id")
            lead.last_called_at = datetime.now(timezone.utc)
            lead.retry_count += 1
            campaign.dialed_leads += 1
            dispatched.append({
                "lead_id": lead.id,
                "name": lead.full_name,
                "phone": lead.phone_number,
                "call_sid": lead.call_sid
            })

        await db.commit()

        return {
            "dispatched_count": len(dispatched),
            "remaining_slots": slots_available - len(dispatched),
            "dispatched_leads": dispatched
        }


campaign_engine = CampaignEngine()
