'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

interface StatusWorkflowProps {
  quoteId: string
  quoteNumber: string
  currentStatus: string
  clientEmail: string | null
  onStatusChange: () => void
}

export default function StatusWorkflow({
  quoteId,
  quoteNumber,
  currentStatus,
  clientEmail,
  onStatusChange
}: StatusWorkflowProps) {
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [sendEmail, setSendEmail] = useState(clientEmail || '')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    if (!confirm('Approve this quote?')) return

    setProcessing(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'Supervisor'
        })
        .eq('id', quoteId)

      if (updateError) throw updateError

      await supabase.from('quote_audit_log').insert({
        quote_id: quoteId,
        action: 'status_change',
        field_changed: 'status',
        old_value: currentStatus,
        new_value: 'approved',
        changed_by: 'Supervisor',
        notes: 'Quote approved'
      })

      onStatusChange()
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to approve quote')
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      setError('Please provide a reason')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'Supervisor',
          internal_notes: `REJECTED: ${rejectReason}`
        })
        .eq('id', quoteId)

      if (updateError) throw updateError

      await supabase.from('quote_audit_log').insert({
        quote_id: quoteId,
        action: 'status_change',
        field_changed: 'status',
        old_value: currentStatus,
        new_value: 'rejected',
        changed_by: 'Supervisor',
        notes: `Rejected: ${rejectReason}`
      })

      setShowRejectModal(false)
      onStatusChange()
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to reject quote')
    } finally {
      setProcessing(false)
    }
  }

  async function handleSend() {
    if (!sendEmail.trim() || !sendEmail.includes('@')) {
      setError('Please provide valid email')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          client_email: sendEmail
        })
        .eq('id', quoteId)

      if (updateError) throw updateError

      await supabase.from('quote_audit_log').insert({
        quote_id: quoteId,
        action: 'quote_sent',
        field_changed: 'status',
        old_value: currentStatus,
        new_value: 'sent',
        changed_by: 'Supervisor',
        notes: `Sent to ${sendEmail}`
      })

      alert(`Quote marked as sent! Use "Generate PDF" to download and send manually.`)

      setShowSendModal(false)
      onStatusChange()
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to send quote')
    } finally {
      setProcessing(false)
    }
  }

  const canApprove = ['draft', 'pending_review'].includes(currentStatus)
  const canReject = ['draft', 'pending_review', 'approved'].includes(currentStatus)
  const canSend = ['approved'].includes(currentStatus)

  return (
    <>
      <div className="flex gap-2">
        {canApprove && (
          <button
            onClick={handleApprove}
            disabled={processing}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Approve
          </button>
        )}

        {canReject && (
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={processing}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            Reject
          </button>
        )}

        {canSend && (
          <button
            onClick={() => setShowSendModal(true)}
            disabled={processing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Send to Client
          </button>
        )}

        {currentStatus === 'sent' && (
          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md">Sent to Client</div>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Reject Quote</h3>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Reason for rejection..."
              className="w-full px-3 py-2 border rounded-md"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                  setError(null)
                }}
                className="flex-1 px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
              >
                {processing ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Send to Client</h3>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
            <input
              type="email"
              value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
              placeholder="client@example.com"
              className="w-full px-3 py-2 border rounded-md"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowSendModal(false)
                  setError(null)
                }}
                className="flex-1 px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
              >
                {processing ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
