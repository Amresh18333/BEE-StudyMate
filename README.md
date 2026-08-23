StudyMate AI

StudyMate AI is a personalized learning platform designed for students.

It is intended to support:

College students

University students

School students

Coding learners

Programming/DSA learners

Students preparing for exams

Students following a syllabus

The first version will be built as a normal full-stack application.
AI will be added only after the core platform is complete.

Project Status

Current phase: Phase 0 — Planning

Development method: Checklist-driven

Critical development rule

We will complete one checklist item at a time.

The next item must NOT be started until the current item is explicitly marked
complete by the project owner.

The architecture, technology stack, and project structure are treated as
frozen during development.

No changes are allowed unless the project owner explicitly authorizes them.

Fixed Technology Stack

Frontend

Only:

React

JavaScript

HTML

CSS

Backend

Only:

Python

FastAPI

Database

MongoDB

Secrets

All API keys and database credentials must be stored in:

.env

Never place real credentials in:

React source code

Python source code

README files

Git commits

screenshots

public configuration files

Use .env.example only for variable names/placeholders.

Product Vision

StudyMate AI should become a personalized study companion.

A student's experience should eventually look approximately like:

Student
   ↓
Personal Profile
   ↓
Subjects / Courses
   ↓
Topics / Syllabus
   ↓
Learning Activity
   ↓
Progress
   ↓
Weak Areas / Strong Areas
   ↓
Personalized Recommendations

The system should remember the student's learning information and use it to
provide a more useful experience.

Main Features

Core Platform

User registration and login

Student profile

Student onboarding

Subjects

Topics

Syllabus

Learning progress

Study sessions

Quiz system

Quiz attempts

Scores

Dashboard

Study planner

Bookmarks/resources

Resource Discovery

Students often struggle to find:

Good notes

Useful explanations

Relevant videos

Resources covering a complete topic

Resources covering an entire syllabus

StudyMate should eventually help students find relevant learning resources.

For example:

Input:
Deadlock in Operating Systems

Output:
- Relevant notes
- Relevant videos
- Important concepts
- Useful learning resources

It should also support larger inputs such as an entire syllabus.

Personalization

Personalization must exist before AI.

Initially, StudyMate can use normal backend logic to determine things such as:

Strong topics
Weak topics
Incomplete topics
Progress
Study priorities
Recommended next topics

Example:

DSA

Arrays       → 92%
Linked List  → 78%
Stack        → 51%
Queue        → 42%

The backend can identify Stack and Queue as areas requiring more attention.

Later, AI can make these recommendations more intelligent.

AI — Later Phase

AI is deliberately excluded from the initial implementation.

Future AI functionality may include:

AI Tutor

PDF summarization

Notes summarization

AI-generated quizzes

AI study plans

Personalized AI explanations

Resource recommendations

RAG / knowledge retrieval

Syllabus analysis

The application must be designed so that these can be added later without
rewriting the entire platform.

Free / Small-User Strategy

The project currently has no investment budget.

The initial system should therefore prioritize:

Free APIs

Free database resources

Free hosting where practical

Free developer tools

Small initial user base

Paid infrastructure should not be introduced unless explicitly approved.

Code Style

The code must remain understandable to a student.

We prefer:

simple code
clear names
small functions
clear folder responsibilities
comments where they genuinely help

Avoid unnecessary:

complex abstractions
over-engineering
advanced design patterns without a reason
large amounts of boilerplate

Every important technology or architecture decision should be explained before
it is introduced.

Architecture

The basic architecture is:

                 StudyMate AI

                  React
               JavaScript
                    │
                    │ REST API
                    ▼
                 FastAPI
                  Python
                    │
              Business Logic
                    │
                    ▼
                 MongoDB

Future AI services will connect through the backend:

React
  ↓
FastAPI
  ↓
Application Logic
  ├── MongoDB
  └── Future AI Services

