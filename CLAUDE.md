# CLAUDE.md — Newbridge Rental Calculator

This file documents the codebase structure, conventions, and workflows for AI assistants working on this project.

## What This App Does

A rental property investment analysis calculator built for financial advisors at **Newbridge Wealth Management** (Philadelphia metro focus). Advisors input a property address or Zillow/Redfin URL, the app uses Claude's web search to auto-populate property details, and then performs comprehensive investment analysis: cap rate, cash-on-cash return, DSCR, GRM, tax impact modeling, depreciation, scenario comparison, and print-ready client reports.

---

## Project Structure

```
rental-calculator/
├── server.js          # Express backend — only backend file
├── package.json       # Dependencies and npm scripts
├── .env               # Local environment variables (gitignored)
├── .env.example       # Template for environment variables
├── README.md          # End-user setup guide (non-technical audience)
└── public/
    └── index.html     # Entire React frontend (single file, 1350+ lines)
```

**There is no build step.** The frontend uses React 18 and Babel loaded from CDN; JSX is compiled in-browser at runtime. No webpack, Vite, TypeScript, or separate CSS files.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 (ES Modules) |
| Backend | Express 4.21 |
| AI / Data | Anthropic SDK 0.39 (`claude-sonnet-4-20250514`) |
| Frontend | React 18.3.1 (CDN UMD build) |
| JSX | Babel Standalone 7.26.4 (in-browser) |
| Fonts | Google Fonts (Montserrat, Space Mono, Playfair Display) |
| Config | dotenv |

---

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   PORT=3000            # optional, defaults to 3000
   ```
3. Install dependencies: `npm install`

---

## Development Workflow

```bash
npm run dev    # Start with --watch (auto-restarts on file changes)
npm start      # Production start
```

The app runs at `http://localhost:3000`. Because there is no build step, editing `public/index.html` takes effect immediately on browser refresh. Editing `server.js` triggers an auto-restart in dev mode.

---

## API Routes

### `POST /api/lookup`
AI-powered property data extraction using Claude with web search.

**Request body:**
```json
{ "query": "123 Main St, Philadelphia PA" }
// or
{ "query": "https://www.zillow.com/homedetails/..." }
```

**Response (success):**
```json
{
  "address": "123 Main St, Philadelphia PA 19103",
  "price": 320000,
  "rent": 2400,
  "tax": 4200,
  "ins": 1120,
  "hoa": 0,
  "beds": 3,
  "baths": 2,
  "sqft": 1400,
  "yearBuilt": 1985,
  "lotSqft": 3500,
  "parking": "1 Car Garage",
  "propertyType": "Single Family"
}
```

**Key behaviors:**
- Detects URL vs. address input and tailors the Claude prompt accordingly
- Auto-calculates insurance as 0.35% of purchase price if not found
- All numeric fields are validated to be non-negative
- Uses `claude-sonnet-4-20250514` model with the `web_search_20250305` tool

**Error responses:**
- `400` — query too short (< 5 chars)
- `422` — Claude returned no parseable JSON
- `429` — Anthropic rate limit hit
- `500` — missing API key or other server error

### `GET /api/health`
Returns `{ status: "ok", hasApiKey: boolean }`. Used for deployment health checks.

### `GET *`
All other routes serve `public/index.html` (SPA fallback).

---

## Frontend Architecture (`public/index.html`)

The entire React app lives in one file. Key sections:

### Utility Functions (top of `<script>`)
- `PMT(rate, nper, pv)` — standard loan payment formula
- `fmt(v, type)` — number formatter; types: `"$"`, `"$d"`, `"%"`, `"%2"`, `"x"`, `"n"`

### Color Palette (`C` object)
All colors are defined in the `C` constant at the top of the script. Use these exclusively — do not introduce new hex values inline. Key colors:
- `C.navy` `#1B2A4A` — primary text, headers
- `C.mdBlue` `#3A5BA0` — input values, accents
- `C.green` / `C.red` — positive / negative cash flow
- `C.gold` `#F39C12` — highlights, benchmarks
- `C.inputBg` `#FFF9E6` — input field background

### Reusable Components
| Component | Purpose |
|---|---|
| `Inp` | Labeled number/text input with optional prefix/suffix |
| `Row` | Key-value display row with optional bold/color styling |
| `Stat` | Large metric tile (cap rate, CoC, etc.) |
| `Card` | Section container with optional navy header bar |
| `Tab` | Navigation tab button |
| `Toggle` | On/off toggle switch |
| `ScorecardRow` | Metric row with colored pass/fail badge |

### App State
All state lives in the single `App` component (~30 `useState` hooks). Groups:
- **Property details:** `address`, `price`, `arv`, `rehab`, `closing`, `sqft`, `beds`, `baths`, `yearBuilt`, `parking`, `lotSqft`
- **Financing:** `dpPct`, `rate`, `term`
- **Income:** `rent`, `otherIncome`, `vacancy`
- **Expenses:** `propTax`, `insurance`, `hoa`, `repairPct`, `mgmtPct`, `capexPct`, `utilities`, `lawnPest`, `legalAcct`
- **Tax analysis:** `landValue`, `usefulLife`, `fedRate`, `stateRate`, `activeParticipation`, `reps`, `hours`, `income`, `filingStatus`, `taxYear`
- **UI:** `tab`, `loading`, `showAmort`, `showRehab`, `showScenarios`
- **Scenarios:** `scenarios` array for side-by-side comparison

