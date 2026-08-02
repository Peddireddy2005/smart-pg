# Smart PG

A full-stack paying-guest (PG) accommodation management platform for property owners and their residents — rooms, rent collection, complaints, staff, announcements, and reporting in one place.

**Stack:** React 19 + Vite (frontend) · Node.js/Express + MongoDB/Mongoose (backend) · JWT auth with rotating refresh tokens · Razorpay payments · Cloudinary uploads · Sentry error monitoring

---

## What's in this pass

This update fixes two real bugs found while reviewing the codebase, plus a visual refresh:

| File | Issue | Fix |
|---|---|---|
| `backend/utils/notify.js` | Was an accidental copy of `generateToken.js` — it exported a JWT signer, not a `notify()` function. Every place that does `const { notify } = require("../utils/notify")` (payments, complaints, invites, room allocation, announcements, vacate notices) was destructuring `undefined` and would throw at runtime the moment it ran. | Rewrote it to actually create a `Notification` document, matching the `{ user, title, message, type, link }` signature every controller already calls it with. |
| `frontend/src/index.css` | Custom classes (`.input`, `.btn-primary`, `.card`, badges, etc.) were declared as plain CSS *after* the three `@tailwind` directives, so they sat later in the final stylesheet than Tailwind's own utility classes. That silently let `.input`'s own padding win over utility overrides like `pl-9`/`pr-14`, which is why the global search bar's icon and `⌘K` badge were overlapping the placeholder text. | Wrapped the custom classes in `@layer base` / `@layer components` so Tailwind's intended cascade order (base → components → utilities) is respected everywhere in the app, not just in search. |
| `frontend/src/components/GlobalSearch.jsx` | Depended on absolute positioning fighting the input's padding (root cause of the bug above), and the dropdown styling was plain. | Rebuilt with a flex layout (icon / input / clear-or-⌘K all as siblings, no overlap possible regardless of CSS cascade), a focus ring, a clear (✕) button once you've typed something, and a cleaner grouped results dropdown with icon chips. |
| `backend/controllers/paymentController.js` → `getInvoice` | The rent receipt PDF was a left-aligned dump of `Label: value` lines with no branding or hierarchy. | Redesigned: dark branded header bar with a "✓ PAID" stamp, a two-column details grid, a highlighted amount panel, and a dashed perforated-stub footer (echoes the ledger-stub motif already used on the homepage hero). |

### Also worth knowing about (not changed, flagged for you)
- `frontend/package.json` pins `react-router-dom: ^6.28.0`, but `frontend/package-lock.json` has actually resolved `react-router-dom` **7.18.1** (and Vite 8 / `@vitejs/plugin-react` 6, not the versions in `package.json`). The app code uses v6-style `<Routes>`/`<Route>`, which is compatible with v7, but the two files disagree on what's "supposed" to be installed. If you run `npm ci` you'll get v7; if you ever regenerate the lockfile from `package.json` you'll get v6. Worth deciding which one you actually want and aligning both files.
- The Tailwind CSS layer issue above was global, not just the search bar — any place in the app combining `className="input ..."` (or `.card`, `.btn-primary`, etc.) with a Tailwind utility meant to *override* one of those properties had the same silent-override problem. The `@layer` fix resolves it everywhere at once.

---

## Project structure

```
smart-pg/
├── backend/          Express API, MongoDB models, Razorpay/Cloudinary/Sentry config
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── scripts/       one-off migration scripts
│   ├── tests/          Jest + Supertest, in-memory Mongo replica set
│   └── server.js
└── frontend/          React 19 + Vite, Tailwind CSS
    ├── src/
    │   ├── pages/       owner/, resident/, admin/, public pages
    │   ├── layouts/      OwnerLayout, ResidentLayout, AdminLayout
    │   ├── components/
    │   └── services/     one file per API resource (axios wrapper)
    └── vercel.json
```

---

## Getting started (local dev, Windows/PowerShell)

### Backend

```powershell
cd backend
npm install
copy .env.example .env    # if you have one — otherwise create backend\.env manually
npm run seed               # optional: demo owner/resident/admin + sample data
npm run dev                 # nodemon, http://localhost:5000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev                 # http://localhost:5173, proxies /api to VITE_API_URL or localhost:5000
```

### Tests

```powershell
cd backend
npm test
```

---

## Environment variables (backend/.env)

| Variable | Required | Notes |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Signs short-lived (~1h) access tokens |
| `JWT_EXPIRE` | No | Default `1h` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | Default `30`; refresh tokens are stored hashed with a TTL index |
| `ENCRYPTION_KEY` | Yes, before any ID proof is saved | 64-char hex string (32 bytes). **Never rotate this once data is encrypted** without running a re-encryption migration — back it up outside the repo. |
| `CLIENT_URLS` | Yes | Comma-separated list of allowed CORS origins |
| `FRONTEND_URL` | Yes | Used to build invite/reset-password links |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Yes, for image uploads | |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Yes, for online rent payments | |
| `RAZORPAY_WEBHOOK_SECRET` | No | Webhook is a no-op (200 OK, no-op) if unset |
| `RAZORPAY_CONVENIENCE_FEE` | No | Default ₹20 |
| `GOOGLE_CLIENT_ID` | No | Enables Google sign-in; feature is a no-op if unset |
| `SENTRY_DSN` | No | Sentry is a no-op if unset |
| `PORT` | No | Default `5000` |

Email/SMTP is intentionally not used anywhere — password reset returns a direct link in the API response instead of emailing an OTP, and residents are verified immediately on signup.

### Frontend (`frontend/.env`)

| Variable | Notes |
|---|---|
| `VITE_API_URL` | Backend origin, e.g. `http://localhost:5000`. Falls back to a relative `/api` if unset. |
| `VITE_GOOGLE_CLIENT_ID` | Optional — Google sign-in button hides itself if unset. |

---

## Core features

- **Owners:** multi-PG management, rooms & rent generation, QR/code resident invites, staff & attendance, expenses, complaints, announcements, activity log, PDF/Excel reports, analytics.
- **Residents:** join by QR/code, pay rent three ways (Razorpay / Direct UPI with proof upload / Cash claim — all owner-approved except Razorpay which auto-verifies), raise complaints with photos, vacate notices, reviews.
- **Security:** AES-256-GCM encryption at rest for ID proof numbers, short-lived JWT access tokens with rotating refresh tokens (revoked on password change), rate limiting, Helmet, Mongo-injection sanitization.
- **Admin:** read-only platform stats, owner/PG visibility, account suspension.

---

## Deployment

- **Frontend:** Vercel (`frontend/vercel.json` handles SPA rewrites).
- **Backend:** any Node host with a MongoDB connection; run the ID-proof encryption migration (`npm run migrate:encrypt-id-proofs`) once after first deploying `ENCRYPTION_KEY`.
- Remember: `ENCRYPTION_KEY` must never change after data is encrypted with it, and should be backed up somewhere outside the repo.