-- ==============================================
-- SERİ NUMARALARI VE MAC ADRESLERİ TABLOLARI
-- ==============================================

-- Seri numaraları tablosu
CREATE TABLE IF NOT EXISTS seri_numaralari (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    model_id BIGINT NOT NULL,
    seri_no VARCHAR(255) NOT NULL UNIQUE,
    aciklama TEXT,
    kullanim_durumu ENUM('MUSAIT', 'KULLANIMDA', 'ARIZALI') DEFAULT 'MUSAIT',
    atanan_ekipman_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (model_id) REFERENCES modeller(id) ON DELETE CASCADE,
    FOREIGN KEY (atanan_ekipman_id) REFERENCES ekipman_envanteri(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MAC adresleri tablosu
CREATE TABLE IF NOT EXISTS mac_adresleri (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    model_id BIGINT,
    mac_adresi VARCHAR(255) NOT NULL UNIQUE,
    aciklama TEXT,
    kullanim_durumu ENUM('MUSAIT', 'KULLANIMDA', 'ARIZALI') DEFAULT 'MUSAIT',
    atanan_ekipman_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (model_id) REFERENCES modeller(id) ON DELETE CASCADE,
    FOREIGN KEY (atanan_ekipman_id) REFERENCES ekipman_envanteri(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index'ler
CREATE INDEX idx_seri_numaralari_model_id ON seri_numaralari(model_id);
CREATE INDEX idx_seri_numaralari_seri_no ON seri_numaralari(seri_no);
CREATE INDEX idx_seri_numaralari_kullanim_durumu ON seri_numaralari(kullanim_durumu);
CREATE INDEX idx_seri_numaralari_atanan_ekipman_id ON seri_numaralari(atanan_ekipman_id);
CREATE INDEX idx_mac_adresleri_model_id ON mac_adresleri(model_id);
CREATE INDEX idx_mac_adresleri_mac_adresi ON mac_adresleri(mac_adresi);
CREATE INDEX idx_mac_adresleri_kullanim_durumu ON mac_adresleri(kullanim_durumu);
CREATE INDEX idx_mac_adresleri_atanan_ekipman_id ON mac_adresleri(atanan_ekipman_id); 