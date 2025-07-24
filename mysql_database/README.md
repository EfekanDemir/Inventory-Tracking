# Envanter Takip Sistemi - MySQL Veritabanı

Bu klasör, Envanter Takip Sistemi için MySQL veritabanı kurulum dosyalarını içerir.

## 📁 Dosya Yapısı

```
mysql_database/
├── 01_create_database.sql          # Veritabanı oluşturma
├── 02_lookup_tables.sql            # Temel tablolar (markalar, modeller, vb.)
├── 03_serial_mac_tables.sql        # Seri no ve MAC adresi tabloları
├── 04_main_inventory_table.sql     # Ana envanter tablosu
├── 05_history_tables.sql           # Geçmiş ve hareket tabloları
├── 06_notification_tables.sql      # Bildirim sistemi tabloları
├── 07_qr_export_tables.sql         # QR kod ve export tabloları
├── 08_triggers.sql                 # Trigger'lar ve fonksiyonlar
├── 09_stored_procedures.sql        # Stored Procedure'ler
├── 10_sample_data.sql              # Örnek veriler
├── 11_views.sql                    # Veritabanı görünümleri
├── 12_install_script.sql           # Kurulum scripti
└── README.md                       # Bu dosya
```

## 🚀 Kurulum

### Gereksinimler
- MySQL 8.0 veya üzeri
- DBeaver veya benzeri bir veritabanı yönetim aracı
- Yeterli disk alanı (en az 1GB)

### Kurulum Adımları

1. **MySQL Sunucusuna Bağlanın**
   - DBeaver'da yeni bir MySQL bağlantısı oluşturun
   - Root kullanıcısı veya yeterli yetkiye sahip bir kullanıcı ile bağlanın

2. **Dosyaları Sırasıyla Çalıştırın**
   ```sql
   -- 1. Veritabanı oluşturma
   SOURCE 01_create_database.sql;
   
   -- 2. Temel tablolar
   SOURCE 02_lookup_tables.sql;
   
   -- 3. Seri no ve MAC adresi tabloları
   SOURCE 03_serial_mac_tables.sql;
   
   -- 4. Ana envanter tablosu
   SOURCE 04_main_inventory_table.sql;
   
   -- 5. Geçmiş tabloları
   SOURCE 05_history_tables.sql;
   
   -- 6. Bildirim tabloları
   SOURCE 06_notification_tables.sql;
   
   -- 7. QR kod ve export tabloları
   SOURCE 07_qr_export_tables.sql;
   
   -- 8. Trigger'lar
   SOURCE 08_triggers.sql;
   
   -- 9. Stored Procedure'ler
   SOURCE 09_stored_procedures.sql;
   
   -- 10. Örnek veriler (opsiyonel)
   SOURCE 10_sample_data.sql;
   
   -- 11. View'lar
   SOURCE 11_views.sql;
   ```

3. **Kurulumu Doğrulayın**
   ```sql
   -- Veritabanını kontrol edin
   SHOW DATABASES;
   USE inventory_tracking;
   SHOW TABLES;
   
   -- Örnek sorgu
   SELECT COUNT(*) as toplam_ekipman FROM ekipman_envanteri;
   ```

## 📊 Veritabanı Yapısı

### Ana Tablolar
- **ekipman_envanteri**: Ana envanter tablosu
- **seri_numaralari**: Seri numaraları yönetimi
- **mac_adresleri**: MAC adresleri yönetimi
- **markalar**: Ekipman markaları
- **modeller**: Ekipman modelleri
- **personel**: Personel bilgileri
- **lokasyonlar**: Lokasyon bilgileri
- **departmanlar**: Departman bilgileri

### Geçmiş ve Takip Tabloları
- **ekipman_gecmisi**: Silinen/arşivlenen ekipmanlar
- **envanter_hareketleri**: Ekipman hareket geçmişi
- **bakim_kayitlari**: Bakım kayıtları
- **bildirimler**: Sistem bildirimleri

### Yardımcı Tablolar
- **qr_kodlari**: QR kod yönetimi
- **export_gecmisi**: Export işlem geçmişi
- **sistem_ayarlari**: Sistem ayarları
- **uyari_kurallari**: Otomatik uyarı kuralları

## 🔧 Özellikler

### Trigger'lar
- **MAC/Seri No Durum Yönetimi**: Ekipman atandığında/silindiğinde otomatik durum güncellemesi
- **Hareket Takibi**: Tüm değişikliklerin otomatik kaydedilmesi
- **Soft Delete**: Ekipmanların güvenli silinmesi
- **Bildirim Sistemi**: Otomatik bildirim oluşturma

