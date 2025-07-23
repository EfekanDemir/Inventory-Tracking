-- MAC ve Seri Numarası Durumu Yönetimi için Trigger'lar
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Ekipman silindiğinde MAC ve seri numarasını müsait yap
CREATE OR REPLACE FUNCTION update_mac_serial_on_equipment_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- MAC adresini müsait yap
    IF OLD.mac_adresi IS NOT NULL THEN
        UPDATE mac_adresleri 
        SET kullanim_durumu = 'MUSAIT' 
        WHERE mac_adresi = OLD.mac_adresi;
    END IF;
    
    -- Seri numarasını müsait yap
    IF OLD.seri_no IS NOT NULL THEN
        UPDATE seri_numaralari 
        SET kullanim_durumu = 'MUSAIT' 
        WHERE seri_no = OLD.seri_no;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Silme trigger'ı
DROP TRIGGER IF EXISTS equipment_delete_trigger ON ekipman_envanteri;
CREATE TRIGGER equipment_delete_trigger
    AFTER DELETE ON ekipman_envanteri
    FOR EACH ROW
    EXECUTE FUNCTION update_mac_serial_on_equipment_delete();

-- Ekipman güncellendiğinde MAC/seri durumlarını yönet
CREATE OR REPLACE FUNCTION update_mac_serial_on_equipment_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer MAC adresi değiştiyse
    IF OLD.mac_adresi IS DISTINCT FROM NEW.mac_adresi THEN
        -- Eski MAC'i müsait yap
        IF OLD.mac_adresi IS NOT NULL THEN
            UPDATE mac_adresleri 
            SET kullanim_durumu = 'MUSAIT' 
            WHERE mac_adresi = OLD.mac_adresi;
        END IF;
        
        -- Yeni MAC'i kullanılıyor yap
        IF NEW.mac_adresi IS NOT NULL THEN
            UPDATE mac_adresleri 
            SET kullanim_durumu = 'KULLANILIYOR' 
            WHERE mac_adresi = NEW.mac_adresi;
        END IF;
    END IF;
    
    -- Eğer seri numarası değiştiyse
    IF OLD.seri_no IS DISTINCT FROM NEW.seri_no THEN
        -- Eski seri numarasını müsait yap
        IF OLD.seri_no IS NOT NULL THEN
            UPDATE seri_numaralari 
            SET kullanim_durumu = 'MUSAIT' 
            WHERE seri_no = OLD.seri_no;
        END IF;
        
        -- Yeni seri numarasını kullanılıyor yap
        IF NEW.seri_no IS NOT NULL THEN
            UPDATE seri_numaralari 
            SET kullanim_durumu = 'KULLANILIYOR' 
            WHERE seri_no = NEW.seri_no;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Güncelleme trigger'ı
DROP TRIGGER IF EXISTS equipment_update_trigger ON ekipman_envanteri;
CREATE TRIGGER equipment_update_trigger
    AFTER UPDATE ON ekipman_envanteri
    FOR EACH ROW
    EXECUTE FUNCTION update_mac_serial_on_equipment_update();

-- Ekipman eklendiğinde MAC/seri durumlarını kullanılıyor yap
CREATE OR REPLACE FUNCTION update_mac_serial_on_equipment_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- MAC adresini kullanılıyor yap
    IF NEW.mac_adresi IS NOT NULL THEN
        UPDATE mac_adresleri 
        SET kullanim_durumu = 'KULLANILIYOR' 
        WHERE mac_adresi = NEW.mac_adresi;
    END IF;
    
    -- Seri numarasını kullanılıyor yap
    IF NEW.seri_no IS NOT NULL THEN
        UPDATE seri_numaralari 
        SET kullanim_durumu = 'KULLANILIYOR' 
        WHERE seri_no = NEW.seri_no;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ekleme trigger'ı
DROP TRIGGER IF EXISTS equipment_insert_trigger ON ekipman_envanteri;
CREATE TRIGGER equipment_insert_trigger
    AFTER INSERT ON ekipman_envanteri
    FOR EACH ROW
    EXECUTE FUNCTION update_mac_serial_on_equipment_insert();

-- Test: Mevcut ekipmanların MAC/seri durumlarını güncelle
UPDATE mac_adresleri 
SET kullanim_durumu = CASE 
    WHEN mac_adresi IN (SELECT mac_adresi FROM ekipman_envanteri WHERE mac_adresi IS NOT NULL) 
    THEN 'KULLANILIYOR' 
    ELSE 'MUSAIT' 
END;

UPDATE seri_numaralari 
SET kullanim_durumu = CASE 
    WHEN seri_no IN (SELECT seri_no FROM ekipman_envanteri WHERE seri_no IS NOT NULL) 
    THEN 'KULLANILIYOR' 
    ELSE 'MUSAIT' 
END;

-- Kontrol sorguları
SELECT 'Kullanılıyor MAC adresleri' as tablo, count(*) as adet FROM mac_adresleri WHERE kullanim_durumu = 'KULLANILIYOR'
UNION ALL
SELECT 'Müsait MAC adresleri' as tablo, count(*) as adet FROM mac_adresleri WHERE kullanim_durumu = 'MUSAIT'
UNION ALL
SELECT 'Kullanılıyor Seri No' as tablo, count(*) as adet FROM seri_numaralari WHERE kullanim_durumu = 'KULLANILIYOR'
UNION ALL
SELECT 'Müsait Seri No' as tablo, count(*) as adet FROM seri_numaralari WHERE kullanim_durumu = 'MUSAIT'; 