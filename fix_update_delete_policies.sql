-- Düzenleme ve Silme İşlemleri için RLS Politikaları
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Markalar için UPDATE ve DELETE politikaları
CREATE POLICY "Markalar güncelleme - anonim erişim" ON markalar 
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Markalar silme - anonim erişim" ON markalar 
FOR DELETE USING (true);

-- Modeller için UPDATE ve DELETE politikaları
CREATE POLICY "Modeller güncelleme - anonim erişim" ON modeller 
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Modeller silme - anonim erişim" ON modeller 
FOR DELETE USING (true);

-- Departmanlar için UPDATE ve DELETE politikaları
CREATE POLICY "Departmanlar güncelleme - anonim erişim" ON departmanlar 
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Departmanlar silme - anonim erişim" ON departmanlar 
FOR DELETE USING (true);

-- Lokasyonlar için UPDATE ve DELETE politikaları
CREATE POLICY "Lokasyonlar güncelleme - anonim erişim" ON lokasyonlar 
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Lokasyonlar silme - anonim erişim" ON lokasyonlar 
FOR DELETE USING (true);

-- Personel için UPDATE ve DELETE politikaları
CREATE POLICY "Personel güncelleme - anonim erişim" ON personel 
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Personel silme - anonim erişim" ON personel 
FOR DELETE USING (true);

-- Sistem ayarları için UPDATE ve DELETE politikaları
CREATE POLICY "Sistem ayarları güncelleme - anonim erişim" ON sistem_ayarlari 
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Sistem ayarları silme - anonim erişim" ON sistem_ayarlari 
FOR DELETE USING (true);

-- Mevcut politikaları kontrol etmek için:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename IN ('markalar', 'modeller', 'departmanlar', 'lokasyonlar', 'personel', 'sistem_ayarlari')
-- ORDER BY tablename, cmd; 