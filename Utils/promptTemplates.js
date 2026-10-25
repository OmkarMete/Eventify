// ==============================================
// utils/promptTemplates.js
// Purpose: Centralized Gemini prompt templates.
// All prompts are defined here as functions that
// accept dynamic event details and return a
// fully constructed prompt string.
//
// Prompts:
//   1. eventPlanPrompt()      — Full event plan
//   2. riskAnalysisPrompt()   — Risk analysis
//   3. invitationPrompt()     — Personalized invite
// ==============================================


// ==============================================
// PROMPT 1: EVENT PLAN GENERATOR
// Generates a complete structured event plan
// based on user inputs, recommended venue,
// and recommended caterer.
//
// @param {Object} details - Event details
// @param {string} details.eventType
// @param {string} details.city
// @param {number} details.budget
// @param {number} details.guestCount
// @param {string} details.eventDate
// @param {string} details.specialRequirements
// @param {Object} details.venue   - Recommended venue object
// @param {Object} details.caterer - Recommended caterer object
// @returns {string} Full prompt string for Gemini
// ==============================================

const eventPlanPrompt = ({
    eventType,
    city,
    budget,
    guestCount,
    eventDate,
    specialRequirements,
    venue,
    caterer
}) => {

    // Build venue context — handle case where no venue matched
    const venueContext = venue
        ? `Venue Name    : ${venue.venue_name}
           City          : ${venue.city}
           Capacity      : ${venue.capacity} guests
           Booking Cost  : ₹${venue.cost}`
        : "No specific venue matched. Suggest a general suitable venue type.";

    // Build caterer context — handle case where no caterer matched
    const catererContext = caterer
        ? `Caterer Name  : ${caterer.caterer_name}
           Cuisine Type  : ${caterer.cuisine_type}
           Per Person    : ₹${caterer.price_per_person}
           Total Cost    : ₹${caterer.total_cost}`
        : "No specific caterer matched. Suggest a general suitable catering style.";

    return `
You are an expert event planner with over 15 years of experience organizing
weddings, corporate events, birthdays, engagements, and anniversaries in India.

A client has provided the following event details:

EVENT DETAILS:
--------------
Event Type           : ${eventType}
City                 : ${city}
Event Date           : ${eventDate}
Number of Guests     : ${guestCount}
Total Budget         : ₹${budget}
Special Requirements : ${specialRequirements || "None"}

RECOMMENDED VENUE:
------------------
${venueContext}

RECOMMENDED CATERER:
--------------------
${catererContext}

TASK:
-----
Using the above information, generate a complete, professional, and realistic
event plan. Structure your response EXACTLY in the following format with
clear section headings. Be specific, practical, and tailor every detail
to the event type, city, guest count, and budget provided.

---

## 1. Event Overview
Write a brief 3–4 sentence summary of the event, tone, and key highlights.

---

## 2. Event Timeline
List a realistic hour-by-hour schedule for the day of the event.
Format each item as:
[Time] - [Activity]
Example:
10:00 AM - Venue setup begins
12:00 PM - Guest arrival and welcome drinks

---

## 3. Budget Breakdown
Break down the total budget of ₹${budget} across all major categories.
Format as:
[Category] : ₹[Amount] ([Percentage]%)
Categories must include:
- Venue
- Catering
- Decoration
- Entertainment
- Photography / Videography
- Transportation
- Miscellaneous
End with a Total line confirming the sum.

---

## 4. Event Checklist
Provide a practical checklist of tasks to complete before the event.
Group tasks under:
- 1 Month Before
- 1 Week Before
- 1 Day Before
- Day of Event
Format each task as a checkbox item:
☐ [Task description]

---

## 5. Vendor Suggestions
Suggest specific types of vendors needed for this event.
For each vendor category, briefly describe what to look for.
Categories to include:
- Decorator
- Photographer / Videographer
- Entertainment (DJ, live band, emcee, etc.)
- Transportation
- Any event-type-specific vendors (e.g. mehendi artist for weddings)

---

## 6. Decoration Theme
Suggest one cohesive decoration theme for this event. Include:
- Theme Name and a short Tagline (max 12 words)
- A 2-3 sentence description of the overall look and feel
- Color Palette: 4-5 colors, each as its own bullet in the format
  "[Color Name] — #[HEXCODE]" using real, well-matched hex codes
- Decor Items: 5-8 items as "[Item Name]: [short description] (₹[estimated cost])",
  kept consistent with the Decoration line item in the Budget Breakdown above
- Mood & Styling Keywords: 4-6 short words or phrases, comma-separated

---

Keep the tone professional yet warm. All costs must be in Indian Rupees (₹).
Do not exceed the total budget of ₹${budget}.
`.trim();
};