### Financial Calculations (`useMemo`)
All computed metrics are derived in a single `useMemo` block. Key values:
- `monthlyMortgage`, `annualMortgage` — from `PMT()`
- `totalCash` — down payment + closing + rehab
- `opEx` — sum of all annual operating expenses
- `noi` — Net Operating Income (gross income − operating expenses)
- `annualCF` / `monthlyCF` — after-mortgage cash flow
- `capRate` — NOI / price
- `coc` — annualCF / totalCash
- `grm` — price / (rent × 12)
- `dscr` — NOI / annualMortgage
- `onePct` — rent / price
- Tax calculations using `TAX_DATA` brackets (2022–2030)

### Tabs
1. **Calc** — main calculator with all inputs and metrics
2. **Scenarios** — side-by-side multi-property comparison
3. **Tax Analysis** — depreciation, passive loss rules, federal/state impact
4. **Guide** — educational metric explanations with Philadelphia market context

### Tax Data
`TAX_DATA` object contains federal bracket data for tax years 2022–2030, supporting 5 filing statuses: Single, MFJ (Married Filing Jointly), MFS (Married Filing Separately), HOH (Head of Household), QSS (Qualifying Surviving Spouse).

### Default Scenarios
Three pre-loaded example properties (A, B, C) in the Philadelphia suburbs with realistic 2024-era numbers. These serve as demos and testing baselines.

---

## Code Conventions

### JavaScript Style
- ES Modules (`import`/`export`) in `server.js`
- Arrow functions throughout the frontend
- `async`/`await` for all async operations
- `camelCase` for variables and functions
- Semicolons used consistently
- 2-space indentation

### Section Markers
Use `// ── Section Name ──` style dividers to separate logical sections in `index.html`. Examples already in the file: `// ── Financial Helpers ──`, `// ── Colors ──`, `// ── Reusable Components ──`.

### Inline Styles
All styling in `index.html` uses inline React style objects. Reference the `C` color palette. Do not add a separate CSS file or move styles to a `<style>` tag unless it's a media query (print/screen queries are already in the `<style>` tag at the top).

### No Type Annotations
The project is plain JavaScript — do not add TypeScript, JSDoc type annotations, or PropTypes.

### No Test Files
There is no test infrastructure. Manual testing by running the app is the expected workflow.

### No Linting Config
No ESLint or Prettier config exists. Maintain consistent style by following existing patterns in the file.

---

## Key Business Logic Notes

- **Insurance auto-fill:** If the API lookup returns 0 for insurance, the server calculates it as `price × 0.0035` (0.35% of purchase price — PA market default).
- **Depreciation:** Uses 27.5-year useful life for residential rental property (standard IRS schedule). The `usefulLife` field is user-editable.
- **Passive loss rules:** The tax tab models the $25,000 rental loss allowance for active participants earning under $100k (phases out to $150k). REPS (Real Estate Professional Status) exemption is also modeled.
- **Benchmarks:** Cap rate, CoC, GRM, DSCR, 1% rule, and break-even thresholds are all user-adjustable via the Guide tab — they default to Philadelphia metro norms.
- **Print output:** The `no-print` CSS class hides nav/buttons; `print-only` shows the Newbridge logo header. White-label reports are a core feature — preserve print CSS carefully.

---

## Git Conventions

- **Commit style:** Lowercase imperative ("add feature", "fix bug", "update X") — no conventional commit prefixes
- **No CI/CD** — deployment to Render.com is manual (push to GitHub, Render auto-deploys)
- **Feature branches:** `claude/<description>-<id>` naming observed

---

## Deployment

The app deploys to **Render.com** (free tier). The README contains full instructions for non-technical users. Required environment variable on Render: `ANTHROPIC_API_KEY`. The `PORT` variable is set automatically by Render.

Start command: `npm start` (runs `node server.js`)

---

## Common Tasks

### Add a new financial metric
1. Add the calculation in the `useMemo` block in `App`
2. Display it using a `<Stat>` or `<Row>` component in the Calc tab JSX
3. Optionally add a benchmark to `benchmarks` state and an entry in the Guide tab array

### Modify the property lookup prompt
Edit the `system` prompt string and/or `searchInstructions` in `server.js` lines 53–74. The model is `claude-sonnet-4-20250514`.

### Add a new expense field
1. Add `useState` for the new field
2. Include it in the `opEx` calculation in `useMemo`
3. Add an `<Inp>` component in the Expenses card
4. Include it in the scenarios array structure if you want it saved in scenarios

### Change the color scheme
Update the `C` object near the top of the `<script>` block in `index.html`. All components reference `C.*` — changing values there propagates everywhere.
