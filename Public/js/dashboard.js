// ==============================================
// public/js/dashboard.js
// Purpose: Handle all dashboard functionality
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
        .replace(/\n/g,            '<br/>')
        .replace(/#([0-9A-Fa-f]{6})\b/g, (match, hex) => {
            return `<span class="color-dot" style="background:#${hex};"></span>${match}`;
        });
}

const state = {
    token:              null,
    user:               null,
    eventDetails:       null, 
    venues:             [],   
    caterers:           [],   
    selectedVenue:      null, 
    selectedCaterer:    null, 
    aiEventPlan:        null, 
    aiRiskAnalysis:     null, 
    aiInvitation:       null, 
    aiBudgetPlan:       null  
};

document.addEventListener("DOMContentLoaded", () => {
    state.token = localStorage.getItem("token");
    state.user  = JSON.parse(localStorage.getItem("user") || "null");

    if (!state.token || !state.user) {
        window.location.href = "/index.html";
        return;
    }

    const navName = document.getElementById("navUserName");
    if (navName) navName.textContent = state.user.name;

    const today = new Date().toISOString().split("T")[0];
    const dateInput = document.getElementById("eventDate");
    if (dateInput) dateInput.min = today;
});

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/index.html";
}

function showDashboardToast(message, type = "error") {
    const oldToast = document.getElementById("dashboardToastDynamic");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.id = "dashboardToastDynamic";
    toast.style.position = "fixed";
    toast.style.top = "20px";
    toast.style.right = "20px";
    toast.style.zIndex = "999999";
    toast.style.padding = "14px 20px";
    toast.style.borderRadius = "12px";
    toast.style.color = "#fff";
    toast.style.fontWeight = "600";
    toast.style.fontSize = "15px";
    toast.style.boxShadow = "0 8px 25px rgba(0,0,0,0.3)";
    toast.style.maxWidth = "350px";
    toast.style.animation = "sectionIn 0.25s ease forwards";

    if (type === "success") {
        toast.style.background = "#22c55e"; 
    } else if (type === "info") {
        toast.style.background = "#3b82f6"; 
    } else {
        toast.style.background = "#ef4444"; 
    }

    toast.innerHTML = message;
    document.body.appendChild(toast);

    setTimeout(() => { toast.remove(); }, 4000);
}

function showLoader(text = "Loading...") {
    const loader = document.getElementById("pageLoader");
    const loaderText = document.getElementById("loaderText");
    if (loader) loader.classList.add("show");
    if (loaderText) loaderText.textContent = text;
}

function hideLoader() {
    const loader = document.getElementById("pageLoader");
    if (loader) loader.classList.remove("show");
}

function showSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = "block";
        setTimeout(() => {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    }
}

function hideSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) section.style.display = "none";
}

