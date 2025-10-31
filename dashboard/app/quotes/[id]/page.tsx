'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import QuoteEditMode from '@/components/QuoteEditMode'
import AddItemsModal from '@/components/AddItemsModal'
import StatusWorkflow from '@/components/StatusWorkflow'
import { generateQuotePDF } from '@/lib/pdfGenerator'

interface Quote {
  id: string
  quote_number: string
  created_at: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  project_address: string
  project_type: string | null
  status: string
  subtotal_ex_gst: number
  gst_amount: number
  total_inc_gst: number
  ai_confidence_avg: number | null
  ai_generated: boolean
  client_notes: string | null
  exclusions: string[] | null
}

interface QuoteItem {
  id: string
  item_name: string
  description: string | null
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  section: string
  ai_suggested: boolean
  ai_confidence: number | null
  manually_modified: boolean
}

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [showAddItems, setShowAddItems] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  useEffect(() => {
    loadQuote()
  }, [id])

  async function loadQuote() {
    try {
      const supabase = createClient()
      
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single()
      
      if (quoteError) throw quoteError
      setQuote(quoteData)
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', id)
        .order('section')
        .order('sort_order')
      
      if (itemsError) throw itemsError
      setItems(itemsData || [])
    } catch (error) {
      console.error('Error loading quote:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = () => {
    setIsEditMode(false)
    loadQuote()
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    loadQuote()
  }

  const handleItemsAdded = () => {
    loadQuote()
  }

  const handleStatusChange = () => {
    loadQuote()
  }

  const handleGeneratePDF = async () => {
    if (!quote) return

    setGeneratingPDF(true)
    try {
      await generateQuotePDF(quote, items)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading quote...</div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Quote not found</div>
      </div>
    )
  }

  const itemsBySection = items.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, QuoteItem[]>)

  const sectionTotals = Object.entries(itemsBySection).map(([section, sectionItems]) => ({
    section,
    total: sectionItems.reduce((sum, item) => sum + item.total_price, 0)
  }))

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Quotes
          </button>
          
          {!isEditMode && (
            <div className="flex gap-2">
              <StatusWorkflow
                quoteId={quote.id}
                quoteNumber={quote.quote_number}
                currentStatus={quote.status}
                clientEmail={quote.client_email}
                onStatusChange={handleStatusChange}
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {quote.quote_number}
              </h1>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Date: {new Date(quote.created_at).toLocaleDateString()}</div>
                <div className="flex items-center gap-2">
                  <span>Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    quote.status === 'approved' ? 'bg-green-100 text-green-800' :
                    quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {quote.status.replace('_', ' ')}
                  </span>
                </div>
                {quote.ai_generated && (
                  <div className="flex items-center">
                    <span className="mr-2">AI Confidence:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      (quote.ai_confidence_avg || 0) >= 0.85
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {((quote.ai_confidence_avg || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Total</div>
              <div className="text-3xl font-bold text-green-600">
                ${quote.total_inc_gst.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">inc GST</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Client Name</div>
              <div className="font-medium">{quote.client_name}</div>
            </div>
            <div>
              <div className="text-gray-600">Project Address</div>
              <div className="font-medium">{quote.project_address}</div>
            </div>
          </div>
        </div>

        {!isEditMode && (
          <div className="mb-6 flex gap-2">
            {items.length > 0 && (
              <>
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Quote
                </button>
                <button
                  onClick={handleGeneratePDF}
                  disabled={generatingPDF}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {generatingPDF ? 'Generating...' : 'Generate PDF'}
                </button>
              </>
            )}
            <button
              onClick={() => setShowAddItems(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add Items
            </button>
          </div>
        )}

        {isEditMode ? (
          <QuoteEditMode
            quoteId={quote.id}
            items={items}
            subtotal={quote.subtotal_ex_gst}
            gstAmount={quote.gst_amount}
            total={quote.total_inc_gst}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Quote Items</h2>
              </div>

              {items.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="text-gray-400 text-xl mb-4">No items in this quote</div>
                  <button
                    onClick={() => setShowAddItems(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Items
                  </button>
                </div>
              ) : (
                Object.entries(itemsBySection).map(([section, sectionItems]) => {
                  const sectionTotal = sectionTotals.find(s => s.section === section)?.total || 0
                  
                  return (
                    <div key={section} className="border-b border-gray-200 last:border-b-0">
                      <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {section.replace('_', ' ')}
                        </h3>
                        <div className="text-sm font-medium text-gray-700">
                          Section Total: ${sectionTotal.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {sectionItems.map((item) => (
                              <tr key={item.id}>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                                  {item.description && (
                                    <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                  )}
                                  {item.ai_suggested && (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                        AI Suggested {item.ai_confidence && `- ${(item.ai_confidence * 100).toFixed(0)}%`}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{item.unit}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">${item.unit_price.toFixed(2)}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">${item.total_price.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="max-w-md ml-auto space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal (ex GST):</span>
                    <span className="font-medium">${quote.subtotal_ex_gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST (10%):</span>
                    <span className="font-medium">${quote.gst_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                    <span>Total (inc GST):</span>
                    <span>${quote.total_inc_gst.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showAddItems && (
        <AddItemsModal
          quoteId={quote.id}
          onClose={() => setShowAddItems(false)}
          onItemsAdded={handleItemsAdded}
        />
      )}
    </div>
  )
}