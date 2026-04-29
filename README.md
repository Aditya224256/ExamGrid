# ExamGrid - Smart Seating Arrangement System

Hey everyone! Welcome to my project, ExamGrid. I built this for managing exams better because manual room allocation is a huge headache in our college. This project basically takes a list of students from different branches, the rooms available, and automatically gives a seating plan where students from the same branch don't sit right next to each other (to prevent cheating!).

## Project Structure & Modules

I have divided the project into a Frontend and a Backend to keep things clean. Here is a breakdown of what each part does:

### 1. Frontend (The User Interface)
This is what the teachers and students see and interact with. It's built with basic HTML, CSS, and JavaScript.
* **index.html & signup.html**: The starting pages where users can log in or register themselves.
* **teacher.html**: The main dashboard for teachers. Here, they can enter the number of rooms, rows, columns, and branch details to generate the seating arrangement.
* **student.html**: A simple page where students can see where they are supposed to sit during the exam.
* **style.css**: This makes all the web pages look nice and colorful. 
* **script.js**: This file connects the buttons and forms on the website to the backend server to save and fetch data.

### 2. Backend (The Brain of the App)
I used Java and Spring Boot for the backend because it's what we are learning and it's pretty solid for making web servers. 
* **src/main/java/com/examgrid/controller**: Think of controllers as the middleman. When the frontend asks for something (like "give me the seating plan"), the controller takes that request, talks to the internal code, and sends the response back to the website.
* **src/main/java/com/examgrid/model**: These are just standard Java classes that represent real-world things like `Student`, `Room`, `User`, etc.
* **src/main/java/com/examgrid/repository**: This part handles saving and reading data from our database.
* **src/main/java/com/examgrid/service**: This is where the actual logic happens (including the main algorithm).

### 3. Database
* **data/ and database/**: I used an H2 database. It's really cool because it stores everything locally in files without needing to install heavy software like MySQL. The `schema.sql` file just contains the commands to create the tables we need.

### What is pom.xml?
If you look in the main folder, there's a file called `pom.xml`. It's a Maven file. Since Java needs a lot of external libraries (like Spring Boot, Security tools, Database drivers), downloading them manually is a pain. `pom.xml` simply tells Maven, "Hey, I need these libraries to run my project," and Maven automatically downloads them from the internet for me.

---

## How the Algorithm Works (The Cool Part)

The most important part of this project is the logic inside `SeatingAlgorithm.java`. 

**The Goal:** Make sure no two students from the same branch sit next to each other (front, back, left, right, or diagonally).

**The Logic I Used:**
1. **Grouping Students:** First, it groups all the students by their branch. So we have separate lists for CS, IT, Mechanical, etc.
2. **Round-Robin Selection:** To be fair and distribute students evenly, it shuffles the branches and picks students from the branch that has the most students left to place.
3. **Checking Neighbors (Moore Neighborhood):** Before putting a student in a seat, the code checks all 8 surrounding seats (left, right, up, down, and all 4 diagonals). This is basically checking a 3x3 grid around the seat.
4. If there is no one from the same branch in those 8 seats, the student sits there!
5. If there is a conflict, it skips and tries the next biggest branch until it finds a good fit. 
6. If absolutely no branch is safe, it just places a student there anyway as a fallback so the room doesn't stay empty.

This logic runs row by row, column by column through every seat in every room until all students are seated!

---
To run the project, just open it in any IDE like IntelliJ or Eclipse, wait for Maven to download the stuff from `pom.xml`, and run `ExamGridApplication.java`.
