import QRCode from 'qrcode'

// Tek bir ekipman için QR kod oluştur
export const generateQRCode = async (equipment) => {
  try {
    const qrData = {
      id: equipment.id,
      mac_adresi: equipment.mac_adresi,
      marka_model: equipment.marka_model,
      seri_no: equipment.seri_no,
      konum: equipment.konum,
      url: `${window.location.origin}/inventory/view/${equipment.id}`
    }

    const qrString = JSON.stringify(qrData)
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return { success: true, dataURL: qrCodeDataURL, data: qrData }
  } catch (error) {
    console.error('QR kod oluşturma hatası:', error)
    return { success: false, error: 'QR kod oluşturulamadı.' }
  }
}

// QR kod için SVG formatı oluştur
export const generateQRCodeSVG = async (equipment) => {
  try {
    const qrData = {
      id: equipment.id,
      mac_adresi: equipment.mac_adresi,
      marka_model: equipment.marka_model,
      seri_no: equipment.seri_no,
      konum: equipment.konum,
      url: `${window.location.origin}/inventory/view/${equipment.id}`
    }

    const qrString = JSON.stringify(qrData)
    const qrCodeSVG = await QRCode.toString(qrString, {
      type: 'svg',
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return { success: true, svg: qrCodeSVG, data: qrData }
  } catch (error) {
    console.error('QR kod SVG oluşturma hatası:', error)
    return { success: false, error: 'QR kod SVG oluşturulamadı.' }
  }
}

// Birden fazla ekipman için QR kodları oluştur
export const generateBulkQRCodes = async (equipmentList) => {
  try {
    const qrCodes = []
    
    for (const equipment of equipmentList) {
      const result = await generateQRCode(equipment)
      if (result.success) {
        qrCodes.push({
          equipment,
          qrCode: result.dataURL,
          qrData: result.data
        })
      }
    }

    return { success: true, qrCodes }
  } catch (error) {
    console.error('Toplu QR kod oluşturma hatası:', error)
    return { success: false, error: 'Toplu QR kod oluşturulamadı.' }
  }
}

// QR kod yazdırma sayfası oluştur
export const createQRCodePrintPage = (qrCodes) => {
  try {
    const printWindow = window.open('', '_blank')
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Kodları - Envanter Takip Sistemi</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #1976d2;
              padding-bottom: 20px;
            }
            .qr-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            .qr-item {
              border: 2px solid #e0e0e0;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              background: white;
              break-inside: avoid;
            }
            .qr-code {
              width: 150px;
              height: 150px;
              margin: 10px auto;
            }
            .equipment-info {
              margin-top: 10px;
              font-size: 12px;
              line-height: 1.4;
            }
            .equipment-info strong {
              color: #1976d2;
            }
            @media print {
              .qr-grid {
                grid-template-columns: repeat(2, 1fr);
              }
              .qr-item {
                margin-bottom: 20px;
              }
            }
            @page {
              margin: 1cm;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Envanter QR Kodları</h1>
            <p>Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}</p>
            <p>Toplam ${qrCodes.length} adet QR kod</p>
          </div>
          
          <div class="qr-grid">
            ${qrCodes.map(item => `
              <div class="qr-item">
                <img src="${item.qrCode}" alt="QR Kod" class="qr-code" />
                <div class="equipment-info">
                  <strong>ID:</strong> ${item.equipment.id}<br>
                  <strong>Marka/Model:</strong> ${item.equipment.marka_model || '-'}<br>
                  <strong>MAC:</strong> ${item.equipment.mac_adresi || '-'}<br>
                  <strong>Seri No:</strong> ${item.equipment.seri_no || '-'}<br>
                  <strong>Konum:</strong> ${item.equipment.konum || '-'}
                </div>
              </div>
            `).join('')}
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()

    return { success: true }
  } catch (error) {
    console.error('QR kod yazdırma sayfası oluşturma hatası:', error)
    return { success: false, error: 'Yazdırma sayfası oluşturulamadı.' }
  }
}

// QR kod verilerini çöz
export const parseQRCodeData = (qrString) => {
  try {
    const data = JSON.parse(qrString)
    return { success: true, data }
  } catch (error) {
    console.error('QR kod çözme hatası:', error)
    return { success: false, error: 'QR kod verisi çözülemedi.' }
  }
} 