### Stored Procedure'ler
- **AssignEquipment**: Ekipman atama
- **UpdateEquipmentStatus**: Durum güncelleme
- **GetWarrantyExpiringEquipment**: Garanti süresi yaklaşan ekipmanlar
- **GetEquipmentByLocation**: Lokasyon bazında rapor
- **GetEquipmentByPersonnel**: Personel bazında rapor
- **GetAvailableMacSerial**: Müsait MAC/Seri no bulma
- **GetEquipmentHistory**: Ekipman geçmişi
- **GetSystemStatistics**: Sistem istatistikleri

### View'lar
- **v_ekipman_detay**: Ekipman detay görünümü
- **v_lokasyon_ozet**: Lokasyon bazında özet
- **v_personel_ozet**: Personel bazında özet
- **v_marka_ozet**: Marka bazında özet
- **v_garanti_yaklasan**: Garanti süresi yaklaşan ekipmanlar
- **v_arizali_ekipmanlar**: Arızalı ekipmanlar
- **v_musait_mac_seri**: Müsait MAC/Seri numaraları

## 📝 Kullanım Örnekleri

### Ekipman Ekleme
```sql
-- Önce müsait seri no ve MAC adresi bulun
CALL GetAvailableMacSerial(1, 'BOTH');

-- Ekipman ekleyin
INSERT INTO ekipman_envanteri (
    seri_no_id, mac_adresi_id, barkod, marka_id, model_id, 
    lokasyon_id, atanan_personel_id, satin_alma_fiyati, 
    fiziksel_durum, calismma_durumu, created_by
) VALUES (
    1, 1, 'EQ001', 1, 1, 2, 1, 25000.00, 'İyi', 'Çalışıyor', 1
);
```

### Ekipman Atama
```sql
CALL AssignEquipment(1, 2, 3, 1, @result, @message);
SELECT @result, @message;
```

### Rapor Alma
```sql
-- Garanti süresi yaklaşan ekipmanlar
CALL GetWarrantyExpiringEquipment(30);

-- Lokasyon bazında rapor
CALL GetEquipmentByLocation(2);

-- Sistem istatistikleri
CALL GetSystemStatistics();
```

### View Kullanımı
```sql
-- Tüm ekipman detayları
SELECT * FROM v_ekipman_detay;

-- Arızalı ekipmanlar
SELECT * FROM v_arizali_ekipmanlar;

-- Garanti süresi yaklaşan ekipmanlar
SELECT * FROM v_garanti_yaklasan WHERE kalan_gun <= 30;
```

## 🔒 Güvenlik

### Kullanıcı Yönetimi
```sql
-- Yeni kullanıcı oluşturma
CREATE USER 'inventory_user'@'localhost' IDENTIFIED BY 'güvenli_şifre';

-- Yetki verme
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_tracking.* TO 'inventory_user'@'localhost';

-- Yetkileri uygulama
FLUSH PRIVILEGES;
```

### Backup
```sql
-- Tam backup
mysqldump -u root -p inventory_tracking > backup_$(date +%Y%m%d_%H%M%S).sql

-- Sadece yapı backup'ı
mysqldump -u root -p --no-data inventory_tracking > structure_backup.sql
```

## 🐛 Sorun Giderme

### Yaygın Hatalar

1. **Foreign Key Hatası**
   ```sql
   -- Foreign key kontrolünü geçici olarak kapatın
   SET FOREIGN_KEY_CHECKS = 0;
   -- İşleminizi yapın
   SET FOREIGN_KEY_CHECKS = 1;
   ```

2. **Character Set Hatası**
   ```sql
   -- Veritabanı karakter setini kontrol edin
   SHOW VARIABLES LIKE 'character_set%';
   
   -- Gerekirse değiştirin
   ALTER DATABASE inventory_tracking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Trigger Hatası**
   ```sql
   -- Trigger'ları yeniden oluşturun
   DROP TRIGGER IF EXISTS equipment_insert_trigger;
   -- 08_triggers.sql dosyasını tekrar çalıştırın
   ```

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. MySQL error log'larını kontrol edin
2. Dosyaları sırasıyla çalıştırdığınızdan emin olun
3. MySQL versiyonunuzun uyumlu olduğunu kontrol edin

## 📄 Lisans

Bu veritabanı yapısı MIT lisansı altında dağıtılmaktadır. 