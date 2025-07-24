-- ==============================================
-- Basit Envanter Takip Sistemi - Minimal Database Setup
-- ==============================================

-- Markalar tablosu (Basit)
CREATE TABLE IF NOT EXISTS markalar (
    id BIGSERIAL PRIMARY KEY,
    marka_adi TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Modeller tablosu (Basit)
CREATE TABLE IF NOT EXISTS modeller (
    id BIGSERIAL PRIMARY KEY,
    marka_id BIGINT NOT NULL REFERENCES markalar(id) ON DELETE CASCADE,
    model_adi TEXT NOT NULL,
    kategori TEXT DEFAULT 'Bilgisayar',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(marka_id, model_adi)
);

-- Lokasyonlar tablosu (Basit)
CREATE TABLE IF NOT EXISTS lokasyonlar (
    id BIGSERIAL PRIMARY KEY,
    lokasyon_kodu TEXT NOT NULL UNIQUE,
    lokasyon_adi TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Personel tablosu (Basit)
CREATE TABLE IF NOT EXISTS personel (
    id BIGSERIAL PRIMARY KEY,
    ad TEXT NOT NULL,
    soyad TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ana ekipman envanteri tablosu (Basitleştirilmiş)
CREATE TABLE IF NOT EXISTS ekipman_envanteri (
    id BIGSERIAL PRIMARY KEY,
    marka_id BIGINT REFERENCES markalar(id),
    model_id BIGINT REFERENCES modeller(id),
    lokasyon_id BIGINT REFERENCES lokasyonlar(id),
    atanan_personel_id BIGINT REFERENCES personel(id),
    seri_no TEXT,
    mac_adresi TEXT,
    barkod TEXT,
    durum TEXT DEFAULT 'MUSAIT' CHECK (durum IN ('MUSAIT', 'KULLANIMDA', 'ARIZALI', 'BAKIMDA')),
    ofise_giris_tarihi DATE,
    ofisten_cikis_tarihi DATE,
    aciklama TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ekipman geçmişi (Basit takip için)
CREATE TABLE IF NOT EXISTS ekipman_gecmisi (
    id BIGSERIAL PRIMARY KEY,
    ekipman_id BIGINT NOT NULL REFERENCES ekipman_envanteri(id) ON DELETE CASCADE,
    onceki_lokasyon_id BIGINT REFERENCES lokasyonlar(id),
    yeni_lokasyon_id BIGINT REFERENCES lokasyonlar(id),
    onceki_personel_id BIGINT REFERENCES personel(id),
    yeni_personel_id BIGINT REFERENCES personel(id),
    onceki_durum TEXT,
    yeni_durum TEXT,
    islem_tarihi TIMESTAMPTZ DEFAULT now() NOT NULL,
    aciklama TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================
-- Temel veriler ekleme
-- ==============================================

-- Varsayılan markalar
INSERT INTO markalar (marka_adi) VALUES
('Apple'),
('Dell'),
('HP'),
('Lenovo'),
('ASUS'),
('Samsung')
ON CONFLICT (marka_adi) DO NOTHING;

-- Varsayılan lokasyonlar
INSERT INTO lokasyonlar (lokasyon_kodu, lokasyon_adi) VALUES
('DEPO01', 'Ana Depo'),
('OFIS01', 'Ofis 1'),
('OFIS02', 'Ofis 2'),
('BAKIM01', 'Bakım Atölyesi')
ON CONFLICT (lokasyon_kodu) DO NOTHING;

-- ==============================================
-- Row Level Security (RLS) - Basit
-- ==============================================

-- Tüm tablolar için RLS'i etkinleştir
ALTER TABLE markalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE modeller ENABLE ROW LEVEL SECURITY;
ALTER TABLE lokasyonlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE personel ENABLE ROW LEVEL SECURITY;
ALTER TABLE ekipman_envanteri ENABLE ROW LEVEL SECURITY;
ALTER TABLE ekipman_gecmisi ENABLE ROW LEVEL SECURITY;

-- Herkese okuma/yazma izni ver (kimlik doğrulama olmadığı için)
CREATE POLICY "Allow all operations" ON markalar FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON modeller FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON lokasyonlar FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON personel FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON ekipman_envanteri FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON ekipman_gecmisi FOR ALL TO anon USING (true) WITH CHECK (true);

-- ==============================================
-- Trigger'lar - Basit
-- ==============================================

-- Ekipman güncellendiğinde updated_at'i güncelle
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ekipman_updated_at BEFORE UPDATE ON ekipman_envanteri
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ekipman değişikliklerini geçmişe kaydet
CREATE OR REPLACE FUNCTION log_equipment_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
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
                'Otomatik kayıt'
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
-- Useful Views
-- ==============================================

-- Ekipman detay görünümü
CREATE OR REPLACE VIEW ekipman_detay AS
SELECT 
    e.id,
    e.seri_no,
    e.mac_adresi,
    e.barkod,
    e.durum,
    e.ofise_giris_tarihi,
    e.ofisten_cikis_tarihi,
    e.aciklama,
    m.marka_adi,
    mo.model_adi,
    mo.kategori,
    l.lokasyon_kodu,
    l.lokasyon_adi,
    CASE 
        WHEN p.ad IS NOT NULL THEN p.ad || ' ' || p.soyad
        ELSE NULL
    END as atanan_personel,
    p.email as personel_email,
    e.created_at,
    e.updated_at
FROM ekipman_envanteri e
LEFT JOIN markalar m ON e.marka_id = m.id
LEFT JOIN modeller mo ON e.model_id = mo.id
LEFT JOIN lokasyonlar l ON e.lokasyon_id = l.id
LEFT JOIN personel p ON e.atanan_personel_id = p.id;