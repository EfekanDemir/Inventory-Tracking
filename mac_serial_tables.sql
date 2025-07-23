-- MAC Adresleri ve Seri Numaraları için yeni tablolar
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- MAC adresleri tablosu
CREATE TABLE IF NOT EXISTS mac_adresleri (
    id BIGSERIAL PRIMARY KEY,
    mac_adresi TEXT NOT NULL UNIQUE,
    aciklama TEXT,
    is_active BOOLEAN DEFAULT true,
    kullanim_durumu TEXT DEFAULT 'MUSAIT' CHECK (kullanim_durumu IN ('MUSAIT', 'KULLANILIYOR', 'REZERVE')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seri numaraları tablosu
CREATE TABLE IF NOT EXISTS seri_numaralari (
    id BIGSERIAL PRIMARY KEY,
    seri_no TEXT NOT NULL UNIQUE,
    aciklama TEXT,
    is_active BOOLEAN DEFAULT true,
    kullanim_durumu TEXT DEFAULT 'MUSAIT' CHECK (kullanim_durumu IN ('MUSAIT', 'KULLANILIYOR', 'REZERVE')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Updated_at trigger'ları ekle
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mac_adresleri_updated_at BEFORE UPDATE ON mac_adresleri
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seri_numaralari_updated_at BEFORE UPDATE ON seri_numaralari
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS politikaları (anonim erişim için)
ALTER TABLE mac_adresleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE seri_numaralari ENABLE ROW LEVEL SECURITY;

-- Okuma politikaları
CREATE POLICY "MAC adresleri okuma - herkes" ON mac_adresleri FOR SELECT USING (is_active = true);
CREATE POLICY "Seri numaraları okuma - herkes" ON seri_numaralari FOR SELECT USING (is_active = true);

-- Anonim erişim politikaları (kurulum için)
CREATE POLICY "MAC adresleri anonim erişim" ON mac_adresleri FOR INSERT WITH CHECK (true);
CREATE POLICY "MAC adresleri güncelleme - anonim erişim" ON mac_adresleri FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "MAC adresleri silme - anonim erişim" ON mac_adresleri FOR DELETE USING (true);

CREATE POLICY "Seri numaraları anonim erişim" ON seri_numaralari FOR INSERT WITH CHECK (true);
CREATE POLICY "Seri numaraları güncelleme - anonim erişim" ON seri_numaralari FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Seri numaraları silme - anonim erişim" ON seri_numaralari FOR DELETE USING (true);

-- İndexler
CREATE INDEX IF NOT EXISTS idx_mac_adresleri_mac_adresi ON mac_adresleri(mac_adresi);
CREATE INDEX IF NOT EXISTS idx_mac_adresleri_kullanim_durumu ON mac_adresleri(kullanim_durumu);
CREATE INDEX IF NOT EXISTS idx_seri_numaralari_seri_no ON seri_numaralari(seri_no);
CREATE INDEX IF NOT EXISTS idx_seri_numaralari_kullanim_durumu ON seri_numaralari(kullanim_durumu);

-- Tabloları kontrol et
SELECT 'mac_adresleri' as tablo, count(*) as kayit_sayisi FROM mac_adresleri
UNION ALL
SELECT 'seri_numaralari' as tablo, count(*) as kayit_sayisi FROM seri_numaralari; 