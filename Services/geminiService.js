// ==============================================
// services/geminiService.js
// Purpose: Handle all Google Gemini API calls.
// - Creates a reusable Gemini model instance
// - Exposes functions for each AI feature
// - Validates responses before returning
// - Handles API failures with fallback messages
// ==============================================

const { GoogleGenerativeAI } = require("@google/generative-ai");

// ==============================================
// INITIALIZE GEMINI CLIENT
// Reads API key from environment variables.
// Fails loudly at startup if key is missing
// so the issue is caught early.
// ==============================================

if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in environment variables.");
    console.error("   Add GEMINI_API_KEY to your .env file and restart the server.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ------------------------------------------
// Create a reusable Gemini model instance
// gemini-1.5-flash: fast, cost-efficient,
// ideal for text generation tasks
// ------------------------------------------

const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });


// ==============================================
// HELPER: CALL GEMINI
// Internal reusable function that sends a
// prompt to Gemini and returns the response text.
// All three public functions use this internally.
//
// @param   {string} prompt   - The full prompt string
// @param   {string} feature  - Feature name for error messages
// @returns {string}          - Gemini response text
// ==============================================

const callGemini = async (prompt, feature) => {

    // ------------------------------------------
    // Validate prompt before sending to API
    // ------------------------------------------

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
        throw new Error(`Invalid prompt provided to ${feature}.`);
    }

    // ------------------------------------------
    // Call Gemini API
    // ------------------------------------------

    const result = await model.generateContent(prompt);

    // ------------------------------------------
    // Validate response structure
    // Gemini may return an empty or malformed
    // response in rare cases
    // ------------------------------------------

    if (!result || !result.response) {
        throw new Error(`Gemini returned no response for ${feature}.`);
    }

    const text = result.response.text();

    if (!text || text.trim() === "") {
        throw new Error(`Gemini returned an empty response for ${feature}.`);
    }

    return text.trim();
};


// ==============================================
// RETRY CONFIGURATION
//
// 503 ("model overloaded") is a transient global
// capacity issue on Google's side — each retry has
// a genuine independent chance of landing in a
// non-overloaded moment, so it gets more attempts
// and a gentler backoff curve.
//
// 429 (quota/rate limit) means a ceiling has
// already been hit — waiting a few seconds rarely
// resolves it within the same request, so it gets
// fewer attempts to avoid making the user wait
// through a long retry sequence that's unlikely
// to help.
//
// Everything else transient (network blips, empty
// responses, other 5xx) uses the default budget.
// ==============================================

const RETRY_CONFIG = {
    overloaded: { maxRetries: 5, baseDelayMs: 800,  maxDelayMs: 10000 }, // 503 — worth persisting
    rateLimit:  { maxRetries: 2, baseDelayMs: 1500, maxDelayMs: 6000  }, // 429 — less likely to help
    default:    { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 8000  }  // network blips, other 5xx, empty responses
};

// ==============================================
// HELPER: SLEEP
// ==============================================

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ==============================================
// HELPER: CLASSIFY ERROR
// Returns one of: "overloaded", "rateLimit",
// "retryableOther", or "nonRetryable".
//
// Used both to decide whether to retry at all,
// and which retry budget (RETRY_CONFIG) to apply.
// ==============================================

const classifyError = (error) => {
    const message = (error.message || "").toLowerCase();

    // 503 / model overloaded — check this BEFORE the generic 5xx check
    // below, since it gets its own more generous retry budget.
    if (message.includes("503") || message.includes("overloaded") || message.includes("unavailable")) {
        return "overloaded";
    }

    // 429 / quota / rate limit
    if (message.includes("429") || message.includes("quota") || message.includes("rate limit") || message.includes("resource_exhausted")) {
        return "rateLimit";
    }

    // Other transient server-side errors
    if (message.includes("500") || message.includes("502") || message.includes("504")) {
        return "retryableOther";
    }

    // Network blips
    if (message.includes("fetch") || message.includes("network") || message.includes("enotfound") || message.includes("econnreset") || message.includes("timeout")) {
        return "retryableOther";
    }

    // Gemini sometimes returns an empty response on a bad roll —
    // a retry can succeed where the same prompt failed once.
    if (message.includes("returned no response") || message.includes("returned an empty response")) {
        return "retryableOther";
    }

    // Bad API key, invalid prompt, malformed request, etc — retrying
    // won't change the outcome.
    return "nonRetryable";
};

// ==============================================
// HELPER: CALL GEMINI WITH RETRY
// Wraps the raw Gemini call with exponential
// backoff + jitter. The retry budget (how many
// attempts, how long to wait) depends on WHICH
// kind of error occurred — see RETRY_CONFIG above.
// 503 overload gets the most persistence since
// it's the most likely to resolve on its own.
//
// @param   {string} prompt   - The full prompt string
// @param   {string} feature  - Feature name for error messages
// @returns {string}          - Gemini response text
// ==============================================

