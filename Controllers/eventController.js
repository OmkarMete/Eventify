// ==============================================
// controllers/eventController.js
// Purpose: Handle event planning requests.
// - Validates all event input fields
// - Queries matching venues via venueService
// - Queries matching caterers via catererService
// - Returns structured JSON with results
//
// Endpoint: POST /api/events/plan
// Access:   Private (requires JWT via authMiddleware)
// ==============================================

const venueService   = require("../services/venueService");
const catererService = require("../services/catererService");

// ==============================================
// SUPPORTED EVENT TYPES
// Matches the values defined in requirements.md
// ==============================================

const SUPPORTED_EVENT_TYPES = [
    "Wedding",
    "Birthday",
    "Corporate",
    "Engagement",
    "Anniversary"
];

// ==============================================
// SUPPORTED CITIES
// Matches the cities seeded in database/seed.js
// ==============================================

const SUPPORTED_CITIES = [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Anand"
];

// ==============================================
// GET EVENT PLAN (Venues + Caterers)
// POST /api/events/plan
//
// Request Body:
//   { eventType, budget, guestCount, city,
//     eventDate, specialRequirements }
//
// Response:
//   200 - Venues and caterers found
//   400 - Validation error
//   500 - Server error
// ==============================================

const getEventPlan = (req, res) => {

    try {
        const {
            eventType,
            budget,
            guestCount,
            city,
            eventDate,
            specialRequirements
        } = req.body;

        // ------------------------------------------
        // STEP 1: Validate required fields
        // ------------------------------------------

        if (!eventType || !budget || !guestCount || !city || !eventDate) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: eventType, budget, guestCount, city, eventDate."
            });
        }

        // ------------------------------------------
        // STEP 2: Validate event type
        // Must match one of the supported types
        // ------------------------------------------

        if (!SUPPORTED_EVENT_TYPES.includes(eventType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid event type. Supported types: ${SUPPORTED_EVENT_TYPES.join(", ")}.`
            });
        }

        // ------------------------------------------
        // STEP 3: Validate city
        // Must match one of the supported cities
        // ------------------------------------------

        if (!SUPPORTED_CITIES.includes(city)) {
            return res.status(400).json({
                success: false,
                message: `Invalid city. Supported cities: ${SUPPORTED_CITIES.join(", ")}.`
            });
        }

        // ------------------------------------------
        // STEP 4: Validate and parse budget
        // ------------------------------------------

        const parsedBudget = parseInt(budget);

        if (isNaN(parsedBudget) || parsedBudget <= 0) {
            return res.status(400).json({
                success: false,
                message: "Budget must be a positive number."
            });
        }

        // ------------------------------------------
        // STEP 5: Validate and parse guest count
        // ------------------------------------------

        const parsedGuestCount = parseInt(guestCount);

        if (isNaN(parsedGuestCount) || parsedGuestCount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Guest count must be a positive number."
            });
        }

        // ------------------------------------------
        // STEP 6: Validate event date
        // Must be a valid date and not in the past
        // ------------------------------------------

        const parsedDate = new Date(eventDate);

        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid event date."
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Compare date only, not time

        if (parsedDate < today) {
            return res.status(400).json({
                success: false,
                message: "Event date cannot be in the past."
            });
        }

        // ------------------------------------------
        // STEP 7: Query matching venues
        // Uses venueService recommendation logic:
        // city + event type + capacity >= guests
        // + cost <= budget
        // ------------------------------------------

        const venues = venueService.getRecommendedVenues(
            city,
            eventType,
            parsedGuestCount,
            parsedBudget
        );

        // ------------------------------------------
        // STEP 8: Query matching caterers
        // Uses catererService recommendation logic:
        // city + total cost (guests × per person)
        // within budget
        // ------------------------------------------

        const caterers = catererService.getRecommendedCaterers(
            city,
            parsedGuestCount,
            parsedBudget
        );

        // ------------------------------------------
        // STEP 9: Build and return structured response
        // Always return results even if empty arrays
        // so frontend can show "no matches" message
        // ------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Event details processed successfully.",
            eventDetails: {
                eventType,
                city,
                budget:              parsedBudget,
                guestCount:          parsedGuestCount,
                eventDate,
                specialRequirements: specialRequirements || ""
            },
            recommendations: {
                venues: {
                    count:   venues.length,
                    results: venues
                },
                caterers: {
                    count:   caterers.length,
                    results: caterers
                }
            }
        });

    } catch (error) {
        console.error("❌ Event Plan Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to process event details. Please try again."
        });
    }
};

// ==============================================
// EXPORTS
// ==============================================

module.exports = {
    getEventPlan
};
