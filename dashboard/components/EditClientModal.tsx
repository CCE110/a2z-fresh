'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

interface EditClientModalProps {
  quoteId: string
  currentName: string
  currentAddress: string
  onClose: () => void
  onSave: () => void
}

export default function EditClientModal({
  quoteId,
  currentName,
  currentAddress,
  onClose,
  onSave
}: EditClientModalProps) {
  const [clientName, setClientName] = useState(currentName)
  const [address, setAddress] = useState(currentAddress)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!clientName.trim() || !address.trim()) {
      setError('Please fill in all fields')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          client_name: clientName,
          project_address: address
        })
        .eq('id', quoteId)

      if (updateError) throw updateError

      // Log to audit
      await supabase.from('quote_audit_log').insert({
        quote_id: quoteId,
        action: 'client_info_updated',
        field_changed: 'client_name, project_address',
        old_value: JSON.stringify({ name: currentName, address: currentAddress }),
        new_value: JSON.stringify({ name: clientName, address: address }),
        changed_by: 'Supervisor'
      })

      onSave()
      onClose()
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to update. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Client Information</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Address *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Project address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
