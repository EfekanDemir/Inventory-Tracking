-- ✅ Supabase Veritabanı Düzeltme Scriptleri
-- Bu scriptleri Supabase SQL Editor'de sırayla çalıştırın

-- =================================================================================
-- 1. LOKASYONLAR TABLOSU DÜZELTMELERİ
-- =================================================================================

-- Mevcut tablo yapısını kontrol edin
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lokasyonlar'
ORDER BY ordinal_position;

-- Eğer departman_id kolonu yoksa ekleyin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lokasyonlar' AND column_name = 'departman_id'
    ) THEN
        ALTER TABLE lokasyonlar 
        ADD COLUMN departman_id INTEGER REFERENCES departmanlar(id);
        
        RAISE NOTICE 'departman_id kolonu eklendi';
    ELSE
        RAISE NOTICE 'departman_id kolonu zaten mevcut';
    END IF;
END $$;

-- Eğer yanlış isimli kolon varsa düzeltin (departmanlar -> departman_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lokasyonlar' AND column_name = 'departmanlar'
    ) THEN
        ALTER TABLE lokasyonlar 
        RENAME COLUMN departmanlar TO departman_id;
        
        RAISE NOTICE 'departmanlar kolonu departman_id olarak yeniden adlandırıldı';
    END IF;
END $$;

-- Performans için index ekleyin
CREATE INDEX IF NOT EXISTS idx_lokasyonlar_departman 
ON lokasyonlar(departman_id);

-- =================================================================================
-- 2. MAC ADRESLERİ TABLOSU DÜZELTMELERİ
-- =================================================================================

-- Mevcut constraint'i kontrol edin
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'mac_adresleri'::regclass 
AND contype = 'c'
AND conname LIKE '%kullanim_durumu%';

-- Eski constraint'i kaldırın
ALTER TABLE mac_adresleri 
DROP CONSTRAINT IF EXISTS mac_adresleri_kullanim_durumu_check;

-- Yeni constraint ekleyin (doğru değerlerle)
ALTER TABLE mac_adresleri 
ADD CONSTRAINT mac_adresleri_kullanim_durumu_check 
CHECK (kullanim_durumu IN (
    'AKTIF', 
    'PASIF', 
    'KULLANIMDA', 
    'BEKLEMEDE', 
    'BOZUK', 
    'HURDA'
));

-- Mevcut NULL değerleri düzeltin
UPDATE mac_adresleri 
SET kullanim_durumu = 'AKTIF' 
WHERE kullanim_durumu IS NULL;

-- kullanim_durumu kolonunu NOT NULL yapın
ALTER TABLE mac_adresleri 
ALTER COLUMN kullanim_durumu SET NOT NULL;

-- Benzersizlik constraint'i ekleyin
ALTER TABLE mac_adresleri 
ADD CONSTRAINT unique_mac_adresi UNIQUE (mac_adresi);

-- =================================================================================
-- 3. SERİ NUMARALARI TABLOSU DÜZELTMELERİ
-- =================================================================================

-- Mevcut constraint'i kontrol edin
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'seri_numaralari'::regclass 
AND contype = 'c'
AND conname LIKE '%kullanim_durumu%';

-- Eski constraint'i kaldırın
ALTER TABLE seri_numaralari 
DROP CONSTRAINT IF EXISTS seri_numaralari_kullanim_durumu_check;

-- Yeni constraint ekleyin
ALTER TABLE seri_numaralari 
ADD CONSTRAINT seri_numaralari_kullanim_durumu_check 
CHECK (kullanim_durumu IN (
    'AKTIF', 
    'PASIF', 
    'KULLANIMDA', 
    'BEKLEMEDE', 
    'BOZUK', 
    'HURDA'
));

-- Mevcut NULL değerleri düzeltin
UPDATE seri_numaralari 
SET kullanim_durumu = 'AKTIF' 
WHERE kullanim_durumu IS NULL;

-- kullanim_durumu kolonunu NOT NULL yapın
ALTER TABLE seri_numaralari 
ALTER COLUMN kullanim_durumu SET NOT NULL;

-- Benzersizlik constraint'i ekleyin
ALTER TABLE seri_numaralari 
ADD CONSTRAINT unique_seri_no UNIQUE (seri_no);

-- =================================================================================
-- 4. EKIPMAN ENVANTERİ TABLOSU DÜZELTMELERİ
-- =================================================================================

-- Barkod benzersizlik constraint'i ekleyin
ALTER TABLE ekipman_envanteri 
ADD CONSTRAINT unique_barkod UNIQUE (barkod);

-- MAC adresi benzersizlik constraint'i ekleyin
ALTER TABLE ekipman_envanteri 
ADD CONSTRAINT unique_mac_adresi_id UNIQUE (mac_adresi_id);

-- Seri numarası benzersizlik constraint'i ekleyin
ALTER TABLE ekipman_envanteri 
ADD CONSTRAINT unique_seri_no_id UNIQUE (seri_no_id);

