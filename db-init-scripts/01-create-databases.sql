-- Create additional databases
CREATE DATABASE common;
CREATE DATABASE assets;

-- Create specific users
CREATE USER enthalpy_app WITH PASSWORD 's5tarbus*niCr';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE common TO enthalpy_app;
GRANT ALL PRIVILEGES ON DATABASE assets TO enthalpy_app;
