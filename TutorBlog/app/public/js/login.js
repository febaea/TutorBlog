

loginForm.onsubmit = async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username_input: username,
            password_input: password
        })
    });

    const result = await response.text();

    alert(result);

    if (result === "Logged in") {
        window.location.href = '../html/index.html';
    }

    if (result === "Enter 2FA code") {
        window.location.href = '../html/2fa.html';
    }
};

// loginForm.onsubmit = async (e) => {
//     e.preventDefault();

//     const username = document.getElementById('username').value;
//     const password = document.getElementById('password').value;

   

//     const response = await fetch('/', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             username_input: username,
//             password_input: password
//         })
//     });

//     const result = await response.json();

//     console.log("LOGIN INPUT:", username, password);
//     console.log("DB RESULT:", result.rows);

//     if (result.requires2FA) {
//         window.location.href = '/html/2fa.html';
//     } else if (result.success) {
//         window.location.href = '../html/index.html';
//     } else{
//         alert('Invalid login')
//     }

// };







// document.addEventListener('DOMContentLoaded', () => {
//     let selectedRole = 'student';
    
//     // Role selector buttons
//     const roleBtns = document.querySelectorAll('.role-btn');
//     roleBtns.forEach(btn => {
//         btn.onclick = () => {
//             roleBtns.forEach(b => b.classList.remove('active'));
//             btn.classList.add('active');
//             // Style the active button
//             roleBtns.forEach(b => {
//                 b.style.backgroundColor = '';
//                 b.style.color = '';
//             });
//             btn.style.backgroundColor = '#f2875c';
//             btn.style.color = 'white';
//             selectedRole = btn.dataset.role;
//         };
//     });
    
//     // Set initial active style
//     if (roleBtns[0]) {
//         roleBtns[0].style.backgroundColor = '#f2875c';
//         roleBtns[0].style.color = 'white';
//     }
    
//     // Login form submission
//     const loginForm = document.getElementById('loginForm');
//     loginForm.onsubmit = (e) => {
//         e.preventDefault();
        
//         const username = document.getElementById('username').value;
//         const password = document.getElementById('password').value;
        
//         // Demo authentication
//         if (selectedRole === 'student' && username === 'student1' && password === 'password123') {
//             const userData = {
//                 loggedIn: true,
//                 username: username,
//                 role: 'student',
//                 userId: 1
//             };
//             localStorage.setItem('currentUser', JSON.stringify(userData));
//             alert('Login successful! Redirecting to homepage...');
//             window.location.href = '../html/index.html';
//         } 
//         else if (selectedRole === 'tutor' && username === 'johndoe' && password === 'tutor123') {
//             const userData = {
//                 loggedIn: true,
//                 username: username,
//                 role: 'tutor',
//                 userId: 1,
//                 tutorId: 1
//             };
//             localStorage.setItem('currentUser', JSON.stringify(userData));
//             alert('Login successful! Redirecting to homepage...');
//             window.location.href = '../html/index.html';
//         }
//         else {
//             alert('Invalid credentials! Use demo credentials:\n\nStudent: student1 / password123\nTutor: johndoe / tutor123');
//         }
//     };
// });