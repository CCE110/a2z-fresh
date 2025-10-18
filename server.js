const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'a2z-fresh' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/bland', async (req, res) => {
  console.log('WEBHOOK:', req.body.message);
  res.json({ success: true });
  
  if (req.body.message && req.body.message.includes("Closing call stream")) {
    const callId = req.body.call_id;
    console.log('🔴 Call ended:', callId);
    
    setTimeout(async () => {
      try {
        console.log('📡 Fetching transcript from Bland...');
        
        // Try different authorization formats
        const blandResponse = await fetch(`https://api.bland.ai/v1/calls/${callId}`, {
          method: 'GET',
          headers: { 
            'Authorization': 'org_9758994f0c3e0bbd36b5fd7fc06dc0a84a66a022964733c85749be98cecd430514699510f86e8d33ad4969',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Response status:', blandResponse.status);
        const contentType = blandResponse.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        const textResponse = await blandResponse.text();
        console.log('Response preview:', textResponse.substring(0, 300));
        
        const data = JSON.parse(textResponse);
        console.log('✅ Got transcript, length:', data.concatenated_transcript?.length);
        
        if (data.concatenated_transcript) {
          console.log('📧 Sending to Supabase Edge Function...');
          
          const emailResponse = await fetch(`${process.env.SUPABASE_URL}/functions/v1/send-job-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              transcript: data.concatenated_transcript,
              summary: data.summary,
              call_id: callId
            })
          });
          
          if (emailResponse.ok) {
            console.log('✅ EMAIL SENT SUCCESSFULLY!');
          } else {
            console.error('❌ Email failed:', await emailResponse.text());
          }
        }
      } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
      }
    }, 5000);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${PORT}`);
});
