

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

    const result = await response.json();
    console.log(result)

    if (result.success) {
        window.location.href = '/dashboard';
    } else if (result.twofa){
        window.location.href = '../html/2fa.html';
    }else if (result.setup2fa) {
        window.location.href = '../html/setup2fa.html';
    } else{
        alert("The username and/or password are incorrect. Please try again.")
    }


};


