-- =====================================================
-- ENVANTER TAKİP SİSTEMİ - TAM VERİTABANI OLUŞTURMA
-- =====================================================
-- Bu dosya veritabanını sıfırdan oluşturmak için gerekli tüm SQL komutlarını içerir
-- Sırasıyla çalıştırılması gereken komutlar:
-- 1. Veritabanı oluşturma
-- 2. Lookup tabloları
-- 3. Ana tablolar
-- 4. Trigger'lar
-- 5. Stored Procedure'lar
-- 6. View'lar
-- 7. Örnek veriler
-- =====================================================

-- 1. VERİTABANI OLUŞTURMA
-- =====================================================
CREATE DATABASE IF NOT EXISTS envanter_takip_sistemi
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE envanter_takip_sistemi;

-- 2. LOOKUP TABLOLARI
-- =====================================================

-- Departmanlar tablosu
CREATE TABLE IF NOT EXISTS departmanlar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    departman_adi VARCHAR(100) NOT NULL UNIQUE,
    aciklama TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Lokasyonlar tablosu
CREATE TABLE IF NOT EXISTS lokasyonlar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lokasyon_adi VARCHAR(100) NOT NULL UNIQUE,
    departman_id INT,
    aciklama TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (departman_id) REFERENCES departmanlar(id) ON DELETE SET NULL
);

-- Markalar tablosu
CREATE TABLE IF NOT EXISTS markalar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    marka_adi VARCHAR(100) NOT NULL UNIQUE,
    aciklama TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Model kategorileri tablosu
CREATE TABLE IF NOT EXISTS model_kategorileri (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kategori_adi VARCHAR(100) NOT NULL UNIQUE,
    aciklama TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Modeller tablosu
CREATE TABLE IF NOT EXISTS modeller (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_adi VARCHAR(100) NOT NULL,
    marka_id INT NOT NULL,
    kategori_id INT NOT NULL,
    aciklama TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (marka_id) REFERENCES markalar(id) ON DELETE CASCADE,
    FOREIGN KEY (kategori_id) REFERENCES model_kategorileri(id) ON DELETE CASCADE,
    UNIQUE KEY unique_model (marka_id, model_adi)
);

-- Personel tablosu
CREATE TABLE IF NOT EXISTS personel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ad VARCHAR(50) NOT NULL,
    soyad VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefon VARCHAR(20),
    departman_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (departman_id) REFERENCES departmanlar(id) ON DELETE SET NULL
);

-- 3. SERİAL VE MAC ADRES TABLOLARI
-- =====================================================

-- Serial numaraları tablosu
CREATE TABLE IF NOT EXISTS serial_numaralar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serial_no VARCHAR(100) NOT NULL UNIQUE,
    model_id INT NOT NULL,
    kullanim_durumu ENUM('MUSAIT', 'KULLANIMDA', 'ARIZALI', 'HURDA') DEFAULT 'MUSAIT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES modeller(id) ON DELETE CASCADE
);

-- MAC adresleri tablosu
CREATE TABLE IF NOT EXISTS mac_adresleri (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mac_adres VARCHAR(17) NOT NULL UNIQUE,
    model_id INT NOT NULL,
    kullanim_durumu ENUM('MUSAIT', 'KULLANIMDA', 'ARIZALI', 'HURDA') DEFAULT 'MUSAIT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES modeller(id) ON DELETE CASCADE
);

-- 4. ANA ENVANTER TABLOSU
-- =====================================================

