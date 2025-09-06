# Sozo Pitch Helper 🚀

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-netlify-badge-id/deploy-status)](https://app.netlify.com/sites/pitchhelper/deploys)

An AI-powered training platform that transforms how you prepare for high-stakes interviews, pitches, and presentations.

**🔴 Live Demo: [https://pitchhelper.netlify.app](https://pitchhelper.netlify.app)**

<!-- TODO: Replace this with a high-quality GIF of the app in action -->
<img src="https://i.imgur.com/7b5Qy9f.png" alt="Sozo Pitch Helper Session Analysis" width="100%">

---

## ✨ The Problem We Solve

High-stakes communication—whether in a **job interview**, a **startup pitch**, or a **thesis defense**—is notoriously difficult to prepare for. Traditional methods often fail because they don't simulate real pressure, provide subjective feedback, or allow you to measure progress over time.

Sozo Pitch Helper solves this by creating a **realistic, AI-powered practice environment** that provides interactive role-play, targeted feedback, and progress tracking, turning high-pressure situations into opportunities to shine.

## 🎯 Key Features

-   **🤖 AI-Powered Role-Play:** Engage in real-time voice conversations with an AI agent whose persona is tailored to your specific scenario (e.g., a hiring manager, a venture capitalist).
-   **📄 Intelligent Document Analysis:** Upload a job description, pitch deck, or research paper. Our backend uses Gemini to instantly understand the document's use case and extract the key points.
-   **📊 Data-Driven Performance Feedback:** Receive a detailed report after each session with scores on **Communication**, **Content Mastery**, **Engagement**, and **Resilience**, plus qualitative feedback.
-   **🧠 The AI Memory Engine:** Our AI coach remembers your performance across sessions *within the same project*. It identifies your weaknesses and generates dynamic instructions to challenge you on those specific areas in your next practice session.

## 🛠️ Tech Stack & Architecture

We chose a modern, decoupled architecture for security, scalability, and intelligence. The backend acts as the central "brain," while the client remains lightweight and focused on delivering a responsive user experience.

| Component             | Technologies                                                                          |
| :-------------------- | :------------------------------------------------------------------------------------ |
| **Frontend**          | `React`, `Vite`, `TypeScript`, `Tailwind CSS`, `ElevenLabs React SDK`                   |
| **Backend**           | `Python`, `Flask`                                                                     |
| **Database & Auth**   | `Firebase Authentication`, `Firebase Realtime Database`                               |
| **AI Services**       | `Google Gemini API`, `ElevenLabs Agents API`                                          |
| **Deployment**        | Frontend on `Netlify`, Backend on `Hugging Face Spaces`                               |

### System Architecture Diagram

```mermaid
graph TD
    subgraph Client Side (Browser)
        A1["<b>User Interface</b><br/>React + Vite + Tailwind<br/><i>Provides all user views, forms, and reports.</i>"]
        A2["<b>User Actions</b><br/>(Upload, Start/End Session)<br/><i>Triggers API calls via the API Client.</i>"]
        A3["<b>Unified API Client (api.ts)</b><br/><i>Manages all secure communication with the backend.</i>"]
        A4["<b>ElevenLabs React SDK</b><br/><i>Handles the real-time, low-latency voice connection.</i>"]

        A1 --> A2
        A2 --> A3
        A2 --> A4
    end

    subgraph Backend
        C1["<b>Flask Backend</b><br/><i>Hosts all API endpoints and business logic.</i>"]
        C2["<b>Firebase Admin SDK</b><br/><i>Verifies user tokens and manages all database operations.</i>"]
        C3["<b>AI Orchestration Logic</b><br/><i>Manages multi-step Gemini prompts for context and analysis.</i>"]

        C1 --> C2
        C1 --> C3
    end

    subgraph Cloud & External Services
        D1["<b>Firebase Authentication</b><br/><i>Securely handles user sign-in and identity management.</i>"]
        D2["<b>Firebase Realtime Database</b><br/><i>Stores all application data (profiles, projects, sessions).</i>"]
        D4["<b>Google Gemini API</b><br/><i>The engine for summarization, classification, and feedback generation.</i>"]
        D6["<b>ElevenLabs Conversational AI API</b><br/><i>Provides the real-time, voice-based AI agent.</i>"]
    end

    A3 -- "Sends API Requests" --> C1
    A1 -- "Handles Auth Flow" --> D1
    A4 -- "Streams Audio" --> D6
    C2 -- "Verifies Tokens" --> D1
    C2 -- "Reads/Writes Data" --> D2
    C3 -- "Sends Prompts" --> D4
```

# 🚀 Getting Started
To get a local copy up and running, follow these simple steps.

## Prerequisites
- Node.js and npm
- Python 3.10+ and pip
- Firebase Account (for Auth and Realtime Database)
- Google AI Studio API Key (for Gemini)
- ElevenLabs API Key

## Installation & Setup

### Clone the repo
    git clone https://github.com/rapha18th/sozo-pitch-boost.git
    cd sozo-pitch-boost

### Setup the Frontend
  
    npm install
    cp .env.example .env.local

Fill in your Firebase project configuration in `.env.local`.

### Setup the Backend
    cd ../Flask-Backend
    pip install -r requirements.txt
    cp .env.example .env

Fill in all the required API keys and Firebase credentials in the `.env` file. Your Firebase service account JSON should be pasted as a single-line string.

## Running the Application

### Start the Backend Server
    cd Flask-Backend
    python main.py

### Start the Frontend Development Server
    npm run dev

Open http://localhost:5173 to view it in the browser.

---

# 🔮 Roadmap: What's Next
- **Contextual Research Feature**: Use the project's `short_description` to perform automated web searches, enriching the AI agent's knowledge with real-world data about the company or topic.
- **Visual Progress Tracking**: Develop a dashboard to graphically display a user's scores over time, allowing them to visualize their improvement.
- **Custom AI Personas**: Allow users to select different "personalities" for the AI interviewer (e.g., *Friendly & Encouraging*, *Skeptical & Direct*) to practice a wider range of scenarios.
