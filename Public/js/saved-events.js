// ==============================================
// public/js/saved-events.js
// Purpose: Handle all saved events page logic
// - Auth guard
// - Fetch all saved events from backend
// - Render saved event cards
// - View full event detail in modal
// - Edit saved event requirements
// - Delete saved event plans
// ==============================================


// ==============================================
// RENDER MARKDOWN
// Converts Gemini's markdown symbols into HTML
// ==============================================

function renderMarkdown(text) {
    if (!text) return "";
    return text
        .replace(/^## (.+)$/gm,    '<h3>$1</h3>')
        .replace(/^### (.+)$/gm,   '<h4>$1</h4>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g,     '<em>$1</em>')
        .replace(/^- (.+)$/gm,     '<li>$1</li>')
        .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
        .replace(/\n/g,            '<br/>');
}


// ==============================================
// GLOBAL STATE
// ==============================================

const state = {
    token:       null,
    user:        null,
    savedEvents: [],
    currentEvent: null  // Currently viewed event in modal
};


// ==============================================
// ON PAGE LOAD
// ==============================================

document.addEventListener("DOMContentLoaded", () => {

    // Read token and user from localStorage
    state.token = localStorage.getItem("token");
    state.user  = JSON.parse(localStorage.getItem("user") || "null");

    // Auth guard — redirect if not logged in
    if (!state.token || !state.user) {
        window.location.href = "/index.html";
        return;
    }

    // Show user name in navbar
    const navName = document.getElementById("navUserName");
    if (navName) navName.textContent = state.user.name;

    // Load saved events
    loadSavedEvents();
});


// ==============================================
// LOGOUT
// ==============================================

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/index.html";
}


// ==============================================
// TOAST NOTIFICATION
// ==============================================

function showToast(message, type = "error") {
    const toast = document.getElementById("savedToast");
    if (!toast) return;

    const icons = {
        success: "fa-circle-check",
        error:   "fa-circle-exclamation",
        info:    "fa-circle-info"
    };

    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.error}"></i> ${message}`;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.className = "toast";
        toast.innerHTML = "";
    }, 4000);
}


// ==============================================
// LOAD SAVED EVENTS
// GET /api/saved-events
// Fetches all saved plans for logged-in user
// ==============================================

async function loadSavedEvents() {

    const listContainer = document.getElementById("savedEventsList");

    try {
        const response = await fetch("/api/saved-events", {
            method:  "GET",
            headers: {
                "Authorization": `Bearer ${state.token}`
            }
        });

        const data = await response.json();

        if (!data.success) {
            showToast(data.message || "Failed to load saved plans.", "error");
            listContainer.innerHTML = renderError();
            return;
        }

        // Store in state
        state.savedEvents = data.savedEvents;

        // Render the list
        renderSavedEvents(data.savedEvents);

    } catch (error) {
        console.error("Load Saved Events Error:", error);
        showToast("Network error. Please try again.", "error");
        listContainer.innerHTML = renderError();
    }
}


// ==============================================
// RENDER SAVED EVENTS
// Builds the full events list or empty state
// ==============================================

function renderSavedEvents(events) {
    const listContainer = document.getElementById("savedEventsList");

    // ------------------------------------------
    // Empty state — no saved plans yet
    // ------------------------------------------

    if (!events || events.length === 0) {
        listContainer.innerHTML = `
            <div class="saved-empty">
                <i class="fa-solid fa-bookmark"></i>
                <h3>No Saved Plans Yet</h3>
                <p>You haven't saved any event plans yet. Create one on the dashboard!</p>
                <a href="/dashboard.html" class="btn-primary">
                    <i class="fa-solid fa-plus"></i> Create Your First Plan
                </a>
            </div>`;
        return;
    }

    // ------------------------------------------
    // Build cards for each saved event
    // ------------------------------------------

    const cardsHTML = events.map((event) => buildEventCard(event)).join("");

    listContainer.innerHTML = `
        <p class="saved-count">
            You have <span>${events.length}</span>
            saved plan${events.length !== 1 ? "s" : ""}
        </p>
        <div class="saved-grid">
            ${cardsHTML}
        </div>`;
}


