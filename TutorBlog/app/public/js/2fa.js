async function verify2FA() {
    const token = document.getElementById('token').value;
    const msg = document.getElementById('msg');

    msg.innerText = "";

    if (token.length !== 6) {
        msg.innerText = "Code must be 6 digits";
        return;
    }

    try {
        const response = await fetch('/verify-2fa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });

        const text = await response.text();

        if (response.ok) {
            msg.style.color = "green";
            msg.innerText = "Success! Redirecting...";

            setTimeout(() => {
                window.location.href = '/html/index.html';
            }, 1000);
        } else {
            msg.style.color = "red";
            msg.innerText = text;
        }

    } catch (err) {
        msg.innerText = "Server error. Try again.";
    }
}