# AI Fraud Investigation Agent — Implementation Plan

## Status: COMPLETE — all phases implemented, 14/14 tests passing

## Architecture Overview

```
React (Vite + Tailwind + React Flow + Recharts)
        │  Axios → /api/*
        ▼
Express (Node.js)
        │
        ├─ Supervisor Agent (orchestrator)
        │     ├─ Transaction Agent      (deterministic)
        │     ├─ Behaviour Agent        (deterministic)
        │     ├─ Anomaly Agent          (deterministic rules)
        │     ├─ Device Agent           (deterministic, Mongo queries)
        │     ├─ Location Agent         (deterministic)
        │     ├─ Relationship Agent     (graph from MongoDB)
        │     ├─ Investigation Agent    (LLM, grounded in evidence)
        │     ├─ Risk Engine            (deterministic, configurable weights)
        │     └─ Report Agent           (LLM narrative + structured data)
        │
        ├─ LLM Service (backend-only, OpenAI-compatible, DEMO_MODE fallback)
        └─ MongoDB (Mongoose) — mongodb-memory-server for local/demo
```

## Key Design Decisions

1. **MongoDB**: `mongodb-memory-server` runs a real MongoDB in-memory when no
   `MONGODB_URI` is set. All relationship discovery (shared devices, previous
   alerts) happens via real Mongo queries — nothing hardcoded in the frontend.
2. **LLM isolation**: API keys live only in backend env. `DEMO_MODE=true`
   produces deterministic investigation narratives from the same evidence.
3. **Evidence-first**: every finding carries `evidenceId` (EV-xxx). The LLM
   receives evidence IDs and is prohibited from inventing facts; backend
   validates any evidence ID the LLM returns.
4. **Risk Engine**: deterministic, configurable weights, capped at 100.
5. **Human review**: HIGH/CRITICAL cases require an explicit human decision;
   every action writes an AuditLog.

## Phases — All Complete

- [x] PHASE 1 — Repository inspection + architecture
- [x] PHASE 2 — MongoDB models + seed data (CASE-1042 scenario)
- [x] PHASE 3 — REST APIs
- [x] PHASE 4 — Deterministic analysis services (agents)
- [x] PHASE 5 — Investigation orchestrator (Supervisor)
- [x] PHASE 6 — Risk engine
- [x] PHASE 7 — Agent logging
- [x] PHASE 8 — React dashboard
- [x] PHASE 9 — Case investigation page
- [x] PHASE 10 — Relationship graph (React Flow)
- [x] PHASE 11 — Human review
- [x] PHASE 12 — Report generation
- [x] PHASE 13 — LLM investigation agent
- [x] PHASE 14 — Case-specific copilot
- [x] PHASE 15 — Testing and bug fixing (14/14 tests pass)
- [x] PHASE 16 — Demo mode polish

## Demo Story (CASE-1042)

C1024 (usual: Nagpur, avg ₹8,200) → TX1042 ₹78,500 at 02:17 AM from Mumbai on
device D8821, which is also used by C1091 and C1177 and appeared in CASE887.
Result: 17 evidence items, risk score 100/100 (CRITICAL), human review required.

## Running

```bash
# Backend (auto-seeds on first run)
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# Tests
cd backend && npm test
```

Open http://localhost:5173 → Dashboard → click CASE-1042 → Start Investigation.
