-- ExamGrid Database Schema (MySQL)

CREATE DATABASE IF NOT EXISTS examgrid;
USE examgrid;

-- Users table for authentication
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

-- Branches configuration
CREATE TABLE branches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_roll INT NOT NULL,
    end_roll INT NOT NULL
);

-- Rooms configuration
CREATE TABLE rooms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rows_count INT NOT NULL,
    cols_count INT NOT NULL,
    seat_count INT NOT NULL
);

-- Students (generated during seating)
CREATE TABLE students (
    roll INT PRIMARY KEY,
    branch VARCHAR(255) NOT NULL
);

-- Seating Results
CREATE TABLE seating_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(255) NOT NULL,
    rows_count INT NOT NULL,
    cols_count INT NOT NULL,
    seat_count INT NOT NULL
);

-- Mapping for seating allocation (DAA output)
CREATE TABLE seating_allocation (
    seating_id BIGINT,
    student_roll INT,
    FOREIGN KEY (seating_id) REFERENCES seating_results(id),
    FOREIGN KEY (student_roll) REFERENCES students(roll)
);
