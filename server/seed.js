import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import QRCode from "qrcode";
import User from "./models/User.js";
import Event from "./models/Event.js";
import Booking from "./models/Booking.js";
import Review from "./models/Review.js";

const d = (days, h = 18) => { const x = new Date(); x.setDate(x.getDate() + days); x.setHours(h, 0, 0, 0); return x; };
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const img = (seed) => `https://picsum.photos/seed/${seed}/800/500`;
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];

const ev = (title, category, city, venue, days, price, seats, popularity, description, seed) =>
  ({ title, category, city, venue, date: d(days), price, totalSeats: seats, seatsLeft: seats, popularity, description, image: img(seed) });

await mongoose.connect(process.env.MONGO_URI);
await Promise.all([User.deleteMany(), Event.deleteMany(), Booking.deleteMany(), Review.deleteMany()]);

await User.create({ name: "Admin", email: "admin@eventhub.com", password: await bcrypt.hash("admin123", 10), role: "admin" });
const priya = await User.create({ name: "Priya Raman", email: "priya@example.com", password: await bcrypt.hash("demo1234", 10), interests: ["Music", "Comedy", "Tech"] });
const arjun = await User.create({ name: "Arjun Mehta", email: "arjun@example.com", password: await bcrypt.hash("demo1234", 10), interests: ["Tech", "Sports"] });

// ---- 10 hand-picked flagship events (kept from the original catalog) ----
const flagship = [
  ev("Carnatic Nights Live", "Music", "Chennai", "Music Academy", 12, 800, 400, 9, "An evening of classical Carnatic vocals.", "carnatic-music"),
  ev("Chennai Startup Summit", "Tech", "Chennai", "Chennai Trade Centre", 20, 1500, 900, 8, "Founders, investors and demos.", "startup-summit"),
  ev("Sunset Stand-Up Comedy", "Comedy", "Bengaluru", "Chowdiah Memorial Hall", 8, 999, 350, 7, "Top comics, one stage.", "standup-comedy"),
  ev("Marina Half Marathon", "Sports", "Chennai", "Marina Beach", 35, 600, 2000, 8, "21 km along the beach road.", "marina-marathon"),
  ev("Diwali Food & Craft Fest", "Food", "Hyderabad", "Necklace Road Grounds", 30, 250, 1500, 6, "Street food and handmade crafts.", "diwali-food"),
  ev("AI & Data Engineering Workshop", "Tech", "Bengaluru", "Koramangala Hub", 15, 2200, 120, 9, "Hands-on full-day workshop.", "ai-workshop"),
  ev("Indie Rock Open Air", "Music", "Mumbai", "Mahalaxmi Racecourse", 45, 1800, 3000, 9, "Ten bands, one open field.", "indie-rock"),
  ev("Street Photography Walk", "Arts", "Chennai", "Mylapore", 10, 300, 25, 5, "Guided sunrise photo walk.", "photo-walk"),
  ev("Kabaddi Premier Night", "Sports", "Hyderabad", "Gachibowli Stadium", 28, 700, 5000, 8, "League match night.", "kabaddi-night"),
  ev("Contemporary Art Expo", "Arts", "Mumbai", "NGMA", 50, 400, 600, 6, "Works from 40 emerging artists.", "art-expo"),
];

// ---- venues per city, for the generated catalog ----
const VENUES = {
  Chennai: ["Phoenix MarketCity Grounds", "YMCA Nandanam Grounds", "Kamaraj Memorial Hall", "Nehru Indoor Stadium"],
  Bengaluru: ["Palace Grounds", "UB City Amphitheatre", "Jayamahal Palace Lawns", "Manpho Convention Centre"],
  Hyderabad: ["Shilparamam", "HITEX Exhibition Centre", "People's Plaza", "JRC Convention Centre"],
  Mumbai: ["Jio World Garden", "Bandra Amphitheatre", "Rangsharda Auditorium", "MMRDA Grounds"],
  Delhi: ["India Habitat Centre", "Jawaharlal Nehru Stadium", "Dilli Haat", "Select Citywalk Grounds"],
  Pune: ["Balewadi Stadium", "Phoenix Marketcity Pune", "Osho Teerth Park", "JW Marriott Convention Centre"],
};
const CITIES = Object.keys(VENUES);

