// ==============================================
// services/venueService.js
// Purpose: Query the database for venues that
//          match the user's event requirements.
// Logic:   Filters by city, event type,
//          capacity >= guest count,
//          cost <= budget.
//          Results sorted by lowest cost first.
// ==============================================

const db = require("../config/db");

// ==============================================
// GET RECOMMENDED VENUES
// Accepts event details and returns matching
// venues from the database.
//
// @param {string}  city        - Event city
// @param {string}  eventType   - Type of event
// @param {number}  guestCount  - Number of guests
// @param {number}  budget      - Total event budget
// @returns {Array} List of matching venue objects
// ==============================================

const getRecommendedVenues = (city, eventType, guestCount, budget) => {

    // ------------------------------------------
    // STEP 1: Validate inputs before querying
    // Prevents malformed queries reaching the DB
    // ------------------------------------------

    if (!city || !eventType || !guestCount || !budget) {
        throw new Error("Missing required parameters: city, eventType, guestCount, budget.");
    }

    if (isNaN(guestCount) || guestCount <= 0) {
        throw new Error("Guest count must be a positive number.");
    }

    if (isNaN(budget) || budget <= 0) {
        throw new Error("Budget must be a positive number.");
    }

    // ------------------------------------------
    // STEP 2: Prepare parameterized query
    // Follows recommendation logic from database.md:
    //   - Same city
    //   - Same event type
    //   - Capacity >= guest count
    //   - Cost <= budget
    // Sorted by cost ASC so cheapest appears first
    // ------------------------------------------

    const query = db.prepare(`
        SELECT
            id,
            venue_name,
            city,
            event_type,
            capacity,
            cost
        FROM venues
        WHERE
            city       = @city
            AND event_type = @eventType
            AND capacity   >= @guestCount
            AND cost       <= @budget
        ORDER BY cost ASC
    `);

    // ------------------------------------------
    // STEP 3: Execute query with named parameters
    // better-sqlite3 .all() returns all matching rows
    // ------------------------------------------

    const venues = query.all({
        city,
        eventType,
        guestCount,
        budget
    });

    return venues;
};

// ==============================================
// GET VENUE BY ID
// Fetches a single venue record by its ID.
// Used when building AI prompt context.
//
// @param {number} id - Venue ID
// @returns {Object|null} Venue object or null
// ==============================================

const getVenueById = (id) => {

    if (!id || isNaN(id)) {
        throw new Error("A valid venue ID is required.");
    }

    const query = db.prepare(`
        SELECT
            id,
            venue_name,
            city,
            event_type,
            capacity,
            cost
        FROM venues
        WHERE id = @id
    `);

    // .get() returns a single row or undefined
    const venue = query.get({ id });

    return venue || null;
};

// ==============================================
// EXPORTS
// ==============================================

module.exports = {
    getRecommendedVenues,
    getVenueById
};
