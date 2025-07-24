-- ==============================================
-- BİLDİRİM VE UYARI SİSTEMİ TABLOLARI
-- ==============================================

-- Bildirimler tablosu
CREATE TABLE IF NOT EXISTS bildirimler (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Bildirim türü
    bildirim_tipi ENUM('email', 'sms', 'browser', 'system') NOT NULL,
    bildirim_kategori ENUM('info', 'warning', 'error', 'success') NOT NULL,
    
    -- Alıcı bilgileri
    alici_personel_id BIGINT NULL,
    alici_email VARCHAR(255) NULL,
    alici_telefon VARCHAR(20) NULL,
    
    -- İçerik
    baslik VARCHAR(255) NOT NULL,
    mesaj TEXT NOT NULL,
    ekipman_id BIGINT NULL,
    
    -- Durum
    gonderim_durumu ENUM('pending', 'sent', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    hata_mesaji TEXT NULL,
    gonderim_tarihi TIMESTAMP NULL,
    okunma_tarihi TIMESTAMP NULL,
    
    -- Sistem
    created_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key'ler
    FOREIGN KEY (alici_personel_id) REFERENCES personel(id) ON DELETE CASCADE,
    FOREIGN KEY (ekipman_id) REFERENCES ekipman_envanteri(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES personel(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Otomatik uyarı kuralları
CREATE TABLE IF NOT EXISTS uyari_kurallari (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Kural bilgileri
    kural_adi VARCHAR(255) NOT NULL UNIQUE,
    kural_tipi ENUM('Garanti Sonu', 'Bakım Zamanı', 'Atama Süresi', 'Fiziksel Durum') NOT NULL,
    kural_detayi JSON NOT NULL,
    alici_roller JSON DEFAULT '["admin"]',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Sistem
    created_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key'ler
    FOREIGN KEY (created_by) REFERENCES personel(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index'ler
CREATE INDEX idx_bildirimler_alici_personel_id ON bildirimler(alici_personel_id);
CREATE INDEX idx_bildirimler_ekipman_id ON bildirimler(ekipman_id);
CREATE INDEX idx_bildirimler_gonderim_durumu ON bildirimler(gonderim_durumu);
CREATE INDEX idx_bildirimler_created_at ON bildirimler(created_at DESC);
CREATE INDEX idx_bildirimler_bildirim_tipi ON bildirimler(bildirim_tipi);
CREATE INDEX idx_bildirimler_bildirim_kategori ON bildirimler(bildirim_kategori);
CREATE INDEX idx_uyari_kurallari_kural_tipi ON uyari_kurallari(kural_tipi);
CREATE INDEX idx_uyari_kurallari_is_active ON uyari_kurallari(is_active); 