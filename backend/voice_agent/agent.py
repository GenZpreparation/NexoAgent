"""
NexoAgent - Ultra Fast Low-Latency Voice Pipeline
Purpose: Zero-error, high-speed conversation using Groq's active conversational model + Sarvam Desi Voice.
"""
import os
from dotenv import load_dotenv
from livekit.agents import Agent, AgentSession, AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.plugins import deepgram, groq, silero, sarvam

from voice_agent.prompts import REAL_ESTATE_SYSTEM_PROMPT, FIRST_MESSAGE
from voice_agent.tools import send_whatsapp_brochure, book_site_visit

# 1. Environment variables load karo (.env file se)
load_dotenv()

class TelecallerAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions=REAL_ESTATE_SYSTEM_PROMPT,
            tools=[send_whatsapp_brochure, book_site_visit]
        )

    async def on_enter(self) -> None:
        """
        Room me connect hote hi warm human greeting bolna hai.
        """
        print(f"🎙️ [POOJA HUMAN GREETING]: {FIRST_MESSAGE}")
        self.session.say(FIRST_MESSAGE, allow_interruptions=True)

async def entrypoint(ctx: JobContext):
    """
    Jab bhi koi user room join karega (browser ya SIP phone), yeh function execute hoga.
    """
    print(f"📞 Call connected! Room ID: {ctx.room.name}")

    # Auto-subscribe: User ke audio track ko automatically sunna shuru karo
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Voice Session initialize karo (Verified Active Model on Groq)
    session = AgentSession(
        vad=silero.VAD.load(
            min_speech_duration=0.05,
            min_silence_duration=0.30 # >= 0.25s TurnDetector rule
        ),
        stt=deepgram.STT(
            model="nova-2-general",
            language="hi" # Enable Hindi / Hinglish acoustic model
        ),
        llm=groq.LLM(
            model="openai/gpt-oss-20b", # Live verified on Groq!
            temperature=0.6
        ),
        tts=sarvam.TTS(
            target_language_code="hi-IN",
            model="bulbul:v3",
            speaker="pooja",
            pace=1.05,
            min_buffer_size=30,
            max_chunk_length=80
        ),
        min_endpointing_delay=0.15,
        max_endpointing_delay=0.45
    )

    # Agent ko room ke sath start karo
    agent = TelecallerAgent()
    await session.start(agent, room=ctx.room)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
