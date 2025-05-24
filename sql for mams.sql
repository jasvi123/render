-- Military Asset Management System SQL schema for MySQL Workbench

-- Drop tables if they exist to allow re-running this script without errors
DROP TABLE IF EXISTS Transactions;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Roles;
DROP TABLE IF EXISTS Assets;
DROP TABLE IF EXISTS Bases;

-- Table to store military bases
CREATE TABLE Bases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- Table to store different types of assets
CREATE TABLE Assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    opening_balance INT DEFAULT 0,
    closing_balance INT DEFAULT 0
) ENGINE=InnoDB;

-- Table to store user roles
CREATE TABLE Roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB;

-- Table to store users with roles
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    FOREIGN KEY (role_id) REFERENCES Roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Table to store all transactions related to assets
CREATE TABLE Transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    base_id INT NOT NULL,
    transaction_type ENUM('purchase', 'transfer_in', 'transfer_out', 'assignment', 'expended') NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL,
    FOREIGN KEY (asset_id) REFERENCES Assets(id) ON DELETE CASCADE,
    FOREIGN KEY (base_id) REFERENCES Bases(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Insert default roles
INSERT INTO Roles (name) VALUES ('Admin'), ('Base Commander'), ('Logistics Officer');
