document.addEventListener('DOMContentLoaded', () => {
    let selectedRole = 'student';
    
    // Role selector buttons
    const roleBtns = document.querySelectorAll('.role-btn');
    roleBtns.forEach(btn => {
        btn.onclick = () => {
            roleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Style the active button
            roleBtns.forEach(b => {
                b.style.backgroundColor = '';
                b.style.color = '';
            });
            btn.style.backgroundColor = '#f2875c';
            btn.style.color = 'white';
            selectedRole = btn.dataset.role;
        };
    });
    
    // Set initial active style
    if (roleBtns[0]) {
        roleBtns[0].style.backgroundColor = '#f2875c';
        roleBtns[0].style.color = 'white';
    }
    
const loginForm = document.getElementById('loginForm');
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Disable button and show loading
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;
        
        try {
            // Send to real backend
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    email: email,
                    password: password
                })
            });
            
            const result = await response.text();
            
            // Check if redirected (successful login)
            if (response.redirected) {
                // Store user info
                localStorage.setItem('currentUser', JSON.stringify({
                    loggedIn: true,
                    email: email,
                    role: selectedRole
                }));
                window.location.href = response.url;
            } 
            // Check if we got the verification page
            else if (result.includes('verification') || result.includes('verify')) {
                // Replace page with verification form
                document.body.innerHTML = result;
                attachVerificationHandler();
            } 
            else {
                // Show error message
                alert('Login failed: ' + result.replace(/<[^>]*>/g, '').substring(0, 200));
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please make sure the server is running.');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    };
});