// ==============================================
// PROMPT 2: RISK ANALYSIS GENERATOR
// Analyzes potential risks based on event
// details and provides mitigation strategies.
//
// @param {Object} details - Event details
// @param {string} details.eventType
// @param {string} details.city
// @param {number} details.budget
// @param {number} details.guestCount
// @param {string} details.eventDate
// @param {string} details.specialRequirements
// @param {Object} details.venue
// @param {Object} details.caterer
// @returns {string} Full prompt string for Gemini
// ==============================================

const riskAnalysisPrompt = ({
    eventType,
    city,
    budget,
    guestCount,
    eventDate,
    specialRequirements,
    venue,
    caterer
}) => {

    const venueContext = venue
        ? `${venue.venue_name}, ${venue.city} (Capacity: ${venue.capacity}, Cost: ₹${venue.cost})`
        : "No matched venue — general venue risks apply.";

    const catererContext = caterer
        ? `${caterer.caterer_name} — ${caterer.cuisine_type} cuisine at ₹${caterer.price_per_person}/person (Total: ₹${caterer.total_cost})`
        : "No matched caterer — general catering risks apply.";

    return `
You are a professional event risk consultant with deep expertise in
identifying and mitigating risks for events across India.

A client is planning the following event:

EVENT DETAILS:
--------------
Event Type           : ${eventType}
City                 : ${city}
Event Date           : ${eventDate}
Number of Guests     : ${guestCount}
Total Budget         : ₹${budget}
Special Requirements : ${specialRequirements || "None"}
Recommended Venue    : ${venueContext}
Recommended Caterer  : ${catererContext}

TASK:
-----
Perform a thorough risk analysis for this event. Structure your response
EXACTLY in the following format. Be specific to the event type, city,
guest count, budget, and date provided. Do not give generic advice —
tailor every risk and recommendation to this specific event.

---

## 1. Risk Summary
Write a brief 2–3 sentence overall risk assessment for this event,
highlighting the top concern areas.

---

## 2. Potential Risks
Identify all significant risks across the following categories.
For each risk, provide:
- Risk Level: 🔴 High / 🟡 Medium / 🟢 Low
- Description: What the risk is and why it applies to this event.

Categories to cover:
- Budget Risk
- Venue Risk
- Catering Risk
- Weather / Environmental Risk (especially relevant for ${city})
- Guest Management Risk
- Vendor Reliability Risk
- Time / Scheduling Risk
- Special Requirements Risk (based on: ${specialRequirements || "None"})

---

## 3. Mitigation Strategies
For each risk identified above, provide one clear and actionable
mitigation strategy. Format as:
[Risk Name] → [Mitigation Action]

---

## 4. Contingency Planning
Provide a contingency plan for the top 3 highest-priority risks.
For each, describe:
- What happens if the risk occurs
- The immediate backup action to take
- Who should be responsible

---

## 5. Final Recommendations
List 3–5 specific recommendations this client should act on
immediately to reduce overall event risk.

---

Keep the tone professional and constructive. Be honest about risks
without being alarmist. All cost references must be in Indian Rupees (₹).
`.trim();
};


// ==============================================
// PROMPT 3: INVITATION GENERATOR
// Generates a personalized event invitation
// based on event type, date, city, and
// special requirements.
//
// @param {Object} details - Event details
// @param {string} details.eventType
// @param {string} details.city
// @param {string} details.eventDate
// @param {string} details.guestCount
// @param {string} details.specialRequirements
// @param {string} details.hostName  - Name of host (optional)
// @returns {string} Full prompt string for Gemini
// ==============================================

