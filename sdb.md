/**
 * Database schema for PMU performance tracking and horse racing analytics.
 * @package PMU_Analytics
 */

-- Table for Jockeys and Drivers
CREATE TABLE jockeys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Trainers
CREATE TABLE trainers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Horses (includes self-referencing genealogy)
CREATE TABLE horses (
    id_cheval_pmu VARCHAR(255) PRIMARY KEY, -- Using 'idCheval' from JSON
    name VARCHAR(255) NOT NULL,
    sex ENUM('MALES', 'FEMELLES', 'HONGRES'),
    age INT,
    father_id VARCHAR(255),
    mother_id VARCHAR(255),
    dam_sire_name VARCHAR(255), -- Nom du père de mère
    breed VARCHAR(100), -- ex: PUR-SANG
    FOREIGN KEY (father_id) REFERENCES horses(id_cheval_pmu),
    FOREIGN KEY (mother_id) REFERENCES horses(id_cheval_pmu)
);

-- Table for Races (Meeting and Race context)
CREATE TABLE races (
    id INT AUTO_INCREMENT PRIMARY KEY,
    race_date DATETIME NOT NULL,
    hippodrome VARCHAR(255),
    distance INT,
    discipline VARCHAR(50), -- p (plat), a (attelé), etc.
    track_condition VARCHAR(100)
);

-- Table for Individual Performances
CREATE TABLE performances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    horse_id VARCHAR(255),
    race_id INT,
    jockey_id INT,
    trainer_id INT,
    rank INT, -- 0 for D/Dai/Tombé
    weight INT, -- grams
    draw INT, -- placeCorde
    raw_musique TEXT,
    odds_ref FLOAT,
    gains_race INT,
    FOREIGN KEY (horse_id) REFERENCES horses(id_cheval_pmu),
    FOREIGN KEY (race_id) REFERENCES races(id),
    FOREIGN KEY (jockey_id) REFERENCES jockeys(id),
    FOREIGN KEY (trainer_id) REFERENCES trainers(id)
);