async function findMatches() {
    const eventType           = document.getElementById("eventType").value;
    const city                = document.getElementById("city").value;
    const budget              = document.getElementById("budget").value;
    const guestCount          = document.getElementById("guestCount").value;
    const eventDate           = document.getElementById("eventDate").value;
    const hostName            = document.getElementById("hostName").value.trim();
    const specialRequirements = document.getElementById("specialRequirements").value.trim();

    if (!eventType) { showDashboardToast("Please select an event type.", "error"); return; }
    if (!city)      { showDashboardToast("Please select a city.", "error"); return; }
    if (!budget     || parseInt(budget) <= 0)     { showDashboardToast("Please enter a valid budget.", "error"); return; }
    if (!guestCount || parseInt(guestCount) <= 0) { showDashboardToast("Please enter a valid guest count.", "error"); return; }
    if (!eventDate) { showDashboardToast("Please select an event date.", "error"); return; }

    const today = new Date().toISOString().split("T")[0];
    if (eventDate < today) {
        showDashboardToast("Event date cannot be in the past.", "error");
        return;
    }

    const btn = document.getElementById("findMatchesBtn");
    btn.disabled  = true;
    btn.innerHTML = `<span class="spinner show"></span> Searching...`;

    hideSection("venueSection");
    hideSection("catererSection");
    hideSection("aiSection");
    hideSection("planSection");
    hideSection("riskSection");
    hideSection("inviteSection");
    hideSection("budgetSection");
    hideSection("saveSection");

    state.selectedVenue   = null;
    state.selectedCaterer = null;
    state.aiEventPlan     = null;
    state.aiRiskAnalysis  = null;
    state.aiInvitation    = null;
    state.aiBudgetPlan    = null;

    try {
        const response = await fetch("/api/events/plan", {
            method:  "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${state.token}`
            },
            body: JSON.stringify({
                eventType, city, budget: parseInt(budget), guestCount: parseInt(guestCount), eventDate, specialRequirements
            })
        });

        const data = await response.json();
        if (!data.success) {
            showDashboardToast(data.message || "Failed to fetch recommendations.", "error");
            return;
        }

        state.eventDetails = { ...data.eventDetails, hostName };
        state.venues       = data.recommendations.venues.results;
        state.caterers     = data.recommendations.caterers.results;

        renderVenues(state.venues);
        showSection("venueSection");

        renderCaterers(state.caterers);
        showSection("catererSection");

        showSection("aiSection");
        showDashboardToast(`Found ${state.venues.length} venue(s) and ${state.caterers.length} caterer(s).`, "success");

    } catch (error) {
        showDashboardToast("Network error. Please try again.", "error");
    } finally {
        btn.disabled  = false;
        btn.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> Find Venues & Caterers`;
    }
}

function renderVenues(venues) {
    const container = document.getElementById("venueResults");
    if (!venues || venues.length === 0) {
        container.innerHTML = `<div class="no-results"><p>No venues found matching criteria.</p></div>`;
        return;
    }
    container.innerHTML = venues.map((venue, index) => `
        <div class="result-card" id="venue-card-${index}" onclick="selectVenue(${index})">
            <div class="result-card-name"><i class="fa-solid fa-building" style="color:var(--accent-blue); margin-right:0.4rem;"></i>${venue.venue_name}</div>
            <div class="result-card-details">
                <div class="result-card-detail"><i class="fa-solid fa-location-dot"></i><span>${venue.city}</span></div>
                <div class="result-card-detail"><i class="fa-solid fa-users"></i><span>Capacity: ${venue.capacity}</span></div>
            </div>
            <div class="result-card-cost">₹${venue.cost.toLocaleString("en-IN")}</div>
        </div>
    `).join("");
}

function renderCaterers(caterers) {
    const container = document.getElementById("catererResults");
    if (!caterers || caterers.length === 0) {
        container.innerHTML = `<div class="no-results"><p>No caterers found matching criteria.</p></div>`;
        return;
    }
    container.innerHTML = caterers.map((caterer, index) => `
        <div class="result-card" id="caterer-card-${index}" onclick="selectCaterer(${index})">
            <div class="result-card-name"><i class="fa-solid fa-utensils" style="color:var(--accent-orange); margin-right:0.4rem;"></i>${caterer.caterer_name}</div>
            <div class="result-card-details">
                <div class="result-card-detail"><i class="fa-solid fa-location-dot"></i><span>${caterer.city}</span></div>
                <div class="result-card-detail"><i class="fa-solid fa-bowl-food"></i><span>${caterer.cuisine_type}</span></div>
            </div>
            <div class="result-card-cost">₹${caterer.total_cost.toLocaleString("en-IN")}</div>
        </div>
    `).join("");
}

function selectVenue(index) {
    if (!state.eventDetails) return;
    document.querySelectorAll("[id^='venue-card-']").forEach(card => card.classList.remove("selected"));
    const card = document.getElementById(`venue-card-${index}`);
    if (card) card.classList.add("selected");
    state.selectedVenue = state.venues[index];
}

function selectCaterer(index) {
    if (!state.eventDetails) return;
    document.querySelectorAll("[id^='caterer-card-']").forEach(card => card.classList.remove("selected"));
    const card = document.getElementById(`caterer-card-${index}`);
    if (card) card.classList.add("selected");
    state.selectedCaterer = state.caterers[index];
}

async function generatePlan() {
    if (!state.eventDetails) return;
    showLoader("Generating personalized event plan...");
    const btn = document.getElementById("generatePlanBtn");
    btn.disabled = true;
    try {
        const response = await fetch("/api/ai/generate-plan", {
            method:  "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${state.token}` },
            body: JSON.stringify({ ...state.eventDetails, venue: state.selectedVenue, caterer: state.selectedCaterer })
        });
        const data = await response.json();
        if (!data.success) { showDashboardToast(data.message || "Failed.", "error"); return; }
        state.aiEventPlan = data.aiEventPlan;
        document.getElementById("planResult").innerHTML = renderMarkdown(data.aiEventPlan);
        showSection("planSection");
        showSection("saveSection");
    } catch (e) { showDashboardToast("Network error.", "error"); } finally { hideLoader(); btn.disabled = false; }
}

