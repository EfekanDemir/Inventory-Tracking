import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'

// E-posta bildirimi gönder (Supabase Edge Function kullanarak)
export const sendEmailNotification = async (recipientEmail, subject, message, equipmentData = null) => {
  try {
    const emailData = {
      to: recipientEmail,
      subject,
      message,
      equipment: equipmentData,
      timestamp: new Date().toISOString(),
    }

    // Supabase Edge Function çağrısı (geliştirilecek)
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: emailData
    })

    if (error) throw error

    // Bildirim kaydını veritabanına kaydet
    await logNotification({
      type: 'email',
      recipient: recipientEmail,
      subject,
      message,
      status: 'sent',
      equipment_id: equipmentData?.id || null,
    })

    return { success: true, message: 'E-posta başarıyla gönderildi!' }
  } catch (error) {
    console.error('E-posta gönderme hatası:', error)
    
    // Başarısız bildirim kaydı
    await logNotification({
      type: 'email',
      recipient: recipientEmail,
      subject,
      message,
      status: 'failed',
      equipment_id: equipmentData?.id || null,
      error_message: error.message,
    })

    return { success: false, message: 'E-posta gönderilemedi.' }
  }
}

// SMS bildirimi gönder (Supabase Edge Function kullanarak)
export const sendSMSNotification = async (phoneNumber, message, equipmentData = null) => {
  try {
    const smsData = {
      to: phoneNumber,
      message,
      equipment: equipmentData,
      timestamp: new Date().toISOString(),
    }

    // Supabase Edge Function çağrısı (geliştirilecek)
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: smsData
    })

    if (error) throw error

    // Bildirim kaydını veritabanına kaydet
    await logNotification({
      type: 'sms',
      recipient: phoneNumber,
      message,
      status: 'sent',
      equipment_id: equipmentData?.id || null,
    })

    return { success: true, message: 'SMS başarıyla gönderildi!' }
  } catch (error) {
    console.error('SMS gönderme hatası:', error)
    
    // Başarısız bildirim kaydı
    await logNotification({
      type: 'sms',
      recipient: phoneNumber,
      message,
      status: 'failed',
      equipment_id: equipmentData?.id || null,
      error_message: error.message,
    })

    return { success: false, message: 'SMS gönderilemedi.' }
  }
}

// Bildirim kaydını veritabanına kaydet
const logNotification = async (notificationData) => {
  try {
    const { error } = await supabase
      .from('bildirimler')
      .insert([notificationData])

    if (error) throw error
  } catch (error) {
    console.error('Bildirim kaydı hatası:', error)
  }
}

// Envanter değişikliği bildirimi
export const notifyInventoryChange = async (equipmentData, changeType, userEmail = null) => {
  try {
    const subject = `Envanter Değişikliği: ${equipmentData.marka_model}`
    let message = ''

    switch (changeType) {
      case 'created':
        message = `Yeni ekipman eklendi:\n\nMarka/Model: ${equipmentData.marka_model}\nMAC Adresi: ${equipmentData.mac_adresi || 'Belirtilmedi'}\nSeri No: ${equipmentData.seri_no || 'Belirtilmedi'}\nKonum: ${equipmentData.konum}\nAgent: ${equipmentData.agent || 'Belirtilmedi'}`
        break
      case 'updated':
        message = `Ekipman güncellendi:\n\nMarka/Model: ${equipmentData.marka_model}\nMAC Adresi: ${equipmentData.mac_adresi || 'Belirtilmedi'}\nSeri No: ${equipmentData.seri_no || 'Belirtilmedi'}\nKonum: ${equipmentData.konum}\nAgent: ${equipmentData.agent || 'Belirtilmedi'}`
        break
      case 'location_changed':
        message = `Ekipman konumu değişti:\n\nMarka/Model: ${equipmentData.marka_model}\nYeni Konum: ${equipmentData.konum}\nAgent: ${equipmentData.agent || 'Belirtilmedi'}`
        break
      case 'assigned':
        message = `Ekipman agent'a atandı:\n\nMarka/Model: ${equipmentData.marka_model}\nAgent: ${equipmentData.agent}\nKonum: ${equipmentData.konum}`
        break
      default:
        message = `Ekipman bilgileri güncellendi: ${equipmentData.marka_model}`
    }

    // Sistem yöneticilerine e-posta gönder
    const adminEmails = await getAdminEmails()
    const notifications = []

    for (const adminEmail of adminEmails) {
      if (adminEmail !== userEmail) { // Değişikliği yapan kişiye gönderme
        notifications.push(sendEmailNotification(adminEmail, subject, message, equipmentData))
      }
    }

    await Promise.all(notifications)

    return { success: true }
  } catch (error) {
    console.error('Envanter değişikliği bildirimi hatası:', error)
    return { success: false }
  }
}



// Toast bildirimi (başarı, hata, bilgi)
export const showToast = (message, type = 'info') => {
  switch (type) {
    case 'success':
      toast.success(message)
      break
    case 'error':
      toast.error(message)
      break
    case 'warning':
      toast(message, { icon: '⚠️' })
      break
    default:
      toast(message)
  }
} 