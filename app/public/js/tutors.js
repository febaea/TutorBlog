let tutors = [];
import { htmlEscape } from "./htmlEscape.js";
async function loadTutors() {
  // Demo data
  try {
    // const tutorsResponse = await fetch("../json/tutors.json");
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
  displayAllTutors();
}

function displayAllTutors() {
  const container = document.getElementById("allTutorsList");
  if (!container) return;

  container.innerHTML = "";
  tutors.forEach((tutor) => {
    const card = document.createElement("div");
    card.className = "post";
    card.style.padding = "20px";
    card.style.margin = "15px";
    card.style.cursor = "pointer";
    card.onclick = () => viewTutorProfile(tutor.id);

    card.innerHTML = `
            <h3 style="color: #f56d36;">${htmlEscape(tutor.first_name + " " + tutor.last_name)}</h3>
            <div style="display: inline-block; background-color: #f56d36; color: white; padding: 5px 10px; border-radius: 5px; margin: 5px 0;">
                ${htmlEscape(tutor.subject)}
            </div>
            <div style="margin: 10px 0;"> ${htmlEscape(tutor.rating)} / 5.0</div>
            <p>${htmlEscape(tutor.achievements[0])}</p>
            <button class="link_btn" style="margin: 10px 0 0 0;">View Profile →</button>
        `;

    container.appendChild(card);
  });
}

function viewTutorProfile(tutorId) {
  localStorage.setItem("viewTutorId", tutorId);
  window.location.href = "../html/tutor_profile.html";
}

document.addEventListener("DOMContentLoaded", loadTutors);