async function generateRisk() {
    if (!state.eventDetails) return;
    showLoader("Analyzing potential risks...");
    const btn = document.getElementById("generateRiskBtn");
    btn.disabled = true;
    try {
        const response = await fetch("/api/ai/risk-analysis", {
            method:  "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${state.token}` },
            body: JSON.stringify({ ...state.eventDetails, venue: state.selectedVenue, caterer: state.selectedCaterer })
        });
        const data = await response.json();
        if (!data.success) { showDashboardToast(data.message || "Failed.", "error"); return; }
        state.aiRiskAnalysis = data.aiRiskAnalysis;
        document.getElementById("riskResult").innerHTML = renderMarkdown(data.aiRiskAnalysis);
        showSection("riskSection");
        showSection("saveSection");
    } catch (e) { showDashboardToast("Network error.", "error"); } finally { hideLoader(); btn.disabled = false; }
}

async function generateInvitation() {
    if (!state.eventDetails) return;
    showLoader("Crafting customized templates...");
    const btn = document.getElementById("generateInviteBtn");
    btn.disabled = true;
    try {
        const response = await fetch("/api/ai/generate-invitation", {
            method:  "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${state.token}` },
            body: JSON.stringify({
                eventType:           state.eventDetails.eventType,
                city:                state.eventDetails.city,
                eventDate:           state.eventDetails.eventDate,
                guestCount:          state.eventDetails.guestCount,
                specialRequirements: state.eventDetails.specialRequirements,
                hostName:            state.eventDetails.hostName,
                venue:               state.selectedVenue   ? state.selectedVenue.venue_name     : "",
                caterer:             state.selectedCaterer ? state.selectedCaterer.caterer_name : ""
            })
        });
        const data = await response.json();
        if (!data.success) { showDashboardToast(data.message || "Failed.", "error"); return; }
        state.aiInvitation = data.aiInvitation;
        document.getElementById("inviteResult").innerHTML = renderMarkdown(data.aiInvitation);
        showSection("inviteSection");
        showSection("saveSection");
    } catch (e) { showDashboardToast("Network error.", "error"); } finally { hideLoader(); btn.disabled = false; }
}

async function generateBudgetPlan() {
    if (!state.eventDetails) return;
    showLoader("Optimizing budget structures...");
    const btn = document.getElementById("generateBudgetBtn");
    btn.disabled = true;
    try {
        const response = await fetch("/api/ai/budget-optimizer", {
            method:  "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${state.token}` },
            body: JSON.stringify({ ...state.eventDetails, venue: state.selectedVenue, caterer: state.selectedCaterer })
        });
        const data = await response.json();
        if (!data.success) { showDashboardToast(data.message || "Failed.", "error"); return; }
        state.aiBudgetPlan = data.aiBudgetPlan;
        document.getElementById("budgetResult").innerHTML = renderMarkdown(data.aiBudgetPlan);
        showSection("budgetSection");
        showSection("saveSection");
    } catch (e) { showDashboardToast("Network error.", "error"); } finally { hideLoader(); btn.disabled = false; }
}


