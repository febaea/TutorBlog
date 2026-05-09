CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE roles (
    id INT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- assigns role to user --
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id INT NOT NULL,

    PRIMARY KEY (user_id, role_id),

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (role_id) REFERENCES roles(id)
        ON DELETE CASCADE
);

CREATE TABLE permissions (
    id INT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- assigns permissions to roles -- 
CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,

    PRIMARY KEY (role_id, permission_id),

    FOREIGN KEY (role_id) REFERENCES roles(id)
        ON DELETE CASCADE,

    FOREIGN KEY (permission_id) REFERENCES permissions(id)
        ON DELETE CASCADE
);

CREATE TABLE posts (
    id BIGINT PRIMARY KEY,
    author_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,

    featured_image_url VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (author_id) REFERENCES users(id)
        ON DELETE CASCADE
);
