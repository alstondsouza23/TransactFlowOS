# TransactFlowOS

> **An OS-inspired Chit Fund Management Platform** — real-time financial operations, kernel-level security, and transparent lending infrastructure for urban cooperative finance.

---

## What Is This

TransactFlowOS is a full-stack desktop + web platform that digitises the operations of informal chit funds — rotating savings groups used by millions of urban middle-class Indians. It replaces the single human foreman (the traditional source of fraud and opacity) with a software kernel that enforces fair auctions, detects payment defaults, sanctions loans using the Banker's Algorithm, and maintains a tamper-evident audit trail on disk.

The project is built as a semester PBL under the **Operating Systems** course at St Joseph Engineering College, Mangaluru — every architectural decision maps directly to a real OS concept.

---

## Architecture

```
TransactFlowOS/
├── Client/                    # Member-facing React web app (hosted)
├── Employee_Admin-Desktop/    # Tauri desktop app for employees + admins
│   └── src-tauri/             # Rust layer — OS syscalls, WAL, file locks
└── Backend/                   # Python WebSocket server + Node.js REST API
```

Three separate processes, one unified system:

- **Client** — Members check contributions, apply for loans, view their financial timeline and group health. Pure React, runs in a browser.
- **Employee\_Admin-Desktop** — Employees process KYC, approve loans, manage defaults on a Kanban board. Admins oversee the full platform, audit trail, and reports. Built with Tauri so the Rust layer can make real OS-level system calls.
- **Backend** — Python WebSocket server reads from and writes to Firestore, pushing live updates to both apps. A separate Node.js server handles REST endpoints.

---

## OS Concepts Implemented

| Concept | Where | How |
|---|---|---|
| **Mutex / Semaphore** | Auction room, loan approval | Rust `fs2::try_lock_exclusive()` — real `flock()` / `LockFileEx()` kernel syscall |
| **Write-Ahead Logging** | Every transaction | Rust `O_APPEND` file write + SHA-256 hash chaining to disk |
| **Banker's Algorithm** | Loan sanction gate | Safe-state simulation in Node.js before every disbursement |
| **Process Scheduling** | Loan application queue | Node.js Worker Threads (maps to `pthread_create()` under the hood) |
| **Resource Management** | Kernel Monitor panel | Rust `sysinfo` crate reads `/proc/meminfo` (Linux) or `GlobalMemoryStatusEx()` (Windows) |
| **Secure Storage** | Auth session token | Rust `keyring` crate — OS keychain (DPAPI / macOS Keychain / SecretService) |
| **State Machine** | Default recovery pipeline | 7-stage FSM: missed → contacted → notice → follow-up → legal → resolved |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Member web app | React + Tailwind CSS + Vite |
| Desktop app shell | Tauri 2.0 |
| Desktop UI | React + Tailwind CSS + shadcn/ui |
| OS / Rust layer | Tauri commands — `fs2`, `sysinfo`, `keyring`, `sha2` |
| WebSocket server | Python (`websockets` + `asyncio`) |
| REST API | Node.js + Express |
| Database | Firestore (Firebase) |
| Auth | Firebase Authentication (Phone OTP) |
| State management | Zustand |
| Data fetching | React Query + Firestore `onSnapshot` |
| Real-time | Python WebSocket server → React clients |

---

## Features

### Member (Client web app)
- Phone OTP login via Firebase
- Financial timeline — every contribution, loan disbursement, and EMI payment with bank reference proof
- Loan application form with live EMI preview (reducing balance formula)
- Group health report — pool size, members paid, active defaults, foreman commission
- Digital chit agreement with sign timestamp
- WAL integrity badge — proves the audit chain is unbroken

### Employee (Desktop app)
- Bulk KYC approval with document verification
- Loan application inbox — eligibility badge, risk score, approve / reject with Banker's check
- Default recovery Kanban board — drag cards through 7 recovery stages
- Real-time activity feed from the audit log
- Live kernel monitor strip — RAM usage, WAL entry count, auction lock status, thread count

### Admin (Desktop app)
- Platform KPI dashboard — total pool, active members, default rate, loans outstanding
- Group overview table with cycle progress and health metrics
- Full audit trail — every WAL entry with hash chain, filterable by actor / action / date
- WAL integrity verification — re-hashes the entire chain, reports broken entries
- Report generation — member list, loan portfolio, default summary, balance sheet (exported to disk via Rust)

### Auction Room
- Live bidding via WebSocket — all members in the group see bids in real time
- Binary semaphore (Rust file lock) prevents two simultaneous auction sessions per group
- Countdown timer, current winning bid, anonymised bidder aliases
- Banker's algorithm gate before winner payout is released

---

## Data Flow

```
Firebase Auth
     ↓
authStore.js (Zustand) — holds { user, role, token }
     ↓
Employee_Admin-Desktop connects to ws://localhost:8080
     ↓
Backend/main.py verifies Firebase ID token
     ↓
Firestore snapshot sent on connect
     ↓
Python onSnapshot listeners push live updates
     ↓
React components re-render with live Firestore data
     ↓
User actions (approve KYC, move default stage) →
Backend writes to Firestore → broadcasts to all clients
```

