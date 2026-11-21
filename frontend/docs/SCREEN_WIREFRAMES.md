# 🖼️ NexoAgent - UI/UX Screen Wireframes & Component Specs

Is document me NexoAgent SaaS platform ke saare **core pages ke visual wireframes, component hierarchy, aur states** define kiye gaye hain taaki frontend developer ko exact look-and-feel samajh aa sake.

---

## 🖥️ Screen 1: Public Landing Page (`/`)

### Visual ASCII Wireframe:
```text
+-----------------------------------------------------------------------------------------------+
|  🎙️ NexoAgent                 Features   Pricing   Solutions   Docs            [Login] [Get ₹500 Free] |
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|          ⭐ The #1 Indian Regional Voice AI Platform for High-Volume Telecalling               |
|                                                                                               |
|            Automate 10,000 Outbound Sales Calls with Human-Like Speech                        |
|                     Zero Stutter. Sub-500ms Speed. Hindi & 6 Regional Accents.               |
|                                                                                               |
|                 [ 🎙️ Talk to Pooja Live (Free Demo) ]     [ Book Enterprise Demo ]            |
|                                                                                               |
|     +-----------------------------------------------------------------------------------+     |
|     |  🎧 LIVE VOICE ACCENT SAMPLER (Click to Play Demo Voice):                         |     |
|     |  [▶️ Pooja (Delhi Hindi)]  [▶️ Aman (Hinglish)]  [▶️ Priya (Support)]  [▶️ Telugu]  |     |
|     +-----------------------------------------------------------------------------------+     |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|     💰 INTERACTIVE ROI & SAVINGS CALCULATOR:                                                  |
|     How many human telecallers do you employ?  [===========O===========]  10 Agents           |
|     Average monthly salary per agent:          [======O================]  ₹22,000 / month     |
|                                                                                               |
|     +-----------------------------------------------------------------------------------+     |
|     |  Human Call Center Monthly Cost:  ₹2,20,000 / mo                                  |     |
|     |  NexoAgent AI Cost (Same Volume): ₹38,500 / mo                                    |     |
|     |  🚀 YOUR ANNUAL NET SAVINGS:     ₹21,78,000 / year (82% Reduction!)              |     |
|     +-----------------------------------------------------------------------------------+     |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
|  Features Grid:                                                                               |
|  [ ⚡ Sub-500ms Latency ]   [ 🛡️ TRAI & DND Auto-Scrubbing ]  [ 📩 Instant WhatsApp Brochure ] |
|  [ 🔄 Sub-30s Meta Ads Call] [ 🎙️ True Human Barge-in / Interrupt ] [ 📊 Groq Post-Call AI ] |
+-----------------------------------------------------------------------------------------------+
```

---

## 🖥️ Screen 2: Authenticated SaaS Shell Layout (`/dashboard/*`)

### Layout Hierarchy:
```text
+-----------------------------------------------------------------------------------------------+
| 🎙️ NexoAgent | 🏢 DLF CyberCity [v] | 🟢 Live Server Online | 💳 Balance: ₹489.00 [+ Recharge] | (Profile)|
+--------------+--------------------------------------------------------------------------------+
|              |                                                                                |
| 📊 Overview  |                                                                                |
| 🎙️ AI Agents |                  ( Main Dynamic Page Content Renders Here )                    |
| 📢 Campaigns |                                                                                |
| 📞 Call Logs |                                                                                |
| 🔗 Connect   |                                                                                |
| 💳 Billing   |                                                                                |
| ⚙️ Settings  |                                                                                |
|              |                                                                                |
| [v1.0.0]     |                                                                                |
+--------------+--------------------------------------------------------------------------------+
```

---

## 🖥️ Screen 3: Dashboard Overview (`/dashboard`)

```text
+-----------------------------------------------------------------------------------------------+
|  📊 Dashboard Overview                                                      [ + New Campaign ] |
+-----------------------------------------------------------------------------------------------+
|  [ 💳 ₹489.00 Balance ]   [ ⏱️ 142 Total Mins ]   [ 📞 84 Calls Placed ]   [ 🎯 78% Pick-up ] |
+-----------------------------------------------------------------------------------------------+
|                                               |                                               |
|  📈 Daily Calling Volume (Last 7 Days)        |  🎯 Lead Sentiment & Qualification Score      |
|  [ Bar Chart: Recharts ]                      |  [ Donut Chart: 65% Hot | 25% Warm | 10% Cold]|
|                                               |                                               |
+-----------------------------------------------------------------------------------------------+
|  ⚡ Recent Calls Feed:                                                                        |
|  Time      Customer         Agent     Duration    Cost      Sentiment     Recording           |
|  12:30 PM  +91 98765 43210  Pooja     1m 15s      ₹11.00    🔥 Hot Lead   [ ▶️ Play ] [View]  |
|  12:28 PM  +91 98111 22333  Pooja     0m 00s      ₹0.00     🟡 Busy       [ - ]       [View]  |
+-----------------------------------------------------------------------------------------------+
```

---

## 🖥️ Screen 4: Voice Agent Studio (`/dashboard/agents/[id]`)

```text
+-----------------------------------------------------------------------------------------------+
|  🎙️ Voice Agent Studio: "Pooja - Real Estate Specialist"                    [ Save Changes ]   |
+------------------------------------------------------+----------------------------------------+
|  LEFT PANEL: Agent Persona Configuration             | RIGHT PANEL: Live In-Browser Testing   |
+------------------------------------------------------+----------------------------------------+
|  Agent Name: [ Pooja - Real Estate Specialist      ] |                                        |
|                                                      |  Test your prompt live before dialing: |
|  Voice Engine Provider:                              |                                        |
|  (o) Sarvam AI Bulbul (Hindi) [▶️ Preview]            |  +----------------------------------+  |
|  ( ) Deepgram Nova-2          ( ) ElevenLabs         |  |                                  |  |
|                                                      |  |  [ 🎙️ Click to Speak with Pooja ] |  |
|  First Spoken Greeting (Upon Customer Pickup):       |  |                                  |  |
|  [ "Namaste! DLF CyberCity se Pooja bol rahi hu..." ]|  |  Audio Stream: ● Connected       |  |
|                                                      |  |  Latency: 420ms | VAD: Active    |  |
|  System Prompt / Script Instructions:                |  +----------------------------------+  |
|  +------------------------------------------------+  |                                        |
|  | Tu Pooja hai, DLF CyberCity ki property        |  |  Live WebRTC Conversation Log:         |
|  | consultant. Customer se polite Hindi me baat   |  |  Bot: "Namaste! DLF se Pooja..."       |
|  | kar. Budget aur 2 BHK/3 BHK requirement puch.  |  |  User: "Mujhe 3 BHK dekhna hai"        |
|  +------------------------------------------------+  |  Bot: "Bilkul sir, kis tower me?"      |
|                                                      |                                        |
|  Temperature (Creativity Slider): [===O====] 0.3     |                                        |
|                                                      |                                        |
|  In-Call Automation Tools:                           |                                        |
|  [x] Send WhatsApp Brochure mid-call                 |                                        |
|  [x] Book Site Visit on Calendar                     |                                        |
+------------------------------------------------------+----------------------------------------+
```

---

## 🖥️ Screen 5: Bulk Campaign & CSV Ingestion Wizard (`/dashboard/campaigns`)

```text
+-----------------------------------------------------------------------------------------------+
|  📢 New Outbound Calling Campaign                                                             |
+-----------------------------------------------------------------------------------------------+
|  1. Campaign Name:     [ Gurgaon HNI Investors - Nov 2026 ]                                   |
|  2. Assign Agent:      [ Pooja - Real Estate Specialist [v] ]                                 |
|  3. Concurrency Limit: [=========O==============] 10 Parallel Calls Simultaneously           |
|  4. TRAI Calling Window: [x] Enforce 10:00 AM - 07:00 PM IST (Auto-Pause after 7 PM)           |
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|  📁 UPLOAD LEADS CSV / EXCEL FILE:                                                            |
|  +-----------------------------------------------------------------------------------------+  |
|  |             📂 Drag and Drop Leads CSV here, or Browse Computer                         |  |
|  |                   Supported columns: Name, Phone, City, Budget                          |  |
|  +-----------------------------------------------------------------------------------------+  |
|                                                                                               |
|  📊 Pre-Dial Scrubbing Summary (Real-Time):                                                   |
|  [ 4,800 Clean Leads Ready ✅ ]   [ 150 DND Scrubbed 🚫 ]   [ 50 Duplicates Skipped ⚠️ ]     |
|                                                                                               |
|  [ Cancel ]                                                        [ 🚀 Launch Campaign ]     |
+-----------------------------------------------------------------------------------------------+
```

