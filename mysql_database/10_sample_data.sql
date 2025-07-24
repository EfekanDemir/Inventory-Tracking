-- ==============================================
-- ÖRNEK VERİLER
-- ==============================================

-- Markalar
INSERT INTO markalar (marka_adi, aciklama) VALUES
('Dell', 'Dell Technologies'),
('HP', 'Hewlett-Packard'),
('Lenovo', 'Lenovo Group'),
('Apple', 'Apple Inc.'),
('Samsung', 'Samsung Electronics'),
('Asus', 'ASUSTeK Computer'),
('Acer', 'Acer Inc.'),
('MSI', 'Micro-Star International'),
('Cisco', 'Cisco Systems'),
('TP-Link', 'TP-Link Technologies');

-- Departmanlar
INSERT INTO departmanlar (departman_adi, aciklama, manager_email) VALUES
('Bilgi İşlem', 'IT Departmanı', 'it.manager@company.com'),
('İnsan Kaynakları', 'HR Departmanı', 'hr.manager@company.com'),
('Muhasebe', 'Muhasebe Departmanı', 'muhasebe.manager@company.com'),
('Satış', 'Satış Departmanı', 'satis.manager@company.com'),
('Pazarlama', 'Pazarlama Departmanı', 'pazarlama.manager@company.com'),
('Üretim', 'Üretim Departmanı', 'uretim.manager@company.com'),
('Depo', 'Depo Yönetimi', 'depo.manager@company.com');

-- Personel
INSERT INTO personel (sicil_no, ad, soyad, email, telefon, departman_id, unvan, rol) VALUES
('EMP001', 'Ahmet', 'Yılmaz', 'ahmet.yilmaz@company.com', '0532 123 4567', 1, 'IT Uzmanı', 'admin'),
('EMP002', 'Ayşe', 'Demir', 'ayse.demir@company.com', '0533 234 5678', 2, 'HR Uzmanı', 'manager'),
('EMP003', 'Mehmet', 'Kaya', 'mehmet.kaya@company.com', '0534 345 6789', 3, 'Muhasebe Uzmanı', 'user'),
('EMP004', 'Fatma', 'Özkan', 'fatma.ozkan@company.com', '0535 456 7890', 4, 'Satış Temsilcisi', 'user'),
('EMP005', 'Ali', 'Çelik', 'ali.celik@company.com', '0536 567 8901', 1, 'Sistem Yöneticisi', 'admin'),
('EMP006', 'Zeynep', 'Arslan', 'zeynep.arslan@company.com', '0537 678 9012', 5, 'Pazarlama Uzmanı', 'user'),
('EMP007', 'Mustafa', 'Koç', 'mustafa.koc@company.com', '0538 789 0123', 6, 'Üretim Sorumlusu', 'manager'),
('EMP008', 'Elif', 'Şahin', 'elif.sahin@company.com', '0539 890 1234', 7, 'Depo Sorumlusu', 'user');

-- Lokasyonlar
INSERT INTO lokasyonlar (lokasyon_kodu, lokasyon_adi, lokasyon_tipi, departman_id, adres, sorumlu_kisi) VALUES
('DEPO01', 'Ana Depo', 'DEPO', 7, 'Organize Sanayi Bölgesi No:123', 'Elif Şahin'),
('OFIS01', 'Genel Müdürlük', 'KULLANICI', 1, 'Merkez Mahallesi No:456', 'Ahmet Yılmaz'),
('OFIS02', 'Satış Ofisi', 'KULLANICI', 4, 'Ticaret Merkezi No:789', 'Fatma Özkan'),
('EGITIM01', 'Eğitim Salonu', 'EGITIM', 1, 'Eğitim Binası No:101', 'Ali Çelik'),
('BAKIM01', 'Teknik Servis', 'BAKIM', 1, 'Teknik Servis Binası', 'Ahmet Yılmaz'),
('HURDA01', 'Hurda Deposu', 'HURDA', 7, 'Arka Depo Bölümü', 'Elif Şahin');

