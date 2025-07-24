-- ==============================================
-- VERİTABANI GÖRÜNÜMLERİ (VIEWS)
-- ==============================================

-- Ekipman detay görünümü
CREATE OR REPLACE VIEW v_ekipman_detay AS
SELECT 
    e.id,
    e.barkod,
    sn.seri_no,
    ma.mac_adresi,
    m.marka_adi,
    mo.model_adi,
    mo.kategori,
    mo.teknik_ozellikler,
    l.lokasyon_kodu,
    l.lokasyon_adi,
    l.lokasyon_tipi,
    CONCAT(p.ad, ' ', p.soyad) as atanan_personel,
    p.email as personel_email,
    d.departman_adi as personel_departman,
    e.satin_alma_tarihi,
    e.garanti_bitis_tarihi,
    e.ofise_giris_tarihi,
    e.ofisten_cikis_tarihi,
    e.geri_donus_tarihi,
    e.satin_alma_fiyati,
    e.amortisman_suresi,
    e.defter_degeri,
    e.fiziksel_durum,
    e.calismma_durumu,
    e.aciklama,
    e.ozel_notlar,
    e.created_at,
    e.updated_at,
    e.is_deleted,
    e.deleted_at,
    CONCAT(created_p.ad, ' ', created_p.soyad) as created_by_name,
    CONCAT(updated_p.ad, ' ', updated_p.soyad) as updated_by_name
FROM ekipman_envanteri e
LEFT JOIN seri_numaralari sn ON e.seri_no_id = sn.id
LEFT JOIN mac_adresleri ma ON e.mac_adresi_id = ma.id
LEFT JOIN markalar m ON e.marka_id = m.id
LEFT JOIN modeller mo ON e.model_id = mo.id
LEFT JOIN lokasyonlar l ON e.lokasyon_id = l.id
LEFT JOIN personel p ON e.atanan_personel_id = p.id
LEFT JOIN departmanlar d ON p.departman_id = d.id
LEFT JOIN personel created_p ON e.created_by = created_p.id
LEFT JOIN personel updated_p ON e.updated_by = updated_p.id
WHERE e.is_deleted = FALSE;

-- Lokasyon bazında ekipman özeti
CREATE OR REPLACE VIEW v_lokasyon_ozet AS
SELECT 
    l.id,
    l.lokasyon_kodu,
    l.lokasyon_adi,
    l.lokasyon_tipi,
    d.departman_adi,
    COUNT(e.id) as toplam_ekipman,
    SUM(CASE WHEN e.calismma_durumu = 'Çalışıyor' THEN 1 ELSE 0 END) as calisan_ekipman,
    SUM(CASE WHEN e.calismma_durumu = 'Arızalı' THEN 1 ELSE 0 END) as arizali_ekipman,
    SUM(CASE WHEN e.calismma_durumu = 'Bakımda' THEN 1 ELSE 0 END) as bakimda_ekipman,
    SUM(CASE WHEN e.calismma_durumu = 'Hurdaya Ayrıldı' THEN 1 ELSE 0 END) as hurda_ekipman,
    SUM(CASE WHEN e.fiziksel_durum = 'Çok İyi' THEN 1 ELSE 0 END) as cok_iyi_durum,
    SUM(CASE WHEN e.fiziksel_durum = 'İyi' THEN 1 ELSE 0 END) as iyi_durum,
    SUM(CASE WHEN e.fiziksel_durum = 'Orta' THEN 1 ELSE 0 END) as orta_durum,
    SUM(CASE WHEN e.fiziksel_durum = 'Kötü' THEN 1 ELSE 0 END) as kotu_durum,
    SUM(CASE WHEN e.fiziksel_durum = 'Arızalı' THEN 1 ELSE 0 END) as arizali_durum,
    SUM(e.satin_alma_fiyati) as toplam_deger,
    AVG(e.satin_alma_fiyati) as ortalama_deger
FROM lokasyonlar l
LEFT JOIN departmanlar d ON l.departman_id = d.id
LEFT JOIN ekipman_envanteri e ON l.id = e.lokasyon_id AND e.is_deleted = FALSE
WHERE l.is_active = TRUE
GROUP BY l.id, l.lokasyon_kodu, l.lokasyon_adi, l.lokasyon_tipi, d.departman_adi;

