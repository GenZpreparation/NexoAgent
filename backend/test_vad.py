"""
NexoAgent - VAD (Voice Activity Detection) Test Script
Purpose: Verify that Silero VAD loads locally with low-latency parameters.
"""
from livekit.plugins import silero

def test_vad_initialization():
    print("⏳ Loading Silero VAD model into memory...")
    
    # 1. Silero VAD ko load karo
    # min_silence_duration: kitne seconds ki silence ke baad turn complete maana jaye (0.35s = 350ms)
    vad = silero.VAD.load(
        min_speech_duration=0.05,    # Kam se kam 50ms ki speech ho tabhi trigger ho (noise ignore karne ke liye)
        min_silence_duration=0.35    # 350ms chup rehne par bolna band maano (Low latency)
    )
    
    print("✅ Silero VAD loaded successfully!")
    print(f"📊 Configured parameters: min_silence={0.35}s, min_speech={0.05}s")
    return vad

if __name__ == "__main__":
    test_vad_initialization()
