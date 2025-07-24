-- ==============================================
-- YENİ EKİPMAN ENVANTERİ TABLOSU
-- ==============================================

-- Önce eski tabloyu sil (eğer varsa)
DROP TABLE IF EXISTS ekipman_envanteri CASCADE;

-- Yeni ekipman envanteri tablosu
CREATE TABLE ekipman_envanteri (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Teknik Bilgiler (Foreign Key'ler)
    seri_no_id BIGINT NULL,
    mac_adresi_id BIGINT NULL,
    barkod VARCHAR(255) UNIQUE,
    
    -- Marka/Model Referansları
    marka_id BIGINT NULL,
    model_id BIGINT NULL,
    
    -- Lokasyon ve Atama Bilgileri
    lokasyon_id BIGINT NOT NULL,
    atanan_personel_id BIGINT NULL,
    
    -- Tarihler
    satin_alma_tarihi DATE NULL,
    garanti_bitis_tarihi DATE NULL,
    ofise_giris_tarihi DATE NULL,
    ofisten_cikis_tarihi DATE NULL,
    geri_donus_tarihi DATE NULL,
    
    -- Mali Bilgiler
    satin_alma_fiyati DECIMAL(10,2) NULL,
    amortisman_suresi INT NULL,
    defter_degeri DECIMAL(10,2) NULL,
    
    -- Durum Bilgileri
    fiziksel_durum ENUM('Çok İyi', 'İyi', 'Orta', 'Kötü', 'Arızalı') DEFAULT 'İyi',
    calismma_durumu ENUM('Çalışıyor', 'Arızalı', 'Bakımda', 'Hurdaya Ayrıldı') DEFAULT 'Çalışıyor',
    
    -- Ek Bilgiler
    aciklama TEXT NULL,
    ozel_notlar JSON NULL,
    
    -- Sistem Alanları
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    
    -- Soft Delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by BIGINT NULL,
    
    -- Foreign Key'ler
    FOREIGN KEY (seri_no_id) REFERENCES seri_numaralari(id) ON DELETE SET NULL,
    FOREIGN KEY (mac_adresi_id) REFERENCES mac_adresleri(id) ON DELETE SET NULL,
    FOREIGN KEY (marka_id) REFERENCES markalar(id) ON DELETE SET NULL,
    FOREIGN KEY (model_id) REFERENCES modeller(id) ON DELETE SET NULL,
    FOREIGN KEY (lokasyon_id) REFERENCES lokasyonlar(id) ON DELETE CASCADE,
    FOREIGN KEY (atanan_personel_id) REFERENCES personel(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES personel(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES personel(id) ON DELETE SET NULL,
    FOREIGN KEY (deleted_by) REFERENCES personel(id) ON DELETE SET NULL,
    
    -- Unique Constraint'ler (bir seri no veya MAC adresi sadece bir ekipmana atanabilir)
    UNIQUE KEY unique_seri_no_id (seri_no_id),
    UNIQUE KEY unique_mac_adresi_id (mac_adresi_id)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index'ler
CREATE INDEX idx_ekipman_marka_id ON ekipman_envanteri(marka_id);
CREATE INDEX idx_ekipman_model_id ON ekipman_envanteri(model_id);
CREATE INDEX idx_ekipman_lokasyon_id ON ekipman_envanteri(lokasyon_id);
CREATE INDEX idx_ekipman_atanan_personel_id ON ekipman_envanteri(atanan_personel_id);
CREATE INDEX idx_ekipman_seri_no_id ON ekipman_envanteri(seri_no_id);
CREATE INDEX idx_ekipman_mac_adresi_id ON ekipman_envanteri(mac_adresi_id);
CREATE INDEX idx_ekipman_barkod ON ekipman_envanteri(barkod);
CREATE INDEX idx_ekipman_created_at ON ekipman_envanteri(created_at DESC);
CREATE INDEX idx_ekipman_is_deleted ON ekipman_envanteri(is_deleted);
CREATE INDEX idx_ekipman_deleted_at ON ekipman_envanteri(deleted_at DESC);
CREATE INDEX idx_ekipman_deleted_by ON ekipman_envanteri(deleted_by);
CREATE INDEX idx_ekipman_fiziksel_durum ON ekipman_envanteri(fiziksel_durum);
CREATE INDEX idx_ekipman_calismma_durumu ON ekipman_envanteri(calismma_durumu);
CREATE INDEX idx_ekipman_satin_alma_tarihi ON ekipman_envanteri(satin_alma_tarihi);
CREATE INDEX idx_ekipman_garanti_bitis_tarihi ON ekipman_envanteri(garanti_bitis_tarihi);

-- Tablo oluşturuldu mesajı
SELECT 'Yeni ekipman_envanteri tablosu başarıyla oluşturuldu!' as mesaj;
SELECT CONCAT('Toplam ', COUNT(*), ' index oluşturuldu') as index_sayisi FROM information_schema.statistics WHERE table_name = 'ekipman_envanteri'; 