// ==============================================
// GET COUNTDOWN
// Calculates days remaining until event date
// Returns a styled countdown badge HTML string
// ==============================================

function getCountdownBadge(eventDateStr) {
    const today     = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(eventDateStr);
    eventDate.setHours(0, 0, 0, 0);

    const diffMs   = eventDate - today;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return `<span class="countdown-badge countdown-past">
                    <i class="fa-solid fa-flag-checkered"></i> Event Passed
                </span>`;
    } else if (diffDays === 0) {
        return `<span class="countdown-badge countdown-today">
                    <i class="fa-solid fa-party-horn"></i> Today!
                </span>`;
    } else if (diffDays <= 7) {
        return `<span class="countdown-badge countdown-soon">
                    <i class="fa-solid fa-fire"></i> ${diffDays} day${diffDays !== 1 ? "s" : ""} left
                </span>`;
    } else if (diffDays <= 30) {
        return `<span class="countdown-badge countdown-near">
                    <i class="fa-solid fa-clock"></i> ${diffDays} days left
                </span>`;
    } else {
        return `<span class="countdown-badge countdown-far">
                    <i class="fa-solid fa-calendar"></i> ${diffDays} days left
                </span>`;
    }
}


// ==============================================
// BUILD EVENT CARD
// Returns HTML string for a single saved event card
// ==============================================

function buildEventCard(event) {

    // Format date for display
    const savedDate  = new Date(event.created_at).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
    });

    const eventDate  = new Date(event.event_date).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
    });

    // Event type badge class
    const badgeClass = `badge-${event.event_type.toLowerCase()}`;

    // AI content tags — show only what was generated
    let aiTags = "";
    if (event.ai_event_plan)    aiTags += `<span class="ai-tag ai-tag-plan"><i class="fa-solid fa-wand-magic-sparkles"></i> Plan</span>`;
    if (event.ai_risk_analysis) aiTags += `<span class="ai-tag ai-tag-risk"><i class="fa-solid fa-shield-halved"></i> Risk</span>`;
    if (event.ai_invitation)    aiTags += `<span class="ai-tag ai-tag-invite"><i class="fa-solid fa-envelope"></i> Invite</span>`;
    if (event.ai_budget_plan)   aiTags += `<span class="ai-tag ai-tag-budget"><i class="fa-solid fa-sack-dollar"></i> Budget</span>`;

    // Countdown badge
    const countdownBadge = getCountdownBadge(event.event_date);

    return `
        <div class="saved-card" id="saved-card-${event.id}">

            <!-- Top: Badge + Saved Date -->
            <div class="saved-card-top">
                <span class="event-type-badge ${badgeClass}">
                    <i class="fa-solid fa-star"></i>
                    ${event.event_type}
                </span>
                <span class="saved-card-date">
                    <i class="fa-solid fa-clock"></i>
                    ${savedDate}
                </span>
            </div>

            <!-- Countdown Banner -->
            <div class="countdown-row">
                ${countdownBadge}
            </div>

            <!-- Event Info Grid -->
            <div class="saved-card-info">
                <div class="saved-card-info-item">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${event.city}</span>
                </div>
                <div class="saved-card-info-item">
                    <i class="fa-solid fa-calendar"></i>
                    <span>${eventDate}</span>
                </div>
                <div class="saved-card-info-item">
                    <i class="fa-solid fa-indian-rupee-sign"></i>
                    <span>₹${parseInt(event.budget).toLocaleString("en-IN")}</span>
                </div>
                <div class="saved-card-info-item">
                    <i class="fa-solid fa-users"></i>
                    <span>${event.guest_count} Guests</span>
                </div>
                ${event.recommended_venue ? `
                <div class="saved-card-info-item">
                    <i class="fa-solid fa-building"></i>
                    <span>${event.recommended_venue}</span>
                </div>` : ""}
                ${event.recommended_caterer ? `
                <div class="saved-card-info-item">
                    <i class="fa-solid fa-utensils"></i>
                    <span>${event.recommended_caterer}</span>
                </div>` : ""}
            </div>

            <!-- AI Content Tags -->
            ${aiTags ? `<div class="saved-card-ai-tags">${aiTags}</div>` : ""}

            <!-- Card Actions -->
            <div class="saved-card-actions">
                <button class="btn-view" onclick="viewEventDetail(${event.id})">
                    <i class="fa-solid fa-eye"></i> View Plan
                </button>
                <button class="btn-edit" style="background-color: var(--accent-purple, #6f42c1); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;" onclick="openEditModal(${event.id})">
                    <i class="fa-solid fa-pen"></i> Edit
                </button>
                <button class="btn-danger" onclick="deleteEvent(${event.id})">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </div>

        </div>`;
}