-- Modeller
INSERT INTO modeller (marka_id, model_adi, kategori, teknik_ozellikler, aciklama) VALUES
(1, 'Latitude 5520', 'Laptop', '{"processor": "Intel i7", "ram": "16GB", "storage": "512GB SSD"}', 'İş Laptopu'),
(1, 'OptiPlex 7090', 'Bilgisayar', '{"processor": "Intel i5", "ram": "8GB", "storage": "256GB SSD"}', 'Masaüstü Bilgisayar'),
(2, 'EliteBook 840', 'Laptop', '{"processor": "Intel i7", "ram": "16GB", "storage": "1TB SSD"}', 'Premium İş Laptopu'),
(2, 'ProBook 450', 'Laptop', '{"processor": "Intel i5", "ram": "8GB", "storage": "512GB SSD"}', 'Standart İş Laptopu'),
(3, 'ThinkPad X1', 'Laptop', '{"processor": "Intel i7", "ram": "16GB", "storage": "1TB SSD"}', 'Ultrabook'),
(3, 'ThinkCentre M90', 'Bilgisayar', '{"processor": "Intel i5", "ram": "8GB", "storage": "256GB SSD"}', 'Masaüstü'),
(4, 'MacBook Pro', 'Laptop', '{"processor": "M1 Pro", "ram": "16GB", "storage": "512GB SSD"}', 'Apple MacBook Pro'),
(4, 'iMac', 'Bilgisayar', '{"processor": "M1", "ram": "8GB", "storage": "256GB SSD"}', 'Apple iMac'),
(5, 'Galaxy Tab S7', 'Tablet', '{"processor": "Snapdragon 865", "ram": "6GB", "storage": "128GB"}', 'Android Tablet'),
(6, 'ZenBook 14', 'Laptop', '{"processor": "Intel i7", "ram": "16GB", "storage": "1TB SSD"}', 'Ultrabook');

-- Seri Numaraları
INSERT INTO seri_numaralari (model_id, seri_no, aciklama, kullanim_durumu) VALUES
(1, 'DL5520-001', 'Dell Latitude 5520 Seri No 1', 'MUSAIT'),
(1, 'DL5520-002', 'Dell Latitude 5520 Seri No 2', 'MUSAIT'),
(1, 'DL5520-003', 'Dell Latitude 5520 Seri No 3', 'MUSAIT'),
(2, 'DO7090-001', 'Dell OptiPlex 7090 Seri No 1', 'MUSAIT'),
(2, 'DO7090-002', 'Dell OptiPlex 7090 Seri No 2', 'MUSAIT'),
(3, 'HE840-001', 'HP EliteBook 840 Seri No 1', 'MUSAIT'),
(3, 'HE840-002', 'HP EliteBook 840 Seri No 2', 'MUSAIT'),
(4, 'HP450-001', 'HP ProBook 450 Seri No 1', 'MUSAIT'),
(5, 'LTX1-001', 'Lenovo ThinkPad X1 Seri No 1', 'MUSAIT'),
(5, 'LTX1-002', 'Lenovo ThinkPad X1 Seri No 2', 'MUSAIT'),
(6, 'LTM90-001', 'Lenovo ThinkCentre M90 Seri No 1', 'MUSAIT'),
(7, 'AMP-001', 'Apple MacBook Pro Seri No 1', 'MUSAIT'),
(8, 'AIM-001', 'Apple iMac Seri No 1', 'MUSAIT'),
(9, 'SGT7-001', 'Samsung Galaxy Tab S7 Seri No 1', 'MUSAIT'),
(10, 'AZ14-001', 'Asus ZenBook 14 Seri No 1', 'MUSAIT');

-- MAC Adresleri
INSERT INTO mac_adresleri (model_id, mac_adresi, aciklama, kullanim_durumu) VALUES
(1, '00:1B:44:11:3A:B7', 'Dell Latitude 5520 MAC 1', 'MUSAIT'),
(1, '00:1B:44:11:3A:B8', 'Dell Latitude 5520 MAC 2', 'MUSAIT'),
(1, '00:1B:44:11:3A:B9', 'Dell Latitude 5520 MAC 3', 'MUSAIT'),
(2, '00:1B:44:11:3A:BA', 'Dell OptiPlex 7090 MAC 1', 'MUSAIT'),
(2, '00:1B:44:11:3A:BB', 'Dell OptiPlex 7090 MAC 2', 'MUSAIT'),
(3, '00:1B:44:11:3A:BC', 'HP EliteBook 840 MAC 1', 'MUSAIT'),
(3, '00:1B:44:11:3A:BD', 'HP EliteBook 840 MAC 2', 'MUSAIT'),
(4, '00:1B:44:11:3A:BE', 'HP ProBook 450 MAC 1', 'MUSAIT'),
(5, '00:1B:44:11:3A:BF', 'Lenovo ThinkPad X1 MAC 1', 'MUSAIT'),
(5, '00:1B:44:11:3A:C0', 'Lenovo ThinkPad X1 MAC 2', 'MUSAIT'),
(6, '00:1B:44:11:3A:C1', 'Lenovo ThinkCentre M90 MAC 1', 'MUSAIT'),
(7, '00:1B:44:11:3A:C2', 'Apple MacBook Pro MAC 1', 'MUSAIT'),
(8, '00:1B:44:11:3A:C3', 'Apple iMac MAC 1', 'MUSAIT'),
(9, '00:1B:44:11:3A:C4', 'Samsung Galaxy Tab S7 MAC 1', 'MUSAIT'),
(10, '00:1B:44:11:3A:C5', 'Asus ZenBook 14 MAC 1', 'MUSAIT');

