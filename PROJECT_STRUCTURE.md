StudyMate AI — Project Structure

STATUS: FROZEN

This file is the source of truth for the initial StudyMate AI project structure.
Do not change the architecture, stack, or folder structure during development
unless the project owner explicitly authorizes a change.

Fixed Technology Stack

Frontend

React

JavaScript

HTML

CSS

Backend

Python

FastAPI

Database

MongoDB

Configuration / Secrets

.env for API keys, database credentials, and other secrets

.env must never be committed to Git

.env.example may contain variable names only

Root Structure

StudyMateAI/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── context/
│       ├── hooks/
│       ├── utils/
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database/
│   │   ├── utils/
│   │   ├── config.py
│   │   └── main.py
│   │
│   ├── .env
│   ├── .env.example
│   └── requirements.txt
│
├── docs/
│   ├── PROJECT_STRUCTURE.md
│   └── API.md
│
├── .gitignore
├── README.md
└── ...


Responsibilities

frontend/

Everything related to the React user interface.

components/  → reusable UI components
pages/       → application pages/screens
services/    → communication with FastAPI
context/     → shared React state
hooks/       → reusable React hooks
utils/       → small helper functions
assets/      → images/icons/static frontend assets

backend/

Everything related to the Python/FastAPI server.

api/routes/  → API endpoints
models/      → database models/data structures
schemas/     → request/response validation
services/    → application/business logic
database/    → MongoDB connection/database helpers
utils/       → backend helper functions
config.py    → configuration/environment variables
main.py      → FastAPI application entry point

docs/

Project documentation and technical reference.


The architecture must remain ready for a future AI layer without making AI a
requirement for the basic application.

Future AI-related functionality may include:

AI Tutor
PDF/Notes Summarizer
AI Quiz Generator
AI Study Planner
AI Resource Recommendation
RAG / Knowledge System

These belong to a later development phase.

Development Principle

React
  ↓
FastAPI
  ↓
Business Logic
  ↓
MongoDB

The frontend displays application state.

The backend owns business logic.

MongoDB stores persistent data.

Future AI services can be connected to the backend later.