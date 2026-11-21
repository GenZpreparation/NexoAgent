"""
NexoAgent - Post-Call AI Intelligence & Structured Extraction Service
Analyzes telecalling conversations using Groq LLaMA/GPT to extract:
1. Two-line concise summary
2. Lead Sentiment (Positive, Neutral, Negative, Busy)
3. Lead Score (Hot, Warm, Cold)
4. Key Variables (Budget, BHK, Location, Visit Date)
5. Action Items (e.g. Send WhatsApp brochure, schedule visit)
"""
import os
import json
import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import openai
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """You are an expert AI Telecalling Analyst for NexoAgent SaaS platform.
Analyze the provided phone call transcript between the AI Agent and the customer.
Extract structured intelligence strictly following this JSON schema:
{
  "summary": "2-sentence conversational recap of what was discussed and agreed upon.",
  "sentiment": "Positive" | "Neutral" | "Negative" | "Busy",
  "lead_interest": "Hot" | "Warm" | "Cold",
  "extracted_variables": {
    "budget": "extracted budget string or null",
    "bhk": "e.g. 2 BHK, 3 BHK, Villa or null",
    "preferred_location": "city or area name or null",
    "visit_date": "appointment or site visit day/time or null"
  },
  "action_items": ["List of next steps, e.g. Send WhatsApp brochure, schedule visit"]
}
Rules:
1. If the customer is eager, specifies budget and agrees to a visit -> lead_interest: "Hot", sentiment: "Positive".
2. If customer is abusive, angry or demands to be removed -> lead_interest: "Cold", sentiment: "Negative".
3. Return ONLY pure valid JSON. No markdown code blocks, no surrounding text.
"""


class CallAnalyticsResult(BaseModel):
    summary: str
    sentiment: str = Field(..., pattern="^(Positive|Neutral|Negative|Busy)$")
    lead_interest: str = Field(..., pattern="^(Hot|Warm|Cold)$")
    extracted_variables: Dict[str, Any] = Field(default_factory=dict)
    action_items: List[str] = Field(default_factory=list)


class PostCallIntelligenceService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        self.client = openai.AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )
        self.model = "openai/gpt-oss-20b"

    async def analyze_transcript(self, transcript: str) -> CallAnalyticsResult:
        """
        Takes raw multi-turn conversation transcript and runs high-speed
        Groq LLM extraction.
        """
        if not transcript or len(transcript.strip()) < 10:
            return CallAnalyticsResult(
                summary="Call was too short or no audio was detected.",
                sentiment="Neutral",
                lead_interest="Cold",
                extracted_variables={},
                action_items=[]
            )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Call Transcript:\n{transcript}"}
                ],
                temperature=0.1
            )
            raw_content = response.choices[0].message.content or ""
            cleaned = self._clean_json_output(raw_content)
            data = json.loads(cleaned)
            return CallAnalyticsResult.model_validate(data)

        except Exception as e:
            # Fallback resilience: agar LLM me formatting glitch ho, graceful fallback return karo
            print(f"⚠️ Post-call intelligence parsing error: {e}")
            return CallAnalyticsResult(
                summary="Conversation completed. Detailed intelligence parsing was skipped.",
                sentiment="Neutral",
                lead_interest="Warm",
                extracted_variables={},
                action_items=["Follow up manually"]
            )

    def _clean_json_output(self, content: str) -> str:
        """Strips markdown code fences and whitespace."""
        content = content.strip()
        if content.startswith("```"):
            content = re.sub(r"^```[a-zA-Z]*\n?", "", content)
            content = re.sub(r"\n?```$", "", content)
        return content.strip()


intelligence_service = PostCallIntelligenceService()
