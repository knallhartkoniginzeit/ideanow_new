# !deanow - Tech Stack Analysis

## Overview
**!deanow** is a full-stack web application designed for problem discovery and refinement. It utilizes a hybrid architecture with a modernized React frontend (Next.js) and a robust custom backend (Express + Node.js).

## 1. Frontend (User Interface)
*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **Language**: JavaScript / JSX
*   **Styling**: 
    *   [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS framework)
    *   [clsx](https://github.com/lukeed/clsx) & [tailwind-merge](https://github.com/dcastil/tailwind-merge) (Conditional class handling)
*   **Component Library**:
    *   [Radix UI](https://www.radix-ui.com/) (Headless accessible components for Dialogs, Dropdowns, Tabs, Avatars)
    *   [Lucide React](https://lucide.dev/) (Iconography)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Simple, scalable store)
*   **Data Fetching**: Native `fetch` with React Hooks (`useEffect`, `useState`)
*   **Markdown Rendering**: [react-markdown](https://github.com/remarkjs/react-markdown) (For AI responses)
*   **Notifications**: [react-hot-toast](https://react-hot-toast.com/)

## 2. Backend (API & Server)
*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Server Framework**: [Express.js](https://expressjs.com/) (Custom server handling `/api` routes)
*   **Process Management**: [Nodemon](https://nodemon.io/) (Development hot-reload)
*   **Validation**: [express-validator](https://express-validator.github.io/) (Request body validation)
*   **Security**: [cors](https://github.com/expressjs/cors) (Cross-Origin Resource Sharing)

## 3. Database & Storage
*   **Database System**: [PostgreSQL](https://www.postgresql.org/) (Relational DB)
*   **Cloud Provider**: [Neon](https://neon.tech/) (Serverless Postgres)
*   **Driver**: [pg](https://github.com/brianc/node-postgres) (Non-blocking PostgreSQL client for Node.js)
*   **Vector Database**: [ChromaDB](https://www.trychroma.com/) (Local integration for similarity search - *partially implemented*)

## 4. Artificial Intelligence (AI)
*   **Provider**: Google DeepMind
*   **SDK**: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai)
*   **Models Used**: 
    *   `gemini-2.5-flash` (Primary chat & reasoning)
    *   `text-embedding-004` (For vector embeddings)

## 5. Authentication & Security
*   **Method**: JWT (JSON Web Tokens)
*   **Library**: [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
*   **Password Hashing**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
*   **Social Auth**: Google OAuth 2.0 (Custom implementation)

## 6. Development Tools
*   **Linting**: ESLint
*   **Package Manager**: `npm`
*   **Version Control**: Git
*   **Language Support**: TypeScript (Configuration present, but codebase is primarily JS)
