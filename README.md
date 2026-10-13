# Edukatura | Learning Management System

A learning management system (LMS) where faculty publish courses, modules, assignments and quizzes, and learners enroll, turn in their work and track grades. This project contains the **React frontend**. It talks to a REST API (Express + MongoDB/Mongoose) for courses, enrollments, modules, assignments, quizzes and submissions.

## Features
**Learners**
- Browse the course catalogue with search and an All / Enrolled / Available filter, then enroll in a course
- Personal dashboard with enrolled courses, what is due soon, and completed work (Graded / Pending grade)
- Open an enrolled course to see its modules, assignments and quizzes (course content is hidden until you are enrolled)
- Submit assignments (text answer and an optional file link) and take multiple-choice quizzes, with progress tracking
- View scores and instructor feedback once work is graded

**Faculty**
- Create, edit and delete courses, modules, assignments and quizzes
- Dashboard with course count, active coursework, and how many submissions are awaiting grading
- Learner roster per course
- Grading screen for each assignment and quiz

**Admins**
- Everything faculty can do
- Users management page

## Tech stack

| Area | Technology |
| --- | --- |
| UI | React (Vite) |
| Routing | React Router (`react-router`) |
| Styling | Tailwind CSS v4 |
| Language | JavaScript (JSX) with a TypeScript `Layout` |
| Backend (separate) | Node.js, Express, MongoDB with Mongoose |

## Getting started

### Prerequisites

- Node.js 18 or newer
- The Edukatura API running and reachable from your browser

### Install and run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

Point the app at your API by editing the base URL in `src/api/client`.

### Build for production

```bash
npm run build
npm run preview
```

## Roles and access

| Role | Can do |
| --- | --- |
| `learner` | Browse and enroll in courses, view enrolled coursework, submit work |
| `faculty` | Manage courses and coursework, view rosters, grade submissions |
| `admin` | Everything faculty can do, plus manage users |

Routes are protected by `ProtectedRoute`. Grading routes require `faculty` or `admin`, and `/users` requires `admin`. Anyone who is signed out is sent to `/login`.

## Routes

| Path | Page | Access |
| --- | --- | --- |
| `/login`, `/register` | Authentication | Public |
| `/dashboard` | Dashboard | Signed in |
| `/courses` | Course catalogue / My courses | Signed in |
| `/courses/new` | Create a course | Faculty, admin |
| `/courses/:courseId` | Course detail | Signed in (learners must be enrolled to see content) |
| `/courses/:courseId/edit` | Edit a course | Faculty, admin |
| `/courses/:courseId/modules/new` | Add a module | Faculty, admin |
| `/courses/:courseId/modules/:moduleId/edit` | Edit a module | Faculty, admin |
| `/courses/:courseId/assignments/new` | Post an assignment | Faculty, admin |
| `/courses/:courseId/assignments/:assignmentId` | Assignment detail and submission | Signed in |
| `/courses/:courseId/assignments/:assignmentId/edit` | Edit an assignment | Faculty, admin |
| `/courses/:courseId/assignments/:assignmentId/submissions` | Grade assignment submissions | Faculty, admin |
| `/courses/:courseId/quizzes/new` | Create a quiz | Faculty, admin |
| `/courses/:courseId/quizzes/:quizId` | Quiz detail and submission | Signed in |
| `/courses/:courseId/quizzes/:quizId/edit` | Edit a quiz | Faculty, admin |
| `/courses/:courseId/quizzes/:quizId/submissions` | Grade quiz submissions | Faculty, admin |
| `/users` | User management | Admin |

## API endpoints used

The frontend calls these endpoints on the API:

| Endpoint | Used for |
| --- | --- |
| `/courses`, `/courses/:id`, `/courses?scope=all` | Course lists, detail, catalogue |
| `/enrollments`, `/enrollments/my`, `/enrollments?course=:id` | Enrolling, a learner's own enrollments, a course roster |
| `/modules?course=:id`, `/modules/:id` | Modules in a course |
| `/assignments`, `/assignments?upcoming=true`, `/assignments?course=:id` | Assignments |
| `/quizzes`, `/quizzes?upcoming=true`, `/quizzes?course=:id` | Quizzes |
| `/submissions`, `/submissions/my`, `/submissions?assignment=:id` | Turning in work, a learner's submissions, grading lists |

## Project structure

```text
src/
├── App.jsx                  # Route table
├── api/
│   └── client               # API client (base URL, request helpers)
├── context/
│   └── AuthContext          # Current user, login/logout, role flags (isAdmin, canTeach)
├── components/
│   ├── Layout.tsx           # Sticky navbar + page outlet
│   ├── ProtectedRoute       # Auth and role guard
│   ├── Loading, ErrorNote, EmptyState, NotFound
├── pages/
│   ├── Login, Register
│   ├── Dashboard, Courses, Users, Grading
│   ├── views/               # CourseDetail, AssignmentDetail, QuizDetail
│   └── forms/               # CourseForm, ModuleForm, AssignmentForm, QuizForm
├── styles/
│   └── base.css             # Tailwind import, theme variables, base styles
└── utils                    # Date, name and colour helpers
```