# Eventify — AI Event Planner

An AI-powered event planning web app. Pick an event type, city, budget, guest count, and date — Eventify matches venues and caterers from a seeded database, then uses Google's Gemini API to generate a full event plan, risk analysis, decoration theme, budget optimization, and a personalized invitation. Plans can be saved, edited, and revisited later.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite (`better-sqlite3`)
- **AI:** Google Gemini (`@google/generative-ai`)
- **Auth:** JWT (`jsonwebtoken`) + `bcryptjs` for password hashing
- **Frontend:** Vanilla HTML / CSS / JavaScript (no framework, no build step)

## Features

- **Auth** — register/login with JWT-based sessions
- **Venue & Caterer Matching** — recommendations filtered by city, event type, guest count, and budget
- **AI Event Plan** — timeline, budget breakdown, checklist, vendor suggestions, and a decoration theme (color palette, decor items, mood) in one generated plan
- **AI Risk Analysis** — risk levels, mitigation strategies, contingency planning
- **AI Invitation** — formal, casual/WhatsApp, and email-ready invitation text, with a print-to-PDF option
- **AI Budget Optimizer** — optimized budget allocation and cost-saving tips, saved alongside the rest of the plan
- **Saved Plans** — save, view, and delete event plans, with a countdown badge showing days remaining
- **Edit Saved Plans** — change any field on a saved plan (event type, city, budget, guests, date, requirements) right on the Saved Plans page. Any AI section that was already generated (plan, risk analysis, invitation, budget) is automatically regenerated against the updated details, so a saved plan never goes stale after an edit. Sections never generated in the first place stay untouched, and if Gemini fails for one section the rest still save with a warning.
- **Automatic retries** — Gemini calls retry with exponential backoff on transient errors (model overload, rate limits, network blips), so occasional API hiccups don't surface as failures

## Project Structure

```
ai-event-planner/
│
├── server.js                        # Entry point — starts Express server
├── package.json                     # Dependencies & scripts
├── .env                              # Environment variables (not committed)
├── .env.example                      # Template for required environment variables
│
├── config/
│   └── db.js                         # SQLite connection & table initialization
│
├── middleware/
│   └── authMiddleware.js             # JWT token verification middleware
│
├── routes/
│   ├── authRoutes.js                 # POST /api/auth/register, /api/auth/login
│   ├── eventRoutes.js                # POST /api/events/plan (venue + caterer matching)
│   ├── aiRoutes.js                   # POST /api/ai/* (plan, risk, invitation, budget)
│   └── savedEventRoutes.js           # GET / POST / PUT / DELETE /api/saved-events
│
├── controllers/
│   ├── authController.js             # Register & login logic
│   ├── eventController.js            # Venue/caterer search
│   ├── aiController.js               # Builds prompts, calls Gemini, returns AI text
│   └── savedEventController.js       # Save, fetch, update, delete saved plans
│
├── services/
│   ├── venueService.js               # DB query logic for venue recommendations
│   ├── catererService.js             # DB query logic for caterer recommendations
│   ├── geminiService.js              # All Gemini API calls
│   └── pdfService.js                 # Server-side PDF generation (currently unused — see Known Limitations)
│
├── utils/
│   └── promptTemplates.js            # All Gemini prompt builders
│
├── database/
│   ├── event_planner.db              # SQLite database file (auto-created)
│   └── seed.js                       # Seed script — inserts sample venues & caterers
│
└── public/                           # Frontend (served as static files)
    ├── index.html                    # Landing page — login / register
    ├── dashboard.html                # Event form, AI generation, results
    ├── saved-events.html             # Saved plans grid + view/edit modals
    │
    ├── css/
    │   ├── style.css
    │   ├── auth.css
    │   ├── dashboard.css
    │   └── saved-events.css
    │
    └── js/
        ├── auth.js
        ├── dashboard.js
        └── saved-events.js
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Installation

```bash
npm install
```

### Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

See `.env.example` for the required variables.

### Seed the database

Populates sample venues and caterers:

```bash
npm run seed
```

### Run the app

```bash
npm run dev      # development, with auto-restart via nodemon
npm start         # production
```

The app will be available at `http://localhost:<PORT>` (whatever you set `PORT` to in `.env`).

## API Reference

| Method | Endpoint                          | Description                                  | Auth |
|--------|------------------------------------|-----------------------------------------------|------|
| POST   | `/api/auth/register`              | Create an account                             | No   |
| POST   | `/api/auth/login`                 | Log in, returns a JWT                         | No   |
| POST   | `/api/events/plan`                | Match venues & caterers                       | Yes  |
| POST   | `/api/ai/generate-plan`           | Generate full AI event plan                   | Yes  |
| POST   | `/api/ai/risk-analysis`           | Generate AI risk analysis                     | Yes  |
| POST   | `/api/ai/generate-invitation`     | Generate AI invitation text                   | Yes  |
| POST   | `/api/ai/budget-optimizer`        | Generate optimized budget allocation          | Yes  |
| GET    | `/api/saved-events`                | List all saved plans for the logged-in user   | Yes  |
| GET    | `/api/saved-events/:id`           | Get one saved plan in full                    | Yes  |
| POST   | `/api/saved-events`                | Save a new plan                               | Yes  |
| PUT    | `/api/saved-events/:id`           | Update a saved plan; optionally regenerates existing AI sections | Yes  |
| DELETE | `/api/saved-events/:id`           | Delete a saved plan                           | Yes  |

Protected routes expect `Authorization: Bearer <token>`.

## Known Limitations

- **Editing a plan with multiple AI sections takes longer to save.** Regeneration on edit runs one section at a time (plan, then risk, then invitation, then budget) rather than in parallel, so saving an event that has all four can take a while. The save button shows a "Saving & regenerating plan..." state for the duration.
