-- ✅ COMPLETE SUPABASE DATABASE SCRIPT
-- 🚀 Kusursuz Envanter Takip Sistemi için Tam Veritabanı
-- 📅 Oluşturulma Tarihi: 2025-01-24
-- 🔧 Versiyon: 1.0.0

-- =================================================================================
-- 1. VERITABANI TEMİZLEME VE HAZIRLIK
-- =================================================================================

-- Mevcut tabloları temizle (gerekirse)
DROP TABLE IF EXISTS ekipman_envanteri CASCADE;
DROP TABLE IF EXISTS seri_numaralari CASCADE;
DROP TABLE IF EXISTS mac_adresleri CASCADE;
DROP TABLE IF EXISTS modeller CASCADE;
DROP TABLE IF EXISTS markalar CASCADE;
DROP TABLE IF EXISTS lokasyonlar CASCADE;
DROP TABLE IF EXISTS personel CASCADE;
DROP TABLE IF EXISTS departmanlar CASCADE;

-- Extensions'ları aktifleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =================================================================================
-- 2. DEPARTMANLAR TABLOSU
-- =================================================================================

CREATE TABLE departmanlar (
    id SERIAL PRIMARY KEY,
    departman_kodu VARCHAR(10) UNIQUE NOT NULL CHECK (LENGTH(departman_kodu) >= 2),
    departman_adi VARCHAR(100) NOT NULL CHECK (LENGTH(departman_adi) >= 2),
    aciklama TEXT,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departmanlar için trigger (updated_at otomatik güncellemesi)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_departmanlar_updated_at 
    BEFORE UPDATE ON departmanlar 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================================
-- 3. PERSONEL TABLOSU
-- =================================================================================

CREATE TABLE personel (
    id SERIAL PRIMARY KEY,
    sicil_no VARCHAR(20) UNIQUE NOT NULL,
    ad VARCHAR(50) NOT NULL CHECK (LENGTH(ad) >= 2),
    soyad VARCHAR(50) NOT NULL CHECK (LENGTH(soyad) >= 2),
    email VARCHAR(100) UNIQUE,
    telefon VARCHAR(20),
    departman_id INTEGER NOT NULL REFERENCES departmanlar(id) ON DELETE RESTRICT,
    pozisyon VARCHAR(100),
    ise_giris_tarihi DATE,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Email formatı kontrolü
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    -- Telefon formatı kontrolü
    CONSTRAINT valid_telefon CHECK (telefon ~ '^[0-9\s\-\+\(\)]+$')
);

CREATE TRIGGER update_personel_updated_at 
    BEFORE UPDATE ON personel 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sicil numarası otomatik oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION generate_sicil_no()
RETURNS TRIGGER AS $$
DECLARE
    dept_code VARCHAR(10);
    next_number INTEGER;
    new_sicil VARCHAR(20);
BEGIN
    -- Departman kodunu al
    SELECT departman_kodu INTO dept_code 
    FROM departmanlar 
    WHERE id = NEW.departman_id;
    
    -- Bu departmandaki son sicil numarasını bul
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(sicil_no FROM LENGTH(dept_code) + 2) AS INTEGER)), 
        0
    ) + 1 INTO next_number
    FROM personel 
    WHERE sicil_no LIKE dept_code || '-%';
    
    -- Yeni sicil numarasını oluştur
    NEW.sicil_no := dept_code || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_sicil_no
    BEFORE INSERT ON personel
    FOR EACH ROW
    WHEN (NEW.sicil_no IS NULL OR NEW.sicil_no = '')
    EXECUTE FUNCTION generate_sicil_no();

-- =================================================================================
-- 4. LOKASYONLAR TABLOSU
-- =================================================================================

