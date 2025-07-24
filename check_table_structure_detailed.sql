-- Tablo Yapısını Detaylı Kontrol Etme Script'i
-- Hangi tabloların kendi ID'si var, hangilerinin yok kontrol edelim

-- 1. Tüm tabloları listele
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Her tablonun sütunlarını kontrol et
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'PRIMARY KEY'
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN 'FOREIGN KEY'
        ELSE 'NORMAL'
    END as constraint_type,
    kcu.referenced_table_name,
    kcu.referenced_column_name
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN information_schema.key_column_usage kcu 
    ON c.table_name = kcu.table_name 
    AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc 
    ON kcu.constraint_name = tc.constraint_name
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
AND c.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- 3. Primary Key'leri kontrol et
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 4. Foreign Key'leri kontrol et
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 5. ID'si olmayan tabloları bul
SELECT DISTINCT
    t.table_name,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'VAR'
        ELSE 'YOK'
    END as primary_key_durumu
FROM information_schema.tables t
LEFT JOIN (
    SELECT 
        tc.table_name,
        kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
) pk ON t.table_name = pk.table_name
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
ORDER BY primary_key_durumu DESC, t.table_name;

-- 6. Sadece foreign key'li tabloları bul
SELECT 
    t.table_name,
    COUNT(fk.column_name) as foreign_key_sayisi,
    STRING_AGG(fk.column_name, ', ') as foreign_key_sutunlari
FROM information_schema.tables t
LEFT JOIN (
    SELECT 
        tc.table_name,
        kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
) fk ON t.table_name = fk.table_name
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
HAVING COUNT(fk.column_name) > 0
ORDER BY foreign_key_sayisi DESC, t.table_name;

-- 7. Örnek veri kontrolü
SELECT 
    'lokasyonlar' as tablo,
    COUNT(*) as kayit_sayisi,
    MIN(id) as min_id,
    MAX(id) as max_id
FROM lokasyonlar
UNION ALL
SELECT 
    'departmanlar' as tablo,
    COUNT(*) as kayit_sayisi,
    MIN(id) as min_id,
    MAX(id) as max_id
FROM departmanlar
UNION ALL
SELECT 
    'markalar' as tablo,
    COUNT(*) as kayit_sayisi,
    MIN(id) as min_id,
    MAX(id) as max_id
FROM markalar
UNION ALL
SELECT 
    'modeller' as tablo,
    COUNT(*) as kayit_sayisi,
    MIN(id) as min_id,
    MAX(id) as max_id
FROM modeller
UNION ALL
SELECT 
    'personel' as tablo,
    COUNT(*) as kayit_sayisi,
    MIN(id) as min_id,
    MAX(id) as max_id
FROM personel
UNION ALL
SELECT 
    'ekipman_envanteri' as tablo,
    COUNT(*) as kayit_sayisi,
    MIN(id) as min_id,
    MAX(id) as max_id
FROM ekipman_envanteri
UNION ALL
SELECT 
    'ekipman_gecmisi' as tablo,
    COUNT(*) as kayit_sayisi,
    MIN(id) as min_id,
    MAX(id) as max_id
FROM ekipman_gecmisi
UNION ALL
SELECT 
    'seri_numaralari' as tablo,
    COUNT(*) as kayit_sayisi,
    MIN(id) as min_id,
    MAX(id) as max_id
FROM seri_numaralari
UNION ALL
SELECT 
    'mac_adresleri' as tablo,
    COUNT(*) as kayit_sayisi,
    MIN(id) as min_id,
    MAX(id) as max_id
FROM mac_adresleri; 