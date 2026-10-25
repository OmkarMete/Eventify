// ==============================================
// controllers/savedEventController.js
// Purpose: Manage saved event plans.
// - Get all saved events for logged-in user
// - Get single saved event by ID
// - Save a new event plan
// - Delete a saved event plan
//
// Endpoints:
//   GET    /api/saved-events
//   GET    /api/saved-events/:id
//   POST   /api/saved-events
//   DELETE /api/saved-events/:id
//
// Access: Private (requires JWT via authMiddleware)
// All queries are scoped to req.user.id to
// ensure users can only access their own data.
// ==============================================

const db = require("../config/db");

const {
    eventPlanPrompt,
    riskAnalysisPrompt,
    budgetOptimizerPrompt
} = require("../utils/promptTemplates");

const {
    generateEventPlan,
    generateRiskAnalysis,
    generateInvitation,
    generateBudgetPlan
} = require("../services/geminiService");

// ==============================================
// SUPPORTED EVENT TYPES / CITIES
// Mirrors the lists in eventController.js — kept
// in sync manually since they're small and static.
// Used to validate edits to a saved event.
// ==============================================

const SUPPORTED_EVENT_TYPES = ["Wedding", "Birthday", "Corporate", "Engagement", "Anniversary"];
const SUPPORTED_CITIES      = ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Anand"];

// ==============================================
// SELF-HEALING MIGRATION
// Adds the ai_budget_plan column if it doesn't
// already exist. SQLite has no "ADD COLUMN IF NOT
// EXISTS", so we just try it and swallow the error
// if the column is already there. Runs once at
// module load time.
// ==============================================

try {
    db.prepare(`ALTER TABLE saved_events ADD COLUMN ai_budget_plan TEXT DEFAULT ''`).run();
    console.log("✅ Migration: added ai_budget_plan column to saved_events.");
} catch (error) {
    // Column already exists — expected on every restart after the first.
    // Only log if it's an unexpected error.
    if (!error.message.includes("duplicate column")) {
        console.error("⚠️  ai_budget_plan migration check:", error.message);
    }
}

// ==============================================
// HELPER: BUILD THE COMMON AI PROMPT PARAMS
// Shared shape used by event plan / risk / budget
// prompts (invitation has its own custom shape,
// mirroring aiController.js).
//
// NOTE: saved_events only stores venue/caterer as
// plain NAME STRINGS (recommended_venue,
// recommended_caterer) — there's no capacity, cost,
// or cuisine type persisted. The prompt templates
// expect venue/caterer as OBJECTS (venue.venue_name,
// venue.cost, etc). We wrap the saved name string
// into a minimal object with just the name populated
// so the templates' venueContext/catererContext
// fall into their "has a venue" branch and show the
// name, rather than crashing on undefined property
// access or silently printing "undefined".
// ==============================================

const buildPromptParams = (event) => ({
    eventType:            event.event_type,
    city:                 event.city,
    budget:               event.budget,
    guestCount:           event.guest_count,
    eventDate:            event.event_date,
    specialRequirements:  event.special_requirements || "",
    venue:                event.recommended_venue
        ? { venue_name: event.recommended_venue, city: event.city, capacity: "N/A", cost: "N/A" }
        : null,
    caterer:              event.recommended_caterer
        ? { caterer_name: event.recommended_caterer, cuisine_type: "N/A", price_per_person: "N/A", total_cost: "N/A" }
        : null
});

// ==============================================
// HELPER: BUILD INVITATION PROMPT
// Mirrors the custom prompt built inline in
// aiController.js's getInvitation, so regenerated
// invitations stay consistent with freshly
// generated ones.
// ==============================================

