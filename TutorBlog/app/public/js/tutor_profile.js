let currentTutor = null;
let currentUser = null;
let bookings = [];
import { htmlEscape } from "./htmlEscape.js";
// Load tutor data
async function loadTutorProfile() {
  const tutorId = localStorage.getItem("viewTutorId");
  const userData = localStorage.getItem("currentUser");

  if (userData) {
    currentUser = JSON.parse(userData);
    updateUIForUser();
  }

  // Load bookings
  const savedBookings = localStorage.getItem("bookings");
  if (savedBookings) {
    bookings = JSON.parse(savedBookings);
  } else {
    bookings = [];
  }

  // Demo tutor data
  const tutors = {
    1: {
      id: 1,
      name: "Dr. John Doe",
      subject: "Mathematics",
      rating: 4.8,
      achievements: [
        "Helped 50+ students achieve A* grades in GCSE Mathematics",
        "Success rate of 95% in exam preparation",
        "Featured as 'Top Tutor of the Year' 2023",
        "Published mathematics research papers",
      ],
      qualifications: [
        "PhD in Mathematics from Oxford University",
        "PGCE in Secondary Education",
        "10+ years of teaching experience",
        "Exam board examiner for A-Level Mathematics",
        "Mathematics Olympiad coach",
      ],
      availability: [
        "2024-03-25 10:00",
        "2024-03-25 14:00",
        "2024-03-26 11:00",
        "2024-03-26 15:00",
        "2024-03-27 09:00",
        "2024-03-27 13:00",
        "2024-03-28 10:00",
        "2024-03-28 16:00",
      ],
    },
    2: {
      id: 2,
      name: "Prof. Jane Smith",
      subject: "Physics",
      rating: 4.9,
      achievements: [
        "Students improved by 30% average within 3 months",
        "Published research in quantum physics",
        "Physics Olympiad gold medalist coach",
        "University lecturer at Imperial College",
      ],
      qualifications: [
        "MSc in Physics from Cambridge University",
        "PhD in Quantum Mechanics",
        "5 years tutoring experience",
        "Physics curriculum developer",
        "Research fellow at CERN",
      ],
      availability: [
        "2024-03-25 09:00",
        "2024-03-25 13:00",
        "2024-03-26 10:00",
        "2024-03-26 14:00",
        "2024-03-27 11:00",
        "2024-03-28 09:00",
      ],
    },
    3: {
      id: 3,
      name: "Mr. Alan Turing",
      subject: "Computer Science",
      rating: 4.7,
      achievements: [
        "Helped 30+ students get into top universities",
        "Created coding bootcamp with 1000+ students",
        "AI and Machine Learning specialist",
        " National Coding Competition winner (mentor)",
      ],
      qualifications: [
        "MSc in Computer Science",
        "Full-stack developer at Google",
        "5 years tutoring experience",
        "Python certification instructor",
        "Game development expert",
      ],
      availability: [
        "2024-03-26 15:00",
        "2024-03-27 10:00",
        "2024-03-27 14:00",
        "2024-03-28 11:00",
        "2024-03-28 15:00",
      ],
    },
  };

  currentTutor = tutors[tutorId] || tutors[1];
  displayTutorProfile();
}

// Display tutor profile
function displayTutorProfile() {
  const container = document.getElementById("tutorProfileContent");
  if (!container) return;

  container.innerHTML = `
        <section style="text-align: left;">
            <h2 style="color: #f56d36;">${htmlEscape(currentTutor.name)}</h2>
            <div style="display: inline-block; background-color: #f56d36; color: white; padding: 5px 15px; border-radius: 5px; margin: 10px 0;">
                ${htmlEscape(currentTutor.subject)}
            </div>
            <div style="margin: 10px 0; font-size: 20px;"> ${htmlEscape(currentTutor.rating)} / 5.0</div>
            
            <h3 style="margin-top: 25px; color: #f56d36;"> Achievements</h3>
            <ul style="margin: 10px 0 10px 20px;">
                ${currentTutor.achievements.map((a) => `<li style="margin: 5px 0;">${htmlEscape(a)}</li>`).join("")}
            </ul>
            
            <h3 style="margin-top: 25px; color: #f56d36;"> Qualifications</h3>
            <ul style="margin: 10px 0 10px 20px;">
                ${currentTutor.qualifications.map((q) => `<li style="margin: 5px 0;">${htmlEscape(q)}</li>`).join("")}
            </ul>
            
            <h3 style="margin-top: 25px; color: #f56d36;">Bookable Timetable</h3>
            <div id="timetable" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin: 20px 0;"></div>
        </section>
    `;

  displayTimetable();
}

