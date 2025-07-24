-- ==============================================
-- Ekipman Envanteri Tablosunu Foreign Key'lere Dönüştürme
-- ==============================================

-- Bu script ekipman_envanteri tablosundaki seri_no ve mac_adresi alanlarını
-- seri_numaralari ve mac_adresleri tablolarına foreign key olarak değiştirir

-- 1. Önce mevcut durumu kontrol et
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '=== MEVCUT DURUM KONTROLÜ ===';
    
    -- ekipman_envanteri tablosundaki seri_no ve mac_adresi kayıtlarını say
    SELECT 
        COUNT(*) as toplam_kayit,
        COUNT(seri_no) as seri_no_sayisi,
        COUNT(mac_adresi) as mac_adresi_sayisi
    INTO r
    FROM ekipman_envanteri;
    
    RAISE NOTICE 'ekipman_envanteri toplam kayıt: %, seri_no: %, mac_adresi: %', 
        r.toplam_kayit, r.seri_no_sayisi, r.mac_adresi_sayisi;
    
    -- seri_numaralari tablosundaki kayıtları say
    SELECT COUNT(*) INTO r FROM seri_numaralari;
    RAISE NOTICE 'seri_numaralari tablosu kayıt sayısı: %', r.count;
    
    -- mac_adresleri tablosundaki kayıtları say
    SELECT COUNT(*) INTO r FROM mac_adresleri;
    RAISE NOTICE 'mac_adresleri tablosu kayıt sayısı: %', r.count;
END $$;

-- 2. Eksik seri numaralarını seri_numaralari tablosuna ekle
DO $$
DECLARE
    r RECORD;
    new_serial_id BIGINT;
BEGIN
    RAISE NOTICE '=== EKSİK SERİ NUMARALARINI EKLEME ===';
    
    FOR r IN 
        SELECT DISTINCT seri_no, model_id
        FROM ekipman_envanteri 
        WHERE seri_no IS NOT NULL 
        AND seri_no NOT IN (SELECT seri_no FROM seri_numaralari)
    LOOP
        INSERT INTO seri_numaralari (seri_no, model_id, kullanim_durumu, aciklama)
        VALUES (r.seri_no, r.model_id, 'KULLANIMDA', 'Ekipman envanterinden otomatik eklenen')
        RETURNING id INTO new_serial_id;
        
        RAISE NOTICE 'Seri no eklendi: % (ID: %)', r.seri_no, new_serial_id;
    END LOOP;
END $$;

-- 3. Eksik MAC adreslerini mac_adresleri tablosuna ekle
DO $$
DECLARE
    r RECORD;
    new_mac_id BIGINT;
BEGIN
    RAISE NOTICE '=== EKSİK MAC ADRESLERİNİ EKLEME ===';
    
    FOR r IN 
        SELECT DISTINCT mac_adresi, model_id
        FROM ekipman_envanteri 
        WHERE mac_adresi IS NOT NULL 
        AND mac_adresi NOT IN (SELECT mac_adresi FROM mac_adresleri)
    LOOP
        INSERT INTO mac_adresleri (mac_adresi, model_id, kullanim_durumu, aciklama)
        VALUES (r.mac_adresi, r.model_id, 'KULLANIMDA', 'Ekipman envanterinden otomatik eklenen')
        RETURNING id INTO new_mac_id;
        
        RAISE NOTICE 'MAC adresi eklendi: % (ID: %)', r.mac_adresi, new_mac_id;
    END LOOP;
END $$;

-- 4. Yeni sütunları ekle (foreign key'ler için)
DO $$
BEGIN
    -- seri_no_id sütunu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ekipman_envanteri' 
        AND column_name = 'seri_no_id'
    ) THEN
        ALTER TABLE ekipman_envanteri ADD COLUMN seri_no_id BIGINT;
        RAISE NOTICE 'seri_no_id sütunu eklendi';
    ELSE
        RAISE NOTICE 'seri_no_id sütunu zaten var';
    END IF;
    
    -- mac_adresi_id sütunu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ekipman_envanteri' 
        AND column_name = 'mac_adresi_id'
    ) THEN
        ALTER TABLE ekipman_envanteri ADD COLUMN mac_adresi_id BIGINT;
        RAISE NOTICE 'mac_adresi_id sütunu eklendi';
    ELSE
        RAISE NOTICE 'mac_adresi_id sütunu zaten var';
    END IF;
END $$;

-- 5. Yeni sütunları doldur (mevcut verileri eşleştir)
DO $$
DECLARE
    r RECORD;
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== VERİ EŞLEŞTİRME ===';
    
    -- seri_no_id'leri doldur
    UPDATE ekipman_envanteri 
    SET seri_no_id = sn.id
    FROM seri_numaralari sn
    WHERE ekipman_envanteri.seri_no = sn.seri_no
    AND ekipman_envanteri.seri_no_id IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'seri_no_id güncellenen kayıt sayısı: %', updated_count;
    
    -- mac_adresi_id'leri doldur
    UPDATE ekipman_envanteri 
    SET mac_adresi_id = ma.id
    FROM mac_adresleri ma
    WHERE ekipman_envanteri.mac_adresi = ma.mac_adresi
    AND ekipman_envanteri.mac_adresi_id IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'mac_adresi_id güncellenen kayıt sayısı: %', updated_count;