const invitationPrompt = ({
    eventType,
    city,
    eventDate,
    guestCount,
    specialRequirements,
    hostName
}) => {

    return `
You are a professional invitation writer who specializes in crafting
warm, elegant, and personalized event invitations for Indian celebrations
and formal events.

A client needs an invitation for the following event:

EVENT DETAILS:
--------------
Event Type           : ${eventType}
Host Name            : ${hostName || "The Host"}
City                 : ${city}
Event Date           : ${eventDate}
Number of Guests     : ${guestCount}
Special Requirements : ${specialRequirements || "None"}

TASK:
-----
Write a beautiful, personalized event invitation based on the details above.
Structure your response EXACTLY in the following format.

---

## 1. Formal Invitation
Write a complete, elegant formal invitation suitable for printing or
digital sharing. It should:
- Open with a warm, event-appropriate greeting
- Clearly mention the event type, host name, date, and city
- Include a heartfelt personal touch that reflects the occasion
- Close with RSVP or attendance request
- Tone: Warm, graceful, and celebratory
- Length: 100–150 words

---

## 2. Short Digital Invite (WhatsApp / Social Media)
Write a shorter, friendly version of the invitation suitable for
WhatsApp or social media. It should:
- Be concise (40–60 words)
- Use a casual, joyful tone
- Include key details: event, date, city
- End with an emoji-friendly sign-off

---

## 3. Invitation Subject Line (for Email)
Write 3 creative and compelling email subject lines for this invitation.
Format as a numbered list.

---

## 4. Special Notes for Guests
Based on the special requirements (${specialRequirements || "None"}),
write 2–3 short guest notes or instructions to include with the invitation.
Example: dress code, dietary options, parking info, ceremony customs, etc.

---

Make the invitation feel personal, joyful, and appropriate for the
event type. Reflect the culture and warmth of an Indian ${eventType} celebration.
`.trim();
};


// ==============================================
// PROMPT 4: BUDGET OPTIMIZER
// Analyzes the user's budget and suggests the
// most efficient way to allocate it across all
// event categories, with cost-saving tips.
//
// @param {Object} details - Event details
// @param {string} details.eventType
// @param {string} details.city
// @param {number} details.budget
// @param {number} details.guestCount
// @param {string} details.eventDate
// @param {string} details.specialRequirements
// @param {Object} details.venue
// @param {Object} details.caterer
// @returns {string} Full prompt string for Gemini
// ==============================================

const budgetOptimizerPrompt = ({
    eventType,
    city,
    budget,
    guestCount,
    eventDate,
    specialRequirements,
    venue,
    caterer
}) => {

    const venueContext = venue
        ? `${venue.venue_name}, ${venue.city} — Cost: ₹${venue.cost}`
        : "No specific venue selected yet.";

    const catererContext = caterer
        ? `${caterer.caterer_name} — ₹${caterer.price_per_person}/person (Total: ₹${caterer.total_cost})`
        : "No specific caterer selected yet.";

    return `
You are a professional event budget consultant who specializes in helping
clients in India get the most value out of their event budget without
compromising on quality.

A client has provided the following event details:

EVENT DETAILS:
--------------
Event Type           : ${eventType}
City                 : ${city}
Event Date           : ${eventDate}
Number of Guests     : ${guestCount}
Total Budget         : ₹${budget}
Special Requirements : ${specialRequirements || "None"}
Selected Venue       : ${venueContext}
Selected Caterer     : ${catererContext}

TASK:
-----
Analyze this budget and provide an optimized allocation plan. Structure
your response EXACTLY in the following format. Be specific and realistic
for the ${city} market and ${eventType} events.

---

## 1. Budget Health Check
Write a 2-3 sentence assessment of whether ₹${budget} is sufficient,
tight, or generous for a ${eventType} with ${guestCount} guests in ${city}.

---

## 2. Optimized Budget Allocation
Provide the ideal percentage and amount split across categories.
Format as:
[Category] : ₹[Amount] ([Percentage]%)
Categories must include:
- Venue
- Catering
- Decoration
- Entertainment
- Photography / Videography
- Transportation
- Miscellaneous / Contingency
End with a Total line confirming it equals ₹${budget}.

---

## 3. Cost-Saving Opportunities
List 4-5 specific, practical ways this client could save money without
sacrificing quality. Format as:
[Area] → [Specific Saving Tip] (Potential Savings: ₹[Amount])

---

## 4. Where NOT to Cut Corners
List 2-3 areas where spending should NOT be reduced, and explain why,
specific to a ${eventType} event.

---

## 5. Smart Upgrade Suggestions
If the client has any flexibility, suggest 2-3 worthwhile upgrades
and their approximate additional cost.

---

Keep the tone practical and money-conscious. All amounts in Indian Rupees (₹).
The total allocation must never exceed ₹${budget}.
`.trim();
};


// ==============================================
// EXPORTS
// ==============================================

module.exports = {
    eventPlanPrompt,
    riskAnalysisPrompt,
    invitationPrompt,
    budgetOptimizerPrompt
};