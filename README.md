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

Your `.env` already has these defaults from `.env.example` — so if MongoDB is running locally you can just start and it works.

---

## 3. Create demo accounts (optional but recommended)

```bash
cd backend
npm run seed
```

This creates two ready-to-use accounts:

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@demo.com | password123 |
| Resident | resident@demo.com | password123 |

---

## 4. Optional features — set up when you want them

These are all **optional**. The app runs fine without any of them.

### Payments (Razorpay)

Sign up free at https://dashboard.razorpay.com → Settings → API Keys → Generate test keys.

In `backend/.env`:
```
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
```

In `frontend/.env`:
```
VITE_RAZORPAY_KEY_ID=rzp_test_xxxx
```

Without this: residents see a "Pay Now" button but clicking it shows an error. Everything else works.

---

### Image uploads (Cloudinary)

Sign up free at https://cloudinary.com → copy credentials from the dashboard.

In `backend/.env`:
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Without this: uploading photos shows an error. All other features work fine.

---

### Google Sign-In

Go to https://console.cloud.google.com → APIs & Credentials → Create OAuth 2.0 Client ID (Web application) → add `http://localhost:5173` as an Authorized JavaScript origin.

In `backend/.env`:
```
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

In `frontend/.env`:
```
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

Without this: the "Sign in with Google" button is hidden. Email/password login works normally.

---

### Email notifications (Gmail)

1. Enable 2-Step Verification on your Google account
2. Go to https://myaccount.google.com/apppasswords → generate an App Password
3. In `backend/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=the-app-password-you-just-generated
```

Without this: emails are silently skipped. Everything else works fine.

---

## 5. Project structure (quick reference)

```
smart-pg/
├── backend/
│   ├── config/         ← DB, Cloudinary, Razorpay, Google, email, logger
│   ├── controllers/    ← auth, pg, room, payment, complaint, notification, review
│   ├── middleware/     ← JWT auth, validation, rate limiting, error handling
│   ├── models/         ← User, PG, Room, Payment, Complaint, Notification, Review
│   ├── routes/         ← one file per feature
│   ├── utils/          ← helpers, email templates, cron jobs
│   ├── tests/          ← automated tests (run with: npm test)
│   ├── .env.example    ← copy this to .env
│   ├── server.js       ← entry point
│   └── seed.js         ← demo data
│
└── frontend/
    ├── src/
    │   ├── components/ ← shared UI components
    │   ├── layouts/    ← owner and resident sidebar layouts
    │   ├── pages/      ← all screens
    │   └── services/   ← API calls
    ├── .env.example    ← copy this to .env
    └── vite.config.js
```

---

## 6. Features at a glance

**Owner can:**
- Create PGs with photos, amenities, rules
- Add and manage rooms
- Assign residents by email (even if they haven't signed up yet)
- Generate monthly rent records with one click
- Record cash/UPI payments offline
- View revenue analytics (last 6 months chart)
- Track and respond to complaints

**Resident can:**
- Browse and search PGs by city, budget, amenities
- Pay rent online via Razorpay (UPI, card, netbanking)
- Download PDF receipts
- Raise complaints with priority levels
- Leave star ratings and reviews for their PG
- Upload ID proof and profile photo
- Get in-app notifications for all key events

---

## 7. Useful commands

```bash
# Backend
npm run dev      # start with hot reload (nodemon)
npm run seed     # populate demo data
npm test         # run automated tests

# Frontend
npm run dev      # start Vite dev server
npm run build    # build for production (output: frontend/dist/)
```

---

## 8. Common issues

**MongoDB connection failed**
Make sure MongoDB is running. On most systems: `mongod` or start it from MongoDB Compass.

**Port already in use**
Backend uses port 5000, frontend uses 5173. Kill whatever is on those ports or change `PORT=` in `backend/.env`.

**"Razorpay not configured" error**
Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `backend/.env` and `VITE_RAZORPAY_KEY_ID` to `frontend/.env`.

**Google button not showing**
Add `VITE_GOOGLE_CLIENT_ID` to `frontend/.env` and make sure `http://localhost:5173` is in your Google OAuth app's authorized origins.
