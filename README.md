# 🚀 Envanter Takip Sistemi - MARCASPIO

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

### ⚙️ Setup Wizard Sistemi
- **Dinamik Kategori Yönetimi:** "Diğer" seçeneği ile yeni kategoriler ekleme
- **CRUD İşlemleri:** Tüm varlıklar için tam yönetim (Create, Read, Update, Delete)
- **Departman Yönetimi:** Şirket departmanlarının yönetimi
- **Konum Yönetimi:** Ekipman konumlarının yönetimi
- **Marka/Model Yönetimi:** Ekipman marka ve modellerinin yönetimi
- **Seri No/MAC Yönetimi:** Teknik bilgilerin yönetimi
- **Personel Yönetimi:** Çalışan bilgilerinin yönetimi

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

### 2. Veritabanı Kurulumu

Proje klasöründeki `Complete SQL/01_create_complete_database.sql` dosyasını Supabase SQL Editor'da çalıştırın:

```bash
# Complete SQL klasöründeki dosyayı Supabase'e yükleyin
# veya dosya içeriğini kopyalayıp SQL Editor'da çalıştırın
```

Bu dosya şunları içerir:
- Tüm tablo yapıları
- Trigger'lar ve stored procedure'lar
- View'lar
- Örnek veriler
- RLS (Row Level Security) politikaları

### 3. Supabase Auth Ayarları

Supabase Dashboard'da:
1. **Authentication** > **Settings** > **Site URL** kısmına `http://localhost:3000` ekleyin
2. **Authentication** > **Settings** > **Redirect URLs** kısmına `http://localhost:3000` ekleyin
3. **Authentication** > **Providers** kısmından e-posta provider'ını aktif edin

### 4. Projeyi Çalıştırma

1. **Terminal/PowerShell'i açın** ve proje klasörüne gidin:
   ```bash
   cd "C:\Users\efeka\OneDrive\Masaüstü\Inventory-Tracking"
   ```

2. **Bağımlılıkları yükleyin**:
   ```bash
   npm install
   ```

3. **Geliştirme sunucusunu başlatın**:
   ```bash
   npm run dev
   ```

4. **Tarayıcıda açın**: http://localhost:3000 (veya Vite'ın gösterdiği port)

## 🎯 Kullanım Kılavuzu

### 🔐 Giriş ve Kayıt
1. İlk kullanımda "Kayıt Ol" butonuna tıklayın
2. E-posta ve şifre ile hesabınızı oluşturun
3. E-posta doğrulama linkine tıklayın
4. Giriş yapın ve sistemi kullanmaya başlayın

### ⚙️ İlk Kurulum (Setup Wizard)
1. İlk girişte Setup Wizard otomatik açılacak
2. Sırasıyla şu adımları tamamlayın:
   - **Departmanlar:** Şirket departmanlarını ekleyin
   - **Konumlar:** Ekipman konumlarını tanımlayın
   - **Markalar:** Ekipman markalarını ekleyin
   - **Modeller:** Her marka için modelleri tanımlayın
   - **Seri Numaraları:** Mevcut seri numaralarını girin
   - **MAC Adresleri:** Mevcut MAC adreslerini girin
   - **Personel:** Çalışan bilgilerini ekleyin
3. "Diğer" seçeneği ile yeni kategoriler ekleyebilirsiniz
4. Her adımda CRUD işlemleri yapabilirsiniz

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

### Setup Wizard Sorunları
- Tüm adımları sırasıyla tamamladığınızdan emin olun
- "Diğer" kategorisi eklerken form alanını doldurun
- CRUD işlemlerinde gerekli alanları boş bırakmayın

## 📁 Proje Yapısı

```
Inventory-Tracking/
├── Complete SQL/           # Veritabanı dosyaları
│   ├── 01_create_complete_database.sql  # Ana veritabanı scripti
│   └── README.md           # SQL dosyaları dokümantasyonu
├── src/
│   ├── components/         # Yeniden kullanılabilir bileşenler
│   │   ├── Navbar.jsx      # Navigasyon çubuğu
│   │   ├── AutocompleteField.jsx  # Otomatik tamamlama alanı
│   │   ├── EquipmentDelete.jsx    # Ekipman silme bileşeni
│   │   └── ProtectedRoute.jsx     # Auth korumalı route
│   ├── contexts/           # React Context'ler
│   │   └── AuthContext.jsx # Authentication context
│   ├── pages/              # Sayfa bileşenleri
│   │   ├── Dashboard.jsx   # Ana sayfa (istatistikler)
│   │   ├── InventoryList.jsx  # Envanter listesi (export/QR)
│   │   ├── AddInventory.jsx   # Ekipman ekleme/düzenleme
│   │   ├── Availability.jsx   # Müsaitlik durumu
│   │   ├── SetupWizard.jsx    # İlk kurulum sihirbazı
│   │   ├── Login.jsx       # Giriş sayfası
│   │   └── Register.jsx    # Kayıt sayfası
│   ├── utils/              # Yardımcı fonksiyonlar
│   │   ├── exportUtils.js  # Excel export fonksiyonları
│   │   ├── qrCodeUtils.js  # QR kod fonksiyonları
│   │   ├── notificationUtils.js # Bildirim fonksiyonları
│   │   └── autoIdUtils.js  # Otomatik ID fonksiyonları
│   ├── config/             # Konfigürasyon dosyaları
│   │   └── supabase.js     # Supabase bağlantısı
│   ├── App.jsx             # Ana uygulama (auth wrapper)
│   ├── main.jsx            # Giriş noktası
│   └── index.css           # Global stiller
├── .git/                   # Git repository
├── node_modules/           # NPM bağımlılıkları
├── index.html              # Ana HTML dosyası
├── package.json            # Proje konfigürasyonu
├── package-lock.json       # Bağımlılık kilidi
├── vite.config.js          # Vite konfigürasyonu
├── vercel.json             # Vercel deployment konfigürasyonu
├── .gitattributes          # Git özellikleri
└── README.md               # Bu dosya
```

## 🔮 Gelecek Geliştirmeler

- **Mobil Uygulama:** React Native ile mobil versiyon
- **Barkod Okuyucu:** Kamera ile barkod/QR kod okuma
- **AI Analizi:** Ekipman kullanım paternlerinin AI analizi
- **IoT Entegrasyonu:** Sensörlerle otomatik takip
- **Multi-Tenant:** Çoklu şirket desteği
- **Gelişmiş Raporlar:** PDF export ve özel raporlar
- **Bildirim Sistemi:** Gerçek zamanlı push bildirimleri

## 🆘 Destek

Herhangi bir sorunla karşılaştığınızda:
1. Bu README'yi tekrar okuyun
2. Tarayıcı konsol hatalarını kontrol edin
3. Network sekmesinde API isteklerini inceleyin
4. Supabase dashboard'unda verileri kontrol edin
5. Auth durumunu kontrol edin
6. Setup Wizard'ı tamamladığınızdan emin olun

## 📝 Demo Hesap Bilgileri

Test için kullanabileceğiniz demo hesap:
- **E-posta:** demo@envanter.com
- **Şifre:** demo123456

## 🧹 Proje Temizliği

Proje son temizlik işlemleri tamamlanmıştır:
- ✅ Gereksiz dosyalar silindi (~50MB+ temizlik)
- ✅ Debug dosyaları kaldırıldı
- ✅ Git klasörü temizlendi
- ✅ Boş klasörler kaldırıldı
- ✅ Sadece gerekli dosyalar korundu

## 📄 Lisans

Bu proje MARCASPIO şirketi için geliştirilmiştir. 