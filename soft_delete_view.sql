-- ==============================================
-- SOFT DELETE SİSTEMİ - VIEW TABLOSU YAKLAŞIMI
-- ==============================================

-- 1. Ekipman tablosuna soft delete alanı ekle
ALTER TABLE ekipman_envanteri 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by BIGINT REFERENCES personel(id);

-- 2. Aktif ekipmanları gösteren view oluştur
CREATE OR REPLACE VIEW v_aktif_ekipman AS
SELECT 
    e.*,
    m.marka_adi,
    mo.model_adi,
    mo.kategori,
    l.lokasyon_adi,
    l.lokasyon_kodu,
    l.lokasyon_tipi,
    p.ad as personel_ad,
    p.soyad as personel_soyad,
    p.email as personel_email,
    d.departman_adi
FROM ekipman_envanteri e
LEFT JOIN markalar m ON e.marka_id = m.id
LEFT JOIN modeller mo ON e.model_id = mo.id
LEFT JOIN lokasyonlar l ON e.lokasyon_id = l.id
LEFT JOIN personel p ON e.atanan_personel_id = p.id
LEFT JOIN departmanlar d ON l.departman_id = d.id
WHERE e.is_deleted = false OR e.is_deleted IS NULL;

-- 3. Silinmiş ekipmanları gösteren view oluştur
CREATE OR REPLACE VIEW v_silinmis_ekipman AS
SELECT 
    e.*,
    m.marka_adi,
    mo.model_adi,
    mo.kategori,
    l.lokasyon_adi,
    l.lokasyon_kodu,
    l.lokasyon_tipi,
    p.ad as personel_ad,
    p.soyad as personel_soyad,
    p.email as personel_email,
    d.departman_adi,
    dp.ad as silen_personel_ad,
    dp.soyad as silen_personel_soyad
FROM ekipman_envanteri e
LEFT JOIN markalar m ON e.marka_id = m.id
LEFT JOIN modeller mo ON e.model_id = mo.id
LEFT JOIN lokasyonlar l ON e.lokasyon_id = l.id
LEFT JOIN personel p ON e.atanan_personel_id = p.id
LEFT JOIN departmanlar d ON l.departman_id = d.id
LEFT JOIN personel dp ON e.deleted_by = dp.id
WHERE e.is_deleted = true;

