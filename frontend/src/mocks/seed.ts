/**
 * Deterministic DEMO data. Everything here is fictional and exists only so the
 * UI can be explored without a backend. It is never sent anywhere.
 * Dates are generated relative to "now" so the demo always looks current.
 */
import type {
  Campaign,
  CampaignLead,
  Channel,
  Conversation,
  Employee,
  InstantLeadSettings,
  Lead,
  LeadOutcome,
  LeadSource,
  Member,
  Notification,
  QueueItem,
  Temperature,
  Transaction,
  TranscriptTurn,
} from "@/types/domain";

// Small seeded PRNG (mulberry32) so the demo is stable across reloads.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HOUR = 3600_000;
const DAY = 24 * HOUR;

const FIRST = ["Aarav", "Vivaan", "Ananya", "Diya", "Ishaan", "Kabir", "Saanvi", "Aditi", "Rohit", "Neha", "Arjun", "Priya", "Karan", "Sneha", "Vikram", "Riya", "Manish", "Pooja", "Siddharth", "Kavita", "Rahul", "Meera", "Nikhil", "Tanvi", "Harsh", "Ishita", "Varun", "Simran", "Deepak", "Aisha"];
const LAST = ["Sharma", "Verma", "Iyer", "Reddy", "Nair", "Gupta", "Mehta", "Kapoor", "Joshi", "Patel", "Singh", "Chopra", "Banerjee", "Rao", "Kulkarni", "Malhotra", "Bose", "Menon"];
const CITIES = ["Gurugram", "Noida", "Pune", "Bengaluru", "Mumbai", "Hyderabad", "Jaipur", "Lucknow", "Chennai", "Ahmedabad"];

interface EmployeeSeed {
  id: string;
  name: string;
  role: string;
  mode: Employee["callingMode"];
  status: Employee["status"];
  language: string;
  voiceId: string;
  template: string;
  first: string;
  capture: (r: () => number) => Record<string, string>;
  transcript: (name: string, captured: Record<string, string>) => TranscriptTurn[];
  summary: (name: string, captured: Record<string, string>) => string;
}

const pick = <T,>(r: () => number, xs: T[]): T => xs[Math.floor(r() * xs.length)];

