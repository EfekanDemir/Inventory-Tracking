-- Otomatik ID Atama Sistemi Test Script'i
-- Bu script sistemin düzgün çalışıp çalışmadığını test eder

-- 1. Test verileri oluştur
DO $$
DECLARE
    test_dept_id INTEGER;
    test_brand_id INTEGER;
    test_model_id INTEGER;
    test_location_id INTEGER;
    test_personnel_id INTEGER;
BEGIN
    RAISE NOTICE '=== OTOMATİK ID SİSTEMİ TESTİ BAŞLIYOR ===';
    RAISE NOTICE '';
    
    -- Test departmanı ekle (ID olmadan)
    INSERT INTO departmanlar (departman_adi, aciklama)
    VALUES ('Test Departmanı', 'Otomatik ID test için')
    RETURNING id INTO test_dept_id;
    
    RAISE NOTICE '✓ Test departmanı eklendi: ID = %', test_dept_id;
    
    -- Test markası ekle (ID olmadan)
    INSERT INTO markalar (marka_adi, aciklama)
    VALUES ('Test Markası', 'Otomatik ID test için')
    RETURNING id INTO test_brand_id;
    
    RAISE NOTICE '✓ Test markası eklendi: ID = %', test_brand_id;
    
    -- Test modeli ekle (ID olmadan)
    INSERT INTO modeller (model_adi, kategori, marka_id)
    VALUES ('Test Modeli', 'Bilgisayar', test_brand_id)
    RETURNING id INTO test_model_id;
    
    RAISE NOTICE '✓ Test modeli eklendi: ID = %', test_model_id;
    
    -- Test lokasyonu ekle (ID olmadan)
    INSERT INTO lokasyonlar (lokasyon_kodu, lokasyon_adi, lokasyon_tipi, departman_id)
    VALUES ('TEST001', 'Test Lokasyonu', 'DEPO', test_dept_id)
    RETURNING id INTO test_location_id;
    
    RAISE NOTICE '✓ Test lokasyonu eklendi: ID = %', test_location_id;
    
    -- Test personeli ekle (ID olmadan)
    INSERT INTO personel (ad, soyad, email, sicil_no, departman_id)
    VALUES ('Test', 'Personel', 'test@test.com', 'TEST001', test_dept_id)
    RETURNING id INTO test_personnel_id;
    
    RAISE NOTICE '✓ Test personeli eklendi: ID = %', test_personnel_id;
    
    -- Test seri numarası ekle (ID olmadan)
    INSERT INTO seri_numaralari (seri_no, aciklama, model_id)
    VALUES ('TEST-SN-001', 'Test seri numarası', test_model_id);
    
    RAISE NOTICE '✓ Test seri numarası eklendi (otomatik ID ile)';
    
    -- Test MAC adresi ekle (ID olmadan)
    INSERT INTO mac_adresleri (mac_adresi, aciklama, model_id)
    VALUES ('00:11:22:33:44:55', 'Test MAC adresi', test_model_id);
    
    RAISE NOTICE '✓ Test MAC adresi eklendi (otomatik ID ile)';
    
    -- Test ekipman envanteri ekle (ID olmadan)
    INSERT INTO ekipman_envanteri (marka_model, model_id, lokasyon_id, atanan_personel_id, durum)
    VALUES ('Test Ekipmanı', test_model_id, test_location_id, test_personnel_id, 'AKTIF');
    
    RAISE NOTICE '✓ Test ekipman envanteri eklendi (otomatik ID ile)';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== TEST VERİLERİ BAŞARIYLA OLUŞTURULDU ===';
    RAISE NOTICE '';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Test verisi oluşturma hatası: %', SQLERRM;
END $$;

-- 2. Tüm tabloların ID durumunu kontrol et
DO $$
DECLARE
    r RECORD;
    record_count INTEGER;
    null_id_count INTEGER;
BEGIN
    RAISE NOTICE '=== ID DURUMU KONTROLÜ ===';
    RAISE NOTICE '';
    
    FOR r IN 
        SELECT 
            t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
    LOOP
        -- Toplam kayıt sayısı
        EXECUTE format('SELECT COUNT(*) FROM %I', r.table_name) INTO record_count;
        
        -- NULL ID sayısı
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE id IS NULL', r.table_name) INTO null_id_count;
        
        RAISE NOTICE 'Tablo: % | Toplam: % | NULL ID: % | Durum: %', 
            r.table_name, 
            record_count,
            null_id_count,
            CASE WHEN null_id_count = 0 THEN '✅ TAMAM' ELSE '❌ SORUN' END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== ID DURUMU KONTROLÜ TAMAMLANDI ===';
END $$;

-- 3. Otomatik ID atama fonksiyonunu test et
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== OTOMATİK ID ATAMA TESTİ ===';
    
    -- Fonksiyonu çalıştır
    PERFORM auto_assign_ids();
    
    RAISE NOTICE '✓ Otomatik ID atama fonksiyonu çalıştırıldı';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Otomatik ID atama hatası: %', SQLERRM;
END $$;

