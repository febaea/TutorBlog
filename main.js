// Check login status on all pages
function checkLoginStatus() {
    const userData = localStorage.getItem('currentUser');
    const loginLink = document.getElementById('login_link');
    const logoutBtn = document.getElementById('logout_btn');
    const myBookingsNav = document.getElementById('myBookingsNav');
    
    if (userData) {
        const user = JSON.parse(userData);
        if (loginLink) loginLink.innerHTML = `${user.username} <i class="fa fa-caret-down"></i>`;
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (myBookingsNav && user.role === 'student') myBookingsNav.style.display = 'block';
        
        // Hide login button if it exists
        const loginBtn = document.getElementById('login_btn');
        if (loginBtn) loginBtn.style.display = 'none';
    } else {
        if (loginLink) loginLink.innerHTML = 'Account <i class="fa fa-caret-down"></i>';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (myBookingsNav) myBookingsNav.style.display = 'none';
    }
    
    // Setup logout
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            window.location.reload();
        };
    }
}

document.addEventListener('DOMContentLoaded', checkLoginStatus);