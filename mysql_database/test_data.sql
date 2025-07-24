-- ==============================================
-- TEST VERİLERİ - YENİ EKİPMAN ENVANTERİ İÇİN
-- ==============================================

-- Test için örnek ekipman ekleme
INSERT INTO ekipman_envanteri (
    seri_no_id, 
    mac_adresi_id, 
    barkod, 
    marka_id, 
    model_id, 
    lokasyon_id, 
    atanan_personel_id,
    satin_alma_tarihi, 
    garanti_bitis_tarihi, 
    ofise_giris_tarihi, 
    satin_alma_fiyati,
    amortisman_suresi, 
    fiziksel_durum, 
    calismma_durumu, 
    aciklama, 
    created_by
) VALUES 
-- Test Ekipman 1
(1, 1, 'TEST001', 1, 1, 2, 1, '2024-01-15', '2027-01-15', '2024-01-20', 25000.00, 36, 'İyi', 'Çalışıyor', 'Test ekipmanı 1', 1),

-- Test Ekipman 2
(2, 2, 'TEST002', 1, 1, 2, 5, '2024-02-10', '2027-02-10', '2024-02-15', 25000.00, 36, 'Çok İyi', 'Çalışıyor', 'Test ekipmanı 2', 1),

-- Test Ekipman 3
(3, 3, 'TEST003', 2, 3, 3, 4, '2024-03-05', '2027-03-05', '2024-03-10', 30000.00, 36, 'İyi', 'Çalışıyor', 'Test ekipmanı 3', 1),

-- Test Ekipman 4 (Seri no yok, sadece MAC adresi)
(NULL, 4, 'TEST004', 1, 2, 2, 1, '2024-04-01', '2027-04-01', '2024-04-05', 15000.00, 36, 'İyi', 'Çalışıyor', 'Test ekipmanı 4 - Sadece MAC', 1),

-- Test Ekipman 5 (MAC adresi yok, sadece seri no)
(5, NULL, 'TEST005', 2, 4, 2, 3, '2024-05-01', '2027-05-01', '2024-05-05', 20000.00, 36, 'İyi', 'Çalışıyor', 'Test ekipmanı 5 - Sadece Seri No', 1),

-- Test Ekipman 6 (Hiçbiri yok)
(NULL, NULL, 'TEST006', 3, 5, 2, 1, '2024-06-01', '2027-06-01', '2024-06-05', 35000.00, 36, 'İyi', 'Çalışıyor', 'Test ekipmanı 6 - Hiçbiri yok', 1);

-- Test sonuçlarını kontrol et
SELECT '=== TEST SONUÇLARI ===' as test_baslik;

-- Eklenen ekipmanları listele
SELECT 
    'Eklenen Ekipmanlar' as test_tipi,
    COUNT(*) as kayit_sayisi
FROM ekipman_envanteri;

-- MAC adresi durumlarını kontrol et
SELECT 
    'MAC Adresi Durumları' as test_tipi,
    kullanim_durumu,
    COUNT(*) as adet
FROM mac_adresleri 
GROUP BY kullanim_durumu;

-- Seri no durumlarını kontrol et
SELECT 
    'Seri No Durumları' as test_tipi,
    kullanim_durumu,
    COUNT(*) as adet
FROM seri_numaralari 
GROUP BY kullanim_durumu;

-- Ekipman detaylarını göster
SELECT 
    e.id,
    e.barkod,
    sn.seri_no,
    ma.mac_adresi,
    m.marka_adi,
    mo.model_adi,
    l.lokasyon_adi,
    CONCAT(p.ad, ' ', p.soyad) as atanan_personel,
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
ORDER BY e.id;

-- Hareket geçmişini kontrol et
SELECT 
    'Hareket Geçmişi' as test_tipi,
    COUNT(*) as hareket_sayisi
FROM envanter_hareketleri;

-- Test tamamlandı mesajı
SELECT '=== TEST TAMAMLANDI ===' as test_sonuc;
SELECT 'Tüm test verileri başarıyla eklendi!' as mesaj;
SELECT 'Ekipman silme işlemini test etmek için:' as test_oneri;
SELECT 'DELETE FROM ekipman_envanteri WHERE barkod LIKE "TEST%";' as test_komut; 