---

## 🖥️ Screen 6: Call Ledger & Slide-Over Detail Drawer (`/dashboard/calls`)

```text
+-------------------------------------------------------+---------------------------------------+
|  MAIN PAGE: Paginated Call Table                      | SLIDE-OVER DRAWER: Call Details #1    |
|  Filter: [All Agents [v]] [Status: Completed [v]]     +---------------------------------------+
|                                                       | 📞 Call with +91 98765 43210          |
|  Customer Phone    Duration   Cost    Lead Score      | Date: 11 Nov 2026, 12:30 PM           |
|  +91 98765 43210   1m 15s     ₹11.00  🔥 Hot Lead >   | Status: 🟢 Completed (Billed ₹11.00)  |
|  +91 98111 22333   0m 45s     ₹5.50   🟡 Warm Lead    | Duration: 75 seconds (2 mins pulse)   |
|  +91 99988 77766   0m 00s     ₹0.00   ⚪ Busy         +---------------------------------------+
|                                                       | 🎧 Audio Recording:                   |
|                                                       | [▶️] | | | | | | | | | | 0:42 / 1:15  |
|                                                       +---------------------------------------+
|                                                       | 🤖 Groq AI Summary:                   |
|                                                       | "Customer interested in 3 BHK flat.   |
|                                                       | Budget is ₹2.4 Cr. Agreed for site    |
|                                                       | visit on Sunday afternoon."           |
|                                                       +---------------------------------------+
|                                                       | 🎯 Extracted Variables:               |
|                                                       | • Budget: ₹2.4 Crore                  |
|                                                       | • Requirement: 3 BHK                  |
|                                                       | • Visit Date: This Sunday             |
|                                                       +---------------------------------------+
|                                                       | 📩 WhatsApp Status:                   |
|                                                       | ✅ Brochure Sent (wamid.038bf...)     |
|                                                       +---------------------------------------+
|                                                       | 💬 Full Transcript:                   |
|                                                       | Agent: Namaste! DLF se Pooja bol...   |
|                                                       | User: Haan 3 BHK ka price kya hai?    |
+-------------------------------------------------------+---------------------------------------+
```

---

## 🖥️ Screen 7: Prepaid Wallet & Razorpay Recharge (`/dashboard/billing`)

```text
+-----------------------------------------------------------------------------------------------+
|  💳 Prepaid Calling Wallet & Billing                                                          |
+-----------------------------------------------------------------------------------------------+
|  +-----------------------------------------------------------------------------------------+  |
|  |  CURRENT BALANCE:   ₹489.00                                                             |  |
|  |  Estimated Talk Time: ~88 Minutes remaining (@ ₹5.50/min)                               |  |
|  |  [ + Recharge Wallet via UPI / Cards ]                                                  |  |
|  +-----------------------------------------------------------------------------------------+  |
|                                                                                               |
|  ⚡ Quick 1-Click Recharge Packs:                                                             |
|  +----------------------+  +----------------------+  +----------------------+                 |
|  |  Starter Pack        |  |  Growth Pack 🔥      |  |  Enterprise Pack     |                 |
|  |  ₹1,000              |  |  ₹5,000              |  |  ₹20,000             |                 |
|  |  ~180 Minutes        |  |  ~950 Minutes        |  |  ~4,000 Minutes      |                 |
|  |  [ Buy with UPI ]    |  |  [ Buy with UPI ]    |  |  [ Buy with UPI ]    |                 |
|  +----------------------+  +----------------------+  +----------------------+                 |
|                                                                                               |
|  📜 Itemized Usage & Financial Statement:                                                     |
|  Date        Call SID        Phone Number     Duration   Rate      Deduction   Closing Balance|
|  11 Nov 2026 CA-DLF-001      +91 98765 43210  75s (2min) ₹5.50/min -₹11.00     ₹489.00        |
|  11 Nov 2026 CA-DLF-002      +91 98111 22333  0s (Busy)  ₹0.00     ₹0.00       ₹500.00        |
+-----------------------------------------------------------------------------------------------+
```
