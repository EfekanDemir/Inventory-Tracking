// ✅ Düzeltilmiş AddInventory.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AddInventory = () => {
  // ✅ Form state
  const [formData, setFormData] = useState({
    mac_adresi: '',
    seri_no: '',
    barkod: '',
    marka_id: '',
    model_id: '',
    lokasyon_id: '',
    atanan_personel_id: '',
    ofise_giris_tarihi: '',
    ofisten_cikis_tarihi: '',
    aciklama: ''
  });

  // ✅ Dropdown data state
  const [dropdownData, setDropdownData] = useState({
    markalar: [],
    modeller: [],
    lokasyonlar: [],
    personel: [],
    macAdresleri: [],
    seriNumaralari: []
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Dropdown verilerini yükle
  const loadDropdownData = async () => {
    try {
      console.log('Dropdown verileri yükleniyor...');
      setLoading(true);

      // Paralel olarak tüm verileri yükle
      const [
        markalarResult,
        modellerResult,
        lokasyonlarResult,
        personelResult,
        macResult,
        seriResult
      ] = await Promise.all([
        supabase.from('markalar').select('*').order('marka_adi'),
        supabase.from('modeller').select('*').order('model_adi'),
        supabase.from('lokasyonlar').select(`
          *,
          departmanlar:departman_id (
            id,
            departman_adi
          )
        `).order('lokasyon_adi'),
        supabase.from('personel').select(`
          *,
          departmanlar:departman_id (
            id,
            departman_adi
          )
        `).order('ad'),
        supabase.from('mac_adresleri').select('*').eq('kullanim_durumu', 'AKTIF').order('mac_adresi'),
        supabase.from('seri_numaralari').select('*').eq('kullanim_durumu', 'AKTIF').order('seri_no')
      ]);

      // ✅ Hata kontrolü
      if (markalarResult.error) throw markalarResult.error;
      if (modellerResult.error) throw modellerResult.error;
      if (lokasyonlarResult.error) throw lokasyonlarResult.error;
      if (personelResult.error) throw personelResult.error;
      if (macResult.error) throw macResult.error;
      if (seriResult.error) throw seriResult.error;

      setDropdownData({
        markalar: markalarResult.data || [],
        modeller: modellerResult.data || [],
        lokasyonlar: lokasyonlarResult.data || [],
        personel: personelResult.data || [],
        macAdresleri: macResult.data || [],
        seriNumaralari: seriResult.data || []
      });

      console.log('Tüm dropdown verileri yüklendi');

    } catch (error) {
      console.error('Dropdown veri yükleme hatası:', error);
      alert(`Veri yükleme hatası: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Form input değişikliği
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ MAC adresi formatını kontrol et
  const validateMacAddress = (mac) => {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  };

  // ✅ Form doğrulama
  const validateForm = () => {
    const errors = [];

    // Gerekli alanlar
    if (!formData.mac_adresi.trim()) {
      errors.push('MAC adresi gereklidir');
    } else if (!validateMacAddress(formData.mac_adresi)) {
      errors.push('MAC adresi formatı geçersiz (örn: 00:11:22:33:44:55)');
    }

    if (!formData.seri_no.trim()) {
      errors.push('Seri numarası gereklidir');
    }

    if (!formData.barkod.trim()) {
      errors.push('Barkod gereklidir');
    }

    if (!formData.marka_id) {
      errors.push('Marka seçimi gereklidir');
    }

    if (!formData.model_id) {
      errors.push('Model seçimi gereklidir');
    }

    if (!formData.lokasyon_id) {
      errors.push('Lokasyon seçimi gereklidir');
    }

    if (!formData.ofise_giris_tarihi) {
      errors.push('Ofise giriş tarihi gereklidir');
    }

    return errors;
  };

  // ✅ Benzersizlik kontrolü
  const checkUniqueness = async () => {
    try {
      // MAC adresi kontrolü
      const { data: existingMac } = await supabase
        .from('mac_adresleri')
        .select('id')
        .eq('mac_adresi', formData.mac_adresi)
        .maybeSingle();

      if (existingMac) {
        throw new Error('Bu MAC adresi zaten kayıtlı');
      }

      // Seri numarası kontrolü
      const { data: existingSerial } = await supabase
        .from('seri_numaralari')
        .select('id')
        .eq('seri_no', formData.seri_no)
        .maybeSingle();

      if (existingSerial) {
        throw new Error('Bu seri numarası zaten kayıtlı');
      }

      // Barkod kontrolü
      const { data: existingBarcode } = await supabase
        .from('ekipman_envanteri')
        .select('id')
        .eq('barkod', formData.barkod)
        .maybeSingle();

      if (existingBarcode) {
        throw new Error('Bu barkod zaten kayıtlı');
      }

    } catch (error) {
      throw error;
    }
  };

  // ✅ Form gönderme işlemi - Düzeltilmiş
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      console.log('Form gönderiliyor...', formData);
      setSubmitting(true);

      // 1. Form doğrulama
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'));
      }

      // 2. Benzersizlik kontrolü
      await checkUniqueness();

      // 3. ✅ MAC adresi ekle (doğru constraint ile)
      console.log('MAC adresi ekleniyor...');
      const macData = {
        mac_adresi: formData.mac_adresi.trim().toUpperCase(),
        kullanim_durumu: 'KULLANIMDA' // ✅ Constraint'e uygun değer
      };

      const { data: macResult, error: macError } = await supabase
        .from('mac_adresleri')
        .insert(macData)
        .select('*')
        .single();

      if (macError) {
        console.error('MAC adresi ekleme hatası:', macError);
        throw new Error(`MAC adresi ekleme hatası: ${macError.message}`);
      }

      console.log('MAC adresi eklendi:', macResult);

      // 4. ✅ Seri numarası ekle (doğru constraint ile)
      console.log('Seri numarası ekleniyor...');
      const serialData = {
        seri_no: formData.seri_no.trim().toUpperCase(),
        kullanim_durumu: 'KULLANIMDA' // ✅ Constraint'e uygun değer
      };

      const { data: serialResult, error: serialError } = await supabase
        .from('seri_numaralari')
        .insert(serialData)
        .select('*')
        .single();

      if (serialError) {
        console.error('Seri numarası ekleme hatası:', serialError);
        
        // MAC adresini geri al (rollback)
        await supabase
          .from('mac_adresleri')
          .delete()
          .eq('id', macResult.id);
          
        throw new Error(`Seri numarası ekleme hatası: ${serialError.message}`);
      }

      console.log('Seri numarası eklendi:', serialResult);

      // 5. ✅ Envanter kaydını ekle
      console.log('Envanter kaydı ekleniyor...');
      const inventoryData = {
        mac_adresi_id: macResult.id,
        seri_no_id: serialResult.id,
        barkod: formData.barkod.trim(),
        marka_id: parseInt(formData.marka_id),
        model_id: parseInt(formData.model_id),
        lokasyon_id: parseInt(formData.lokasyon_id),
        atanan_personel_id: formData.atanan_personel_id ? parseInt(formData.atanan_personel_id) : null,
        ofise_giris_tarihi: formData.ofise_giris_tarihi,
        ofisten_cikis_tarihi: formData.ofisten_cikis_tarihi || null,
        aciklama: formData.aciklama.trim() || null
      };

      const { data: inventoryResult, error: inventoryError } = await supabase
        .from('ekipman_envanteri')
        .insert(inventoryData)
        .select('*')
        .single();

      if (inventoryError) {
        console.error('Envanter ekleme hatası:', inventoryError);
        
        // Önceki kayıtları geri al (rollback)
        await Promise.all([
          supabase.from('mac_adresleri').delete().eq('id', macResult.id),
          supabase.from('seri_numaralari').delete().eq('id', serialResult.id)
        ]);
        
        throw new Error(`Envanter ekleme hatası: ${inventoryError.message}`);
      }

      console.log('Envanter başarıyla eklendi:', inventoryResult);

      // 6. ✅ Başarı durumu
      alert('Envanter kaydı başarıyla eklendi!');
      
      // Formu sıfırla
      setFormData({
        mac_adresi: '',
        seri_no: '',
        barkod: '',
        marka_id: '',
        model_id: '',
        lokasyon_id: '',
        atanan_personel_id: '',
        ofise_giris_tarihi: '',
        ofisten_cikis_tarihi: '',
        aciklama: ''
      });

      // Dropdown verilerini yenile
      await loadDropdownData();

    } catch (error) {
      console.error('Form gönderme hatası:', error);
      
      // ✅ Kullanıcı dostu hata mesajları
      let errorMessage = 'Kayıt ekleme sırasında bir hata oluştu.';
      
      if (error.message.includes('mac_adresleri_kullanim_durumu_check')) {
        errorMessage = 'MAC adresi kullanım durumu geçerli değil. Lütfen geliştirici ile iletişime geçin.';
      } else if (error.message.includes('seri_numaralari_kullanim_durumu_check')) {
        errorMessage = 'Seri numarası kullanım durumu geçerli değil. Lütfen geliştirici ile iletişime geçin.';
      } else if (error.message.includes('duplicate key')) {
        errorMessage = 'Bu kayıt zaten mevcut. Lütfen farklı değerler girin.';
      } else if (error.message.includes('foreign key')) {
        errorMessage = 'Seçtiğiniz referans değerler geçerli değil.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Hata: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Component mount edildiğinde dropdown verilerini yükle
  useEffect(() => {
    loadDropdownData();
  }, []);

  // ✅ Loading durumu
  if (loading) {
    return (
      <div className="loading-container">
        <p>Veriler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="add-inventory">
      <h2>Yeni Envanter Kaydı Ekle</h2>
      
      <form onSubmit={handleSubmit} className="inventory-form">
        
        {/* ✅ MAC Adresi */}
        <div className="form-group">
          <label htmlFor="mac_adresi" className="required">
            MAC Adresi:
          </label>
          <input
            type="text"
            id="mac_adresi"
            name="mac_adresi"
            value={formData.mac_adresi}
            onChange={handleInputChange}
            placeholder="00:11:22:33:44:55"
            pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
            title="MAC adresi formatı: 00:11:22:33:44:55"
            required
            disabled={submitting}
          />
          <small>Format: 00:11:22:33:44:55</small>
        </div>

        {/* ✅ Seri Numarası */}
        <div className="form-group">
          <label htmlFor="seri_no" className="required">
            Seri Numarası:
          </label>
          <input
            type="text"
            id="seri_no"
            name="seri_no"
            value={formData.seri_no}
            onChange={handleInputChange}
            placeholder="Seri numarasını girin"
            required
            disabled={submitting}
          />
        </div>

        {/* ✅ Barkod */}
        <div className="form-group">
          <label htmlFor="barkod" className="required">
            Barkod:
          </label>
          <input
            type="text"
            id="barkod"
            name="barkod"
            value={formData.barkod}
            onChange={handleInputChange}
            placeholder="Barkod numarasını girin"
            required
            disabled={submitting}
          />
        </div>

        {/* ✅ Marka */}
        <div className="form-group">
          <label htmlFor="marka_id" className="required">
            Marka:
          </label>
          <select
            id="marka_id"
            name="marka_id"
            value={formData.marka_id}
            onChange={handleInputChange}
            required
            disabled={submitting}
          >
            <option value="">Marka seçin</option>
            {dropdownData.markalar.map(marka => (
              <option key={marka.id} value={marka.id}>
                {marka.marka_adi}
              </option>
            ))}
          </select>
          <small>{dropdownData.markalar.length} marka yüklendi</small>
        </div>

        {/* ✅ Model */}
        <div className="form-group">
          <label htmlFor="model_id" className="required">
            Model:
          </label>
          <select
            id="model_id"
            name="model_id"
            value={formData.model_id}
            onChange={handleInputChange}
            required
            disabled={submitting}
          >
            <option value="">Model seçin</option>
            {dropdownData.modeller
              .filter(model => !formData.marka_id || model.marka_id === parseInt(formData.marka_id))
              .map(model => (
                <option key={model.id} value={model.id}>
                  {model.model_adi}
                </option>
              ))}
          </select>
          <small>{dropdownData.modeller.length} model yüklendi</small>
        </div>

        {/* ✅ Lokasyon */}
        <div className="form-group">
          <label htmlFor="lokasyon_id" className="required">
            Lokasyon:
          </label>
          <select
            id="lokasyon_id"
            name="lokasyon_id"
            value={formData.lokasyon_id}
            onChange={handleInputChange}
            required
            disabled={submitting}
          >
            <option value="">Lokasyon seçin</option>
            {dropdownData.lokasyonlar.map(lokasyon => (
              <option key={lokasyon.id} value={lokasyon.id}>
                {lokasyon.lokasyon_adi} - {lokasyon.departmanlar?.departman_adi || 'Departman yok'}
              </option>
            ))}
          </select>
          <small>{dropdownData.lokasyonlar.length} lokasyon yüklendi</small>
        </div>

        {/* ✅ Atanan Personel (Opsiyonel) */}
        <div className="form-group">
          <label htmlFor="atanan_personel_id">
            Atanan Personel:
          </label>
          <select
            id="atanan_personel_id"
            name="atanan_personel_id"
            value={formData.atanan_personel_id}
            onChange={handleInputChange}
            disabled={submitting}
          >
            <option value="">Personel seçin (opsiyonel)</option>
            {dropdownData.personel.map(person => (
              <option key={person.id} value={person.id}>
                {person.ad} {person.soyad} - {person.departmanlar?.departman_adi || 'Departman yok'}
              </option>
            ))}
          </select>
          <small>{dropdownData.personel.length} personel yüklendi</small>
        </div>

        {/* ✅ Ofise Giriş Tarihi */}
        <div className="form-group">
          <label htmlFor="ofise_giris_tarihi" className="required">
            Ofise Giriş Tarihi:
          </label>
          <input
            type="date"
            id="ofise_giris_tarihi"
            name="ofise_giris_tarihi"
            value={formData.ofise_giris_tarihi}
            onChange={handleInputChange}
            required
            disabled={submitting}
          />
        </div>

        {/* ✅ Ofisten Çıkış Tarihi (Opsiyonel) */}
        <div className="form-group">
          <label htmlFor="ofisten_cikis_tarihi">
            Ofisten Çıkış Tarihi:
          </label>
          <input
            type="date"
            id="ofisten_cikis_tarihi"
            name="ofisten_cikis_tarihi"
            value={formData.ofisten_cikis_tarihi}
            onChange={handleInputChange}
            disabled={submitting}
          />
          <small>Boş bırakılabilir</small>
        </div>

        {/* ✅ Açıklama */}
        <div className="form-group">
          <label htmlFor="aciklama">
            Açıklama:
          </label>
          <textarea
            id="aciklama"
            name="aciklama"
            value={formData.aciklama}
            onChange={handleInputChange}
            placeholder="Ek açıklamalar (opsiyonel)"
            rows="3"
            disabled={submitting}
          />
        </div>

        {/* ✅ Form Butonları */}
        <div className="form-actions">
          <button 
            type="submit" 
            disabled={submitting || loading}
            className="submit-btn"
          >
            {submitting ? 'Kaydediliyor...' : 'Envanter Kaydını Ekle'}
          </button>
          
          <button 
            type="button" 
            onClick={() => setFormData({
              mac_adresi: '',
              seri_no: '',
              barkod: '',
              marka_id: '',
              model_id: '',
              lokasyon_id: '',
              atanan_personel_id: '',
              ofise_giris_tarihi: '',
              ofisten_cikis_tarihi: '',
              aciklama: ''
            })}
            disabled={submitting}
            className="reset-btn"
          >
            Formu Temizle
          </button>
        </div>

      </form>

      {/* ✅ Debug Bilgileri (geliştirme ortamı için) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <h3>Debug Bilgileri</h3>
          <p>Markalar: {dropdownData.markalar.length}</p>
          <p>Modeller: {dropdownData.modeller.length}</p>
          <p>Lokasyonlar: {dropdownData.lokasyonlar.length}</p>
          <p>Personel: {dropdownData.personel.length}</p>
          <p>Mevcut MAC Adresleri: {dropdownData.macAdresleri.length}</p>
          <p>Mevcut Seri Numaraları: {dropdownData.seriNumaralari.length}</p>
        </div>
      )}

    </div>
  );
};

export default AddInventory;