# AI Task Manager

## Project Overview

AI Task Manager is a lightweight web-based task management application that helps users organize daily tasks and improve productivity.

Unlike traditional To-Do List applications, this project integrates Generative AI to automatically break down large and complex tasks into smaller actionable subtasks, helping users start and complete work more efficiently.

This project was developed as a Vibe Coding project in collaboration with Generative AI.

---

## Features

### Task Management

* Add new tasks
* Delete tasks
* Mark tasks as completed
* Track task progress

### Category Management

* Study
* Assignment
* Personal
* Work
* Other

### AI Task Breakdown

Users can enter a complex task and let AI generate detailed subtasks automatically.

Example:

Input:

Prepare Network Report

AI Output:

1. Capture packets using Wireshark
2. Analyze throughput statistics
3. Write the report draft
4. Insert screenshots and charts
5. Prepare presentation slides

### Local Data Storage

* Tasks are stored using LocalStorage
* No login required
* Data remains after refreshing the browser

### Responsive Design

* Desktop support
* Mobile-friendly layout

---

## AI Tools Used

### Gemini API

Used to generate task breakdown suggestions.

### ChatGPT

Used for:

* Project planning
* Product requirement document (PRD)
* UI design ideas
* Code generation assistance
* README documentation

---

## Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript (ES6)

### Storage

* Browser LocalStorage

### AI Integration

* Google Gemini API

### Deployment

* Vercel

### Version Control

* GitHub

---

## Project Structure

```text
AI-Task-Manager/
│
├── index.html
├── style.css
├── script.js
├── assets/
│   ├── screenshot1.png
│   ├── screenshot2.png
│   └── screenshot3.png
│
├── README.md
└── PRD.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/your-username/AI-Task-Manager.git
```

### Open Project

Simply open:

```text
index.html
```

in your browser.

---

## Running with Gemini API

Create a configuration file:

```javascript
const API_KEY = "YOUR_GEMINI_API_KEY";
```

Replace the placeholder with your own Gemini API key.

---

## Screenshots

### Home Page

---

### Task Management

---

### AI Task Breakdown

[Home Page]<img width="896" height="551" alt="屏幕截图 2026-06-03 173706" src="https://github.com/user-attachments/assets/baf3cb93-cf2b-4ce2-874d-8d7659212a3a" />
---

## Demo Scenario

### Step 1

Create a task:

Study TCP

### Step 2

Mark the task as completed.

### Step 3

Create a new category:

Assignment

### Step 4

Enter:

Prepare Network Report

### Step 5

Click:

Generate Subtasks

### Step 6

AI generates:

* Capture packets
* Analyze throughput
* Write report
* Create charts
* Prepare presentation slides

### Step 7

Add generated subtasks into the task list.

---

## Future Improvements

* Dark Mode
* Task Priority Levels
* Due Dates
* Drag-and-Drop Tasks
* Supabase Integration
* Multi-device Synchronization
* AI Productivity Recommendations

---

## Author

Student Project for Vibe Coding Assignment

Developed with the assistance of Generative AI.
