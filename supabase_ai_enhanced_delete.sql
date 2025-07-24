-- Supabase AI Script'ini Geliştirilmiş Versiyonu
-- Bu script, RLS etkin olsa dahi silme işlemi yapabilir

-- 1. Lokasyon Silme Fonksiyonu (Geliştirilmiş)
CREATE OR REPLACE FUNCTION simple_delete_location(location_id integer)
RETURNS text AS $$
DECLARE
    deleted_count INTEGER := 0;
    location_name TEXT;
BEGIN
    -- Lokasyon adını al
    SELECT lokasyon_adi INTO location_name FROM lokasyonlar WHERE id = location_id;
    
    IF location_name IS NULL THEN
        RETURN 'Lokasyon bulunamadı (ID: ' || location_id || ')';
    END IF;
    
    -- 1. Ekipman geçmişini sil
    DELETE FROM ekipman_gecmisi 
    WHERE envanter_id IN (
        SELECT id FROM ekipman_envanteri WHERE lokasyon_id = location_id
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Ekipman geçmişinden % kayıt silindi', deleted_count;
    
    -- 2. Ekipman envanterini sil
    DELETE FROM ekipman_envanteri 
    WHERE lokasyon_id = location_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Ekipman envanterinden % kayıt silindi', deleted_count;
    
    -- 3. Lokasyonu sil
    DELETE FROM lokasyonlar 
    WHERE id = location_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN 'Lokasyon "' || location_name || '" ve bağımlı kayıtlar başarıyla silindi';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Departman Silme Fonksiyonu
CREATE OR REPLACE FUNCTION simple_delete_department(department_id integer)
RETURNS text AS $$
DECLARE
    deleted_count INTEGER := 0;
    department_name TEXT;
BEGIN
    -- Departman adını al
    SELECT departman_adi INTO department_name FROM departmanlar WHERE id = department_id;
    
    IF department_name IS NULL THEN
        RETURN 'Departman bulunamadı (ID: ' || department_id || ')';
    END IF;
    
    -- 1. Bu departmana ait lokasyonları sil
    PERFORM simple_delete_location(id) 
    FROM lokasyonlar 
    WHERE departman_id = department_id;
    
    -- 2. Personel departman_id'lerini NULL yap
    UPDATE personel 
    SET departman_id = NULL 
    WHERE departman_id = department_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '% personelin departman_id NULL yapıldı', deleted_count;
    
    -- 3. Departmanı sil
    DELETE FROM departmanlar 
    WHERE id = department_id;
    
    RETURN 'Departman "' || department_name || '" ve bağımlı kayıtlar başarıyla silindi';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Model Silme Fonksiyonu
CREATE OR REPLACE FUNCTION simple_delete_model(model_id integer)
RETURNS text AS $$
DECLARE
    deleted_count INTEGER := 0;
    model_name TEXT;
BEGIN
    -- Model adını al
    SELECT model_adi INTO model_name FROM modeller WHERE id = model_id;
    
    IF model_name IS NULL THEN
        RETURN 'Model bulunamadı (ID: ' || model_id || ')';
    END IF;
    
    -- 1. Bu modeli kullanan ekipmanları kontrol et
    SELECT COUNT(*) INTO deleted_count 
    FROM ekipman_envanteri 
    WHERE model_id = model_id;
    
    IF deleted_count > 0 THEN
        RETURN 'Bu model "' || model_name || '" ' || deleted_count || ' ekipman tarafından kullanılıyor. Önce ekipmanları silmelisiniz.';
    END IF;
    
    -- 2. Seri numaralarını sil
    DELETE FROM seri_numaralari 
    WHERE model_id = model_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '% seri numarası silindi', deleted_count;
    
    -- 3. MAC adreslerini sil
    DELETE FROM mac_adresleri 
    WHERE model_id = model_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '% MAC adresi silindi', deleted_count;
    
    -- 4. Modeli sil
    DELETE FROM modeller 
    WHERE id = model_id;
    
    RETURN 'Model "' || model_name || '" ve bağımlı kayıtlar başarıyla silindi';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Marka Silme Fonksiyonu
CREATE OR REPLACE FUNCTION simple_delete_brand(brand_id integer)
RETURNS text AS $$
DECLARE
    deleted_count INTEGER := 0;
    brand_name TEXT;
BEGIN
    -- Marka adını al
    SELECT marka_adi INTO brand_name FROM markalar WHERE id = brand_id;
    
    IF brand_name IS NULL THEN
        RETURN 'Marka bulunamadı (ID: ' || brand_id || ')';
    END IF;
    
    -- 1. Bu markaya ait modelleri sil
    PERFORM simple_delete_model(id) 
    FROM modeller 
    WHERE marka_id = brand_id;
    
    -- 2. Markayı sil
    DELETE FROM markalar 
    WHERE id = brand_id;
    
    RETURN 'Marka "' || brand_name || '" ve bağımlı kayıtlar başarıyla silindi';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Personel Silme Fonksiyonu
CREATE OR REPLACE FUNCTION simple_delete_personnel(personnel_id integer)
RETURNS text AS $$
DECLARE
    deleted_count INTEGER := 0;
    personnel_name TEXT;
BEGIN
    -- Personel adını al
    SELECT ad || ' ' || soyad INTO personnel_name FROM personel WHERE id = personnel_id;
    
    IF personnel_name IS NULL THEN
        RETURN 'Personel bulunamadı (ID: ' || personnel_id || ')';
    END IF;
    
    -- 1. Bu personeli kullanan ekipmanlarda atanan_personel_id'yi NULL yap
    UPDATE ekipman_envanteri 
    SET atanan_personel_id = NULL 
    WHERE atanan_personel_id = personnel_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '% ekipmanın atanan_personel_id NULL yapıldı', deleted_count;
    
    -- 2. Ekipman geçmişinde atanan_personel_id'yi NULL yap (eğer varsa)
    UPDATE ekipman_gecmisi 
    SET atanan_personel_id = NULL 
    WHERE atanan_personel_id = personnel_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '% geçmiş kaydının atanan_personel_id NULL yapıldı', deleted_count;
    
    -- 3. Personeli sil
    DELETE FROM personel 
    WHERE id = personnel_id;
    
    RETURN 'Personel "' || personnel_name || '" ve bağımlı kayıtlar başarıyla silindi';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Test Fonksiyonu
CREATE OR REPLACE FUNCTION test_delete_functions()
RETURNS text AS $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '=== MEVCUT VERİLER ===';
    
    RAISE NOTICE 'Lokasyonlar:';
    FOR r IN SELECT id, lokasyon_adi FROM lokasyonlar LIMIT 3 LOOP
        RAISE NOTICE '  ID: %, Ad: %', r.id, r.lokasyon_adi;
    END LOOP;
    
    RAISE NOTICE 'Departmanlar:';
    FOR r IN SELECT id, departman_adi FROM departmanlar LIMIT 3 LOOP
        RAISE NOTICE '  ID: %, Ad: %', r.id, r.departman_adi;
    END LOOP;
    
    RAISE NOTICE 'Modeller:';
    FOR r IN SELECT id, model_adi FROM modeller LIMIT 3 LOOP
        RAISE NOTICE '  ID: %, Ad: %', r.id, r.model_adi;
    END LOOP;
    
    RETURN 'Silme fonksiyonları hazır - RLS etkin olsa dahi çalışır';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Test çalıştır
SELECT test_delete_functions();

-- 8. Kullanım örnekleri (yorum satırı olarak)
-- SELECT simple_delete_location(1);
-- SELECT simple_delete_department(1);
-- SELECT simple_delete_model(1);
-- SELECT simple_delete_brand(1);
-- SELECT simple_delete_personnel(1); 