// ==============================================
// VIEW EVENT DETAIL
// GET /api/saved-events/:id
// Opens the detail modal with full plan content
// ==============================================

async function viewEventDetail(eventId) {

    try {
        const response = await fetch(`/api/saved-events/${eventId}`, {
            method:  "GET",
            headers: {
                "Authorization": `Bearer ${state.token}`
            }
        });

        const data = await response.json();

        if (!data.success) {
            showToast(data.message || "Failed to load event details.", "error");
            return;
        }

        const event = data.savedEvent;
        state.currentEvent = event;

        // ------------------------------------------
        // Build modal title
        // ------------------------------------------

        document.getElementById("detailModalTitle").innerHTML = `
            <i class="fa-solid fa-calendar-star"></i>
            ${event.event_type} — ${event.city}`;

        // ------------------------------------------
        // Build modal body
        // ------------------------------------------

        const eventDate = new Date(event.event_date).toLocaleDateString("en-IN", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        });

        let bodyHTML = `
            <!-- Event Summary Grid -->
            <div class="detail-summary">
                <div class="detail-summary-item">
                    <span class="detail-summary-label">Event Type</span>
                    <span class="detail-summary-value">${event.event_type}</span>
                </div>
                <div class="detail-summary-item">
                    <span class="detail-summary-label">City</span>
                    <span class="detail-summary-value">${event.city}</span>
                </div>
                <div class="detail-summary-item">
                    <span class="detail-summary-label">Event Date</span>
                    <span class="detail-summary-value">${eventDate}</span>
                </div>
                <div class="detail-summary-item">
                    <span class="detail-summary-label">Budget</span>
                    <span class="detail-summary-value">₹${parseInt(event.budget).toLocaleString("en-IN")}</span>
                </div>
                <div class="detail-summary-item">
                    <span class="detail-summary-label">Guests</span>
                    <span class="detail-summary-value">${event.guest_count}</span>
                </div>
                ${event.recommended_venue ? `
                <div class="detail-summary-item">
                    <span class="detail-summary-label">Venue</span>
                    <span class="detail-summary-value">${event.recommended_venue}</span>
                </div>` : ""}
                ${event.recommended_caterer ? `
                <div class="detail-summary-item">
                    <span class="detail-summary-label">Caterer</span>
                    <span class="detail-summary-value">${event.recommended_caterer}</span>
                </div>` : ""}
                <div class="detail-summary-item">
                    <span class="detail-summary-label">Special Requirements</span>
                    <span class="detail-summary-value" id="modal-requirements-text">${event.special_requirements || "None"}</span>
                </div>
            </div>`;

        // AI Event Plan section
        if (event.ai_event_plan) {
            bodyHTML += `
                <div class="detail-ai-section">
                    <h3 class="detail-ai-title">
                        <i class="fa-solid fa-wand-magic-sparkles" style="color:var(--accent-purple)"></i>
                        AI Event Plan
                    </h3>
                    <div class="detail-ai-content">${renderMarkdown(event.ai_event_plan)}</div>
                </div>`;
        }

        // AI Risk Analysis section
        if (event.ai_risk_analysis) {
            bodyHTML += `
                <div class="detail-ai-section">
                    <h3 class="detail-ai-title">
                        <i class="fa-solid fa-shield-halved" style="color:var(--accent-red)"></i>
                        Risk Analysis
                    </h3>
                    <div class="detail-ai-content">${renderMarkdown(event.ai_risk_analysis)}</div>
                </div>`;
        }

        // AI Invitation section
        if (event.ai_invitation) {
            bodyHTML += `
                <div class="detail-ai-section">
                    <h3 class="detail-ai-title">
                        <i class="fa-solid fa-envelope" style="color:var(--accent-green)"></i>
                        AI Invitation
                    </h3>
                    <div class="detail-ai-content">${renderMarkdown(event.ai_invitation)}</div>
                </div>`;
        }

        // AI Budget Optimization section
        if (event.ai_budget_plan) {
            bodyHTML += `
                <div class="detail-ai-section">
                    <h3 class="detail-ai-title">
                        <i class="fa-solid fa-sack-dollar" style="color:#f59e0b"></i>
                        AI Budget Optimization
                    </h3>
                    <div class="detail-ai-content">${renderMarkdown(event.ai_budget_plan)}</div>
                </div>`;
        }

        // Action controls inside modal base
        bodyHTML += `
            <div class="detail-delete-bar" style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn-edit" style="background-color: var(--accent-purple, #6f42c1); color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;" onclick="openEditModal(${event.id})">
                    <i class="fa-solid fa-pen"></i> Edit Plan
                </button>
                <button class="btn-danger" onclick="deleteEvent(${event.id}, true)">
                    <i class="fa-solid fa-trash"></i> Delete This Plan
                </button>
            </div>`;

        document.getElementById("detailModalBody").innerHTML = bodyHTML;

        // Open the modal
        document.getElementById("detailModal").classList.add("active");
        document.body.style.overflow = "hidden";

    } catch (error) {
        console.error("View Detail Error:", error);
        showToast("Network error. Please try again.", "error");
    }
}


