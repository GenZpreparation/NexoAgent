# 📐 FRONTEND DESIGN RULES & ANTI-AI-SLOP SPECIFICATION

This rule file is actively monitored by Antigravity for all operations inside `frontend/`.

## 1. Zero AI-Slop Policy
- No generic purple radial blurs (`bg-purple-600/30 blur-3xl`).
- No generic symmetrical 3-column cards with generic marketing copy.
- No dummy buttons without handlers or simulated responsive state.
- No unhandled error or loading states.

## 2. NexoAgent Signature Aesthetic (Linear + Raycast + Vapi)
- **Background:** `#070a11` (Level 0 canvas), `#0d121f` (Level 1 card), `#151c2e` (Level 2 popover).
- **Hairline Borders:** `border border-white/[0.08]` with top specular highlight (`before:bg-gradient-to-r before:from-transparent before:via-white/[0.12] before:to-transparent`).
- **Accent:** Electric Indigo `#6366f1` with subtle glow.
- **Data / Metrics:** Monospace font (`JetBrains Mono` / `Geist Mono`) for telephony metrics (Call SIDs, phone numbers, talk duration, billing pulse).
- **Hero Element:** Live interactive audio console with simulated frequency bars and real-time streaming transcripts.

## 3. Strict 4-State UI Rule
Every component fetching data must have:
1. `Loading`: Tailored hairline skeleton shimmer.
2. `Empty`: Technical empty graphic with primary action CTA.
3. `Error`: Actionable alert with a retry button.
4. `Data`: Staggered fluid spring animation.

## 4. API Contract Adherence
- Strictly follow `frontend/src/types/api.ts` and `frontend/docs/API_CONTRACTS.md`.
- No improvised/hallucinated endpoint URLs or request body schemas.