// ---- 50 real-feeling event names, by category, each with its own description ----
const CATALOG = [
  // Music (9)
  ["Unplugged: Acoustic Sessions", "Music", "A stripped-down evening of acoustic covers and originals."],
  ["EDM Nightfall: Neon Pulse", "Music", "Lasers, bass drops and a lineup of regional DJs."],
  ["Bollywood Retro Night", "Music", "A live band plays the decades of Hindi film music."],
  ["Jazz by the Bay", "Music", "A relaxed evening set from a touring jazz quartet."],
  ["Classical Fusion: Strings & Ragas", "Music", "Carnatic ragas reimagined with violin and cello."],
  ["Hip-Hop Cypher Live", "Music", "Freestyle battles and sets from the local rap scene."],
  ["Monsoon Melodies Festival", "Music", "An open-air multi-genre festival timed to the first rains."],
  ["Sufi Soul Night", "Music", "Qawwali and Sufi devotional music under the stars."],
  ["Battle of the Bands: College Edition", "Music", "Eight college bands compete for a recording contract."],
  // Tech (9)
  ["DevOps & Cloud Native Meetup", "Tech", "Talks on Kubernetes, CI/CD and platform engineering."],
  ["Product Management Bootcamp", "Tech", "A one-day intensive on roadmaps, metrics and user research."],
  ["Web3 & Blockchain Conclave", "Tech", "Builders and investors discuss where decentralized tech is headed."],
  ["UX Design Sprint Workshop", "Tech", "Run a full five-day design sprint compressed into one day."],
  ["Cybersecurity CTF Night", "Tech", "A capture-the-flag contest for ethical hackers of all levels."],
  ["Mobile App Dev Hackathon", "Tech", "24 hours to ship a working mobile app, judged live."],
  ["Women in Tech Leadership Summit", "Tech", "Talks and mentorship on growing into engineering leadership."],
  ["Robotics & IoT Expo", "Tech", "Student and startup robots on display, with live demos."],
  ["Open Source Contributors Meetup", "Tech", "Maintainers and first-time contributors pair up on real issues."],
  // Comedy (8)
  ["Roast Battle Live", "Comedy", "Comedians roast each other — and volunteers from the crowd."],
  ["Improv Comedy Jam", "Comedy", "Fully unscripted scenes built from audience suggestions."],
  ["Desi Dads: A Comedy Special", "Comedy", "A stand-up special on parenting, in-laws and WiFi passwords."],
  ["Late Night Laughs", "Comedy", "A rotating lineup of headliners in a late-night slot."],
  ["Clean Comedy Family Night", "Comedy", "Stand-up safe for the whole family, kids included."],
  ["Hinglish Humor Hour", "Comedy", "Bilingual stand-up that switches between Hindi and English."],
  ["Comedy Club Open Mic", "Comedy", "New comics get five minutes each on a real stage."],
  ["Satire Night: Current Affairs Edition", "Comedy", "Sharp, topical sets on the week's headlines."],
  // Sports (8)
  ["City Cricket Premier League Final", "Sports", "The decider match of the city's amateur T20 league."],
  ["Badminton Open Championship", "Sports", "Singles and doubles brackets, open to all skill levels."],
  ["5K Fun Run & Family Walk", "Sports", "A timed 5K plus an untimed family walk on the same route."],
  ["Football Turf League Finals", "Sports", "Six-a-side football, finals night under floodlights."],
  ["Chess Grandmaster Exhibition Match", "Sports", "A titled player takes on 20 challengers simultaneously."],
  ["MMA Fight Night", "Sports", "A full card of amateur and professional MMA bouts."],
  ["Cycling Circuit Challenge", "Sports", "A closed-road timed circuit race for all categories."],
  ["Table Tennis Open Tournament", "Sports", "Knockout rounds across junior, open and veteran divisions."],
  // Food (8)
  ["Street Food Carnival", "Food", "Forty stalls of regional street food in one place."],
  ["Craft Beer & BBQ Fest", "Food", "Local breweries pair their beers with a live-fire BBQ menu."],
  ["South Indian Thali Food Walk", "Food", "A guided tasting trail through the city's best thali spots."],
  ["Dessert & Bakery Expo", "Food", "Patisseries and home bakers showcase their best desserts."],
  ["Wine & Cheese Tasting Evening", "Food", "A guided pairing flight for six wines and six cheeses."],
  ["Vegan Food Festival", "Food", "An all-plant-based lineup of stalls, from momos to mithai."],
  ["Coffee Culture Fest", "Food", "Roasters and baristas run tastings, cuppings and latte-art demos."],
  ["Biryani Trail Food Tour", "Food", "A tasting tour across the city's most argued-about biryanis."],
  // Arts (8)
  ["Modern Sculpture Exhibition", "Arts", "A curated show of contemporary metal and stone sculpture."],
  ["Theatre Festival: One-Act Plays", "Arts", "Six independent troupes perform one-act plays back to back."],
  ["Watercolor & Sketching Workshop", "Arts", "A beginner-friendly workshop, materials included."],
  ["Folk Dance Showcase", "Arts", "Regional folk dance troupes perform traditional routines."],
  ["Indie Film Screening Night", "Arts", "Short films from independent regional filmmakers, with a Q&A."],
  ["Pottery & Ceramics Fair", "Arts", "Local potters sell and demonstrate wheel-thrown ceramics."],
  ["Poetry Slam: Spoken Word Night", "Arts", "Competitive spoken-word poetry, open mic rounds included."],
  ["Calligraphy & Typography Workshop", "Arts", "Hands-on lettering practice with pointed pen and brush."],
];

