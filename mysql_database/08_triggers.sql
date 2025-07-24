-- ==============================================
-- TRIGGER'LAR VE FONKSİYONLAR
-- ==============================================

-- MAC ve Seri Numarası Durumu Yönetimi için Trigger'lar

-- Ekipman silindiğinde MAC ve seri numarasını müsait yap
DELIMITER $$
CREATE TRIGGER equipment_delete_trigger
AFTER DELETE ON ekipman_envanteri
FOR EACH ROW
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
END$$
DELIMITER ;

-- Ekipman güncellendiğinde MAC/seri durumlarını yönet
DELIMITER $$
CREATE TRIGGER equipment_update_trigger
AFTER UPDATE ON ekipman_envanteri
FOR EACH ROW
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
END$$
DELIMITER ;

-- Ekipman eklendiğinde MAC/seri durumlarını yönet
DELIMITER $$
CREATE TRIGGER equipment_insert_trigger
AFTER INSERT ON ekipman_envanteri
FOR EACH ROW
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
END$$
DELIMITER ;

-- Envanter değişikliklerini takip etme
DELIMITER $$
CREATE TRIGGER inventory_change_tracker
AFTER INSERT ON ekipman_envanteri
FOR EACH ROW
BEGIN
    INSERT INTO envanter_hareketleri (
        ekipman_id, 
        hareket_tipi, 
        yeni_degerler, 
        yapan_personel_id,
        aciklama
    ) VALUES (
        NEW.id, 
        'EKLEME', 
        JSON_OBJECT(
            'id', NEW.id,
            'barkod', NEW.barkod,
            'lokasyon_id', NEW.lokasyon_id,
            'atanan_personel_id', NEW.atanan_personel_id,
            'fiziksel_durum', NEW.fiziksel_durum,
            'calismma_durumu', NEW.calismma_durumu
        ),
        NEW.created_by,
        'Yeni ekipman eklendi'
    );
END$$
DELIMITER ;

-- Envanter güncellemelerini takip etme
DELIMITER $$
CREATE TRIGGER inventory_update_tracker
AFTER UPDATE ON ekipman_envanteri
FOR EACH ROW
BEGIN
    DECLARE degisiklik_sayisi INT DEFAULT 0;
    DECLARE degisiklik_detaylari JSON DEFAULT JSON_ARRAY();
    
    -- Değişiklikleri kontrol et
    IF OLD.lokasyon_id != NEW.lokasyon_id THEN
        SET degisiklik_sayisi = degisiklik_sayisi + 1;
        SET degisiklik_detaylari = JSON_ARRAY_APPEND(degisiklik_detaylari, '$', 
            JSON_OBJECT('alan', 'lokasyon_id', 'eski', OLD.lokasyon_id, 'yeni', NEW.lokasyon_id));
    END IF;
    
    IF OLD.atanan_personel_id != NEW.atanan_personel_id THEN
        SET degisiklik_sayisi = degisiklik_sayisi + 1;
        SET degisiklik_detaylari = JSON_ARRAY_APPEND(degisiklik_detaylari, '$', 
            JSON_OBJECT('alan', 'atanan_personel_id', 'eski', OLD.atanan_personel_id, 'yeni', NEW.atanan_personel_id));
    END IF;
    
    IF OLD.fiziksel_durum != NEW.fiziksel_durum THEN
        SET degisiklik_sayisi = degisiklik_sayisi + 1;
        SET degisiklik_detaylari = JSON_ARRAY_APPEND(degisiklik_detaylari, '$', 
            JSON_OBJECT('alan', 'fiziksel_durum', 'eski', OLD.fiziksel_durum, 'yeni', NEW.fiziksel_durum));
    END IF;
    
    IF OLD.calismma_durumu != NEW.calismma_durumu THEN
        SET degisiklik_sayisi = degisiklik_sayisi + 1;
        SET degisiklik_detaylari = JSON_ARRAY_APPEND(degisiklik_detaylari, '$', 
            JSON_OBJECT('alan', 'calismma_durumu', 'eski', OLD.calismma_durumu, 'yeni', NEW.calismma_durumu));
    END IF;
    
    -- Eğer değişiklik varsa kaydet
    IF degisiklik_sayisi > 0 THEN
        INSERT INTO envanter_hareketleri (
            ekipman_id, 
            hareket_tipi, 
            eski_degerler,
            yeni_degerler, 
            degisiklik_detaylari,
            degisiklik_sayisi,
            yapan_personel_id,
            aciklama
        ) VALUES (
            NEW.id, 
            'GUNCELLEME', 
            JSON_OBJECT(
                'lokasyon_id', OLD.lokasyon_id,
                'atanan_personel_id', OLD.atanan_personel_id,
                'fiziksel_durum', OLD.fiziksel_durum,
                'calismma_durumu', OLD.calismma_durumu
            ),
            JSON_OBJECT(
                'lokasyon_id', NEW.lokasyon_id,
                'atanan_personel_id', NEW.atanan_personel_id,
                'fiziksel_durum', NEW.fiziksel_durum,
                'calismma_durumu', NEW.calismma_durumu
            ),
            degisiklik_detaylari,
            degisiklik_sayisi,
            NEW.updated_by,
            CONCAT(degisiklik_sayisi, ' alan güncellendi')
        );
    END IF;
