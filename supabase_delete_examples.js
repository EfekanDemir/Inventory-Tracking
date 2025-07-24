// ==============================================
// SUPABASE DELETE İŞLEMLERİ - EKİPMAN ENVANTERİ
// ==============================================

import { supabase } from '../config/supabase.js'

// 1. TEK KAYIT SİLME
const deleteSingleEquipment = async (equipmentId) => {
  try {
    const { data, error } = await supabase
      .from('ekipman_envanteri')
      .delete()
      .eq('id', equipmentId)
      .select()

    if (error) {
      console.error('Silme hatası:', error)
      throw error
    }

    console.log('Silinen kayıt:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Silme işlemi başarısız:', error)
    return { success: false, error }
  }
}

// 2. BARKOD İLE SİLME
const deleteEquipmentByBarcode = async (barcode) => {
  try {
    const { data, error } = await supabase
      .from('ekipman_envanteri')
      .delete()
      .eq('barkod', barcode)
      .select()

    if (error) {
      console.error('Barkod ile silme hatası:', error)
      throw error
    }

    console.log('Barkod ile silinen kayıt:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Barkod ile silme işlemi başarısız:', error)
    return { success: false, error }
  }
}

// 3. ÇOKLU KAYIT SİLME (ID listesi ile)
const deleteMultipleEquipment = async (equipmentIds) => {
  try {
    const { data, error } = await supabase
      .from('ekipman_envanteri')
      .delete()
      .in('id', equipmentIds)
      .select()

    if (error) {
      console.error('Çoklu silme hatası:', error)
      throw error
    }

    console.log('Silinen kayıt sayısı:', data.length)
    return { success: true, data, count: data.length }
  } catch (error) {
    console.error('Çoklu silme işlemi başarısız:', error)
    return { success: false, error }
  }
}

// 4. KOŞULLU SİLME (Lokasyon bazlı)
const deleteEquipmentByLocation = async (locationId) => {
  try {
    const { data, error } = await supabase
      .from('ekipman_envanteri')
      .delete()
      .eq('lokasyon_id', locationId)
      .select()

    if (error) {
      console.error('Lokasyon bazlı silme hatası:', error)
      throw error
    }

    console.log('Lokasyondan silinen ekipman sayısı:', data.length)
    return { success: true, data, count: data.length }
  } catch (error) {
    console.error('Lokasyon bazlı silme işlemi başarısız:', error)
    return { success: false, error }
  }
}

// 5. DURUM BAZLI SİLME (Arızalı ekipmanlar)
const deleteBrokenEquipment = async () => {
  try {
    const { data, error } = await supabase
      .from('ekipman_envanteri')
      .delete()
      .eq('calismma_durumu', 'Arızalı')
      .select()

    if (error) {
      console.error('Arızalı ekipman silme hatası:', error)
      throw error
    }

    console.log('Silinen arızalı ekipman sayısı:', data.length)
    return { success: true, data, count: data.length }
  } catch (error) {
    console.error('Arızalı ekipman silme işlemi başarısız:', error)
    return { success: false, error }
  }
}

// 6. TARİH BAZLI SİLME (Eski ekipmanlar)
const deleteOldEquipment = async (olderThanDate) => {
  try {
    const { data, error } = await supabase
      .from('ekipman_envanteri')
      .delete()
      .lt('satin_alma_tarihi', olderThanDate)
      .select()

    if (error) {
      console.error('Eski ekipman silme hatası:', error)
      throw error
    }

    console.log('Silinen eski ekipman sayısı:', data.length)
    return { success: true, data, count: data.length }
  } catch (error) {
    console.error('Eski ekipman silme işlemi başarısız:', error)
    return { success: false, error }
  }
}

// 7. SOFT DELETE (Güvenli silme)
const softDeleteEquipment = async (equipmentId, deletedByUserId) => {
  try {
    const { data, error } = await supabase
      .from('ekipman_envanteri')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: deletedByUserId
      })
      .eq('id', equipmentId)
      .eq('is_deleted', false) // Sadece aktif kayıtları güncelle
      .select()

    if (error) {
      console.error('Soft delete hatası:', error)
      throw error
    }

    console.log('Soft delete edilen kayıt:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Soft delete işlemi başarısız:', error)
    return { success: false, error }
  }
}

// 8. SOFT DELETE GERİ YÜKLEME
const restoreSoftDeletedEquipment = async (equipmentId, restoredByUserId) => {
  try {
    const { data, error } = await supabase
      .from('ekipman_envanteri')
      .update({
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
        updated_by: restoredByUserId
      })
      .eq('id', equipmentId)
      .eq('is_deleted', true) // Sadece silinmiş kayıtları güncelle
      .select()

    if (error) {
      console.error('Geri yükleme hatası:', error)
      throw error
    }

    console.log('Geri yüklenen kayıt:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Geri yükleme işlemi başarısız:', error)
    return { success: false, error }
  }
}

