-- Basit RLS Düzeltmesi
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Tüm tabloları listele ve RLS'yi kapat (geçici çözüm)
ALTER TABLE markalar DISABLE ROW LEVEL SECURITY;
ALTER TABLE modeller DISABLE ROW LEVEL SECURITY;
ALTER TABLE departmanlar DISABLE ROW LEVEL SECURITY;
ALTER TABLE lokasyonlar DISABLE ROW LEVEL SECURITY;
ALTER TABLE personel DISABLE ROW LEVEL SECURITY;
ALTER TABLE sistem_ayarlari DISABLE ROW LEVEL SECURITY;
ALTER TABLE mac_adresleri DISABLE ROW LEVEL SECURITY;
ALTER TABLE seri_numaralari DISABLE ROW LEVEL SECURITY;

-- Eğer bu çalışmazsa, mevcut politikaları kaldırıp yenilerini ekle:
-- DROP POLICY IF EXISTS "Markalar okuma - herkes" ON markalar;
-- DROP POLICY IF EXISTS "Markalar anonim erişim" ON markalar;

-- Yeni basit politikalar (her şeye izin ver)
-- CREATE POLICY "markalar_all_access" ON markalar FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "modeller_all_access" ON modeller FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "departmanlar_all_access" ON departmanlar FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "lokasyonlar_all_access" ON lokasyonlar FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "personel_all_access" ON personel FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "sistem_ayarlari_all_access" ON sistem_ayarlari FOR ALL USING (true) WITH CHECK (true);

-- Tablo verilerini kontrol et
SELECT 'markalar' as tablo, count(*) as kayit_sayisi FROM markalar
UNION ALL
SELECT 'modeller' as tablo, count(*) as kayit_sayisi FROM modeller
UNION ALL
SELECT 'departmanlar' as tablo, count(*) as kayit_sayisi FROM departmanlar
UNION ALL
SELECT 'lokasyonlar' as tablo, count(*) as kayit_sayisi FROM lokasyonlar
UNION ALL
SELECT 'personel' as tablo, count(*) as kayit_sayisi FROM personel
UNION ALL
SELECT 'mac_adresleri' as tablo, count(*) as kayit_sayisi FROM mac_adresleri
UNION ALL
SELECT 'seri_numaralari' as tablo, count(*) as kayit_sayisi FROM seri_numaralari; 