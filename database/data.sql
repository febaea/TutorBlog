INSERT INTO users (id, username,first_name, last_name, email, password)
VALUES
(1, 'alice_smith', 'Alice', 'Smith', 'alice@test.com', 'temp123'),
(2, 'bob_jacobs', 'Bob', 'Jacobs', 'bob@test.com', 'temp123');

INSERT INTO roles (id, name)
VALUES
(1, 'Tutor'),
(2, 'Student');

INSERT INTO user_roles (user_id, role_id)
VALUES
(1, 2),
(2, 1);

INSERT INTO permissions (id, name)
VALUES
(1, 'create_post'),
(2, 'edit_post'),
(3, 'delete_post'),
(4, 'upload_pdf');

INSERT INTO role_permissions (role_id, permission_id)
VALUES 
(2, 1),
(2, 2),
(2, 3),
(2, 4);

INSERT INTO posts (id, author_id, title, content, created_at)
VALUES
(1, 2, 'Algebra Questions', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.', '3/11/2024, 19:14:16');

INSERT INTO users (id, username, first_name, last_name, email, password)
VALUES 
(3,'john_doe','John','Doe','john@example.com','temp123'),
(4,'jane_deer','Jane','Deer','jane@example.com','temp123');

INSERT INTO tutor_profiles (user_id, subject, rating)
VALUES 
(3, 'Mathematics', 4.8),
(4, 'Physics', 4.5);

INSERT INTO tutor_achievements (tutor_id, achievement)
VALUES
(3, 'Helped 50+ students achieve A* grades'),
(3, 'Mathematics Olympiad winner'),
(3, '95% student success rate'),
(4, 'Published research in quantum mechanics');

INSERT INTO tutor_qualifications (tutor_id, qualification)
VALUES
(3, 'PhD in Mathematics - Oxford University'),
(3, '10 years teaching experience'),
(3, 'Exam board examiner'),
(4, '5 years of tutoring experience'),
(4, 'PhD in Physics from Cambridge University');