CREATE TABLE lokasyonlar (
    id SERIAL PRIMARY KEY,
    lokasyon_kodu VARCHAR(20) UNIQUE NOT NULL,
    lokasyon_adi VARCHAR(100) NOT NULL CHECK (LENGTH(lokasyon_adi) >= 2),
    lokasyon_tipi VARCHAR(20) NOT NULL CHECK (lokasyon_tipi IN ('OFIS', 'DEPO', 'SAHA', 'UZAK_CALISMA', 'BAKIM')),
    departman_id INTEGER REFERENCES departmanlar(id) ON DELETE SET NULL,
    adres TEXT,
    kapasite INTEGER CHECK (kapasite > 0),
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_lokasyonlar_updated_at 
    BEFORE UPDATE ON lokasyonlar 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================================
-- 5. MARKALAR TABLOSU
-- =================================================================================

CREATE TABLE markalar (
    id SERIAL PRIMARY KEY,
    marka_kodu VARCHAR(10) UNIQUE NOT NULL,
    marka_adi VARCHAR(100) NOT NULL CHECK (LENGTH(marka_adi) >= 2),
    aciklama TEXT,
    website VARCHAR(255),
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Website URL formatı kontrolü
    CONSTRAINT valid_website CHECK (website IS NULL OR website ~* '^https?://[^\s/$.?#].[^\s]*$')
);

CREATE TRIGGER update_markalar_updated_at 
    BEFORE UPDATE ON markalar 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================================
-- 6. MODELLER TABLOSU
-- =================================================================================

CREATE TABLE modeller (
    id SERIAL PRIMARY KEY,
    model_kodu VARCHAR(20) UNIQUE NOT NULL,
    model_adi VARCHAR(100) NOT NULL CHECK (LENGTH(model_adi) >= 2),
    marka_id INTEGER NOT NULL REFERENCES markalar(id) ON DELETE CASCADE,
    kategori VARCHAR(50) NOT NULL CHECK (kategori IN ('LAPTOP', 'DESKTOP', 'MONITOR', 'PRINTER', 'SERVER', 'NETWORK', 'MOBILE', 'TABLET', 'ACCESSORY', 'OTHER')),
    teknik_ozellikler JSONB,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_modeller_updated_at 
    BEFORE UPDATE ON modeller 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================================
-- 7. MAC ADRESLERİ TABLOSU
-- =================================================================================

CREATE TABLE mac_adresleri (
    id SERIAL PRIMARY KEY,
    mac_adresi VARCHAR(17) UNIQUE NOT NULL,
    kullanim_durumu VARCHAR(20) NOT NULL DEFAULT 'AKTIF' CHECK (kullanim_durumu IN ('AKTIF', 'PASIF', 'KULLANIMDA', 'BEKLEMEDE', 'BOZUK', 'HURDA')),
    aciklama TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- MAC adresi formatı kontrolü (XX:XX:XX:XX:XX:XX veya XX-XX-XX-XX-XX-XX)
    CONSTRAINT valid_mac_format CHECK (mac_adresi ~* '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$')
);

CREATE TRIGGER update_mac_adresleri_updated_at 
    BEFORE UPDATE ON mac_adresleri 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- MAC adresi normalizasyon fonksiyonu
CREATE OR REPLACE FUNCTION normalize_mac_address()
RETURNS TRIGGER AS $$
BEGIN
    -- MAC adresini büyük harfe çevir ve : formatına standardize et
    NEW.mac_adresi := UPPER(REPLACE(NEW.mac_adresi, '-', ':'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_mac_trigger
    BEFORE INSERT OR UPDATE ON mac_adresleri
    FOR EACH ROW EXECUTE FUNCTION normalize_mac_address();

-- =================================================================================
-- 8. SERİ NUMARALARI TABLOSU
-- =================================================================================

CREATE TABLE seri_numaralari (
    id SERIAL PRIMARY KEY,
    seri_no VARCHAR(100) UNIQUE NOT NULL CHECK (LENGTH(seri_no) >= 3),
    kullanim_durumu VARCHAR(20) NOT NULL DEFAULT 'AKTIF' CHECK (kullanim_durumu IN ('AKTIF', 'PASIF', 'KULLANIMDA', 'BEKLEMEDE', 'BOZUK', 'HURDA')),
    aciklama TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_seri_numaralari_updated_at 
    BEFORE UPDATE ON seri_numaralari 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seri numarası normalizasyon fonksiyonu
CREATE OR REPLACE FUNCTION normalize_serial_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Seri numarasını büyük harfe çevir ve boşlukları temizle
    NEW.seri_no := UPPER(TRIM(NEW.seri_no));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_serial_trigger
    BEFORE INSERT OR UPDATE ON seri_numaralari
    FOR EACH ROW EXECUTE FUNCTION normalize_serial_number();

-- =================================================================================
-- 9. EKIPMAN ENVANTERİ TABLOSU
-- =================================================================================

CREATE TABLE ekipman_envanteri (
    id SERIAL PRIMARY KEY,
    envanter_no VARCHAR(20) UNIQUE NOT NULL,
    barkod VARCHAR(50) UNIQUE NOT NULL,
    marka_id INTEGER NOT NULL REFERENCES markalar(id) ON DELETE RESTRICT,
    model_id INTEGER NOT NULL REFERENCES modeller(id) ON DELETE RESTRICT,
    mac_adresi_id INTEGER UNIQUE REFERENCES mac_adresleri(id) ON DELETE SET NULL,
    seri_no_id INTEGER UNIQUE REFERENCES seri_numaralari(id) ON DELETE SET NULL,
    lokasyon_id INTEGER NOT NULL REFERENCES lokasyonlar(id) ON DELETE RESTRICT,
    atanan_personel_id INTEGER REFERENCES personel(id) ON DELETE SET NULL,
    
    -- Tarih bilgileri
    satin_alma_tarihi DATE,
    ofise_giris_tarihi DATE NOT NULL DEFAULT CURRENT_DATE,
    ofisten_cikis_tarihi DATE,
    garanti_bitis_tarihi DATE,
    
    -- Mali bilgiler
    satin_alma_fiyati DECIMAL(12,2) CHECK (satin_alma_fiyati >= 0),
    amortisman_suresi INTEGER CHECK (amortisman_suresi > 0),
    
    -- Durum bilgileri
    ekipman_durumu VARCHAR(20) NOT NULL DEFAULT 'AKTIF' CHECK (ekipman_durumu IN ('AKTIF', 'PASIF', 'BAKIM', 'BOZUK', 'HURDA', 'KAYIP')),
    kullanim_durumu VARCHAR(20) NOT NULL DEFAULT 'KULLANILMIYOR' CHECK (kullanim_durumu IN ('KULLANIMDA', 'KULLANILMIYOR', 'REZERVE', 'BAKIM', 'DEPO')),
    
    -- Ek bilgiler
    aciklama TEXT,
    notlar JSONB,
    
    -- Zaman damgaları
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Tarih kontrolü
    CONSTRAINT valid_dates CHECK (
        (ofisten_cikis_tarihi IS NULL OR ofisten_cikis_tarihi >= ofise_giris_tarihi) AND
        (garanti_bitis_tarihi IS NULL OR garanti_bitis_tarihi >= satin_alma_tarihi) AND
        (satin_alma_tarihi IS NULL OR satin_alma_tarihi <= CURRENT_DATE)
    )
);

CREATE TRIGGER update_ekipman_envanteri_updated_at 
    BEFORE UPDATE ON ekipman_envanteri 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Envanter numarası otomatik oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION generate_envanter_no()
RETURNS TRIGGER AS $$
DECLARE
    dept_code VARCHAR(10);
    category_code VARCHAR(10);
    year_code VARCHAR(4);
    next_number INTEGER;
    new_envanter_no VARCHAR(20);
BEGIN
    -- Departman kodunu al
    SELECT d.departman_kodu INTO dept_code 
    FROM departmanlar d
    JOIN lokasyonlar l ON l.departman_id = d.id
    WHERE l.id = NEW.lokasyon_id;
    
    -- Kategori kodunu al
    SELECT 
        CASE m.kategori
            WHEN 'LAPTOP' THEN 'LT'
            WHEN 'DESKTOP' THEN 'DT'
            WHEN 'MONITOR' THEN 'MN'
            WHEN 'PRINTER' THEN 'PR'
            WHEN 'SERVER' THEN 'SR'
            WHEN 'NETWORK' THEN 'NW'
            WHEN 'MOBILE' THEN 'MB'
            WHEN 'TABLET' THEN 'TB'
            WHEN 'ACCESSORY' THEN 'AC'
            ELSE 'OT'
        END INTO category_code
    FROM modeller m
    WHERE m.id = NEW.model_id;
    
    -- Yıl kodunu al
    year_code := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Bu kategorideki son envanter numarasını bul
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(envanter_no FROM LENGTH(dept_code || '-' || category_code || '-' || year_code || '-') + 1) AS INTEGER)), 
        0
    ) + 1 INTO next_number
    FROM ekipman_envanteri 
    WHERE envanter_no LIKE dept_code || '-' || category_code || '-' || year_code || '-%';
    
    -- Yeni envanter numarasını oluştur
    NEW.envanter_no := dept_code || '-' || category_code || '-' || year_code || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_envanter_no
    BEFORE INSERT ON ekipman_envanteri
    FOR EACH ROW
    WHEN (NEW.envanter_no IS NULL OR NEW.envanter_no = '')
    EXECUTE FUNCTION generate_envanter_no();

-- Kullanım durumu otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_kullanim_durumu()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer personele atanmışsa KULLANIMDA yap
    IF NEW.atanan_personel_id IS NOT NULL THEN
        NEW.kullanim_durumu := 'KULLANIMDA';
    -- Eğer personel ataması kaldırılmışsa KULLANILMIYOR yap
    ELSIF OLD.atanan_personel_id IS NOT NULL AND NEW.atanan_personel_id IS NULL THEN
        NEW.kullanim_durumu := 'KULLANILMIYOR';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_kullanim_durumu
    BEFORE UPDATE ON ekipman_envanteri
    FOR EACH ROW EXECUTE FUNCTION update_kullanim_durumu();

-- =================================================================================
-- 10. İNDEXLER (PERFORMANS İÇİN)
-- =================================================================================

-- Departmanlar indexleri
CREATE INDEX idx_departmanlar_aktif ON departmanlar(aktif);
CREATE INDEX idx_departmanlar_kod ON departmanlar(departman_kodu);

-- Personel indexleri
CREATE INDEX idx_personel_departman ON personel(departman_id);
CREATE INDEX idx_personel_sicil ON personel(sicil_no);
CREATE INDEX idx_personel_aktif ON personel(aktif);
CREATE INDEX idx_personel_email ON personel(email);

-- Lokasyonlar indexleri
CREATE INDEX idx_lokasyonlar_departman ON lokasyonlar(departman_id);
CREATE INDEX idx_lokasyonlar_tip ON lokasyonlar(lokasyon_tipi);
CREATE INDEX idx_lokasyonlar_aktif ON lokasyonlar(aktif);

-- Markalar indexleri
CREATE INDEX idx_markalar_aktif ON markalar(aktif);
CREATE INDEX idx_markalar_kod ON markalar(marka_kodu);

-- Modeller indexleri
CREATE INDEX idx_modeller_marka ON modeller(marka_id);
CREATE INDEX idx_modeller_kategori ON modeller(kategori);
CREATE INDEX idx_modeller_aktif ON modeller(aktif);

-- MAC adresleri indexleri
CREATE INDEX idx_mac_kullanim_durumu ON mac_adresleri(kullanim_durumu);

-- Seri numaraları indexleri
CREATE INDEX idx_seri_kullanim_durumu ON seri_numaralari(kullanim_durumu);

-- Ekipman envanteri indexleri
CREATE INDEX idx_ekipman_marka ON ekipman_envanteri(marka_id);
CREATE INDEX idx_ekipman_model ON ekipman_envanteri(model_id);
CREATE INDEX idx_ekipman_lokasyon ON ekipman_envanteri(lokasyon_id);
CREATE INDEX idx_ekipman_personel ON ekipman_envanteri(atanan_personel_id);
CREATE INDEX idx_ekipman_durumu ON ekipman_envanteri(ekipman_durumu);
CREATE INDEX idx_ekipman_kullanim ON ekipman_envanteri(kullanim_durumu);
CREATE INDEX idx_ekipman_barkod ON ekipman_envanteri(barkod);
CREATE INDEX idx_ekipman_envanter_no ON ekipman_envanteri(envanter_no);
CREATE INDEX idx_ekipman_giris_tarihi ON ekipman_envanteri(ofise_giris_tarihi);

-- =================================================================================
-- 11. GÖRÜNÜMLER (VIEWS)
-- =================================================================================

-- Detaylı envanter görünümü
CREATE OR REPLACE VIEW v_ekipman_detay AS
SELECT 
    e.id,
    e.envanter_no,
    e.barkod,
    mr.marka_adi,
    md.model_adi,
    md.kategori,
    mac.mac_adresi,
    sn.seri_no,
    l.lokasyon_adi,
    l.lokasyon_tipi,
    d.departman_adi,
    COALESCE(p.ad || ' ' || p.soyad, 'Atanmamış') as atanan_personel,
    p.sicil_no as personel_sicil,
    e.ekipman_durumu,
    e.kullanim_durumu,
    e.ofise_giris_tarihi,
    e.ofisten_cikis_tarihi,
    e.garanti_bitis_tarihi,
    e.satin_alma_fiyati,
    e.aciklama,
    e.created_at,
    e.updated_at
FROM ekipman_envanteri e
LEFT JOIN markalar mr ON e.marka_id = mr.id
LEFT JOIN modeller md ON e.model_id = md.id
LEFT JOIN mac_adresleri mac ON e.mac_adresi_id = mac.id
LEFT JOIN seri_numaralari sn ON e.seri_no_id = sn.id
LEFT JOIN lokasyonlar l ON e.lokasyon_id = l.id
LEFT JOIN departmanlar d ON l.departman_id = d.id
LEFT JOIN personel p ON e.atanan_personel_id = p.id;

-- Envanter özeti görünümü
CREATE OR REPLACE VIEW v_envanter_ozet AS
SELECT 
    d.departman_adi,
    md.kategori,
    COUNT(*) as toplam_ekipman,
    COUNT(CASE WHEN e.ekipman_durumu = 'AKTIF' THEN 1 END) as aktif_ekipman,
    COUNT(CASE WHEN e.kullanim_durumu = 'KULLANIMDA' THEN 1 END) as kullanimdaki_ekipman,
    COUNT(CASE WHEN e.garanti_bitis_tarihi < CURRENT_DATE THEN 1 END) as garanti_biten,
    ROUND(AVG(e.satin_alma_fiyati), 2) as ortalama_fiyat,
    SUM(e.satin_alma_fiyati) as toplam_deger
FROM ekipman_envanteri e
LEFT JOIN lokasyonlar l ON e.lokasyon_id = l.id
LEFT JOIN departmanlar d ON l.departman_id = d.id
LEFT JOIN modeller md ON e.model_id = md.id
GROUP BY d.departman_adi, md.kategori
ORDER BY d.departman_adi, md.kategori;

-- =================================================================================
-- 12. ÖRNEK VERİLER
-- =================================================================================

-- Departmanlar
INSERT INTO departmanlar (departman_kodu, departman_adi, aciklama) VALUES
('IT', 'Bilgi İşlem', 'Bilgi teknolojileri departmanı'),
('HR', 'İnsan Kaynakları', 'İnsan kaynakları departmanı'),
('FIN', 'Finans', 'Finans ve muhasebe departmanı'),
('OPS', 'Operasyon', 'Operasyon ve lojistik departmanı'),
('MKT', 'Pazarlama', 'Pazarlama ve satış departmanı');

-- Personel (sicil_no otomatik oluşturulacak)
INSERT INTO personel (ad, soyad, email, telefon, departman_id, pozisyon, ise_giris_tarihi) VALUES
('Ahmet', 'Yılmaz', 'ahmet.yilmaz@company.com', '+90 532 111 2233', 1, 'IT Manager', '2020-01-15'),
('Ayşe', 'Kaya', 'ayse.kaya@company.com', '+90 532 444 5566', 1, 'System Administrator', '2021-03-10'),
('Mehmet', 'Demir', 'mehmet.demir@company.com', '+90 532 777 8899', 2, 'HR Specialist', '2020-06-01'),
('Fatma', 'Şahin', 'fatma.sahin@company.com', '+90 532 333 4455', 3, 'Financial Analyst', '2021-01-20'),
('Ali', 'Özkan', 'ali.ozkan@company.com', '+90 532 666 7788', 4, 'Operations Manager', '2019-11-05');

-- Lokasyonlar
INSERT INTO lokasyonlar (lokasyon_kodu, lokasyon_adi, lokasyon_tipi, departman_id, adres, kapasite) VALUES
('IT-001', 'Ana IT Ofisi', 'OFIS', 1, 'Kat 3, Oda 301', 20),
('IT-002', 'Server Odası', 'DEPO', 1, 'Kat B1, Oda B101', 50),
('HR-001', 'İK Ofisi', 'OFIS', 2, 'Kat 2, Oda 201', 10),
('FIN-001', 'Finans Ofisi', 'OFIS', 3, 'Kat 2, Oda 205', 15),
('OPS-001', 'Operasyon Merkezi', 'OFIS', 4, 'Kat 1, Oda 101', 25),
('DEPO-001', 'Ana Depo', 'DEPO', 4, 'Zemin Kat, Depo A', 100);

-- Markalar
INSERT INTO markalar (marka_kodu, marka_adi, website) VALUES
('DELL', 'Dell Technologies', 'https://www.dell.com'),
('HP', 'HP Inc.', 'https://www.hp.com'),
('LENOVO', 'Lenovo', 'https://www.lenovo.com'),
('APPLE', 'Apple Inc.', 'https://www.apple.com'),
('ASUS', 'ASUS', 'https://www.asus.com'),
('CISCO', 'Cisco Systems', 'https://www.cisco.com'),
('CANON', 'Canon', 'https://www.canon.com');

-- Modeller
INSERT INTO modeller (model_kodu, model_adi, marka_id, kategori, teknik_ozellikler) VALUES
('DELL-LAT-7420', 'Latitude 7420', 1, 'LAPTOP', '{"cpu": "Intel i7-1185G7", "ram": "16GB", "storage": "512GB SSD", "screen": "14 inch"}'),
('HP-ELITEBOOK-840', 'EliteBook 840 G8', 2, 'LAPTOP', '{"cpu": "Intel i5-1135G7", "ram": "8GB", "storage": "256GB SSD", "screen": "14 inch"}'),
('LENOVO-T14', 'ThinkPad T14', 3, 'LAPTOP', '{"cpu": "AMD Ryzen 5 PRO", "ram": "16GB", "storage": "512GB SSD", "screen": "14 inch"}'),
('DELL-OPT-7090', 'OptiPlex 7090', 1, 'DESKTOP', '{"cpu": "Intel i7-11700", "ram": "16GB", "storage": "1TB SSD", "form": "SFF"}'),
('HP-Z2-TOWER', 'Z2 Tower G5', 2, 'DESKTOP', '{"cpu": "Intel Xeon W-1250", "ram": "32GB", "storage": "1TB SSD", "gpu": "NVIDIA Quadro"}'),
('DELL-U2722DE', 'UltraSharp U2722DE', 1, 'MONITOR', '{"size": "27 inch", "resolution": "2560x1440", "panel": "IPS", "usb_c": true}'),
('HP-LASERJET-M404', 'LaserJet Pro M404dn', 2, 'PRINTER', '{"type": "Laser", "color": false, "duplex": true, "network": true}'),
('CISCO-SF350-24', 'SG350-24 Switch', 6, 'NETWORK', '{"ports": 24, "type": "Managed", "poe": false, "layer": 3}');

-- MAC Adresleri
INSERT INTO mac_adresleri (mac_adresi, kullanim_durumu) VALUES
('00:14:22:01:23:45', 'AKTIF'),
('00:14:22:01:23:46', 'AKTIF'),
('00:14:22:01:23:47', 'AKTIF'),
('00:14:22:01:23:48', 'AKTIF'),
('00:14:22:01:23:49', 'AKTIF'),
('00:1B:63:84:45:E6', 'AKTIF'),
('00:1B:63:84:45:E7', 'AKTIF'),
('00:50:56:C0:00:01', 'AKTIF');

-- Seri Numaraları
INSERT INTO seri_numaralari (seri_no, kullanim_durumu) VALUES
('DELL123456789', 'AKTIF'),
('HP987654321', 'AKTIF'),
('LEN456789123', 'AKTIF'),
('DELL987123456', 'AKTIF'),
('HP123789456', 'AKTIF'),
('DELL789456123', 'AKTIF'),
('HP456123789', 'AKTIF'),
('CISCO789123456', 'AKTIF');

-- Ekipman Envanteri
INSERT INTO ekipman_envanteri (
    barkod, marka_id, model_id, mac_adresi_id, seri_no_id, 
    lokasyon_id, atanan_personel_id, satin_alma_tarihi, 
    satin_alma_fiyati, garanti_bitis_tarihi, aciklama
) VALUES
('BRK001', 1, 1, 1, 1, 1, 1, '2023-01-15', 25000.00, '2026-01-15', 'IT Manager laptop'),
('BRK002', 2, 2, 2, 2, 1, 2, '2023-02-10', 18000.00, '2026-02-10', 'System Admin laptop'),
('BRK003', 3, 3, 3, 3, 3, 3, '2023-03-05', 22000.00, '2026-03-05', 'HR Specialist laptop'),
('BRK004', 1, 4, NULL, 4, 2, NULL, '2023-01-20', 15000.00, '2026-01-20', 'Server odası desktop'),
('BRK005', 2, 5, NULL, 5, 1, NULL, '2023-02-15', 35000.00, '2026-02-15', 'CAD workstation'),
('BRK006', 1, 6, NULL, 6, 1, NULL, '2023-03-01', 8000.00, '2026-03-01', 'Ana monitör'),
('BRK007', 2, 7, 6, 7, 4, NULL, '2023-01-25', 3500.00, '2026-01-25', 'Finans yazıcısı'),
('BRK008', 6, 8, 7, 8, 2, NULL, '2023-02-20', 12000.00, '2026-02-20', 'Network switch');

-- =================================================================================
-- 13. GÜÇLÜ VERİ BÜTÜNLÜĞÜ İÇİN EK KONTROLLER
-- =================================================================================

-- Model-Marka ilişki kontrolü
CREATE OR REPLACE FUNCTION check_model_marka_consistency()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM modeller m 
        WHERE m.id = NEW.model_id AND m.marka_id = NEW.marka_id
    ) THEN
        RAISE EXCEPTION 'Model (%) bu markaya (%) ait değil!', NEW.model_id, NEW.marka_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_model_marka_consistency
    BEFORE INSERT OR UPDATE ON ekipman_envanteri
    FOR EACH ROW EXECUTE FUNCTION check_model_marka_consistency();

-- Aktif kayıt kontrolü
CREATE OR REPLACE FUNCTION check_active_references()
RETURNS TRIGGER AS $$
BEGIN
    -- Departman aktif mi kontrol et
    IF NEW.departman_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM departmanlar WHERE id = NEW.departman_id AND aktif = true
    ) THEN
        RAISE EXCEPTION 'Seçilen departman aktif değil!';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_active_departman_personel
    BEFORE INSERT OR UPDATE ON personel
    FOR EACH ROW EXECUTE FUNCTION check_active_references();

