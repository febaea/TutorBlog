// Global variables
let currentUser = null;
let tutors = [];
let successStories = [];

// Load data from JSON files or use demo data
async function loadData() {
    try {
        const tutorsResponse = await fetch("../json/tutors.json");
        tutors = await tutorsResponse.json();
        
        const storiesResponse = await fetch("../json/success_stories.json");
        successStories = await storiesResponse.json();
        
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            currentUser = JSON.parse(userData);
        }
    } catch (error) {
        console.log("Using demo data...");
        // Demo data
        tutors = [
            {
                id: 1,
                name: "Dr. John Doe",
                subject: "Mathematics",
                rating: 4.8,
                achievements: ["Helped 50+ students achieve A* grades", "Mathematics Olympiad winner", "95% student success rate"],
                qualifications: ["PhD in Mathematics - Oxford University", "10 years teaching experience", "Exam board examiner"],
                availability: ["2024-03-25 10:00", "2024-03-25 14:00", "2024-03-26 11:00", "2024-03-26 15:00", "2024-03-27 09:00"]
            },
            {
                id: 2,
                name: "Prof. Jane Smith",
                subject: "Physics",
                rating: 4.9,
                achievements: ["Students improved by 30% average", "Published research in quantum physics", "University lecturer"],
                qualifications: ["MSc in Physics - Cambridge", "5 years tutoring experience", "Physics Olympiad coach"],
                availability: ["2024-03-25 09:00", "2024-03-25 13:00", "2024-03-26 10:00", "2024-03-26 14:00"]
            },
            {
                id: 3,
                name: "Mr. Alan Turing",
                subject: "Computer Science",
                rating: 4.7,
                achievements: ["Helped 30+ students get into top universities", "Coding bootcamp instructor"],
                qualifications: ["MSc in Computer Science", "Full-stack developer", "5 years tutoring experience"],
                availability: ["2024-03-26 15:00", "2024-03-27 10:00", "2024-03-27 14:00"]
            }
        ];
        
        successStories = [
            {
                id: 1,
                title: "Student Achieves Perfect Score!",
                content: "Dr. John helped Sarah improve from C to A* in just 3 months! She's now studying Mathematics at Cambridge.",
                tutor: "Dr. John Doe",
                student: "Sarah Johnson",
                date: "2024-03-15"
            },
            {
                id: 2,
                title: "University Admission Success",
                content: "Prof. Jane guided Michael to get accepted into Imperial College London for Physics!",
                tutor: "Prof. Jane Smith",
                student: "Michael Chen",
                date: "2024-03-10"
            },
            {
                id: 3,
                title: "Coding Competition Winner",
                content: "Alan's student won first place in the National Coding Competition!",
                tutor: "Mr. Alan Turing",
                student: "Emma Watson",
                date: "2024-03-05"
            }
        ];
    }
    
    displayFeaturedTutors();
    displaySuccessStories();
    updateUIForUser();
}

// Display featured tutors
function displayFeaturedTutors() {
    const featuredList = document.getElementById('featuredTutorsList');
    if (!featuredList) return;
    
    featuredList.innerHTML = '';
    tutors.slice(0, 3).forEach(tutor => {
        const tutorCard = createTutorCard(tutor);
        featuredList.appendChild(tutorCard);
    });
}

// Create tutor card 
function createTutorCard(tutor) {
    const card = document.createElement('div');
    card.className = 'post';
    card.style.cursor = 'pointer';
    card.style.padding = '20px';
    card.style.margin = '15px';
    card.onclick = () => viewTutorProfile(tutor.id);
    
    card.innerHTML = `
        <h3 style="color: #f56d36; margin-bottom: 10px;">${tutor.name}</h3>
        <div style="display: inline-block; background-color: #f56d36; color: white; padding: 5px 10px; border-radius: 5px; margin: 5px 0;">
            ${tutor.subject}
        </div>
        <div style="margin: 10px 0;"> ${tutor.rating} / 5.0</div>
        <p>${tutor.achievements ? tutor.achievements[0] : 'Experienced tutor'}</p>
        <button class="link_btn" style="margin: 10px 0 0 0;">View Profile →</button>
    `;
    
    return card;
}

// Display success stories
function displaySuccessStories() {
    const storiesList = document.getElementById('storiesList');
    if (!storiesList) return;
    
    storiesList.innerHTML = '';
    successStories.slice(-3).reverse().forEach(story => {
        const storyCard = document.createElement('div');
        storyCard.className = 'post';
        storyCard.style.padding = '20px';
        storyCard.style.margin = '15px';
        storyCard.style.textAlign = 'left';
        storyCard.innerHTML = `
            <h4 style="color: #f56d36; margin-bottom: 10px;">${story.title}</h4>
            <p>${story.content}</p>
            <div style="margin-top: 10px; font-weight: bold;">- ${story.tutor} with ${story.student}</div>
            <small style="color: #666;">${story.date}</small>
        `;
        storiesList.appendChild(storyCard);
    });
}

// Search functionality
function setupSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchBtn) return;
    
    function performSearch() {
        const query = searchInput.value.toLowerCase();
        const filteredTutors = tutors.filter(tutor => 
            tutor.subject.toLowerCase().includes(query) ||
            tutor.name.toLowerCase().includes(query) ||
            (tutor.qualifications && tutor.qualifications.some(q => q.toLowerCase().includes(query)))
        );
        
        if (filteredTutors.length > 0) {
            searchResults.innerHTML = '<h3 style="margin: 20px 0 10px 0;">Search Results:</h3>';
            filteredTutors.forEach(tutor => {
                searchResults.appendChild(createTutorCard(tutor));
            });
        } else {
            searchResults.innerHTML = '<p class="post" style="padding: 20px;">No tutors found for your search. Try another subject!</p>';
        }
    }
    
    searchBtn.onclick = performSearch;
    searchInput.onkeypress = (e) => {
        if (e.key === 'Enter') performSearch();
    };
}

// View tutor profile
function viewTutorProfile(tutorId) {
    localStorage.setItem('viewTutorId', tutorId);
    window.location.href = '../html/tutor_profile.html';
}

// Update UI based on login status
function updateUIForUser() {
    const loginBtn = document.getElementById('login_btn');
    const logoutBtn = document.getElementById('logout_btn');
    const loginLink = document.getElementById('login_link');
    const myBookingsNav = document.getElementById('myBookingsNav');
    
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (loginLink) loginLink.innerHTML = `${currentUser.username} <i class="fa fa-caret-down"></i>`;
        if (myBookingsNav && currentUser.role === 'student') myBookingsNav.style.display = 'block';
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (loginLink) loginLink.innerHTML = 'Account <i class="fa fa-caret-down"></i>';
        if (myBookingsNav) myBookingsNav.style.display = 'none';
    }
    
    // Setup logout
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            window.location.reload();
        };
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupSearch();
});