END$$
DELIMITER ;

-- Soft delete işlemi için trigger
DELIMITER $$
CREATE TRIGGER soft_delete_trigger
BEFORE UPDATE ON ekipman_envanteri
FOR EACH ROW
BEGIN
    IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
        SET NEW.deleted_at = NOW();
        
        -- Geçmiş tablosuna kaydet
        INSERT INTO ekipman_gecmisi (
            orijinal_id,
            seri_no,
            mac_adresi,
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
            created_by,
            updated_by
        ) VALUES (
            OLD.id,
            (SELECT seri_no FROM seri_numaralari WHERE id = OLD.seri_no_id),
            (SELECT mac_adresi FROM mac_adresleri WHERE id = OLD.mac_adresi_id),
            OLD.barkod,
            OLD.marka_id,
            OLD.model_id,
            OLD.lokasyon_id,
            OLD.atanan_personel_id,
            OLD.satin_alma_tarihi,
            OLD.garanti_bitis_tarihi,
            OLD.ofise_giris_tarihi,
            OLD.ofisten_cikis_tarihi,
            OLD.geri_donus_tarihi,
            OLD.satin_alma_fiyati,
            OLD.amortisman_suresi,
            OLD.defter_degeri,
            OLD.fiziksel_durum,
            OLD.calismma_durumu,
            OLD.aciklama,
            OLD.ozel_notlar,
            'SILINDI',
            NEW.deleted_by,
            OLD.created_by,
            OLD.updated_by
        );
        
        -- Hareket kaydı ekle
        INSERT INTO envanter_hareketleri (
            ekipman_id,
            hareket_tipi,
            eski_degerler,
            yapan_personel_id,
            aciklama
        ) VALUES (
            OLD.id,
            'SILME',
            JSON_OBJECT(
                'id', OLD.id,
                'barkod', OLD.barkod,
                'lokasyon_id', OLD.lokasyon_id,
                'atanan_personel_id', OLD.atanan_personel_id
            ),
            NEW.deleted_by,
            'Ekipman soft delete edildi'
        );
    END IF;
END$$
DELIMITER ;

-- QR kod okuma sayısını güncelleme trigger'ı
DELIMITER $$
CREATE TRIGGER qr_code_read_trigger
BEFORE UPDATE ON qr_kodlari
FOR EACH ROW
BEGIN
    IF NEW.son_okuma_tarihi != OLD.son_okuma_tarihi THEN
        SET NEW.okuma_sayisi = OLD.okuma_sayisi + 1;
    END IF;
END$$
DELIMITER ;

-- Bakım tamamlandığında bildirim oluşturma
DELIMITER $$
CREATE TRIGGER maintenance_completion_trigger
AFTER UPDATE ON bakim_kayitlari
FOR EACH ROW
BEGIN
    IF OLD.durum != 'TAMAMLANDI' AND NEW.durum = 'TAMAMLANDI' THEN
        INSERT INTO bildirimler (
            bildirim_tipi,
            bildirim_kategori,
            alici_personel_id,
            baslik,
            mesaj,
            ekipman_id,
            created_by
        ) VALUES (
            'system',
            'success',
            NEW.created_by,
            'Bakım Tamamlandı',
            CONCAT('Ekipman bakımı tamamlandı: ', NEW.aciklama),
            NEW.ekipman_id,
            NEW.created_by
        );
    END IF;
END$$
DELIMITER ; 