-- 4. Soft delete fonksiyonu
CREATE OR REPLACE FUNCTION soft_delete_ekipman(
    p_ekipman_id BIGINT,
    p_silen_personel_id BIGINT,
    p_silme_nedeni TEXT DEFAULT 'MANUEL_SILME'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ekipman_record RECORD;
BEGIN
    -- Ekipmanı kontrol et
    SELECT * INTO v_ekipman_record 
    FROM ekipman_envanteri 
    WHERE id = p_ekipman_id AND (is_deleted = false OR is_deleted IS NULL);
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ekipman bulunamadı veya zaten silinmiş';
    END IF;
    
    -- Soft delete işlemi
    UPDATE ekipman_envanteri 
    SET 
        is_deleted = true,
        deleted_at = now(),
        deleted_by = p_silen_personel_id,
        updated_at = now()
    WHERE id = p_ekipman_id;
    
    -- Geçmişe aktar
    INSERT INTO ekipman_gecmisi (
        orijinal_id,
        mac_adresi,
        seri_no,
        barkod,
        marka_id,
        model_id,
        lokasyon_id,
        atanan_personel_id,
        satin_alma_tarihi,
        garanti_bitis_tarihi,
        ofise_giris_tarihi,
        ofisten_cikis_tarihi,
        geri_donus_tarihi,
        satin_alma_fiyati,
        amortisman_suresi,
        defter_degeri,
        fiziksel_durum,
        calismma_durumu,
        aciklama,
        ozel_notlar,
        arsiv_nedeni,
        arsiv_yapan_id,
        arsiv_notu,
        created_by,
        updated_by
    ) VALUES (
        v_ekipman_record.id,
        v_ekipman_record.mac_adresi,
        v_ekipman_record.seri_no,
        v_ekipman_record.barkod,
        v_ekipman_record.marka_id,
        v_ekipman_record.model_id,
        v_ekipman_record.lokasyon_id,
        v_ekipman_record.atanan_personel_id,
        v_ekipman_record.satin_alma_tarihi,
        v_ekipman_record.garanti_bitis_tarihi,
        v_ekipman_record.ofise_giris_tarihi,
        v_ekipman_record.ofisten_cikis_tarihi,
        v_ekipman_record.geri_donus_tarihi,
        v_ekipman_record.satin_alma_fiyati,
        v_ekipman_record.amortisman_suresi,
        v_ekipman_record.defter_degeri,
        v_ekipman_record.fiziksel_durum,
        v_ekipman_record.calismma_durumu,
        v_ekipman_record.aciklama,
        v_ekipman_record.ozel_notlar,
        p_silme_nedeni,
        p_silen_personel_id,
        'Soft delete ile silindi',
        v_ekipman_record.created_by,
        v_ekipman_record.updated_by
    );
    
    -- Hareket kaydı ekle
    INSERT INTO envanter_hareketleri (
        ekipman_id,
        hareket_tipi,
        hareket_tarihi,
        yapan_personel_id,
        aciklama,
        onceki_durum,
        yeni_durum
    ) VALUES (
        v_ekipman_record.id,
        'SILINDI',
        now(),
        p_silen_personel_id,
        'Ekipman soft delete ile silindi',
        'AKTIF',
        'SILINDI'
    );
    
    RETURN true;
END;
$$;

-- 5. Soft restore fonksiyonu
CREATE OR REPLACE FUNCTION soft_restore_ekipman(
    p_ekipman_id BIGINT,
    p_restore_personel_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ekipmanı kontrol et
    IF NOT EXISTS (
        SELECT 1 FROM ekipman_envanteri 
        WHERE id = p_ekipman_id AND is_deleted = true
    ) THEN
        RAISE EXCEPTION 'Ekipman bulunamadı veya zaten aktif';
    END IF;
    
    -- Soft restore işlemi
    UPDATE ekipman_envanteri 
    SET 
        is_deleted = false,
        deleted_at = NULL,
        deleted_by = NULL,
        updated_at = now()
    WHERE id = p_ekipman_id;
    
    -- Hareket kaydı ekle
    INSERT INTO envanter_hareketleri (
        ekipman_id,
        hareket_tipi,
        hareket_tarihi,
        yapan_personel_id,
        aciklama,
        onceki_durum,
        yeni_durum
    ) VALUES (
        p_ekipman_id,
        'GERI_YUKLENDI',
        now(),
        p_restore_personel_id,
        'Ekipman geri yüklendi',
        'SILINDI',
        'AKTIF'
    );
    
    RETURN true;
END;
$$;

-- 6. Toplu soft delete fonksiyonu
CREATE OR REPLACE FUNCTION soft_delete_multiple_ekipman(
    p_ekipman_ids BIGINT[],
    p_silen_personel_id BIGINT,
    p_silme_nedeni TEXT DEFAULT 'TOPLU_SILME'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ekipman_id BIGINT;
    v_silinen_sayisi INTEGER := 0;
BEGIN
    FOREACH v_ekipman_id IN ARRAY p_ekipman_ids
    LOOP
        BEGIN
            PERFORM soft_delete_ekipman(v_ekipman_id, p_silen_personel_id, p_silme_nedeni);
            v_silinen_sayisi := v_silinen_sayisi + 1;
        EXCEPTION
            WHEN OTHERS THEN
                -- Hata durumunda log tut ama devam et
                RAISE NOTICE 'Ekipman % silinirken hata: %', v_ekipman_id, SQLERRM;
        END;
    END LOOP;
    
    RETURN v_silinen_sayisi;
END;
$$;

-- 7. RLS Policies için view'ları güvenli hale getir
ALTER VIEW v_aktif_ekipman SET (security_barrier = true);
ALTER VIEW v_silinmis_ekipman SET (security_barrier = true);

-- 8. Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_ekipman_is_deleted ON ekipman_envanteri(is_deleted);
CREATE INDEX IF NOT EXISTS idx_ekipman_deleted_at ON ekipman_envanteri(deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_ekipman_deleted_by ON ekipman_envanteri(deleted_by);

-- 9. Trigger fonksiyonu - soft delete sonrası MAC/Seri no serbest bırakma
CREATE OR REPLACE FUNCTION handle_soft_delete_mac_seri()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Ekipman soft delete edildiğinde MAC ve Seri no'yu serbest bırak
    IF NEW.is_deleted = true AND (OLD.is_deleted = false OR OLD.is_deleted IS NULL) THEN
        -- MAC adresini serbest bırak
        IF NEW.mac_adresi IS NOT NULL THEN
            UPDATE mac_adresleri 
            SET 
                kullanim_durumu = 'MUSAIT',
                atanan_ekipman_id = NULL,
                updated_at = now()
            WHERE mac_adresi = NEW.mac_adresi;
        END IF;
        
        -- Seri numarasını serbest bırak
        IF NEW.seri_no IS NOT NULL THEN
            UPDATE seri_numaralari 
            SET 
                kullanim_durumu = 'MUSAIT',
                atanan_ekipman_id = NULL,
                updated_at = now()
            WHERE seri_no = NEW.seri_no;
        END IF;
    END IF;
    
    -- Ekipman geri yüklendiğinde MAC ve Seri no'yu tekrar ata
    IF NEW.is_deleted = false AND OLD.is_deleted = true THEN
        -- MAC adresini tekrar ata
        IF NEW.mac_adresi IS NOT NULL THEN
            UPDATE mac_adresleri 
            SET 
                kullanim_durumu = 'KULLANIMDA',
                atanan_ekipman_id = NEW.id,
                updated_at = now()
            WHERE mac_adresi = NEW.mac_adresi;
        END IF;
        
        -- Seri numarasını tekrar ata
        IF NEW.seri_no IS NOT NULL THEN
            UPDATE seri_numaralari 
            SET 
                kullanim_durumu = 'KULLANIMDA',
                atanan_ekipman_id = NEW.id,
                updated_at = now()
            WHERE seri_no = NEW.seri_no;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 10. Trigger'ı ekle
DROP TRIGGER IF EXISTS trigger_soft_delete_mac_seri ON ekipman_envanteri;
CREATE TRIGGER trigger_soft_delete_mac_seri
    AFTER UPDATE ON ekipman_envanteri
    FOR EACH ROW
    EXECUTE FUNCTION handle_soft_delete_mac_seri();

-- 11. Mevcut kayıtları view'a uyumlu hale getir
UPDATE ekipman_envanteri 
SET is_deleted = false 
WHERE is_deleted IS NULL;

-- 12. Test fonksiyonu
CREATE OR REPLACE FUNCTION test_soft_delete_system()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_test_ekipman_id BIGINT;
    v_result TEXT;
BEGIN
    -- Test ekipmanı oluştur
    INSERT INTO ekipman_envanteri (
        mac_adresi, 
        seri_no, 
        lokasyon_id, 
        marka_id, 
        model_id,
        created_by
    ) VALUES (
        'TEST-MAC-001',
        'TEST-SERI-001',
        1, -- varsayılan lokasyon
        1, -- varsayılan marka
        1, -- varsayılan model
        1  -- varsayılan personel
    ) RETURNING id INTO v_test_ekipman_id;
    
    -- Soft delete test et
    PERFORM soft_delete_ekipman(v_test_ekipman_id, 1, 'TEST_SILME');
    
    -- Kontrol et
    IF EXISTS (SELECT 1 FROM v_silinmis_ekipman WHERE id = v_test_ekipman_id) THEN
        v_result := 'Soft delete başarılı';
    ELSE
        v_result := 'Soft delete başarısız';
    END IF;
    
    -- Test ekipmanını temizle
    DELETE FROM ekipman_envanteri WHERE id = v_test_ekipman_id;
    
    RETURN v_result;
END;
$$; 