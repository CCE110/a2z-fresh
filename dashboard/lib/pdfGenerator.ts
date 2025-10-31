import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Quote {
  quote_number: string
  created_at: string
  client_name: string
  project_address: string
  status: string
  subtotal_ex_gst: number
  gst_amount: number
  total_inc_gst: number
  client_notes: string | null
  exclusions: string[] | null
}

interface QuoteItem {
  item_name: string
  description: string | null
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  section: string
}

export async function generateQuotePDF(quote: Quote, items: QuoteItem[]) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPosition = 20

  const primaryColor: [number, number, number] = [41, 128, 185]
  const secondaryColor: [number, number, number] = [52, 73, 94]

  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('A2Z HYDRAULICS', pageWidth / 2, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Phone: +61 7 5651 2608 | Email: admin@a2zh.com.au', pageWidth / 2, 35, { align: 'center' })

  yPosition = 50

  doc.setTextColor(...secondaryColor)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('QUOTATION', 20, yPosition)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Quote #: ${quote.quote_number}`, pageWidth - 20, yPosition, { align: 'right' })
  doc.text(`Date: ${new Date(quote.created_at).toLocaleDateString()}`, pageWidth - 20, yPosition + 7, { align: 'right' })

  yPosition += 30

  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(0.5)
  doc.rect(20, yPosition, pageWidth - 40, 25)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENT INFORMATION', 25, yPosition + 7)
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Client: ${quote.client_name}`, 25, yPosition + 14)
  doc.text(`Address: ${quote.project_address}`, 25, yPosition + 21)

  yPosition += 35

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('QUOTE ITEMS', 20, yPosition)
  
  yPosition += 5

  const itemsBySection = items.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, QuoteItem[]>)

  for (const [section, sectionItems] of Object.entries(itemsBySection)) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...secondaryColor)
    doc.text(section.replace('_', ' ').toUpperCase(), 20, yPosition)
    yPosition += 5

    const tableData = sectionItems.map(item => [
      item.item_name + (item.description ? `\n${item.description}` : ''),
      item.quantity.toString(),
      item.unit,
      `$${item.unit_price.toFixed(2)}`,
      `$${item.total_price.toFixed(2)}`
    ])

    const sectionTotal = sectionItems.reduce((sum, item) => sum + item.total_price, 0)

    autoTable(doc, {
      startY: yPosition,
      head: [['Item', 'Qty', 'Unit', 'Price', 'Total']],
      body: tableData,
      foot: [[{ content: `Section Total: $${sectionTotal.toFixed(2)}`, colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }]],
      theme: 'striped',
      headStyles: { fillColor: primaryColor, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 10
  }

  const totalsX = pageWidth - 90
  const totalsY = yPosition + 10

  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(0.5)
  doc.rect(totalsX, totalsY, 70, 35)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...secondaryColor)
  
  doc.text('Subtotal (ex GST):', totalsX + 5, totalsY + 8)
  doc.text(`$${quote.subtotal_ex_gst.toFixed(2)}`, totalsX + 65, totalsY + 8, { align: 'right' })
  
  doc.text('GST (10%):', totalsX + 5, totalsY + 16)
  doc.text(`$${quote.gst_amount.toFixed(2)}`, totalsX + 65, totalsY + 16, { align: 'right' })

  doc.setLineWidth(0.3)
  doc.line(totalsX + 5, totalsY + 20, totalsX + 65, totalsY + 20)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL (inc GST):', totalsX + 5, totalsY + 28)
  doc.text(`$${quote.total_inc_gst.toFixed(2)}`, totalsX + 65, totalsY + 28, { align: 'right' })

  const fileName = `${quote.quote_number.replace(/\//g, '-')}_${quote.client_name.replace(/\s+/g, '_')}.pdf`
  doc.save(fileName)

  return fileName
}