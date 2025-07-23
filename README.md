# 🚀 Envanter Takip Sistemi - Gelişmiş Versiyon

Bu proje, şirket ekipmanlarının etkin bir şekilde takip edilmesi için geliştirilmiş **tam kapsamlı** bir web uygulamasıdır. Supabase ile backend, React ve Material-UI ile frontend teknolojileri kullanılarak geliştirilmiştir.

## ⭐ Gelişmiş Özellikler

### 🔐 Kullanıcı Yetkilendirme Sistemi
- **Giriş/Çıkış:** Supabase Auth ile güvenli giriş sistemi
- **Kayıt Olma:** E-posta doğrulamalı yeni kullanıcı kaydı
- **Şifre Sıfırlama:** E-posta ile şifre sıfırlama
- **Oturum Yönetimi:** Otomatik oturum takibi ve yönlendirme
- **Kullanıcı Profili:** Kişisel bilgi yönetimi

### 📊 Excel Export Özellikleri
- **Tam Liste Export:** Tüm envanter verilerini Excel'e aktarma
- **Filtrelenmiş Export:** Arama sonuçlarını Excel'e aktarma
- **Seçili Kayıtlar:** Sadece seçilen ekipmanları export etme
- **Detaylı Raporlar:** Çoklu sayfa ile kapsamlı Excel raporları
- **Otomatik Formatlamalama:** Sütun genişlikleri ve tarih formatları

### 📱 QR Kod Sistemi
- **Tekli QR Kod:** Her ekipman için benzersiz QR kod
- **Toplu QR Kod:** Birden fazla ekipman için QR kod üretimi
- **Yazdırılabilir Format:** A4 sayfa formatında yazdırma desteği
- **QR Kod İçeriği:** Ekipman bilgileri ve doğrudan erişim linki
- **Mobil Uyumlu:** QR kod okuyucu ile hızlı erişim

### 🔔 Bildirim Sistemi
- **E-posta Bildirimleri:** Envanter değişikliklerinde otomatik e-posta
- **SMS Bildirimleri:** Kritik işlemler için SMS desteği (yapılandırma gerekli)
- **Browser Bildirimleri:** Gerçek zamanlı tarayıcı bildirimleri
- **Toast Bildirimleri:** Kullanıcı dostu popup mesajları
- **Bildirim Geçmişi:** Gönderilen tüm bildirimlerin kaydı

### 📈 Gelişmiş Raporlama ve Analizler
- **Interaktif Grafikler:** Pie, Bar, Line chart'lar ile görselleştirme
- **Konum Dağılım Analizi:** Ekipmanların konum bazında dağılımı
- **Marka İstatistikleri:** En çok kullanılan markaların analizi
- **Agent Performansı:** En aktif agent'ların istatistikleri
- **Zaman Bazlı Analiz:** Aylık, haftalık, günlük trendler
- **Filtrelenebilir Raporlar:** Tarih aralığı ve kategori filtreleri

## 🚀 Temel Özellikler

### ✨ Envanter Yönetimi
- **Akıllı Form Alanları:** Otomatik tamamlama ile hızlı veri girişi
- **Benzersizlik Kontrolü:** MAC adresi ve seri numarası tekrar önleme
- **Konum Takibi:** BOŞTA, AGENT, EĞİTMEN, AGENT TR durumları
- **Tarih Yönetimi:** Ofisten çıkış tarihi takibi
- **Açıklama Sistemi:** Her ekipman için detaylı notlar

### 🔍 Arama ve Filtreleme
- **Gerçek Zamanlı Arama:** Tüm alanlarda anlık arama
- **Gelişmiş Filtreler:** Konum, agent, tarih bazlı filtreleme
- **Sıralama:** Tüm sütunlarda çift yönlü sıralama
- **Sayfalama:** Büyük veri setleri için sayfa sistemi

### 📋 Geçmiş Takibi
- **Tam Geçmiş Kaydı:** Her değişikliğin detaylı kaydı
- **Timeline Görünümü:** Kronolojik işlem geçmişi
- **Değişiklik Analizi:** Eski/yeni değer karşılaştırması
- **Kullanıcı Takibi:** Kim, ne zaman, hangi değişikliği yaptı

## 🛠️ Teknolojiler

- **Frontend:** React 18, Material-UI (MUI), React Router
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Styling:** Material-UI Components, Emotion
- **Charts:** Recharts
- **Export:** XLSX (SheetJS)
- **QR Codes:** qrcode.js
- **Notifications:** react-hot-toast
- **Date Handling:** date-fns
- **Build Tool:** Vite