-- Personel bazında ekipman özeti
CREATE OR REPLACE VIEW v_personel_ozet AS
SELECT 
    p.id,
    p.sicil_no,
    p.ad,
    p.soyad,
    p.email,
    p.telefon,
    d.departman_adi,
    p.unvan,
    p.rol,
    COUNT(e.id) as toplam_ekipman,
    SUM(CASE WHEN e.calismma_durumu = 'Çalışıyor' THEN 1 ELSE 0 END) as calisan_ekipman,
    SUM(CASE WHEN e.calismma_durumu = 'Arızalı' THEN 1 ELSE 0 END) as arizali_ekipman,
    SUM(CASE WHEN e.calismma_durumu = 'Bakımda' THEN 1 ELSE 0 END) as bakimda_ekipman,
    SUM(CASE WHEN e.fiziksel_durum = 'Çok İyi' THEN 1 ELSE 0 END) as cok_iyi_durum,
    SUM(CASE WHEN e.fiziksel_durum = 'İyi' THEN 1 ELSE 0 END) as iyi_durum,
    SUM(CASE WHEN e.fiziksel_durum = 'Orta' THEN 1 ELSE 0 END) as orta_durum,
    SUM(CASE WHEN e.fiziksel_durum = 'Kötü' THEN 1 ELSE 0 END) as kotu_durum,
    SUM(CASE WHEN e.fiziksel_durum = 'Arızalı' THEN 1 ELSE 0 END) as arizali_durum,
    SUM(e.satin_alma_fiyati) as toplam_deger,
    AVG(e.satin_alma_fiyati) as ortalama_deger
FROM personel p
LEFT JOIN departmanlar d ON p.departman_id = d.id
LEFT JOIN ekipman_envanteri e ON p.id = e.atanan_personel_id AND e.is_deleted = FALSE
WHERE p.is_active = TRUE
GROUP BY p.id, p.sicil_no, p.ad, p.soyad, p.email, p.telefon, d.departman_adi, p.unvan, p.rol;

-- Marka bazında ekipman özeti
CREATE OR REPLACE VIEW v_marka_ozet AS
SELECT 
    m.id,
    m.marka_adi,
    m.aciklama,
    COUNT(e.id) as toplam_ekipman,
    SUM(CASE WHEN e.calismma_durumu = 'Çalışıyor' THEN 1 ELSE 0 END) as calisan_ekipman,
    SUM(CASE WHEN e.calismma_durumu = 'Arızalı' THEN 1 ELSE 0 END) as arizali_ekipman,
    SUM(CASE WHEN e.calismma_durumu = 'Bakımda' THEN 1 ELSE 0 END) as bakimda_ekipman,
    SUM(CASE WHEN e.fiziksel_durum = 'Çok İyi' THEN 1 ELSE 0 END) as cok_iyi_durum,
    SUM(CASE WHEN e.fiziksel_durum = 'İyi' THEN 1 ELSE 0 END) as iyi_durum,
    SUM(CASE WHEN e.fiziksel_durum = 'Orta' THEN 1 ELSE 0 END) as orta_durum,
    SUM(CASE WHEN e.fiziksel_durum = 'Kötü' THEN 1 ELSE 0 END) as kotu_durum,
    SUM(CASE WHEN e.fiziksel_durum = 'Arızalı' THEN 1 ELSE 0 END) as arizali_durum,
    SUM(e.satin_alma_fiyati) as toplam_deger,
    AVG(e.satin_alma_fiyati) as ortalama_deger
FROM markalar m
LEFT JOIN ekipman_envanteri e ON m.id = e.marka_id AND e.is_deleted = FALSE
WHERE m.is_active = TRUE
GROUP BY m.id, m.marka_adi, m.aciklama;

-- Garanti süresi yaklaşan ekipmanlar
CREATE OR REPLACE VIEW v_garanti_yaklasan AS
SELECT 
    e.id,
    e.barkod,
    sn.seri_no,
    ma.mac_adresi,
    m.marka_adi,
    mo.model_adi,
    e.garanti_bitis_tarihi,
    DATEDIFF(e.garanti_bitis_tarihi, CURDATE()) as kalan_gun,
    l.lokasyon_adi,
    CONCAT(p.ad, ' ', p.soyad) as atanan_personel,
    p.email as personel_email,
    e.fiziksel_durum,
    e.calismma_durumu,
    e.satin_alma_fiyati
FROM ekipman_envanteri e
LEFT JOIN seri_numaralari sn ON e.seri_no_id = sn.id
LEFT JOIN mac_adresleri ma ON e.mac_adresi_id = ma.id
LEFT JOIN markalar m ON e.marka_id = m.id
LEFT JOIN modeller mo ON e.model_id = mo.id
LEFT JOIN lokasyonlar l ON e.lokasyon_id = l.id
LEFT JOIN personel p ON e.atanan_personel_id = p.id
WHERE e.is_deleted = FALSE
AND e.garanti_bitis_tarihi IS NOT NULL
AND e.garanti_bitis_tarihi >= CURDATE()
ORDER BY e.garanti_bitis_tarihi ASC;

