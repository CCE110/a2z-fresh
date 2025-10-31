'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface QuoteItem {
  id: string
  item_name: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  section: string
  ai_confidence: number
}

interface Quote {
  id: string
  quote_number: string
  created_at: string
  client_name: string
  project_address: string
  subtotal_ex_gst: number
  gst_amount: number
  total_inc_gst: number
  status: string
  ai_confidence_avg: number
}

export default function QuoteDetail() {
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuote()
  }, [])

  async function fetchQuote() {
    try {
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', params.id)
        .single()

      if (quoteError) throw quoteError

      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', params.id)
        .order('sort_order')

      if (itemsError) throw itemsError

      setQuote(quoteData)
      setItems(itemsData || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>
  if (!quote) return <div className="min-h-screen flex items-center justify-center"><div className="text-xl text-red-600">Quote not found</div></div>

  const sections = items.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, QuoteItem[]>)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => router.push('/')} className="text-blue-600 hover:text-blue-800 mb-4">← Back</button>
        <h1 className="text-3xl font-bold mb-2">{quote.quote_number}</h1>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Client: {quote.client_name}</h2>
          <p className="text-gray-600">{quote.project_address}</p>
        </div>

        {Object.entries(sections).map(([section, sectionItems]) => (
          <div key={section} className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold capitalize">{section.replace(/_/g, ' ')}</h3>
            </div>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {sectionItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm">{item.item_name}</td>
                    <td className="px-6 py-4 text-sm text-right">{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4 text-sm text-right">${item.unit_price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium">${item.total_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-2 text-right max-w-md ml-auto">
            <div className="flex justify-between py-2"><span>Subtotal:</span><span>${quote.subtotal_ex_gst.toFixed(2)}</span></div>
            <div className="flex justify-between py-2"><span>GST:</span><span>${quote.gst_amount.toFixed(2)}</span></div>
            <div className="flex justify-between py-3 border-t-2"><span className="text-lg font-bold">Total:</span><span className="text-lg font-bold text-blue-600">${quote.total_inc_gst.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
