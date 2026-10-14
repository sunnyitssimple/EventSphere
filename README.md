HEAD
# EventSphere – Smart Event Discovery & Ticket Booking System (MERN)

## Features
- Register / login (JWT, bcrypt), roles: `user` and `admin`
- **Cinematic, real-ticket-booking-style design** — dark/poster-driven by default, a photographic hero banner, ticket-stub cards with a price badge, with an automatic lighter theme for people who prefer it
- **60 events** across 6 cities (Chennai, Bengaluru, Hyderabad, Mumbai, Delhi, Pune) and 6 categories, with search, filters and sort (soonest, price, popularity, rating)
- **Smart recommendations**: ranked by the user's chosen interests + past bookings + popularity
- **Live, real-time updates (Socket.io)**: a "👀 X people here now" badge per event, and seat counts that update instantly on every open tab the moment anyone books or cancels — no refresh needed
- **Booking polish**: a countdown timer to the event, a confetti burst on a successful booking, and "add to calendar" (Google Calendar link + a downloadable `.ics` file for Outlook/Apple Calendar)
- **Realistic built-in checkout** — a self-contained simulated payment: a card-entry form with real-looking validation (16-digit number, Luhn check, expiry, CVV), a short "processing" delay, then confirmation. No external account, no API keys, nothing leaves your server.
- **Real QR codes** on every ticket (the `qrcode` package), checked by an **organizer check-in page** (camera scan or typed code)
- **Reviews & ratings** (one per user per event, requires a confirmed booking), shown as star ratings on cards and the event page
- Atomic seat checking at payment time — two people can't book the last seat
- My Bookings with QR codes, ticket codes, and cancellation (seats restored live)
- Admin panel: create / delete events

## Project structure
```
event-sphere/
├── server/                     Express + MongoDB API + Socket.io
│   ├── server.js               app entry (HTTP server shared by Express and Socket.io)
│   ├── seed.js                 10 flagship events + a 50-event generator, demo users/bookings/reviews
│   ├── config/
│   │   ├── db.js
│   │   └── socket.js           live viewer counts + seat-update broadcasts
│   ├── models/                 User, Event, Booking, Review
│   ├── middleware/auth.js      protect + adminOnly
│   ├── controllers/            auth, events, bookings (mock checkout + live broadcasts), reviews
│   └── routes/                 /api/auth, /api/events, /api/bookings, /api/reviews
└── client/                     React (Vite)
    └── src/
        ├── api.js              axios instance with JWT
        ├── socket.js           Socket.io client singleton
        ├── context/AuthContext.jsx
        ├── components/         Navbar, EventCard, Stars
        └── pages/
            ├── Home.jsx         cinematic hero, discovery + recommendations, live seat updates
            ├── EventDetail.jsx  tickets, checkout form, countdown, live viewers, confetti, calendar, reviews
            ├── Login.jsx / Register.jsx
            ├── MyBookings.jsx   tickets with QR codes
            ├── Admin.jsx        create/delete events
            └── CheckIn.jsx      organizer scanner (camera or typed code)
```

## Run it
Prerequisites: Node 18+, MongoDB running (local install or Atlas URI). No extra setup for the live/real-time features — Socket.io runs on the same server and port as the API, so there's nothing new to configure.

### Backend
```bash
cd server
cp .env.example .env     # fill in MONGO_URI and JWT_SECRET
npm install
npm run seed              # creates 60 events, admin + 2 demo users, sample bookings/reviews
npm run dev                # http://localhost:5000
```

### Frontend (new terminal)
```bash
cd client
npm install
npm run dev                 # http://localhost:5173
```

### Logins after seeding
- Admin: `admin@eventsphere.com` / `admin123`
- Demo users (already have bookings + reviews): `priya@example.com` / `demo1234`, `arjun@example.com` / `demo1234`

### See the live features
Open the same event in two browser tabs (or one normal + one incognito window, logged in as different users). In one tab, book a ticket — the other tab's seat count and "people here now" badge update immediately, with no refresh.

### Test a payment
On an event page, click **Proceed to pay**, then fill in the card form with:
- Card number: `4111 1111 1111 1111`
- Expiry: any future MM/YY (e.g. `12/28`)
- CVV: any 3 digits

Any other 16-digit number that fails the Luhn check (e.g. one with a digit changed) is correctly declined, so you can also demo the failure path.

## API
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | /api/auth/register | public | create account |
| POST | /api/auth/login | public | get JWT |
| GET | /api/auth/me | user | current user |
| PUT | /api/auth/interests | user | save interests |
| GET | /api/events?q=&category=&city=&sort=&page= | public | list/search (sort: date, price, popular, rating) |
| GET | /api/events/recommended | user | personalised list |
| GET | /api/events/:id | public | details |
| POST/PUT/DELETE | /api/events(/:id) | admin | manage events |
| POST | /api/bookings/pay | user | validate card, book tickets, generate QR, broadcast live seat update |
| GET | /api/bookings/mine | user | my tickets (incl. QR codes) |
| PUT | /api/bookings/:id/cancel | user | cancel + restore seats live |
| PUT | /api/bookings/checkin | admin | check a ticket code in at the door |
| GET | /api/reviews/event/:eventId | public | reviews for an event |
| POST | /api/reviews | user | add/update your review (needs a confirmed booking) |
| DELETE | /api/reviews/:id | user | delete your own review |

### Socket.io events (same server, default `/socket.io/` path)
| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `join-event` / `leave-event` | client → server | event id | join/leave that event's "room" to track viewers |
| `viewerCount` | server → room | `{ eventId, count }` | live "people here now" count for one event |
| `seatsUpdated` | server → everyone | `{ eventId, seatsLeft }` | broadcast after any booking or cancellation, anywhere |

## How the checkout works
There's no external payment gateway — this is intentional, so the project needs no sign-ups, API keys, or network access to run. `POST /api/bookings/pay` validates the card the way a real form would (16 digits, a Luhn check-digit pass, a not-yet-expired MM/YY, a 3–4 digit CVV), waits about a second to feel like a real processing round-trip, then decrements seats atomically so two people can't claim the same last seat, generates a ticket code and QR image, creates the booking, and broadcasts the new seat count over Socket.io. A card that fails the Luhn check is declined with a 402 status, so you can demo both outcomes.

## How the 60-event catalog is built
`seed.js` keeps the original 10 hand-written events, then generates 50 more from a hand-authored list of real-sounding event names (no "Event #37" placeholders) spread across all 6 categories. Each one is assigned a random city, a venue from that city's venue list, a realistic price/seat count range for its category, a date 3–75 days out, and a stable Picsum photo keyed to its own title — so re-running `npm run seed` gives fresh dates and numbers but the same well-formed catalog.

## Ideas to extend further
Email the ticket + QR code (Nodemailer), a "forgot password" flow, a wishlist, comments/Q&A per event, an interactive seat map, deployment (Render + Vercel + MongoDB Atlas).
