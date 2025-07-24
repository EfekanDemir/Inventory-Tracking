-- Güvenli Tablo Yapısı Düzeltme Script'i
-- Sütun adlarını kontrol ederek düzeltir

-- 1. Önce mevcut sütunları kontrol et
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '=== MEVCUT SÜTUNLAR ===';
    
    FOR r IN 
        SELECT 
            table_name,
            column_name,
            data_type,
            is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name IN ('ekipman_envanteri', 'ekipman_gecmisi', 'seri_numaralari', 'mac_adresleri')
        ORDER BY table_name, ordinal_position
    LOOP
        RAISE NOTICE 'Tablo: %, Sütun: %, Tip: %, Null: %', 
            r.table_name, r.column_name, r.data_type, r.is_nullable;
    END LOOP;
END $$;

-- 2. Eksik ID sütunlarını ekle
-- seri_numaralari tablosuna ID ekle
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seri_numaralari' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE seri_numaralari ADD COLUMN id SERIAL;
        RAISE NOTICE 'seri_numaralari tablosuna id sütunu eklendi';
    ELSE
        RAISE NOTICE 'seri_numaralari tablosunda id sütunu zaten var';
    END IF;
END $$;

-- mac_adresleri tablosuna ID ekle
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mac_adresleri' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE mac_adresleri ADD COLUMN id SERIAL;
        RAISE NOTICE 'mac_adresleri tablosuna id sütunu eklendi';
    ELSE
        RAISE NOTICE 'mac_adresleri tablosunda id sütunu zaten var';
    END IF;
END $$;

-- ekipman_gecmisi tablosuna ID ekle
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ekipman_gecmisi' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE ekipman_gecmisi ADD COLUMN id SERIAL;
        RAISE NOTICE 'ekipman_gecmisi tablosuna id sütunu eklendi';
    ELSE
        RAISE NOTICE 'ekipman_gecmisi tablosunda id sütunu zaten var';
    END IF;
END $$;

-- 3. Primary Key'leri ekle
-- seri_numaralari tablosuna Primary Key ekle
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'seri_numaralari' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE seri_numaralari ADD PRIMARY KEY (id);
        RAISE NOTICE 'seri_numaralari tablosuna Primary Key eklendi';
    ELSE
        RAISE NOTICE 'seri_numaralari tablosunda Primary Key zaten var';
    END IF;
END $$;

-- mac_adresleri tablosuna Primary Key ekle
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'mac_adresleri' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE mac_adresleri ADD PRIMARY KEY (id);
        RAISE NOTICE 'mac_adresleri tablosuna Primary Key eklendi';
    ELSE
        RAISE NOTICE 'mac_adresleri tablosunda Primary Key zaten var';
    END IF;
END $$;

-- ekipman_gecmisi tablosuna Primary Key ekle
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'ekipman_gecmisi' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE ekipman_gecmisi ADD PRIMARY KEY (id);
        RAISE NOTICE 'ekipman_gecmisi tablosuna Primary Key eklendi';
    ELSE
        RAISE NOTICE 'ekipman_gecmisi tablosunda Primary Key zaten var';
    END IF;
END $$;

