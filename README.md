# Smart PG — Local Development Setup

A full-stack PG management platform. Run it locally in 5 minutes.

---

## What you need installed

- **Node.js 22+** — https://nodejs.org
- **MongoDB** — https://www.mongodb.com/try/download/community (free Community edition)

That's it. Everything else installs via npm.

---

## 1. Get the code running

Open **two terminals** — one for the backend, one for the frontend.

### Terminal 1 — Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The backend starts at **http://localhost:5000**

### Terminal 2 — Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app opens at **http://localhost:5173**

---

## 2. The only env vars you actually need right now

Open `backend/.env` and set these two — everything else is optional and the app works without them:

```
MONGO_URI=mongodb://localhost:27017/smart-pg
JWT_SECRET=any-long-random-string-you-make-up
```

---

## 3. Create demo accounts (optional but recommended)

```bash
cd backend
npm run seed
```

This creates three ready-to-use accounts:

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@demo.com | password123 |
| Resident | resident@demo.com | password123 |
| Admin | admin@demo.com | password123 |

The seed also adds a demo staff member and a sample announcement so those
screens aren't empty on first login.

---

## 4. Optional features — set up when you want them

All optional. The app runs fine without any of them; the relevant feature
just shows a friendly "not configured" message instead.

### Payments (Razorpay) — for the "Smart PG (Online)" method

Sign up free at https://dashboard.razorpay.com → Settings → API Keys.

`backend/.env`: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, optionally `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_CONVENIENCE_FEE` (defaults to 20).
`frontend/.env`: `VITE_RAZORPAY_KEY_ID`

Direct UPI and Cash payment methods work without Razorpay — they just need
the owner's UPI ID set in **Owner → Settings**.

### Image uploads (Cloudinary) — for photos, ID proofs, documents, complaint images, payment screenshots

Sign up free at https://cloudinary.com.

`backend/.env`: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Google Sign-In

`console.cloud.google.com` → OAuth 2.0 Client ID → add `http://localhost:5173` as an origin.

`backend/.env`: `GOOGLE_CLIENT_ID` · `frontend/.env`: `VITE_GOOGLE_CLIENT_ID`

### Email notifications (Gmail SMTP)

`backend/.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

### Mobile OTP login

Works out of the box in development — OTP codes are logged to the backend
console (and echoed in the API response as `devHint`) since no SMS gateway
is wired up. To go live, plug a provider (Twilio, MSG91, etc.) into
`backend/utils/otp.js`.

---

## 5. Project structure

```
smart-pg/
├── backend/
│   ├── config/         ← DB, Cloudinary, Razorpay, Google, email, logger
│   ├── controllers/    ← one file per feature area (see list below)
│   ├── middleware/     ← JWT auth, owner/admin guards, validation, rate limiting
│   ├── models/         ← Mongoose schemas — one per collection
│   ├── routes/         ← one file per feature, mounted in app.js
│   ├── utils/          ← helpers: email templates, OTP, activity log, cron jobs
│   ├── tests/          ← Jest + Supertest (run with: npm test)
│   ├── .env.example
│   ├── server.js       ← entry point
│   └── seed.js         ← demo data
│
└── frontend/
    ├── src/
    │   ├── components/ ← shared UI (search bar, theme toggle, uploaders, etc.)
    │   ├── layouts/     ← Owner / Resident / Admin shell layouts
    │   ├── pages/        ← all screens, split into owner/ and resident/
    │   └── services/    ← one API client module per feature
    ├── .env.example
    └── vite.config.js
```

---

## 6. Full feature list

**Landing & browsing**
- Hero search, popular filters (city, locality, rent, gender, sharing, amenities), sort (price/rating/newest), pagination

**Authentication**
- Email + password, Google Sign-In, and no-password **mobile OTP login** for both owners and residents

**Owner tools**
- PG CRUD with photos, amenities, rules, archive/unarchive
- Room management (capacity, rent, type, status)
- Resident allocation by email **or** self-service **QR invite** (spec §7)
- Rent generation, 3-way **payment approvals** (Razorpay auto / UPI screenshot / cash claim)
- Complaints with category, photos, and staff assignment
- **Announcements** broadcast to all current residents (in-app + email)
- **Staff management** with attendance tracking
- **Visitor management** — resident invites, owner approval, QR entry/exit logging
- **Expense tracking** by category with monthly totals
- **Inventory** tracking with repair history
- **Reports** — PDF and Excel export (revenue, occupancy, payments, residents, complaints)
- **Activity log** — full audit trail of every owner-side action
- **Global search** across residents, PGs, rooms, complaints, payments
- Payment settings (enable/disable Razorpay/UPI/Cash, UPI ID with auto-generated QR)
- Business profile settings (logo, bank details, GST)

**Resident tools**
- Dashboard, room & roommates view, ID/document verification, documents (rental agreement, police verification)
- Pay rent 3 ways: Smart PG (Razorpay, auto-verified), Direct UPI (screenshot + owner approval), Cash (claim + owner approval)
- Downloadable PDF receipts
- Complaints with photos and category
- Announcements feed
- Invite visitors with a QR code

**Platform admin (minimal, per spec's "Future" note)**
- Read-only platform stats, owner list with suspend/reactivate, all-PGs view

**Cross-cutting**
- Light/dark theme toggle
- In-app notifications for every event (payment, complaint, announcement, visitor, allocation, review)

---

## 7. Useful commands

```bash
# Backend
npm run dev      # start with hot reload (nodemon)
npm run seed     # populate demo data
npm test         # run automated tests (Jest + in-memory MongoDB)

# Frontend
npm run dev      # start Vite dev server
npm run build    # build for production (output: frontend/dist/)
```

---

## 8. Common issues

**MongoDB connection failed** — make sure MongoDB is running (`mongod` or via MongoDB Compass).

**Port already in use** — backend uses 5000, frontend uses 5173. Kill the process or change `PORT=` in `backend/.env`.

**"Payment gateway is not configured" error** — only affects the Smart PG (Razorpay) method; Direct UPI and Cash work without it.

**OTP not arriving** — no SMS gateway is wired up in this build; the code is printed to the backend terminal and returned as `devHint` in dev mode.
