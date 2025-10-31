import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📨 Webhook received from Bland.ai')
    const webhook = await req.json()
    console.log('✅ Full call data received!')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const transcript = webhook.concatenated_transcript || ''
    
    const workerMatch = transcript.match(
      /user:\s*([A-Za-z\s]+?)\.?\s*\n\s*assistant:.*?(Thanks|Righto|Great|Perfect|Excellent)/i
    )
    const workerName = workerMatch ? workerMatch[1].trim() : 'Unknown'
    
    const addressMatch = transcript.match(/(?:job address|address|location).*?user:\s*([^\n]+)/i)
    const jobAddress = addressMatch ? addressMatch[1].trim() : 'Unknown'
    
    const typeMatch = transcript.match(/(?:business or residential|type).*?user:\s*([^\n]+)/i)
    const businessType = typeMatch ? typeMatch[1].trim() : 'Unknown'
    
    const clientMatch = transcript.match(/(?:who'?s the client|client name).*?user:\s*([^\n]+)/i)
    const clientName = clientMatch ? clientMatch[1].trim() : 'Unknown'
    
    const workMatch = transcript.match(/(?:what work|work needs doing|describe the work).*?user:\s*([^]+?)(?:\n\s*assistant:|$)/i)
    const workDescription = workMatch ? workMatch[1].trim() : 'Unknown'

    console.log('📋 Extracted:', workerName, jobAddress, clientName)

    const { data: savedJob, error: saveError } = await supabase
      .from('job_calls')
      .insert({
        call_id: webhook.call_id,
        worker_name: workerName,
        job_address: jobAddress,
        business_type: businessType,
        client_name: clientName,
        work_description: workDescription,
        call_transcript: transcript,
        call_summary: webhook.summary || '',
        call_duration: webhook.call_length || 0,
        call_cost: (webhook.call_length || 0) * 0.09,
        phone_from: webhook.from,
        phone_to: webhook.to,
        call_status: webhook.status || 'completed'
      })
      .select()
      .single()

    if (saveError) throw saveError
    console.log('✅ Saved! Job ID:', savedJob.id)

    const isProduction = webhook.to === '+61756512608' || webhook.to === '+61 7 5651 2608'
    const recipientEmail = isProduction ? 'admin@a2zh.com.au' : 'rob@kvell.net'
    
    console.log(isProduction ? '🏢 PRODUCTION' : '🧪 TEST')
    console.log('🤖 AUTO-GENERATING QUOTE...')
    
    let quoteInfo = { generated: false, quote_number: null, total_inc_gst: null, error: null }

    try {
      const { data: quoteData, error: quoteError } = await supabase.functions.invoke('generate-quote', {
        body: { job_call_id: savedJob.id }
      })

      if (quoteError) {
        console.error('⚠️ Quote failed:', quoteError)
        quoteInfo.error = quoteError.message
      } else if (quoteData?.success) {
        console.log('✅ QUOTE:', quoteData.quote_number, '$' + quoteData.total_inc_gst)
        quoteInfo = {
          generated: true,
          quote_number: quoteData.quote_number,
          total_inc_gst: quoteData.total_inc_gst,
          items_count: quoteData.items_count,
          confidence_avg: quoteData.confidence_avg,
          error: null
        }
      }
    } catch (err) {
      console.error('⚠️ Quote exception:', err)
      quoteInfo.error = err.message
    }

    const emailHTML = `<!DOCTYPE html><html><head><style>body{font-family:Arial;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#2c3e50;color:white;padding:20px;text-align:center}.content{background:#f9f9f9;padding:20px}.field{margin:15px 0}.label{font-weight:bold;color:#2c3e50}.value{margin-top:5px;padding:10px;background:white;border-left:3px solid #3498db}.quote-box{background:${quoteInfo.generated?'#d4edda':'#fff3cd'};border:2px solid ${quoteInfo.generated?'#28a745':'#ffc107'};padding:15px;margin:20px 0;border-radius:5px}.quote-box h3{margin:0 0 10px 0;color:${quoteInfo.generated?'#155724':'#856404'}}</style></head><body><div class="container"><div class="header"><h1>🔧 New Job</h1><p>${isProduction?'PRODUCTION':'Test'}</p></div><div class="content"><div class="field"><div class="label">👷 Worker:</div><div class="value">${workerName}</div></div><div class="field"><div class="label">📍 Address:</div><div class="value">${jobAddress}</div></div><div class="field"><div class="label">🏢 Type:</div><div class="value">${businessType}</div></div><div class="field"><div class="label">👤 Client:</div><div class="value">${clientName}</div></div><div class="field"><div class="label">🔨 Work:</div><div class="value">${workDescription}</div></div>${quoteInfo.generated?`<div class="quote-box"><h3>✅ Quote Auto-Generated</h3><p><strong>Quote:</strong> ${quoteInfo.quote_number}</p><p><strong>Total:</strong> $${quoteInfo.total_inc_gst?.toFixed(2)}</p><p><strong>Items:</strong> ${quoteInfo.items_count}</p><p><strong>Confidence:</strong> ${(quoteInfo.confidence_avg*100).toFixed(0)}%</p></div>`:`<div class="quote-box"><h3>⚠️ Quote Not Generated</h3><p>${quoteInfo.error||'Check dashboard'}</p></div>`}</div></div></body></html>`

    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${sendGridApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: recipientEmail }], subject: `A2Z Job - ${workerName}` }],
        from: { email: 'rob@kvell.net', name: 'A2Z Job Recorder' },
        content: [{ type: 'text/html', value: emailHTML }]
      })
    })

    console.log('✅ EMAIL SENT to', recipientEmail)

    return new Response(JSON.stringify({ success: true, job_id: savedJob.id, quote_generated: quoteInfo.generated }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(JSON.stringify({ error: error.message }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
