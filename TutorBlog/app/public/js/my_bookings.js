let currentUser = null;
let bookings = [];

function loadBookings() {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        alert('Please login to view your bookings!');
        window.location.href = '../html/login.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    
    const savedBookings = localStorage.getItem('bookings');
    if (savedBookings) {
        bookings = JSON.parse(savedBookings);
        bookings = bookings.filter(b => b.studentName === currentUser.username);
    }
    
    displayBookings();
}

function displayBookings() {
    const container = document.getElementById('bookingsList');
    
    if (bookings.length === 0) {
        container.innerHTML = '<div class="post" style="padding: 30px; text-align: center;"> You have no bookings yet. <a href="../html/index.html" class="link_btn" style="display: inline-block; margin-top: 15px;">Browse Tutors</a></div>';
        return;
    }
    
    container.innerHTML = '';
    bookings.forEach(booking => {
        const date = new Date(booking.timeSlot);
        const bookingCard = document.createElement('div');
        bookingCard.className = 'post';
        bookingCard.style.padding = '20px';
        bookingCard.style.margin = '15px';
        bookingCard.style.textAlign = 'left';
        
        bookingCard.innerHTML = `
            <h3 style="color: #f56d36;">${booking.tutorName}</h3>
            <div style="display: inline-block; background-color: #f56d36; color: white; padding: 5px 10px; border-radius: 5px; margin: 5px 0;">
                ${booking.subject}
            </div>
            <p style="margin: 10px 0;"><strong>Date & Time:</strong> ${date.toLocaleString()}</p>
            <p><strong>Status:</strong> ${booking.status}</p>
            <p><strong>Booked on:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
            <button class="link_btn" onclick="cancelBooking(${booking.id})" style="margin-top: 15px;">Cancel Booking</button>
        `;
        
        container.appendChild(bookingCard);
    });
}

function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        bookings = bookings.filter(b => b.id !== bookingId);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        displayBookings();
        alert(' Booking cancelled successfully!');
    }
}

document.addEventListener('DOMContentLoaded', loadBookings);