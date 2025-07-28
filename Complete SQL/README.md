# Envanter Takip Sistemi - Complete SQL

Bu klasör, Envanter Takip Sistemi veritabanını sıfırdan oluşturmak için gerekli tüm SQL dosyalarını içerir.

## 📁 Dosya Yapısı

```
Complete SQL/
├── 01_create_complete_database.sql  # Ana veritabanı oluşturma dosyası
└── README.md                        # Bu dosya
```

## 🚀 Kullanım

### Veritabanını Sıfırdan Oluşturmak İçin:

1. **MySQL sunucunuza bağlanın**
2. **`01_create_complete_database.sql` dosyasını çalıştırın**

```sql
-- MySQL komut satırında:
source /path/to/01_create_complete_database.sql

-- Veya MySQL Workbench'te dosyayı açıp çalıştırın
```

## 📋 İçerik

### `01_create_complete_database.sql` dosyası şunları içerir:

1. **Veritabanı Oluşturma**
   - `envanter_takip_sistemi` veritabanı
   - UTF8MB4 karakter seti

2. **Lookup Tabloları**
   - `departmanlar` - Departman bilgileri
   - `lokasyonlar` - Lokasyon bilgileri
   - `markalar` - Marka bilgileri
   - `model_kategorileri` - Model kategorileri
   - `modeller` - Model bilgileri
   - `personel` - Personel bilgileri

3. **Ana Tablolar**
   - `serial_numaralar` - Serial numara bilgileri
   - `mac_adresleri` - MAC adres bilgileri
   - `envanter_kayitlari` - Ana envanter tablosu
   - `envanter_gecmisi` - Geçmiş kayıtları

4. **Trigger'lar**
   - Auto ID oluşturma
   - Serial/MAC durumu güncelleme
   - Envanter güncelleme takibi
   - Envanter silme işlemleri

5. **Stored Procedure'lar**
   - `sp_envanter_ekle` - Envanter ekleme
   - `sp_envanter_guncelle` - Envanter güncelleme

6. **View'lar**
   - `v_detayli_envanter` - Detaylı envanter görünümü
   - `v_musait_serial` - Müsait serial numaraları
   - `v_musait_mac` - Müsait MAC adresleri

7. **Örnek Veriler**
   - Departmanlar, lokasyonlar, markalar
   - Modeller, personel, serial numaraları
   - MAC adresleri ve örnek envanter kayıtları

## ⚠️ Önemli Notlar

- Bu dosya veritabanını **sıfırdan** oluşturur
- Mevcut veriler **silinecektir**
- Yedek almayı unutmayın!

## 🔧 Gereksinimler

- MySQL 5.7 veya üzeri
- Yeterli disk alanı
- Veritabanı oluşturma yetkisi

## 📞 Destek

Herhangi bir sorun yaşarsanız, lütfen geliştirici ekibi ile iletişime geçin. 