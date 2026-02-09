-- Add categories table and populate with relevant categories

CREATE TABLE IF NOT EXISTS categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert relevant categories for the platform
INSERT INTO categories (name, description, icon) VALUES
('Technology & Software', 'Software development, apps, web platforms, and tech solutions', 'code'),
('Business & Marketing', 'Business strategy, marketing campaigns, branding, and growth', 'briefcase'),
('Design & Creative', 'UI/UX design, graphic design, branding, and creative work', 'palette'),
('Data & Analytics', 'Data analysis, machine learning, AI, and data visualization', 'bar-chart'),
('Healthcare & Medical', 'Medical technology, healthcare solutions, and wellness', 'heart'),
('Education & Learning', 'Educational platforms, e-learning, and training solutions', 'book'),
('Finance & Fintech', 'Financial services, payment systems, and fintech solutions', 'dollar-sign'),
('E-commerce & Retail', 'Online stores, marketplace platforms, and retail solutions', 'shopping-cart'),
('Social Impact', 'Non-profit, sustainability, and social good initiatives', 'users'),
('IoT & Hardware', 'Internet of Things, hardware devices, and embedded systems', 'cpu'),
('Gaming & Entertainment', 'Game development, entertainment platforms, and media', 'gamepad'),
('Real Estate & Property', 'Property management, real estate tech, and housing solutions', 'home'),
('Transportation & Logistics', 'Delivery, logistics, transportation, and supply chain', 'truck'),
('Agriculture & Food', 'Agritech, food delivery, and agricultural solutions', 'leaf'),
('Energy & Environment', 'Renewable energy, environmental tech, and sustainability', 'zap'),
('Legal & Compliance', 'Legal tech, compliance tools, and regulatory solutions', 'scale'),
('HR & Recruitment', 'Human resources, recruitment platforms, and workforce management', 'user-check'),
('Communication & Collaboration', 'Chat apps, video conferencing, and team collaboration tools', 'message-square'),
('Security & Privacy', 'Cybersecurity, data privacy, and security solutions', 'shield'),
('Other', 'Problems that do not fit into other categories', 'more-horizontal')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