CREATE TRIGGER validate_active_departman_lokasyon
    BEFORE INSERT OR UPDATE ON lokasyonlar
    FOR EACH ROW EXECUTE FUNCTION check_active_references();

-- =================================================================================
-- 14. ROW LEVEL SECURITY (RLS) KURULUMU
-- =================================================================================

-- RLS'i aktifleştir
ALTER TABLE departmanlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE personel ENABLE ROW LEVEL SECURITY;
ALTER TABLE lokasyonlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE markalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE modeller ENABLE ROW LEVEL SECURITY;
ALTER TABLE mac_adresleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE seri_numaralari ENABLE ROW LEVEL SECURITY;
ALTER TABLE ekipman_envanteri ENABLE ROW LEVEL SECURITY;

-- Genel okuma politikası (tüm kullanıcılar okuyabilir)
CREATE POLICY "Enable read access for all users" ON departmanlar FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON personel FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON lokasyonlar FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON markalar FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON modeller FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON mac_adresleri FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON seri_numaralari FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON ekipman_envanteri FOR SELECT USING (true);

-- Insert/Update/Delete için admin yetkisi gerekli
CREATE POLICY "Enable insert for admin users" ON departmanlar FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Enable update for admin users" ON departmanlar FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Enable delete for admin users" ON departmanlar FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Diğer tablolar için benzer politikalar
DO $$
DECLARE
    tbl_name TEXT;
