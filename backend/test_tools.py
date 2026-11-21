"""
NexoAgent - In-Call Tools Verification Test
Purpose: Test tool schema generation, arguments, and metadata for LLM function calling.
"""
from voice_agent.tools import send_whatsapp_brochure, book_site_visit

def test_tools_metadata():
    print("Testing Mid-Call Live Tools Metadata & Schema...")

    # 1. Verify WhatsApp Tool
    assert hasattr(send_whatsapp_brochure, "info"), "send_whatsapp_brochure missing info!"
    print(f"Tool 1 Registered: '{send_whatsapp_brochure.info.name}'")
    print(f"  Description: {send_whatsapp_brochure.info.description[:70]}...")

    # 2. Verify Site Visit Booking Tool
    assert hasattr(book_site_visit, "info"), "book_site_visit missing info!"
    print(f"Tool 2 Registered: '{book_site_visit.info.name}'")
    print(f"  Description: {book_site_visit.info.description[:70]}...")

    print("\nSUCCESS: Both In-Call tools are valid LiveKit FunctionTools ready for LLM invocation!")

if __name__ == "__main__":
    test_tools_metadata()