-- Ekipman Envanteri
INSERT INTO ekipman_envanteri (
    seri_no_id, mac_adresi_id, barkod, marka_id, model_id, lokasyon_id, atanan_personel_id,
    satin_alma_tarihi, garanti_bitis_tarihi, ofise_giris_tarihi, satin_alma_fiyati,
    amortisman_suresi, fiziksel_durum, calismma_durumu, aciklama, created_by
) VALUES
(1, 1, 'EQ001', 1, 1, 2, 1, '2023-01-15', '2026-01-15', '2023-01-20', 25000.00, 36, 'İyi', 'Çalışıyor', 'IT Departmanı için alınan laptop', 1),
(2, 2, 'EQ002', 1, 1, 2, 5, '2023-02-10', '2026-02-10', '2023-02-15', 25000.00, 36, 'Çok İyi', 'Çalışıyor', 'Sistem yöneticisi için', 1),
(3, 3, 'EQ003', 1, 1, 3, 4, '2023-03-05', '2026-03-05', '2023-03-10', 25000.00, 36, 'İyi', 'Çalışıyor', 'Satış departmanı için', 1),
(4, 4, 'EQ004', 1, 2, 2, 1, '2023-01-20', '2026-01-20', '2023-01-25', 15000.00, 36, 'İyi', 'Çalışıyor', 'IT departmanı masaüstü', 1),
(5, 5, 'EQ005', 1, 2, 2, 5, '2023-02-15', '2026-02-15', '2023-02-20', 15000.00, 36, 'İyi', 'Çalışıyor', 'Sistem yöneticisi masaüstü', 1),
(6, 6, 'EQ006', 2, 3, 2, 2, '2023-04-01', '2026-04-01', '2023-04-05', 30000.00, 36, 'Çok İyi', 'Çalışıyor', 'HR departmanı için premium laptop', 1),
(7, 7, 'EQ007', 2, 3, 3, 4, '2023-04-10', '2026-04-10', '2023-04-15', 30000.00, 36, 'İyi', 'Çalışıyor', 'Satış departmanı premium laptop', 1),
(8, 8, 'EQ008', 2, 4, 2, 3, '2023-05-01', '2026-05-01', '2023-05-05', 20000.00, 36, 'İyi', 'Çalışıyor', 'Muhasebe departmanı için', 1),
(9, 9, 'EQ009', 3, 5, 2, 1, '2023-06-01', '2026-06-01', '2023-06-05', 35000.00, 36, 'Çok İyi', 'Çalışıyor', 'IT departmanı ultrabook', 1),
(10, 10, 'EQ010', 3, 5, 5, 5, '2023-06-10', '2026-06-10', '2023-06-15', 35000.00, 36, 'İyi', 'Çalışıyor', 'Teknik servis için', 1),
(11, 11, 'EQ011', 3, 6, 2, 1, '2023-07-01', '2026-07-01', '2023-07-05', 12000.00, 36, 'İyi', 'Çalışıyor', 'IT departmanı masaüstü', 1),
(12, 12, 'EQ012', 4, 7, 2, 1, '2023-08-01', '2026-08-01', '2023-08-05', 45000.00, 36, 'Çok İyi', 'Çalışıyor', 'IT departmanı MacBook Pro', 1),
(13, 13, 'EQ013', 4, 8, 2, 6, '2023-08-15', '2026-08-15', '2023-08-20', 25000.00, 36, 'İyi', 'Çalışıyor', 'Pazarlama departmanı iMac', 1),
(14, 14, 'EQ014', 5, 9, 4, 1, '2023-09-01', '2026-09-01', '2023-09-05', 8000.00, 36, 'İyi', 'Çalışıyor', 'Eğitim salonu tablet', 1),
(15, 15, 'EQ015', 6, 10, 2, 1, '2023-10-01', '2026-10-01', '2023-10-05', 28000.00, 36, 'İyi', 'Çalışıyor', 'IT departmanı ultrabook', 1);

