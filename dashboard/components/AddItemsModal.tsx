'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface CatalogItem {
  id: string
  item_code: string
  item_name: string
  category: string
  subcategory: string | null
  base_price: number
  unit: string
  description: string | null
  tags: string[] | null
}

interface AddItemsModalProps {
  quoteId: string
  onClose: () => void
  onItemsAdded: () => void
}

export default function AddItemsModal({ quoteId, onClose, onItemsAdded }: AddItemsModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [filteredItems, setFilteredItems] = useState<CatalogItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Map<string, { quantity: number; section: string }>>(new Map())

  const categories = [
    'all',
    'storm_water',
    'sewer',
    'water_supply',
    'fire',
    'rough_in',
    'gas',
    'labor'
  ]

  useEffect(() => {
    loadCatalog()
  }, [])

  useEffect(() => {
    filterItems()
  }, [searchTerm, selectedCategory, catalogItems])

  async function loadCatalog() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pricing_catalog')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('item_name')

      if (error) throw error
      setCatalogItems(data || [])
      setFilteredItems(data || [])
    } catch (error) {
      console.error('Error loading catalog:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterItems() {
    let filtered = catalogItems

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        item.item_name.toLowerCase().includes(search) ||
        item.item_code.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.tags?.some(tag => tag.toLowerCase().includes(search))
      )
    }

    setFilteredItems(filtered)
  }

  function toggleItem(item: CatalogItem) {
    const newSelected = new Map(selectedItems)
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id)
    } else {
      newSelected.set(item.id, {
        quantity: 1,
        section: item.category
      })
    }
    setSelectedItems(newSelected)
  }

  function updateQuantity(itemId: string, quantity: number) {
    const newSelected = new Map(selectedItems)
    const current = newSelected.get(itemId)
    if (current) {
      newSelected.set(itemId, { ...current, quantity })
      setSelectedItems(newSelected)
    }
  }

  async function handleAddItems() {
    if (selectedItems.size === 0) return

    setAdding(true)
    try {
      const supabase = createClient()

      const { data: existingItems } = await supabase
        .from('quote_items')
        .select('section, sort_order')
        .eq('quote_id', quoteId)

      const maxSortOrders = existingItems?.reduce((acc, item) => {
        if (!acc[item.section] || item.sort_order > acc[item.section]) {
          acc[item.section] = item.sort_order
        }
        return acc
      }, {} as Record<string, number>) || {}

      const itemsToInsert = Array.from(selectedItems.entries()).map(([itemId, { quantity, section }]) => {
        const catalogItem = catalogItems.find(i => i.id === itemId)!
        const sortOrder = (maxSortOrders[section] || 0) + 1
        maxSortOrders[section] = sortOrder

        return {
          quote_id: quoteId,
          item_name: catalogItem.item_name,
          description: catalogItem.description,
          quantity: quantity,
          unit: catalogItem.unit,
          unit_price: catalogItem.base_price,
          total_price: quantity * catalogItem.base_price,
          section: section,
          pricing_catalog_id: catalogItem.id,
          ai_suggested: false,
          ai_confidence: null,
          manually_modified: false,
          sort_order: sortOrder
        }
      })

      const { error: insertError } = await supabase
        .from('quote_items')
        .insert(itemsToInsert)

      if (insertError) throw insertError

      await supabase.rpc('calculate_quote_totals', {
        quote_uuid: quoteId
      })

      for (const item of itemsToInsert) {
        await supabase.from('ai_learning_feedback').insert({
          quote_id: quoteId,
          feedback_type: 'item_added',
          was_ai_suggestion: false,
          final_value: {
            item_name: item.item_name,
            quantity: item.quantity,
            unit_price: item.unit_price
          },
          modification_reason: 'User manually added item'
        })
      }

      onItemsAdded()
      onClose()
    } catch (error) {
      console.error('Error adding items:', error)
      alert('Failed to add items. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Add Items to Quote</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-200 space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {selectedItems.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <span className="text-blue-800 font-medium">
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading catalog...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No items found</div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(item => {
                const isSelected = selectedItems.has(item.id)
                const selectedData = selectedItems.get(item.id)

                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 cursor-pointer ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => !isSelected && toggleItem(item)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item)}
                          className="w-4 h-4"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <h3 className="font-semibold">{item.item_name}</h3>
                          <p className="text-sm text-gray-600">{item.item_code}</p>
                          {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                          <div className="mt-2 flex gap-3 text-sm">
                            <span className="px-2 py-1 bg-gray-100 rounded capitalize">
                              {item.category.replace('_', ' ')}
                            </span>
                            <span>${item.base_price.toFixed(2)} / {item.unit}</span>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <label className="text-sm">Qty:</label>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={selectedData?.quantity || 1}
                            onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 1)}
                            className="w-20 px-2 py-1 border rounded-md text-sm"
                          />
                          <span className="text-sm font-medium">
                            = ${((selectedData?.quantity || 1) * item.base_price).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-between">
          <div className="text-sm text-gray-600">{filteredItems.length} items available</div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={adding}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleAddItems}
              disabled={selectedItems.size === 0 || adding}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              {adding ? 'Adding...' : `Add ${selectedItems.size} Item${selectedItems.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
