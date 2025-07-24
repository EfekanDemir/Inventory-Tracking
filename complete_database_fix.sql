-- Tam Veritabanı Düzeltme ve Otomatik ID Atama Sistemi
-- Bu script tüm tabloları inceleyip eksik primary key'leri düzeltir

-- 1. Önce tüm tabloları ve mevcut durumlarını analiz et
DO $$
DECLARE
    r RECORD;
    pk_count INTEGER;
    id_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERİTABANI ANALİZİ BAŞLIYOR ===';
    RAISE NOTICE '';
    
    FOR r IN 
        SELECT 
            t.table_name,
            t.table_type
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
    LOOP
        -- Primary key sayısını kontrol et
        SELECT COUNT(*) INTO pk_count
        FROM information_schema.table_constraints tc
        WHERE tc.table_name = r.table_name 
        AND tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public';
        
        -- ID sütunu sayısını kontrol et
        SELECT COUNT(*) INTO id_count
        FROM information_schema.columns c
        WHERE c.table_name = r.table_name 
        AND c.column_name = 'id'
        AND c.table_schema = 'public';
        
        RAISE NOTICE 'Tablo: % | Primary Key: % | ID Sütunu: %', 
            r.table_name, 
            CASE WHEN pk_count > 0 THEN 'VAR' ELSE 'YOK' END,
            CASE WHEN id_count > 0 THEN 'VAR' ELSE 'YOK' END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== ANALİZ TAMAMLANDI ===';
END $$;

-- 2. Primary key'i olmayan tablolar için ID sütunu ekle
DO $$
DECLARE
    r RECORD;
    pk_count INTEGER;
    id_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== EKSİK ID SÜTUNLARI EKLENİYOR ===';
    
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
        
        -- Eğer primary key yoksa ve ID sütunu da yoksa ekle
        IF pk_count = 0 AND id_count = 0 THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN id SERIAL', r.table_name);
            RAISE NOTICE '✓ % tablosuna id sütunu eklendi', r.table_name;
        ELSIF pk_count = 0 AND id_count > 0 THEN
            RAISE NOTICE '⚠ % tablosunda id sütunu var ama primary key yok', r.table_name;
        ELSE
            RAISE NOTICE '✓ % tablosu zaten düzgün', r.table_name;
        END IF;
    END LOOP;
END $$;

-- 3. Primary key'leri ekle
DO $$
DECLARE
    r RECORD;
    pk_count INTEGER;
    id_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== PRIMARY KEY''LER EKLENİYOR ===';
    
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
        
        -- Eğer primary key yoksa ve ID sütunu varsa primary key ekle
        IF pk_count = 0 AND id_count > 0 THEN
            EXECUTE format('ALTER TABLE %I ADD PRIMARY KEY (id)', r.table_name);
            RAISE NOTICE '✓ % tablosuna primary key eklendi', r.table_name;
        ELSIF pk_count > 0 THEN
            RAISE NOTICE '✓ % tablosunda primary key zaten var', r.table_name;
        ELSE
            RAISE NOTICE '⚠ % tablosunda id sütunu yok, primary key eklenemedi', r.table_name;
        END IF;
    END LOOP;
END $$;