const callGeminiWithRetry = async (prompt, feature) => {
    let lastError;
    let attempt = 0;

    // We don't know the retry budget until we see the first error
    // (since it depends on the error category), so the loop condition
    // is checked dynamically against whichever config applies.
    while (true) {
        try {
            if (attempt > 0) {
                console.log(`🔁 Gemini: Retry attempt ${attempt} for ${feature}...`);
            }

            return await callGemini(prompt, feature);

        } catch (error) {
            lastError = error;

            const category = classifyError(error);

            if (category === "nonRetryable") {
                throw error;
            }

            const config = RETRY_CONFIG[category] || RETRY_CONFIG.default;

            if (attempt >= config.maxRetries) {
                console.warn(`❌ Gemini: Exhausted ${config.maxRetries} retries for ${feature} (category: ${category}). Giving up.`);
                throw error;
            }

            // Exponential backoff with jitter, capped per category.
            const exponentialDelay = Math.min(config.baseDelayMs * 2 ** attempt, config.maxDelayMs);
            const jitter           = Math.random() * 300;
            const delay            = exponentialDelay + jitter;

            console.warn(`⚠️  Gemini: ${category} error for ${feature} (${error.message}). Retrying in ${Math.round(delay)}ms... (attempt ${attempt + 1}/${config.maxRetries})`);

            await sleep(delay);
            attempt++;
        }
    }
};

const generateEventPlan = async (prompt) => {
    try {
        console.log("🤖 Gemini: Generating event plan...");

        const data = await callGeminiWithRetry(prompt, "Event Plan Generator");

        console.log("✅ Gemini: Event plan generated successfully.");
        return { success: true, data };

    } catch (error) {

        // Log full error server-side for debugging
        console.error("❌ Gemini Event Plan Error:", error.message);

        // Return a meaningful fallback message to the controller
        return {
            success: false,
            error: getFallbackMessage("event plan", error)
        };
    }
};


// ==============================================
// FUNCTION 2: GENERATE RISK ANALYSIS
// Sends the risk analysis prompt to Gemini and
// returns the structured risk analysis text.
//
// @param   {string} prompt - Built by riskAnalysisPrompt()
// @returns {Object}        - { success, data } or { success, error }
// ==============================================

const generateRiskAnalysis = async (prompt) => {
    try {
        console.log("🤖 Gemini: Generating risk analysis...");

        const data = await callGeminiWithRetry(prompt, "Risk Analysis Generator");

        console.log("✅ Gemini: Risk analysis generated successfully.");
        return { success: true, data };

    } catch (error) {

        console.error("❌ Gemini Risk Analysis Error:", error.message);

        return {
            success: false,
            error: getFallbackMessage("risk analysis", error)
        };
    }
};


// ==============================================
// FUNCTION 3: GENERATE INVITATION
// Sends the invitation prompt to Gemini and
// returns the personalized invitation text.
//
// @param   {string} prompt - Built by invitationPrompt()
// @returns {Object}        - { success, data } or { success, error }
// ==============================================

const generateInvitation = async (prompt) => {
    try {
        console.log("🤖 Gemini: Generating invitation...");

        const data = await callGeminiWithRetry(prompt, "Invitation Generator");

        console.log("✅ Gemini: Invitation generated successfully.");
        return { success: true, data };

    } catch (error) {

        console.error("❌ Gemini Invitation Error:", error.message);

        return {
            success: false,
            error: getFallbackMessage("invitation", error)
        };
    }
};


// ==============================================
// HELPER: GET FALLBACK MESSAGE
// Returns a user-friendly error message based
// on the type of Gemini API error encountered.
//
// @param   {string} feature - Which feature failed
// @param   {Error}  error   - The caught error object
// @returns {string}         - User-friendly message
// ==============================================

const getFallbackMessage = (feature, error) => {

    const message = error.message || "";

    // Model overloaded (503) — distinct from quota/rate limit.
    // By the time this message is shown, several retries have
    // already been attempted automatically.
    if (message.includes("503") || message.includes("overloaded") || message.includes("unavailable")) {
        return `The AI service is experiencing heavy load right now and didn't recover after several automatic retries. Please try generating the ${feature} again shortly.`;
    }

    // API quota exceeded
    if (message.includes("429") || message.includes("quota")) {
        return `The AI service is currently busy. Please try generating the ${feature} again in a few moments.`;
    }

    // Invalid API key
    if (message.includes("400") || message.includes("API key")) {
        return `AI service configuration error. Please contact support.`;
    }

    // Network or connectivity issue
    if (message.includes("fetch") || message.includes("network") || message.includes("ENOTFOUND")) {
        return `Unable to reach the AI service. Please check your internet connection and try again.`;
    }

    // Empty or malformed response
    if (message.includes("empty")) {
        return `The AI returned an incomplete response. Please try generating the ${feature} again.`;
    }

    // Generic fallback for all other errors
    return `Unable to generate ${feature} at this time. Please try again shortly.`;
};


// ==============================================
// FUNCTION 4: GENERATE BUDGET OPTIMIZATION
// Sends the budget optimizer prompt to Gemini
// and returns the optimized budget plan text.
//
// @param   {string} prompt - Built by budgetOptimizerPrompt()
// @returns {Object}        - { success, data } or { success, error }
// ==============================================

const generateBudgetPlan = async (prompt) => {
    try {
        console.log("🤖 Gemini: Generating budget optimization...");

        const data = await callGeminiWithRetry(prompt, "Budget Optimizer");

        console.log("✅ Gemini: Budget plan generated successfully.");
        return { success: true, data };

    } catch (error) {

        console.error("❌ Gemini Budget Optimizer Error:", error.message);

        return {
            success: false,
            error: getFallbackMessage("budget optimization", error)
        };
    }
};


// ==============================================
// EXPORTS
// ==============================================

module.exports = {
    generateEventPlan,
    generateRiskAnalysis,
    generateInvitation,
    generateBudgetPlan
};