---

## Firestore Collections

```
loan_applications/   applicant_name, requested_amount_inr, status, risk_score, submitted_at
kyc_queue/           member_name, phone, pan_masked, bank_masked, status, rejection_reason
recovery_cases/      member_name, overdue_amount_inr, risk_level, recovery_stage, days_late
audit_log/           actor_name, actor_role, action_code, entity_type, entity_id, timestamp
kernel_state/live    ram_used_gb, wal_entry_count, auction_lock_status, thread_count
users/               name, phone, role, kyc_status, pan_masked, bank_masked
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Rust (via [rustup](https://rustup.rs))
- Tauri CLI — `cargo install tauri-cli`
- Firebase project with Phone Auth enabled
- `serviceAccountKey.json` from Firebase Console → Project Settings → Service Accounts

### 1. Clone

```bash
git clone https://github.com/your-username/TransactFlowOS.git
cd TransactFlowOS
```

### 2. Backend (Python WebSocket Server)

```bash
cd Backend
pip install websockets firebase-admin python-dotenv
# Place your serviceAccountKey.json in Backend/
python main.py
# → WS server running on ws://localhost:8080
```

### 3. Employee / Admin Desktop App

```bash
cd Employee_Admin-Desktop
npm install
# Create .env from .env.example and fill in Firebase config
npm run tauri dev
```

### 4. Member Web App

```bash
cd Client
npm install
# Create .env from .env.example and fill in Firebase config
npm run dev
# → http://localhost:5173
```

### Environment Variables

Both `Client/` and `Employee_Admin-Desktop/` need a `.env` file:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_WS_URL=ws://localhost:8080
VITE_API_URL=http://localhost:3001
```

`Backend/` needs:

```env
FIREBASE_PROJECT_ID=
WS_PORT=8080
```

---

## Role Access

| Role | App | Access |
|---|---|---|
| `member` | Client (browser) | Own contributions, loans, group overview |
| `employee` | Employee\_Admin-Desktop | KYC approvals, loan inbox, default recovery |
| `admin` | Employee\_Admin-Desktop | All employee access + audit trail, reports, group management |

Roles are resolved via `roleResolver.js` which cross-checks the Firebase UID against a verified allow-list. Any authenticated user not on the list is classified as `client` and signed out of the desktop app immediately.

---

## Project Context

Built as a **Problem Based Learning (PBL)** project for:

> **St Joseph Engineering College — Mangaluru**
> Department of Intelligent Computing and Business Systems
> III Semester — CSBS Section
> Operating Systems — 22CBS34

The social problem being solved: chit fund fraud in India. The ₹50,000 crore informal chit fund industry runs almost entirely on trust in a single foreman — with zero transparency, no audit trails, and no conflict resolution when members default. TransactFlowOS replaces the foreman with a kernel.

---

## Folder Map

```
TransactFlowOS/
│
├── Backend/
│   ├── main.py                  # WS server entry point
│   ├── firebase_init.py         # Firebase Admin SDK (Auth + Firestore)
│   ├── auth.py                  # Token verification
│   ├── state.py                 # Connected clients registry
│   ├── channels/
│   │   ├── kernel.py            # Kernel metrics ticker (every 5s)
│   │   ├── admin.py             # Admin KPIs + audit stream
│   │   └── employee.py          # Loan inbox + KYC + recovery snapshots
│   ├── handlers/
│   │   └── actions.py           # Approve KYC, move recovery stage, etc.
│   └── requirements.txt
│
├── Client/
│   └── src/
│       ├── pages/               # Login, Dashboard, Loans, Contributions
│       ├── components/          # FinancialTimeline, GroupHealthStrip, EMIPreview
│       ├── store/               # authStore.js (Zustand)
│       └── lib/                 # firebase.js, api.js, socket.js
│
└── Employee_Admin-Desktop/
    ├── src/
    │   ├── pages/
    │   │   ├── employee/        # Dashboard, KYCApprovals, DefaultTracker
    │   │   └── admin/           # Dashboard, AuditTrail, Reports
    │   ├── components/
    │   │   └── KernelMonitor    # Live OS stats footer strip
    │   ├── store/               # authStore.js
    │   └── lib/
    │       ├── useWebSocket.js  # WS hook (singleton connection)
    │       ├── firestore.js     # Firestore client
    │       └── tauri.js         # All invoke() wrappers (WAL, locks, system)
    └── src-tauri/
        └── src/
            └── commands/
                ├── wal.rs       # write_to_wal, verify_integrity
                ├── locks.rs     # acquire_lock, release_lock
                ├── system.rs    # get_system_stats
                ├── files.rs     # save_kyc_doc, export_report
                └── auth.rs      # OS keychain token storage