// ==============================================
// DOWNLOAD INVITATION TO PDF (Fixed Node Extraction Loop)
// ==============================================
function downloadInvitationPDF() {
    if (!state.aiInvitation) {
        showDashboardToast("Please generate the AI Invitation templates first.", "info");
        return;
    }

    const scope = document.getElementById("downloadScopeSelect").value;
    let contentHtml = "";
    const fullContainer = document.getElementById("inviteResult");

    if (scope === "all") {
        contentHtml = fullContainer.innerHTML;
    } else {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = fullContainer.innerHTML;
        
        const headings = tempDiv.querySelectorAll("h3, h4");
        let targetHeading = null;

        headings.forEach(h => {
            const text = h.textContent.toLowerCase();
            if (scope === "formal" && text.includes("formal")) targetHeading = h;
            if (scope === "casual" && (text.includes("casual") || text.includes("whatsapp"))) targetHeading = h;
            if (scope === "email" && text.includes("email")) targetHeading = h;
        });

        if (targetHeading) {
            // Append target title heading
            contentHtml += targetHeading.outerHTML;
            
            // Fixed extraction: reads text fragments, lines, and breaks seamlessly
            let current = targetHeading.nextSibling;
            while (current) {
                if (current.nodeType === 1 && (current.tagName === "H3" || current.tagName === "H4")) {
                    break; 
                }
                if (current.nodeType === 1) {
                    contentHtml += current.outerHTML; 
                } else if (current.nodeType === 3) {
                    contentHtml += current.textContent; 
                }
                current = current.nextSibling;
            }
        } else {
            contentHtml = fullContainer.innerHTML;
        }
    }

    contentHtml = contentHtml.replace(/(<br\s*\/?>\s*){2,}/gi, '<br/>');

    const printWindow = window.open('', '_blank', 'width=850,height=900');
    printWindow.document.write(`
        <html>
        <head>
            <title>Event Invitation — Eventify</title>
            <style>
                html, body, p, div, h3, h4, strong, li, span, ul {
                    color: #111827 !important;
                    background-color: #ffffff !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                }
                body {
                    font-family: 'Poppins', sans-serif !important;
                    padding: 40px !important;
                    margin: 0 !important;
                    background: #ffffff !important;
                }
                .invitation-container {
                    border: 3px solid #7c3aed !important;
                    border-radius: 14px !important;
                    padding: 35px !important;
                    max-width: 650px !important;
                    margin: 0 auto !important;
                    background: #ffffff !important;
                }
                h3 { color: #7c3aed !important; font-size: 1.35rem !important; margin-top: 10px !important; margin-bottom: 12px !important; border-bottom: 2px solid #e9d5ff !important; padding-bottom: 6px !important; font-weight: 700 !important;}
                h4 { color: #2563eb !important; font-size: 1.15rem !important; margin-top: 15px !important; margin-bottom: 8px !important; font-weight: 600 !important;}
                strong { color: #000000 !important; font-weight: 700 !important; }
                br { display: block !important; margin-bottom: 6px !important; }
                ul { padding-left: 20px !important; margin-top: 6px !important; }
                li { margin-bottom: 4px !important; }
                .footer-brand {
                    text-align: center !important;
                    margin-top: 40px !important;
                    font-size: 0.85rem !important;
                    color: #6b7280 !important;
                }
                @media print {
                    body { padding: 0 !important; }
                    .invitation-container { border-color: #7c3aed !important; page-break-inside: avoid !important; }
                }
            </style>
        </head>
        <body>
            <div class="invitation-container">
                ${contentHtml}
            </div>
            <div class="footer-brand">Generated via Eventify AI Planner</div>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        window.close();
                    }, 350);
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

async function savePlan() {
    if (!state.aiEventPlan) { showDashboardToast("Generate an Event Plan first.", "info"); return; }
    const btn = document.getElementById("savePlanBtn");
    btn.disabled  = true;
    btn.innerHTML = `<span class="spinner show"></span> Saving...`;
    try {
        const response = await fetch("/api/saved-events", {
            method:  "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${state.token}` },
            body: JSON.stringify({
                eventType: state.eventDetails.eventType, city: state.eventDetails.city, budget: state.eventDetails.budget,
                guestCount: state.eventDetails.guestCount, eventDate: state.eventDetails.eventDate, specialRequirements: state.eventDetails.specialRequirements,
                recommendedVenue: state.selectedVenue ? state.selectedVenue.venue_name : "", recommendedCaterer: state.selectedCaterer ? state.selectedCaterer.caterer_name : "",
                aiEventPlan: state.aiEventPlan, aiRiskAnalysis: state.aiRiskAnalysis, aiInvitation: state.aiInvitation, aiBudgetPlan: state.aiBudgetPlan
            })
        });
        const data = await response.json();
        if (!data.success) { showDashboardToast("Failed to save.", "error"); return; }
        showDashboardToast("Saved successfully!", "success");
        btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Saved!`;
        setTimeout(() => { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-bookmark"></i> Save This Plan`; }, 3000);
    } catch (e) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-bookmark"></i> Save This Plan`; }
}