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
    
    if (!webhook.concatenated_transcript) {
      console.log('⚠️ No transcript yet')
      return new Response(JSON.stringify({ success: false, reason: 'no_transcript' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Full call data received!')
    
    const transcript = webhook.concatenated_transcript
    
    const workerMatch = transcript.match(/name.*?\n\s*user:\s*([^\n.]+)/i)
    const workerName = workerMatch ? workerMatch[1].trim() : 'Unknown'
    
    const addressMatch = transcript.match(/address.*?\n\s*user:\s*([^\n]+)/i)
    const jobAddress = addressMatch ? addressMatch[1].trim().replace(/\.$/, '') : 'Unknown'
    
    const typeMatch = transcript.match(/business or residential.*?\n\s*user:\s*([^\n.]+)/i)
    const businessType = typeMatch ? typeMatch[1].trim() : 'Unknown'
    
    const clientMatch = transcript.match(/client.*?\n\s*user:\s*([^\n.]+)/i)
    const clientName = clientMatch ? clientMatch[1].trim() : 'Unknown'
    
    const workMatch = transcript.match(/work needs doing.*?\n\s*user:\s*([^]+?)(?=\n\s*assistant:|$)/i)
    const workDescription = workMatch ? workMatch[1].trim() : 'Unknown'

    console.log('📋 Extracted:', workerName, jobAddress, clientName)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

    if (saveError) {
      console.error('❌ Error:', saveError)
      return new Response(JSON.stringify({ success: false, error: saveError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    console.log('✅ Saved! Job ID:', savedJob.id)

    const isTestNumber = webhook.to?.includes('468031930')
    const recipientEmail = isTestNumber ? 'rob@kvell.net' : 'admin@a2zh.com.au'
    console.log(isTestNumber ? '🧪 TEST' : '🏢 PRODUCTION')

    console.log('🤖 AUTO-GENERATING QUOTE...')
    
    let quoteInfo = ''
    try {
      const { data, error } = await supabase.functions.invoke('generate-quote', {
        body: { job_call_id: savedJob.id }
      })

      if (error) throw error

      if (data && data.success) {
        console.log(`✅ QUOTE: ${data.quote_number} $${data.total_inc_gst}`)
        quoteInfo = `
          <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0;">✅ Quote Auto-Generated</h2>
            <p style="margin: 5px 0;"><strong>Quote:</strong> ${data.quote_number}</p>
            <p style="margin: 5px 0;"><strong>Total:</strong> $${data.total_inc_gst}</p>
            <p style="margin: 5px 0;"><strong>Items:</strong> ${data.items_count}</p>
            <p style="margin: 5px 0;"><strong>Confidence:</strong> ${Math.round(data.confidence_avg * 100)}%</p>
          </div>
        `
      }
    } catch (quoteError) {
      console.error('⚠️ Quote failed:', quoteError)
      quoteInfo = `
        <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin: 0 0 10px 0;">⚠️ Quote Not Generated</h2>
          <p style="margin: 5px 0;">Manual quote needed</p>
        </div>
      `
    }

    const sendgridKey = Deno.env.get('SENDGRID_API_KEY')
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">🔧 New Job</h1>
        <p><strong>${isTestNumber ? 'TEST' : 'PRODUCTION'}</strong></p>
        
        <h2>👷 Worker:</h2>
        <p>${workerName}</p>
        
        <h2>📍 Address:</h2>
        <p>${jobAddress}</p>
        
        <h2>🏢 Type:</h2>
        <p>${businessType}</p>
        
        <h2>👤 Client:</h2>
        <p>${clientName}</p>
        
        <h2>🔨 Work:</h2>
        <p>${workDescription}</p>

        ${quoteInfo}
        
        <details style="margin: 20px 0;">
          <summary style="cursor: pointer; color: #1e40af; font-weight: bold;">📝 Full Transcript</summary>
          <pre style="background: #f3f4f6; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${transcript}</pre>
        </details>
      </div>
    `

    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: recipientEmail }] }],
        from: { email: 'rob@kvell.net', name: 'A2Z Job Recorder' },
        subject: `A2Z Job - ${workerName}`,
        content: [{ type: 'text/html', value: emailHTML }]
      })
    })

    console.log(`✅ EMAIL SENT to ${recipientEmail}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        job_id: savedJob.id,
        quote_generated: !!quoteInfo.includes('Quote Auto-Generated')
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
