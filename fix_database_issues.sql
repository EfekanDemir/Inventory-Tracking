-- ==============================================
-- Veritabanı Sorunlarını Düzeltme SQL
-- ==============================================

-- 1. ekipman_gecmisi tablosunu oluştur
CREATE TABLE IF NOT EXISTS ekipman_gecmisi (
    id BIGSERIAL PRIMARY KEY,
    
    -- Orijinal kayıt ID'si (referans için)
    orijinal_id BIGINT,
    
    -- Teknik Bilgiler
    mac_adresi TEXT,
    seri_no TEXT,
    barkod TEXT,
    
    -- Marka/Model Referansları (mevcut yapıya uygun)
    marka_id BIGINT REFERENCES markalar(id),
    model_id BIGINT REFERENCES modeller(id),
    
    -- Lokasyon ve Atama Bilgileri
    lokasyon_id BIGINT REFERENCES lokasyonlar(id),
    atanan_personel_id BIGINT REFERENCES personel(id),
    
    -- Tarihler
    satin_alma_tarihi DATE,
    garanti_bitis_tarihi DATE,
    ofise_giris_tarihi DATE,
    ofisten_cikis_tarihi DATE,
    geri_donus_tarihi DATE,
    
    -- Mali Bilgiler
    satin_alma_fiyati DECIMAL(10,2),
    amortisman_suresi INTEGER,
    defter_degeri DECIMAL(10,2),
    
    -- Durum Bilgileri
    fiziksel_durum TEXT,
    calismma_durumu TEXT,
    
    -- Ek Bilgiler
    aciklama TEXT,
    ozel_notlar JSONB,
    
    -- Arşiv Bilgileri
    arsiv_nedeni TEXT NOT NULL, -- 'SILINDI', 'OFISE_GIRDI', 'HURDAYA_AYRILDI'
    arsiv_tarihi TIMESTAMPTZ DEFAULT now() NOT NULL,
    arsiv_yapan_id BIGINT REFERENCES personel(id),
    arsiv_notu TEXT,
    
    -- Sistem Alanları
    created_by BIGINT REFERENCES personel(id),
    updated_by BIGINT REFERENCES personel(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. envanter_hareketleri tablosuna eksik sütunları ekle
ALTER TABLE envanter_hareketleri 
ADD COLUMN IF NOT EXISTS degisiklik_detaylari JSONB,
ADD COLUMN IF NOT EXISTS degisiklik_sayisi INTEGER DEFAULT 0;

-- 3. RLS politikalarını ekle
ALTER TABLE ekipman_gecmisi ENABLE ROW LEVEL SECURITY;

-- Geçmiş kayıtlar için politikalar (IF NOT EXISTS olmadan)
DO $$
BEGIN
    -- Geçmiş kayıtlar okuma politikası
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ekipman_gecmisi' 
        AND policyname = 'Geçmiş kayıtlar okuma - herkes'
    ) THEN
        CREATE POLICY "Geçmiş kayıtlar okuma - herkes" ON ekipman_gecmisi FOR SELECT USING (true);
    END IF;
    
    -- Geçmiş kayıtlar ekleme politikası
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ekipman_gecmisi' 
        AND policyname = 'Geçmiş kayıtlar ekleme - herkes'
    ) THEN
        CREATE POLICY "Geçmiş kayıtlar ekleme - herkes" ON ekipman_gecmisi FOR INSERT WITH CHECK (true);
    END IF;
    
    -- Geçmiş kayıtlar güncelleme politikası
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ekipman_gecmisi' 
        AND policyname = 'Geçmiş kayıtlar güncelleme - herkes'
    ) THEN
        CREATE POLICY "Geçmiş kayıtlar güncelleme - herkes" ON ekipman_gecmisi FOR UPDATE USING (true);
    END IF;
    
    -- Geçmiş kayıtlar silme politikası
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ekipman_gecmisi' 
        AND policyname = 'Geçmiş kayıtlar silme - herkes'
    ) THEN
        CREATE POLICY "Geçmiş kayıtlar silme - herkes" ON ekipman_gecmisi FOR DELETE USING (true);
    END IF;
END $$;

-- 4. Index'leri ekle
CREATE INDEX IF NOT EXISTS idx_ekipman_gecmisi_orijinal_id ON ekipman_gecmisi(orijinal_id);
CREATE INDEX IF NOT EXISTS idx_ekipman_gecmisi_arsiv_nedeni ON ekipman_gecmisi(arsiv_nedeni);
CREATE INDEX IF NOT EXISTS idx_ekipman_gecmisi_arsiv_tarihi ON ekipman_gecmisi(arsiv_tarihi DESC);
CREATE INDEX IF NOT EXISTS idx_ekipman_gecmisi_mac_adresi ON ekipman_gecmisi(mac_adresi);
CREATE INDEX IF NOT EXISTS idx_ekipman_gecmisi_seri_no ON ekipman_gecmisi(seri_no);

-- 5. Foreign key constraint'leri düzelt (CASCADE ekle)
-- Önce mevcut constraint'leri kaldır
ALTER TABLE envanter_hareketleri DROP CONSTRAINT IF EXISTS envanter_hareketleri_ekipman_id_fkey;

-- Yeni constraint ekle (CASCADE ile)
ALTER TABLE envanter_hareketleri 
ADD CONSTRAINT envanter_hareketleri_ekipman_id_fkey 
FOREIGN KEY (ekipman_id) REFERENCES ekipman_envanteri(id) ON DELETE CASCADE;