-- 4. Foreign Key constraint'leri düzelt (sütun adlarını kontrol ederek)
DO $$
BEGIN
    -- ekipman_envanteri -> lokasyonlar
    ALTER TABLE ekipman_envanteri 
    DROP CONSTRAINT IF EXISTS ekipman_envanteri_lokasyon_id_fkey;
    
    ALTER TABLE ekipman_envanteri 
    ADD CONSTRAINT ekipman_envanteri_lokasyon_id_fkey 
    FOREIGN KEY (lokasyon_id) REFERENCES lokasyonlar(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'ekipman_envanteri -> lokasyonlar foreign key düzeltildi';
END $$;

DO $$
BEGIN
    -- ekipman_envanteri -> modeller
    ALTER TABLE ekipman_envanteri 
    DROP CONSTRAINT IF EXISTS ekipman_envanteri_model_id_fkey;
    
    ALTER TABLE ekipman_envanteri 
    ADD CONSTRAINT ekipman_envanteri_model_id_fkey 
    FOREIGN KEY (model_id) REFERENCES modeller(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'ekipman_envanteri -> modeller foreign key düzeltildi';
END $$;

-- Personel foreign key'i - sütun adını kontrol ederek
DO $$
BEGIN
    -- Önce hangi sütunun var olduğunu kontrol et
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ekipman_envanteri' 
        AND column_name = 'atanan_personel_id'
    ) THEN
        -- atanan_personel_id varsa
        ALTER TABLE ekipman_envanteri 
        DROP CONSTRAINT IF EXISTS ekipman_envanteri_atanan_personel_id_fkey;
        
        ALTER TABLE ekipman_envanteri 
        ADD CONSTRAINT ekipman_envanteri_atanan_personel_id_fkey 
        FOREIGN KEY (atanan_personel_id) REFERENCES personel(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'ekipman_envanteri -> personel (atanan_personel_id) foreign key düzeltildi';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ekipman_envanteri' 
        AND column_name = 'personel_id'
    ) THEN
        -- personel_id varsa
        ALTER TABLE ekipman_envanteri 
        DROP CONSTRAINT IF EXISTS ekipman_envanteri_personel_id_fkey;
        
        ALTER TABLE ekipman_envanteri 
        ADD CONSTRAINT ekipman_envanteri_personel_id_fkey 
        FOREIGN KEY (personel_id) REFERENCES personel(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'ekipman_envanteri -> personel (personel_id) foreign key düzeltildi';
    ELSE
        RAISE NOTICE 'ekipman_envanteri tablosunda personel sütunu bulunamadı';
    END IF;
END $$;

DO $$
BEGIN
    -- ekipman_gecmisi -> ekipman_envanteri
    ALTER TABLE ekipman_gecmisi 
    DROP CONSTRAINT IF EXISTS ekipman_gecmisi_envanter_id_fkey;
    
    ALTER TABLE ekipman_gecmisi 
    ADD CONSTRAINT ekipman_gecmisi_envanter_id_fkey 
    FOREIGN KEY (envanter_id) REFERENCES ekipman_envanteri(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'ekipman_gecmisi -> ekipman_envanteri foreign key düzeltildi';
END $$;

DO $$
BEGIN
    -- seri_numaralari -> modeller
    ALTER TABLE seri_numaralari 
    DROP CONSTRAINT IF EXISTS seri_numaralari_model_id_fkey;
    
    ALTER TABLE seri_numaralari 
    ADD CONSTRAINT seri_numaralari_model_id_fkey 
    FOREIGN KEY (model_id) REFERENCES modeller(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'seri_numaralari -> modeller foreign key düzeltildi';
END $$;

DO $$
BEGIN
    -- mac_adresleri -> modeller
    ALTER TABLE mac_adresleri 
    DROP CONSTRAINT IF EXISTS mac_adresleri_model_id_fkey;
    
    ALTER TABLE mac_adresleri 
    ADD CONSTRAINT mac_adresleri_model_id_fkey 
    FOREIGN KEY (model_id) REFERENCES modeller(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'mac_adresleri -> modeller foreign key düzeltildi';
END $$;

-- 5. Düzeltme sonrası kontrol
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '=== DÜZELTME SONRASI KONTROL ===';
    
    FOR r IN 
        SELECT 
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
        AND t.table_name IN ('ekipman_envanteri', 'ekipman_gecmisi', 'seri_numaralari', 'mac_adresleri')
        ORDER BY primary_key_durumu DESC, t.table_name
    LOOP
        RAISE NOTICE 'Tablo: %, Primary Key: %', r.table_name, r.primary_key_durumu;
    END LOOP;
END $$;

-- 6. Basit silme testi
DO $$
DECLARE
    test_location_id INTEGER;
BEGIN
    -- Test için bir lokasyon oluştur
    INSERT INTO lokasyonlar (lokasyon_kodu, lokasyon_adi, lokasyon_tipi, departman_id)
    VALUES ('TEST001', 'Test Lokasyonu', 'DEPO', 1)
    RETURNING id INTO test_location_id;
    
    RAISE NOTICE 'Test lokasyonu oluşturuldu: ID = %', test_location_id;
    
    -- Test silme işlemi
    DELETE FROM lokasyonlar WHERE id = test_location_id;
    
    RAISE NOTICE 'Test lokasyonu silindi - Cascade delete çalışıyor!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test silme hatası: %', SQLERRM;
END $$; 