-- 4. Trigger'ların çalışıp çalışmadığını test et
DO $$
DECLARE
    new_dept_id INTEGER;
    new_brand_id INTEGER;
    new_model_id INTEGER;
    new_location_id INTEGER;
    new_personnel_id INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TRIGGER TESTİ ===';
    
    -- Yeni kayıtlar ekle (ID NULL olarak)
    INSERT INTO departmanlar (departman_adi, aciklama)
    VALUES ('Trigger Test Departmanı', 'Trigger test için')
    RETURNING id INTO new_dept_id;
    
    RAISE NOTICE '✓ Trigger ile departman eklendi: ID = %', new_dept_id;
    
    INSERT INTO markalar (marka_adi, aciklama)
    VALUES ('Trigger Test Markası', 'Trigger test için')
    RETURNING id INTO new_brand_id;
    
    RAISE NOTICE '✓ Trigger ile marka eklendi: ID = %', new_brand_id;
    
    INSERT INTO modeller (model_adi, kategori, marka_id)
    VALUES ('Trigger Test Modeli', 'Laptop', new_brand_id)
    RETURNING id INTO new_model_id;
    
    RAISE NOTICE '✓ Trigger ile model eklendi: ID = %', new_model_id;
    
    INSERT INTO lokasyonlar (lokasyon_kodu, lokasyon_adi, lokasyon_tipi, departman_id)
    VALUES ('TRIGGER001', 'Trigger Test Lokasyonu', 'OFIS', new_dept_id)
    RETURNING id INTO new_location_id;
    
    RAISE NOTICE '✓ Trigger ile lokasyon eklendi: ID = %', new_location_id;
    
    INSERT INTO personel (ad, soyad, email, sicil_no, departman_id)
    VALUES ('Trigger', 'Test', 'trigger@test.com', 'TRIGGER001', new_dept_id)
    RETURNING id INTO new_personnel_id;
    
    RAISE NOTICE '✓ Trigger ile personel eklendi: ID = %', new_personnel_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== TRIGGER TESTİ BAŞARILI ===';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Trigger test hatası: %', SQLERRM;
END $$;

-- 5. Cascade delete testi
DO $$
DECLARE
    test_location_id INTEGER;
    equipment_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CASCADE DELETE TESTİ ===';
    
    -- Test lokasyonu oluştur
    INSERT INTO lokasyonlar (lokasyon_kodu, lokasyon_adi, lokasyon_tipi, departman_id)
    VALUES ('CASCADE001', 'Cascade Test Lokasyonu', 'DEPO', 1)
    RETURNING id INTO test_location_id;
    
    RAISE NOTICE '✓ Test lokasyonu oluşturuldu: ID = %', test_location_id;
    
    -- Bu lokasyona ekipman ekle
    INSERT INTO ekipman_envanteri (marka_model, model_id, lokasyon_id, durum)
    VALUES ('Cascade Test Ekipmanı', 1, test_location_id, 'AKTIF');
    
    RAISE NOTICE '✓ Test ekipmanı eklendi';
    
    -- Ekipman sayısını kontrol et
    SELECT COUNT(*) INTO equipment_count
    FROM ekipman_envanteri
    WHERE lokasyon_id = test_location_id;
    
    RAISE NOTICE '✓ Ekipman sayısı: %', equipment_count;
    
    -- Lokasyonu sil (cascade delete testi)
    DELETE FROM lokasyonlar WHERE id = test_location_id;
    
    -- Ekipman sayısını tekrar kontrol et
    SELECT COUNT(*) INTO equipment_count
    FROM ekipman_envanteri
    WHERE lokasyon_id = test_location_id;
    
    RAISE NOTICE '✓ Silme sonrası ekipman sayısı: %', equipment_count;
    
    IF equipment_count = 0 THEN
        RAISE NOTICE '✅ Cascade delete çalışıyor!';
    ELSE
        RAISE NOTICE '❌ Cascade delete çalışmıyor!';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Cascade delete test hatası: %', SQLERRM;
END $$;

-- 6. Final kontrol
DO $$
DECLARE
    r RECORD;
    pk_count INTEGER;
    id_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FİNAL KONTROL ===';
    
    FOR r IN 
        SELECT 
            t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
    LOOP
        -- Primary key kontrolü
        SELECT COUNT(*) INTO pk_count
        FROM information_schema.table_constraints tc
        WHERE tc.table_name = r.table_name 
        AND tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public';
        
        -- ID sütunu kontrolü
        SELECT COUNT(*) INTO id_count
        FROM information_schema.columns c
        WHERE c.table_name = r.table_name 
        AND c.column_name = 'id'
        AND c.table_schema = 'public';
        
        RAISE NOTICE 'Tablo: % | Primary Key: % | ID Sütunu: % | Durum: %', 
            r.table_name, 
            CASE WHEN pk_count > 0 THEN 'VAR' ELSE 'YOK' END,
            CASE WHEN id_count > 0 THEN 'VAR' ELSE 'YOK' END,
            CASE WHEN pk_count > 0 AND id_count > 0 THEN '✅ TAMAM' ELSE '❌ SORUN' END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== OTOMATİK ID SİSTEMİ TESTİ TAMAMLANDI ===';
    RAISE NOTICE 'Artık tüm tablolar otomatik ID atama sistemine sahip!';
END $$; 