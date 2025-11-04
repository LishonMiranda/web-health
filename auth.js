import { firebaseConfig } from './firebase-config.js';

// --- Firebase Initialization ---
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// --- DOM Element References ---
// Main structure
const appWrapper = document.getElementById('app-wrapper');
const userInfo = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');
const logoutBtn = document.getElementById('logout-btn');
const themeToggleBtn = document.getElementById('theme-toggle');

// Page Sections
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const loginNav = document.querySelector('[data-target="auth"]');
const dashboardNav = document.querySelector('[data-target="dashboard"]');

// Auth Form (Unified)
const authForm = document.getElementById('auth-form');
const usernameRow = document.getElementById('username-row');
const usernameInput = document.getElementById('username-input');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authModeToggle = document.getElementById('auth-mode-toggle');

// --- Initial App State ---
document.addEventListener('DOMContentLoaded', () => {
    // Hide the app wrapper initially, the CSS animation will fade it in
    appWrapper.style.opacity = '0';

    // Theme init: default light, apply saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('theme-dark');
    } else {
        document.body.classList.remove('theme-dark');
    }

    // Set theme icon based on current theme
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
        icon.textContent = document.body.classList.contains('theme-dark') ? '☀️' : '🌙';
    }
});

// --- Page Navigation ---
function showPage(targetId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
    });
    const targetPage = document.getElementById(targetId + '-section');
    if(targetPage) {
        targetPage.style.display = 'block';
    }
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Prevent interaction if user is not logged in and clicks something other than auth
        if (!auth.currentUser && item.dataset.target !== 'auth') {
            return;
        }

        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        showPage(item.dataset.target);
    });
});

// --- Auth Mode Toggle Logic ---
let authMode = 'login'; // 'login' | 'signup'

function updateAuthMode() {
    const isSignup = authMode === 'signup';
    usernameRow.style.display = isSignup ? 'block' : 'none';
    authSubmitBtn.textContent = isSignup ? 'Sign Up' : 'Login';
    authModeToggle.textContent = isSignup ? 'Already have an account? Login' : 'New here? Sign up';
    authModeToggle.setAttribute('aria-label', isSignup ? 'Switch to login' : 'Switch to sign up');
}

authModeToggle.addEventListener('click', () => {
    authMode = authMode === 'login' ? 'signup' : 'login';
    updateAuthMode();
});


// --- Authentication Logic ---
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = (emailInput.value || '').trim();
    const localPart = (email.split('@')[0] || '').trim();
    if (authMode === 'login') {
        let password = (passwordInput.value || '').trim();
        if (!password) password = localPart; // default to local-part if empty
        if (!email || !password) return alert('Please enter email and password.');
        auth.signInWithEmailAndPassword(email, password)
            .catch(err => alert(`Login failed: ${err.message}`));
    } else {
        const username = (usernameInput.value || '').trim();
        if (!email || !username) return alert('Please enter username and email.');
        const password = localPart; // enforce password logic on signup
        auth.createUserWithEmailAndPassword(email, password)
            .then(cred => cred.user.updateProfile({ displayName: username }))
            .catch(err => alert(`Sign-up failed: ${err.message}`));
    }
});



logoutBtn.addEventListener('click', () => auth.signOut());

// Theme toggle logic
themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('theme-dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
        icon.textContent = isDark ? '☀️' : '🌙';
    }
});


// --- Auth State Observer (UI Controller) ---

auth.onAuthStateChanged(user => {
    if (user) {
        // User is LOGGED IN
        userInfo.style.display = 'flex';
        usernameDisplay.textContent = user.displayName || 'User';
        
        dashboardNav.classList.add('active');
        loginNav.classList.remove('active');
        loginNav.style.display = 'none'; // Hide login nav item

        showPage('dashboard');

    } else {
        // User is LOGGED OUT
        userInfo.style.display = 'none';
        usernameDisplay.textContent = '';

        loginNav.classList.add('active');
        dashboardNav.classList.remove('active');
        loginNav.style.display = 'flex'; // Show login nav item

        showPage('auth');

        // Reset form
        authForm.reset();
        authMode = 'login';
        updateAuthMode();
    }
});
