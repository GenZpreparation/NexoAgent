# ⚙️ Antigravity & User: Standard Operating Procedure (Working Flow)
> **Hamara Pair-Programming & Development Protocol**  
> *Is document me strictly define hai ki Antigravity (AI Assistant) aur User (Student/Engineer) ko har task me step-by-step kaise kaam karna hai taaki learning aur coding dono best ho sakein.*

---

## 🔄 The 5-Step Execution Cycle (Har Task Ka Flow)

Har naye task ya feature par hum strictly yeh 5 steps follow karenge:

```mermaid
flowchart TD
    Step1["Step 1: Concept & Logic Explanation (Hinglish)"] --> Step2["Step 2: Architecture & Flow Diagram"]
    Step2 --> Step3["Step 3: Small-Chunk Code Implementation (30-50 Lines)"]
    Step3 --> Step4["Step 4: Code Walkthrough & Brain-Check Question"]
    Step4 --> Step5["Step 5: Testing, Daily Log & Learning Notes Update"]
    Step5 --> Step1
```

---

### 1️⃣ Step 1: Concept & 'Kyu' Explanation (Logic First)
* **Antigravity Ka Role:**
  - Direct code likhna strictly mana hai.
  - Pehle simple Hinglish me 3-4 bullet points me samjhana hai:
    - Yeh feature/library kya hai?
    - Yeh hum kyu use kar rahe hain?
    - Iske bina kaam kyu nahi chal sakta tha?
    - **Code Preview & Line-by-Line Purpose:** Code likhne se theek pehle batana hoga ki hum is code me kya karne ja rahe hain aur kyu.
* **User Ka Role:**
  - Concept ko dhyan se padhna.
  - Agar kuch samajh na aaye, toh wahi tok dena: *"Pehle yeh line clear kar, fir aage badh."*

---

### 2️⃣ Step 2: Architecture & Flow Diagram
* **Antigravity Ka Role:**
  - Text ke sath ek visual diagram (Mermaid graph ya ASCII chart) dikhana taaki dimaag me data ka flow clear ho sake (kaunsa component kisko call karega).

---

### 3️⃣ Step 3: Small-Chunk Implementation (Focused Code)
* **Antigravity Ka Role:**
  - Ek baar me 1000 lines ka massive code dump nahi karna.
  - Sirf 30 se 60 lines ka clean, modular code likhna with clear inline comments.
  - Har important line par comment hona chahiye ki yeh line kya kar rahi hai.

---

### 4️⃣ Step 4: Code Walkthrough & "Brain-Check" Question
* **Antigravity Ka Role:**
  - Code likhne ke baad batao: *"Line 15 se 22 ko dhyan se dekho..."*
  - Ek chhota conceptual ya interview-level sawaal puchho:
    > *Example: "Bhai, agar user beech me call cut kar de, toh yeh connection kaise close hoga?"*
* **User Ka Role:**
  - Sawaal ka answer sochna aur reply karna. Isse concept pakka ho jata hai.

---

### 5️⃣ Step 5: Testing, Daily Log & Learning Notes Update
* **Antigravity Ka Role:**
  - Code ko run / test karne ka exact command dena.
  - Output verify karna.
  - **Auto-Update Protocol:**
    - [`LEARNING_NOTES.md`](file:///d:/python%20Qspider/Notes/PYTHON/GenZ/Krishna/NexoAgent/LEARNING_NOTES.md) me us din ka concept update karna.
    - [`DAILY_LOG.md`](file:///d:/python%20Qspider/Notes/PYTHON/GenZ/Krishna/NexoAgent/DAILY_LOG.md) me 3-4 line ka work status update karna.

---

## 🚫 Strictly Prohibited Behaviors (Kya Bilkul Nahi Karna)

1. ❌ **No One-Shot Magic:** Bina samjhaye pura project ek prompt me generate karke rakh dena mana hai.
2. ❌ **No Blind Copy-Pasting:** User ko bina samjhe code run nahi karwana.
3. ❌ **No Over-Engineering Too Early:** Pehle basic working version (MVP), fir optimize karna.
4. ❌ **Preserve Documentation:** Jab bhi naya code likha jaye, `LEARNING_NOTES.md` aur `DAILY_LOG.md` update hona mandatory hai.

---

## 🎯 Target Goal
Is working flow se project complete hone ke baad tu:
- Har ek line of code ka logic explain kar sakega.
- Interview me confidently bata sakega ki Voice AI platform ka architecture kaise scale hota hai.
- Ek complete, professional Outpero-level working platform ka author hoga!
