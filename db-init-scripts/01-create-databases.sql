-- Create additional databases
CREATE DATABASE common;
CREATE DATABASE assets;

-- Create specific users
CREATE USER enthalpy_app WITH PASSWORD 's5tarbus*niCr';
CREATE USER enthalpy_admin WITH PASSWORD 'mor00nKiraj*niCr';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE common TO enthalpy_app;
GRANT ALL PRIVILEGES ON DATABASE assets TO enthalpy_app;
GRANT ALL PRIVILEGES ON DATABASE common TO enthalpy_admin;
GRANT ALL PRIVILEGES ON DATABASE assets TO enthalpy_admin;
