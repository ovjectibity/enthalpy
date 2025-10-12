-- Create additional databases
CREATE DATABASE enthalpy_production;

-- Create specific users
-- CREATE USER enthalpy_app WITH PASSWORD 's5tarbus*niCr';
CREATE USER enthalpy_admin WITH PASSWORD 'mor00nKiraj*niCr';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE enthalpy_production TO enthalpy_app;
GRANT ALL PRIVILEGES ON DATABASE enthalpy_production TO enthalpy_admin;

\c enthalpy_production;

CREATE SCHEMA IF NOT EXISTS common;
CREATE SCHEMA IF NOT EXISTS assets;

-- Grant privileges on all existing tables in the public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO enthalpy_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA common TO enthalpy_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA assets TO enthalpy_admin;

-- Grant privileges on all sequences (for SERIAL columns)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO enthalpy_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA common TO enthalpy_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA assets TO enthalpy_admin;

-- Grant schema usage (required to access tables)
GRANT USAGE ON SCHEMA public TO enthalpy_admin;
GRANT USAGE ON SCHEMA common TO enthalpy_admin;
GRANT USAGE ON SCHEMA assets TO enthalpy_admin;

-- For future tables created in this schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO enthalpy_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA common GRANT ALL ON TABLES TO enthalpy_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA assets GRANT ALL ON TABLES TO enthalpy_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO enthalpy_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA common GRANT ALL ON SEQUENCES TO enthalpy_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA assets GRANT ALL ON SEQUENCES TO enthalpy_admin;
