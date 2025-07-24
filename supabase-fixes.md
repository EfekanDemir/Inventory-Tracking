# Supabase React Uygulaması Hata Çözümleri

## 🚨 Tespit Edilen Problemler

### 1. Supabase Schema Hatası
**Hata**: `Could not find the 'departmanlar' column of 'lokasyonlar' in the schema cache`

**Sebep**: Lokasyonlar tablosunda 'departmanlar' kolonu bulunamıyor veya yanlış isimlendirilmiş.

**Çözüm**:
```sql
-- 1. Önce mevcut tablo yapısını kontrol edin
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lokasyonlar';

-- 2. Eksik kolon varsa ekleyin
ALTER TABLE lokasyonlar 
ADD COLUMN IF NOT EXISTS departman_id INTEGER REFERENCES departmanlar(id);

-- 3. Veya kolon adı yanlışsa düzeltin
ALTER TABLE lokasyonlar 
RENAME COLUMN departmanlar TO departman_id;
```

### 2. MAC Adresi Check Constraint Hatası
**Hata**: `mac_adresleri_kullanim_durumu_check constraint violation`

**Sebep**: MAC adresi tablosunda kullanım durumu için tanımlı check constraint ihlal ediliyor.

**Çözüm**:
```sql
-- 1. Mevcut constraint'i kontrol edin
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'mac_adresleri'::regclass 
AND contype = 'c';

-- 2. Constraint'i geçici olarak kaldırın
ALTER TABLE mac_adresleri 
DROP CONSTRAINT IF EXISTS mac_adresleri_kullanim_durumu_check;

-- 3. Doğru constraint'i ekleyin (örnek değerler)
ALTER TABLE mac_adresleri 
ADD CONSTRAINT mac_adresleri_kullanim_durumu_check 
CHECK (kullanim_durumu IN ('AKTIF', 'PASIF', 'BEKLEMEDE', 'KULLANIMDA', 'BOZUK'));
```

### 3. React Router Future Flags
**Çözüm**: Router konfigürasyonunu güncelleyin

```jsx
// App.jsx veya Router konfigürasyonu
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      {/* Uygulama içeriği */}
    </BrowserRouter>
  );
}
```

## 🔧 Frontend Kod Düzeltmeleri

### SetupWizard.jsx Güncellemeleri

```jsx
// 1. Güncelleme işlemi için doğru kolon adını kullanın
const saveEdit = async (tableName, item) => {
  try {
    console.log('Güncelleme işlemi başlatılıyor:', tableName, item);
    
    // Departman ID alanını düzeltin
    const updateData = { ...item };
    if (tableName === 'lokasyonlar' && updateData.departmanlar) {
      updateData.departman_id = updateData.departmanlar;
      delete updateData.departmanlar;
    }
    
    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', item.id)
      .select('*');
      
    if (error) {
      console.error('Supabase güncelleme hatası:', error);
      throw error;
    }
    
    console.log('Güncelleme başarılı:', data);
    return data;
  } catch (error) {
    console.error(`${tableName} güncelleme hatası:`, error);
    throw error;
  }
};
```

### AddInventory.jsx Güncellemeleri

```jsx
// 2. MAC Adresi ekleme işlemini düzeltin
const handleSubmit = async (event) => {
  event.preventDefault();
  
  try {
    // Önce MAC adresi ekleyin (doğru kullanım durumu ile)
    const macData = {
      mac_adresi: formData.mac_adresi,
      kullanim_durumu: 'KULLANIMDA' // Veya constraint'e uygun değer
    };
    
    const { data: macResult, error: macError } = await supabase
      .from('mac_adresleri')
      .insert(macData)
      .select('*');
    
    if (macError) {
      console.error('MAC adresi ekleme hatası:', macError);
      throw macError;
    }
    
    // Sonra seri numarası ekleyin
    const serialData = {
      seri_no: formData.seri_no,
      kullanim_durumu: 'KULLANIMDA'
    };
    
    const { data: serialResult, error: serialError } = await supabase
      .from('seri_numaralari')
      .insert(serialData)
      .select('*');
    
    if (serialError) {
      console.error('Seri numarası ekleme hatası:', serialError);
      throw serialError;
    }
    
    // Son olarak envanter kaydını ekleyin
    const inventoryData = {
      mac_adresi_id: macResult[0].id,
      seri_no_id: serialResult[0].id,
      barkod: formData.barkod,
      marka_id: formData.marka_id,
      model_id: formData.model_id,
      lokasyon_id: formData.lokasyon_id,
      atanan_personel_id: formData.atanan_personel_id,
      ofise_giris_tarihi: formData.ofise_giris_tarihi,
      ofisten_cikis_tarihi: formData.ofisten_cikis_tarihi,
      aciklama: formData.aciklama
    };
    
    const { data: inventoryResult, error: inventoryError } = await supabase
      .from('ekipman_envanteri')
      .insert(inventoryData)
      .select('*');
    
    if (inventoryError) {
      console.error('Envanter ekleme hatası:', inventoryError);
      throw inventoryError;
    }
    
    console.log('Envanter başarıyla eklendi:', inventoryResult);
    
    // Formu sıfırla
    setFormData({});
    
  } catch (error) {
    console.error('Form gönderme hatası:', error);
    // Kullanıcıya hata mesajı göster
    alert(`Hata: ${error.message}`);
  }
};
```