END $$;

-- 6. Foreign key constraint'leri ekle
DO $$
BEGIN
    -- seri_no_id foreign key
    ALTER TABLE ekipman_envanteri 
    DROP CONSTRAINT IF EXISTS ekipman_envanteri_seri_no_id_fkey;
    
    ALTER TABLE ekipman_envanteri 
    ADD CONSTRAINT ekipman_envanteri_seri_no_id_fkey 
    FOREIGN KEY (seri_no_id) REFERENCES seri_numaralari(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'seri_no_id foreign key eklendi';
    
    -- mac_adresi_id foreign key
    ALTER TABLE ekipman_envanteri 
    DROP CONSTRAINT IF EXISTS ekipman_envanteri_mac_adresi_id_fkey;
    
    ALTER TABLE ekipman_envanteri 
    ADD CONSTRAINT ekipman_envanteri_mac_adresi_id_fkey 
    FOREIGN KEY (mac_adresi_id) REFERENCES mac_adresleri(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'mac_adresi_id foreign key eklendi';
END $$;

-- 7. Index'leri ekle
CREATE INDEX IF NOT EXISTS idx_ekipman_seri_no_id ON ekipman_envanteri(seri_no_id);
CREATE INDEX IF NOT EXISTS idx_ekipman_mac_adresi_id ON ekipman_envanteri(mac_adresi_id);

-- 8. Eski unique constraint'leri kaldır
DO $$
BEGIN
    -- Eski unique constraint'leri kaldır
    ALTER TABLE ekipman_envanteri DROP CONSTRAINT IF EXISTS ekipman_envanteri_seri_no_key;
    ALTER TABLE ekipman_envanteri DROP CONSTRAINT IF EXISTS ekipman_envanteri_mac_adresi_key;
    
    RAISE NOTICE 'Eski unique constraint''ler kaldırıldı';
END $$;

-- 9. Yeni unique constraint'leri ekle (foreign key'ler için)
DO $$
BEGIN
    -- seri_no_id unique constraint (bir seri no sadece bir ekipmana atanabilir)
    ALTER TABLE ekipman_envanteri 
    ADD CONSTRAINT ekipman_envanteri_seri_no_id_key 
    UNIQUE (seri_no_id);
    
    -- mac_adresi_id unique constraint (bir MAC adresi sadece bir ekipmana atanabilir)
    ALTER TABLE ekipman_envanteri 
    ADD CONSTRAINT ekipman_envanteri_mac_adresi_id_key 
    UNIQUE (mac_adresi_id);
    
    RAISE NOTICE 'Yeni unique constraint''ler eklendi';
END $$;

-- 10. Trigger'ları güncelle (foreign key'ler için)
-- Ekipman silindiğinde MAC ve seri numarasını müsait yap
CREATE OR REPLACE FUNCTION update_mac_serial_on_equipment_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- MAC adresini müsait yap
    IF OLD.mac_adresi_id IS NOT NULL THEN
        UPDATE mac_adresleri 
        SET kullanim_durumu = 'MUSAIT' 
        WHERE id = OLD.mac_adresi_id;
    END IF;
    
    -- Seri numarasını müsait yap
    IF OLD.seri_no_id IS NOT NULL THEN
        UPDATE seri_numaralari 
        SET kullanim_durumu = 'MUSAIT' 
        WHERE id = OLD.seri_no_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Ekipman güncellendiğinde MAC/seri durumlarını yönet
CREATE OR REPLACE FUNCTION update_mac_serial_on_equipment_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Eski MAC adresini müsait yap
    IF OLD.mac_adresi_id IS NOT NULL AND OLD.mac_adresi_id != NEW.mac_adresi_id THEN
        UPDATE mac_adresleri 
        SET kullanim_durumu = 'MUSAIT' 
        WHERE id = OLD.mac_adresi_id;
    END IF;
    
    -- Eski seri numarasını müsait yap
    IF OLD.seri_no_id IS NOT NULL AND OLD.seri_no_id != NEW.seri_no_id THEN
        UPDATE seri_numaralari 
        SET kullanim_durumu = 'MUSAIT' 
        WHERE id = OLD.seri_no_id;
    END IF;
    
    -- Yeni MAC adresini kullanılıyor yap
    IF NEW.mac_adresi_id IS NOT NULL THEN
        UPDATE mac_adresleri 
        SET kullanim_durumu = 'KULLANIMDA' 
        WHERE id = NEW.mac_adresi_id;
    END IF;
    
    -- Yeni seri numarasını kullanılıyor yap
    IF NEW.seri_no_id IS NOT NULL THEN
        UPDATE seri_numaralari 
        SET kullanim_durumu = 'KULLANIMDA' 
        WHERE id = NEW.seri_no_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ekipman eklendiğinde MAC/seri durumlarını yönet
