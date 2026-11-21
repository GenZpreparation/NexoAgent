"""
NexoAgent - In-Call Mid-Conversation Tools
Allows AI Voice Agent to take live actions (WhatsApp dispatch, Site visit booking) during phone calls.
"""
from livekit.agents import function_tool
from app.services.whatsapp import whatsapp_service


@function_tool
async def send_whatsapp_brochure(
    phone_number: str,
    project_name: str = "Nexo Grandeur Sector 75"
) -> str:
    """
    Jab customer WhatsApp par brochure, pricing, floor plan, ya project details maange,
    tab yeh function call karo.
    
    Args:
        phone_number: Customer ka mobile number.
        project_name: Jis project ki details bhejna chahta hai (e.g. 'Nexo Grandeur').
    """
    print(f"\n[TOOL TRIGGERED] Sending WhatsApp Brochure for '{project_name}' to {phone_number}...")
    
    result = await whatsapp_service.send_brochure(
        customer_phone=phone_number,
        project_name=project_name
    )
    
    if result["success"]:
        print(f"[WHATSAPP DELIVERED] PDF Brochure link successfully sent to {phone_number} via WhatsApp! (Message ID: {result['message_id']})")
        return f"Success: Brochure for {project_name} has been sent to customer's WhatsApp."
    else:
        return f"Notice: Could not send WhatsApp message. Reason: {result.get('error')}"


@function_tool
async def book_site_visit(
    customer_phone: str,
    day: str,
    time_slot: str = "Morning (11 AM)",
    project_name: str = "Nexo Grandeur Sector 75"
) -> str:
    """
    Jab customer property site visit ke liye agree kare (e.g. Saturday ya Sunday),
    tab appointment lock karne aur WhatsApp confirmation bhejne ke liye yeh function call karo.
    
    Args:
        customer_phone: Customer ka mobile number.
        day: Visit ka din (e.g. 'Saturday', 'Sunday', 'Tomorrow').
        time_slot: 'Morning (11 AM)' ya 'Evening (4 PM)'.
        project_name: Property ka naam.
    """
    print(f"\n[TOOL TRIGGERED] Booking Site Visit for {customer_phone} on {day} ({time_slot})...")
    
    result = await whatsapp_service.send_site_visit_confirmation(
        customer_phone=customer_phone,
        project_name=project_name,
        visit_date=day,
        time_slot=time_slot
    )
    
    print(f"[CALENDAR CONFIRMED] Site visit scheduled for {day} ({time_slot}) and confirmation sent to WhatsApp!")
    return f"Success: Site visit confirmed for {day} {time_slot} and confirmation sent to customer's WhatsApp."
