-- ==============================================
-- Envanter Takip Sistemi - Normalleştirilmiş Supabase Kurulum SQL
-- ==============================================

-- ==============================================
-- 1. TEMEL LOOKUP TABLOLARI (Master Data)
-- ==============================================

-- Markalar tablosu
CREATE TABLE IF NOT EXISTS markalar (
    id BIGSERIAL PRIMARY KEY,
    marka_adi TEXT NOT NULL UNIQUE,
    aciklama TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Modeller tablosu
CREATE TABLE IF NOT EXISTS modeller (
    id BIGSERIAL PRIMARY KEY,
    marka_id BIGINT NOT NULL REFERENCES markalar(id) ON DELETE CASCADE,
    model_adi TEXT NOT NULL,
    kategori TEXT DEFAULT 'Bilgisayar' CHECK (kategori IN ('Bilgisayar', 'Laptop', 'Tablet', 'Telefon', 'Aksesuar', 'Diğer')),
    teknik_ozellikler JSONB, -- Processor, RAM, HDD gibi özellikler
    aciklama TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(marka_id, model_adi)
);

-- Seri numaraları tablosu
CREATE TABLE IF NOT EXISTS seri_numaralari (
    id BIGSERIAL PRIMARY KEY,
    model_id BIGINT NOT NULL REFERENCES modeller(id) ON DELETE CASCADE,
    seri_no TEXT NOT NULL UNIQUE,
    aciklama TEXT,
    kullanim_durumu TEXT DEFAULT 'MUSAIT' CHECK (kullanim_durumu IN ('MUSAIT', 'KULLANIMDA', 'ARIZALI')),
    atanan_ekipman_id BIGINT REFERENCES ekipman_envanteri(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- MAC adresleri tablosu
CREATE TABLE IF NOT EXISTS mac_adresleri (
    id BIGSERIAL PRIMARY KEY,
    model_id BIGINT REFERENCES modeller(id) ON DELETE CASCADE,
    mac_adresi TEXT NOT NULL UNIQUE,
    aciklama TEXT,
    kullanim_durumu TEXT DEFAULT 'MUSAIT' CHECK (kullanim_durumu IN ('MUSAIT', 'KULLANIMDA', 'ARIZALI')),
    atanan_ekipman_id BIGINT REFERENCES ekipman_envanteri(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Departmanlar tablosu
CREATE TABLE IF NOT EXISTS departmanlar (
    id BIGSERIAL PRIMARY KEY,
    departman_adi TEXT NOT NULL UNIQUE,
    aciklama TEXT,
    manager_email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Lokasyonlar tablosu
CREATE TABLE IF NOT EXISTS lokasyonlar (
    id BIGSERIAL PRIMARY KEY,
    lokasyon_kodu TEXT NOT NULL UNIQUE,
    lokasyon_adi TEXT NOT NULL,
    lokasyon_tipi TEXT NOT NULL CHECK (lokasyon_tipi IN ('DEPO', 'KULLANICI', 'EGITIM', 'BAKIM', 'HURDA')),
    departman_id BIGINT REFERENCES departmanlar(id),
    adres TEXT,
    sorumlu_kisi TEXT,
    aciklama TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Personel tablosu (Geliştirilmiş kullanıcı sistemi)
CREATE TABLE IF NOT EXISTS personel (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sicil_no TEXT UNIQUE,
    ad TEXT NOT NULL,
    soyad TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefon TEXT,
    departman_id BIGINT REFERENCES departmanlar(id),
    unvan TEXT,
    baslangic_tarihi DATE,
    cikis_tarihi DATE,
    rol TEXT NOT NULL DEFAULT 'user' CHECK (rol IN ('admin', 'manager', 'user', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================
-- 2. ANA ENVANTER TABLOSU (Normalleştirilmiş)
-- ==============================================

CREATE TABLE IF NOT EXISTS ekipman_envanteri (
    id BIGSERIAL PRIMARY KEY,
    
    -- Teknik Bilgiler
    mac_adresi TEXT UNIQUE,
    seri_no TEXT UNIQUE,
    barkod TEXT UNIQUE, -- QR/Barkod için
    
    -- Marka/Model Referansları
    marka_id BIGINT REFERENCES markalar(id),
    model_id BIGINT REFERENCES modeller(id),
    
    -- Lokasyon ve Atama Bilgileri
    lokasyon_id BIGINT NOT NULL REFERENCES lokasyonlar(id),
    atanan_personel_id BIGINT REFERENCES personel(id),
    
    -- Tarihler
    satin_alma_tarihi DATE,
    garanti_bitis_tarihi DATE,
    ofise_giris_tarihi DATE, -- Ekipmanın ofise giriş tarihi
    ofisten_cikis_tarihi DATE,
    geri_donus_tarihi DATE,
    
    -- Mali Bilgiler
    satin_alma_fiyati DECIMAL(10,2),
    amortisman_suresi INTEGER, -- Ay cinsinden
    defter_degeri DECIMAL(10,2),
    
    -- Durum Bilgileri
    fiziksel_durum TEXT DEFAULT 'İyi' CHECK (fiziksel_durum IN ('Çok İyi', 'İyi', 'Orta', 'Kötü', 'Arızalı')),
    calismma_durumu TEXT DEFAULT 'Çalışıyor' CHECK (calismma_durumu IN ('Çalışıyor', 'Arızalı', 'Bakımda', 'Hurdaya Ayrıldı')),
    
    -- Ek Bilgiler
    aciklama TEXT,
    ozel_notlar JSONB, -- Ek özelleştirilebilir alanlar
    
    -- Sistem Alanları
    created_by BIGINT REFERENCES personel(id),
    updated_by BIGINT REFERENCES personel(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Geçmiş Kayıtlar Tablosu (Silinen/Arşivlenen Kayıtlar)
CREATE TABLE IF NOT EXISTS ekipman_gecmisi (
    id BIGSERIAL PRIMARY KEY,
    
    -- Orijinal kayıt ID'si (referans için)
    orijinal_id BIGINT,
    
    -- Teknik Bilgiler
    mac_adresi TEXT,
    seri_no TEXT,
    barkod TEXT,
    
    -- Marka/Model Referansları
    marka_id BIGINT REFERENCES markalar(id),
    model_id BIGINT REFERENCES modeller(id),
    
    -- Lokasyon ve Atama Bilgileri
    lokasyon_id BIGINT REFERENCES lokasyonlar(id),
    atanan_personel_id BIGINT REFERENCES personel(id),
    
    -- Tarihler
    satin_alma_tarihi DATE,
    garanti_bitis_tarihi DATE,
    ofise_giris_tarihi DATE,
    ofisten_cikis_tarihi DATE,
    geri_donus_tarihi DATE,
    
    -- Mali Bilgiler
    satin_alma_fiyati DECIMAL(10,2),
    amortisman_suresi INTEGER,
    defter_degeri DECIMAL(10,2),
    
    -- Durum Bilgileri
    fiziksel_durum TEXT,
    calismma_durumu TEXT,
    
    -- Ek Bilgiler
    aciklama TEXT,
    ozel_notlar JSONB,
    
    -- Arşiv Bilgileri
    arsiv_nedeni TEXT NOT NULL, -- 'SILINDI', 'OFISE_GIRDI', 'HURDAYA_AYRILDI'
    arsiv_tarihi TIMESTAMPTZ DEFAULT now() NOT NULL,
    arsiv_yapan_id BIGINT REFERENCES personel(id),
    arsiv_notu TEXT,
    
    -- Sistem Alanları
    created_by BIGINT REFERENCES personel(id),
    updated_by BIGINT REFERENCES personel(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================
-- 3. EKIPMAN HAREKET VE GEÇMİŞ TABLOLARI
-- ==============================================

-- Envanter hareketleri (Geliştirilmiş)
CREATE TABLE IF NOT EXISTS envanter_hareketleri (
    id BIGSERIAL PRIMARY KEY,
    ekipman_id BIGINT NOT NULL REFERENCES ekipman_envanteri(id) ON DELETE CASCADE,
    hareket_tipi TEXT NOT NULL CHECK (hareket_tipi IN ('Yeni Kayıt', 'Güncelleme', 'Silme', 'Lokasyon Değişikliği', 'Atama', 'Geri Alma', 'Arıza', 'Tamir', 'Hurda')),
    
    -- Eski ve yeni durumlar
    eski_lokasyon_id BIGINT REFERENCES lokasyonlar(id),
    yeni_lokasyon_id BIGINT REFERENCES lokasyonlar(id),
    eski_personel_id BIGINT REFERENCES personel(id),
    yeni_personel_id BIGINT REFERENCES personel(id),
    
    -- Değişiklik detayları
    eski_degerler JSONB,
    yeni_degerler JSONB,
    
    -- Hareket bilgileri
    hareket_nedeni TEXT,
    aciklama TEXT,
    belgeler JSONB, -- Dosya bilgileri
    
    -- Kim, ne zaman
    yapan_personel_id BIGINT REFERENCES personel(id),
    onaylayan_personel_id BIGINT REFERENCES personel(id),
    hareket_tarihi TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ekipman bakım kayıtları
CREATE TABLE IF NOT EXISTS bakim_kayitlari (
    id BIGSERIAL PRIMARY KEY,
    ekipman_id BIGINT NOT NULL REFERENCES ekipman_envanteri(id) ON DELETE CASCADE,
    bakim_tipi TEXT NOT NULL CHECK (bakim_tipi IN ('Periyodik Bakım', 'Arıza Giderme', 'Yazılım Güncelleme', 'Temizlik')),
    bakim_tarihi DATE NOT NULL,
    bakim_yapan TEXT NOT NULL,
    bakim_detayi TEXT,
    maliyet DECIMAL(10,2),
    sonraki_bakim_tarihi DATE,
    belgeler JSONB,
    created_by BIGINT REFERENCES personel(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================
-- 4. BİLDİRİM VE UYARI SİSTEMİ
-- ==============================================

-- Bildirimler (Geliştirilmiş)
CREATE TABLE IF NOT EXISTS bildirimler (
    id BIGSERIAL PRIMARY KEY,
    bildirim_tipi TEXT NOT NULL CHECK (bildirim_tipi IN ('email', 'sms', 'browser', 'system')),
    bildirim_kategori TEXT NOT NULL CHECK (bildirim_kategori IN ('info', 'warning', 'error', 'success')),
    
    -- Alıcı bilgileri
    alici_personel_id BIGINT REFERENCES personel(id),
    alici_email TEXT,
    alici_telefon TEXT,
    
    -- İçerik
    baslik TEXT NOT NULL,
    mesaj TEXT NOT NULL,
    ekipman_id BIGINT REFERENCES ekipman_envanteri(id),
    
    -- Durum
    gonderim_durumu TEXT NOT NULL DEFAULT 'pending' CHECK (gonderim_durumu IN ('pending', 'sent', 'failed', 'cancelled')),
    hata_mesaji TEXT,
    gonderim_tarihi TIMESTAMPTZ,
    okunma_tarihi TIMESTAMPTZ,
    
    -- Sistem
    created_by BIGINT REFERENCES personel(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Otomatik uyarı kuralları
CREATE TABLE IF NOT EXISTS uyari_kurallari (
    id BIGSERIAL PRIMARY KEY,
    kural_adi TEXT NOT NULL UNIQUE,
    kural_tipi TEXT NOT NULL CHECK (kural_tipi IN ('Garanti Sonu', 'Bakım Zamanı', 'Atama Süresi', 'Fiziksel Durum')),
    kural_detayi JSONB NOT NULL, -- Kural parametreleri
    alici_roller TEXT[] DEFAULT ARRAY['admin'], -- Hangi rollere gönderilecek
    is_active BOOLEAN DEFAULT true,
    created_by BIGINT REFERENCES personel(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================
-- 5. QR KOD VE ETIKET SİSTEMİ
-- ==============================================

-- QR kod kayıtları (Geliştirilmiş)
CREATE TABLE IF NOT EXISTS qr_kodlari (
    id BIGSERIAL PRIMARY KEY,
    ekipman_id BIGINT NOT NULL REFERENCES ekipman_envanteri(id) ON DELETE CASCADE,
    qr_kod TEXT NOT NULL UNIQUE,
    qr_data JSONB NOT NULL,
    qr_image_url TEXT,
    etiket_tipi TEXT DEFAULT 'standard' CHECK (etiket_tipi IN ('standard', 'compact', 'detailed')),
    yazdirma_sayisi INTEGER DEFAULT 0,
    son_yazdirma_tarihi TIMESTAMPTZ,
    generated_by BIGINT REFERENCES personel(id),
    generated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- ==============================================
-- 6. EXPORT VE RAPOR SİSTEMİ
-- ==============================================

-- Export geçmişi (Geliştirilmiş)
CREATE TABLE IF NOT EXISTS export_gecmisi (
    id BIGSERIAL PRIMARY KEY,
    export_tipi TEXT NOT NULL CHECK (export_tipi IN ('excel', 'pdf', 'csv', 'xml')),
    export_kategori TEXT NOT NULL CHECK (export_kategori IN ('inventory_list', 'movement_history', 'maintenance_report', 'custom_report')),
    dosya_adi TEXT NOT NULL,
    kayit_sayisi INTEGER,
    filtreler JSONB,
    exported_by BIGINT REFERENCES personel(id),
    dosya_boyutu_byte BIGINT,
    indirme_sayisi INTEGER DEFAULT 0,
    son_indirme_tarihi TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Özel rapor şablonları
CREATE TABLE IF NOT EXISTS rapor_sablonlari (
    id BIGSERIAL PRIMARY KEY,
    sablon_adi TEXT NOT NULL,
    sablon_tipi TEXT NOT NULL CHECK (sablon_tipi IN ('inventory', 'financial', 'maintenance', 'assignment')),
    sorgu_metni TEXT NOT NULL,
    parametreler JSONB,
    sutun_bilgileri JSONB,
    is_public BOOLEAN DEFAULT false,
    created_by BIGINT REFERENCES personel(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================
-- 7. SİSTEM AYARLARI VE YAPILANDIRMA
-- ==============================================

-- Sistem ayarları (Geliştirilmiş)
CREATE TABLE IF NOT EXISTS sistem_ayarlari (
    id BIGSERIAL PRIMARY KEY,
    kategori TEXT NOT NULL,
    ayar_anahtari TEXT NOT NULL,
    ayar_degeri JSONB NOT NULL,
    data_tipi TEXT NOT NULL DEFAULT 'string' CHECK (data_tipi IN ('string', 'number', 'boolean', 'json', 'date')),
    aciklama TEXT,
    varsayilan_deger JSONB,
    is_public BOOLEAN DEFAULT false,
    is_editable BOOLEAN DEFAULT true,
    updated_by BIGINT REFERENCES personel(id),
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(kategori, ayar_anahtari)
);

-- ==============================================
-- 8. PERFORMANS İÇİN İNDEXLER
-- ==============================================

-- Markalar ve Modeller
CREATE INDEX IF NOT EXISTS idx_modeller_marka_id ON modeller(marka_id);
CREATE INDEX IF NOT EXISTS idx_modeller_kategori ON modeller(kategori);

-- Seri numaraları ve MAC adresleri
CREATE INDEX IF NOT EXISTS idx_seri_numaralari_model_id ON seri_numaralari(model_id);
CREATE INDEX IF NOT EXISTS idx_seri_numaralari_seri_no ON seri_numaralari(seri_no);
CREATE INDEX IF NOT EXISTS idx_seri_numaralari_kullanim_durumu ON seri_numaralari(kullanim_durumu);
CREATE INDEX IF NOT EXISTS idx_mac_adresleri_model_id ON mac_adresleri(model_id);
CREATE INDEX IF NOT EXISTS idx_mac_adresleri_mac_adresi ON mac_adresleri(mac_adresi);
CREATE INDEX IF NOT EXISTS idx_mac_adresleri_kullanim_durumu ON mac_adresleri(kullanim_durumu);

-- Personel
CREATE INDEX IF NOT EXISTS idx_personel_departman_id ON personel(departman_id);
CREATE INDEX IF NOT EXISTS idx_personel_email ON personel(email);
CREATE INDEX IF NOT EXISTS idx_personel_sicil_no ON personel(sicil_no);
CREATE INDEX IF NOT EXISTS idx_personel_is_active ON personel(is_active);

-- Lokasyonlar
CREATE INDEX IF NOT EXISTS idx_lokasyonlar_departman_id ON lokasyonlar(departman_id);
CREATE INDEX IF NOT EXISTS idx_lokasyonlar_lokasyon_tipi ON lokasyonlar(lokasyon_tipi);
CREATE INDEX IF NOT EXISTS idx_lokasyonlar_kodu ON lokasyonlar(lokasyon_kodu);

-- Ana Envanter
CREATE INDEX IF NOT EXISTS idx_ekipman_marka_id ON ekipman_envanteri(marka_id);
CREATE INDEX IF NOT EXISTS idx_ekipman_model_id ON ekipman_envanteri(model_id);
CREATE INDEX IF NOT EXISTS idx_ekipman_lokasyon_id ON ekipman_envanteri(lokasyon_id);
CREATE INDEX IF NOT EXISTS idx_ekipman_atanan_personel_id ON ekipman_envanteri(atanan_personel_id);
CREATE INDEX IF NOT EXISTS idx_ekipman_mac_adresi ON ekipman_envanteri(mac_adresi);
CREATE INDEX IF NOT EXISTS idx_ekipman_seri_no ON ekipman_envanteri(seri_no);
CREATE INDEX IF NOT EXISTS idx_ekipman_created_at ON ekipman_envanteri(created_at DESC);

-- Geçmiş Kayıtlar
CREATE INDEX IF NOT EXISTS idx_ekipman_gecmisi_orijinal_id ON ekipman_gecmisi(orijinal_id);
CREATE INDEX IF NOT EXISTS idx_ekipman_gecmisi_arsiv_nedeni ON ekipman_gecmisi(arsiv_nedeni);
CREATE INDEX IF NOT EXISTS idx_ekipman_gecmisi_arsiv_tarihi ON ekipman_gecmisi(arsiv_tarihi DESC);
CREATE INDEX IF NOT EXISTS idx_ekipman_gecmisi_mac_adresi ON ekipman_gecmisi(mac_adresi);
CREATE INDEX IF NOT EXISTS idx_ekipman_gecmisi_seri_no ON ekipman_gecmisi(seri_no);

-- Hareketler
CREATE INDEX IF NOT EXISTS idx_envanter_hareketleri_ekipman_id ON envanter_hareketleri(ekipman_id);
CREATE INDEX IF NOT EXISTS idx_envanter_hareketleri_hareket_tarihi ON envanter_hareketleri(hareket_tarihi DESC);
CREATE INDEX IF NOT EXISTS idx_envanter_hareketleri_hareket_tipi ON envanter_hareketleri(hareket_tipi);
CREATE INDEX IF NOT EXISTS idx_envanter_hareketleri_yapan_personel_id ON envanter_hareketleri(yapan_personel_id);

-- Bakım Kayıtları
CREATE INDEX IF NOT EXISTS idx_bakim_kayitlari_ekipman_id ON bakim_kayitlari(ekipman_id);
CREATE INDEX IF NOT EXISTS idx_bakim_kayitlari_bakim_tarihi ON bakim_kayitlari(bakim_tarihi DESC);

-- Bildirimler
CREATE INDEX IF NOT EXISTS idx_bildirimler_alici_personel_id ON bildirimler(alici_personel_id);
CREATE INDEX IF NOT EXISTS idx_bildirimler_gonderim_durumu ON bildirimler(gonderim_durumu);
CREATE INDEX IF NOT EXISTS idx_bildirimler_created_at ON bildirimler(created_at DESC);

-- QR Kodları
CREATE INDEX IF NOT EXISTS idx_qr_kodlari_ekipman_id ON qr_kodlari(ekipman_id);
CREATE INDEX IF NOT EXISTS idx_qr_kodlari_qr_kod ON qr_kodlari(qr_kod);

-- ==============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Tüm tabloları RLS ile koruyalım
ALTER TABLE markalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE modeller ENABLE ROW LEVEL SECURITY;
ALTER TABLE seri_numaralari ENABLE ROW LEVEL SECURITY;
ALTER TABLE mac_adresleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE departmanlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE lokasyonlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE personel ENABLE ROW LEVEL SECURITY;
ALTER TABLE ekipman_envanteri ENABLE ROW LEVEL SECURITY;
ALTER TABLE ekipman_gecmisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE envanter_hareketleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE bakim_kayitlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE bildirimler ENABLE ROW LEVEL SECURITY;
ALTER TABLE uyari_kurallari ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_kodlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_gecmisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapor_sablonlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistem_ayarlari ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 10. RLS POLİTİKALARI
-- ==============================================

-- Lookup tabloları - Herkes okuyabilir
CREATE POLICY "Markalar okuma - herkes" ON markalar FOR SELECT USING (is_active = true);
CREATE POLICY "Modeller okuma - herkes" ON modeller FOR SELECT USING (is_active = true);
CREATE POLICY "Seri numaraları okuma - herkes" ON seri_numaralari FOR SELECT USING (true);
CREATE POLICY "MAC adresleri okuma - herkes" ON mac_adresleri FOR SELECT USING (true);
CREATE POLICY "Departmanlar okuma - herkes" ON departmanlar FOR SELECT USING (is_active = true);
CREATE POLICY "Lokasyonlar okuma - herkes" ON lokasyonlar FOR SELECT USING (is_active = true);

-- Lookup tabloları - Anonim erişim (kurulum için)
CREATE POLICY "Markalar anonim erişim" ON markalar FOR INSERT WITH CHECK (true);
CREATE POLICY "Modeller anonim erişim" ON modeller FOR INSERT WITH CHECK (true);
CREATE POLICY "Seri numaraları anonim erişim" ON seri_numaralari FOR INSERT WITH CHECK (true);
CREATE POLICY "MAC adresleri anonim erişim" ON mac_adresleri FOR INSERT WITH CHECK (true);
CREATE POLICY "Departmanlar anonim erişim" ON departmanlar FOR INSERT WITH CHECK (true);
CREATE POLICY "Lokasyonlar anonim erişim" ON lokasyonlar FOR INSERT WITH CHECK (true);
CREATE POLICY "Sistem ayarları anonim erişim" ON sistem_ayarlari FOR INSERT WITH CHECK (true);

-- Personel tablosu
CREATE POLICY "Personel okuma - kendi kaydı veya admin" ON personel
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM personel 
                WHERE user_id = auth.uid() AND rol IN ('admin', 'manager')
            )
        )
    );

-- Ana envanter tablosu
CREATE POLICY "Envanter okuma - kimlik doğrulanmış kullanıcılar" ON ekipman_envanteri
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Envanter ekleme - kullanıcılar ve üstü" ON ekipman_envanteri
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
            EXISTS (
            SELECT 1 FROM personel 
            WHERE user_id = auth.uid() AND rol IN ('admin', 'manager', 'user')
        )
    );

CREATE POLICY "Envanter güncelleme - kullanıcılar ve üstü" ON ekipman_envanteri
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM personel 
            WHERE user_id = auth.uid() AND rol IN ('admin', 'manager', 'user')
        )
    );

CREATE POLICY "Envanter silme - sadece adminler" ON ekipman_envanteri
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM personel 
            WHERE user_id = auth.uid() AND rol = 'admin'
        )
    );

-- Envanter hareketleri
CREATE POLICY "Hareket okuma - kimlik doğrulanmış kullanıcılar" ON envanter_hareketleri
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Hareket ekleme - sistem tarafından" ON envanter_hareketleri
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Bildirimler
CREATE POLICY "Bildirim okuma - kendi bildirimleri veya admin" ON bildirimler
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            alici_personel_id IN (
                SELECT id FROM personel WHERE user_id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM personel 
                WHERE user_id = auth.uid() AND rol = 'admin'
            )
        )
    );

-- QR kodları
CREATE POLICY "QR okuma - kimlik doğrulanmış kullanıcılar" ON qr_kodlari
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "QR ekleme - kullanıcılar ve üstü" ON qr_kodlari
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM personel 
            WHERE user_id = auth.uid() AND rol IN ('admin', 'manager', 'user')
        )
    );

-- Sistem ayarları
CREATE POLICY "Ayar okuma - public ayarlar herkese, private sadece adminlere" ON sistem_ayarlari
    FOR SELECT USING (
        is_public = true OR (
            auth.role() = 'authenticated' AND 
            EXISTS (
                SELECT 1 FROM personel 
                WHERE user_id = auth.uid() AND rol = 'admin'
            )
        )
    );

CREATE POLICY "Ayar güncelleme - sadece adminler" ON sistem_ayarlari
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND is_editable = true AND
        EXISTS (
            SELECT 1 FROM personel 
            WHERE user_id = auth.uid() AND rol = 'admin'
        )
    );

-- ==============================================
-- 11. FUNCTIONS & TRIGGERS
-- ==============================================

-- Otomatik personel kaydı oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.personel (user_id, email, ad, soyad)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Yeni kullanıcı kaydında otomatik personel ataması için trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger'ları
CREATE OR REPLACE TRIGGER update_markalar_updated_at
    BEFORE UPDATE ON markalar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_modeller_updated_at
    BEFORE UPDATE ON modeller
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_departmanlar_updated_at
    BEFORE UPDATE ON departmanlar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_lokasyonlar_updated_at
    BEFORE UPDATE ON lokasyonlar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_personel_updated_at
    BEFORE UPDATE ON personel
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_ekipman_envanteri_updated_at
    BEFORE UPDATE ON ekipman_envanteri
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Envanter değişikliği takip fonksiyonu
CREATE OR REPLACE FUNCTION track_inventory_changes()
RETURNS TRIGGER AS $$
DECLARE
    hareket_tipi_val TEXT;
    personel_id_val BIGINT;
BEGIN
    -- Personel ID'sini al (kimlik doğrulama olmadığı için sabit bir değer kullanılıyor)
    personel_id_val := NULL; -- Kimlik doğrulama olmadan NULL kullanılıyor
    
    IF TG_OP = 'INSERT' THEN
        hareket_tipi_val := 'Yeni Kayıt';
        INSERT INTO envanter_hareketleri (
            ekipman_id, hareket_tipi, yeni_degerler, yapan_personel_id
        ) VALUES (
            NEW.id, hareket_tipi_val, to_jsonb(NEW), personel_id_val
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        hareket_tipi_val := 'Güncelleme';
        INSERT INTO envanter_hareketleri (
            ekipman_id, hareket_tipi, eski_degerler, yeni_degerler, yapan_personel_id
        ) VALUES (
            NEW.id, hareket_tipi_val, to_jsonb(OLD), to_jsonb(NEW), personel_id_val
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        hareket_tipi_val := 'Silme';
        INSERT INTO envanter_hareketleri (
            ekipman_id, hareket_tipi, eski_degerler, yapan_personel_id
        ) VALUES (
            OLD.id, hareket_tipi_val, to_jsonb(OLD), personel_id_val
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Envanter değişiklik trigger'ı
CREATE OR REPLACE TRIGGER inventory_change_tracker
    AFTER INSERT OR UPDATE OR DELETE ON ekipman_envanteri
    FOR EACH ROW EXECUTE FUNCTION track_inventory_changes();

-- ==============================================
-- 12. BAŞLANGIÇ VERİLERİ
-- ==============================================

-- Başlangıç verileri kaldırıldı
-- Kullanıcılar gerekli verileri manuel olarak ekleyebilir

-- ==============================================
-- 13. GÖRÜNÜMLER (VIEWS)
-- ==============================================

-- Envanter özet görünümü (Normalleştirilmiş)
CREATE OR REPLACE VIEW v_envanter_ozet AS
SELECT 
    e.id,
    e.mac_adresi,
    e.seri_no,
    e.barkod,
    m.marka_adi,
    md.model_adi,
    md.kategori,
    CONCAT(m.marka_adi, ' ', md.model_adi) as marka_model,
    l.lokasyon_kodu,
    l.lokasyon_adi,
    l.lokasyon_tipi as konum, -- Eski API uyumluluğu için
    p.ad || ' ' || p.soyad as agent, -- Eski API uyumluluğu için
    p.email as agent_email,
    d.departman_adi,
    e.satin_alma_tarihi,
    e.garanti_bitis_tarihi,
    e.ofisten_cikis_tarihi,
    e.geri_donus_tarihi,
    e.fiziksel_durum,
    e.calismma_durumu,
    e.aciklama,
    e.created_at,
    e.updated_at,
    -- Hesaplanan alanlar
    CASE 
        WHEN e.garanti_bitis_tarihi < CURRENT_DATE THEN 'Garanti Bitti'
        WHEN e.garanti_bitis_tarihi < CURRENT_DATE + INTERVAL '30 days' THEN 'Garanti Bitiyor'
        ELSE 'Garantili'
    END as garanti_durumu,
    -- Hareket sayısı
    (SELECT COUNT(*) FROM envanter_hareketleri WHERE ekipman_id = e.id) as toplam_hareket_sayisi,
    -- Son hareket tarihi
    (SELECT MAX(hareket_tarihi) FROM envanter_hareketleri WHERE ekipman_id = e.id) as son_hareket_tarihi
FROM ekipman_envanteri e
LEFT JOIN markalar m ON e.marka_id = m.id
LEFT JOIN modeller md ON e.model_id = md.id
LEFT JOIN lokasyonlar l ON e.lokasyon_id = l.id
LEFT JOIN personel p ON e.atanan_personel_id = p.id
LEFT JOIN departmanlar d ON l.departman_id = d.id;

-- Aylık istatistik görünümü (Normalleştirilmiş)
CREATE OR REPLACE VIEW v_aylik_istatistikler AS
SELECT 
    DATE_TRUNC('month', e.created_at) as ay,
    COUNT(*) as toplam_kayit,
    COUNT(*) FILTER (WHERE l.lokasyon_kodu = 'DEPO01') as depo,
    COUNT(*) FILTER (WHERE l.lokasyon_tipi = 'KULLANICI') as kullanici,
    COUNT(*) FILTER (WHERE l.lokasyon_tipi = 'EGITIM') as egitim,
    COUNT(*) FILTER (WHERE l.lokasyon_kodu = 'AGENTUR') as agent_tr
FROM ekipman_envanteri e
LEFT JOIN lokasyonlar l ON e.lokasyon_id = l.id
GROUP BY DATE_TRUNC('month', e.created_at)
ORDER BY ay DESC;

-- Detaylı hareket görünümü
CREATE OR REPLACE VIEW v_hareket_detay AS
SELECT 
    h.id,
    h.ekipman_id,
    e.seri_no,
    CONCAT(m.marka_adi, ' ', md.model_adi) as ekipman_info,
    h.hareket_tipi,
    h.hareket_nedeni,
    h.aciklama,
    ol.lokasyon_adi as eski_lokasyon,
    nl.lokasyon_adi as yeni_lokasyon,
    op.ad || ' ' || op.soyad as eski_personel,
    np.ad || ' ' || np.soyad as yeni_personel,
    yp.ad || ' ' || yp.soyad as yapan_personel,
    h.hareket_tarihi,
    h.created_at
FROM envanter_hareketleri h
LEFT JOIN ekipman_envanteri e ON h.ekipman_id = e.id
LEFT JOIN markalar m ON e.marka_id = m.id
LEFT JOIN modeller md ON e.model_id = md.id
LEFT JOIN lokasyonlar ol ON h.eski_lokasyon_id = ol.id
LEFT JOIN lokasyonlar nl ON h.yeni_lokasyon_id = nl.id
LEFT JOIN personel op ON h.eski_personel_id = op.id
LEFT JOIN personel np ON h.yeni_personel_id = np.id
LEFT JOIN personel yp ON h.yapan_personel_id = yp.id;

-- ==============================================
-- 14. FONKSİYONLAR
-- ==============================================

-- Envanter özet raporu fonksiyonu
CREATE OR REPLACE FUNCTION get_inventory_summary(
    baslangic_tarihi DATE DEFAULT NULL,
    bitis_tarihi DATE DEFAULT NULL
)
RETURNS TABLE(
    toplam_ekipman INTEGER,
    kullanımda_ekipman INTEGER,
    depo_ekipman INTEGER,
    arizali_ekipman INTEGER,
    garanti_biten_ekipman INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as toplam_ekipman,
        COUNT(*) FILTER (WHERE l.lokasyon_tipi = 'KULLANICI')::INTEGER as kullanımda_ekipman,
        COUNT(*) FILTER (WHERE l.lokasyon_tipi = 'DEPO')::INTEGER as depo_ekipman,
        COUNT(*) FILTER (WHERE e.calismma_durumu = 'Arızalı')::INTEGER as arizali_ekipman,
        COUNT(*) FILTER (WHERE e.garanti_bitis_tarihi < CURRENT_DATE)::INTEGER as garanti_biten_ekipman
    FROM ekipman_envanteri e
    LEFT JOIN lokasyonlar l ON e.lokasyon_id = l.id
    WHERE (baslangic_tarihi IS NULL OR e.created_at >= baslangic_tarihi)
      AND (bitis_tarihi IS NULL OR e.created_at <= bitis_tarihi);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Geriye dönük uyumluluk için eski tablo isimlerini görünüm olarak oluştur
-- Bu sayede mevcut React kodu değişmeden çalışmaya devam edecek
CREATE OR REPLACE VIEW user_roles AS
SELECT 
    p.id,
    p.user_id,
    p.email,
    p.rol as role,
    p.ad || ' ' || p.soyad as full_name,
    d.departman_adi as department,
    p.telefon as phone,
    p.is_active,
    p.created_at,
    p.updated_at
FROM personel p
LEFT JOIN departmanlar d ON p.departman_id = d.id;

-- ==============================================
-- 15. KURULUM DOĞRULAMA
-- ==============================================

-- Kurulumun başarılı olduğunu doğrulayan sorgu
SELECT 
    'Normalleştirilmiş kurulum tamamlandı!' as durum,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('markalar', 'modeller', 'departmanlar', 'lokasyonlar', 'personel', 'ekipman_envanteri')
    ) as ana_tablo_sayisi,
    (SELECT COUNT(*) FROM information_schema.views 
     WHERE table_schema = 'public' 
     AND table_name LIKE 'v_%'
    ) as view_sayisi,
    'Başlangıç verileri yok - manuel ekleme gerekli' as veri_durumu,
    now() as kurulum_tarihi;

-- ==============================================
-- KURULUM TALİMATLARI
-- ==============================================

/*
NORMALLEŞTİRİLMİŞ KURULUM SONRASI YAPMAMIZ GEREKENLER:

1. Supabase Dashboard'da Authentication ayarları:
   - Site URL: http://localhost:3000
   - Redirect URLs: http://localhost:3000

2. İlk admin kullanıcısı oluşturma:
   - Uygulamada normal kayıt olun
   - Ardından aşağıdaki SQL'i çalıştırın:
   
   UPDATE personel 
   SET rol = 'admin' 
   WHERE email = 'YOUR_EMAIL@example.com';

  3. Temel verileri ekleme (ZORUNLU):
     Uygulama çalışması için minimum veriler eklenmelidir:
     
     -- 1. En az bir departman:
     INSERT INTO departmanlar (departman_adi, aciklama) VALUES ('IT', 'Bilgi İşlem');
     
     -- 2. En az bir lokasyon:
     INSERT INTO lokasyonlar (lokasyon_kodu, lokasyon_adi, lokasyon_tipi, departman_id) 
     VALUES ('DEPO01', 'Ana Depo', 'DEPO', (SELECT id FROM departmanlar WHERE departman_adi = 'IT'));
     
     -- 3. En az bir marka:
     INSERT INTO markalar (marka_adi) VALUES ('Dell');
     
     -- 4. En az bir model:
     INSERT INTO modeller (marka_id, model_adi, kategori) 
     VALUES ((SELECT id FROM markalar WHERE marka_adi = 'Dell'), 'OptiPlex 7090', 'Bilgisayar');
     
     -- 5. İsteğe bağlı: Sistem ayarları
     INSERT INTO sistem_ayarlari (kategori, ayar_anahtari, ayar_degeri, data_tipi, aciklama, is_public) VALUES
         ('uygulama', 'app_name', '"Envanter Takip Sistemi"', 'string', 'Uygulama adı', true),
         ('ozellikler', 'qr_code_enabled', 'true', 'boolean', 'QR kod özelliği aktif mi?', false),
         ('ozellikler', 'excel_export_enabled', 'true', 'boolean', 'Excel export aktif mi?', false);
     
     -- 6. Test ekipmanı (opsiyonel):
     INSERT INTO ekipman_envanteri (
         mac_adresi, marka_id, model_id, lokasyon_id, seri_no, aciklama
     ) VALUES (
         '00:1B:44:11:3A:B7', 
         (SELECT id FROM markalar WHERE marka_adi = 'Dell'),
         (SELECT id FROM modeller WHERE model_adi = 'OptiPlex 7090'),
         (SELECT id FROM lokasyonlar WHERE lokasyon_kodu = 'DEPO01'),
         'DL001', 
         'Test ekipmanı'
     );

4. React uygulamasında değişiklik gerekmez, çünkü:
   - v_envanter_ozet view'i eski API'yi taklit eder
   - user_roles view'i eski personel sistemini taklit eder
   - Tüm eski sütun isimleri desteklenir

5. İleriye dönük geliştirmeler için:
   - Yeni normalize edilmiş tabloları kullanın
   - Marka/model seçimi için ayrı dropdown'lar ekleyin
   - Lokasyon seçimi için yeni sistem kullanın
   - Personel ataması için yeni sistem kullanın
*/ 