CREATE TABLE IF NOT EXISTS envanter_kayitlari (
    id INT AUTO_INCREMENT PRIMARY KEY,
    auto_id VARCHAR(20) UNIQUE,
    model_id INT NOT NULL,
    serial_id INT,
    mac_id INT,
    lokasyon_id INT,
    personel_id INT,
    durum ENUM('AKTIF', 'PASIF', 'ARIZALI', 'HURDA') DEFAULT 'AKTIF',
    aciklama TEXT,
    alim_tarihi DATE,
    garanti_baslangic DATE,
    garanti_bitis DATE,
    fiyat DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES modeller(id) ON DELETE CASCADE,
    FOREIGN KEY (serial_id) REFERENCES serial_numaralar(id) ON DELETE SET NULL,
    FOREIGN KEY (mac_id) REFERENCES mac_adresleri(id) ON DELETE SET NULL,
    FOREIGN KEY (lokasyon_id) REFERENCES lokasyonlar(id) ON DELETE SET NULL,
    FOREIGN KEY (personel_id) REFERENCES personel(id) ON DELETE SET NULL
);

-- 5. GEÇMİŞ TABLOLARI
-- =====================================================

-- Envanter geçmişi tablosu
CREATE TABLE IF NOT EXISTS envanter_gecmisi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    envanter_id INT NOT NULL,
    islem_tipi ENUM('OLUSTURMA', 'GUNCELLEME', 'SILME', 'DURUM_DEGISIKLIGI', 'LOKASYON_DEGISIKLIGI', 'PERSONEL_DEGISIKLIGI') NOT NULL,
    eski_deger TEXT,
    yeni_deger TEXT,
    islem_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    islem_yapan VARCHAR(100),
    FOREIGN KEY (envanter_id) REFERENCES envanter_kayitlari(id) ON DELETE CASCADE
);

-- 6. TRIGGER'LAR
-- =====================================================

-- Auto ID oluşturma trigger'ı
DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_envanter_auto_id
BEFORE INSERT ON envanter_kayitlari
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    DECLARE model_prefix VARCHAR(10);
    DECLARE year_suffix VARCHAR(4);
    
    -- Model prefix'ini al
    SELECT CONCAT(LEFT(mk.marka_adi, 3), LEFT(md.model_adi, 3))
    INTO model_prefix
    FROM modeller md
    JOIN markalar mk ON md.marka_id = mk.id
    WHERE md.id = NEW.model_id;
    
    -- Yıl suffix'ini al
    SET year_suffix = YEAR(CURDATE());
    
    -- Sonraki ID'yi bul
    SELECT COALESCE(MAX(CAST(SUBSTRING(auto_id, -4) AS UNSIGNED)), 0) + 1
    INTO next_id
    FROM envanter_kayitlari
    WHERE auto_id LIKE CONCAT(model_prefix, year_suffix, '%');
    
    -- Auto ID'yi oluştur
    SET NEW.auto_id = CONCAT(UPPER(model_prefix), year_suffix, LPAD(next_id, 4, '0'));
END//
DELIMITER ;

-- Serial numara durumu güncelleme trigger'ı
DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_serial_durum_guncelle
AFTER INSERT ON envanter_kayitlari
FOR EACH ROW
BEGIN
    IF NEW.serial_id IS NOT NULL THEN
        UPDATE serial_numaralar 
        SET kullanim_durumu = 'KULLANIMDA'
        WHERE id = NEW.serial_id;
    END IF;
    
    IF NEW.mac_id IS NOT NULL THEN
        UPDATE mac_adresleri 
        SET kullanim_durumu = 'KULLANIMDA'
        WHERE id = NEW.mac_id;
    END IF;
END//
DELIMITER ;

-- Envanter güncelleme trigger'ı
DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_envanter_guncelleme
AFTER UPDATE ON envanter_kayitlari
FOR EACH ROW
BEGIN
    -- Durum değişikliği
    IF OLD.durum != NEW.durum THEN
        INSERT INTO envanter_gecmisi (envanter_id, islem_tipi, eski_deger, yeni_deger, islem_yapan)
        VALUES (NEW.id, 'DURUM_DEGISIKLIGI', OLD.durum, NEW.durum, USER());
    END IF;
    
    -- Lokasyon değişikliği
    IF OLD.lokasyon_id != NEW.lokasyon_id THEN
        INSERT INTO envanter_gecmisi (envanter_id, islem_tipi, eski_deger, yeni_deger, islem_yapan)
        VALUES (NEW.id, 'LOKASYON_DEGISIKLIGI', 
                (SELECT lokasyon_adi FROM lokasyonlar WHERE id = OLD.lokasyon_id),
                (SELECT lokasyon_adi FROM lokasyonlar WHERE id = NEW.lokasyon_id),
                USER());
    END IF;
    
    -- Personel değişikliği
    IF OLD.personel_id != NEW.personel_id THEN
        INSERT INTO envanter_gecmisi (envanter_id, islem_tipi, eski_deger, yeni_deger, islem_yapan)
        VALUES (NEW.id, 'PERSONEL_DEGISIKLIGI',
                (SELECT CONCAT(ad, ' ', soyad) FROM personel WHERE id = OLD.personel_id),
                (SELECT CONCAT(ad, ' ', soyad) FROM personel WHERE id = NEW.personel_id),
                USER());
    END IF;
