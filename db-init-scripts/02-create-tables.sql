-- ==========================================
-- COMMON DATABASE SCHEMA
-- ==========================================
\c enthalpy_production;

-- Create groups table first (referenced by users)
CREATE TABLE common.groups (
    group_id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    industry VARCHAR(255) NOT NULL,
    address TEXT NOT NULL
);

-- Create users table
CREATE TABLE common.users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    signedup_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    email_verified_at TIMESTAMP,
    org_role VARCHAR(100) NOT NULL,
    group_id INTEGER NOT NULL,
    CONSTRAINT fk_users_group FOREIGN KEY (group_id) REFERENCES common.groups(group_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create account table
CREATE TABLE common.account (
    user_id VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    login_type VARCHAR(50) NOT NULL
);

-- ==========================================
-- ASSETS DATABASE SCHEMA
-- ==========================================

-- Create projects table (must be created before other tables referencing it)
CREATE TABLE assets.projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES common.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create hypotheses table
CREATE TABLE assets.hypotheses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    action TEXT NOT NULL,
    expected_outcome TEXT NOT NULL,
    rationale TEXT NOT NULL,
    user_target VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    linked_experiments INTEGER[],
    linked_context INTEGER[],
    linked_objectives INTEGER[],
    linked_metrics INTEGER[],
    CONSTRAINT fk_hypotheses_user FOREIGN KEY (user_id) REFERENCES common.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_hypotheses_project FOREIGN KEY (project_id) REFERENCES assets.projects(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create experiments table
CREATE TABLE assets.experiments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(255) NOT NULL,
    linked_hypotheses INTEGER[],
    plan TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    CONSTRAINT fk_experiments_user FOREIGN KEY (user_id) REFERENCES common.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_experiments_project FOREIGN KEY (project_id) REFERENCES assets.projects(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create objectives table
CREATE TABLE assets.objectives (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    CONSTRAINT fk_objectives_user FOREIGN KEY (user_id) REFERENCES common.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_objectives_project FOREIGN KEY (project_id) REFERENCES assets.projects(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create metrics table
CREATE TABLE assets.metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    formula TEXT NOT NULL,
    priority TEXT,
    metric_timeframe TEXT,
    retrieval_policy TEXT,
    CONSTRAINT fk_metrics_user FOREIGN KEY (user_id) REFERENCES common.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_metrics_project FOREIGN KEY (project_id) REFERENCES assets.projects(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ==========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==========================================
-- Common database indexes
CREATE INDEX idx_users_email ON common.users(email);
CREATE INDEX idx_users_group_id ON common.users(group_id);
CREATE INDEX idx_groups_domain ON common.groups(domain);
CREATE INDEX idx_account_login_type ON common.account(login_type);

-- User_assets database indexes
CREATE INDEX idx_hypotheses_user_target ON assets.hypotheses(user_target);
CREATE INDEX idx_hypotheses_project_id ON assets.hypotheses(project_id);
CREATE INDEX idx_experiments_user_id ON assets.experiments(user_id);
CREATE INDEX idx_experiments_status ON assets.experiments(status);
CREATE INDEX idx_experiments_project_id ON assets.experiments(project_id);
CREATE INDEX idx_objectives_user_id ON assets.objectives(user_id);
CREATE INDEX idx_objectives_project_id ON assets.objectives(project_id);
CREATE INDEX idx_projects_user_id ON assets.projects(user_id);
CREATE INDEX idx_metrics_project_id ON assets.metrics(project_id);
CREATE INDEX idx_metrics_user_id ON assets.metrics(user_id);

-- ==========================================
-- ADD TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ==========================================
-- Function to update last_updated_at timestamp for common schema tables
CREATE OR REPLACE FUNCTION common.update_last_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON common.users
    FOR EACH ROW
    EXECUTE FUNCTION common.update_last_updated_at();

-- Function to update last_updated_at timestamp for assets schema tables
CREATE OR REPLACE FUNCTION assets.update_last_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all relevant tables in assets schema
CREATE TRIGGER trigger_hypotheses_updated_at
    BEFORE UPDATE ON assets.hypotheses
    FOR EACH ROW
    EXECUTE FUNCTION assets.update_last_updated_at();

CREATE TRIGGER trigger_experiments_updated_at
    BEFORE UPDATE ON assets.experiments
    FOR EACH ROW
    EXECUTE FUNCTION assets.update_last_updated_at();

CREATE TRIGGER trigger_objectives_updated_at
    BEFORE UPDATE ON assets.objectives
    FOR EACH ROW
    EXECUTE FUNCTION assets.update_last_updated_at();

CREATE TRIGGER trigger_metrics_updated_at
    BEFORE UPDATE ON assets.metrics
    FOR EACH ROW
    EXECUTE FUNCTION assets.update_last_updated_at();

CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON assets.projects
    FOR EACH ROW
    EXECUTE FUNCTION assets.update_last_updated_at();
