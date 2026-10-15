# Kasa Ledger

A local-first personal finance and wealth management PWA built with React, TypeScript, and Tailwind CSS. 

Kasa Ledger runs entirely in your browser. There is no backend, no cloud database, and no account registration required. Your financial data stays strictly on your device.

---

## Features

- **Multi-Account Ledger**: Track balances across cash, bank accounts, and e-wallets with running balance calculations.
- **Tagihan & Liabilities**: Track loans, installments, and recurring bills with due dates, late fee penalty logging, and one-click payment deductions from selected accounts.
- **Sinking Funds**: Allocate money toward specific savings targets and track milestone progress.
- **Time Deposits (Deposito)**: Monitor fixed deposits with automatic net return, interest, tax deduction, and maturity date calculations.
- **Cashflow & Reports**: Visual monthly breakdowns (income, expenses, net savings rate, and net worth overview).
- **Import / Export**:
  - Full state backup & restore as JSON (validated via Zod schema).
  - Transaction mutation history exported as CSV with running balance.
  - Client-side PDF financial statement generation (`jspdf` + `jspdf-autotable`).
- **Offline & PWA**: Installable as a standalone app on iOS, Android, macOS, and Windows via Service Worker.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18, Vite 5 |
| **Language** | TypeScript (Strict mode) |
| **Styling** | Tailwind CSS |
| **State Management** | Zustand (with `persist` middleware to `localStorage`) |
| **Schema Validation** | Zod |
| **Icons** | Lucide React |
| **Document Export** | jsPDF, jsPDF-AutoTable |
| **PWA** | vite-plugin-pwa |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm / yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/itsnabih/kasa-ledger.git

# Enter project directory
cd kasa-ledger

# Install dependencies
npm install

# Start local development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Production Build

```bash
# Typecheck and bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Project Structure

```text
kasa-ledger/
├── public/                 # Static assets (favicons, PWA icons, .nojekyll)
├── src/
│   ├── components/         # Shared UI components, layout shell, modals
│   ├── features/
│   │   ├── bills/          # Tagihan & liabilities management
│   │   ├── dashboard/      # Net worth, account summary & recent activity
│   │   ├── deposits/       # Time deposit tracking & interest calculations
│   │   ├── goals/          # Sinking funds & savings targets
│   │   ├── reports/        # Cashflow analytics & PDF export
│   │   └── transactions/   # Double-entry ledger & transaction forms
│   ├── hooks/              # Custom React hooks (theme, PWA install)
│   ├── lib/                # Math helpers, formatters, backup/export logic
│   ├── store/              # Zustand global store & persistence logic
│   ├── types/              # TypeScript definitions & Zod schemas
│   ├── App.tsx             # Root layout & tab routing
│   └── main.tsx            # Application entry point
├── index.html              # Vite HTML entry point
├── tailwind.config.js      # Tailwind design configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite & PWA build configuration
```

---

## Data & Privacy

All transactions, accounts, and goal data are stored locally in the browser under the `kasa_ledger_v1` key in `localStorage`. 

- No external analytics, trackers, or remote APIs are called.
- You can export a full JSON snapshot anytime from the settings/reports menu for cold backups or moving data across devices.
- To reset or test with demo data, use the built-in seed and wipe options in the application.

---

## License

MIT
