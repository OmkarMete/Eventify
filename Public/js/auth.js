// ==============================================
// public/js/auth.js
// Purpose: Handle user authentication on index.html
// - Open / close / switch modals
// - Register new user
// - Login existing user
// - Store JWT token in localStorage
// - Redirect to dashboard on success
// ==============================================


// ==============================================
// ON PAGE LOAD
// If user is already logged in, redirect
// straight to dashboard — no need to login again
// ==============================================

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (token) {
        window.location.href = "/dashboard.html";
        return;
    }

    // Attach form submit listeners
    document.getElementById("loginForm")
        .addEventListener("submit", handleLogin);

    document.getElementById("registerForm")
        .addEventListener("submit", handleRegister);
});


// ==============================================
// MODAL CONTROLS
// ==============================================

// Open a modal by ID
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden"; // Prevent background scroll
    }
}

// Close a modal by ID
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
        clearToast(modalId === "loginModal" ? "loginToast" : "registerToast");
    }
}

// Switch between login and register modals
function switchModal(fromId, toId) {
    closeModal(fromId);
    setTimeout(() => openModal(toId), 150); // Small delay for smooth transition
}

// Close modal when clicking outside the modal box
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
        const overlays = document.querySelectorAll(".modal-overlay.active");
        overlays.forEach(overlay => {
            overlay.classList.remove("active");
            document.body.style.overflow = "";
        });
    }
});

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        const overlays = document.querySelectorAll(".modal-overlay.active");
        overlays.forEach(overlay => {
            overlay.classList.remove("active");
            document.body.style.overflow = "";
        });
    }
});


// ==============================================
// TOAST NOTIFICATIONS
// ==============================================

// Show a toast message inside a modal
// type: "success" | "error" | "info"
function showToast(toastId, message, type = "error") {
    const toast = document.getElementById(toastId);
    if (!toast) return;

    // Set icon based on type
    const icons = {
        success: "fa-circle-check",
        error:   "fa-circle-exclamation",
        info:    "fa-circle-info"
    };

    toast.innerHTML  = `<i class="fa-solid ${icons[type] || icons.error}"></i> ${message}`;
    toast.className  = `toast ${type} show`;
}

// Hide a toast message
function clearToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.className = "toast";
        toast.innerHTML = "";
    }
}


// ==============================================
// BUTTON LOADING STATE
// Disables button and shows spinner while
// API request is in progress
// ==============================================

function setButtonLoading(btnId, loading, originalText) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    if (loading) {
        btn.disabled   = true;
        btn.innerHTML  = `<span class="spinner show"></span> Please wait...`;
    } else {
        btn.disabled   = false;
        btn.innerHTML  = originalText;
    }
}


// ==============================================
// HANDLE REGISTER
// POST /api/auth/register
// ==============================================

async function handleRegister(e) {
    e.preventDefault(); // Prevent page refresh

    const name     = document.getElementById("registerName").value.trim();
    const email    = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const toastId  = "registerToast";

    // ------------------------------------------
    // Client-side validation
    // ------------------------------------------

    if (!name || !email || !password) {
        showToast(toastId, "All fields are required.", "error");
        return;
    }

    if (password.length < 6) {
        showToast(toastId, "Password must be at least 6 characters.", "error");
        return;
    }

    // ------------------------------------------
    // Set loading state
    // ------------------------------------------

    setButtonLoading("registerBtn", true);
    clearToast(toastId);

    try {
        // ------------------------------------------
        // API call to register endpoint
        // ------------------------------------------

        const response = await fetch("/api/auth/register", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Show success message then switch to login
            showToast(toastId, "Account created! Please log in.", "success");

            // Clear the form
            document.getElementById("registerForm").reset();

            // Switch to login modal after short delay
            setTimeout(() => {
                switchModal("registerModal", "loginModal");
            }, 1500);

        } else {
            showToast(toastId, data.message || "Registration failed.", "error");
        }

    } catch (error) {
        console.error("Register Error:", error);
        showToast(toastId, "Network error. Please try again.", "error");
    } finally {
        // Always restore button state
        setButtonLoading("registerBtn", false,
            `<i class="fa-solid fa-user-plus"></i> Create Account`);
    }
}


// ==============================================
// HANDLE LOGIN
// POST /api/auth/login
// ==============================================

async function handleLogin(e) {
    e.preventDefault(); // Prevent page refresh

    const email    = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const toastId  = "loginToast";

    // ------------------------------------------
    // Client-side validation
    // ------------------------------------------

    if (!email || !password) {
        showToast(toastId, "Both email and password are required.", "error");
        return;
    }

    // ------------------------------------------
    // Set loading state
    // ------------------------------------------

    setButtonLoading("loginBtn", true);
    clearToast(toastId);

    try {
        // ------------------------------------------
        // API call to login endpoint
        // ------------------------------------------

        const response = await fetch("/api/auth/login", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // ------------------------------------------
            // Store token and user info in localStorage
            // ------------------------------------------

            localStorage.setItem("token", data.token);
            localStorage.setItem("user",  JSON.stringify(data.user));

            showToast(toastId, "Login successful! Redirecting...", "success");

            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = "/dashboard.html";
            }, 800);

        } else {
            showToast(toastId, data.message || "Login failed.", "error");
        }

    } catch (error) {
        console.error("Login Error:", error);
        showToast(toastId, "Network error. Please try again.", "error");
    } finally {
        // Always restore button state
        setButtonLoading("loginBtn", false,
            `<i class="fa-solid fa-right-to-bracket"></i> Login`);
    }
}