// ==============================================
// CLOSE DETAIL MODAL
// ==============================================

function closeDetailModal() {
    document.getElementById("detailModal").classList.remove("active");
    document.body.style.overflow = "";
}

// Close modal when clicking outside
document.addEventListener("click", (e) => {
    if (e.target.id === "detailModal") {
        closeDetailModal();
    }
});

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeDetailModal();
        closeEditModal();
    }
});


// ==============================================
// EDIT EVENT MODAL
// Opens a full edit form pre-filled with the
// event's current details (event type, city,
// budget, guests, date, special requirements)
// ==============================================

function openEditModal(eventId) {
    const event = state.savedEvents.find(e => e.id === eventId);
    if (!event) {
        showToast("Could not find this event. Please refresh and try again.", "error");
        return;
    }

    document.getElementById("editEventId").value     = event.id;
    document.getElementById("editEventType").value   = event.event_type;
    document.getElementById("editCity").value         = event.city;
    document.getElementById("editBudget").value       = event.budget;
    document.getElementById("editGuestCount").value   = event.guest_count;
    document.getElementById("editEventDate").value    = new Date(event.event_date).toISOString().split("T")[0];
    document.getElementById("editRequirements").value = event.special_requirements || "";

    document.getElementById("editModal").classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeEditModal() {
    document.getElementById("editModal").classList.remove("active");
    document.body.style.overflow = "";
}

// Close edit modal when clicking outside
document.addEventListener("click", (e) => {
    if (e.target.id === "editModal") {
        closeEditModal();
    }
});

// ==============================================
// SUBMIT EVENT EDIT
// PUT /api/saved-events/:id
// Saves all updated fields from the edit modal
// ==============================================

document.addEventListener("DOMContentLoaded", () => {
    const editForm = document.getElementById("editEventForm");
    if (!editForm) return;

    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const eventId = parseInt(document.getElementById("editEventId").value);

        const updatedData = {
            eventType:           document.getElementById("editEventType").value,
            city:                document.getElementById("editCity").value,
            budget:              document.getElementById("editBudget").value,
            guestCount:          document.getElementById("editGuestCount").value,
            eventDate:           document.getElementById("editEventDate").value,
            specialRequirements: document.getElementById("editRequirements").value,
            // Ask the backend to regenerate whichever AI sections this
            // event already has, using the freshly edited details above,
            // so the saved plan never goes stale after an edit.
            regenerateAi: true
        };

        // Show a busy state on the save button — regeneration can take
        // a few seconds since it may call Gemini multiple times.
        const saveBtn = document.querySelector('#editEventForm button[type="submit"]');
        const saveBtnOriginalHTML = saveBtn ? saveBtn.innerHTML : "";
        if (saveBtn) {
            saveBtn.disabled  = true;
            saveBtn.innerHTML = `<span class="spinner show"></span> Saving & regenerating plan...`;
        }

        try {
            const response = await fetch(`/api/saved-events/${eventId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${state.token}`
                },
                body: JSON.stringify(updatedData)
            });

            const data = await response.json();

            if (!data.success) {
                showToast(data.message || "Failed to update event plan.", "error");
                return;
            }

            if (data.regenerationWarnings && data.regenerationWarnings.length > 0) {
                showToast("Saved, but some AI content couldn't be regenerated. Old content was kept for those sections.", "info");
            } else {
                showToast("Event plan updated and AI content regenerated.", "success");
            }

            // Update local state with the new raw fields AND the freshly
            // regenerated AI content returned by the server.
            const freshAi = data.updatedAiContent || {};

            state.savedEvents = state.savedEvents.map(event => {
                if (event.id === eventId) {
                    return {
                        ...event,
                        event_type:           updatedData.eventType,
                        city:                 updatedData.city,
                        budget:               parseInt(updatedData.budget),
                        guest_count:          parseInt(updatedData.guestCount),
                        event_date:           updatedData.eventDate,
                        special_requirements: updatedData.specialRequirements,
                        ai_event_plan:        freshAi.aiEventPlan    !== undefined ? freshAi.aiEventPlan    : event.ai_event_plan,
                        ai_risk_analysis:     freshAi.aiRiskAnalysis !== undefined ? freshAi.aiRiskAnalysis : event.ai_risk_analysis,
                        ai_invitation:        freshAi.aiInvitation   !== undefined ? freshAi.aiInvitation   : event.ai_invitation,
                        ai_budget_plan:       freshAi.aiBudgetPlan   !== undefined ? freshAi.aiBudgetPlan   : event.ai_budget_plan
                    };
                }
                return event;
            });

            // If the detail modal is currently showing this same event,
            // refresh it in place so the regenerated plan is visible
            // immediately instead of showing stale text until next open.
            if (state.currentEvent && state.currentEvent.id === eventId) {
                const refreshedEvent = state.savedEvents.find(e => e.id === eventId);
                if (refreshedEvent) {
                    state.currentEvent = refreshedEvent;
                }
            }

            // Close both modals and re-render cards with fresh data
            closeEditModal();
            closeDetailModal();
            renderSavedEvents(state.savedEvents);

        } catch (error) {
            console.error("Edit Event Error:", error);
            showToast("Network error. Please try again.", "error");
        } finally {
            if (saveBtn) {
                saveBtn.disabled  = false;
                saveBtn.innerHTML = saveBtnOriginalHTML;
            }
        }
    });
});


