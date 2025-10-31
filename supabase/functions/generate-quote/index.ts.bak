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

  const startTime = Date.now()

  try {
    console.log('🤖 Starting AI quote generation...')
    const { job_call_id } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: jobCall, error: jobError } = await supabase
      .from('job_calls')
      .select('*')
      .eq('id', job_call_id)
      .single()

    if (jobError || !jobCall) throw new Error('Job call not found')
    console.log('✅ Job loaded:', jobCall.worker_name)

    const { data: catalog } = await supabase
      .from('pricing_catalog')
      .select('*')
      .eq('is_active', true)

    console.log('✅ Catalog loaded:', catalog.length, 'items')

    const prompt = `You are a professional hydraulic services estimator. Generate an accurate quote for this job.

JOB DETAILS:
- Worker: ${jobCall.worker_name}
- Address: ${jobCall.job_address}
- Type: ${jobCall.business_type}
- Client: ${jobCall.client_name}
- Work: ${jobCall.work_description}

PRICING CATALOG:
${catalog.map(item => `- ${item.item_code}: ${item.item_name} - $${item.base_price}/${item.unit}`).join('\n')}

Create a detailed quote with line items from the catalog. Always include labor ($95/hour) and travel ($65/hour, typically 1 hour).

RESPOND WITH VALID JSON ONLY:
{
  "quote_items": [
    {
      "section": "water_supply",
      "item_name": "string",
      "description": "string",
      "quantity": 1,
      "unit": "each",
      "unit_price": 100,
      "pricing_catalog_id": null,
      "ai_confidence": 0.9,
      "ai_reasoning": "why this item"
    }
  ],
  "client_notes": "Professional notes",
  "exclusions": ["What's NOT included"],
  "assumptions": ["Assumptions made"]
}`

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!claudeResponse.ok) throw new Error('Claude API error')

    const claudeData = await claudeResponse.json()
    const aiResponse = claudeData.content[0].text
    console.log('✅ AI response received')

    const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const quoteData = JSON.parse(cleanResponse)
    console.log('✅ Parsed:', quoteData.quote_items.length, 'items')

    const subtotal = quoteData.quote_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const gst = subtotal * 0.1
    const total = subtotal + gst
    const avgConfidence = quoteData.quote_items.reduce((sum, item) => sum + item.ai_confidence, 0) / quoteData.quote_items.length

    const { data: quoteNumberData } = await supabase.rpc('generate_quote_number')
    const quoteNumber = quoteNumberData || `A2Z-${new Date().toISOString().slice(2,7).replace('-','')}-0001`

    const { data: savedQuote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        quote_number: quoteNumber,
        job_call_id: job_call_id,
        client_name: jobCall.client_name,
        project_address: jobCall.job_address,
        project_type: jobCall.business_type?.toLowerCase() || 'residential',
        project_description: jobCall.work_description,
        subtotal_ex_gst: subtotal,
        gst_amount: gst,
        total_inc_gst: total,
        status: 'pending_review',
        ai_generated: true,
        ai_confidence_avg: avgConfidence,
        ai_model_used: 'claude-sonnet-4-5-20250929',
        ai_generation_time_ms: Date.now() - startTime,
        client_notes: quoteData.client_notes,
        exclusions: quoteData.exclusions,
        assumptions: quoteData.assumptions
      })
      .select()
      .single()

    if (quoteError) throw new Error('Failed to save quote')
    console.log('✅ Quote saved')

    const itemsToInsert = quoteData.quote_items.map((item, index) => ({
      quote_id: savedQuote.id,
      section: item.section,
      sort_order: index + 1,
      item_name: item.item_name,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
      pricing_catalog_id: item.pricing_catalog_id,
      ai_suggested: true,
      ai_confidence: item.ai_confidence,
      ai_reasoning: item.ai_reasoning
    }))

    await supabase.from('quote_items').insert(itemsToInsert)
    console.log('✅ Items saved:', itemsToInsert.length)

    return new Response(
      JSON.stringify({
        success: true,
        quote_id: savedQuote.id,
        quote_number: quoteNumber,
        total_inc_gst: total,
        confidence_avg: avgConfidence,
        items_count: itemsToInsert.length,
        generation_time_ms: Date.now() - startTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
