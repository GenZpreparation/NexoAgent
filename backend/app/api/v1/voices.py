"""
NexoAgent - Voice Catalog Router
Returns the curated list of 7 Indian regional languages, Sarvam Bulbul and Deepgram voices
with sample preview clips and pricing tiers (Standard ₹5/min vs Premium ₹6.8/min) matching Outpero.
"""
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/voices", tags=["Voice Engine Catalog"])


class VoiceItem(BaseModel):
    id: str
    name: str
    language: str
    language_code: str
    provider: str
    gender: str
    accent: str
    tier: str  # standard (₹5.0/min) or premium (₹6.8/min)
    rate_per_min_inr: float
    description: str
    sample_audio_url: str


@router.get("", response_model=List[VoiceItem])
async def list_available_voices():
    """
    Outpero Voice Library: Returns all 7 Indian regional languages and voice personas.
    """
    return [
        VoiceItem(
            id="bulbul:v3/pooja",
            name="Pooja",
            language="Hindi",
            language_code="hi-IN",
            provider="sarvam",
            gender="Female",
            accent="Delhi / North Indian",
            tier="standard",
            rate_per_min_inr=5.0,
            description="Polite, clear real estate & sales qualifier with natural Indian intonation.",
            sample_audio_url="https://assets.nexoagent.com/audio/samples/pooja_hindi.mp3"
        ),
        VoiceItem(
            id="bulbul:v3/aman",
            name="Aman",
            language="Hinglish",
            language_code="hi-IN",
            provider="sarvam",
            gender="Male",
            accent="Urban Corporate Hinglish",
            tier="premium",
            rate_per_min_inr=6.8,
            description="Professional corporate tone for B2B demo booking and customer follow-up.",
            sample_audio_url="https://assets.nexoagent.com/audio/samples/aman_hinglish.mp3"
        ),
        VoiceItem(
            id="bulbul:v3/priya",
            name="Priya",
            language="Hindi",
            language_code="hi-IN",
            provider="sarvam",
            gender="Female",
            accent="Warm Customer Service",
            tier="standard",
            rate_per_min_inr=5.0,
            description="Empathetic, calm tone suited for customer support and feedback collection.",
            sample_audio_url="https://assets.nexoagent.com/audio/samples/priya_support.mp3"
        ),
        VoiceItem(
            id="bulbul:v3/rahul",
            name="Rahul",
            language="Marathi / Hindi",
            language_code="mr-IN",
            provider="sarvam",
            gender="Male",
            accent="Western India / Mumbai",
            tier="standard",
            rate_per_min_inr=5.0,
            description="Firm and respectful tone tailored for BFSI loan reminders and EMI collections.",
            sample_audio_url="https://assets.nexoagent.com/audio/samples/rahul_emi.mp3"
        ),
        VoiceItem(
            id="bulbul:v3/kavita",
            name="Kavita",
            language="Telugu / Tamil",
            language_code="te-IN",
            provider="sarvam",
            gender="Female",
            accent="South Indian Regional",
            tier="premium",
            rate_per_min_inr=6.8,
            description="Warm regional Southern accent for healthcare appointments and clinic verification.",
            sample_audio_url="https://assets.nexoagent.com/audio/samples/kavita_south.mp3"
        ),
        VoiceItem(
            id="aura-asteria-en",
            name="Ananya",
            language="Indian English",
            language_code="en-IN",
            provider="deepgram",
            gender="Female",
            accent="Bangalore / Pan-India English",
            tier="standard",
            rate_per_min_inr=5.0,
            description="Ultra-crisp English conversational voice for fintech onboarding and tech support.",
            sample_audio_url="https://assets.nexoagent.com/audio/samples/ananya_english.mp3"
        )
    ]
