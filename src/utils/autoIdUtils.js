// Otomatik ID Atama Utility Fonksiyonları
import { supabase } from '../config/supabase'

/**
 * Yeni kayıt eklerken otomatik ID atama
 * @param {string} tableName - Tablo adı
 * @param {object} data - Eklenecek veri (id hariç)
 * @returns {object} - Eklenen kayıt
 */
export const insertWithAutoId = async (tableName, data) => {
  try {
    // ID'yi data'dan çıkar (otomatik atanacak)
    const { id, ...dataWithoutId } = data
    
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(dataWithoutId)
      .select()
      .single()
    
    if (error) {
      console.error(`${tableName} ekleme hatası:`, error)
      throw error
    }
    
    console.log(`${tableName} tablosuna otomatik ID ile kayıt eklendi:`, result)
    return result
    
  } catch (error) {
    console.error(`insertWithAutoId hatası (${tableName}):`, error)
    throw error
  }
}

/**
 * Toplu kayıt eklerken otomatik ID atama
 * @param {string} tableName - Tablo adı
 * @param {array} dataArray - Eklenecek veri dizisi (id'ler hariç)
 * @returns {array} - Eklenen kayıtlar
 */
export const insertManyWithAutoId = async (tableName, dataArray) => {
  try {
    // Tüm kayıtlardan ID'leri çıkar
    const dataWithoutIds = dataArray.map(({ id, ...data }) => data)
    
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(dataWithoutIds)
      .select()
    
    if (error) {
      console.error(`${tableName} toplu ekleme hatası:`, error)
      throw error
    }
    
    console.log(`${tableName} tablosuna ${result.length} kayıt otomatik ID ile eklendi`)
    return result
    
  } catch (error) {
    console.error(`insertManyWithAutoId hatası (${tableName}):`, error)
    throw error
  }
}

/**
 * Kayıt güncellerken ID kontrolü
 * @param {string} tableName - Tablo adı
 * @param {number} id - Güncellenecek kaydın ID'si
 * @param {object} data - Güncellenecek veri
 * @returns {object} - Güncellenmiş kayıt
 */
export const updateWithIdCheck = async (tableName, id, data) => {
  try {
    // ID'yi data'dan çıkar (URL'den geliyor)
    const { id: dataId, ...dataWithoutId } = data
    
    const { data: result, error } = await supabase
      .from(tableName)
      .update(dataWithoutId)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error(`${tableName} güncelleme hatası:`, error)
      throw error
    }
    
    console.log(`${tableName} tablosunda ID ${id} ile kayıt güncellendi:`, result)
    return result
    
  } catch (error) {
    console.error(`updateWithIdCheck hatası (${tableName}):`, error)
    throw error
  }
}

/**
 * SetupWizard için otomatik ID'li kayıt ekleme
 * @param {string} tableName - Tablo adı
 * @param {array} items - Eklenecek öğeler dizisi
 * @returns {array} - Eklenen kayıtlar
 */
export const setupWizardInsert = async (tableName, items) => {
  try {
    // Boş olmayan kayıtları filtrele ve ID'leri çıkar
    const validItems = items
      .filter(item => {
        // Tablo tipine göre validasyon
        switch (tableName) {
          case 'departmanlar':
            return item.departman_adi && item.departman_adi.trim() !== ''
          case 'lokasyonlar':
            return item.lokasyon_kodu && item.lokasyon_kodu.trim() !== '' &&
                   item.lokasyon_adi && item.lokasyon_adi.trim() !== ''
          case 'markalar':
            return item.marka_adi && item.marka_adi.trim() !== ''
          case 'modeller':
            return item.model_adi && item.model_adi.trim() !== '' &&
                   item.kategori && item.kategori.trim() !== ''
          case 'personel':
            return item.ad && item.ad.trim() !== '' &&
                   item.soyad && item.soyad.trim() !== ''
          default:
            return true
        }
      })
      .map(({ id, ...item }) => item) // ID'leri çıkar
    
    if (validItems.length === 0) {
      console.log(`${tableName} için geçerli kayıt bulunamadı`)
      return []
    }
    
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(validItems)
      .select()
    
    if (error) {
      console.error(`${tableName} SetupWizard ekleme hatası:`, error)
      throw error
    }
    
    console.log(`${tableName} tablosuna ${result.length} kayıt otomatik ID ile eklendi`)
    return result
    
  } catch (error) {
    console.error(`setupWizardInsert hatası (${tableName}):`, error)
    throw error
  }
}

/**
 * Veritabanı durumunu kontrol et
 * @returns {object} - Tablo durumları
 */
export const checkDatabaseStatus = async () => {
  try {
    const tables = ['departmanlar', 'lokasyonlar', 'markalar', 'modeller', 'personel', 
                   'ekipman_envanteri', 'ekipman_gecmisi', 'seri_numaralari', 'mac_adresleri']
    
    const status = {}
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1)
        
        if (error) {
          status[tableName] = { hasId: false, error: error.message }
        } else {
          status[tableName] = { hasId: true, error: null }
        }
      } catch (err) {
        status[tableName] = { hasId: false, error: err.message }
      }
    }
    
    return status
    
  } catch (error) {
    console.error('Veritabanı durum kontrolü hatası:', error)
    throw error
  }
}

/**
 * Otomatik ID atama fonksiyonunu çalıştır
 * @returns {string} - Sonuç mesajı
 */
export const runAutoIdAssignment = async () => {
  try {
    const { data, error } = await supabase
      .rpc('auto_assign_ids')
    
    if (error) {
      console.error('Otomatik ID atama hatası:', error)
      throw error
    }
    
    return 'Otomatik ID atama başarıyla tamamlandı'
    
  } catch (error) {
    console.error('runAutoIdAssignment hatası:', error)
    throw error
  }
} 