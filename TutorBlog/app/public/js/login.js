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
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    loginForm.onsubmit = (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Demo authentication
        if (selectedRole === 'student' && username === 'student1' && password === 'password123') {
            const userData = {
                loggedIn: true,
                username: username,
                role: 'student',
                userId: 1
            };
            localStorage.setItem('currentUser', JSON.stringify(userData));
            alert('Login successful! Redirecting to homepage...');
            window.location.href = '../html/index.html';
        } 
        else if (selectedRole === 'tutor' && username === 'johndoe' && password === 'tutor123') {
            const userData = {
                loggedIn: true,
                username: username,
                role: 'tutor',
                userId: 1,
                tutorId: 1
            };
            localStorage.setItem('currentUser', JSON.stringify(userData));
            alert('Login successful! Redirecting to homepage...');
            window.location.href = '../html/index.html';
        }
        else {
            alert('Invalid credentials! Use demo credentials:\n\nStudent: student1 / password123\nTutor: johndoe / tutor123');
        }
    };
});