-- 4. Otomatik ID Atama Fonksiyonu
CREATE OR REPLACE FUNCTION auto_assign_ids()
RETURNS void AS $$
DECLARE
    r RECORD;
    max_id INTEGER;
    current_id INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== OTOMATİK ID ATAMA BAŞLIYOR ===';
    
    FOR r IN 
        SELECT 
            t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
    LOOP
        -- ID sütunu var mı kontrol et
        IF EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_name = r.table_name 
            AND c.column_name = 'id'
            AND c.table_schema = 'public'
        ) THEN
            -- Mevcut maksimum ID'yi bul
            BEGIN
                EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM %I', r.table_name) INTO max_id;
                
                -- ID'si NULL olan kayıtları bul ve güncelle
                EXECUTE format('SELECT COUNT(*) FROM %I WHERE id IS NULL', r.table_name) INTO current_id;
                
                IF current_id > 0 THEN
                    -- NULL ID'leri güncelle
                    EXECUTE format('
                        UPDATE %I 
                        SET id = nextval(pg_get_serial_sequence(''%I'', ''id''))
                        WHERE id IS NULL
                    ', r.table_name, r.table_name);
                    
                    RAISE NOTICE '✓ % tablosunda % kayıt için ID atandı', r.table_name, current_id;
                ELSE
                    RAISE NOTICE '✓ % tablosunda NULL ID yok', r.table_name;
                END IF;
                
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE '⚠ % tablosunda ID atama hatası: %', r.table_name, SQLERRM;
            END;
        ELSE
            RAISE NOTICE '⚠ % tablosunda id sütunu yok', r.table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== OTOMATİK ID ATAMA TAMAMLANDI ===';
END;
$$ LANGUAGE plpgsql;

-- 5. Yeni kayıt ekleme için trigger fonksiyonu
CREATE OR REPLACE FUNCTION auto_id_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer ID NULL ise otomatik ata
    IF NEW.id IS NULL THEN
        NEW.id = nextval(pg_get_serial_sequence(TG_TABLE_NAME, 'id'));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Tüm tablolar için trigger oluştur
DO $$
DECLARE
    r RECORD;
    trigger_name TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== OTOMATİK ID TRIGGER''LARI OLUŞTURULUYOR ===';
    
    FOR r IN 
        SELECT 
            t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
    LOOP
        -- ID sütunu var mı kontrol et
        IF EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_name = r.table_name 
            AND c.column_name = 'id'
            AND c.table_schema = 'public'
        ) THEN
            trigger_name := r.table_name || '_auto_id_trigger';
            
            -- Eğer trigger yoksa oluştur
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.triggers 
                WHERE trigger_name = trigger_name
                AND event_object_table = r.table_name
            ) THEN
                EXECUTE format('
                    CREATE TRIGGER %I
                    BEFORE INSERT ON %I
                    FOR EACH ROW
                    EXECUTE FUNCTION auto_id_trigger_function()
                ', trigger_name, r.table_name);
                
                RAISE NOTICE '✓ % tablosu için otomatik ID trigger oluşturuldu', r.table_name;
            ELSE
                RAISE NOTICE '✓ % tablosu için trigger zaten var', r.table_name;
            END IF;
        ELSE
            RAISE NOTICE '⚠ % tablosunda id sütunu yok, trigger oluşturulamadı', r.table_name;
        END IF;
    END LOOP;
END $$;

-- 7. Foreign key constraint'leri düzelt
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FOREIGN KEY CONSTRAINT''LER DÜZELTİLİYOR ===';
    
    -- ekipman_envanteri -> lokasyonlar
    ALTER TABLE ekipman_envanteri 
    DROP CONSTRAINT IF EXISTS ekipman_envanteri_lokasyon_id_fkey;
    
    ALTER TABLE ekipman_envanteri 
    ADD CONSTRAINT ekipman_envanteri_lokasyon_id_fkey 
    FOREIGN KEY (lokasyon_id) REFERENCES lokasyonlar(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✓ ekipman_envanteri -> lokasyonlar foreign key düzeltildi';
END $$;

DO $$
BEGIN
    -- ekipman_envanteri -> modeller
    ALTER TABLE ekipman_envanteri 
    DROP CONSTRAINT IF EXISTS ekipman_envanteri_model_id_fkey;
    
    ALTER TABLE ekipman_envanteri 
    ADD CONSTRAINT ekipman_envanteri_model_id_fkey 
    FOREIGN KEY (model_id) REFERENCES modeller(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✓ ekipman_envanteri -> modeller foreign key düzeltildi';
END $$;

-- Personel foreign key'i - sütun adını kontrol ederek
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ekipman_envanteri' 
        AND column_name = 'atanan_personel_id'
    ) THEN
        ALTER TABLE ekipman_envanteri 
        DROP CONSTRAINT IF EXISTS ekipman_envanteri_atanan_personel_id_fkey;
        
        ALTER TABLE ekipman_envanteri 
        ADD CONSTRAINT ekipman_envanteri_atanan_personel_id_fkey 
        FOREIGN KEY (atanan_personel_id) REFERENCES personel(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✓ ekipman_envanteri -> personel (atanan_personel_id) foreign key düzeltildi';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ekipman_envanteri' 
        AND column_name = 'personel_id'
    ) THEN
        ALTER TABLE ekipman_envanteri 
        DROP CONSTRAINT IF EXISTS ekipman_envanteri_personel_id_fkey;
        
        ALTER TABLE ekipman_envanteri 
        ADD CONSTRAINT ekipman_envanteri_personel_id_fkey 
        FOREIGN KEY (personel_id) REFERENCES personel(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✓ ekipman_envanteri -> personel (personel_id) foreign key düzeltildi';
    ELSE
        RAISE NOTICE '⚠ ekipman_envanteri tablosunda personel sütunu bulunamadı';
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
    
    RAISE NOTICE '✓ ekipman_gecmisi -> ekipman_envanteri foreign key düzeltildi';
END $$;

DO $$
BEGIN
    -- seri_numaralari -> modeller
    ALTER TABLE seri_numaralari 
    DROP CONSTRAINT IF EXISTS seri_numaralari_model_id_fkey;
    
    ALTER TABLE seri_numaralari 
    ADD CONSTRAINT seri_numaralari_model_id_fkey 
    FOREIGN KEY (model_id) REFERENCES modeller(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✓ seri_numaralari -> modeller foreign key düzeltildi';
END $$;

DO $$
BEGIN
    -- mac_adresleri -> modeller
    ALTER TABLE mac_adresleri 
    DROP CONSTRAINT IF EXISTS mac_adresleri_model_id_fkey;
    
    ALTER TABLE mac_adresleri 
    ADD CONSTRAINT mac_adresleri_model_id_fkey 
    FOREIGN KEY (model_id) REFERENCES modeller(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✓ mac_adresleri -> modeller foreign key düzeltildi';
END $$;

-- 8. Otomatik ID atama fonksiyonunu çalıştır
SELECT auto_assign_ids();

-- 9. Final kontrol
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
    RAISE NOTICE '=== VERİTABANI DÜZELTME TAMAMLANDI ===';
    RAISE NOTICE 'Artık tüm tablolar primary key''e sahip ve otomatik ID atama aktif!';
END $$; 