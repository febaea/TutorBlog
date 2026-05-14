let currentTutor = null;
let currentUser = null;
let bookings = [];
let tutors = [];

import { htmlEscape } from "./htmlEscape.js";
// Load tutor data
async function loadTutorProfile() {
  const tutorId = localStorage.getItem("viewTutorId");
  const userData = localStorage.getItem("currentUser");

  if (userData) {
    currentUser = JSON.parse(userData);
    updateUIForUser();
  }

  

  try {
   
    const tutorsResponse = await fetch("/tutors");
    tutors = await tutorsResponse.json();
  } catch (error) {
    console.log("Using demo data...");
    // Demo data
    tutors = [
      {
        id: 1,
        name: "Dr. John Doe",
        subject: "Mathematics",
        rating: 4.8,
        achievements: [
          "Helped 50+ students achieve A* grades",
          "Mathematics Olympiad winner",
          "95% student success rate",
        ],
        qualifications: [
          "PhD in Mathematics - Oxford University",
          "10 years teaching experience",
          "Exam board examiner",
        ],
        availability: [
          "2024-03-25 10:00",
          "2024-03-25 14:00",
          "2024-03-26 11:00",
          "2024-03-26 15:00",
          "2024-03-27 09:00",
        ],
      },
      {
        id: 2,
        name: "Prof. Jane Smith",
        subject: "Physics",
        rating: 4.9,
        achievements: [
          "Students improved by 30% average",
          "Published research in quantum physics",
          "University lecturer",
        ],
        qualifications: [
          "MSc in Physics - Cambridge",
          "5 years tutoring experience",
          "Physics Olympiad coach",
        ],
        availability: [
          "2024-03-25 09:00",
          "2024-03-25 13:00",
          "2024-03-26 10:00",
          "2024-03-26 14:00",
        ],
      },
      {
        id: 3,
        name: "Mr. Alan Turing",
        subject: "Computer Science",
        rating: 4.7,
        achievements: [
          "Helped 30+ students get into top universities",
          "Coding bootcamp instructor",
        ],
        qualifications: [
          "MSc in Computer Science",
          "Full-stack developer",
          "5 years tutoring experience",
        ],
        availability: [
          "2024-03-26 15:00",
          "2024-03-27 10:00",
          "2024-03-27 14:00",
        ],
      },
    ];
  }

  const selectedTutorId = localStorage.getItem("viewTutorId");
  currentTutor = tutors.find((t) => String(t.id) === selectedTutorId) || tutors[0];
  displayTutorProfile();
}

// Display tutor profile
function displayTutorProfile() {
  const tutorName = currentTutor.name || currentTutor.first_name + " " + currentTutor.last_name || 'Tutor';
  const container = document.getElementById("tutorProfileContent");
  if (!container) return;

  container.innerHTML = `
        <section style="text-align: left;">
            <h2 style="color: #f56d36;">${htmlEscape(tutorName)}</h2>
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
            
            <h3 style="margin-top: 25px; color: #f56d36;"> Contact Information</h3>
            <p style="margin: 10px 0;">Email: <a href="mailto:${htmlEscape(currentTutor.email)}">${htmlEscape(currentTutor.email)}</a></p>
            <div id="timetable" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin: 20px 0;"></div>
        </section>
    `;

  
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

// Initialise
document.addEventListener("DOMContentLoaded", loadTutorProfile);
