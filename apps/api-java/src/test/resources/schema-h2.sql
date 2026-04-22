CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    can_access_dashboard BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE hostel_blocks (
    id UUID PRIMARY KEY,
    block_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description CLOB,
    total_rooms INTEGER NOT NULL,
    available_rooms INTEGER NOT NULL,
    occupied_rooms INTEGER DEFAULT 0,
    location VARCHAR(255) NOT NULL,
    rating DECIMAL(2, 1),
    virtual_tour_url VARCHAR(1024),
    images VARCHAR ARRAY,
    facilities VARCHAR ARRAY,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    warden_user_id UUID,
    approval_status VARCHAR(50),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE communities (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description CLOB,
    member_count INTEGER DEFAULT 0,
    image VARCHAR(1024),
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE students (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    course VARCHAR(255),
    year INTEGER,
    department VARCHAR(255),
    hostel_block_id UUID,
    room_number VARCHAR(50),
    enrollment_status VARCHAR(50),
    photo VARCHAR(1024),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_students_hostel_block FOREIGN KEY (hostel_block_id) REFERENCES hostel_blocks(id)
);
