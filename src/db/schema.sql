-- !deanow Platform Database Schema
-- PostgreSQL Schema for all three modules

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_skills ON users USING GIN(skills);

-- =====================================================
-- OAUTH ACCOUNTS TABLE (Google Sign In)
-- =====================================================
CREATE TABLE oauth_accounts (
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

CREATE INDEX idx_oauth_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_provider ON oauth_accounts(provider, provider_account_id);

-- =====================================================
-- PROBLEM LIKES TABLE
-- =====================================================
CREATE TABLE problem_likes (
    like_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems_community(problem_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, problem_id)
);

CREATE INDEX idx_problem_likes_user ON problem_likes(user_id);
CREATE INDEX idx_problem_likes_problem ON problem_likes(problem_id);

-- =====================================================
-- PROBLEM BOOKMARKS TABLE
-- =====================================================
CREATE TABLE problem_bookmarks (
    bookmark_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems_community(problem_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, problem_id)
);

CREATE INDEX idx_problem_bookmarks_user ON problem_bookmarks(user_id);
CREATE INDEX idx_problem_bookmarks_problem ON problem_bookmarks(problem_id);

-- =====================================================
-- COMMUNITY PROBLEMS TABLE (Module 1)
-- =====================================================
CREATE TABLE problems_community (
    problem_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    scale VARCHAR(20) DEFAULT 'medium' CHECK (scale IN ('small', 'medium', 'large', 'enterprise')),
    budget DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'under_review', 'solved', 'closed', 'disputed')),
    solver_id UUID REFERENCES users(user_id),
    solution_description TEXT,
    solution_rating INTEGER CHECK (solution_rating BETWEEN 1 AND 5),
    required_skills TEXT[] DEFAULT '{}',
    deadline TIMESTAMP WITH TIME ZONE,
    attachments TEXT[] DEFAULT '{}',
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    solved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_community_status ON problems_community(status);
CREATE INDEX idx_community_category ON problems_community(category);
CREATE INDEX idx_community_tags ON problems_community USING GIN(tags);
CREATE INDEX idx_community_user ON problems_community(user_id);
CREATE INDEX idx_community_created ON problems_community(created_at DESC);

-- =====================================================
-- WEB-SCRAPED PROBLEMS TABLE (Module 2)
-- =====================================================
CREATE TABLE problems_web_scraped (
    problem_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_url TEXT NOT NULL,
    source_name VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    extracted_problem TEXT NOT NULL,
    original_content TEXT,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    relevance_score DECIMAL(5,4) DEFAULT 0.0000,
    trend_score DECIMAL(5,4) DEFAULT 0.0000,
    news_context TEXT,
    scraped_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    occurrence_count INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scraped_category ON problems_web_scraped(category);
CREATE INDEX idx_scraped_tags ON problems_web_scraped USING GIN(tags);
CREATE INDEX idx_scraped_trend ON problems_web_scraped(trend_score DESC);
CREATE INDEX idx_scraped_date ON problems_web_scraped(scraped_date DESC);

-- =====================================================
-- EXISTING RESEARCH PROBLEMS TABLE (Module 3)
-- =====================================================
CREATE TABLE problems_existing (
    problem_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('paper', 'journal', 'thesis', 'prototype', 'patent', 'other')),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    research_gap TEXT,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    citations TEXT[] DEFAULT '{}',
    practical_implementations INTEGER DEFAULT 0,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    uploaded_by UUID REFERENCES users(user_id),
    files TEXT[] DEFAULT '{}',
    external_links TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_existing_category ON problems_existing(category);
CREATE INDEX idx_existing_tags ON problems_existing USING GIN(tags);
CREATE INDEX idx_existing_type ON problems_existing(source_type);

-- =====================================================
-- PREVIOUS ITERATIONS TABLE
-- =====================================================
CREATE TABLE previous_iterations (
    iteration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems_existing(problem_id) ON DELETE CASCADE,
    developer_name VARCHAR(255),
    developer_user_id UUID REFERENCES users(user_id),
    description TEXT NOT NULL,
    what_was_built TEXT,
    limitations TEXT,
    next_steps_suggested TEXT,
    code_repo_link TEXT,
    demo_link TEXT,
    documentation_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_iterations_problem ON previous_iterations(problem_id);

-- =====================================================
-- SOLUTIONS TABLE
-- =====================================================
CREATE TABLE solutions (
    solution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems_community(problem_id) ON DELETE CASCADE,
    solver_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    approach TEXT,
    code_repo_link TEXT,
    demo_link TEXT,
    attachments TEXT[] DEFAULT '{}',
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'accepted', 'rejected', 'revision_requested')),
    feedback TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_solutions_problem ON solutions(problem_id);
CREATE INDEX idx_solutions_solver ON solutions(solver_id);
CREATE INDEX idx_solutions_status ON solutions(status);

-- =====================================================
-- APPLICATIONS TABLE (Solver applying to problems)
-- =====================================================
CREATE TABLE applications (
    application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems_community(problem_id) ON DELETE CASCADE,
    solver_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    cover_letter TEXT,
    proposed_approach TEXT,
    estimated_time VARCHAR(100),
    proposed_budget DECIMAL(12,2),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(problem_id, solver_id)
);

CREATE INDEX idx_applications_problem ON applications(problem_id);
CREATE INDEX idx_applications_solver ON applications(solver_id);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems_community(problem_id),
    payer_id UUID NOT NULL REFERENCES users(user_id),
    payee_id UUID NOT NULL REFERENCES users(user_id),
    amount DECIMAL(12,2) NOT NULL,
    platform_fee DECIMAL(12,2) NOT NULL,
    net_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'escrow', 'released', 'refunded', 'disputed', 'failed')),
    stripe_payment_id VARCHAR(255),
    stripe_transfer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    released_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_transactions_problem ON transactions(problem_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID REFERENCES problems_community(problem_id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_problem ON messages(problem_id);
CREATE INDEX idx_messages_participants ON messages(sender_id, receiver_id);

-- =====================================================
-- CHAT HISTORY TABLE (AI Conversations)
-- =====================================================
CREATE TABLE chat_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chat_messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    parent_id UUID REFERENCES categories(category_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default categories
INSERT INTO categories (name, description, icon, color) VALUES
    ('Technology', 'Software, hardware, and tech-related problems', 'cpu', '#3B82F6'),
    ('Healthcare', 'Medical and health-related challenges', 'heart-pulse', '#EF4444'),
    ('Environment', 'Climate, sustainability, and environmental issues', 'leaf', '#22C55E'),
    ('Education', 'Learning, teaching, and educational problems', 'graduation-cap', '#F59E0B'),
    ('Finance', 'Banking, fintech, and financial challenges', 'banknote', '#8B5CF6'),
    ('Social Impact', 'Community and social problem-solving', 'users', '#EC4899'),
    ('Business', 'Entrepreneurship and business challenges', 'briefcase', '#06B6D4'),
    ('Research', 'Academic and scientific problems', 'flask-conical', '#6366F1'),
    ('Design', 'UI/UX, graphic design, and creative challenges', 'palette', '#F97316'),
    ('Other', 'Miscellaneous problems', 'more-horizontal', '#6B7280');

-- =====================================================
-- FUNCTION: Update timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_problems_community_updated_at BEFORE UPDATE ON problems_community FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_problems_existing_updated_at BEFORE UPDATE ON problems_existing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
