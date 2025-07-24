// ✅ Düzeltilmiş SetupWizard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SetupWizard = () => {
  const [departmanlar, setDepartmanlar] = useState([]);
  const [personel, setPersonel] = useState([]);
  const [lokasyonlar, setLokasyonlar] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Veri yükleme işlemi
  const loadData = async () => {
    try {
      console.log('SetupWizard: Mevcut veriler yükleniyor...');
      setLoading(true);

      // Departmanları yükle
      const { data: deptData, error: deptError } = await supabase
        .from('departmanlar')
        .select('*')
        .order('id');

      if (deptError) {
        console.error('Departman yükleme hatası:', deptError);
        throw deptError;
      }

      setDepartmanlar(deptData || []);
      console.log('Departmanlar yüklendi:', deptData?.length || 0);

      // Personeli yükle
      const { data: personalData, error: personalError } = await supabase
        .from('personel')
        .select(`
          *,
          departmanlar:departman_id (
            id,
            departman_adi
          )
        `)
        .order('id');

      if (personalError) {
        console.error('Personel yükleme hatası:', personalError);
        throw personalError;
      }

      setPersonel(personalData || []);
      console.log('Personel yüklendi:', personalData?.length || 0);

      // Lokasyonları yükle - ✅ Doğru kolon adı kullanılıyor
      const { data: locationData, error: locationError } = await supabase
        .from('lokasyonlar')
        .select(`
          *,
          departmanlar:departman_id (
            id,
            departman_adi
          )
        `)
        .order('id');

      if (locationError) {
        console.error('Lokasyon yükleme hatası:', locationError);
        throw locationError;
      }

      setLokasyonlar(locationData || []);
      console.log('Lokasyonlar yüklendi:', locationData?.length || 0);

    } catch (error) {
      console.error('Veri yükleme genel hatası:', error);
      alert(`Veri yükleme hatası: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Düzenleme işlemi
  const handleEdit = (tableName, item) => {
    console.log('Düzenleme tıklandı:', tableName, item);
    setEditingItem({
      tableName,
      data: { ...item }
    });
  };

  // ✅ Kaydetme işlemi - Düzeltilmiş
  const saveEdit = async (tableName, item) => {
    try {
      console.log('Güncelleme işlemi başlatılıyor:', tableName, item);
      setLoading(true);

      // ✅ Veri temizleme ve doğrulama
      const updateData = { ...item };
      
      // ID'yi güncelleme verisinden çıkar (PostgreSQL hatası önlenir)
      delete updateData.id;
      
      // ✅ Lokasyonlar için özel işlem
      if (tableName === 'lokasyonlar') {
        // Eğer departmanlar field'ı varsa departman_id'ye çevir
        if (updateData.departmanlar) {
          updateData.departman_id = updateData.departmanlar;
          delete updateData.departmanlar;
        }
        
        // Nested departmanlar objesini temizle
        if (updateData.departmanlar && typeof updateData.departmanlar === 'object') {
          delete updateData.departmanlar;
        }
      }

      // ✅ Personel için özel işlem
      if (tableName === 'personel') {
        // Nested departmanlar objesini temizle
        if (updateData.departmanlar && typeof updateData.departmanlar === 'object') {
          delete updateData.departmanlar;
        }
      }

      console.log('Temizlenmiş güncelleme verisi:', updateData);

      // ✅ Supabase güncelleme işlemi
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
      
      // ✅ UI'ı güncelle
      setEditingItem(null);
      
      // ✅ Verileri yeniden yükle
      await loadData();
      
      alert('Güncelleme başarılı!');
      
      return data;
    } catch (error) {
      console.error(`${tableName} güncelleme hatası:`, error);
      
      // ✅ Kullanıcı dostu hata mesajları
      let errorMessage = 'Güncelleme sırasında bir hata oluştu.';
      
      if (error.code === 'PGRST204') {
        errorMessage = 'Veritabanı şemasında uyumsuzluk var. Lütfen geliştirici ile iletişime geçin.';
      } else if (error.code === '23514') {
        errorMessage = 'Girdiğiniz değerler geçerli değil. Lütfen kontrol edin.';
      } else if (error.code === '23503') {
        errorMessage = 'Seçtiğiniz departman geçerli değil.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Hata: ${errorMessage}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Silme işlemi
  const handleDelete = async (tableName, item) => {
    try {
      console.log('Silme tıklandı:', tableName, item);
      
      // ✅ Kullanıcı onayı
      const confirmed = window.confirm(
        `${tableName} kaydını silmek istediğinizden emin misiniz?\n\n` +
        `Bu işlem geri alınamaz ve ilişkili kayıtları da etkileyebilir.`
      );
      
      if (!confirmed) return;

      console.log('Silme işlemi başlatılıyor:', tableName, 'ID:', item.id);
      setLoading(true);

      const { data, error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', item.id)
        .select('*');

      if (error) {
        console.error('Silme hatası:', error);
        throw error;
      }

      console.log('Silme başarılı:', data);
      
      // ✅ Verileri yeniden yükle
      await loadData();
      
      alert('Kayıt başarıyla silindi!');

    } catch (error) {
      console.error(`${tableName} silme hatası:`, error);
      
      // ✅ Kullanıcı dostu hata mesajları
      let errorMessage = 'Silme sırasında bir hata oluştu.';
      
      if (error.code === '23503') {
        errorMessage = 'Bu kayıt başka kayıtlar tarafından kullanıldığı için silinemez.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Hata: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Component mount edildiğinde veri yükle
  useEffect(() => {
    loadData();
  }, []);

  // ✅ Loading durumu
  if (loading) {
    return (
      <div className="loading-container">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="setup-wizard">
      <h2>Sistem Kurulum Sihirbazı</h2>
      
      {/* ✅ Departmanlar Bölümü */}
      <section className="setup-section">
        <h3>Departmanlar ({departmanlar.length})</h3>
        <div className="data-grid">
          {departmanlar.map(dept => (
            <div key={dept.id} className="data-card">
              <h4>{dept.departman_adi}</h4>
              <p>Kod: {dept.departman_kodu}</p>
              <div className="actions">
                <button 
                  onClick={() => handleEdit('departmanlar', dept)}
                  disabled={loading}
                >
                  Düzenle
                </button>
                <button 
                  onClick={() => handleDelete('departmanlar', dept)}
                  disabled={loading}
                  className="delete-btn"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ✅ Personel Bölümü */}
      <section className="setup-section">
        <h3>Personel ({personel.length})</h3>
        <div className="data-grid">
          {personel.map(person => (
            <div key={person.id} className="data-card">
              <h4>{person.ad} {person.soyad}</h4>
              <p>Sicil: {person.sicil_no}</p>
              <p>Departman: {person.departmanlar?.departman_adi || 'Belirtilmemiş'}</p>
              <div className="actions">
                <button 
                  onClick={() => handleEdit('personel', person)}
                  disabled={loading}
                >
                  Düzenle
                </button>
                <button 
                  onClick={() => handleDelete('personel', person)}
                  disabled={loading}
                  className="delete-btn"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ✅ Lokasyonlar Bölümü */}
      <section className="setup-section">
        <h3>Lokasyonlar ({lokasyonlar.length})</h3>
        <div className="data-grid">
          {lokasyonlar.map(location => (
            <div key={location.id} className="data-card">
              <h4>{location.lokasyon_adi}</h4>
              <p>Kod: {location.lokasyon_kodu}</p>
              <p>Tip: {location.lokasyon_tipi}</p>
              <p>Departman: {location.departmanlar?.departman_adi || 'Belirtilmemiş'}</p>
              <div className="actions">
                <button 
                  onClick={() => handleEdit('lokasyonlar', location)}
                  disabled={loading}
                >
                  Düzenle
                </button>
                <button 
                  onClick={() => handleDelete('lokasyonlar', location)}
                  disabled={loading}
                  className="delete-btn"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ✅ Düzenleme Modal */}
      {editingItem && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingItem.tableName} Düzenle</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              saveEdit(editingItem.tableName, editingItem.data);
            }}>
              {/* Form alanları editingItem.tableName'e göre dinamik olarak oluşturulur */}
              {Object.keys(editingItem.data).map(key => {
                if (key === 'id' || key === 'created_at' || key === 'updated_at' || key === 'departmanlar') {
                  return null; // Bu alanları gösterme
                }
                
                return (
                  <div key={key} className="form-group">
                    <label>{key}:</label>
                    <input
                      type="text"
                      value={editingItem.data[key] || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: {
                          ...editingItem.data,
                          [key]: e.target.value
                        }
                      })}
                    />
                  </div>
                );
              })}
              
              <div className="modal-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditingItem(null)}
                  disabled={loading}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupWizard;