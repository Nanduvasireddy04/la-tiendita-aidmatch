# 🤝 La Tiendita AidMatch 24/7

> **A live community aid-matching platform** — connecting people who need resources (food, clothing, household items, transportation) with neighbors who can offer them, safely and anonymously.

[![Live App](https://img.shields.io/badge/Live%20App-la--tiendita--aidmatch.vercel.app-brightgreen?style=flat&logo=vercel)](https://la-tiendita-aidmatch.vercel.app)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazonaws&logoColor=white)](https://aws.amazon.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com)

---

## 🌟 What It Does

La Tiendita AidMatch is a **two-sided matching platform** for mutual aid:

- **People in need** post anonymous requests — food, clothing, transport, household items, or anything else
- **People who can help** post offers of the same categories
- The platform **matches them by location (city/ZIP) and category**, with urgency weighting
- **Mutual aid groups** (community organizers) get an aggregated view of needs in their area to coordinate at scale
- All interactions enforce **safety-first rules** — no home addresses, no personal contact sharing, public meetup locations only (libraries, community centers)

**This is a real, deployed application used by real community members.**

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│              JavaScript / HTML / CSS (Vercel)               │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│              Python · Authentication · Matching Engine       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
│              Supabase · Row-Level Security · Auth            │
└─────────────────────────────────────────────────────────────┘
                       │
              AWS (S3 · Lambda · deployment)
```

---

## 🗄 Data Model

The platform is built on a relational PostgreSQL schema designed for anonymous matching at community scale.

![ER Diagram](./aid%20project%20ER%20diagram.svg)

| Table | Purpose |
|---|---|
| `users` | Anonymous profiles — handle, city/ZIP, role (individual or group), safe location preferences |
| `needs` | Aid requests — category, description, urgency, location, status |
| `offers` | Aid offers — category, description, quantity, location, availability |
| `matches` | Match records — need_id, offer_id, match score, status (suggested/accepted/completed) |
| `groups` | Mutual aid organization profiles — city, region, aggregated needs access |
| `conversations` | Anonymous in-platform messaging between matched users |

---

## 🔑 Key Features

- **Anonymous matching** — no real names, phone numbers, or email addresses required or exposed
- **Location-based matching** — city + ZIP code matching with category and urgency weighting
- **Real-time matching engine** — matches recalculate as new needs and offers are posted
- **In-app messaging** — anonymous conversations between matched users without sharing contact info
- **Mutual aid group dashboard** — aggregated needs view filtered by urgency and category for organizers
- **Safety enforcement** — every match confirmation includes library/community center meetup reminders; address patterns blocked
- **OAuth authentication** — Supabase Auth with social login support
- **CI/CD deployment** — GitHub → Vercel pipeline with 30+ production deployments

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | JavaScript, HTML5, CSS3, React components |
| Backend | Python, FastAPI |
| Database | PostgreSQL (Supabase hosted) |
| Auth | Supabase Auth (OAuth, anonymous sessions) |
| Infrastructure | AWS, Vercel, Docker |
| Version Control | Git / GitHub (30+ commits, active development) |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Supabase account (or local PostgreSQL)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # Add your Supabase URL and anon key
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env   # Add your API URL and Supabase keys
npm run dev
```

### Docker (full stack)
```bash
docker-compose up --build
```

---

## 🔒 Safety & Privacy Design

La Tiendita was designed from the ground up to protect vulnerable users:

1. **No personal address sharing** — posts flagged or blocked if they contain home addresses
2. **No direct contact exchange** — platform messaging stays anonymous; contact info patterns blocked
3. **Public meetup enforcement** — every match response includes: *"La Tiendita strongly encourages meeting only in public, trusted locations such as your local library or community center"*
4. **Anonymous handles only** — no real name required at any stage

---

## 📊 Impact

- Live community platform serving mutual aid matching across multiple ZIP codes
- Two-sided marketplace with needs, offers, and group coordinator access
- Real-time matching with urgency prioritization
- 30+ production deployments with active feature development

---

## 👨‍💻 Author

**Nandu Sai Teja Vasireddy** — [nanduvasireddy.vercel.app](https://nanduvasireddy.vercel.app) · [LinkedIn](https://linkedin.com/in/nandu-sai-teja-vasireddy-330512218)
