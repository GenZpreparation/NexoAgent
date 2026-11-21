"""
Test Database Engine & Multi-Tenant Relational Schema
Verifies table creation, async session commit, and multi-tenant foreign key relationships.
"""
import asyncio
from sqlalchemy import select
from app.core.database import engine, Base, AsyncSessionLocal
from app.models import Workspace, User, VoiceAgent, Call, CallLog


async def test_db_setup():
    print("🔄 Initializing database schema...")
    async with engine.begin() as conn:
        # Create all tables cleanly for test
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ All tables created successfully!")

    async with AsyncSessionLocal() as session:
        # 1. Create Workspace
        ws = Workspace(
            name="DLF CyberCity Properties",
            slug="dlf-cybercity",
            balance_inr=1500.0
        )
        session.add(ws)
        await session.flush()
        print(f"✅ Workspace created with ID={ws.id}")

        # 2. Create User for Workspace
        user = User(
            workspace_id=ws.id,
            email="sales@dlf.com",
            hashed_password="hashed_secret_password_sample",
            full_name="Rajesh Sharma",
            role="admin"
        )
        session.add(user)

        # 3. Create VoiceAgent for Workspace
        agent = VoiceAgent(
            workspace_id=ws.id,
            name="Pooja - Luxury Suites",
            system_prompt="Tu Pooja hai, DLF CyberCity ki property specialist.",
            first_message="Namaste! DLF CyberCity se Pooja bol rahi hu.",
            voice_provider="sarvam",
            voice_id="bulbul:v3/pooja"
        )
        session.add(agent)
        await session.flush()
        print(f"✅ VoiceAgent created with ID={agent.id}")

        # 4. Create Call & CallLog
        call = Call(
            call_sid="CA-DLF-TEST-9988",
            workspace_id=ws.id,
            agent_id=agent.id,
            customer_phone="+919876543210",
            status="completed",
            duration_seconds=125,
            cost_inr=16.50
        )
        session.add(call)
        await session.flush()

        log = CallLog(
            call_id=call.id,
            transcript="Agent: Namaste! User: Mujhe 3 BHK dekhna hai.",
            summary="Customer interested in 3 BHK flat in CyberCity.",
            sentiment="Positive",
            extracted_data={"budget": "1.5 Cr", "bhk": "3 BHK"}
        )
        session.add(log)
        await session.commit()
        print(f"✅ Call & CallLog saved with Call SID={call.call_sid}")

    # 5. Query and Verify
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Workspace).where(Workspace.slug == "dlf-cybercity"))
        fetched_ws = result.scalar_one_or_none()
        assert fetched_ws is not None
        assert fetched_ws.balance_inr == 1500.0

        calls_res = await session.execute(select(Call).where(Call.workspace_id == fetched_ws.id))
        all_calls = calls_res.scalars().all()
        assert len(all_calls) == 1
        assert all_calls[0].customer_phone == "+919876543210"
        assert all_calls[0].duration_seconds == 125
        assert all_calls[0].cost_inr == 16.50
        print("🎉 ALL DATABASE ASSERTIONS PASSED PERFECTLY!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(test_db_setup())