END//
DELIMITER ;

-- Envanter silme trigger'ı
DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_envanter_silme
BEFORE DELETE ON envanter_kayitlari
FOR EACH ROW
BEGIN
    -- Serial numarayı müsait yap
    IF OLD.serial_id IS NOT NULL THEN
        UPDATE serial_numaralar 
        SET kullanim_durumu = 'MUSAIT'
        WHERE id = OLD.serial_id;
    END IF;
    
    -- MAC adresini müsait yap
    IF OLD.mac_id IS NOT NULL THEN
        UPDATE mac_adresleri 
        SET kullanim_durumu = 'MUSAIT'
        WHERE id = OLD.mac_id;
    END IF;
    
    -- Geçmişe kaydet
    INSERT INTO envanter_gecmisi (envanter_id, islem_tipi, eski_deger, islem_yapan)
    VALUES (OLD.id, 'SILME', CONCAT('Silinen kayıt: ', OLD.auto_id), USER());
END//
DELIMITER ;

-- 7. STORED PROCEDURE'LAR
-- =====================================================

-- Envanter ekleme procedure'ı
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_envanter_ekle(
    IN p_model_id INT,
    IN p_serial_id INT,
    IN p_mac_id INT,
    IN p_lokasyon_id INT,
    IN p_personel_id INT,
    IN p_aciklama TEXT,
    IN p_alim_tarihi DATE,
    IN p_garanti_baslangic DATE,
    IN p_garanti_bitis DATE,
    IN p_fiyat DECIMAL(10,2)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    INSERT INTO envanter_kayitlari (
        model_id, serial_id, mac_id, lokasyon_id, personel_id,
        aciklama, alim_tarihi, garanti_baslangic, garanti_bitis, fiyat
    ) VALUES (
        p_model_id, p_serial_id, p_mac_id, p_lokasyon_id, p_personel_id,
        p_aciklama, p_alim_tarihi, p_garanti_baslangic, p_garanti_bitis, p_fiyat
    );
    
    COMMIT;
    
    SELECT 'Envanter başarıyla eklendi' AS mesaj;
END//
DELIMITER ;

-- Envanter güncelleme procedure'ı
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_envanter_guncelle(
    IN p_id INT,
    IN p_lokasyon_id INT,
    IN p_personel_id INT,
    IN p_durum ENUM('AKTIF', 'PASIF', 'ARIZALI', 'HURDA'),
    IN p_aciklama TEXT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    UPDATE envanter_kayitlari 
    SET lokasyon_id = p_lokasyon_id,
        personel_id = p_personel_id,
        durum = p_durum,
        aciklama = p_aciklama,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id;
    
    COMMIT;
    
    SELECT 'Envanter başarıyla güncellendi' AS mesaj;
END//
DELIMITER ;

-- 8. VIEW'LAR
-- =====================================================

-- Detaylı envanter görünümü
CREATE OR REPLACE VIEW v_detayli_envanter AS
SELECT 
    ek.id,
    ek.auto_id,
    mk.marka_adi,
    md.model_adi,
    mk2.kategori_adi,
    sn.serial_no,
    ma.mac_adres,
    l.lokasyon_adi,
    d.departman_adi,
    CONCAT(p.ad, ' ', p.soyad) AS personel_adi,
    ek.durum,
    ek.aciklama,
    ek.alim_tarihi,
    ek.garanti_baslangic,
    ek.garanti_bitis,
    ek.fiyat,
    ek.created_at,
    ek.updated_at
FROM envanter_kayitlari ek
LEFT JOIN modeller md ON ek.model_id = md.id
LEFT JOIN markalar mk ON md.marka_id = mk.id
LEFT JOIN model_kategorileri mk2 ON md.kategori_id = mk2.id
LEFT JOIN serial_numaralar sn ON ek.serial_id = sn.id
LEFT JOIN mac_adresleri ma ON ek.mac_id = ma.id
LEFT JOIN lokasyonlar l ON ek.lokasyon_id = l.id
LEFT JOIN departmanlar d ON l.departman_id = d.id
LEFT JOIN personel p ON ek.personel_id = p.id;

-- Müsait serial numaraları görünümü
CREATE OR REPLACE VIEW v_musait_serial AS
SELECT 
    sn.id,
    sn.serial_no,
    mk.marka_adi,
    md.model_adi,
    mk2.kategori_adi
FROM serial_numaralar sn
JOIN modeller md ON sn.model_id = md.id
JOIN markalar mk ON md.marka_id = mk.id
JOIN model_kategorileri mk2 ON md.kategori_id = mk2.id
WHERE sn.kullanim_durumu = 'MUSAIT';

-- Müsait MAC adresleri görünümü
CREATE OR REPLACE VIEW v_musait_mac AS
SELECT 
    ma.id,
    ma.mac_adres,
    mk.marka_adi,
    md.model_adi,
    mk2.kategori_adi
FROM mac_adresleri ma
JOIN modeller md ON ma.model_id = md.id
JOIN markalar mk ON md.marka_id = mk.id
JOIN model_kategorileri mk2 ON md.kategori_id = mk2.id
WHERE ma.kullanim_durumu = 'MUSAIT';

-- 9. ÖRNEK VERİLER
-- =====================================================

-- Departmanlar
INSERT IGNORE INTO departmanlar (departman_adi, aciklama) VALUES
('Bilgi İşlem', 'Bilgi teknolojileri departmanı'),
('İnsan Kaynakları', 'İnsan kaynakları departmanı'),
('Muhasebe', 'Mali işler departmanı'),
('Satış', 'Satış ve pazarlama departmanı'),
('Üretim', 'Üretim departmanı');

-- Lokasyonlar
INSERT IGNORE INTO lokasyonlar (lokasyon_adi, departman_id, aciklama) VALUES
('IT Ofis 1', 1, 'Bilgi işlem ofisi 1'),
('IT Ofis 2', 1, 'Bilgi işlem ofisi 2'),
('HR Ofis', 2, 'İnsan kaynakları ofisi'),
('Muhasebe Ofis', 3, 'Muhasebe ofisi'),
('Satış Ofis', 4, 'Satış ofisi'),
('Üretim Sahası', 5, 'Üretim sahası');

-- Markalar
INSERT IGNORE INTO markalar (marka_adi, aciklama) VALUES
('Dell', 'Dell bilgisayar sistemleri'),
('HP', 'Hewlett-Packard'),
('Lenovo', 'Lenovo bilgisayarlar'),
('Apple', 'Apple bilgisayarlar'),
('Samsung', 'Samsung elektronik'),
('Cisco', 'Cisco network ekipmanları');

-- Model kategorileri
INSERT IGNORE INTO model_kategorileri (kategori_adi, aciklama) VALUES
('Laptop', 'Dizüstü bilgisayarlar'),
('Desktop', 'Masaüstü bilgisayarlar'),
('Tablet', 'Tablet bilgisayarlar'),
('Monitor', 'Monitörler'),
('Printer', 'Yazıcılar'),
('Network', 'Ağ ekipmanları'),
('Diğer', 'Diğer ekipmanlar');

-- Modeller
INSERT IGNORE INTO modeller (model_adi, marka_id, kategori_id, aciklama) VALUES
('Latitude 5520', 1, 1, 'Dell Latitude dizüstü'),
('OptiPlex 7090', 1, 2, 'Dell OptiPlex masaüstü'),
('EliteBook 840', 2, 1, 'HP EliteBook dizüstü'),
('ThinkPad X1', 3, 1, 'Lenovo ThinkPad dizüstü'),
('MacBook Pro', 4, 1, 'Apple MacBook Pro'),
('Galaxy Tab', 5, 3, 'Samsung tablet'),
('P2419H', 1, 4, 'Dell monitör'),
('LaserJet Pro', 2, 5, 'HP yazıcı'),
('Catalyst 2960', 6, 6, 'Cisco switch');

-- Personel
INSERT IGNORE INTO personel (ad, soyad, email, telefon, departman_id) VALUES
('Ahmet', 'Yılmaz', 'ahmet.yilmaz@sirket.com', '555-0001', 1),
('Fatma', 'Demir', 'fatma.demir@sirket.com', '555-0002', 2),
('Mehmet', 'Kaya', 'mehmet.kaya@sirket.com', '555-0003', 3),
('Ayşe', 'Çelik', 'ayse.celik@sirket.com', '555-0004', 4),
('Ali', 'Özkan', 'ali.ozkan@sirket.com', '555-0005', 5);

-- Serial numaraları
INSERT IGNORE INTO serial_numaralar (serial_no, model_id, kullanim_durumu) VALUES
('SN001', 1, 'MUSAIT'),
('SN002', 1, 'MUSAIT'),
('SN003', 2, 'MUSAIT'),
('SN004', 3, 'MUSAIT'),
('SN005', 4, 'MUSAIT'),
('SN006', 5, 'MUSAIT'),
('SN007', 6, 'MUSAIT'),
('SN008', 7, 'MUSAIT'),
('SN009', 8, 'MUSAIT'),
('SN010', 9, 'MUSAIT');

-- MAC adresleri
INSERT IGNORE INTO mac_adresleri (mac_adres, model_id, kullanim_durumu) VALUES
('00:1B:44:11:3A:B7', 1, 'MUSAIT'),
('00:1B:44:11:3A:B8', 1, 'MUSAIT'),
('00:1B:44:11:3A:B9', 2, 'MUSAIT'),
('00:1B:44:11:3A:BA', 3, 'MUSAIT'),
('00:1B:44:11:3A:BB', 4, 'MUSAIT'),
('00:1B:44:11:3A:BC', 5, 'MUSAIT'),
('00:1B:44:11:3A:BD', 6, 'MUSAIT'),
('00:1B:44:11:3A:BE', 7, 'MUSAIT'),
('00:1B:44:11:3A:BF', 8, 'MUSAIT'),
('00:1B:44:11:3A:C0', 9, 'MUSAIT');

-- Örnek envanter kayıtları
INSERT IGNORE INTO envanter_kayitlari (model_id, serial_id, mac_id, lokasyon_id, personel_id, aciklama, alim_tarihi, fiyat) VALUES
(1, 1, 1, 1, 1, 'IT departmanı için laptop', '2024-01-15', 15000.00),
(2, 3, 3, 1, 1, 'IT departmanı için masaüstü', '2024-01-20', 8000.00),
(3, 4, 4, 2, 2, 'HR departmanı için laptop', '2024-02-01', 12000.00),
(4, 5, 5, 3, 3, 'Muhasebe departmanı için laptop', '2024-02-10', 18000.00),
(5, 6, 6, 4, 4, 'Satış departmanı için MacBook', '2024-02-15', 25000.00);

-- =====================================================
-- VERİTABANI OLUŞTURMA TAMAMLANDI
-- =====================================================
-- Bu dosyayı çalıştırdıktan sonra veritabanınız tamamen hazır olacaktır.
-- Tüm tablolar, trigger'lar, stored procedure'lar, view'lar ve örnek veriler oluşturulmuştur.
-- ===================================================== 