-- Arızalı ekipmanlar
CREATE OR REPLACE VIEW v_arizali_ekipmanlar AS
SELECT 
    e.id,
    e.barkod,
    sn.seri_no,
    ma.mac_adresi,
    m.marka_adi,
    mo.model_adi,
    l.lokasyon_adi,
    CONCAT(p.ad, ' ', p.soyad) as atanan_personel,
    p.email as personel_email,
    e.fiziksel_durum,
    e.calismma_durumu,
    e.aciklama,
    e.satin_alma_fiyati,
    e.created_at,
    e.updated_at
FROM ekipman_envanteri e
LEFT JOIN seri_numaralari sn ON e.seri_no_id = sn.id
LEFT JOIN mac_adresleri ma ON e.mac_adresi_id = ma.id
LEFT JOIN markalar m ON e.marka_id = m.id
LEFT JOIN modeller mo ON e.model_id = mo.id
LEFT JOIN lokasyonlar l ON e.lokasyon_id = l.id
LEFT JOIN personel p ON e.atanan_personel_id = p.id
WHERE e.is_deleted = FALSE
AND (e.calismma_durumu = 'Arızalı' OR e.fiziksel_durum = 'Arızalı')
ORDER BY e.updated_at DESC;

-- Müsait MAC adresleri ve seri numaraları
CREATE OR REPLACE VIEW v_musait_mac_seri AS
SELECT 
    'MAC' as tip,
    ma.id,
    ma.mac_adresi,
    ma.aciklama,
    m.marka_adi,
    mo.model_adi,
    ma.kullanim_durumu,
    ma.created_at
FROM mac_adresleri ma
LEFT JOIN modeller mo ON ma.model_id = mo.id
LEFT JOIN markalar m ON mo.marka_id = m.id
WHERE ma.kullanim_durumu = 'MUSAIT'

UNION ALL

SELECT 
    'SERIAL' as tip,
    sn.id,
    sn.seri_no as mac_adresi,
    sn.aciklama,
    m.marka_adi,
    mo.model_adi,
    sn.kullanim_durumu,
    sn.created_at
FROM seri_numaralari sn
LEFT JOIN modeller mo ON sn.model_id = mo.id
LEFT JOIN markalar m ON mo.marka_id = m.id
WHERE sn.kullanim_durumu = 'MUSAIT'
ORDER BY created_at ASC;

-- Ekipman hareket geçmişi
CREATE OR REPLACE VIEW v_ekipman_hareket_gecmisi AS
SELECT 
    eh.id,
    eh.ekipman_id,
    e.barkod,
    eh.hareket_tipi,
    eh.hareket_tarihi,
    eh.aciklama,
    CONCAT(p.ad, ' ', p.soyad) as yapan_kisi,
    p.email as yapan_email,
    eh.degisiklik_detaylari,
    eh.degisiklik_sayisi,
    eh.ip_adresi,
    eh.user_agent
FROM envanter_hareketleri eh
LEFT JOIN ekipman_envanteri e ON eh.ekipman_id = e.id
LEFT JOIN personel p ON eh.yapan_personel_id = p.id
ORDER BY eh.hareket_tarihi DESC;

-- Bakım geçmişi
CREATE OR REPLACE VIEW v_bakim_gecmisi AS
SELECT 
    bk.id,
    bk.ekipman_id,
    e.barkod,
    sn.seri_no,
    ma.mac_adresi,
    m.marka_adi,
    mo.model_adi,
    bk.bakim_tipi,
    bk.bakim_tarihi,
    bk.planlanan_tarih,
    bk.tamamlanma_tarihi,
    bk.aciklama,
    bk.yapilan_isler,
    bk.kullanilan_parcalar,
    bk.maliyet,
    bk.durum,
    bk.yapan_kisi,
    bk.yapan_firma,
    CONCAT(p.ad, ' ', p.soyad) as created_by_name,
    bk.created_at
FROM bakim_kayitlari bk
LEFT JOIN ekipman_envanteri e ON bk.ekipman_id = e.id
LEFT JOIN seri_numaralari sn ON e.seri_no_id = sn.id
LEFT JOIN mac_adresleri ma ON e.mac_adresi_id = ma.id
LEFT JOIN markalar m ON e.marka_id = m.id
LEFT JOIN modeller mo ON e.model_id = mo.id
LEFT JOIN personel p ON bk.created_by = p.id
ORDER BY bk.bakim_tarihi DESC; 