const PRICE_RANGE = { Music: [400, 1800], Tech: [1200, 3000], Comedy: [300, 1200], Sports: [250, 900], Food: [150, 500], Arts: [200, 900] };
const SEAT_RANGE = { Music: [200, 3000], Tech: [80, 500], Comedy: [100, 500], Sports: [150, 5000], Food: [200, 2000], Arts: [40, 400] };

const generated = CATALOG.map(([title, category, description]) => {
  const city = pick(CITIES);
  const venue = pick(VENUES[city]);
  const [pLo, pHi] = PRICE_RANGE[category];
  const [sLo, sHi] = SEAT_RANGE[category];
  return ev(title, category, city, venue, rand(3, 75), rand(pLo, pHi), rand(sLo, sHi), rand(5, 9), description, slug(title));
});

const events = await Event.insertMany([...flagship, ...generated]);
const byTitle = Object.fromEntries(events.map((e) => [e.title, e]));
console.log(`Inserted ${events.length} events across ${CITIES.length} cities.`);

async function ticket() {
  const code = "EH" + crypto.randomBytes(3).toString("hex").toUpperCase();
  return { ticketCode: code, qrCode: await QRCode.toDataURL(code, { margin: 1, width: 240 }), transactionId: "TXN" + crypto.randomBytes(5).toString("hex").toUpperCase() };
}

// A few demo bookings + reviews so the app doesn't look brand new on first run.
const demo = [
  { user: priya, title: "Carnatic Nights Live", rating: 5, comment: "Beautiful performance, loved every minute." },
  { user: priya, title: "Sunset Stand-Up Comedy", rating: 5, comment: "Laughed the entire time, highly recommend." },
  { user: priya, title: "AI & Data Engineering Workshop", rating: 5, comment: "Hands-on and genuinely useful, worth the price." },
  { user: arjun, title: "Chennai Startup Summit", rating: 4, comment: "Great speakers, a bit crowded near the demo booths." },
  { user: arjun, title: "Marina Half Marathon", rating: 4, comment: "Well organized — water stations could be more frequent." },
];
for (const row of demo) {
  const event = byTitle[row.title];
  const t = await ticket();
  await Booking.create({ user: row.user._id, event: event._id, quantity: 1, tier: "Standard", totalAmount: event.price, ...t });
  await Event.findByIdAndUpdate(event._id, { $inc: { seatsLeft: -1 } });
  await Review.create({ user: row.user._id, event: event._id, rating: row.rating, comment: row.comment });
}
for (const title of [...new Set(demo.map((r) => r.title))]) {
  const event = byTitle[title];
  const revs = await Review.find({ event: event._id });
  const avg = revs.reduce((s, r) => s + r.rating, 0) / revs.length;
  await Event.findByIdAndUpdate(event._id, { avgRating: Math.round(avg * 10) / 10, reviewCount: revs.length });
}

console.log("Seeded. Admin: admin@eventhub.com / admin123");
console.log("Demo users: priya@example.com / demo1234, arjun@example.com / demo1234");
process.exit(0);
