import type { Voice } from "@/types/domain";

/**
 * Demo voice catalogue for mock mode. Mirrors the shape (and ids) of the
 * backend's static GET /voices list so a draft created in mock mode maps
 * cleanly onto the real catalogue. In API mode the real endpoint is used.
 */
export const MOCK_VOICES: Voice[] = [
  { id: "bulbul:v3/pooja", name: "Pooja", language: "Hindi", languageCode: "hi-IN", provider: "sarvam", gender: "Female", accent: "North Indian", tier: "standard", ratePerMinInr: 5, description: "Warm and polite — good for real estate and clinics." },
  { id: "bulbul:v3/aman", name: "Aman", language: "Hinglish", languageCode: "hi-IN", provider: "sarvam", gender: "Male", accent: "Urban Hinglish", tier: "standard", ratePerMinInr: 5, description: "Confident, conversational — sales and BFSI." },
  { id: "bulbul:v3/priya", name: "Priya", language: "Hindi", languageCode: "hi-IN", provider: "sarvam", gender: "Female", accent: "Neutral", tier: "standard", ratePerMinInr: 5, description: "Calm and clear — support and follow-ups." },
  { id: "bulbul:v3/rahul", name: "Rahul", language: "Marathi / Hindi", languageCode: "mr-IN", provider: "sarvam", gender: "Male", accent: "Maharashtrian", tier: "standard", ratePerMinInr: 5, description: "Friendly regional voice for West India." },
  { id: "bulbul:v3/kavita", name: "Kavita", language: "Telugu / Tamil", languageCode: "te-IN", provider: "sarvam", gender: "Female", accent: "South Indian", tier: "standard", ratePerMinInr: 5, description: "Regional voice for South India." },
  { id: "aura-asteria-en", name: "Ananya", language: "Indian English", languageCode: "en-IN", provider: "deepgram", gender: "Female", accent: "Indian English", tier: "premium", ratePerMinInr: 6.8, description: "Premium English voice for enterprise callers." },
];
