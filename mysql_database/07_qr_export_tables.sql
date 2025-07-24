-- ==============================================
-- QR KOD VE EXPORT SİSTEMİ TABLOLARI
-- ==============================================

-- QR kod kayıtları
CREATE TABLE IF NOT EXISTS qr_kodlari (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Ekipman referansı
    ekipman_id BIGINT NOT NULL,
    
    -- QR kod bilgileri
    qr_kod VARCHAR(255) NOT NULL UNIQUE,
    qr_tipi ENUM('ekipman', 'lokasyon', 'personel') DEFAULT 'ekipman',
    qr_boyutu ENUM('kucuk', 'orta', 'buyuk') DEFAULT 'orta',
    
    -- QR kod içeriği
    qr_icerik JSON NOT NULL,
    qr_url VARCHAR(500) NULL,
    
    -- Durum
    is_active BOOLEAN DEFAULT TRUE,
    son_okuma_tarihi TIMESTAMP NULL,
    okuma_sayisi INT DEFAULT 0,
    
    -- Sistem
    created_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key'ler
    FOREIGN KEY (ekipman_id) REFERENCES ekipman_envanteri(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES personel(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Export geçmişi
CREATE TABLE IF NOT EXISTS export_gecmisi (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Export bilgileri
    export_tipi ENUM('excel', 'pdf', 'csv', 'json') NOT NULL,
    export_kategori ENUM('envanter', 'rapor', 'bakim', 'hareket') NOT NULL,
    dosya_adi VARCHAR(255) NOT NULL,
    dosya_boyutu BIGINT NULL,
    dosya_yolu VARCHAR(500) NULL,
    
    -- Filtreler ve parametreler
    filtreler JSON NULL,
    parametreler JSON NULL,
    
    -- Durum
    durum ENUM('hazirlaniyor', 'tamamlandi', 'hata', 'iptal') DEFAULT 'hazirlaniyor',
    hata_mesaji TEXT NULL,
    
    -- Yapan kişi
    yapan_personel_id BIGINT NULL,
    
    -- Sistem
    baslangic_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    bitis_tarihi TIMESTAMP NULL,
    
    -- Foreign Key'ler
    FOREIGN KEY (yapan_personel_id) REFERENCES personel(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rapor şablonları
CREATE TABLE IF NOT EXISTS rapor_sablonlari (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Şablon bilgileri
    sablon_adi VARCHAR(255) NOT NULL UNIQUE,
    sablon_aciklama TEXT NULL,
    sablon_kategori ENUM('envanter', 'bakim', 'hareket', 'maliyet', 'ozel') NOT NULL,
    
    -- Şablon içeriği
    sablon_icerik JSON NOT NULL,
    sablon_ayarlari JSON NULL,
    
    -- Durum
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT FALSE,
    
    -- Sistem
    created_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key'ler
    FOREIGN KEY (created_by) REFERENCES personel(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sistem ayarları
CREATE TABLE IF NOT EXISTS sistem_ayarlari (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Ayar bilgileri
    kategori VARCHAR(100) NOT NULL,
    ayar_anahtari VARCHAR(255) NOT NULL,
    ayar_degeri JSON NOT NULL,
    data_tipi ENUM('string', 'number', 'boolean', 'json', 'date') DEFAULT 'string',
    aciklama TEXT NULL,
    varsayilan_deger JSON NULL,
    
    -- Erişim kontrolü
    is_public BOOLEAN DEFAULT FALSE,
    is_editable BOOLEAN DEFAULT TRUE,
    
    -- Sistem
    updated_by BIGINT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Unique constraint
    UNIQUE KEY unique_kategori_anahtar (kategori, ayar_anahtari),
    
    -- Foreign Key'ler
    FOREIGN KEY (updated_by) REFERENCES personel(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index'ler
CREATE INDEX idx_qr_kodlari_ekipman_id ON qr_kodlari(ekipman_id);
CREATE INDEX idx_qr_kodlari_qr_kod ON qr_kodlari(qr_kod);
CREATE INDEX idx_qr_kodlari_is_active ON qr_kodlari(is_active);
CREATE INDEX idx_qr_kodlari_qr_tipi ON qr_kodlari(qr_tipi);
CREATE INDEX idx_export_gecmisi_yapan_personel_id ON export_gecmisi(yapan_personel_id);
CREATE INDEX idx_export_gecmisi_export_tipi ON export_gecmisi(export_tipi);
CREATE INDEX idx_export_gecmisi_durum ON export_gecmisi(durum);
CREATE INDEX idx_export_gecmisi_baslangic_tarihi ON export_gecmisi(baslangic_tarihi DESC);
CREATE INDEX idx_rapor_sablonlari_sablon_kategori ON rapor_sablonlari(sablon_kategori);
CREATE INDEX idx_rapor_sablonlari_is_active ON rapor_sablonlari(is_active);
CREATE INDEX idx_rapor_sablonlari_is_public ON rapor_sablonlari(is_public);
CREATE INDEX idx_sistem_ayarlari_kategori ON sistem_ayarlari(kategori);
CREATE INDEX idx_sistem_ayarlari_is_public ON sistem_ayarlari(is_public); 