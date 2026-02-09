# !deanow - AI-Powered Problem Solving Platform

A full-stack platform that connects problem solvers with real-world challenges through three integrated modules: Community Problem Solving, Web-Scraped Problem Discovery, and Existing Research Problems Database.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Docker Desktop installed (for PostgreSQL and ChromaDB)
- Gemini API key

### Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   - `GEMINI_API_KEY` - Get from Google AI Studio
   - `JWT_SECRET` - Generate a strong random string

3. **Start Database Services**
   ```bash
   docker-compose up -d
   ```
   This starts PostgreSQL and ChromaDB containers.

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   
   This starts both:
   - Next.js frontend at `http://localhost:3000`
   - Express API at `http://localhost:3001`

## 📁 Project Structure

```
src/
├── app/              # Next.js pages (App Router)
│   ├── auth/         # Login & Register
│   ├── chat/         # AI Chat interface
│   ├── dashboard/    # User dashboard
│   └── problems/     # Problem browsing & creation
├── components/       # React components
├── lib/              # Utilities & context
├── server/           # Express.js backend
│   ├── routes/       # API endpoints
│   └── middleware/   # Auth middleware
├── services/         # Business logic
│   └── ai/           # Gemini integration
└── db/               # Database layer
    └── schema.sql    # PostgreSQL schema
```

## 🔧 Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Express.js, PostgreSQL
- **AI**: Google Gemini API
- **Vector DB**: ChromaDB (for RAG)
- **Auth**: JWT tokens

## 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Register new user |
| `POST /api/auth/login` | User login |
| `GET /api/problems` | List problems |
| `POST /api/problems` | Create problem |
| `POST /api/chat/query` | AI chat message |
| `GET /api/categories` | Get categories |

## 🎨 Features

- ✅ AI-powered problem refinement using Gemini
- ✅ Community problem marketplace
- ✅ Skill-based problem matching
- ✅ Real-time chat with conversation history
- ✅ Dark mode with modern UI
- ✅ Responsive design

## 📝 License

MIT License
