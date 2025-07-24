-- ==============================================
-- STORED PROCEDURE'LER
-- ==============================================

-- Ekipman atama prosedürü
DELIMITER $$
CREATE PROCEDURE AssignEquipment(
    IN p_ekipman_id BIGINT,
    IN p_personel_id BIGINT,
    IN p_lokasyon_id BIGINT,
    IN p_updated_by BIGINT,
    OUT p_result BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result = FALSE;
        SET p_message = 'Hata oluştu';
    END;
    
    START TRANSACTION;
    
    -- Ekipmanın mevcut olup olmadığını kontrol et
    IF NOT EXISTS (SELECT 1 FROM ekipman_envanteri WHERE id = p_ekipman_id AND is_deleted = FALSE) THEN
        SET p_result = FALSE;
        SET p_message = 'Ekipman bulunamadı';
        ROLLBACK;
    ELSE
        -- Ekipmanı güncelle
        UPDATE ekipman_envanteri 
        SET 
            atanan_personel_id = p_personel_id,
            lokasyon_id = p_lokasyon_id,
            updated_by = p_updated_by,
            updated_at = NOW()
        WHERE id = p_ekipman_id;
        
        SET p_result = TRUE;
        SET p_message = 'Ekipman başarıyla atandı';
        COMMIT;
    END IF;
END$$
DELIMITER ;

-- Ekipman durumu güncelleme prosedürü
DELIMITER $$
CREATE PROCEDURE UpdateEquipmentStatus(
    IN p_ekipman_id BIGINT,
    IN p_fiziksel_durum VARCHAR(50),
    IN p_calismma_durumu VARCHAR(50),
    IN p_updated_by BIGINT,
    OUT p_result BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result = FALSE;
        SET p_message = 'Hata oluştu';
    END;
    
    START TRANSACTION;
    
    -- Ekipmanın mevcut olup olmadığını kontrol et
    IF NOT EXISTS (SELECT 1 FROM ekipman_envanteri WHERE id = p_ekipman_id AND is_deleted = FALSE) THEN
        SET p_result = FALSE;
        SET p_message = 'Ekipman bulunamadı';
        ROLLBACK;
    ELSE
        -- Ekipmanı güncelle
        UPDATE ekipman_envanteri 
        SET 
            fiziksel_durum = p_fiziksel_durum,
            calismma_durumu = p_calismma_durumu,
            updated_by = p_updated_by,
            updated_at = NOW()
        WHERE id = p_ekipman_id;
        
        SET p_result = TRUE;
        SET p_message = 'Ekipman durumu başarıyla güncellendi';
        COMMIT;
    END IF;
END$$
DELIMITER ;

-- Garanti süresi yaklaşan ekipmanları listeleme prosedürü
DELIMITER $$
CREATE PROCEDURE GetWarrantyExpiringEquipment(
    IN p_days_ahead INT DEFAULT 30
)
BEGIN
    SELECT 
        e.id,
        e.barkod,
        m.marka_adi,
        mo.model_adi,
        e.garanti_bitis_tarihi,
        DATEDIFF(e.garanti_bitis_tarihi, CURDATE()) as kalan_gun,
        l.lokasyon_adi,
        CONCAT(p.ad, ' ', p.soyad) as atanan_personel,
        e.fiziksel_durum,
        e.calismma_durumu
    FROM ekipman_envanteri e
    LEFT JOIN markalar m ON e.marka_id = m.id
    LEFT JOIN modeller mo ON e.model_id = mo.id
    LEFT JOIN lokasyonlar l ON e.lokasyon_id = l.id
    LEFT JOIN personel p ON e.atanan_personel_id = p.id
    WHERE e.is_deleted = FALSE
    AND e.garanti_bitis_tarihi IS NOT NULL
    AND e.garanti_bitis_tarihi BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL p_days_ahead DAY)
    ORDER BY e.garanti_bitis_tarihi ASC;
END$$
DELIMITER ;

-- Lokasyon bazında ekipman raporu
DELIMITER $$
CREATE PROCEDURE GetEquipmentByLocation(
    IN p_lokasyon_id BIGINT DEFAULT NULL
)
BEGIN
    SELECT 
        l.lokasyon_adi,
        l.lokasyon_tipi,
        COUNT(e.id) as toplam_ekipman,
        SUM(CASE WHEN e.calismma_durumu = 'Çalışıyor' THEN 1 ELSE 0 END) as calisan_ekipman,
        SUM(CASE WHEN e.calismma_durumu = 'Arızalı' THEN 1 ELSE 0 END) as arizali_ekipman,
        SUM(CASE WHEN e.calismma_durumu = 'Bakımda' THEN 1 ELSE 0 END) as bakimda_ekipman,
        SUM(CASE WHEN e.fiziksel_durum = 'Çok İyi' THEN 1 ELSE 0 END) as cok_iyi_durum,
        SUM(CASE WHEN e.fiziksel_durum = 'İyi' THEN 1 ELSE 0 END) as iyi_durum,
        SUM(CASE WHEN e.fiziksel_durum = 'Orta' THEN 1 ELSE 0 END) as orta_durum,
        SUM(CASE WHEN e.fiziksel_durum = 'Kötü' THEN 1 ELSE 0 END) as kotu_durum,
        SUM(CASE WHEN e.fiziksel_durum = 'Arızalı' THEN 1 ELSE 0 END) as arizali_durum
    FROM lokasyonlar l
    LEFT JOIN ekipman_envanteri e ON l.id = e.lokasyon_id AND e.is_deleted = FALSE
    WHERE (p_lokasyon_id IS NULL OR l.id = p_lokasyon_id)
    AND l.is_active = TRUE
    GROUP BY l.id, l.lokasyon_adi, l.lokasyon_tipi
    ORDER BY l.lokasyon_adi;
END$$
DELIMITER ;

-- Personel bazında ekipman raporu
DELIMITER $$
CREATE PROCEDURE GetEquipmentByPersonnel(
    IN p_personel_id BIGINT DEFAULT NULL
)
BEGIN
    SELECT 
        CONCAT(p.ad, ' ', p.soyad) as personel_adi,
        p.email,
        d.departman_adi,
        COUNT(e.id) as toplam_ekipman,
        SUM(CASE WHEN e.calismma_durumu = 'Çalışıyor' THEN 1 ELSE 0 END) as calisan_ekipman,
        SUM(CASE WHEN e.calismma_durumu = 'Arızalı' THEN 1 ELSE 0 END) as arizali_ekipman,
        SUM(CASE WHEN e.calismma_durumu = 'Bakımda' THEN 1 ELSE 0 END) as bakimda_ekipman,
        SUM(e.satin_alma_fiyati) as toplam_deger
    FROM personel p
    LEFT JOIN departmanlar d ON p.departman_id = d.id
    LEFT JOIN ekipman_envanteri e ON p.id = e.atanan_personel_id AND e.is_deleted = FALSE
    WHERE (p_personel_id IS NULL OR p.id = p_personel_id)
    AND p.is_active = TRUE
    GROUP BY p.id, p.ad, p.soyad, p.email, d.departman_adi
    ORDER BY p.ad, p.soyad;
END$$
DELIMITER ;

-- Müsait MAC adresi ve seri numarası bulma prosedürü
DELIMITER $$
CREATE PROCEDURE GetAvailableMacSerial(
    IN p_model_id BIGINT,
    IN p_type ENUM('MAC', 'SERIAL', 'BOTH') DEFAULT 'BOTH'
)
BEGIN
    IF p_type IN ('MAC', 'BOTH') THEN
        SELECT 
            'MAC' as tip,
            ma.id,
            ma.mac_adresi,
            ma.aciklama,
            ma.created_at
        FROM mac_adresleri ma
        WHERE ma.model_id = p_model_id
        AND ma.kullanim_durumu = 'MUSAIT'
        ORDER BY ma.created_at ASC;
    END IF;
    
    IF p_type IN ('SERIAL', 'BOTH') THEN
        SELECT 
            'SERIAL' as tip,
            sn.id,
            sn.seri_no,
            sn.aciklama,
            sn.created_at
        FROM seri_numaralari sn
        WHERE sn.model_id = p_model_id
        AND sn.kullanim_durumu = 'MUSAIT'
        ORDER BY sn.created_at ASC;
    END IF;
END$$
DELIMITER ;

-- Ekipman geçmişi görüntüleme prosedürü
DELIMITER $$
CREATE PROCEDURE GetEquipmentHistory(
    IN p_ekipman_id BIGINT,
    IN p_limit INT DEFAULT 50
)
BEGIN
    SELECT 
        'HAREKET' as kayit_tipi,
        eh.hareket_tarihi as tarih,
        eh.hareket_tipi as islem,
        eh.aciklama,
        CONCAT(p.ad, ' ', p.soyad) as yapan_kisi,
        eh.degisiklik_detaylari
    FROM envanter_hareketleri eh
    LEFT JOIN personel p ON eh.yapan_personel_id = p.id
    WHERE eh.ekipman_id = p_ekipman_id
    
    UNION ALL
    
    SELECT 
        'BAKIM' as kayit_tipi,
        bk.bakim_tarihi as tarih,
        bk.bakim_tipi as islem,
        bk.aciklama,
        bk.yapan_kisi,
        JSON_OBJECT('durum', bk.durum, 'maliyet', bk.maliyet) as detaylar
    FROM bakim_kayitlari bk
    WHERE bk.ekipman_id = p_ekipman_id
    
    ORDER BY tarih DESC
    LIMIT p_limit;
END$$
DELIMITER ;

-- Sistem istatistikleri prosedürü
DELIMITER $$
CREATE PROCEDURE GetSystemStatistics()
BEGIN
    -- Genel istatistikler
    SELECT 
        'GENEL' as kategori,
        COUNT(*) as toplam_ekipman,
        SUM(CASE WHEN calismma_durumu = 'Çalışıyor' THEN 1 ELSE 0 END) as calisan_ekipman,
        SUM(CASE WHEN calismma_durumu = 'Arızalı' THEN 1 ELSE 0 END) as arizali_ekipman,
        SUM(CASE WHEN calismma_durumu = 'Bakımda' THEN 1 ELSE 0 END) as bakimda_ekipman,
        SUM(satin_alma_fiyati) as toplam_deger
    FROM ekipman_envanteri 
    WHERE is_deleted = FALSE;
    
    -- Lokasyon istatistikleri
    SELECT 
        'LOKASYON' as kategori,
        l.lokasyon_adi,
        COUNT(e.id) as ekipman_sayisi
    FROM lokasyonlar l
    LEFT JOIN ekipman_envanteri e ON l.id = e.lokasyon_id AND e.is_deleted = FALSE
    WHERE l.is_active = TRUE
    GROUP BY l.id, l.lokasyon_adi
    ORDER BY ekipman_sayisi DESC;
    
    -- Marka istatistikleri
    SELECT 
        'MARKA' as kategori,
        m.marka_adi,
        COUNT(e.id) as ekipman_sayisi
    FROM markalar m
    LEFT JOIN ekipman_envanteri e ON m.id = e.marka_id AND e.is_deleted = FALSE
    WHERE m.is_active = TRUE
    GROUP BY m.id, m.marka_adi
    ORDER BY ekipman_sayisi DESC;
END$$
DELIMITER ; 