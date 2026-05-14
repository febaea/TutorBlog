async function startSetup() {
    
    // Get userId from session
    const meRes = await fetch('/me');
    if (!meRes.ok){
        document.getElementById('msg').innerText = "Session expired, please log in again."
        return;
    }
    // const {userId} = await meRes.json();
    // console.log("userId from /me:", userId); 
    const meData = await meRes.json();
    console.log("me data:", meData);
    const userId = meData.userId;

   
   
    const res = await fetch(`/setup-2fa/${userId}`);
    const data = await res.json();


  
    document.getElementById('qrImage').src = data.qrCode;
    document.getElementById('qr-section').style.display = 'block';
  }
  
  async function confirmSetup() {
    const token = document.getElementById('token').value;
    const msg = document.getElementById('msg');
  
    const res = await fetch('/confirm-2fa-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
  
    // guard against non-JSON error responses
    const result = await res.json().catch(() => ({ message: "Server error" }));
    if (result.success) {
      msg.style.color = "green";
      msg.innerText = "2FA set up! Redirecting...";
      setTimeout(() => window.location.href = '/dashboard', 1000);
    } else {
      msg.style.color = "red";
      msg.innerText = result.message;
    }
  }