const buildInvitationPrompt = (event) => {
    const finalVenueName   = event.recommended_venue   || "To Be Announced Venue Location";
    const finalCatererName = event.recommended_caterer || "To Be Announced Caterer Selection";
    const finalHostName    = event.host_name || "Our Family";

    return `
You are an expert copywriter. Write exactly 3 customized event invitation copy options based on these parameters:
- Event Type: ${event.event_type}
- Host Name: ${finalHostName}
- Date of Event: ${event.event_date}
- City Location: ${event.city}
- Confirmed Venue Address: ${finalVenueName}
- Confirmed Catering Service: ${finalCatererName}
- Special Requirements/Note: ${event.special_requirements || "None"}

CRITICAL FORMATTING RULES:
1. NEVER spell out dates, years, or times in alphabetical letters (Do NOT write "tenth of October" or "Two thousand twenty-eight"). 
2. You MUST write all dates and years strictly as standard digits/numbers across ALL templates (e.g., "October 10, 2028" or "10/10/2028").
3. Do not output placeholders like "[Insert Venue Name]" or "e.g. Venue". Use the actual info provided above.

Provide exactly these 3 templates using markdown headings:

## 1. Formal Invitation
(Elegant layout suitable for print cards. Explicitly include the venue name: "${finalVenueName}" and use numeric standard digits for the date).

## 2. Casual / WhatsApp Invitation
(Engaging text packed with appropriate emojis. You MUST explicitly state the complete address/venue: "${finalVenueName}" clearly so guests can locate it via mobile text).

## 3. Email Invitation
(Include a distinct "Subject Line:", an engaging full header greeting, body description announcing the catering details ["${finalCatererName}"], and a clear structural RSVP section).

Do not create a 4th template option. Ensure all locations are explicitly printed.
`;
};


// ==============================================
// GET ALL SAVED EVENTS
// GET /api/saved-events
//
// Returns all saved event plans belonging to
// the currently logged-in user, ordered by
// most recently saved first.
//
// Response:
//   200 - List of saved events (can be empty)
//   500 - Server error
// ==============================================

const getAllSavedEvents = (req, res) => {

    try {
        const userId = req.user.id;

        // ------------------------------------------
        // Fetch all saved events for this user
        // Ordered by created_at DESC so most
        // recent plans appear first
        // ------------------------------------------

        const savedEvents = db.prepare(`
            SELECT
                id,
                event_type,
                city,
                budget,
                guest_count,
                event_date,
                special_requirements,
                recommended_venue,
                recommended_caterer,
                ai_event_plan,
                ai_risk_analysis,
                ai_invitation,
                ai_budget_plan,
                created_at
            FROM saved_events
            WHERE user_id = ?
            ORDER BY created_at DESC
        `).all(userId);

        return res.status(200).json({
            success: true,
            count:       savedEvents.length,
            savedEvents
        });

    } catch (error) {
        console.error("❌ Get All Saved Events Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch saved events. Please try again."
        });
    }
};


// ==============================================
// GET SAVED EVENT BY ID
// GET /api/saved-events/:id
//
// Returns a single saved event plan.
// Verifies the event belongs to the logged-in
// user before returning it.
//
// Response:
//   200 - Single saved event with full AI content
//   400 - Invalid ID
//   403 - Event belongs to another user
//   404 - Event not found
//   500 - Server error
// ==============================================

const getSavedEventById = (req, res) => {

    try {
        const userId  = req.user.id;
        const eventId = parseInt(req.params.id);

        // ------------------------------------------
        // Validate event ID from URL parameter
        // ------------------------------------------

        if (isNaN(eventId) || eventId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID."
            });
        }

        // ------------------------------------------
        // Fetch the saved event by ID
        // Full record including AI content columns
        // ------------------------------------------

        const savedEvent = db.prepare(`
            SELECT
                id,
                user_id,
                event_type,
                city,
                budget,
                guest_count,
                event_date,
                special_requirements,
                recommended_venue,
                recommended_caterer,
                ai_event_plan,
                ai_risk_analysis,
                ai_invitation,
                ai_budget_plan,
                created_at
            FROM saved_events
            WHERE id = ?
        `).get(eventId);

        // ------------------------------------------
        // Check if event exists
        // ------------------------------------------

        if (!savedEvent) {
            return res.status(404).json({
                success: false,
                message: "Saved event not found."
            });
        }

        // ------------------------------------------
        // Verify ownership — event must belong
        // to the currently logged-in user
        // ------------------------------------------

        if (savedEvent.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied. This event does not belong to you."
            });
        }

        // Remove user_id from response for cleanliness
        const { user_id, ...eventData } = savedEvent;

        return res.status(200).json({
            success: true,
            savedEvent: eventData
        });

    } catch (error) {
        console.error("❌ Get Saved Event By ID Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch saved event. Please try again."
        });
    }
};