CREATE OR REPLACE FUNCTION update_mac_serial_on_equipment_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- MAC adresini kullanılıyor yap
    IF NEW.mac_adresi_id IS NOT NULL THEN
        UPDATE mac_adresleri 
        SET kullanim_durumu = 'KULLANIMDA' 
        WHERE id = NEW.mac_adresi_id;
    END IF;
    
    -- Seri numarasını kullanılıyor yap
    IF NEW.seri_no_id IS NOT NULL THEN
        UPDATE seri_numaralari 
        SET kullanim_durumu = 'KULLANIMDA' 
        WHERE id = NEW.seri_no_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ları yeniden oluştur
DROP TRIGGER IF EXISTS equipment_delete_trigger ON ekipman_envanteri;
CREATE TRIGGER equipment_delete_trigger
    AFTER DELETE ON ekipman_envanteri
    FOR EACH ROW
    EXECUTE FUNCTION update_mac_serial_on_equipment_delete();

DROP TRIGGER IF EXISTS equipment_update_trigger ON ekipman_envanteri;
CREATE TRIGGER equipment_update_trigger
    AFTER UPDATE ON ekipman_envanteri
    FOR EACH ROW
    EXECUTE FUNCTION update_mac_serial_on_equipment_update();

DROP TRIGGER IF EXISTS equipment_insert_trigger ON ekipman_envanteri;
CREATE TRIGGER equipment_insert_trigger
    AFTER INSERT ON ekipman_envanteri
    FOR EACH ROW
    EXECUTE FUNCTION update_mac_serial_on_equipment_insert();

-- 11. Mevcut ekipmanların MAC/seri durumlarını güncelle
UPDATE mac_adresleri 
SET kullanim_durumu = 'KULLANIMDA' 
WHERE id IN (SELECT mac_adresi_id FROM ekipman_envanteri WHERE mac_adresi_id IS NOT NULL);

UPDATE seri_numaralari 
SET kullanim_durumu = 'KULLANIMDA' 
WHERE id IN (SELECT seri_no_id FROM ekipman_envanteri WHERE seri_no_id IS NOT NULL);

-- 12. Final kontrol
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '=== DÖNÜŞTÜRME SONRASI KONTROL ===';
    
    -- Foreign key'lerin durumunu kontrol et
    SELECT 
        COUNT(*) as toplam_kayit,
        COUNT(seri_no_id) as seri_no_id_sayisi,
        COUNT(mac_adresi_id) as mac_adresi_id_sayisi
    INTO r
    FROM ekipman_envanteri;
    
    RAISE NOTICE 'ekipman_envanteri - toplam: %, seri_no_id: %, mac_adresi_id: %', 
        r.toplam_kayit, r.seri_no_id_sayisi, r.mac_adresi_id_sayisi;
    
    -- Kullanım durumlarını kontrol et
    SELECT 
        COUNT(*) as kullanimda_mac,
        (SELECT COUNT(*) FROM mac_adresleri WHERE kullanim_durumu = 'MUSAIT') as musait_mac
    INTO r
    FROM mac_adresleri 
    WHERE kullanim_durumu = 'KULLANIMDA';
    
    RAISE NOTICE 'MAC adresleri - kullanımda: %, müsait: %', r.kullanimda_mac, r.musait_mac;
    
    SELECT 
        COUNT(*) as kullanimda_seri,
        (SELECT COUNT(*) FROM seri_numaralari WHERE kullanim_durumu = 'MUSAIT') as musait_seri
    INTO r
    FROM seri_numaralari 
    WHERE kullanim_durumu = 'KULLANIMDA';
    
    RAISE NOTICE 'Seri numaraları - kullanımda: %, müsait: %', r.kullanimda_seri, r.musait_seri;
END $$;

-- 13. Eski sütunları kaldırma (opsiyonel - güvenlik için şimdilik yorum satırı)
-- NOT: Bu adımı sadece her şeyin doğru çalıştığından emin olduktan sonra yapın
/*
DO $$
BEGIN
    -- Eski sütunları kaldır
    ALTER TABLE ekipman_envanteri DROP COLUMN IF EXISTS seri_no;
    ALTER TABLE ekipman_envanteri DROP COLUMN IF EXISTS mac_adresi;
    
    RAISE NOTICE 'Eski sütunlar kaldırıldı';
END $$;
*/

RAISE NOTICE '=== DÖNÜŞTÜRME TAMAMLANDI ===';
RAISE NOTICE 'Artık ekipman_envanteri tablosunda seri_no_id ve mac_adresi_id foreign key''leri kullanılıyor';
RAISE NOTICE 'Eski seri_no ve mac_adresi sütunları hala mevcut (güvenlik için)';
RAISE NOTICE 'Her şeyin doğru çalıştığını kontrol ettikten sonra eski sütunları kaldırabilirsiniz'; 