## 📋 Gereksinimler

Bu projeyi çalıştırmak için bilgisayarınızda şunların kurulu olması gerekir:

- **Node.js** (v16 veya üzeri) - [İndir](https://nodejs.org/)
- **npm** (Node.js ile birlikte gelir)
- **Supabase Hesabı** - [Kayıt Ol](https://supabase.com/)

## ⚙️ Kurulum

### 1. Node.js Kurulumu
Eğer Node.js kurulu değilse:
1. [Node.js resmi web sitesine](https://nodejs.org/) gidin
2. LTS versiyonunu indirin ve kurun
3. Kurulum sırasında "Add to PATH" seçeneğinin işaretli olduğundan emin olun

### 2. Supabase Veritabanı Kurulumu

Supabase projenizde şu SQL komutlarını çalıştırın:

```sql
-- Geçmiş takibi için tablo oluşturma
CREATE TABLE envanter_hareketleri (
    id BIGSERIAL PRIMARY KEY,
    ekipman_id BIGINT REFERENCES ekipman_envanteri(id) ON DELETE CASCADE,
    islem_tipi TEXT NOT NULL, -- Örn: 'Yeni Kayıt', 'Güncelleme'
    eski_degerler JSONB, -- Değişiklik öncesi veriler
    yeni_degerler JSONB, -- Değişiklik sonrası veriler
    degisiklik_yapan TEXT, -- İşlemi yapan kişi
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Bildirimler tablosu
CREATE TABLE bildirimler (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL, -- 'email' veya 'sms'
    recipient TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL, -- 'sent', 'failed'
    equipment_id BIGINT REFERENCES ekipman_envanteri(id),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Kullanıcı rolleri tablosu (opsiyonel)
CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'user'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Row Level Security politikalarını aktif et
ALTER TABLE envanter_hareketleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE bildirimler ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
```

### 3. Supabase Auth Ayarları

Supabase Dashboard'da:
1. **Authentication** > **Settings** > **Site URL** kısmına `http://localhost:3000` ekleyin
2. **Authentication** > **Settings** > **Redirect URLs** kısmına `http://localhost:3000` ekleyin
3. **Authentication** > **Providers** kısmından e-posta provider'ını aktif edin

### 4. Projeyi Çalıştırma

1. **Terminal/PowerShell'i açın** ve proje klasörüne gidin:
   ```bash
   cd "C:\Users\YASKA GROUP\Desktop\Inventory Tracking"
   ```

2. **Bağımlılıkları yükleyin**:
   ```bash
   npm install
   ```

3. **Geliştirme sunucusunu başlatın**:
   ```bash
   npm run dev
   ```

4. **Tarayıcıda açın**: http://localhost:3000

## 🎯 Kullanım Kılavuzu

### 🔐 Giriş ve Kayıt
1. İlk kullanımda "Kayıt Ol" butonuna tıklayın
2. E-posta ve şifre ile hesabınızı oluşturun
3. E-posta doğrulama linkine tıklayın
4. Giriş yapın ve sistemi kullanmaya başlayın

### 📊 Dashboard
- Gerçek zamanlı istatistikleri görüntüleyin
- Sistem durumunu takip edin
- Hızlı navigasyon için kullanın

### 📋 Envanter Yönetimi
1. **Yeni Ekipman Ekleme:**
   - "Yeni Ekipman Ekle" butonuna tıklayın
   - Otomatik tamamlama önerilerini kullanın
   - Zorunlu alanları doldurun
   - "Kaydet" butonuna tıklayın

2. **Ekipman Düzenleme:**
   - Listeden "Düzenle" butonuna tıklayın
   - Değişiklikleri yapın
   - "Güncelle" butonuna tıklayın

3. **Toplu İşlemler:**
   - Checkbox'lar ile birden fazla kayıt seçin
   - "Excel İndir" veya "QR Kod" butonlarını kullanın

### 📈 Raporlar ve Analizler
1. **Raporlar** menüsüne gidin
2. Tarih aralığı ve filtreler seçin
3. İnteraktif grafiklerle verileri analiz edin
4. "Excel İndir" ile raporları kaydedin

### 📱 QR Kod Kullanımı
1. Listeden ekipman(lar) seçin
2. "QR Kod" butonuna tıklayın
3. Açılan sayfadan yazdırabilirsiniz
4. QR kodları okutarak hızlı erişim sağlayın

### 🔔 Bildirimler
- Tarayıcı bildirimleri için izin verin
- E-posta bildirimleri otomatik gönderilir
- Bildirim geçmişini kontrol edin

## 🔧 Konfigürasyon

### Supabase Ayarları
`src/config/supabase.js` dosyasında:
```javascript
const supabaseUrl = 'https://bhyjzqrupcvqhugkbgtd.supabase.co'
const supabaseKey = 'YOUR_ANON_KEY'
```

### E-posta Bildirimleri (Opsiyonel)
Supabase Edge Functions ile e-posta gönderimi:
1. SMTP sağlayıcı ayarları
2. E-posta şablonları
3. Bildirim kuralları

### SMS Bildirimleri (Opsiyonel)
SMS sağlayıcı entegrasyonu:
1. Twilio/Nexmo API anahtarları
2. SMS şablonları
3. Bildirim kuralları

## 🚀 Production Build

Production için build almak için:
```bash
npm run build
```

Build dosyaları `dist` klasöründe oluşacaktır.

## 🔍 Sorun Giderme

### Node.js Kurulu Değilse
```
npm : The term 'npm' is not recognized...
```
Node.js'i kurun ve sistem PATH'ine eklendiğinden emin olun.

### Supabase Bağlantı Hatası
- API anahtarınızın doğru olduğundan emin olun
- Supabase projenizin aktif olduğunu kontrol edin
- RLS (Row Level Security) politikalarınızı kontrol edin

### Auth Sorunları
- Redirect URL'lerinin doğru ayarlandığını kontrol edin
- E-posta provider'ının aktif olduğundan emin olun
- Kullanıcı e-posta doğrulamasını yaptığından emin olun

### QR Kod Sorunları
- Popup blocker'ın kapalı olduğundan emin olun
- Yazdırma izinlerini kontrol edin

## 📁 Proje Yapısı

```
src/
├── components/          # Yeniden kullanılabilir bileşenler
│   ├── Navbar.jsx      # Navigasyon çubuğu (auth desteği)
│   ├── AutocompleteField.jsx  # Otomatik tamamlama alanı
│   └── ProtectedRoute.jsx     # Auth korumalı route
├── contexts/           # React Context'ler
│   └── AuthContext.jsx # Authentication context
├── pages/              # Sayfa bileşenleri
│   ├── Dashboard.jsx   # Ana sayfa (istatistikler)
│   ├── InventoryList.jsx  # Envanter listesi (export/QR)
│   ├── AddInventory.jsx   # Ekipman ekleme/düzenleme
│   ├── InventoryHistory.jsx  # Geçmiş görüntüleme
│   ├── Reports.jsx     # Raporlar ve analizler
│   ├── Login.jsx       # Giriş sayfası
│   └── Register.jsx    # Kayıt sayfası
├── utils/              # Yardımcı fonksiyonlar
│   ├── exportUtils.js  # Excel export fonksiyonları
│   ├── qrCodeUtils.js  # QR kod fonksiyonları
│   └── notificationUtils.js # Bildirim fonksiyonları
├── config/             # Konfigürasyon dosyaları
│   └── supabase.js     # Supabase bağlantısı
├── App.jsx             # Ana uygulama (auth wrapper)
├── main.jsx            # Giriş noktası
└── index.css           # Global stiller
```

## 🔮 Gelecek Geliştirmeler

- **Mobil Uygulama:** React Native ile mobil versiyon
- **Barkod Okuyucu:** Kamera ile barkod/QR kod okuma
- **AI Analizi:** Ekipman kullanım paternlerinin AI analizi
- **IoT Entegrasyonu:** Sensörlerle otomatik takip
- **Multi-Tenant:** Çoklu şirket desteği
- **Gelişmiş Raporlar:** PDF export ve özel raporlar

## 🆘 Destek

Herhangi bir sorunla karşılaştığınızda:
1. Bu README'yi tekrar okuyun
2. Tarayıcı konsol hatalarını kontrol edin
3. Network sekmesinde API isteklerini inceleyin
4. Supabase dashboard'unda verileri kontrol edin
5. Auth durumunu kontrol edin

## 📝 Demo Hesap Bilgileri

Test için kullanabileceğiniz demo hesap:
- **E-posta:** demo@envanter.com
- **Şifre:** demo123456

## 📄 Lisans

Bu proje şirket içi kullanım için geliştirilmiştir. 