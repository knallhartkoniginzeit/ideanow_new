-- !deanow Platform Database Schema - Clean Version for Neon
-- PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'both' CHECK (role IN ('problem_poster', 'solver', 'both', 'admin')),
    skills TEXT[] DEFAULT '{}',
    bio TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    completed_projects INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT FALSE,
    google_id VARCHAR(255) UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_skills ON users USING GIN(skills);

-- =====================================================
-- OAUTH ACCOUNTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS oauth_accounts (
    oauth_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_provider ON oauth_accounts(provider, provider_account_id);

-- =====================================================
-- PROBLEMS COMMUNITY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS problems_community (
    problem_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    scale VARCHAR(50) CHECK (scale IN ('small', 'medium', 'large', 'enterprise')),
    budget DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'under_review', 'solved', 'closed')),
    required_skills TEXT[] DEFAULT '{}',
    deadline TIMESTAMP WITH TIME ZONE,
    attachments JSONB DEFAULT '[]',
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    solver_id UUID REFERENCES users(user_id),
    solution_description TEXT,
    solution_rating DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    solved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_problems_community_user ON problems_community(user_id);
CREATE INDEX IF NOT EXISTS idx_problems_community_status ON problems_community(status);
CREATE INDEX IF NOT EXISTS idx_problems_community_category ON problems_community(category);
CREATE INDEX IF NOT EXISTS idx_problems_community_tags ON problems_community USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_problems_community_created ON problems_community(created_at DESC);

-- =====================================================
-- PROBLEM LIKES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS problem_likes (
    like_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems_community(problem_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_problem_likes_user ON problem_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_likes_problem ON problem_likes(problem_id);

-- =====================================================
-- PROBLEM BOOKMARKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS problem_bookmarks (
    bookmark_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems_community(problem_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_problem_bookmarks_user ON problem_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_bookmarks_problem ON problem_bookmarks(problem_id);

-- =====================================================
-- APPLICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS applications (
    application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems_community(problem_id) ON DELETE CASCADE,
    solver_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    cover_letter TEXT NOT NULL,
    proposed_approach TEXT NOT NULL,
    estimated_time VARCHAR(100),
    proposed_budget DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_problem ON applications(problem_id);
CREATE INDEX IF NOT EXISTS idx_applications_solver ON applications(solver_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- =====================================================
-- SOLUTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS solutions (
    solution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems_community(problem_id) ON DELETE CASCADE,
    solver_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected')),
    rating DECIMAL(3,2),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solutions_problem ON solutions(problem_id);
CREATE INDEX IF NOT EXISTS idx_solutions_solver ON solutions(solver_id);

-- =====================================================
-- CHAT SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);

-- =====================================================
-- CHAT MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID REFERENCES problems_community(problem_id) ON DELETE SET NULL,
    payer_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    payee_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(100),
    transaction_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_transactions_payer ON transactions(payer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payee ON transactions(payee_id);
CREATE INDEX IF NOT EXISTS idx_transactions_problem ON transactions(problem_id);