-- 6. Ofis lokasyonunu kontrol et ve yoksa ekle
INSERT INTO lokasyonlar (lokasyon_kodu, lokasyon_adi, lokasyon_tipi, aciklama)
SELECT 'OFIS', 'Ofis', 'DEPO', 'Ofis içi ekipmanlar'
WHERE NOT EXISTS (
    SELECT 1 FROM lokasyonlar WHERE lokasyon_kodu = 'OFIS'
);

-- 7. Mevcut seri numaraları ve MAC adresleri tablolarını güncelle (eğer varsa)
-- Önce tabloların var olup olmadığını kontrol et
DO $$
BEGIN
    -- seri_numaralari tablosu varsa güncelle
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seri_numaralari') THEN
        -- Eğer marka_model sütunu varsa kaldır
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seri_numaralari' AND column_name = 'marka_model') THEN
            ALTER TABLE seri_numaralari DROP COLUMN marka_model;
        END IF;
        
        -- Eğer model_id sütunu yoksa ekle
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seri_numaralari' AND column_name = 'model_id') THEN
            ALTER TABLE seri_numaralari ADD COLUMN model_id BIGINT REFERENCES modeller(id) ON DELETE CASCADE;
        END IF;
    ELSE
        -- Tablo yoksa oluştur
        CREATE TABLE seri_numaralari (
            id BIGSERIAL PRIMARY KEY,
            model_id BIGINT NOT NULL REFERENCES modeller(id) ON DELETE CASCADE,
            seri_no TEXT NOT NULL UNIQUE,
            aciklama TEXT,
            kullanim_durumu TEXT DEFAULT 'MUSAIT' CHECK (kullanim_durumu IN ('MUSAIT', 'KULLANIMDA', 'ARIZALI')),
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
        );
    END IF;
    
    -- mac_adresleri tablosu varsa güncelle
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mac_adresleri') THEN
        -- Eğer marka_model sütunu varsa kaldır
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mac_adresleri' AND column_name = 'marka_model') THEN
            ALTER TABLE mac_adresleri DROP COLUMN marka_model;
        END IF;
        
        -- Eğer model_id sütunu yoksa ekle
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mac_adresleri' AND column_name = 'model_id') THEN
            ALTER TABLE mac_adresleri ADD COLUMN model_id BIGINT REFERENCES modeller(id) ON DELETE CASCADE;
        END IF;
    ELSE
        -- Tablo yoksa oluştur
        CREATE TABLE mac_adresleri (
            id BIGSERIAL PRIMARY KEY,
            model_id BIGINT REFERENCES modeller(id) ON DELETE CASCADE,
            mac_adresi TEXT NOT NULL UNIQUE,
            aciklama TEXT,
            kullanim_durumu TEXT DEFAULT 'MUSAIT' CHECK (kullanim_durumu IN ('MUSAIT', 'KULLANIMDA', 'ARIZALI')),
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
        );
    END IF;
END $$;

-- Bu tablolar için RLS politikaları
ALTER TABLE seri_numaralari ENABLE ROW LEVEL SECURITY;
ALTER TABLE mac_adresleri ENABLE ROW LEVEL SECURITY;

-- Seri numaraları politikaları
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'seri_numaralari' 
        AND policyname = 'Seri numaraları okuma - herkes'
    ) THEN
        CREATE POLICY "Seri numaraları okuma - herkes" ON seri_numaralari FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'seri_numaralari' 
        AND policyname = 'Seri numaraları ekleme - herkes'
    ) THEN
        CREATE POLICY "Seri numaraları ekleme - herkes" ON seri_numaralari FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- MAC adresleri politikaları
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'mac_adresleri' 
        AND policyname = 'MAC adresleri okuma - herkes'
    ) THEN
        CREATE POLICY "MAC adresleri okuma - herkes" ON mac_adresleri FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'mac_adresleri' 
        AND policyname = 'MAC adresleri ekleme - herkes'
    ) THEN
        CREATE POLICY "MAC adresleri ekleme - herkes" ON mac_adresleri FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_seri_numaralari_model_id ON seri_numaralari(model_id);
CREATE INDEX IF NOT EXISTS idx_seri_numaralari_seri_no ON seri_numaralari(seri_no);
CREATE INDEX IF NOT EXISTS idx_mac_adresleri_model_id ON mac_adresleri(model_id);
CREATE INDEX IF NOT EXISTS idx_mac_adresleri_mac_adresi ON mac_adresleri(mac_adresi);

-- 8. Eksik constraint'leri temizle ve düzelt
-- Orphaned kayıtları temizle (silinen ekipmanlara referans veren hareket kayıtları)
DELETE FROM envanter_hareketleri 
WHERE ekipman_id NOT IN (SELECT id FROM ekipman_envanteri);

-- 9. Unique constraint'leri kontrol et ve düzelt (sadece NULL olmayan değerler için)
-- Eğer aynı seri no birden fazla kayıtta varsa, sadece en yenisini tut
DELETE FROM ekipman_envanteri 
WHERE id NOT IN (
    SELECT DISTINCT ON (seri_no) id 
    FROM ekipman_envanteri 
    WHERE seri_no IS NOT NULL AND seri_no != ''
    ORDER BY seri_no, created_at DESC
);

-- Eğer aynı MAC adresi birden fazla kayıtta varsa, sadece en yenisini tut
DELETE FROM ekipman_envanteri 
WHERE id NOT IN (
    SELECT DISTINCT ON (mac_adresi) id 
    FROM ekipman_envanteri 
    WHERE mac_adresi IS NOT NULL AND mac_adresi != ''
    ORDER BY mac_adresi, created_at DESC
); 