BEGIN
    FOR tbl_name IN SELECT unnest(ARRAY['personel', 'lokasyonlar', 'markalar', 'modeller', 'mac_adresleri', 'seri_numaralari', 'ekipman_envanteri'])
    LOOP
        EXECUTE format('CREATE POLICY "Enable insert for admin users" ON %I FOR INSERT WITH CHECK (auth.jwt() ->> ''role'' = ''admin'')', tbl_name);
        EXECUTE format('CREATE POLICY "Enable update for admin users" ON %I FOR UPDATE USING (auth.jwt() ->> ''role'' = ''admin'')', tbl_name);
        EXECUTE format('CREATE POLICY "Enable delete for admin users" ON %I FOR DELETE USING (auth.jwt() ->> ''role'' = ''admin'')', tbl_name);
    END LOOP;
END $$;

-- =================================================================================
-- 15. KULLANIŞLI FONKSIYONLAR
-- =================================================================================

-- Envanter arama fonksiyonu
CREATE OR REPLACE FUNCTION search_ekipman(search_term TEXT)
RETURNS SETOF v_ekipman_detay AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM v_ekipman_detay
    WHERE 
        envanter_no ILIKE '%' || search_term || '%' OR
        barkod ILIKE '%' || search_term || '%' OR
        marka_adi ILIKE '%' || search_term || '%' OR
        model_adi ILIKE '%' || search_term || '%' OR
        mac_adresi ILIKE '%' || search_term || '%' OR
        seri_no ILIKE '%' || search_term || '%' OR
        atanan_personel ILIKE '%' || search_term || '%' OR
        lokasyon_adi ILIKE '%' || search_term || '%' OR
        departman_adi ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql;

