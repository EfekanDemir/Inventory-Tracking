-- ==============================================
-- TABLO YAPISINI KONTROL ETME SCRIPT'İ
-- ==============================================

-- 1. ekipman_envanteri tablosunun mevcut sütunlarını kontrol et
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ekipman_envanteri' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. MAC adresi ve seri numarası sütunlarının varlığını kontrol et
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ekipman_envanteri' 
            AND column_name = 'mac_adresi'
        ) THEN 'ESKI YAPI - mac_adresi sütunu var'
        ELSE 'YENI YAPI - mac_adresi sütunu yok'
    END as mac_adresi_durumu,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ekipman_envanteri' 
            AND column_name = 'seri_no'
        ) THEN 'ESKI YAPI - seri_no sütunu var'
        ELSE 'YENI YAPI - seri_no sütunu yok'
    END as seri_no_durumu,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ekipman_envanteri' 
            AND column_name = 'mac_adresi_id'
        ) THEN 'YENI YAPI - mac_adresi_id sütunu var'
        ELSE 'ESKI YAPI - mac_adresi_id sütunu yok'
    END as mac_adresi_id_durumu,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ekipman_envanteri' 
            AND column_name = 'seri_no_id'
        ) THEN 'YENI YAPI - seri_no_id sütunu var'
        ELSE 'ESKI YAPI - seri_no_id sütunu yok'
    END as seri_no_id_durumu;

-- 3. Foreign key constraint'leri kontrol et
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'ekipman_envanteri';

-- 4. Örnek veri kontrolü
SELECT 
    'Örnek ekipman verisi' as kontrol_tipi,
    COUNT(*) as kayit_sayisi
FROM ekipman_envanteri;

-- 5. MAC adresleri tablosu kontrolü
SELECT 
    'MAC adresleri tablosu' as tablo_adi,
    COUNT(*) as kayit_sayisi
FROM mac_adresleri;

-- 6. Seri numaraları tablosu kontrolü
SELECT 
    'Seri numaraları tablosu' as tablo_adi,
    COUNT(*) as kayit_sayisi
FROM seri_numaralari;

-- 7. Örnek JOIN sorgusu testi
SELECT 
    e.id,
    e.barkod,
    ma.mac_adresi,
    sn.seri_no,
    m.marka_adi,
    mo.model_adi
FROM ekipman_envanteri e
LEFT JOIN mac_adresleri ma ON e.mac_adresi_id = ma.id
LEFT JOIN seri_numaralari sn ON e.seri_no_id = sn.id
LEFT JOIN markalar m ON e.marka_id = m.id
LEFT JOIN modeller mo ON e.model_id = mo.id
LIMIT 5; 