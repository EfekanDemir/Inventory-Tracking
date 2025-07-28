import * as XLSX from 'xlsx'

// Envanter verilerini Excel'e aktar
export const exportToExcel = (data, filename = 'envanter_listesi') => {
  try {
    // Verileri Excel formatına uygun hale getir
    const excelData = data.map(item => ({
      'ID': item.id,
      'MAC Adresi': item.mac_adresi || '',
      'Marka/Model': item.marka_model || '',
      'Seri No': item.seri_no || '',
      'Konum': item.konum || '',
      'Agent': item.agent_name || item.agent || '',
      'Çıkış Tarihi': item.ofisten_cikis_tarihi ? 
        new Date(item.ofisten_cikis_tarihi).toLocaleDateString('tr-TR') : '',
      'Açıklama': item.aciklama || '',
      'Kayıt Tarihi': new Date(item.created_at).toLocaleDateString('tr-TR'),
    }))

    // Workbook oluştur
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Sütun genişliklerini ayarla
    const colWidths = [
      { wch: 8 },   // ID
      { wch: 18 },  // MAC Adresi
      { wch: 25 },  // Marka/Model
      { wch: 15 },  // Seri No
      { wch: 12 },  // Konum
      { wch: 20 },  // Agent
      { wch: 12 },  // Çıkış Tarihi
      { wch: 30 },  // Açıklama
      { wch: 12 },  // Kayıt Tarihi
    ]
    ws['!cols'] = colWidths

    // Worksheet'i workbook'a ekle
    XLSX.utils.book_append_sheet(wb, ws, 'Envanter Listesi')

    // Dosyayı indir
    const timestamp = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`)

    return { success: true, message: 'Excel dosyası başarıyla indirildi!' }
  } catch (error) {
    console.error('Excel export hatası:', error)
    return { success: false, message: 'Excel export sırasında hata oluştu.' }
  }
}

// Filtrelenmiş verileri Excel'e aktar
export const exportFilteredToExcel = (data, filters, filename = 'filtrelenmiş_envanter') => {
  try {
    let filteredData = [...data]

    // Filtreleri uygula
    if (filters.konum && filters.konum !== 'Tümü') {
      filteredData = filteredData.filter(item => item.konum === filters.konum)
    }

    if (filters.agent) {
      filteredData = filteredData.filter(item => 
        item.agent?.toLowerCase().includes(filters.agent.toLowerCase())
      )
    }

    if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.created_at)
        return itemDate >= filters.dateRange.start && itemDate <= filters.dateRange.end
      })
    }

    return exportToExcel(filteredData, filename)
  } catch (error) {
    console.error('Filtered Excel export hatası:', error)
    return { success: false, message: 'Filtrelenmiş Excel export sırasında hata oluştu.' }
  }
}

// Raporlama için özet verilerini Excel'e aktar
export const exportSummaryReport = (summaryData, filename = 'envanter_raporu') => {
  try {
    const wb = XLSX.utils.book_new()

    // Genel istatistikler sayfası
    const statsData = [
      ['Envanter Özet Raporu', ''],
      ['Rapor Tarihi', new Date().toLocaleDateString('tr-TR')],
      ['', ''],
      ['Genel İstatistikler', ''],
      ['Toplam Ekipman', summaryData.totalEquipment],
      ['Boşta Ekipman', summaryData.availableEquipment],
      ['Kullanımda Ekipman', summaryData.inUseEquipment],
      ['Aktif Agent Sayısı', summaryData.activeAgents],
      ['', ''],
      ['Konum Dağılımı', ''],
      ['BOŞTA', summaryData.locationStats?.BOŞTA || 0],
      ['AGENT', summaryData.locationStats?.AGENT || 0],
      ['EĞİTMEN', summaryData.locationStats?.EĞİTMEN || 0],
      ['AGENT TR', summaryData.locationStats?.['AGENT TR'] || 0],
    ]

    const statsWs = XLSX.utils.aoa_to_sheet(statsData)
    statsWs['!cols'] = [{ wch: 25 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, statsWs, 'İstatistikler')

    // Marka dağılımı sayfası (varsa)
    if (summaryData.brandStats && summaryData.brandStats.length > 0) {
      const brandData = [
        ['Marka/Model', 'Adet'],
        ...summaryData.brandStats.map(item => [item.brand, item.count])
      ]
      const brandWs = XLSX.utils.aoa_to_sheet(brandData)
      brandWs['!cols'] = [{ wch: 30 }, { wch: 10 }]
      XLSX.utils.book_append_sheet(wb, brandWs, 'Marka Dağılımı')
    }

    // Agent dağılımı sayfası (varsa)
    if (summaryData.agentStats && summaryData.agentStats.length > 0) {
      const agentData = [
        ['Agent', 'Ekipman Sayısı'],
        ...summaryData.agentStats.map(item => [item.agent, item.count])
      ]
      const agentWs = XLSX.utils.aoa_to_sheet(agentData)
      agentWs['!cols'] = [{ wch: 25 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(wb, agentWs, 'Agent Dağılımı')
    }

    // Dosyayı indir
    const timestamp = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`)

    return { success: true, message: 'Rapor başarıyla Excel formatında indirildi!' }
  } catch (error) {
    console.error('Summary report export hatası:', error)
    return { success: false, message: 'Rapor export sırasında hata oluştu.' }
  }
}

