-- Lagos Platform Database Schema
-- Para ser usado no Supabase

-- Tabela de Usuários
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    type VARCHAR(50) NOT NULL, -- 'customer', 'professional', 'student'
    business VARCHAR(50), -- 'jewelry', 'cleaning', 'courses'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Pedidos de Jewelry
CREATE TABLE jewelry_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    delivery_method VARCHAR(50), -- 'Delivery' ou 'Pickup'
    address TEXT,
    items JSONB NOT NULL, -- Array de produtos no carrinho
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'shipped', 'delivered'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Profissionais de Limpeza
CREATE TABLE cleaning_professionals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    specialties TEXT[], -- Array: residential, commercial, etc
    availability_hours JSONB, -- Horários disponíveis
    hourly_rate DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'active'
    background_check BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Solicitações de Limpeza (Clientes)
CREATE TABLE cleaning_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    service_type VARCHAR(50) NOT NULL, -- 'residential', 'commercial'
    employment_type VARCHAR(50), -- 'full-time', 'part-time'
    address TEXT NOT NULL,
    description TEXT,
    preferred_date DATE,
    estimated_hours DECIMAL(5, 2),
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'assigned', 'completed'
    professional_id UUID REFERENCES cleaning_professionals(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Cursos
CREATE TABLE courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    modalities TEXT[], -- 'online', 'presencial'
    price DECIMAL(10, 2),
    duration_hours INT,
    instructor_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Inscrições de Cursos
CREATE TABLE course_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    student_phone VARCHAR(20) NOT NULL,
    modality VARCHAR(50), -- 'online' ou 'presencial'
    enrollment_date DATE DEFAULT CURRENT_DATE,
    certificate_generated BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'enrolled', -- 'enrolled', 'completed', 'dropped'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Email Log
CREATE TABLE email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) DEFAULT 'binnovationmarketing@gmail.com',
    subject VARCHAR(255),
    type VARCHAR(50), -- 'jewelry_order', 'cleaning_request', 'course_enrollment'
    related_id UUID,
    status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'failed', 'pending'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_jewelry_orders_user ON jewelry_orders(user_id);
CREATE INDEX idx_cleaning_professionals_status ON cleaning_professionals(status);
CREATE INDEX idx_cleaning_requests_status ON cleaning_requests(status);
CREATE INDEX idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_email_logs_type ON email_logs(type);