-- =================================================================================
-- 5. FOREIGN KEY İLİŞKİLERİ DÜZELTMELERİ
-- =================================================================================

-- Lokasyonlar -> Departmanlar foreign key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lokasyonlar_departman'
    ) THEN
        ALTER TABLE lokasyonlar 
        ADD CONSTRAINT fk_lokasyonlar_departman 
        FOREIGN KEY (departman_id) REFERENCES departmanlar(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'lokasyonlar -> departmanlar foreign key eklendi';
    END IF;
END $$;

-- Personel -> Departmanlar foreign key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_personel_departman'
    ) THEN
        ALTER TABLE personel 
        ADD CONSTRAINT fk_personel_departman 
        FOREIGN KEY (departman_id) REFERENCES departmanlar(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'personel -> departmanlar foreign key eklendi';
    END IF;
END $$;

-- =================================================================================
-- 6. İNDEXLER (PERFORMANS İÇİN)
-- =================================================================================

-- Sık kullanılan kolonlar için indexler
CREATE INDEX IF NOT EXISTS idx_personel_departman ON personel(departman_id);
CREATE INDEX IF NOT EXISTS idx_personel_sicil ON personel(sicil_no);
CREATE INDEX IF NOT EXISTS idx_ekipman_marka ON ekipman_envanteri(marka_id);
CREATE INDEX IF NOT EXISTS idx_ekipman_model ON ekipman_envanteri(model_id);
CREATE INDEX IF NOT EXISTS idx_ekipman_lokasyon ON ekipman_envanteri(lokasyon_id);
CREATE INDEX IF NOT EXISTS idx_ekipman_personel ON ekipman_envanteri(atanan_personel_id);
CREATE INDEX IF NOT EXISTS idx_ekipman_barkod ON ekipman_envanteri(barkod);

-- =================================================================================
-- 7. VERİ DOĞRULAMA VE TEMİZLEME
-- =================================================================================

-- Geçersiz referansları temizleyin
UPDATE lokasyonlar 
SET departman_id = NULL 
WHERE departman_id IS NOT NULL 
AND departman_id NOT IN (SELECT id FROM departmanlar);

UPDATE personel 
SET departman_id = NULL 
WHERE departman_id IS NOT NULL 
AND departman_id NOT IN (SELECT id FROM departmanlar);

-- =================================================================================
-- 8. KONTROL SORGUSU
-- =================================================================================

-- Tablo yapılarını kontrol edin
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    CASE 
        WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'PK'
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN 'FK'
        WHEN tc.constraint_type = 'UNIQUE' THEN 'UQ'
        WHEN tc.constraint_type = 'CHECK' THEN 'CK'
        ELSE ''
    END as constraint_type
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN information_schema.key_column_usage kcu ON c.column_name = kcu.column_name AND c.table_name = kcu.table_name
LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
WHERE t.table_name IN ('departmanlar', 'personel', 'lokasyonlar', 'mac_adresleri', 'seri_numaralari', 'ekipman_envanteri')
ORDER BY t.table_name, c.ordinal_position;

-- =================================================================================
-- 9. TEST VERİLERİ (OPSİYONEL)
-- =================================================================================

-- Test departmanı ekleyin (varsa güncelle)
INSERT INTO departmanlar (departman_kodu, departman_adi) 
VALUES ('IT', 'Bilgi İşlem')
ON CONFLICT (departman_kodu) 
DO UPDATE SET departman_adi = EXCLUDED.departman_adi;

-- Test lokasyonu ekleyin
INSERT INTO lokasyonlar (lokasyon_kodu, lokasyon_adi, lokasyon_tipi, departman_id) 
VALUES (
    'IT-001', 
    'IT Ofisi', 
    'OFIS', 
    (SELECT id FROM departmanlar WHERE departman_kodu = 'IT' LIMIT 1)
)
ON CONFLICT (lokasyon_kodu) 
DO UPDATE SET 
    lokasyon_adi = EXCLUDED.lokasyon_adi,
    departman_id = EXCLUDED.departman_id;

-- =================================================================================
-- 10. BAŞARI MESAJI
-- =================================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Tüm veritabanı düzeltmeleri başarıyla tamamlandı!';
    RAISE NOTICE '📋 Kontrol listesi:';
    RAISE NOTICE '  - lokasyonlar tablosunda departman_id kolonu düzeltildi';
    RAISE NOTICE '  - mac_adresleri constraint''i güncellendi';
    RAISE NOTICE '  - seri_numaralari constraint''i güncellendi';
    RAISE NOTICE '  - Benzersizlik constraint''leri eklendi';
    RAISE NOTICE '  - Foreign key ilişkileri düzeltildi';
    RAISE NOTICE '  - Performans indexleri eklendi';
    RAISE NOTICE '🚀 Sistem artık kullanıma hazır!';
END $$;