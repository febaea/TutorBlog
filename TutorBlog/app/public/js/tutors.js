let tutors = [];

async function loadTutors() {
    // Demo data
    tutors = [
        {
            id: 1,
            name: "Dr. John Doe",
            subject: "Mathematics",
            rating: 4.8,
            achievements: ["Helped 50+ students achieve A* grades", "Mathematics Olympiad winner"],
            qualifications: ["PhD in Mathematics", "10 years experience"]
        },
        {
            id: 2,
            name: "Prof. Jane Smith",
            subject: "Physics",
            rating: 4.9,
            achievements: ["Students improved by 30% average", "Published research"],
            qualifications: ["MSc in Physics", "5 years experience"]
        },
        {
            id: 3,
            name: "Mr. Alan Turing",
            subject: "Computer Science",
            rating: 4.7,
            achievements: ["Helped 30+ students get into top universities"],
            qualifications: ["MSc in Computer Science", "5 years experience"]
        }
    ];
    
    displayAllTutors();
}

function displayAllTutors() {
    const container = document.getElementById('allTutorsList');
    if (!container) return;
    
    container.innerHTML = '';
    tutors.forEach(tutor => {
        const card = document.createElement('div');
        card.className = 'post';
        card.style.padding = '20px';
        card.style.margin = '15px';
        card.style.cursor = 'pointer';
        card.onclick = () => viewTutorProfile(tutor.id);
        
        card.innerHTML = `
            <h3 style="color: #f56d36;">${tutor.name}</h3>
            <div style="display: inline-block; background-color: #f56d36; color: white; padding: 5px 10px; border-radius: 5px; margin: 5px 0;">
                ${tutor.subject}
            </div>
            <div style="margin: 10px 0;"> ${tutor.rating} / 5.0</div>
            <p>${tutor.achievements[0]}</p>
            <button class="link_btn" style="margin: 10px 0 0 0;">View Profile →</button>
        `;
        
        container.appendChild(card);
    });
}

function viewTutorProfile(tutorId) {
    localStorage.setItem('viewTutorId', tutorId);
    window.location.href = '../html/tutor_profile.html';
}

document.addEventListener('DOMContentLoaded', loadTutors);