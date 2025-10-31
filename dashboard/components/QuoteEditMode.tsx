'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

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

interface EditableItem extends QuoteItem {
  _isDeleted?: boolean
  _originalQuantity?: number
  _originalUnitPrice?: number
}

interface QuoteEditModeProps {
  quoteId: string
  items: QuoteItem[]
  subtotal: number
  gstAmount: number
  total: number
  onSave: () => void
  onCancel: () => void
}

export default function QuoteEditMode({
  quoteId,
  items,
  subtotal,
  gstAmount,
  total,
  onSave,
  onCancel
}: QuoteEditModeProps) {
  const [editedItems, setEditedItems] = useState<EditableItem[]>(
    items.map(item => ({
      ...item,
      _originalQuantity: item.quantity,
      _originalUnitPrice: item.unit_price
    }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateTotals = () => {
    const newSubtotal = editedItems
      .filter(item => !item._isDeleted)
      .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const newGst = newSubtotal * 0.1
    const newTotal = newSubtotal + newGst
    return { newSubtotal, newGst, newTotal }
  }

  const { newSubtotal, newGst, newTotal } = calculateTotals()

  const updateQuantity = (itemId: string, newQuantity: string) => {
    const qty = parseFloat(newQuantity) || 0
    setEditedItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? {
              ...item,
              quantity: qty,
              total_price: qty * item.unit_price,
              manually_modified: true
            }
          : item
      )
    )
  }

  const updatePrice = (itemId: string, newPrice: string) => {
    const price = parseFloat(newPrice) || 0
    setEditedItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? {
              ...item,
              unit_price: price,
              total_price: item.quantity * price,
              manually_modified: true
            }
          : item
      )
    )
  }

  const deleteItem = (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    setEditedItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, _isDeleted: true } : item
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()

      for (const item of editedItems) {
        if (item._isDeleted) {
          const { error: deleteError } = await supabase
            .from('quote_items')
            .delete()
            .eq('id', item.id)

          if (deleteError) throw deleteError

          await supabase.from('ai_learning_feedback').insert({
            quote_id: quoteId,
            quote_item_id: item.id,
            feedback_type: 'item_removed',
            was_ai_suggestion: item.ai_suggested,
            ai_suggested_value: {
              item_name: item.item_name,
              quantity: item._originalQuantity,
              unit_price: item._originalUnitPrice
            },
            modification_reason: 'User deleted item'
          })
        } else if (
          item.quantity !== item._originalQuantity ||
          item.unit_price !== item._originalUnitPrice
        ) {
          const { error: updateError } = await supabase
            .from('quote_items')
            .update({
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              manually_modified: true
            })
            .eq('id', item.id)

          if (updateError) throw updateError

          const feedbackType =
            item.quantity !== item._originalQuantity
              ? 'quantity_adjusted'
              : 'price_adjusted'

          await supabase.from('ai_learning_feedback').insert({
            quote_id: quoteId,
            quote_item_id: item.id,
            feedback_type: feedbackType,
            was_ai_suggestion: item.ai_suggested,
            ai_suggested_value: {
              quantity: item._originalQuantity,
              unit_price: item._originalUnitPrice
            },
            final_value: {
              quantity: item.quantity,
              unit_price: item.unit_price
            },
            modification_reason: 'User edited item'
          })
        }
      }

      const { error: calcError } = await supabase.rpc('calculate_quote_totals', {
        quote_uuid: quoteId
      })

      if (calcError) {
        console.error('Error calculating totals:', calcError)
      }

      onSave()
    } catch (err) {
      console.error('Error saving changes:', err)
      setError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const itemsBySection = editedItems
    .filter(item => !item._isDeleted)
    .reduce((acc, item) => {
      if (!acc[item.section]) acc[item.section] = []
      acc[item.section].push(item)
      return acc
    }, {} as Record<string, EditableItem[]>)

  const sectionTotals = Object.entries(itemsBySection).map(([section, sectionItems]) => ({
    section,
    total: sectionItems.reduce((sum, item) => sum + item.total_price, 0)
  }))

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Edit Mode:</strong> Changes you make will be tracked to improve AI quote accuracy.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {Object.entries(itemsBySection).map(([section, sectionItems]) => {
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sectionItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                          )}
                          {item.ai_suggested && (
                            <div className="mt-1 flex items-center space-x-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                AI Suggested {item.ai_confidence && `- ${(item.ai_confidence * 100).toFixed(0)}%`}
                              </span>
                              {item.manually_modified && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Modified
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, e.target.value)}
                            step="0.1"
                            min="0"
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.unit}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className="text-gray-500 text-sm mr-1">$</span>
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updatePrice(item.id, e.target.value)}
                              step="0.01"
                              min="0"
                              className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          ${item.total_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="max-w-md ml-auto space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal (ex GST):</span>
            <span className="font-medium">${newSubtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>GST (10%):</span>
            <span className="font-medium">${newGst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
            <span>Total (inc GST):</span>
            <span>${newTotal.toFixed(2)}</span>
          </div>
          {(newTotal !== total) && (
            <div className="text-xs text-orange-600 text-right">
              Original: ${total.toFixed(2)} (changed by ${Math.abs(newTotal - total).toFixed(2)})
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
