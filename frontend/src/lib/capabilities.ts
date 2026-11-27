import { isMockMode } from "@/lib/config";

/**
 * Feature capability map.
 *
 * In API mode each flag says whether the REAL backend (verified against
 * backend/app on 2026-11-27) exposes what the feature needs. Controls whose
 * capability is `false` render disabled with a "Needs backend" hint instead of
 * faking success. In mock mode every capability is on so the whole UI can be
 * explored with demo data.
 *
 * When the backend ships an endpoint: flip the flag here and implement the API
 * branch in the matching service. See docs/FRONTEND_BACKEND_CONTRACT.md.
 */
const backendSupports = {
  // Employees
  "employees.structuredConfig": false, // calling mode, questions, follow-ups, hours as real fields
  "employees.update": true, // PATCH /agents/{id}
  "employees.duplicate": true, // POST /agents/{id}/duplicate
  "employees.delete": true, // DELETE /agents/{id}
  // Leads
  "leads.filter.channel": false,
  "leads.filter.date": false,
  "leads.filter.lastContacted": false,
  "leads.sort.extended": false, // server supports recent/oldest only
  "leads.export": true, // GET /leads/export
  "leads.followUp": false,
  // Conversations
  "calls.filter.search": false,
  "calls.filter.date": false,
  "calls.filter.channel": false,
  "calls.filter.direction": false,
  // Performance
  "analytics.customRange": false,
  "analytics.filter.channel": false,
  "analytics.byChannel": false,
  "analytics.businessHours": false,
  "analytics.leaderboard": false,
  // Campaigns
  "campaigns.pause": false, // no pause endpoint
  // Channels
  "channels.update": false, // no PATCH /channels/{id}
  "channels.whatsapp": false,
  // Instant leads
  "instantLeads.sources": false,
  "instantLeads.analytics": false,
  "instantLeads.queue": false,
  "instantLeads.settings": false,
  // Billing
  "billing.checkout": false, // Razorpay checkout is not wired into the frontend
  // Settings
  "settings.profileUpdate": false,
  "settings.workspaceUpdate": false,
  "settings.passwordChange": false,
  "settings.notificationsSync": false,
  "notifications.feed": false,
  // Developers
  "developers.apiKeys": true,
  "developers.webhooks": true,
  "developers.usage": false,
} as const;

export type Capability = keyof typeof backendSupports;

/** Whether the feature works in the current data mode (mock: always). */
export function can(cap: Capability): boolean {
  return isMockMode ? true : backendSupports[cap];
}

/**
 * Real-backend-only capability. Used for credentials (API keys, webhook secrets):
 * these are never simulated, because fake credentials would be misleading.
 */
export function canReal(cap: Capability): boolean {
  return !isMockMode && backendSupports[cap];
}