// Display bookable timetable
function displayTimetable() {
  const timetableContainer = document.getElementById("timetable");
  if (!timetableContainer) return;

  timetableContainer.innerHTML = "";

  currentTutor.availability.forEach((slot) => {
    const isBooked = bookings.some(
      (b) => b.tutorId == currentTutor.id && b.timeSlot === slot,
    );

    const slotElement = document.createElement("div");
    slotElement.className = "post";
    slotElement.style.padding = "15px";
    slotElement.style.margin = "5px";
    slotElement.style.cursor = isBooked ? "not-allowed" : "pointer";
    slotElement.style.backgroundColor = isBooked ? "#f0f0f0" : "white";

    const date = new Date(slot);
    const formattedDate = date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    slotElement.innerHTML = `
            <div style="font-weight: bold;">${formattedDate}</div>
            <div style="font-size: 12px; margin-top: 5px;">${isBooked ? "Booked" : " Available"}</div>
        `;

    if (!isBooked && currentUser && currentUser.role === "student") {
      slotElement.onclick = () => openBookingModal(slot);
    } else if (!currentUser) {
      slotElement.onclick = () => alert("Please login to book a session!");
    } else if (isBooked) {
      slotElement.style.opacity = "0.6";
    }

    timetableContainer.appendChild(slotElement);
  });
}

// Open booking modal
function openBookingModal(timeSlot) {
  if (!currentUser) {
    alert("Please login to book a session!");
    window.location.href = "../html/login.html";
    return;
  }

  const modal = document.getElementById("bookingModal");
  const bookingDetails = document.getElementById("bookingDetails");
  const confirmBtn = document.getElementById("confirmBookingBtn");

  const date = new Date(timeSlot);
  const formattedDate = date.toLocaleString();

  bookingDetails.innerHTML = `
        <strong>Tutor:</strong> ${htmlEscape(currentTutor.name)}<br>
        <strong>Subject:</strong> ${htmlEscape(currentTutor.subject)}<br>
        <strong>Date & Time:</strong> ${htmlEscape(formattedDate)}<br>
        <strong>Duration:</strong> 1 hour<br>
        <strong>Price:</strong> Free (Demo Session)
    `;

  modal.style.display = "block";

  confirmBtn.onclick = () => {
    const booking = {
      id: Date.now(),
      tutorId: currentTutor.id,
      tutorName: currentTutor.name,
      subject: currentTutor.subject,
      studentName: currentUser.username,
      timeSlot: timeSlot,
      bookingDate: new Date().toISOString(),
      status: "confirmed",
    };

    bookings.push(booking);
    localStorage.setItem("bookings", JSON.stringify(bookings));

    alert(' Booking confirmed! Check "My Bookings" page.');
    modal.style.display = "none";
    displayTimetable(); // Refresh timetable
  };

  // Close modal
  const closeBtn = document.querySelector(".close");
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = "none";
    };
  }

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}

// Update UI based on login status
function updateUIForUser() {
  const loginLink = document.getElementById("login_link");
  const logoutBtn = document.getElementById("logout_btn");
  const myBookingsNav = document.getElementById("myBookingsNav");

  if (currentUser) {
    if (loginLink)
      loginLink.innerHTML = `${currentUser.username} <i class="fa fa-caret-down"></i>`;
    if (logoutBtn) logoutBtn.style.display = "block";
    if (myBookingsNav && currentUser.role === "student")
      myBookingsNav.style.display = "block";
  } else {
    if (loginLink)
      loginLink.innerHTML = 'Account <i class="fa fa-caret-down"></i>';
    if (logoutBtn) logoutBtn.style.display = "none";
    if (myBookingsNav) myBookingsNav.style.display = "none";
  }

  // Setup logout
  if (logoutBtn) {
    logoutBtn.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem("currentUser");
      window.location.href = "../html/index.html";
    };
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", loadTutorProfile);
