-- seed.sql
-- Run this to create tables and insert demo data
-- Usage: mysql -u root -p crm_db < seed.sql

-- =================== CREATE TABLES ===================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(100) DEFAULT 'Salesperson',
  phone VARCHAR(20),
  avatar VARCHAR(500),
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  status VARCHAR(100) DEFAULT 'New',
  priority VARCHAR(50) DEFAULT 'Medium',
  -- ADDED: lead_type stores "our" or "collab"
  lead_type VARCHAR(50) DEFAULT 'our',
  -- ADDED: all previously missing fields
  location VARCHAR(255),
  requirement TEXT,
  description TEXT,
  source VARCHAR(100) DEFAULT 'Manual',
  deal_value DECIMAL(15,2),
  follow_up_date DATE,
  assigned_user_id VARCHAR(50),
  assigned_user_name VARCHAR(255),
  is_shared TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =================== MIGRATION (if table exists) ===================
-- Run these only if your leads table already exists without these columns:

-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type VARCHAR(50) DEFAULT 'our';
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS location VARCHAR(255);
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS requirement TEXT;
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS description TEXT;
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'Manual';
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value DECIMAL(15,2);
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_date DATE;
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_user_id VARCHAR(50);
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_user_name VARCHAR(255);

-- =================== SEED USERS ===================
-- NOTE: passwords are plain text here for dev. Use bcrypt in production.

INSERT IGNORE INTO users (name, email, password, role, phone, is_active) VALUES
('Admin User',    'admin@leadflow.com',   'admin123',   'Admin',       '9876543210', 1),
('Manager User',  'manager@leadflow.com', 'manager123', 'Manager',     '9876543211', 1),
('Sales User',    'sales@leadflow.com',   'sales123',   'Salesperson', '9876543212', 1);

-- =================== SEED DEMO LEADS ===================

INSERT IGNORE INTO leads 
  (name, phone, email, status, priority, lead_type, location, requirement, description, source, deal_value, follow_up_date, assigned_user_id, assigned_user_name)
VALUES
  ('Vikram Patel',   '9988776655', 'vikram@email.com',  'Closed',    'High',   'our',    'Mumbai, Maharashtra', 'Looking for 3BHK apartment in Bandra area, budget 1.5Cr', 'Referred by existing client.', 'Referral',    15000000, NULL,       '1', 'Admin User'),
  ('Sneha Krishnan', '9877665544', 'sneha@gmail.com',   'Follow-up', 'High',   'our',    'Bangalore, Karnataka', 'Software development project for e-commerce platform', 'CTO of mid-size company.', 'Website',     800000,   CURDATE(), '2', 'Manager User'),
  ('Anand Kumar',    '9765432109', 'anand@business.com','Qualified', 'High',   'collab', 'Chennai, Tamil Nadu', 'ERP software implementation for 50+ users', 'Budget approved.', 'Cold Call',   2500000,  DATE_ADD(CURDATE(), INTERVAL 3 DAY), '3', 'Sales User'),
  ('Meera Reddy',    '9654321098', 'meera@startup.io',  'New',       'Medium', 'collab', 'Hyderabad, Telangana', 'CRM implementation for sales team of 20', 'Found us on LinkedIn.', 'Social Media', 350000, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '3', 'Sales User');
