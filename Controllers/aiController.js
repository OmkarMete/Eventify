// ==============================================
// controllers/aiController.js
// Purpose: Handle all AI generation requests.
// ==============================================

const {
    eventPlanPrompt,
    riskAnalysisPrompt,
    invitationPrompt,
    budgetOptimizerPrompt
} = require("../utils/promptTemplates");

const {
    generateEventPlan,
    generateRiskAnalysis,
    generateInvitation,
    generateBudgetPlan
} = require("../services/geminiService");


// ==============================================
// CONTROLLER 1: GENERATE EVENT PLAN
// ==============================================
const getEventPlan = async (req, res) => {
    try {
        const {
            eventType, city, budget, guestCount,
            eventDate, specialRequirements, venue, caterer
        } = req.body;

        if (!eventType || !city || !budget || !guestCount || !eventDate) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields for event plan generation."
            });
        }

        const prompt = eventPlanPrompt({
            eventType,
            city,
            budget,
            guestCount,
            eventDate,
            specialRequirements: specialRequirements || "",
            venue:               venue   || null,
            caterer:             caterer || null
        });

        const result = await generateEventPlan(prompt);

        if (!result.success) {
            return res.status(503).json({
                success: false,
                message: result.error
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event plan generated successfully.",
            aiEventPlan: result.data
        });

    } catch (error) {
        console.error("❌ Generate Event Plan Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to generate event plan. Please try again."
        });
    }
};


// ==============================================
// CONTROLLER 2: RISK ANALYSIS
// ==============================================
const getRiskAnalysis = async (req, res) => {
    try {
        const {
            eventType, city, budget, guestCount,
            eventDate, specialRequirements, venue, caterer
        } = req.body;

        if (!eventType || !city || !budget || !guestCount || !eventDate) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields for risk analysis generation."
            });
        }

        const prompt = riskAnalysisPrompt({
            eventType,
            city,
            budget,
            guestCount,
            eventDate,
            specialRequirements: specialRequirements || "",
            venue:               venue   || null,
            caterer:             caterer || null
        });

        const result = await generateRiskAnalysis(prompt);

        if (!result.success) {
            return res.status(503).json({
                success: false,
                message: result.error
            });
        }

        return res.status(200).json({
            success: true,
            message: "Risk analysis generated successfully.",
            aiRiskAnalysis: result.data
        });

    } catch (error) {
        console.error("❌ Generate Risk Analysis Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to generate risk analysis. Please try again."
        });
    }
};


// ==============================================
// CONTROLLER 3: GENERATE INVITATION
// ==============================================
const getInvitation = async (req, res) => {
    try {
        const {
            eventType, city, eventDate, guestCount,
            specialRequirements, hostName, venue, caterer
        } = req.body;

        if (!eventType || !city || !eventDate) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields for invitation generation."
            });
        }

        const finalVenueName = venue || "To Be Announced Venue Location";
        const finalCatererName = caterer || "To Be Announced Caterer Selection";
        const finalHostName = hostName || "Our Family";

        const customPrompt = `
You are an expert copywriter. Write exactly 3 customized event invitation copy options based on these parameters:
- Event Type: ${eventType}
- Host Name: ${finalHostName}
- Date of Event: ${eventDate}
- City Location: ${city}
- Confirmed Venue Address: ${finalVenueName}
- Confirmed Catering Service: ${finalCatererName}
- Special Requirements/Note: ${specialRequirements || "None"}

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

        const result = await generateInvitation(customPrompt);

        if (!result.success) {
            return res.status(503).json({
                success: false,
                message: result.error
            });
        }

        return res.status(200).json({
            success: true,
            message: "Invitations generated successfully.",
            aiInvitation: result.data
        });

    } catch (error) {
        console.error("❌ Generate Invitation Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to generate invitation copy. Please try again."
        });
    }
};


// ==============================================
// CONTROLLER 4: BUDGET OPTIMIZER
// ==============================================
const getBudgetPlan = async (req, res) => {
    try {
        const {
            eventType, city, budget, guestCount,
            eventDate, specialRequirements, venue, caterer
        } = req.body;

        if (!eventType || !city || !budget || !guestCount || !eventDate) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields for budget optimization."
            });
        }

        const prompt = budgetOptimizerPrompt({
            eventType,
            city,
            budget,
            guestCount,
            eventDate,
            specialRequirements: specialRequirements || "",
            venue:               venue   || null,
            caterer:             caterer || null
        });

        const result = await generateBudgetPlan(prompt);

        if (!result.success) {
            return res.status(503).json({
                success: false,
                message: result.error
            });
        }

        return res.status(200).json({
            success: true,
            message: "Budget plan generated successfully.",
            aiBudgetPlan: result.data
        });

    } catch (error) {
        console.error("❌ Generate Budget Plan Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to generate budget plan. Please try again."
        });
    }
};

module.exports = {
    getEventPlan,
    getRiskAnalysis,
    getInvitation,
    getBudgetPlan
};