// Ekipman geçmişini Excel'e aktar
export const exportHistoryToExcel = (historyData, equipmentInfo, filename = 'ekipman_gecmisi') => {
  try {
    const wb = XLSX.utils.book_new()

    // Ekipman bilgileri sayfası
    const equipmentData = [
      ['Ekipman Bilgileri', ''],
      ['Rapor Tarihi', new Date().toLocaleDateString('tr-TR')],
      ['', ''],
      ['Marka/Model', equipmentInfo.marka_model || 'Bilinmiyor'],
      ['MAC Adresi', equipmentInfo.mac_adresi || 'Belirtilmedi'],
      ['Seri No', equipmentInfo.seri_no || 'Belirtilmedi'],
      ['Mevcut Konum', equipmentInfo.lokasyon_adi || 'Bilinmiyor'],
      ['Atanan Personel', equipmentInfo.atanan_personel || 'Atanmamış'],
      ['', ''],
    ]

    const equipmentWs = XLSX.utils.aoa_to_sheet(equipmentData)
    equipmentWs['!cols'] = [{ wch: 25 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, equipmentWs, 'Ekipman Bilgileri')

    // Geçmiş kayıtları sayfası
    const historyExcelData = historyData.map(record => ({
      'İşlem Tarihi': new Date(record.created_at).toLocaleString('tr-TR'),
      'İşlem Tipi': record.islem_tipi || record.hareket_tipi || 'Bilinmiyor',
      'Yapan Kişi': record.yapan_personel ? 
        `${record.yapan_personel.ad} ${record.yapan_personel.soyad}` : 
        record.degisiklik_yapan || 'Bilinmiyor',
      'Değişiklik Sayısı': record.degisiklik_sayisi || 0,
      'Açıklama': record.aciklama || record.hareket_nedeni || '',
      'Eski Lokasyon': record.eski_lokasyon?.lokasyon_adi || '',
      'Yeni Lokasyon': record.yeni_lokasyon?.lokasyon_adi || '',
      'Eski Personel': record.eski_personel ? 
        `${record.eski_personel.ad} ${record.eski_personel.soyad}` : '',
      'Yeni Personel': record.yeni_personel ? 
        `${record.yeni_personel.ad} ${record.yeni_personel.soyad}` : '',
    }))

    const historyWs = XLSX.utils.json_to_sheet(historyExcelData)
    historyWs['!cols'] = [
      { wch: 20 }, // İşlem Tarihi
      { wch: 15 }, // İşlem Tipi
      { wch: 25 }, // Yapan Kişi
      { wch: 15 }, // Değişiklik Sayısı
      { wch: 30 }, // Açıklama
      { wch: 20 }, // Eski Lokasyon
      { wch: 20 }, // Yeni Lokasyon
      { wch: 25 }, // Eski Personel
      { wch: 25 }, // Yeni Personel
    ]
    XLSX.utils.book_append_sheet(wb, historyWs, 'İşlem Geçmişi')

    // Detaylı değişiklikler sayfası (varsa)
    const detailedChanges = []
    historyData.forEach(record => {
      if (record.degisiklik_detaylari && record.degisiklik_detaylari.length > 0) {
        record.degisiklik_detaylari.forEach(change => {
          detailedChanges.push({
            'İşlem Tarihi': new Date(record.created_at).toLocaleString('tr-TR'),
            'İşlem Tipi': record.islem_tipi || record.hareket_tipi || 'Bilinmiyor',
            'Değişen Alan': change.field_label || change.field || 'Bilinmiyor',
            'Eski Değer': change.old_display || change.oldValue || '',
            'Yeni Değer': change.new_display || change.newValue || '',
            'Yapan Kişi': record.yapan_personel ? 
              `${record.yapan_personel.ad} ${record.yapan_personel.soyad}` : 
              record.degisiklik_yapan || 'Bilinmiyor',
          })
        })
      }
    })

    if (detailedChanges.length > 0) {
      const detailedWs = XLSX.utils.json_to_sheet(detailedChanges)
      detailedWs['!cols'] = [
        { wch: 20 }, // İşlem Tarihi
        { wch: 15 }, // İşlem Tipi
        { wch: 20 }, // Değişen Alan
        { wch: 25 }, // Eski Değer
        { wch: 25 }, // Yeni Değer
        { wch: 25 }, // Yapan Kişi
      ]
      XLSX.utils.book_append_sheet(wb, detailedWs, 'Detaylı Değişiklikler')
    }

    // Dosyayı indir
    const timestamp = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`)

    return { success: true, message: 'Ekipman geçmişi başarıyla Excel formatında indirildi!' }
  } catch (error) {
    console.error('History export hatası:', error)
    return { success: false, message: 'Geçmiş export sırasında hata oluştu.' }
  }
} 