## 🗄️ Veritabanı Düzeltmeleri

### 1. Lokasyonlar Tablosu Düzeltme
```sql
-- Tablo yapısını kontrol edin
\d lokasyonlar

-- Eksik alanları ekleyin
ALTER TABLE lokasyonlar 
ADD COLUMN IF NOT EXISTS departman_id INTEGER REFERENCES departmanlar(id);

-- Index ekleyin (performans için)
CREATE INDEX IF NOT EXISTS idx_lokasyonlar_departman 
ON lokasyonlar(departman_id);
```

### 2. MAC Adresleri Tablosu Düzeltme
```sql
-- Mevcut constraint'i kaldırın
ALTER TABLE mac_adresleri 
DROP CONSTRAINT IF EXISTS mac_adresleri_kullanim_durumu_check;

-- Yeni constraint ekleyin
ALTER TABLE mac_adresleri 
ADD CONSTRAINT mac_adresleri_kullanim_durumu_check 
CHECK (kullanim_durumu IN (
  'AKTIF', 
  'PASIF', 
  'KULLANIMDA', 
  'BEKLEMEDE', 
  'BOZUK', 
  'HURDA'
));

-- Mevcut kayıtları güncelleyin (gerekirse)
UPDATE mac_adresleri 
SET kullanim_durumu = 'AKTIF' 
WHERE kullanim_durumu IS NULL;
```

### 3. Seri Numaraları Tablosu Düzeltme
```sql
-- Benzer constraint ekleyin
ALTER TABLE seri_numaralari 
DROP CONSTRAINT IF EXISTS seri_numaralari_kullanim_durumu_check;

ALTER TABLE seri_numaralari 
ADD CONSTRAINT seri_numaralari_kullanim_durumu_check 
CHECK (kullanim_durumu IN (
  'AKTIF', 
  'PASIF', 
  'KULLANIMDA', 
  'BEKLEMEDE', 
  'BOZUK', 
  'HURDA'
));
```

## 🔍 Debug ve Test

### 1. Supabase Schema Kontrolü
```javascript
// Tablo yapısını kontrol etmek için
const checkSchema = async () => {
  const { data, error } = await supabase
    .from('lokasyonlar')
    .select('*')
    .limit(1);
    
  console.log('Lokasyonlar schema:', data, error);
};
```

### 2. Constraint Kontrolü
```javascript
// MAC adresi ekleme testi
const testMacAddress = async () => {
  const { data, error } = await supabase
    .from('mac_adresleri')
    .insert({
      mac_adresi: '00:11:22:33:44:55',
      kullanim_durumu: 'AKTIF'
    })
    .select('*');
    
  console.log('MAC test:', data, error);
};
```

## 📋 Adım Adım Çözüm

1. **Veritabanı düzeltmeleri yapın** (yukarıdaki SQL komutları)
2. **Frontend kodlarını güncelleyin** (doğru kolon adları)
3. **React Router future flags ekleyin**
4. **Constraint değerlerini kontrol edin**
5. **Test kayıtları ekleyin**

## 🚀 Önleyici Tedbirler

1. **Type Safety**: TypeScript kullanın
2. **Validation**: Zod veya Yup ile form validasyonu
3. **Error Handling**: Merkezi hata yönetimi
4. **Logging**: Detaylı log sistemi

```javascript
// Örnek error handling
const handleSupabaseError = (error) => {
  switch (error.code) {
    case 'PGRST204':
      return 'Kolon bulunamadı. Veritabanı şeması kontrol edilmeli.';
    case '23514':
      return 'Veri doğrulama hatası. Lütfen girdiğiniz değerleri kontrol edin.';
    default:
      return `Beklenmeyen hata: ${error.message}`;
  }
};
```

Bu düzeltmeleri uyguladıktan sonra sistem düzgün çalışacaktır.