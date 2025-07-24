-- ==============================================
-- MİNİMAL NORMALIZE EDİLMİŞ ENVANTER VERİTABANI
-- ==============================================

-- 1. MARKALAR TABLOSU
CREATE TABLE IF NOT EXISTS markalar (
    id BIGSERIAL PRIMARY KEY,
    marka_adi TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. MODELLER TABLOSU  
CREATE TABLE IF NOT EXISTS modeller (
    id BIGSERIAL PRIMARY KEY,
    marka_id BIGINT NOT NULL REFERENCES markalar(id) ON DELETE CASCADE,
    model_adi TEXT NOT NULL,
    kategori TEXT DEFAULT 'Bilgisayar',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(marka_id, model_adi)
);

-- 3. LOKASYONLAR TABLOSU
CREATE TABLE IF NOT EXISTS lokasyonlar (
    id BIGSERIAL PRIMARY KEY,
    lokasyon_adi TEXT NOT NULL UNIQUE,
    aciklama TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. PERSONEL TABLOSU
CREATE TABLE IF NOT EXISTS personel (
    id BIGSERIAL PRIMARY KEY,
    ad_soyad TEXT NOT NULL,
    email TEXT UNIQUE,
    telefon TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. EKİPMAN ENVANTERİ TABLOSU (Ana tablo)
CREATE TABLE IF NOT EXISTS ekipman_envanteri (
    id BIGSERIAL PRIMARY KEY,
    marka_id BIGINT REFERENCES markalar(id),
    model_id BIGINT REFERENCES modeller(id),
    lokasyon_id BIGINT REFERENCES lokasyonlar(id),
    atanan_personel_id BIGINT REFERENCES personel(id),
    seri_no TEXT UNIQUE,
    mac_adresi TEXT,
    barkod TEXT,
    durum TEXT DEFAULT 'MUSAIT' CHECK (durum IN ('MUSAIT', 'KULLANIMDA', 'ARIZALI', 'BAKIMDA')),
    aciklama TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. EKİPMAN GEÇMİŞİ TABLOSU (İlişkisel takip)
CREATE TABLE IF NOT EXISTS ekipman_gecmisi (
    id BIGSERIAL PRIMARY KEY,
    ekipman_id BIGINT NOT NULL REFERENCES ekipman_envanteri(id) ON DELETE CASCADE,
    onceki_lokasyon_id BIGINT REFERENCES lokasyonlar(id),
    yeni_lokasyon_id BIGINT REFERENCES lokasyonlar(id),
    onceki_personel_id BIGINT REFERENCES personel(id),
    yeni_personel_id BIGINT REFERENCES personel(id),
    onceki_durum TEXT,
    yeni_durum TEXT,
    degisiklik_tarihi TIMESTAMPTZ DEFAULT now() NOT NULL,
    aciklama TEXT
);

-- ==============================================
-- TEMEL VERİLER
-- ==============================================

-- Varsayılan markalar
INSERT INTO markalar (marka_adi) VALUES
('Apple'),
('Dell'),
('HP'),
('Lenovo'),
('ASUS'),
('Samsung'),
('Acer'),
('MSI')
ON CONFLICT (marka_adi) DO NOTHING;

-- Varsayılan lokasyonlar  
INSERT INTO lokasyonlar (lokasyon_adi, aciklama) VALUES
('Ana Depo', 'Merkez depo alanı'),
('IT Ofisi', 'Bilgi işlem ofisi'),
('Muhasebe', 'Muhasebe departmanı'),
('İnsan Kaynakları', 'İK departmanı'),
('Genel Müdürlük', 'Üst yönetim'),
('Bakım Atölyesi', 'Teknik bakım alanı')
ON CONFLICT (lokasyon_adi) DO NOTHING;

-- Apple modelleri
INSERT INTO modeller (marka_id, model_adi, kategori) 
SELECT m.id, model_data.model_adi, model_data.kategori
FROM markalar m, (VALUES
    ('MacBook Air M1', 'Laptop'),
    ('MacBook Air M2', 'Laptop'),
    ('MacBook Pro 13"', 'Laptop'),
    ('MacBook Pro 16"', 'Laptop'),
    ('iMac 24"', 'Bilgisayar'),
    ('Mac Mini', 'Bilgisayar'),
    ('iPad Air', 'Tablet'),
    ('iPad Pro', 'Tablet'),
    ('iPhone 13', 'Telefon'),
    ('iPhone 14', 'Telefon')
) AS model_data(model_adi, kategori)
WHERE m.marka_adi = 'Apple'
ON CONFLICT (marka_id, model_adi) DO NOTHING;

-- Dell modelleri
INSERT INTO modeller (marka_id, model_adi, kategori)
SELECT m.id, model_data.model_adi, model_data.kategori
FROM markalar m, (VALUES
    ('Latitude 3520', 'Laptop'),
    ('Latitude 5520', 'Laptop'),
    ('Inspiron 15 3000', 'Laptop'),
    ('OptiPlex 3090', 'Bilgisayar'),
    ('OptiPlex 7090', 'Bilgisayar'),
    ('Precision 3650', 'Bilgisayar')
) AS model_data(model_adi, kategori)
WHERE m.marka_adi = 'Dell'
ON CONFLICT (marka_id, model_adi) DO NOTHING;

-- HP modelleri
INSERT INTO modeller (marka_id, model_adi, kategori)
SELECT m.id, model_data.model_adi, model_data.kategori
FROM markalar m, (VALUES
    ('EliteBook 840', 'Laptop'),
    ('ProBook 450', 'Laptop'),
    ('Pavilion 15', 'Laptop'),
    ('EliteDesk 800', 'Bilgisayar'),
    ('ProDesk 400', 'Bilgisayar')
) AS model_data(model_adi, kategori)
WHERE m.marka_adi = 'HP'
ON CONFLICT (marka_id, model_adi) DO NOTHING;

-- ==============================================
-- GÜVENLIK POLİTİKALARI (RLS)
-- ==============================================

-- RLS etkinleştir
ALTER TABLE markalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE modeller ENABLE ROW LEVEL SECURITY;
ALTER TABLE lokasyonlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE personel ENABLE ROW LEVEL SECURITY;
ALTER TABLE ekipman_envanteri ENABLE ROW LEVEL SECURITY;
ALTER TABLE ekipman_gecmisi ENABLE ROW LEVEL SECURITY;

-- Herkese erişim izni (kimlik doğrulama olmadığı için)
CREATE POLICY "Allow all operations markalar" ON markalar FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations modeller" ON modeller FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations lokasyonlar" ON lokasyonlar FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations personel" ON personel FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations ekipman_envanteri" ON ekipman_envanteri FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations ekipman_gecmisi" ON ekipman_gecmisi FOR ALL TO anon USING (true) WITH CHECK (true);

-- ==============================================
-- TRIGGER'LAR
-- ==============================================

-- Updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ekipman_updated_at 
    BEFORE UPDATE ON ekipman_envanteri
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ekipman değişiklik geçmişi
CREATE OR REPLACE FUNCTION log_equipment_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Sadece önemli alanlar değişmişse kaydet
        IF OLD.lokasyon_id != NEW.lokasyon_id OR 
           OLD.atanan_personel_id != NEW.atanan_personel_id OR 
           OLD.durum != NEW.durum THEN
            
            INSERT INTO ekipman_gecmisi (
                ekipman_id,
                onceki_lokasyon_id,
                yeni_lokasyon_id,
                onceki_personel_id,
                yeni_personel_id,
                onceki_durum,
                yeni_durum,
                aciklama
            ) VALUES (
                NEW.id,
                OLD.lokasyon_id,
                NEW.lokasyon_id,
                OLD.atanan_personel_id,
                NEW.atanan_personel_id,
                OLD.durum,
                NEW.durum,
                'Otomatik sistem kaydı'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_equipment_changes_trigger 
    AFTER UPDATE ON ekipman_envanteri
    FOR EACH ROW EXECUTE FUNCTION log_equipment_changes();

-- ==============================================
-- KULLANIŞLI VIEW'LAR
-- ==============================================

-- Ekipman detay görünümü (JOIN'lerle)
CREATE OR REPLACE VIEW ekipman_detay AS
SELECT 
    e.id,
    e.seri_no,
    e.mac_adresi,
    e.barkod,
    e.durum,
    e.aciklama,
    m.marka_adi,
    mo.model_adi,
    mo.kategori,
    l.lokasyon_adi,
    p.ad_soyad as atanan_personel,
    p.email as personel_email,
    e.created_at,
    e.updated_at
FROM ekipman_envanteri e
LEFT JOIN markalar m ON e.marka_id = m.id
LEFT JOIN modeller mo ON e.model_id = mo.id
LEFT JOIN lokasyonlar l ON e.lokasyon_id = l.id
LEFT JOIN personel p ON e.atanan_personel_id = p.id;

-- Ekipman istatistikleri view'ı
CREATE OR REPLACE VIEW ekipman_stats AS
SELECT 
    COUNT(*) as toplam_ekipman,
    COUNT(CASE WHEN durum = 'MUSAIT' THEN 1 END) as musait,
    COUNT(CASE WHEN durum = 'KULLANIMDA' THEN 1 END) as kullanimda,
    COUNT(CASE WHEN durum = 'ARIZALI' THEN 1 END) as arizali,
    COUNT(CASE WHEN durum = 'BAKIMDA' THEN 1 END) as bakimda
FROM ekipman_envanteri;

-- Lokasyon bazında ekipman dağılımı
CREATE OR REPLACE VIEW lokasyon_dagilimi AS
SELECT 
    l.lokasyon_adi,
    COUNT(e.id) as ekipman_sayisi,
    COUNT(CASE WHEN e.durum = 'MUSAIT' THEN 1 END) as musait_sayisi,
    COUNT(CASE WHEN e.durum = 'KULLANIMDA' THEN 1 END) as kullanimda_sayisi
FROM lokasyonlar l
LEFT JOIN ekipman_envanteri e ON l.id = e.lokasyon_id
GROUP BY l.id, l.lokasyon_adi
ORDER BY ekipman_sayisi DESC;

-- ==============================================
-- İNDEKSLER (Performans için)
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_ekipman_seri_no ON ekipman_envanteri(seri_no);
CREATE INDEX IF NOT EXISTS idx_ekipman_mac_adresi ON ekipman_envanteri(mac_adresi);
CREATE INDEX IF NOT EXISTS idx_ekipman_durum ON ekipman_envanteri(durum);
CREATE INDEX IF NOT EXISTS idx_ekipman_marka ON ekipman_envanteri(marka_id);
CREATE INDEX IF NOT EXISTS idx_ekipman_model ON ekipman_envanteri(model_id);
CREATE INDEX IF NOT EXISTS idx_ekipman_lokasyon ON ekipman_envanteri(lokasyon_id);
CREATE INDEX IF NOT EXISTS idx_gecmis_ekipman ON ekipman_gecmisi(ekipman_id);

-- Kurulum tamamlandı mesajı
DO $$
BEGIN
    RAISE NOTICE '✅ Normalize edilmiş minimal envanter veritabanı başarıyla kuruldu!';
    RAISE NOTICE '📊 Tablolar: markalar, modeller, lokasyonlar, personel, ekipman_envanteri, ekipman_gecmisi';
    RAISE NOTICE '🔍 View''lar: ekipman_detay, ekipman_stats, lokasyon_dagilimi';
    RAISE NOTICE '⚡ Trigger''lar ve indeksler aktif';
END $$;