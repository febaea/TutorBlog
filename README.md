How to register:
- Input details
- Input verification code from email
- Login using same credetntials 
- Scan QR Code to set up 2fa 
- To view posts functionality (for tutor) press my posts on navigation for tutor login 
- To view my bookings functionality - press my boookling link in navigation for student login 


---- Database ----

npm install dotenv

create .env folder in TutorBlog and use .env.example as a template
change password to postgres master password

run app

go to http://localhost:3000/db-test
should see something like: 
{
  "success": true,
  "time": {
    "now": "2026-05-08T..."
  }
}

copy code from schema and data .sql in query tool