const EMPLOYEES: EmployeeSeed[] = [
  {
    id: "emp_pooja",
    name: "Pooja",
    role: "Real estate · site-visit booking",
    mode: "instant",
    status: "active",
    language: "hi-IN",
    voiceId: "bulbul:v3/pooja",
    template: "real-estate",
    first: "Namaste! Main Pooja bol rahi hoon, aapne abhi humare 3 BHK project ke baare mein enquiry ki thi.",
    capture: (r) => ({ budget: pick(r, ["₹85 L", "₹1.2 Cr", "₹1.8 Cr", "₹2.4 Cr"]), configuration: pick(r, ["2 BHK", "3 BHK", "4 BHK"]), visit: pick(r, ["Saturday 11 AM", "Sunday 4 PM", "Not yet"]) }),
    transcript: (n, c) => [
      { speaker: "agent", text: "Namaste! Main Pooja bol rahi hoon. Aapne humare project ke baare mein enquiry ki thi — kya abhi do minute baat ho sakti hai?" },
      { speaker: "customer", text: `Haan, boliye. Main ${n.split(" ")[0]} bol raha hoon.` },
      { speaker: "agent", text: "Aap kis configuration mein interested hain, aur approximate budget kya hai?" },
      { speaker: "customer", text: `${c.configuration} dekh rahe hain, budget around ${c.budget}.` },
      { speaker: "agent", text: "Bahut badiya. Kya aap is weekend site visit ke liye aana chahenge?" },
      { speaker: "customer", text: c.visit === "Not yet" ? "Abhi nahi, pehle brochure bhej dijiye." : `Haan, ${c.visit} theek rahega.` },
      { speaker: "agent", text: "Done! Main aapko WhatsApp par details bhej deti hoon. Dhanyavaad!" },
    ],
    summary: (n, c) => `${n.split(" ")[0]} is looking for a ${c.configuration} around ${c.budget}. ${c.visit === "Not yet" ? "Asked for a brochure before visiting." : `Site visit booked for ${c.visit}.`}`,
  },
  {
    id: "emp_aman",
    name: "Aman",
    role: "BFSI · loan eligibility screening",
    mode: "bulk",
    status: "active",
    language: "hinglish",
    voiceId: "bulbul:v3/aman",
    template: "bfsi",
    first: "Hi, main Aman bol raha hoon. Aapke pre-approved personal loan offer ke baare mein call kiya hai.",
    capture: (r) => ({ loan_amount: pick(r, ["₹3 L", "₹5 L", "₹8 L", "₹12 L"]), employment: pick(r, ["Salaried", "Self-employed"]), monthly_income: pick(r, ["₹45k", "₹70k", "₹1.1 L"]) }),
    transcript: (n, c) => [
      { speaker: "agent", text: "Hi, main Aman bol raha hoon. Aapke liye ek pre-approved personal loan offer hai. Kya aap interested honge?" },
      { speaker: "customer", text: "Haan, kitna tak mil sakta hai?" },
      { speaker: "agent", text: "Woh aapki income par depend karta hai. Aap salaried hain ya self-employed?" },
      { speaker: "customer", text: `${c.employment}, monthly around ${c.monthly_income}.` },
      { speaker: "agent", text: "Aapko kitne amount ki requirement hai?" },
      { speaker: "customer", text: `Lagbhag ${c.loan_amount}.` },
      { speaker: "agent", text: "Perfect. Aap eligible lag rahe hain — main ek relationship manager se callback arrange kar deta hoon." },
    ],
    summary: (n, c) => `${c.employment} applicant earning ${c.monthly_income}/month, needs ${c.loan_amount}. Looks eligible; RM callback requested.`,
  },
  {
    id: "emp_kavya",
    name: "Kavya",
    role: "Clinic · appointment desk",
    mode: "inbound",
    status: "active",
    language: "en-IN",
    voiceId: "aura-asteria-en",
    template: "clinic",
    first: "Hello, thank you for calling. This is Kavya from the clinic front desk. How can I help you today?",
    capture: (r) => ({ department: pick(r, ["Dermatology", "Orthopaedics", "General physician", "Paediatrics"]), preferred_slot: pick(r, ["Tomorrow 10 AM", "Friday evening", "Monday 12 PM"]) }),
    transcript: (n, c) => [
      { speaker: "agent", text: "Hello, thank you for calling. This is Kavya from the front desk. How can I help you today?" },
      { speaker: "customer", text: `Hi, I'd like to book an appointment with ${c.department}.` },
      { speaker: "agent", text: "Of course. May I have the patient's name, and when would you prefer to come in?" },
      { speaker: "customer", text: `It's ${n}. ${c.preferred_slot} works for me.` },
      { speaker: "agent", text: `I've noted ${c.preferred_slot} for ${c.department}. You'll get a confirmation shortly. Anything else?` },
      { speaker: "customer", text: "No, that's all. Thanks!" },
    ],
    summary: (n, c) => `Inbound appointment request for ${c.department}. Preferred slot: ${c.preferred_slot}.`,
  },
  {
    id: "emp_rohan",
    name: "Rohan",
    role: "Coaching · admissions counsellor",
    mode: "bulk",
    status: "paused",
    language: "hi-IN",
    voiceId: "bulbul:v3/rahul",
    template: "coaching",
    first: "Namaste, main Rohan bol raha hoon. Aapne humare JEE foundation batch ke liye form bhara tha.",
    capture: (r) => ({ course: pick(r, ["JEE foundation", "NEET 2-year", "Class 10 boards"]), student_class: pick(r, ["Class 9", "Class 10", "Class 11"]), demo_class: pick(r, ["Booked", "Not now"]) }),
    transcript: (n, c) => [
      { speaker: "agent", text: "Namaste, main Rohan bol raha hoon. Aapne humare course ke liye enquiry ki thi." },
      { speaker: "customer", text: `Haan, ${c.course} ke baare mein jaanna tha.` },
      { speaker: "agent", text: "Student abhi kaunsi class mein hai?" },
      { speaker: "customer", text: `${c.student_class}.` },
      { speaker: "agent", text: "Kya aap ek free demo class attend karna chahenge?" },
      { speaker: "customer", text: c.demo_class === "Booked" ? "Haan, zaroor." : "Abhi nahi, baad mein batayenge." },
    ],
    summary: (n, c) => `Parent enquiring about ${c.course} for a ${c.student_class} student. Demo class: ${c.demo_class.toLowerCase()}.`,
  },
  {
    id: "emp_meera",
    name: "Meera",
    role: "Dealership · test-drive follow-up",
    mode: "instant",
    status: "active",
    language: "en-IN",
    voiceId: "bulbul:v3/priya",
    template: "dealership",
    first: "Hi! This is Meera from the showroom. You just enquired about a test drive — is now a good time?",
    capture: (r) => ({ model: pick(r, ["Compact SUV", "Sedan", "EV hatchback", "Adventure 390"]), purchase_timeline: pick(r, ["This month", "1–3 months", "Just exploring"]), test_drive: pick(r, ["Booked", "Not yet"]) }),
    transcript: (n, c) => [
      { speaker: "agent", text: "Hi! This is Meera from the showroom. You just enquired about a test drive — is now a good time?" },
      { speaker: "customer", text: `Yes, I was looking at the ${c.model}.` },
      { speaker: "agent", text: "Great choice. When are you planning to buy?" },
      { speaker: "customer", text: `${c.purchase_timeline}.` },
      { speaker: "agent", text: c.test_drive === "Booked" ? "I've booked a home test drive for you this weekend." : "No problem, I'll share the brochure and pricing on WhatsApp." },
    ],
    summary: (n, c) => `Interested in the ${c.model}; timeline: ${c.purchase_timeline.toLowerCase()}. Test drive ${c.test_drive.toLowerCase()}.`,
  },
];