// ==============================================
// DELETE SAVED EVENT
// DELETE /api/saved-events/:id
// ==============================================

async function deleteEvent(eventId, fromModal = false) {

    // Confirm before deleting
    const confirmed = confirm("Are you sure you want to delete this saved plan? This cannot be undone.");
    if (!confirmed) return;

    try {
        const response = await fetch(`/api/saved-events/${eventId}`, {
            method:  "DELETE",
            headers: {
                "Authorization": `Bearer ${state.token}`
            }
        });

        const data = await response.json();

        if (!data.success) {
            showToast(data.message || "Failed to delete event.", "error");
            return;
        }

        showToast("Event plan deleted successfully.", "success");

        // Close modal if delete was triggered from inside it
        if (fromModal) closeDetailModal();

        // Remove card from DOM instantly for better UX
        const card = document.getElementById(`saved-card-${eventId}`);
        if (card) {
            card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
            card.style.opacity    = "0";
            card.style.transform  = "scale(0.95)";
            setTimeout(() => {
                // Remove from state and re-render
                state.savedEvents = state.savedEvents.filter(e => e.id !== eventId);
                renderSavedEvents(state.savedEvents);
            }, 300);
        }

    } catch (error) {
        console.error("Delete Event Error:", error);
        showToast("Network error. Please try again.", "error");
    }
}


// ==============================================
// RENDER ERROR STATE
// ==============================================

function renderError() {
    return `
        <div class="saved-empty">
            <i class="fa-solid fa-circle-exclamation"></i>
            <h3>Something went wrong</h3>
            <p>Could not load your saved plans. Please refresh the page.</p>
        </div>`;
}