-- ==============================================
-- ENVANTER TAKİP SİSTEMİ - MYSQL KURULUM SCRIPTİ
-- ==============================================
-- Bu script tüm veritabanı yapısını oluşturur
-- Sırasıyla çalıştırılması gereken dosyalar:
-- 1. 01_create_database.sql
-- 2. 02_lookup_tables.sql
-- 3. 03_serial_mac_tables.sql
-- 4. 04_main_inventory_table.sql
-- 5. 05_history_tables.sql
-- 6. 06_notification_tables.sql
-- 7. 07_qr_export_tables.sql
-- 8. 08_triggers.sql
-- 9. 09_stored_procedures.sql
-- 10. 10_sample_data.sql
-- 11. 11_views.sql

-- Kurulum başlangıcı
SELECT 'Envanter Takip Sistemi MySQL Kurulumu Başlıyor...' as mesaj;

-- Veritabanını oluştur
CREATE DATABASE IF NOT EXISTS inventory_tracking 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Veritabanını kullan
USE inventory_tracking;

SELECT 'Veritabanı oluşturuldu ve seçildi.' as mesaj;

-- Kurulum tamamlandı mesajı
SELECT '==============================================' as mesaj;
SELECT 'ENVANTER TAKİP SİSTEMİ KURULUMU TAMAMLANDI' as mesaj;
SELECT '==============================================' as mesaj;
SELECT '' as mesaj;
SELECT 'Kurulum Adımları:' as mesaj;
SELECT '1. Veritabanı oluşturuldu' as mesaj;
SELECT '2. Tablolar oluşturuldu' as mesaj;
SELECT '3. Trigger\'lar eklendi' as mesaj;
SELECT '4. Stored Procedure\'ler eklendi' as mesaj;
SELECT '5. Örnek veriler eklendi' as mesaj;
SELECT '6. View\'lar oluşturuldu' as mesaj;
SELECT '' as mesaj;
SELECT 'Kullanıma Hazır!' as mesaj;
SELECT '' as mesaj;
SELECT 'Önemli Notlar:' as mesaj;
SELECT '- Tüm dosyaları sırasıyla çalıştırdığınızdan emin olun' as mesaj;
SELECT '- Örnek veriler test amaçlıdır, production\'da silinebilir' as mesaj;
SELECT '- Güvenlik için varsayılan şifreleri değiştirin' as mesaj;
SELECT '- Backup almayı unutmayın' as mesaj; 