-- Bakım Kayıtları
INSERT INTO bakim_kayitlari (ekipman_id, bakim_tipi, bakim_tarihi, planlanan_tarih, aciklama, yapilan_isler, maliyet, durum, yapan_kisi, created_by) VALUES
(1, 'PERIYODIK', '2023-06-15', '2023-06-15', 'Periyodik bakım', 'Temizlik, yazılım güncellemesi', 500.00, 'TAMAMLANDI', 'Ahmet Yılmaz', 1),
(2, 'ARIZA', '2023-07-20', '2023-07-20', 'Klavye arızası', 'Klavye değişimi', 1500.00, 'TAMAMLANDI', 'Teknik Servis', 1),
(3, 'KORUYUCU', '2023-08-10', '2023-08-10', 'Koruyucu bakım', 'Sistem optimizasyonu', 300.00, 'TAMAMLANDI', 'Ali Çelik', 1),
(4, 'PERIYODIK', '2023-09-01', '2023-09-01', 'Periyodik bakım', 'Donanım kontrolü', 400.00, 'TAMAMLANDI', 'Ahmet Yılmaz', 1),
(5, 'ARIZA', '2023-10-15', '2023-10-15', 'Ekran arızası', 'Ekran değişimi', 2000.00, 'TAMAMLANDI', 'Teknik Servis', 1);

-- QR Kodları
INSERT INTO qr_kodlari (ekipman_id, qr_kod, qr_tipi, qr_icerik, qr_url, created_by) VALUES
(1, 'QR-EQ001', 'ekipman', '{"ekipman_id": 1, "barkod": "EQ001", "tip": "Laptop"}', 'https://inventory.company.com/eq/1', 1),
(2, 'QR-EQ002', 'ekipman', '{"ekipman_id": 2, "barkod": "EQ002", "tip": "Laptop"}', 'https://inventory.company.com/eq/2', 1),
(3, 'QR-EQ003', 'ekipman', '{"ekipman_id": 3, "barkod": "EQ003", "tip": "Laptop"}', 'https://inventory.company.com/eq/3', 1),
(4, 'QR-EQ004', 'ekipman', '{"ekipman_id": 4, "barkod": "EQ004", "tip": "Desktop"}', 'https://inventory.company.com/eq/4', 1),
(5, 'QR-EQ005', 'ekipman', '{"ekipman_id": 5, "barkod": "EQ005", "tip": "Desktop"}', 'https://inventory.company.com/eq/5', 1);

-- Sistem Ayarları
INSERT INTO sistem_ayarlari (kategori, ayar_anahtari, ayar_degeri, data_tipi, aciklama, is_public) VALUES
('notification', 'email_enabled', 'true', 'boolean', 'E-posta bildirimleri aktif mi?', true),
('notification', 'sms_enabled', 'false', 'boolean', 'SMS bildirimleri aktif mi?', true),
('system', 'maintenance_reminder_days', '30', 'number', 'Bakım hatırlatma gün sayısı', true),
('system', 'warranty_reminder_days', '60', 'number', 'Garanti hatırlatma gün sayısı', true),
('export', 'max_export_records', '10000', 'number', 'Maksimum export kayıt sayısı', true),
('security', 'session_timeout_minutes', '480', 'number', 'Oturum zaman aşımı (dakika)', false);

-- Uyarı Kuralları
INSERT INTO uyari_kurallari (kural_adi, kural_tipi, kural_detayi, alici_roller, created_by) VALUES
('Garanti Sonu Uyarısı', 'Garanti Sonu', '{"days_before": 30, "notification_type": "email"}', '["admin", "manager"]', 1),
('Bakım Zamanı Uyarısı', 'Bakım Zamanı', '{"days_before": 7, "notification_type": "email"}', '["admin"]', 1),
('Arızalı Ekipman Uyarısı', 'Fiziksel Durum', '{"condition": "Arızalı", "notification_type": "email"}', '["admin", "manager"]', 1); 