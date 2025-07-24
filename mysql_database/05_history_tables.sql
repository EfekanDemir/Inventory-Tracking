-- ==============================================
-- GEÇMİŞ VE HAREKET TABLOLARI
-- ==============================================

-- Ekipman geçmişi tablosu (Silinen/Arşivlenen Kayıtlar)
CREATE TABLE IF NOT EXISTS ekipman_gecmisi (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Orijinal kayıt ID'si (referans için)
    orijinal_id BIGINT NULL,
    
    -- Teknik Bilgiler
    seri_no VARCHAR(255) NULL,
    mac_adresi VARCHAR(255) NULL,
    barkod VARCHAR(255) NULL,
    
    -- Marka/Model Referansları
    marka_id BIGINT NULL,
    model_id BIGINT NULL,
    
    -- Lokasyon ve Atama Bilgileri
    lokasyon_id BIGINT NULL,
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
    fiziksel_durum VARCHAR(50) NULL,
    calismma_durumu VARCHAR(50) NULL,
    
    -- Ek Bilgiler
    aciklama TEXT NULL,
    ozel_notlar JSON NULL,
    
    -- Arşiv Bilgileri
    arsiv_nedeni ENUM('SILINDI', 'OFISE_GIRDI', 'HURDAYA_AYRILDI') NOT NULL,
    arsiv_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    arsiv_yapan_id BIGINT NULL,
    arsiv_notu TEXT NULL,
    
    -- Sistem Alanları
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key'ler
    FOREIGN KEY (marka_id) REFERENCES markalar(id) ON DELETE SET NULL,
    FOREIGN KEY (model_id) REFERENCES modeller(id) ON DELETE SET NULL,
    FOREIGN KEY (lokasyon_id) REFERENCES lokasyonlar(id) ON DELETE SET NULL,
    FOREIGN KEY (atanan_personel_id) REFERENCES personel(id) ON DELETE SET NULL,
    FOREIGN KEY (arsiv_yapan_id) REFERENCES personel(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES personel(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES personel(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Envanter hareketleri tablosu
CREATE TABLE IF NOT EXISTS envanter_hareketleri (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Ekipman referansı
    ekipman_id BIGINT NOT NULL,
    
    -- Hareket bilgileri
    hareket_tipi ENUM('EKLEME', 'GUNCELLEME', 'SILME', 'TAŞIMA', 'ATAMA', 'DURUM_DEGISIKLIGI') NOT NULL,
    hareket_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Eski ve yeni değerler
    eski_degerler JSON NULL,
    yeni_degerler JSON NULL,
    degisiklik_detaylari JSON NULL,
    degisiklik_sayisi INT DEFAULT 0,
    
    -- Yapan kişi
    yapan_personel_id BIGINT NULL,
    
    -- Ek bilgiler
    aciklama TEXT NULL,
    ip_adresi VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    -- Foreign Key'ler
    FOREIGN KEY (ekipman_id) REFERENCES ekipman_envanteri(id) ON DELETE CASCADE,
    FOREIGN KEY (yapan_personel_id) REFERENCES personel(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bakım kayıtları tablosu
CREATE TABLE IF NOT EXISTS bakim_kayitlari (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Ekipman referansı
    ekipman_id BIGINT NOT NULL,
    
    -- Bakım bilgileri
    bakim_tipi ENUM('PERIYODIK', 'ARIZA', 'KORUYUCU', 'DIGER') NOT NULL,
    bakim_tarihi DATE NOT NULL,
    planlanan_tarih DATE NULL,
    tamamlanma_tarihi TIMESTAMP NULL,
    
    -- Bakım detayları
    aciklama TEXT NOT NULL,
    yapilan_isler TEXT NULL,
    kullanilan_parcalar TEXT NULL,
    maliyet DECIMAL(10,2) NULL,
    
    -- Durum
    durum ENUM('PLANLANDI', 'DEVAM_EDIYOR', 'TAMAMLANDI', 'IPTAL') DEFAULT 'PLANLANDI',
    
    -- Yapan kişi/firma
    yapan_kisi VARCHAR(255) NULL,
    yapan_firma VARCHAR(255) NULL,
    
    -- Sistem
    created_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key'ler
    FOREIGN KEY (ekipman_id) REFERENCES ekipman_envanteri(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES personel(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index'ler
CREATE INDEX idx_ekipman_gecmisi_arsiv_tarihi ON ekipman_gecmisi(arsiv_tarihi DESC);
CREATE INDEX idx_ekipman_gecmisi_arsiv_nedeni ON ekipman_gecmisi(arsiv_nedeni);
CREATE INDEX idx_ekipman_gecmisi_orijinal_id ON ekipman_gecmisi(orijinal_id);
CREATE INDEX idx_envanter_hareketleri_ekipman_id ON envanter_hareketleri(ekipman_id);
CREATE INDEX idx_envanter_hareketleri_hareket_tarihi ON envanter_hareketleri(hareket_tarihi DESC);
CREATE INDEX idx_envanter_hareketleri_hareket_tipi ON envanter_hareketleri(hareket_tipi);
CREATE INDEX idx_envanter_hareketleri_yapan_personel_id ON envanter_hareketleri(yapan_personel_id);
CREATE INDEX idx_bakim_kayitlari_ekipman_id ON bakim_kayitlari(ekipman_id);
CREATE INDEX idx_bakim_kayitlari_bakim_tarihi ON bakim_kayitlari(bakim_tarihi DESC);
CREATE INDEX idx_bakim_kayitlari_durum ON bakim_kayitlari(durum);
CREATE INDEX idx_bakim_kayitlari_planlanan_tarih ON bakim_kayitlari(planlanan_tarih); 