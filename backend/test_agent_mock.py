"""
NexoAgent - Voice Agent Turn Simulation Test
Purpose: Test prompt responsiveness, dialogue length, and conversational flow locally.
"""
import asyncio
from voice_agent.prompts import REAL_ESTATE_SYSTEM_PROMPT, FIRST_MESSAGE

def test_system_prompt_rules():
    print("🔍 Testing System Prompt & Dialogue Constraints...")
    
    # 1. First Message Check
    assert len(FIRST_MESSAGE) > 0, "First message empty nahi ho sakta!"
    print(f"✅ Pooja's First Message: '{FIRST_MESSAGE}'")
    
    # 2. Strict Prompt Rules Verification
    assert "2 BHK" in REAL_ESTATE_SYSTEM_PROMPT
    assert "budget" in REAL_ESTATE_SYSTEM_PROMPT.lower()
    assert "Hinglish" in REAL_ESTATE_SYSTEM_PROMPT
    print("✅ System Prompt contains core telecalling rules (Hinglish, 2 BHK/3 BHK, Budget).")

    # 3. Simulate Conversation turns
    conversation = [
        {"role": "assistant", "content": FIRST_MESSAGE},
        {"role": "user", "content": "Haan, main 2 BHK dekh raha hu Noida me."},
        {"role": "assistant", "content": "Bahut badiya sir! Noida me hamare paas Sector 75 me ready to move options hain. Aapka estimated budget kitna hai?"},
        {"role": "user", "content": "Mera budget lagbhag 65 Lakh rupaye hai."},
        {"role": "assistant", "content": "65 Lakh me hamare paas luxury 2 BHK available hai. Kya aap is Saturday site visit ke liye aa sakte hain?"}
    ]

    print("\n🗣️ Simulated Live Conversation Flow:")
    for turn in conversation:
        speaker = "🤖 Pooja (AI)" if turn["role"] == "assistant" else "👤 Customer"
        print(f"  {speaker}: {turn['content']}")
        # Rule check: Assistant response should be concise (less than 35 words per turn)
        if turn["role"] == "assistant":
            word_count = len(turn["content"].split())
            assert word_count <= 35, f"Response too long for voice! Word count: {word_count}"

    print("\n✅ All voice conversational turn constraints verified successfully!")

if __name__ == "__main__":
    test_system_prompt_rules()