// 9. SİLME ÖNCESİ KONTROL
const checkEquipmentBeforeDelete = async (equipmentId) => {
  try {
    // Önce ekipmanı kontrol et
    const { data: equipment, error: fetchError } = await supabase
      .from('ekipman_envanteri')
      .select(`
        id,
        barkod,
        lokasyon_id,
        atanan_personel_id,
        calismma_durumu,
        lokasyonlar(lokasyon_adi),
        personel(ad, soyad)
      `)
      .eq('id', equipmentId)
      .single()

    if (fetchError) {
      console.error('Ekipman kontrol hatası:', fetchError)
      throw fetchError
    }

    if (!equipment) {
      return { success: false, error: 'Ekipman bulunamadı' }
    }

    // Silme işlemi için onay mesajı oluştur
    const confirmationMessage = `
      Ekipman Silme Onayı:
      - Barkod: ${equipment.barkod}
      - Lokasyon: ${equipment.lokasyonlar?.lokasyon_adi}
      - Atanan Personel: ${equipment.personel ? `${equipment.personel.ad} ${equipment.personel.soyad}` : 'Atanmamış'}
      - Durum: ${equipment.calismma_durumu}
      
      Bu ekipmanı silmek istediğinizden emin misiniz?
    `

    return { 
      success: true, 
      equipment, 
      confirmationMessage 
    }
  } catch (error) {
    console.error('Ekipman kontrol işlemi başarısız:', error)
    return { success: false, error }
  }
}

// 10. TOPLU SİLME İŞLEMİ (Güvenli)
const safeBulkDelete = async (equipmentIds, userId) => {
  try {
    // Önce silinecek ekipmanları kontrol et
    const { data: equipmentToDelete, error: checkError } = await supabase
      .from('ekipman_envanteri')
      .select('id, barkod, calismma_durumu')
      .in('id', equipmentIds)

    if (checkError) {
      console.error('Toplu silme kontrol hatası:', checkError)
      throw checkError
    }

    console.log(`${equipmentToDelete.length} ekipman silinecek`)

    // Soft delete uygula
    const { data: deletedData, error: deleteError } = await supabase
      .from('ekipman_envanteri')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      })
      .in('id', equipmentIds)
      .eq('is_deleted', false)
      .select()

    if (deleteError) {
      console.error('Toplu soft delete hatası:', deleteError)
      throw deleteError
    }

    console.log(`${deletedData.length} ekipman başarıyla soft delete edildi`)
    return { 
      success: true, 
      deletedCount: deletedData.length,
      deletedEquipment: deletedData 
    }
  } catch (error) {
    console.error('Toplu silme işlemi başarısız:', error)
    return { success: false, error }
  }
}

// 11. KULLANIM ÖRNEKLERİ
const usageExamples = async () => {
  console.log('=== SUPABASE DELETE KULLANIM ÖRNEKLERİ ===')

  // Tek kayıt silme
  await deleteSingleEquipment(123)

  // Barkod ile silme
  await deleteEquipmentByBarcode('TEST001')

  // Çoklu silme
  await deleteMultipleEquipment([1, 2, 3, 4, 5])

  // Lokasyon bazlı silme
  await deleteEquipmentByLocation(2)

  // Arızalı ekipmanları silme
  await deleteBrokenEquipment()

  // 5 yıldan eski ekipmanları silme
  const fiveYearsAgo = new Date()
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
  await deleteOldEquipment(fiveYearsAgo.toISOString().split('T')[0])

  // Soft delete
  await softDeleteEquipment(123, 1)

  // Soft delete geri yükleme
  await restoreSoftDeletedEquipment(123, 1)

  // Silme öncesi kontrol
  const checkResult = await checkEquipmentBeforeDelete(123)
  if (checkResult.success) {
    console.log(checkResult.confirmationMessage)
    // Kullanıcı onayı sonrası silme işlemi
    await deleteSingleEquipment(123)
  }

  // Güvenli toplu silme
  await safeBulkDelete([1, 2, 3, 4, 5], 1)
}

// 12. HATA YÖNETİMİ ÖRNEKLERİ
const handleDeleteErrors = async (equipmentId) => {
  try {
    const result = await deleteSingleEquipment(equipmentId)
    
    if (!result.success) {
      // Foreign key hatası kontrolü
      if (result.error.code === '23503') {
        console.error('Bu ekipman başka tablolarda kullanılıyor')
        // Önce bağımlı kayıtları sil
        return
      }
      
      // RLS (Row Level Security) hatası
      if (result.error.code === '42501') {
        console.error('Bu işlem için yetkiniz yok')
        return
      }
      
      // Genel hata
      console.error('Bilinmeyen hata:', result.error)
    }
  } catch (error) {
    console.error('Beklenmeyen hata:', error)
  }
}

export {
  deleteSingleEquipment,
  deleteEquipmentByBarcode,
  deleteMultipleEquipment,
  deleteEquipmentByLocation,
  deleteBrokenEquipment,
  deleteOldEquipment,
  softDeleteEquipment,
  restoreSoftDeletedEquipment,
  checkEquipmentBeforeDelete,
  safeBulkDelete,
  usageExamples,
  handleDeleteErrors
} 