// ==============================================
// services/catererService.js
// Purpose: Query the database for caterers that
//          match the user's event requirements.
// Logic:   Filters by city, calculates total
//          catering cost = guestCount × price_per_person,
//          and returns only caterers within budget.
//          Results sorted by lowest total cost first.
// ==============================================

const db = require("../config/db");

// ==============================================
// GET RECOMMENDED CATERERS
// Accepts event details and returns matching
// caterers from the database.
//
// Formula (from database.md):
//   Total Catering Cost = Guest Count × Price Per Person
//
// @param {string}  city        - Event city
// @param {number}  guestCount  - Number of guests
// @param {number}  budget      - Total event budget
// @returns {Array} List of matching caterer objects
//                  with calculated total_cost included
// ==============================================

const getRecommendedCaterers = (city, guestCount, budget) => {

    // ------------------------------------------
    // STEP 1: Validate inputs before querying
    // ------------------------------------------

    if (!city || !guestCount || !budget) {
        throw new Error("Missing required parameters: city, guestCount, budget.");
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
    //   - Total cost (guestCount × price_per_person)
    //     must be within budget
    //
    // SQLite computes total_cost inline using
    // @guestCount as a bound parameter.
    // Results sorted by total_cost ASC so the
    // most affordable caterer appears first.
    // ------------------------------------------

    const query = db.prepare(`
        SELECT
            id,
            caterer_name,
            city,
            cuisine_type,
            price_per_person,
            (@guestCount * price_per_person) AS total_cost
        FROM caterers
        WHERE
            city = @city
            AND (@guestCount * price_per_person) <= @budget
        ORDER BY total_cost ASC
    `);

    // ------------------------------------------
    // STEP 3: Execute query with named parameters
    // better-sqlite3 .all() returns all matching rows
    // ------------------------------------------

    const caterers = query.all({
        city,
        guestCount,
        budget
    });

    return caterers;
};

// ==============================================
// GET CATERER BY ID
// Fetches a single caterer record by its ID.
// Used when building AI prompt context.
//
// @param {number} id         - Caterer ID
// @param {number} guestCount - Guest count to
//                              calculate total_cost
// @returns {Object|null} Caterer object or null
// ==============================================

const getCatererById = (id, guestCount = 1) => {

    if (!id || isNaN(id)) {
        throw new Error("A valid caterer ID is required.");
    }

    const query = db.prepare(`
        SELECT
            id,
            caterer_name,
            city,
            cuisine_type,
            price_per_person,
            (@guestCount * price_per_person) AS total_cost
        FROM caterers
        WHERE id = @id
    `);

    // .get() returns a single row or undefined
    const caterer = query.get({ id, guestCount });

    return caterer || null;
};

// ==============================================
// EXPORTS
// ==============================================

module.exports = {
    getRecommendedCaterers,
    getCatererById
};
