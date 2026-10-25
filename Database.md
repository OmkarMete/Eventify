# Database Design

Database: SQLite

File Name:

event_planner.db

---

# Table 1: Users

Purpose:

Store user account information.

## Schema

| Column     | Type                              |
| ---------- | --------------------------------- |
| id         | INTEGER PRIMARY KEY AUTOINCREMENT |
| name       | TEXT                              |
| email      | TEXT UNIQUE                       |
| password   | TEXT                              |
| created_at | DATETIME                          |

---

# Table 2: Venues

Purpose:

Store available event venues.

## Schema

| Column     | Type                              |
| ---------- | --------------------------------- |
| id         | INTEGER PRIMARY KEY AUTOINCREMENT |
| venue_name | TEXT                              |
| city       | TEXT                              |
| event_type | TEXT                              |
| capacity   | INTEGER                           |
| cost       | INTEGER                           |

### Sample Record

* venue_name: Royal Palace Hall
* city: Ahmedabad
* event_type: Wedding
* capacity: 300
* cost: 120000

---

# Table 3: Caterers

Purpose:

Store catering service information.

## Schema

| Column           | Type                              |
| ---------------- | --------------------------------- |
| id               | INTEGER PRIMARY KEY AUTOINCREMENT |
| caterer_name     | TEXT                              |
| city             | TEXT                              |
| cuisine_type     | TEXT                              |
| price_per_person | INTEGER                           |

### Sample Record

* caterer_name: FoodKing
* city: Ahmedabad
* cuisine_type: Gujarati
* price_per_person: 500

---

# Table 4: Saved Events

Purpose:

Store AI-generated event plans saved by users.

## Schema

| Column               | Type                              |
| -------------------- | --------------------------------- |
| id                   | INTEGER PRIMARY KEY AUTOINCREMENT |
| user_id              | INTEGER                           |
| event_type           | TEXT                              |
| city                 | TEXT                              |
| budget               | INTEGER                           |
| guest_count          | INTEGER                           |
| event_date           | TEXT                              |
| special_requirements | TEXT                              |
| recommended_venue    | TEXT                              |
| recommended_caterer  | TEXT                              |
| ai_event_plan        | TEXT                              |
| ai_risk_analysis     | TEXT                              |
| created_at           | DATETIME                          |

---

# Relationships

Users (1) → (Many) Saved Events

Relationship:

saved_events.user_id → users.id

---

# Venue Recommendation Logic

Conditions:

* Same city
* Same event type
* Capacity >= guest count
* Cost <= budget

---

# Caterer Recommendation Logic

Conditions:

* Same city
* Suitable for guest count
* Total catering cost within budget

Formula:

Total Catering Cost = Guest Count × Price Per Person

---

# Example Query Flow

1. User submits event details.
2. System searches matching venues.
3. System searches matching caterers.
4. Results are sent to Gemini API.
5. Gemini generates:

   * Event Plan
   * Risk Analysis
6. User saves the event plan.
7. Event is stored in saved_events table.
