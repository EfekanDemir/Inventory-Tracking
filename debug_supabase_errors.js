// ==============================================
// SUPABASE HATA AYIKLAMA SCRIPT'İ
// ==============================================

import { supabase } from '../config/supabase.js'

// 1. Tablo yapısını kontrol et
const checkTableStructure = async () => {
  console.log('=== TABLO YAPISI KONTROLÜ ===')
  
  try {
    // Ekipman envanteri tablosunun sütunlarını kontrol et
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'ekipman_envanteri')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    if (columnsError) {
      console.error('Sütun bilgileri alınamadı:', columnsError)
      return
    }

    console.log('Ekipman envanteri tablosu sütunları:')
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`)
    })

    // MAC adresi ve seri numarası sütunlarının varlığını kontrol et
    const hasMacAdresi = columns.some(col => col.column_name === 'mac_adresi')
    const hasSeriNo = columns.some(col => col.column_name === 'seri_no')
    const hasMacAdresiId = columns.some(col => col.column_name === 'mac_adresi_id')
    const hasSeriNoId = columns.some(col => col.column_name === 'seri_no_id')

    console.log('\nSütun varlık kontrolü:')
    console.log(`- mac_adresi: ${hasMacAdresi ? 'VAR' : 'YOK'}`)
    console.log(`- seri_no: ${hasSeriNo ? 'VAR' : 'YOK'}`)
    console.log(`- mac_adresi_id: ${hasMacAdresiId ? 'VAR' : 'YOK'}`)
    console.log(`- seri_no_id: ${hasSeriNoId ? 'VAR' : 'YOK'}`)

    if (hasMacAdresi && hasSeriNo) {
      console.log('\n⚠️  ESKI YAPI KULLANILIYOR - mac_adresi ve seri_no sütunları var')
    } else if (hasMacAdresiId && hasSeriNoId) {
      console.log('\n✅ YENI YAPI KULLANILIYOR - mac_adresi_id ve seri_no_id sütunları var')
    } else {
      console.log('\n❌ KARISIK YAPI - Hem eski hem yeni sütunlar eksik')
    }

  } catch (error) {
    console.error('Tablo yapısı kontrolü hatası:', error)
  }
}

// 2. Örnek veri ekleme testi
const testDataInsertion = async () => {
  console.log('\n=== VERİ EKLEME TESTİ ===')
  
  try {
    // Önce mevcut MAC adresleri ve seri numaralarını kontrol et
    const { data: macAddresses, error: macError } = await supabase
      .from('mac_adresleri')
      .select('id, mac_adresi')
      .limit(1)

    const { data: serialNumbers, error: serialError } = await supabase
      .from('seri_numaralari')
      .select('id, seri_no')
      .limit(1)

    if (macError) {
      console.error('MAC adresleri kontrolü hatası:', macError)
      return
    }

    if (serialError) {
      console.error('Seri numaraları kontrolü hatası:', serialError)
      return
    }

    console.log('Mevcut MAC adresleri:', macAddresses?.length || 0)
    console.log('Mevcut seri numaraları:', serialNumbers?.length || 0)

    if (macAddresses.length === 0 || serialNumbers.length === 0) {
      console.log('❌ Test için yeterli veri yok - Önce sistem kurulumu yapın')
      return
    }

    // Test verisi hazırla
    const testData = {
      mac_adresi_id: macAddresses[0].id,
      seri_no_id: serialNumbers[0].id,
      barkod: `TEST-${Date.now()}`,
      marka_id: 1,
      model_id: 1,
      lokasyon_id: 1,
      atanan_personel_id: 1,
      aciklama: 'Test ekipmanı'
    }

    console.log('Test verisi:', testData)

    // Veriyi eklemeyi dene
    const { data, error } = await supabase
      .from('ekipman_envanteri')
      .insert([testData])
      .select()

    if (error) {
      console.error('❌ Veri ekleme hatası:', error)
      
      // Hata detaylarını analiz et
      if (error.code === 'PGRST204') {
        console.log('🔍 HATA ANALİZİ: Sütun bulunamadı hatası')
        console.log('Bu hata, uygulamanın beklediği sütunların veritabanında olmadığını gösterir.')
        console.log('Çözüm: Tablo yapısını uygulama ile uyumlu hale getirin.')
      } else if (error.code === '23503') {
        console.log('🔍 HATA ANALİZİ: Foreign key hatası')
        console.log('Bu hata, referans verilen tablolarda ilgili kayıtların bulunamadığını gösterir.')
        console.log('Çözüm: Önce referans verilen tablolarda gerekli kayıtları oluşturun.')
      } else if (error.code === '23505') {
        console.log('🔍 HATA ANALİZİ: Unique constraint hatası')
        console.log('Bu hata, aynı değerin tekrar eklenmeye çalışıldığını gösterir.')
        console.log('Çözüm: Benzersiz değerler kullanın.')
      }
    } else {
      console.log('✅ Test verisi başarıyla eklendi:', data)
      
      // Test verisini temizle
      await supabase
        .from('ekipman_envanteri')
        .delete()
        .eq('id', data[0].id)
      
      console.log('🧹 Test verisi temizlendi')
    }

  } catch (error) {
    console.error('Test veri ekleme hatası:', error)
  }
}

// 3. Mevcut verileri kontrol et
const checkExistingData = async () => {
  console.log('\n=== MEVCUT VERİ KONTROLÜ ===')
  
  try {
    // Ekipman envanteri
    const { data: equipment, error: equipmentError } = await supabase
      .from('ekipman_envanteri')
      .select('*')
      .limit(5)

    if (equipmentError) {
      console.error('Ekipman verisi kontrolü hatası:', equipmentError)
    } else {
      console.log(`Ekipman sayısı: ${equipment?.length || 0}`)
      if (equipment && equipment.length > 0) {
        console.log('Örnek ekipman:', equipment[0])
      }
    }

    // MAC adresleri
    const { data: macAddresses, error: macError } = await supabase
      .from('mac_adresleri')
      .select('*')
      .limit(5)

    if (macError) {
      console.error('MAC adresleri kontrolü hatası:', macError)
    } else {
      console.log(`MAC adresi sayısı: ${macAddresses?.length || 0}`)
      if (macAddresses && macAddresses.length > 0) {
        console.log('Örnek MAC adresi:', macAddresses[0])
      }
    }

    // Seri numaraları
    const { data: serialNumbers, error: serialError } = await supabase
      .from('seri_numaralari')
      .select('*')
      .limit(5)

    if (serialError) {
      console.error('Seri numaraları kontrolü hatası:', serialError)
    } else {
      console.log(`Seri numarası sayısı: ${serialNumbers?.length || 0}`)
      if (serialNumbers && serialNumbers.length > 0) {
        console.log('Örnek seri numarası:', serialNumbers[0])
      }
    }

  } catch (error) {
    console.error('Mevcut veri kontrolü hatası:', error)
  }
}

// 4. Ana debug fonksiyonu
const debugSupabaseIssues = async () => {
  console.log('🔍 SUPABASE HATA AYIKLAMA BAŞLATILIYOR...')
  
  await checkTableStructure()
  await checkExistingData()
  await testDataInsertion()
  
  console.log('\n🎯 ÖNERİLER:')
  console.log('1. Tablo yapısı eski ise: convert_to_foreign_keys.sql scriptini çalıştırın')
  console.log('2. Tablo yapısı yeni ise: Uygulama kodunu güncelleyin')
  console.log('3. Veri yoksa: Önce sistem kurulumu yapın')
  console.log('4. Hala sorun varsa: Supabase loglarını kontrol edin')
}

// 5. Hızlı düzeltme önerileri
const getQuickFixes = () => {
  console.log('\n🚀 HIZLI DÜZELTME ÖNERİLERİ:')
  
  console.log('\nA) Eski yapıdan yeni yapıya geçiş:')
  console.log('1. convert_to_foreign_keys.sql dosyasını Supabase SQL editöründe çalıştırın')
  console.log('2. Uygulamayı yeniden başlatın')
  
  console.log('\nB) Yeni yapıdan eski yapıya geçiş:')
  console.log('1. supabase_setup.sql dosyasını Supabase SQL editöründe çalıştırın')
  console.log('2. Uygulamayı yeniden başlatın')
  
  console.log('\nC) Temiz başlangıç:')
  console.log('1. Tüm tabloları silin')
  console.log('2. supabase_setup.sql dosyasını çalıştırın')
  console.log('3. Sistem kurulumunu yapın')
  console.log('4. Uygulamayı yeniden başlatın')
}

export {
  checkTableStructure,
  testDataInsertion,
  checkExistingData,
  debugSupabaseIssues,
  getQuickFixes
}

// Kullanım örneği:
// debugSupabaseIssues().then(() => getQuickFixes()) 