export interface MockDb {
  employees: Employee[];
  leads: Lead[];
  conversations: Conversation[];
  campaigns: Campaign[];
  campaignLeads: Record<string, CampaignLead[]>;
  channels: Channel[];
  sources: LeadSource[];
  queue: QueueItem[];
  instantSettings: InstantLeadSettings;
  balanceInr: number;
  transactions: Transaction[];
  members: Member[];
  notifications: Notification[];
}

export function buildSeed(now = Date.now()): MockDb {
  const r = rng(20261127);
  const iso = (t: number) => new Date(t).toISOString();

  const channels: Channel[] = [
    { id: "ch_1", type: "phone", phone: "+918045678900", name: "Bengaluru main line", active: true, concurrency: 5, assignedEmployeeId: "emp_kavya", dltEntityId: "1201162999999999999", dltSenderId: "NEXOAI", },
    { id: "ch_2", type: "phone", phone: "+912261234500", name: "Mumbai outbound", active: true, concurrency: 10, assignedEmployeeId: "emp_pooja", dltEntityId: null, dltSenderId: null },
    { id: "ch_3", type: "phone", phone: "+911141119876", name: "Delhi backup", active: false, concurrency: 2, assignedEmployeeId: null, dltEntityId: null, dltSenderId: null },
  ];
  const channelFor = (empId: string) => channels.find((c) => c.assignedEmployeeId === empId)?.phone ?? channels[1].phone;

  const employees: Employee[] = EMPLOYEES.map((e, i) => ({
    id: e.id,
    name: e.name,
    role: e.role,
    status: e.status,
    language: e.language,
    voiceId: e.voiceId,
    voiceProvider: e.voiceId.startsWith("aura") ? "deepgram" : "sarvam",
    firstMessage: e.first,
    instructions: `You are ${e.name}, a ${e.role.split("·")[1]?.trim() ?? "calling"} specialist. Be warm, concise and respectful. Confirm details back to the caller, never promise prices or approvals, and offer a human callback whenever the caller asks.`,
    callingMode: e.mode,
    naturalSpeech: true,
    qualificationQuestions: Object.keys(e.capture(r)).map((field, qi) => ({
      id: `${e.id}_q${qi}`,
      field,
      question: `Ask about ${field.replace(/_/g, " ")}`,
      required: qi === 0,
    })),
    followUp: { maxAttempts: 3, retryGapHours: 4, honourCallbackRequests: true, sendSummaryOnWhatsApp: i % 2 === 0 },
    workingHours: { days: [1, 2, 3, 4, 5, 6], start: "09:30", end: "19:30", timezone: "Asia/Kolkata" },
    channels: [channelFor(e.id)],
    templateId: e.template,
    stats: { calls: 0, qualified: 0, lastActiveAt: null },
    createdAt: iso(now - (40 - i * 6) * DAY),
    updatedAt: iso(now - (3 + i) * DAY),
  }));

  // ---- Conversations (last 30 days) + leads derived from them
  const conversations: Conversation[] = [];
  const leads: Lead[] = [];
  const outcomesPool: LeadOutcome[] = ["interested", "interested", "callback", "callback", "not_interested", "no_answer", "no_answer", "busy", "interested", "failed", "dnd"];
  const sourcesFor: Record<string, string[]> = {
    instant: ["meta_ads", "meta_ads", "website_form", "google_ads"],
    bulk: ["csv_upload"],
    inbound: ["inbound"],
  };

  for (let i = 0; i < 96; i++) {
    const seed = EMPLOYEES[Math.floor(r() * EMPLOYEES.length)];
    const emp = employees.find((e) => e.id === seed.id)!;
    const name = `${pick(r, FIRST)} ${pick(r, LAST)}`;
    const phone = `+91${Math.floor(7000000000 + r() * 2999999999)}`;
    // Business-hour skew: most calls between 10:00 and 19:00 IST.
    // Paused employees have no activity in the last few days.
    const dayOffset = seed.status === "paused" ? 4 + Math.floor(r() * 26) : Math.floor(Math.pow(r(), 1.4) * 30);
    const hour = 10 + Math.floor(r() * 9);
    const startedAt = new Date(now - dayOffset * DAY);
    startedAt.setHours(hour, Math.floor(r() * 60), 0, 0);
    if (startedAt.getTime() > now) startedAt.setTime(now - Math.floor(r() * 5) * HOUR - 20 * 60_000);

    const outcome = pick(r, outcomesPool);
    const connected = ["interested", "callback", "not_interested"].includes(outcome);
    const status = connected ? "completed" : outcome === "busy" ? "busy" : outcome === "no_answer" ? "no-answer" : outcome === "failed" ? "failed" : "failed";
    const duration = connected ? 35 + Math.floor(r() * 240) : 0;
    const captured = connected ? seed.capture(r) : {};
    const temperature: Temperature = outcome === "interested" ? (r() > 0.45 ? "hot" : "warm") : outcome === "callback" ? "warm" : outcome === "not_interested" ? "cold" : "neutral";
    const direction = seed.mode === "inbound" ? "inbound" : "outbound";

    conversations.push({
      id: `call_${1000 + i}`,
      callSid: `CA${(0x9f8a10 + i * 7919).toString(16)}demo`,
      callerName: name,
      phone,
      employeeId: emp.id,
      employeeName: emp.name,
      direction,
      channel: channelFor(emp.id),
      startedAt: startedAt.toISOString(),
      durationSec: duration,
      status,
      outcome,
      sentiment: connected ? (temperature === "hot" ? "Positive" : temperature === "cold" ? "Negative" : "Neutral") : null,
      summary: connected ? seed.summary(name, captured) : null,
      transcript: connected ? seed.transcript(name, captured) : null,
      capturedData: captured,
      recordingAvailable: false, // demo calls never have audio — we don't fabricate recordings
      costInr: duration ? Math.ceil(duration / 60) * 5.5 : 0,
      whatsappStatus: connected && emp.followUp?.sendSummaryOnWhatsApp ? "sent" : "none",
    });

    const followUpAt = outcome === "callback" ? now + (r() > 0.3 ? 1 : -1) * Math.floor(r() * 48) * HOUR : null;
    leads.push({
      id: `lead_${2000 + i}`,
      name,
      phone,
      city: pick(r, CITIES),
      source: pick(r, sourcesFor[seed.mode ?? "bulk"]),
      campaignName: seed.mode === "bulk" ? pick(r, ["Diwali pre-approved offers", "JEE 2027 enquiries"]) : null,
      employeeName: emp.name,
      employeeId: emp.id,
      channel: channelFor(emp.id),
      qualified: outcome === "interested",
      outcome,
      temperature,
      capturedInfo: captured,
      followUp: {
        status: followUpAt === null ? (outcome === "interested" ? "done" : "none") : followUpAt < now ? "overdue" : "scheduled",
        at: followUpAt ? iso(followUpAt) : null,
      },
      callAttempts: connected ? 1 : 1 + Math.floor(r() * 3),
      lastContactedAt: startedAt.toISOString(),
      createdAt: iso(startedAt.getTime() - Math.floor(r() * 3) * HOUR - 60_000),
      tags: temperature === "hot" ? ["hot"] : [],
    });
  }

  // a handful of fresh, not-yet-called leads
  for (let i = 0; i < 6; i++) {
    const createdAt = now - (i * 17 + 3) * 60_000;
    leads.push({
      id: `lead_new_${i}`,
      name: `${pick(r, FIRST)} ${pick(r, LAST)}`,
      phone: `+91${Math.floor(7000000000 + r() * 2999999999)}`,
      city: pick(r, CITIES),
      source: pick(r, ["meta_ads", "website_form"]),
      campaignName: null,
      employeeName: i % 2 ? "Meera" : "Pooja",
      employeeId: i % 2 ? "emp_meera" : "emp_pooja",
      channel: channels[1].phone,
      qualified: false,
      outcome: "pending",
      temperature: "neutral",
      capturedInfo: {},
      followUp: { status: "none", at: null },
      callAttempts: 0,
      lastContactedAt: null,
      createdAt: iso(createdAt),
      tags: [],
    });
  }

  conversations.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  for (const e of employees) {
    const mine = conversations.filter((c) => c.employeeId === e.id);
    e.stats = {
      calls: mine.length,
      qualified: mine.filter((c) => c.outcome === "interested").length,
      lastActiveAt: mine[0]?.startedAt ?? null,
    };
  }

  // ---- Campaigns
  const campaigns: Campaign[] = [
    { id: "cmp_1", name: "Diwali pre-approved offers", status: "running", employeeId: "emp_aman", employeeName: "Aman", source: "CSV upload · 1,240 rows", totalLeads: 1240, dialed: 688, connected: 402, concurrency: 8, createdAt: iso(now - 9 * DAY) },
    { id: "cmp_2", name: "JEE 2027 enquiries", status: "paused", employeeId: "emp_rohan", employeeName: "Rohan", source: "CSV upload · 430 rows", totalLeads: 430, dialed: 212, connected: 131, concurrency: 4, createdAt: iso(now - 16 * DAY) },
    { id: "cmp_3", name: "Old site-visit no-shows", status: "completed", employeeId: "emp_pooja", employeeName: "Pooja", source: "CSV upload · 96 rows", totalLeads: 96, dialed: 96, connected: 61, concurrency: 3, createdAt: iso(now - 25 * DAY) },
    { id: "cmp_4", name: "Q1 service reminders", status: "draft", employeeId: "emp_meera", employeeName: "Meera", source: "No list uploaded", totalLeads: 0, dialed: 0, connected: 0, concurrency: 5, createdAt: iso(now - 1 * DAY) },
  ];
  const campaignLeads: Record<string, CampaignLead[]> = {};
  for (const c of campaigns) {
    campaignLeads[c.id] = Array.from({ length: Math.min(c.totalLeads, 12) }, (_, i) => ({
      id: `${c.id}_l${i}`,
      name: `${pick(r, FIRST)} ${pick(r, LAST)}`,
      phone: `+91${Math.floor(7000000000 + r() * 2999999999)}`,
      city: pick(r, CITIES),
      status: i < (c.dialed / Math.max(c.totalLeads, 1)) * 12 ? pick(r, ["completed", "completed", "busy", "no-answer", "retry_scheduled"]) : "pending",
      retryCount: Math.floor(r() * 2),
      lastCalledAt: i < 6 ? iso(now - Math.floor(r() * 72) * HOUR) : null,
    }));
  }

  // ---- Instant lead sources & queue
  const sources: LeadSource[] = [
    { id: "src_meta", provider: "meta_ads", name: "Meta Lead Ads · Sector 43 launch", status: "connected", employeeId: "emp_pooja", leadsLast7d: 38, lastLeadAt: iso(now - 12 * 60_000) },
    { id: "src_web", provider: "website_form", name: "Website test-drive form", status: "connected", employeeId: "emp_meera", leadsLast7d: 17, lastLeadAt: iso(now - 2 * HOUR) },
    { id: "src_google", provider: "google_ads", name: "Google Ads lead forms", status: "error", employeeId: "emp_pooja", leadsLast7d: 0, lastLeadAt: iso(now - 6 * DAY) },
  ];
  const queue: QueueItem[] = leads
    .filter((l) => l.outcome === "pending")
    .slice(0, 4)
    .map((l, i) => ({
      id: `q_${l.id}`,
      name: l.name,
      phone: l.phone,
      source: l.source,
      receivedAt: l.createdAt,
      state: (["dialing", "waiting", "retry_scheduled", "outside_hours"] as const)[i % 4],
      nextAttemptAt: i % 4 === 2 ? iso(now + 35 * 60_000) : null,
    }));

  // ---- Wallet & transactions
  const transactions: Transaction[] = [];
  let balance = 0;
  const pushTx = (type: "credit" | "debit", amount: number, description: string, at: number, reference: string | null = null) => {
    balance += type === "credit" ? amount : -amount;
    transactions.push({ id: `tx_${transactions.length + 1}`, type, amountInr: amount, closingBalanceInr: Math.round(balance * 100) / 100, reference, description, createdAt: iso(at) });
  };
  pushTx("credit", 500, "Welcome credits", now - 41 * DAY, "signup_bonus");
  pushTx("credit", 5000, "Wallet recharge", now - 30 * DAY, "order_demo_1");
  for (let d = 29; d >= 0; d--) {
    const spend = conversations.filter((c) => Math.floor((now - Date.parse(c.startedAt)) / DAY) === d).reduce((s, c) => s + c.costInr, 0);
    if (spend > 0) pushTx("debit", spend, "Call usage", Math.min(now - 30 * 60_000, now - d * DAY + 10 * HOUR));
    if (d === 14) pushTx("credit", 2000, "Wallet recharge", now - d * DAY, "order_demo_2");
  }
  transactions.reverse();

  const members: Member[] = [
    { id: "u_1", name: "Demo Admin", email: "admin@demo.nexoagent.local", role: "admin", active: true },
    { id: "u_2", name: "Ritika Sales", email: "ritika@demo.nexoagent.local", role: "manager", active: true },
    { id: "u_3", name: "Farhan Ops", email: "farhan@demo.nexoagent.local", role: "member", active: false },
  ];

  const notifications: Notification[] = [
    { id: "n1", title: "Hot lead captured", body: "Pooja qualified a 3 BHK buyer from Meta Lead Ads.", createdAt: iso(now - 25 * 60_000), read: false, href: "/leads" },
    { id: "n2", title: "Google Ads source needs attention", body: "No leads received in 6 days. Reconnect the source.", createdAt: iso(now - 5 * HOUR), read: false, href: "/instant-leads" },
    { id: "n3", title: "Campaign paused", body: "“JEE 2027 enquiries” was paused because Rohan is inactive.", createdAt: iso(now - 2 * DAY), read: true, href: "/campaigns" },
  ];

  return {
    employees,
    leads,
    conversations,
    campaigns,
    campaignLeads,
    channels,
    sources,
    queue,
    instantSettings: { enabled: true, employeeId: "emp_pooja", delaySeconds: 15, maxAttempts: 3, respectWorkingHours: true },
    balanceInr: Math.round(balance * 100) / 100,
    transactions,
    members,
    notifications,
  };
}

export function emptySeed(): MockDb {
  return {
    employees: [],
    leads: [],
    conversations: [],
    campaigns: [],
    campaignLeads: {},
    channels: [],
    sources: [],
    queue: [],
    instantSettings: { enabled: false, employeeId: null, delaySeconds: 15, maxAttempts: 3, respectWorkingHours: true },
    balanceInr: 500,
    transactions: [],
    members: [{ id: "u_1", name: "Demo Admin", email: "admin@demo.nexoagent.local", role: "admin", active: true }],
    notifications: [],
  };
}
