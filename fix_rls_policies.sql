-- ==============================================
-- RLS POLİTİKALARINI DÜZELTME SQL
-- ==============================================

-- Önce mevcut politikaları temizle
DROP POLICY IF EXISTS "Markalar anonim erişim" ON markalar;
DROP POLICY IF EXISTS "Markalar okuma - herkes" ON markalar;
DROP POLICY IF EXISTS "Modeller anonim erişim" ON modeller;
DROP POLICY IF EXISTS "Modeller okuma - herkes" ON modeller;
DROP POLICY IF EXISTS "Departmanlar anonim erişim" ON departmanlar;
DROP POLICY IF EXISTS "Departmanlar okuma - herkes" ON departmanlar;
DROP POLICY IF EXISTS "Lokasyonlar anonim erişim" ON lokasyonlar;
DROP POLICY IF EXISTS "Lokasyonlar okuma - herkes" ON lokasyonlar;
DROP POLICY IF EXISTS "Sistem ayarları anonim erişim" ON sistem_ayarlari;
DROP POLICY IF EXISTS "Personel anonim erişim" ON personel;
DROP POLICY IF EXISTS "Personel okuma - herkes" ON personel;

-- Yeni politikaları ekle
-- MARKALAR
CREATE POLICY "Markalar anonim erişim" ON markalar
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Markalar okuma - herkes" ON markalar
  FOR SELECT USING (true);

-- MODELLER  
CREATE POLICY "Modeller anonim erişim" ON modeller
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Modeller okuma - herkes" ON modeller
  FOR SELECT USING (true);

-- DEPARTMANLAR
CREATE POLICY "Departmanlar anonim erişim" ON departmanlar
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Departmanlar okuma - herkes" ON departmanlar
  FOR SELECT USING (true);

-- LOKASYONLAR
CREATE POLICY "Lokasyonlar anonim erişim" ON lokasyonlar
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Lokasyonlar okuma - herkes" ON lokasyonlar
  FOR SELECT USING (true);

-- PERSONEL
CREATE POLICY "Personel anonim erişim" ON personel
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Personel okuma - herkes" ON personel
  FOR SELECT USING (true);

-- SİSTEM AYARLARI
CREATE POLICY "Sistem ayarları anonim erişim" ON sistem_ayarlari
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Sistem ayarları okuma - herkes" ON sistem_ayarlari
  FOR SELECT USING (true);

-- ==============================================
-- KONTROL SORGULARI
-- ==============================================

-- Politikaların başarıyla eklendiğini kontrol et
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('markalar', 'modeller', 'departmanlar', 'lokasyonlar', 'personel', 'sistem_ayarlari')
ORDER BY tablename, policyname;

-- ==============================================
-- TEST SORGULARI (Opsiyonel)
-- ==============================================

-- Test için bir marka eklemeyi dene
-- INSERT INTO markalar (marka_adi, aciklama) VALUES ('Test Marka', 'Test açıklama');

-- Test için bir departman eklemeyi dene  
-- INSERT INTO departmanlar (departman_adi, aciklama) VALUES ('Test Departman', 'Test açıklama');

-- Test için bir personel eklemeyi dene
-- INSERT INTO personel (ad, soyad, email, departman_id) VALUES ('Test', 'Personel', 'test@example.com', 1);

-- ==============================================
-- SONUÇ
-- ==============================================

SELECT 
  'RLS politikaları başarıyla güncellendi!' as durum,
  now() as guncelleme_tarihi; 