-- Departman envanter raporu
CREATE OR REPLACE FUNCTION get_departman_envanter_raporu(dept_id INTEGER)
RETURNS TABLE (
    kategori TEXT,
    toplam_ekipman BIGINT,
    aktif_ekipman BIGINT,
    kullanimdaki_ekipman BIGINT,
    toplam_deger NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        md.kategori::TEXT,
        COUNT(*)::BIGINT as toplam_ekipman,
        COUNT(CASE WHEN e.ekipman_durumu = 'AKTIF' THEN 1 END)::BIGINT as aktif_ekipman,
        COUNT(CASE WHEN e.kullanim_durumu = 'KULLANIMDA' THEN 1 END)::BIGINT as kullanimdaki_ekipman,
        COALESCE(SUM(e.satin_alma_fiyati), 0) as toplam_deger
    FROM ekipman_envanteri e
    JOIN lokasyonlar l ON e.lokasyon_id = l.id
    JOIN modeller md ON e.model_id = md.id
    WHERE l.departman_id = dept_id
    GROUP BY md.kategori
    ORDER BY md.kategori;
END;
$$ LANGUAGE plpgsql;

-- =================================================================================
-- 16. BAŞARI MESAJI VE KONTROL
-- =================================================================================

DO $$
DECLARE
    table_count INTEGER;
    view_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Tablo sayısını say
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('departmanlar', 'personel', 'lokasyonlar', 'markalar', 'modeller', 'mac_adresleri', 'seri_numaralari', 'ekipman_envanteri');
    
    -- View sayısını say
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views 
    WHERE table_schema = 'public'
    AND table_name LIKE 'v_%';
    
    -- Fonksiyon sayısını say
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION';
    
    -- Trigger sayısını say
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public';
    
    -- Index sayısını say
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
    
    RAISE NOTICE '🎉 ================================';
    RAISE NOTICE '🎉 VERİTABANI BAŞARIYLA OLUŞTURULDU!';
    RAISE NOTICE '🎉 ================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 İSTATİSTİKLER:';
    RAISE NOTICE '   📋 Tablolar: % adet', table_count;
    RAISE NOTICE '   👁️ Görünümler: % adet', view_count;
    RAISE NOTICE '   ⚙️ Fonksiyonlar: % adet', function_count;
    RAISE NOTICE '   🔄 Tetikleyiciler: % adet', trigger_count;
    RAISE NOTICE '   🚀 İndeksler: % adet', index_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ ÖZELLİKLER:';
    RAISE NOTICE '   - Otomatik sicil no üretimi';
    RAISE NOTICE '   - Otomatik envanter no üretimi';
    RAISE NOTICE '   - MAC adresi normalleştirme';
    RAISE NOTICE '   - Seri no normalleştirme';
    RAISE NOTICE '   - Veri bütünlük kontrolleri';
    RAISE NOTICE '   - Row Level Security (RLS)';
    RAISE NOTICE '   - Performans optimizasyonu';
    RAISE NOTICE '   - Detaylı raporlama viewleri';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 SİSTEM KULLANIMA HAZIR!';
    RAISE NOTICE '';
    
    -- Örnek veriler hakkında bilgi
    RAISE NOTICE '📝 ÖRNEK VERİLER EKLENDİ:';
    RAISE NOTICE '   - % departman', (SELECT COUNT(*) FROM departmanlar);
    RAISE NOTICE '   - % personel', (SELECT COUNT(*) FROM personel);
    RAISE NOTICE '   - % lokasyon', (SELECT COUNT(*) FROM lokasyonlar);
    RAISE NOTICE '   - % marka', (SELECT COUNT(*) FROM markalar);
    RAISE NOTICE '   - % model', (SELECT COUNT(*) FROM modeller);
    RAISE NOTICE '   - % ekipman', (SELECT COUNT(*) FROM ekipman_envanteri);
    RAISE NOTICE '';
    
END $$;