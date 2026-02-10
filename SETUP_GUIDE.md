# !deanow - Setup Guide

This guide will help you get the project running on a new machine.

## 1. System Requirements
Before starting, ensure you have the following installed:
*   **Node.js**: Version 18.x or higher. [Download here](https://nodejs.org/).
*   **Git**: For cloning the repository. [Download here](https://git-scm.com/).
*   **PostgreSQL**: You can use a local installation or a cloud provider like [Neon.tech](https://neon.tech/) (recommended).

## 2. Installation Steps
Open your terminal and follow these steps:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/knallhartkoniginzeit/ideanow_new.git
    cd ideanow_new
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

## 3. Environment Variables
Create a file named `.env` in the root directory and add the following:

```env
# Database (Neon or Local Postgres)
DATABASE_URL=your_postgresql_connection_string

# JWT Security
JWT_SECRET=your_super_secret_string_here

# AI Configuration (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Google OAuth (Optional for local testing)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

## 4. Database Setup
Once your `DATABASE_URL` is set, run the migrations to create the tables:

```bash
# General setup
npm run db:migrate

# Chat features setup
npm run db:migrate:chat

# (Optional) Seed initial data
npm run db:seed
```

## 5. Running the Project
Start both the Frontend and Backend servers simultaneously:

```bash
npm run dev
```

*   **Frontend**: [http://localhost:3000](http://localhost:3000)
*   **Backend API**: [http://localhost:3001](http://localhost:3001)

## Troubleshooting
*   **Port Conflicts**: If port 3000 or 3001 is in use, the server might fail to start.
*   **Node Path**: If `npm` is not found, ensure Node.js is correctly added to your system's PATH.
