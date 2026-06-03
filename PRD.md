# PRD - AI Task Manager

## 1. Product Overview

### Product Name
AI Task Manager

### Product Background
Students and office workers often struggle to break down large tasks into manageable subtasks. This project combines a traditional To-Do List with Generative AI to automatically decompose complex tasks into actionable steps.

### Product Goal
Provide a lightweight task management tool that helps users:
- Create and manage tasks
- Categorize tasks
- Track completion status
- Automatically generate subtasks using AI

---

## 2. Target Users

### Primary Users
- University students
- Individual learners
- Office workers
- Project team members

### User Pain Points
- Large tasks are difficult to start
- Users do not know how to divide work efficiently
- Task management tools are often too complicated

---

## 3. Core Features

### F1. Task Creation

#### Description
Users can add a new task.

#### Inputs
- Task Title
- Category

#### Outputs
- Task displayed in task list

#### Acceptance Criteria
- Task appears immediately after creation
- Empty task names are not allowed

---

### F2. Task Completion

#### Description
Users can mark tasks as completed.

#### Acceptance Criteria
- Checkbox available
- Completed tasks show strikethrough text
- Completion state persists after refresh

---

### F3. Task Deletion

#### Description
Users can remove tasks.

#### Acceptance Criteria
- Delete button available
- Task removed immediately

---

### F4. Category Management

#### Categories
- Study
- Assignment
- Personal
- Work
- Other

#### Acceptance Criteria
- Category displayed with each task
- Users can filter by category

---

### F5. Local Storage

#### Description
All tasks are stored in browser LocalStorage.

#### Acceptance Criteria
- Tasks remain after page refresh
- No login required

---

### F6. AI Task Breakdown (Key Feature)

#### Description
Users enter a large task and AI generates actionable subtasks.

#### Example

Input:
Prepare Network Report

Output:
1. Capture packets using Wireshark
2. Analyze throughput data
3. Write report draft
4. Create charts and screenshots
5. Prepare presentation slides

#### Acceptance Criteria
- AI response generated within 10 seconds
- Generated subtasks can be added to task list

---

## 4. User Flow

### Scenario 1: Create Task

1. Open website
2. Enter task title
3. Select category
4. Click Add
5. Task appears in list

### Scenario 2: Complete Task

1. Click checkbox
2. Task becomes completed
3. Progress updates

### Scenario 3: AI Breakdown

1. Enter large task
2. Click "Generate Subtasks"
3. AI generates subtasks
4. User adds selected subtasks

---

## 5. UI Design

### Main Layout

Header
- Product Title
- Task Statistics

Task Input Area
- Task Name Input
- Category Dropdown
- Add Button

Task List Area
- Checkbox
- Task Name
- Category Tag
- Delete Button

AI Assistant Area
- Large Task Input
- Generate Button
- Generated Subtasks

---

## 6. Technical Stack

### Frontend
- HTML5
- CSS3
- JavaScript

### Storage
- LocalStorage

### AI Integration
- Gemini API

### Deployment
- Vercel

### Source Control
- GitHub

---

## 7. Non-Functional Requirements

### Performance
- Initial load < 2 seconds

### Usability
- Mobile responsive design
- Simple interface

### Reliability
- No data loss after refresh

---

## 8. MVP Scope

Included:
- Add task
- Delete task
- Complete task
- Category management
- LocalStorage
- AI task breakdown

Excluded:
- User accounts
- Team collaboration
- Cloud database
- Notifications

---

## 9. Success Metrics

### Functional Metrics
- Task creation success rate > 95%
- AI generation success rate > 90%

### User Metrics
- User can create a task within 10 seconds
- User can generate subtasks within 15 seconds

---

## 10. Future Enhancements

### Version 2.0
- Dark Mode
- Drag-and-Drop Tasks
- Due Dates
- Task Priority
- Supabase Integration
- Multi-device Synchronization
- AI Productivity Suggestions

---

## 11. Demo Script

### Step 1
Create a task:
"Study TCP"

### Step 2
Mark task as completed

### Step 3
Create a category:
"Assignment"

### Step 4
Input:
"Prepare Network Report"

### Step 5
Click:
"Generate Subtasks"

### Step 6
Show AI-generated task breakdown

### Step 7
Add generated subtasks into task list

This demonstrates all core project functions successfully.
