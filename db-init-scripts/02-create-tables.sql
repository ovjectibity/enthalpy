-- ==========================================
-- COMMON DATABASE SCHEMA
-- ==========================================

\c common;
CREATE SCHEMA common;

-- Create groups table first (referenced by users)
CREATE TABLE groups (
    group_id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    industry VARCHAR(255) NOT NULL,
    address TEXT NOT NULL
);

-- Create users table
CREATE TABLE users (
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
    CONSTRAINT fk_users_group FOREIGN KEY (group_id) REFERENCES groups(group_id)
);

-- Create account table
CREATE TABLE account (
    user_id VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    login_type VARCHAR(50) NOT NULL
);

-- ==========================================
-- ASSETS DATABASE SCHEMA
-- ==========================================

\c assets;
CREATE SCHEMA assets;

-- Create hypotheses table
CREATE TABLE hypotheses (
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
    -- CONSTRAINT fk_hypotheses_user FOREIGN KEY (user_id) REFERENCES common.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_hypotheses_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create experiments table
CREATE TABLE experiments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(255) NOT NULL,
    linked_hypotheses INTEGER[],
    plan TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    -- CONSTRAINT fk_experiments_user FOREIGN KEY (user_id) REFERENCES common.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_experiments_project FOREIGN KEY (project_id) REFERENCES assets.projects(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create objectives table
CREATE TABLE objectives (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    -- CONSTRAINT fk_objectives_user FOREIGN KEY (user_id) REFERENCES common.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_objectives_project FOREIGN KEY (project_id) REFERENCES assets.projects(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create context table
CREATE TABLE context (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    -- CONSTRAINT fk_context_user FOREIGN KEY (user_id) REFERENCES common.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_context_project FOREIGN KEY (project_id) REFERENCES assets.projects(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create metrics table
CREATE TABLE metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    formula TEXT NOT NULL,
    -- CONSTRAINT fk_metrics_user FOREIGN KEY (user_id) REFERENCES common.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_metrics_project FOREIGN KEY (project_id) REFERENCES assets.projects(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create threads table
CREATE TABLE threads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    agent_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    chat_id INTEGER NOT NULL,
    -- CONSTRAINT fk_threads_user FOREIGN KEY (user_id) REFERENCES common.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_threads_project FOREIGN KEY (project_id) REFERENCES assets.projects(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    -- CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES common.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ==========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==========================================

-- Common database indexes
\c common;
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_group_id ON users(group_id);
CREATE INDEX idx_groups_domain ON groups(domain);
CREATE INDEX idx_account_login_type ON account(login_type);

-- User_assets database indexes
\c assets;
CREATE INDEX idx_hypotheses_user_target ON hypotheses(user_target);
CREATE INDEX idx_experiments_user_id ON experiments(user_id);
CREATE INDEX idx_experiments_status ON experiments(status);
CREATE INDEX idx_objectives_user_id ON objectives(user_id);
CREATE INDEX idx_context_type ON context(type);
CREATE INDEX idx_threads_user_id ON threads(user_id);
CREATE INDEX idx_threads_chat_id ON threads(chat_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_hypotheses_project_id ON hypotheses(project_id);
CREATE INDEX idx_experiments_project_id ON experiments(project_id);
CREATE INDEX idx_objectives_project_id ON objectives(project_id);
CREATE INDEX idx_context_project_id ON context(project_id);
CREATE INDEX idx_metrics_project_id ON metrics(project_id);
CREATE INDEX idx_threads_project_id ON threads(project_id);

-- ==========================================
-- ADD TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ==========================================

-- Function to update last_updated_at timestamp
\c common;
CREATE OR REPLACE FUNCTION update_last_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_at();

\c assets;
CREATE OR REPLACE FUNCTION update_last_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all relevant tables
CREATE TRIGGER trigger_hypotheses_updated_at
    BEFORE UPDATE ON hypotheses
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_at();

CREATE TRIGGER trigger_experiments_updated_at
    BEFORE UPDATE ON experiments
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_at();

CREATE TRIGGER trigger_objectives_updated_at
    BEFORE UPDATE ON objectives
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_at();

CREATE TRIGGER trigger_context_updated_at
    BEFORE UPDATE ON context
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_at();

CREATE TRIGGER trigger_metrics_updated_at
    BEFORE UPDATE ON metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_at();

CREATE TRIGGER trigger_threads_updated_at
    BEFORE UPDATE ON threads
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_at();

CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_at();
