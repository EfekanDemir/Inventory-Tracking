-- ==============================================
-- Envanter Takip Sistemi - MySQL Veritabanı Kurulumu
-- ==============================================

-- Veritabanını oluştur
CREATE DATABASE IF NOT EXISTS inventory_tracking 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Veritabanını kullan
USE inventory_tracking;

-- Otomatik güncelleme için fonksiyon
DELIMITER $$
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER
DETERMINISTIC
BEGIN
    SET NEW.updated_at = NOW();
    RETURN NEW;
END$$
DELIMITER ; 