# 🚀 Kusursuz Envanter Takip Sistemi

Tam entegre React + Supabase tabanlı profesyonel envanter yönetim sistemi.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)
![Supabase](https://img.shields.io/badge/Supabase-2.38.0-green.svg)
![Material-UI](https://img.shields.io/badge/Material--UI-5.15.0-0081cb.svg)

## ✨ Özellikler

### 🏢 Tam Kurumsal Çözüm
- **Departman Yönetimi**: Hiyerarşik departman yapısı
- **Personel Takibi**: Otomatik sicil no üretimi ve departman ataması
- **Lokasyon Yönetimi**: Çoklu lokasyon desteği
- **Envanter Takibi**: Otomatik envanter no üretimi

### 📊 Gelişmiş Özellikler
- **Otomatik Kodlama**: Sicil no, envanter no, barkod otomatik üretimi
- **MAC Adresi Yönetimi**: Normalizasyon ve doğrulama
- **Seri No Takibi**: Benzersizlik kontrolü
- **Mali Takip**: Satın alma, garanti, amortisman bilgileri

### 🔒 Güvenlik ve Bütünlük
- **Row Level Security (RLS)**: Supabase güvenlik politikaları
- **Veri Bütünlüğü**: Foreign key constraints ve CHECK constraints
- **Transaction Yönetimi**: ACID uyumlu işlemler
- **Real-time Updates**: Canlı veri senkronizasyonu

### 🎨 Modern UI/UX
- **Material Design**: Material-UI v5 ile modern tasarım
- **Responsive Design**: Mobil uyumlu arayüz
- **Dark/Light Theme**: Tema desteği
- **Çoklu Dil**: Türkçe lokalizasyon

## 🛠️ Teknoloji Stack

| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| **React** | 18.2.0 | Frontend framework |
| **Supabase** | 2.38.0 | Backend-as-a-Service |
| **Material-UI** | 5.15.0 | UI component library |
| **React Router** | 6.20.0 | SPA routing (Future flags aktif) |
| **Date-fns** | 2.30.0 | Tarih manipülasyonu |
| **PostgreSQL** | 15+ | Supabase veritabanı |

## 📋 Gereksinimler

- **Node.js**: 16.0.0 veya üzeri
- **npm**: 8.0.0 veya üzeri
- **Supabase Hesabı**: Ücretsiz hesap yeterli
- **Modern Browser**: Chrome, Firefox, Safari, Edge

## 🚀 Kurulum

### 1. Projeyi İndirin
```bash
git clone https://github.com/username/envanter-takip-sistemi.git
cd envanter-takip-sistemi
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Supabase Kurulumu

#### 3.1 Supabase Projesi Oluşturun
1. [Supabase Dashboard](https://supabase.com/dashboard)'a gidin
2. "New Project" tıklayın
3. Proje adı: `envanter-takip-sistemi`
4. Veritabanı şifresi belirleyin
5. Region seçin (Europe West için `eu-west-1`)

#### 3.2 Veritabanını Kurun
1. Supabase Dashboard > SQL Editor'e gidin
2. `complete_supabase.sql` dosyasının tüm içeriğini kopyalayın
3. SQL Editor'e yapıştırın ve "Run" tıklayın
4. Başarı mesajlarını kontrol edin

#### 3.3 Environment Variables
```bash
# .env.local dosyası oluşturun
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Uygulamayı Başlatın
```bash
npm start
```

Tarayıcınızda `http://localhost:3000` adresine gidin.

## 📁 Proje Yapısı

```
envanter-takip-sistemi/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── InventoryApp.jsx          # Ana uygulama
│   │   ├── AddInventory-complete.jsx # Ekipman ekleme
│   │   ├── SetupWizard-fixed.jsx     # Sistem kurulum
│   │   └── ...
│   ├── App-complete.jsx              # Ana App component
│   ├── supabaseClient.js            # Supabase konfigürasyonu
│   └── index.js                     # Entry point
├── complete_supabase.sql            # Veritabanı scripti
├── package-complete.json            # Dependencies
└── README-complete.md              # Bu dosya
```

## 🗄️ Veritabanı Şeması

### Ana Tablolar
- **`departmanlar`**: Departman bilgileri
- **`personel`**: Personel ve sicil bilgileri
- **`lokasyonlar`**: Fiziksel lokasyonlar
- **`markalar`**: Ekipman markaları
- **`modeller`**: Ekipman modelleri
- **`mac_adresleri`**: MAC adres havuzu
- **`seri_numaralari`**: Seri numara havuzu
- **`ekipman_envanteri`**: Ana envanter tablosu

### Özel Özellikler
- ✅ Otomatik trigger'lar (sicil_no, envanter_no)
- ✅ Normalizasyon fonksiyonları (MAC, seri no)
- ✅ CHECK constraint'ler (veri doğrulama)
- ✅ Foreign key cascade'ler
- ✅ Performance indexleri
- ✅ Row Level Security

## 📊 Kullanım

### 1. İlk Kurulum
1. **Dashboard** sekmesinde sistem genel bakışını görün
2. **Sistem Kurulum** sekmesinde temel verileri girin:
   - Departmanlar
   - Personel
   - Lokasyonlar
   - Markalar ve modeller

### 2. Ekipman Ekleme
1. **Ekipman Ekle** sekmesine gidin
2. 4 adımlı sihirbazı takip edin:
   - Temel bilgiler (barkod, marka, model)
   - Teknik detaylar (MAC, seri no)
   - Lokasyon ve atama
   - Mali bilgiler

### 3. Envanter Yönetimi
- **Envanter Listesi**: Tüm ekipmanları görüntüleyin
- **Filtreleme**: Marka, model, lokasyon, durum
- **Düzenleme**: Kayıt güncelleme
- **Raporlama**: Excel export (gelecek sürüm)

## 🔧 Konfigürasyon

### Supabase Client (`src/supabaseClient.js`)
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

### Environment Variables
```bash
# .env.local
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Opsiyonel
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=1.0.0
```

## 🧪 Test

### Manuel Test
```bash
# Geliştirme sunucusunu başlat
npm start

# Lint kontrol
npm run lint

# Build test
npm run build
```

### Veritabanı Test
Supabase SQL Editor'de:
```sql
-- Test verileri kontrol
SELECT COUNT(*) FROM departmanlar;
SELECT COUNT(*) FROM personel;
SELECT COUNT(*) FROM ekipman_envanteri;

-- Arama fonksionu test
SELECT * FROM search_ekipman('laptop');

-- Departman raporu test
SELECT * FROM get_departman_envanter_raporu(1);
```

## 🚀 Deployment

### Vercel (Önerilen)
```bash
# Vercel CLI yükle
npm i -g vercel

# Deploy
vercel --prod

# Environment variables'ı Vercel dashboard'dan ekleyin
```

### Netlify
```bash
# Build
npm run build

# build/ klasörünü Netlify'a yükleyin
# Environment variables'ı Netlify dashboard'dan ekleyin
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npx", "serve", "-s", "build", "-l", "3000"]
```

## 📈 Performans

### Optimizasyonlar
- ✅ React.memo kullanımı
- ✅ useCallback/useMemo optimizasyonları
- ✅ Lazy loading (kod bölme)
- ✅ Supabase connection pooling
- ✅ Veritabanı indexleri
- ✅ Real-time subscription optimizasyonu

### Ölçümler
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1

## 🔐 Güvenlik

### Supabase RLS Politikaları
```sql
-- Okuma yetkisi (herkese)
CREATE POLICY "Enable read access for all users" 
ON ekipman_envanteri FOR SELECT USING (true);

-- Yazma yetkisi (sadece admin)
CREATE POLICY "Enable insert for admin users" 
ON ekipman_envanteri FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

### Güvenlik Kontrol Listesi
- ✅ Row Level Security aktif
- ✅ Environment variables güvenli
- ✅ SQL injection koruması
- ✅ XSS koruması (CSP headers)
- ✅ HTTPS zorunlu
- ✅ Input validasyonu

## 🐛 Sorun Giderme

### Yaygın Hatalar

#### 1. Supabase Bağlantı Hatası
```
Error: Failed to connect to Supabase
```
**Çözüm**: Environment variables'ı kontrol edin.

#### 2. RLS Policy Hatası
```
Error: Row Level Security policy violation
```
**Çözüm**: Supabase Dashboard > Authentication > Policies kontrol edin.

#### 3. Schema Hatası
```
Error: relation "departmanlar" does not exist
```
**Çözüm**: `complete_supabase.sql` scriptini tekrar çalıştırın.

### Debug Modu
```javascript
// src/supabaseClient.js
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    debug: process.env.NODE_ENV === 'development'
  }
})
```

## 📞 Destek

### İletişim
- **Email**: info@envanter.com
- **GitHub Issues**: [GitHub Repository](https://github.com/username/envanter-takip-sistemi/issues)
- **Documentation**: [Wiki](https://github.com/username/envanter-takip-sistemi/wiki)

### Katkıda Bulunma
1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🙏 Teşekkürler

- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [Material-UI](https://mui.com/) - React UI framework
- [React Router](https://reactrouter.com/) - Client-side routing
- [Date-fns](https://date-fns.org/) - Date utility library

---

**📝 Not**: Bu sistem production-ready olarak tasarlanmıştır. Kurumsal kullanım için ek güvenlik ve backup önlemleri alınması önerilir.

🚀 **Happy Coding!**