// ==============================================
// SAVE EVENT PLAN
// POST /api/saved-events
//
// Saves a complete event plan to the database,
// including AI-generated content and selections.
//
// Request Body:
//   {
//     eventType, city, budget, guestCount,
//     eventDate, specialRequirements,
//     recommendedVenue,   (venue name string)
//     recommendedCaterer, (caterer name string)
//     aiEventPlan,        (AI generated text)
//     aiRiskAnalysis,     (AI generated text)
//     aiInvitation        (AI generated text)
//   }
//
// Response:
//   201 - Event plan saved successfully
//   400 - Validation error
//   500 - Server error
// ==============================================

const saveEvent = (req, res) => {

    try {
        const userId = req.user.id;

        const {
            eventType,
            city,
            budget,
            guestCount,
            eventDate,
            specialRequirements,
            recommendedVenue,
            recommendedCaterer,
            aiEventPlan,
            aiRiskAnalysis,
            aiInvitation,
            aiBudgetPlan
        } = req.body;

        // ------------------------------------------
        // STEP 1: Validate required fields
        // AI content fields are required —
        // no point saving an empty plan
        // ------------------------------------------

        if (!eventType || !city || !budget || !guestCount || !eventDate) {
            return res.status(400).json({
                success: false,
                message: "Required fields: eventType, city, budget, guestCount, eventDate."
            });
        }

        if (!aiEventPlan) {
            return res.status(400).json({
                success: false,
                message: "Cannot save: AI event plan is missing. Please generate a plan first."
            });
        }

        // ------------------------------------------
        // STEP 2: Parse and validate numeric fields
        // ------------------------------------------

        const parsedBudget     = parseInt(budget);
        const parsedGuestCount = parseInt(guestCount);

        if (isNaN(parsedBudget) || parsedBudget <= 0) {
            return res.status(400).json({
                success: false,
                message: "Budget must be a positive number."
            });
        }

        if (isNaN(parsedGuestCount) || parsedGuestCount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Guest count must be a positive number."
            });
        }

        // ------------------------------------------
        // STEP 3: Insert saved event into database
        // Stores event details + AI content together
        // ------------------------------------------

        const insertEvent = db.prepare(`
            INSERT INTO saved_events (
                user_id,
                event_type,
                city,
                budget,
                guest_count,
                event_date,
                special_requirements,
                recommended_venue,
                recommended_caterer,
                ai_event_plan,
                ai_risk_analysis,
                ai_invitation,
                ai_budget_plan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insertEvent.run(
            userId,
            eventType,
            city,
            parsedBudget,
            parsedGuestCount,
            eventDate,
            specialRequirements  || "",
            recommendedVenue     || "",
            recommendedCaterer   || "",
            aiEventPlan          || "",
            aiRiskAnalysis       || "",
            aiInvitation         || "",
            aiBudgetPlan         || ""
        );

        // ------------------------------------------
        // STEP 4: Return success with new record ID
        // ------------------------------------------

        return res.status(201).json({
            success: true,
            message: "Event plan saved successfully.",
            savedEventId: result.lastInsertRowid
        });

    } catch (error) {
        console.error("❌ Save Event Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to save event plan. Please try again."
        });
    }
};


// ==============================================
// DELETE SAVED EVENT
// DELETE /api/saved-events/:id
//
// Deletes a saved event plan by ID.
// Verifies the event belongs to the logged-in
// user before deleting it.
//
// Response:
//   200 - Event deleted successfully
//   400 - Invalid ID
//   403 - Event belongs to another user
//   404 - Event not found
//   500 - Server error
// ==============================================

const deleteSavedEvent = (req, res) => {

    try {
        const userId  = req.user.id;
        const eventId = parseInt(req.params.id);

        // ------------------------------------------
        // Validate event ID from URL parameter
        // ------------------------------------------

        if (isNaN(eventId) || eventId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID."
            });
        }

        // ------------------------------------------
        // Check event exists before deleting
        // ------------------------------------------

        const existingEvent = db.prepare(`
            SELECT id, user_id FROM saved_events WHERE id = ?
        `).get(eventId);

        if (!existingEvent) {
            return res.status(404).json({
                success: false,
                message: "Saved event not found."
            });
        }

        // ------------------------------------------
        // Verify ownership before deleting
        // Prevents users from deleting other
        // users' saved plans
        // ------------------------------------------

        if (existingEvent.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied. This event does not belong to you."
            });
        }

        // ------------------------------------------
        // Delete the saved event
        // ------------------------------------------

        db.prepare(`
            DELETE FROM saved_events WHERE id = ?
        `).run(eventId);

        return res.status(200).json({
            success: true,
            message: "Event plan deleted successfully."
        });

    } catch (error) {
        console.error("❌ Delete Saved Event Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to delete event plan. Please try again."
        });
    }
};


// ==============================================
// UPDATE SAVED EVENT
// PUT /api/saved-events/:id
//
// Fully updates an existing saved event plan —
// core event fields plus, optionally, freshly
// regenerated AI content. AI fields are always
// sent by the client (either unchanged or freshly
// regenerated), so they're simply overwritten.
//
// Request Body:
//   {
//     eventType, city, budget, guestCount,
//     eventDate, specialRequirements,
//     aiEventPlan, aiRiskAnalysis, aiInvitation
//   }
//
// Response:
//   200 - Event plan updated successfully
//   400 - Validation error
//   403 - Event belongs to another user
//   404 - Event not found
//   500 - Server error
// ==============================================

const updateSavedEvent = async (req, res) => {
    try {
        const userId  = req.user.id;
        const eventId = parseInt(req.params.id);

        const {
            eventType,
            city,
            budget,
            guestCount,
            eventDate,
            specialRequirements,
            // If the client already regenerated content itself (e.g. via a
            // separate call) it can still pass these directly and they'll
            // be used as-is, same as before.
            aiEventPlan,
            aiRiskAnalysis,
            aiInvitation,
            aiBudgetPlan,
            // NEW: when true, the server regenerates AI content itself
            // using the *new* event details, for whichever sections
            // already had content saved on this record. This is what
            // powers "Save Changes" automatically refreshing stale plans.
            regenerateAi
        } = req.body;

        // ------------------------------------------
        // STEP 1: Validate event ID + ownership
        // ------------------------------------------

        if (isNaN(eventId) || eventId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID."
            });
        }

        const existingEvent = db.prepare(`
            SELECT * FROM saved_events WHERE id = ?
        `).get(eventId);

        if (!existingEvent) {
            return res.status(404).json({
                success: false,
                message: "Saved event not found."
            });
        }

        if (existingEvent.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied. This event does not belong to you."
            });
        }

        // ------------------------------------------
        // STEP 2: Validate the editable fields —
        // same rules as creating a new event plan
        // ------------------------------------------

        if (!eventType || !city || !budget || !guestCount || !eventDate) {
            return res.status(400).json({
                success: false,
                message: "Required fields: eventType, city, budget, guestCount, eventDate."
            });
        }

        if (!SUPPORTED_EVENT_TYPES.includes(eventType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid event type. Supported types: ${SUPPORTED_EVENT_TYPES.join(", ")}.`
            });
        }

        if (!SUPPORTED_CITIES.includes(city)) {
            return res.status(400).json({
                success: false,
                message: `Invalid city. Supported cities: ${SUPPORTED_CITIES.join(", ")}.`
            });
        }

        const parsedBudget = parseInt(budget);
        if (isNaN(parsedBudget) || parsedBudget <= 0) {
            return res.status(400).json({
                success: false,
                message: "Budget must be a positive number."
            });
        }

        const parsedGuestCount = parseInt(guestCount);
        if (isNaN(parsedGuestCount) || parsedGuestCount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Guest count must be a positive number."
            });
        }

        const parsedDate = new Date(eventDate);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid event date."
            });
        }

        // ------------------------------------------
        // STEP 3: Figure out the final AI field values.
        //
        // Priority order per field:
        //   1. If the client explicitly sent a value for
        //      this field in the request body, use it as-is
        //      (lets the client pre-regenerate and just save).
        //   2. Else if regenerateAi=true AND this section
        //      already had content on the existing record,
        //      call Gemini fresh using the NEW event details.
        //   3. Else, keep whatever was already saved.
        //
        // This is what fixes the "edited event but plan
        // still shows old details" bug: regenerateAi=true
        // makes every previously-generated section refresh
        // itself against the just-updated event info.
        // ------------------------------------------

        // Build a "draft" event object representing the event
        // AFTER this edit, so prompts reflect the new details.
        const updatedEventForPrompts = {
            ...existingEvent,
            event_type:           eventType,
            city:                 city,
            budget:               parsedBudget,
            guest_count:          parsedGuestCount,
            event_date:           eventDate,
            special_requirements: specialRequirements || ""
        };

        let finalAiEventPlan    = aiEventPlan    !== undefined ? aiEventPlan    : existingEvent.ai_event_plan;
        let finalAiRiskAnalysis = aiRiskAnalysis !== undefined ? aiRiskAnalysis : existingEvent.ai_risk_analysis;
        let finalAiInvitation   = aiInvitation   !== undefined ? aiInvitation   : existingEvent.ai_invitation;
        let finalAiBudgetPlan   = aiBudgetPlan   !== undefined ? aiBudgetPlan   : existingEvent.ai_budget_plan;

        const regenerationWarnings = [];

        if (regenerateAi) {

            // Only regenerate sections that already had content —
            // we don't want to surprise-generate a feature the user
            // never asked for just because they edited a field.

            if (aiEventPlan === undefined && existingEvent.ai_event_plan) {
                const prompt = eventPlanPrompt(buildPromptParams(updatedEventForPrompts));
                const result = await generateEventPlan(prompt);
                if (result.success) {
                    finalAiEventPlan = result.data;
                } else {
                    regenerationWarnings.push(`Event plan: ${result.error}`);
                }
            }

            if (aiRiskAnalysis === undefined && existingEvent.ai_risk_analysis) {
                const prompt = riskAnalysisPrompt(buildPromptParams(updatedEventForPrompts));
                const result = await generateRiskAnalysis(prompt);
                if (result.success) {
                    finalAiRiskAnalysis = result.data;
                } else {
                    regenerationWarnings.push(`Risk analysis: ${result.error}`);
                }
            }

            if (aiInvitation === undefined && existingEvent.ai_invitation) {
                const prompt = buildInvitationPrompt(updatedEventForPrompts);
                const result = await generateInvitation(prompt);
                if (result.success) {
                    finalAiInvitation = result.data;
                } else {
                    regenerationWarnings.push(`Invitation: ${result.error}`);
                }
            }

            if (aiBudgetPlan === undefined && existingEvent.ai_budget_plan) {
                const prompt = budgetOptimizerPrompt(buildPromptParams(updatedEventForPrompts));
                const result = await generateBudgetPlan(prompt);
                if (result.success) {
                    finalAiBudgetPlan = result.data;
                } else {
                    regenerationWarnings.push(`Budget plan: ${result.error}`);
                }
            }
        }

        // ------------------------------------------
        // STEP 4: Apply the update
        // ------------------------------------------

        db.prepare(`
            UPDATE saved_events
            SET event_type            = ?,
                city                  = ?,
                budget                = ?,
                guest_count           = ?,
                event_date            = ?,
                special_requirements  = ?,
                ai_event_plan         = ?,
                ai_risk_analysis      = ?,
                ai_invitation         = ?,
                ai_budget_plan        = ?
            WHERE id = ?
        `).run(
            eventType,
            city,
            parsedBudget,
            parsedGuestCount,
            eventDate,
            specialRequirements || "",
            finalAiEventPlan    || "",
            finalAiRiskAnalysis || "",
            finalAiInvitation   || "",
            finalAiBudgetPlan   || "",
            eventId
        );

        return res.status(200).json({
            success: true,
            message: regenerationWarnings.length > 0
                ? "Event plan updated, but some AI content could not be regenerated."
                : "Event plan updated successfully.",
            regenerationWarnings,
            // Return the fresh AI content so the frontend can update
            // its UI immediately without a second fetch.
            updatedAiContent: {
                aiEventPlan:    finalAiEventPlan,
                aiRiskAnalysis: finalAiRiskAnalysis,
                aiInvitation:   finalAiInvitation,
                aiBudgetPlan:   finalAiBudgetPlan
            }
        });

    } catch (error) {
        console.error("❌ Update Saved Event Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to update event plan. Please try again."
        });
    }
};


// ==============================================
// EXPORTS
// ==============================================

module.exports = {
    getAllSavedEvents,
    getSavedEventById,
    saveEvent,
    deleteSavedEvent,
    updateSavedEvent
};