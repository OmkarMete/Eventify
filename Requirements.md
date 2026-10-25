# AI Event Planner

## Project Overview

AI Event Planner is a web-based application that helps users organize events efficiently by generating personalized event plans using Artificial Intelligence.

Users provide event details such as event type, budget, guest count, city, event date, and special requirements. The system recommends suitable venues and caterers from the database and generates a complete AI-powered event plan.

---

# Project Objectives

* Simplify event planning
* Recommend suitable venues
* Suggest catering services
* Generate AI-powered event plans
* Analyze event risks and provide recommendations
* Allow users to save and manage event plans

---

# Functional Requirements

## 1. User Authentication

Users should be able to:

* Register an account
* Login securely
* Access saved event plans

---

## 2. Event Information Form

Users can enter:

* Event Type
* Budget
* Number of Guests
* City
* Event Date
* Special Requirements

Supported Event Types:

* Wedding
* Birthday
* Corporate
* Engagement
* Anniversary

---

## 3. Venue Recommendation System

The system should recommend venues based on:

* Event Type
* City
* Guest Capacity
* Budget

Displayed Information:

* Venue Name
* City
* Capacity
* Cost

---

## 4. Catering Recommendation System

The system should recommend caterers based on:

* City
* Guest Count
* Budget

Displayed Information:

* Caterer Name
* Cuisine Type
* Price Per Person
* Estimated Total Cost

---

## 5. AI Event Plan Generator

Using Google Gemini API, generate:

### Event Timeline

Example:

* Venue Setup
* Guest Arrival
* Main Event
* Catering Schedule
* Closing Activities

### Budget Breakdown

Example:

* Venue
* Catering
* Decoration
* Entertainment
* Miscellaneous

### Event Checklist

Example:

* Book venue
* Confirm caterer
* Send invitations
* Arrange decorations
* Final confirmation

### Vendor Suggestions

Examples:

* Photographers
* Decorators
* Entertainment Providers
* Transportation Services

### Planning Tips

Personalized recommendations based on event details.

---

## 6. AI Risk Analyzer

Using Google Gemini API, analyze:

* Budget limitations
* Capacity issues
* Time constraints
* Vendor availability concerns
* Special requirement challenges

Provide:

* Risk Summary
* Warnings
* Recommendations

---

## 7. Save Event Plans

Users can:

* Save generated event plans
* View saved plans
* Delete saved plans

---

# User Flow

1. User registers or logs in.
2. User enters event details.
3. System recommends venues.
4. System recommends caterers.
5. Gemini generates event plan.
6. Gemini generates risk analysis.
7. Results are displayed.
8. User can save the generated plan.

---

# Non-Functional Requirements

## Performance

* Fast response time
* Efficient database queries

## Usability

* Responsive design
* Mobile-friendly interface
* Simple user experience

## Reliability

* Input validation
* Proper error handling
* Secure authentication

---

# Technology Stack

## Frontend

* HTML
* CSS
* JavaScript

## Backend

* Node.js
* Express.js

## Database

* SQLite

## AI Tool

* Google Gemini API

---

# Expected Outputs

* Venue Recommendations
* Caterer Recommendations
* AI Event Timeline
* AI Budget Breakdown
* AI Event Checklist
* AI Vendor Suggestions
* AI Planning Tips
* AI Risk Analysis
* Saved Event Plans
