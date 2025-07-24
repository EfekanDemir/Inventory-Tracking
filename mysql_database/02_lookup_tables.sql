-- ==============================================
-- LOOKUP TABLOLARI (Master Data)
-- ==============================================

-- Markalar tablosu
CREATE TABLE IF NOT EXISTS markalar (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    marka_adi VARCHAR(255) NOT NULL UNIQUE,
    aciklama TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modeller tablosu
CREATE TABLE IF NOT EXISTS modeller (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    marka_id BIGINT NOT NULL,
    model_adi VARCHAR(255) NOT NULL,
    kategori ENUM('Bilgisayar', 'Laptop', 'Tablet', 'Telefon', 'Aksesuar', 'Diğer') DEFAULT 'Bilgisayar',
    teknik_ozellikler JSON,
    aciklama TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY unique_marka_model (marka_id, model_adi),
    FOREIGN KEY (marka_id) REFERENCES markalar(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Departmanlar tablosu
CREATE TABLE IF NOT EXISTS departmanlar (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    departman_adi VARCHAR(255) NOT NULL UNIQUE,
    aciklama TEXT,
    manager_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lokasyonlar tablosu
CREATE TABLE IF NOT EXISTS lokasyonlar (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lokasyon_kodu VARCHAR(50) NOT NULL UNIQUE,
    lokasyon_adi VARCHAR(255) NOT NULL,
    lokasyon_tipi ENUM('DEPO', 'KULLANICI', 'EGITIM', 'BAKIM', 'HURDA') NOT NULL,
    departman_id BIGINT,
    adres TEXT,
    sorumlu_kisi VARCHAR(255),
    aciklama TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (departman_id) REFERENCES departmanlar(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Personel tablosu
CREATE TABLE IF NOT EXISTS personel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36), -- UUID için
    sicil_no VARCHAR(50) UNIQUE,
    ad VARCHAR(100) NOT NULL,
    soyad VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefon VARCHAR(20),
    departman_id BIGINT,
    unvan VARCHAR(100),
    baslangic_tarihi DATE,
    cikis_tarihi DATE,
    rol ENUM('admin', 'manager', 'user', 'viewer') NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (departman_id) REFERENCES departmanlar(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index'ler
CREATE INDEX idx_modeller_marka_id ON modeller(marka_id);
CREATE INDEX idx_modeller_kategori ON modeller(kategori);
CREATE INDEX idx_personel_departman_id ON personel(departman_id);
CREATE INDEX idx_personel_email ON personel(email);
CREATE INDEX idx_personel_sicil_no ON personel(sicil_no);
CREATE INDEX idx_personel_is_active ON personel(is_active);
CREATE INDEX idx_lokasyonlar_departman_id ON lokasyonlar(departman_id);
CREATE INDEX idx_lokasyonlar_lokasyon_tipi ON lokasyonlar(lokasyon_tipi); 