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
    const { error } = await supabase.functions.invoke('send-email', {
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
    const { error } = await supabase.functions.invoke('send-sms', {
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

// Sistem yöneticilerinin e-posta adreslerini getir
const getAdminEmails = async () => {
  try {
    // Kullanıcı rolleri tablosu (geliştirilecek)
    const { data, error } = await supabase
      .from('user_roles')
      .select('email')
      .eq('role', 'admin')

    if (error) throw error

    return data?.map(user => user.email) || []
  } catch (error) {
    console.error('Admin e-postaları getirme hatası:', error)
    // Varsayılan admin e-postaları
    return ['admin@envanter.com']
  }
}

// Ekipman hatırlatma bildirimi
export const sendMaintenanceReminder = async (equipment, reminderType = 'maintenance') => {
  try {
    const subject = `${reminderType === 'maintenance' ? 'Bakım' : 'Kontrol'} Hatırlatması: ${equipment.marka_model}`
    const message = `Aşağıdaki ekipman için ${reminderType === 'maintenance' ? 'bakım' : 'kontrol'} zamanı geldi:\n\nMarka/Model: ${equipment.marka_model}\nMAC Adresi: ${equipment.mac_adresi || 'Belirtilmedi'}\nSeri No: ${equipment.seri_no || 'Belirtilmedi'}\nKonum: ${equipment.konum}\nAgent: ${equipment.agent || 'Belirtilmedi'}\n\nLütfen gerekli işlemleri yapınız.`

    const adminEmails = await getAdminEmails()
    const notifications = []

    for (const adminEmail of adminEmails) {
      notifications.push(sendEmailNotification(adminEmail, subject, message, equipment))
    }

    await Promise.all(notifications)

    return { success: true, message: 'Hatırlatma bildirimleri gönderildi!' }
  } catch (error) {
    console.error('Hatırlatma bildirimi hatası:', error)
    return { success: false, message: 'Hatırlatma bildirimleri gönderilemedi.' }
  }
}

// Toplu bildirim gönderme
export const sendBulkNotification = async (recipients, subject, message, type = 'email') => {
  try {
    const notifications = []

    for (const recipient of recipients) {
      if (type === 'email') {
        notifications.push(sendEmailNotification(recipient, subject, message))
      } else if (type === 'sms') {
        notifications.push(sendSMSNotification(recipient, message))
      }
    }

    const results = await Promise.allSettled(notifications)
    const successful = results.filter(result => result.status === 'fulfilled' && result.value.success)
    const failed = results.filter(result => result.status === 'rejected' || !result.value.success)

    return {
      success: true,
      message: `${successful.length} bildirim gönderildi, ${failed.length} başarısız.`,
      details: { successful: successful.length, failed: failed.length }
    }
  } catch (error) {
    console.error('Toplu bildirim hatası:', error)
    return { success: false, message: 'Toplu bildirim gönderilemedi.' }
  }
}

// Browser bildirimi (Push Notification)
export const showBrowserNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    toast.info('Tarayıcınız bildirim desteklemiyor.')
    return
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    })
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options
        })
      }
    })
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