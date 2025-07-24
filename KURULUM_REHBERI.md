# Basit Envanter Takip Sistemi - Kurulum Rehberi

## 🔧 Yapılandırma Tamamlandı

Bu envanter takip sistemi sadece **gerekli ve zorunlu** bilgilerle çalışacak şekilde yapılandırılmıştır. Gereksiz detaylar kaldırılmış, sadece işlevsel özellikler korunmuştur.

## 📋 Güncellenmiş Yapılandırma

### Environment Variables (.env)
```
VITE_SUPABASE_URL=https://rxmxahwujlkvfbitldqt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bXhhaHd1amxrdmZiaXRsZHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjEyNzksImV4cCI6MjA2ODkzNzI3OX0.Qo_5u1wAmydPqxh0B3kByGG9vtEla9xPSU6wi6hbfEQ
```

### Basitleştirilmiş Veritabanı Yapısı

Sistem artık sadece bu **5 temel tablo** ile çalışır:

1. **markalar** - Marka bilgileri (Apple, Dell, HP, vb.)
2. **modeller** - Model bilgileri (marka ile ilişkili)
3. **lokasyonlar** - Konum bilgileri (Depo, Ofis 1, vb.)
4. **personel** - Personel bilgileri (Ad, Soyad, Email)
5. **ekipman_envanteri** - Ana envanter tablosu
6. **ekipman_gecmisi** - Basit geçmiş takibi

### Temel Özellikler

✅ **Envanter ekleme/düzenleme**
✅ **Marka/Model yönetimi**  
✅ **Lokasyon takibi**
✅ **Personel atama**
✅ **Durum takibi** (Müsait, Kullanımda, Arızalı, Bakımda)
✅ **Basit geçmiş kaydı**
✅ **Excel export**
✅ **QR kod oluşturma**

## 🚀 Çalıştırma

### 1. Geliştirme Sunucusu
```bash
npm install
npx vite --host 0.0.0.0 --port 5173
```

### 2. Veritabanı Kurulumu

Supabase panelinde `simplified_database_setup.sql` dosyasını çalıştırın:

```sql
-- Dosya: simplified_database_setup.sql
-- Bu dosya gerekli tabloları ve temel verileri oluşturur
```

### 3. Erişim

- **Yerel**: http://localhost:5173
- **Ağ**: http://[IP-ADRESINIZ]:5173

## 📊 Sistem Kullanımı

### Temel İşlemler:

1. **Envanter Ekleme**: Ana menüden "Envanter Ekle"
2. **Listeleme**: "Envanter Listesi" sayfası
3. **Arama**: Seri no, MAC adresi veya barkod ile
4. **Durum Güncelleme**: Ekipman durumunu değiştir
5. **Personel Atama**: Ekipmanı personele ata
6. **Raporlama**: Excel export ve QR kodlar

### Varsayılan Veriler:

- **Markalar**: Apple, Dell, HP, Lenovo, ASUS, Samsung
- **Lokasyonlar**: Ana Depo, Ofis 1, Ofis 2, Bakım Atölyesi

## 🎯 Öne Çıkan Özellikler

- **Kimlik doğrulama YOK** - Hızlı erişim
- **Minimal veri** - Sadece gerekli alanlar
- **Otomatik geçmiş** - Değişiklikler otomatik kaydedilir
- **Responsive tasarım** - Mobil uyumlu
- **Türkçe arayüz** - Tam Türkçe desteği

## 🔍 Veri Yapısı

### Ana Ekipman Tablosu (ekipman_envanteri)
- `seri_no` - Seri numarası
- `mac_adresi` - MAC adresi  
- `barkod` - Barkod
- `durum` - Ekipman durumu
- `marka_id` - Marka referansı
- `model_id` - Model referansı
- `lokasyon_id` - Lokasyon referansı
- `atanan_personel_id` - Atanan personel
- `ofise_giris_tarihi` - Giriş tarihi
- `ofisten_cikis_tarihi` - Çıkış tarihi
- `aciklama` - Açıklama

## 🛠️ Gelişmiş Özellikler

- **Otomatik trigger'lar**: Değişiklik takibi
- **View'lar**: Ekipman detay görünümü
- **RLS policies**: Güvenlik (şu an herkese açık)
- **Unique constraints**: Veri bütünlüğü

## 📞 Destek

Sistem basit ve işlevsel olarak tasarlanmıştır. Tüm gerekli özellikler mevcuttur ancak gereksiz karmaşıklık yoktur.