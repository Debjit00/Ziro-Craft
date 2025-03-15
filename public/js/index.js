// DOM elements
const userProfileContainer = document.getElementById('user-profile-container');
const userNameElement = document.getElementById('user-name');
const profileIcon = document.getElementById('profile-icon');
const profileDropdown = document.getElementById('profile-dropdown');
const logoutBtn = document.getElementById('logout-btn');
const loginContainer = document.getElementById('login-container');

// Check if user is logged in when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if user info exists in localStorage
    const userName = localStorage.getItem('userName');
    if (userName) {
        showLoggedInUI({ name: userName });
    } else {
        showLoginUI();
    }
});

// Function to display logged-in user interface
function showLoggedInUI(user) {
    // Hide login form
    loginContainer.style.display = 'none';
    
    // Show user profile elements
    userProfileContainer.style.display = 'block';
    userNameElement.textContent = user.name;
    
    // Create initials for profile icon
    const initials = user.name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase();
    profileIcon.textContent = initials;
    
    // Setup dropdown toggle
    setupProfileDropdown();
}

// Function to display login UI
function showLoginUI() {
    loginContainer.style.display = 'block';
    userProfileContainer.style.display = 'none';
}

// Toggle profile dropdown when clicking on profile icon
function setupProfileDropdown() {
    profileIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        profileDropdown.classList.remove('active');
    });
    
    // Setup logout functionality
    logoutBtn.addEventListener('click', logout);
}

// Login function
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Validate inputs
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            // Store user name in localStorage
            localStorage.setItem('userName', data.userName);
            showLoggedInUI({ name: data.userName });
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    }
}

// Logout function
async function logout(e) {
    e.preventDefault();
    
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            // Clear user data from localStorage
            localStorage.removeItem('userName');
            showLoginUI();
        } else {
            console.error('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Make login function available globally for the onclick in HTML
window.login = login;