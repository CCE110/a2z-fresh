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
    
    // Log the entire webhook body to see what Bland sends
    console.log('Full webhook payload:', JSON.stringify(req.body, null, 2));
    
    setTimeout(async () => {
      try {
        // Get transcript directly from webhook data
        const transcript = req.body.concatenated_transcript || req.body.transcript;
        const summary = req.body.summary;
        
        if (transcript) {
          console.log('✅ Got transcript from webhook, length:', transcript.length);
          console.log('📧 Sending to Supabase...');
          
          const emailResponse = await fetch(`${process.env.SUPABASE_URL}/functions/v1/send-job-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              transcript: transcript,
              summary: summary,
              call_id: callId
            })
          });
          
          if (emailResponse.ok) {
            console.log('✅ EMAIL SENT SUCCESSFULLY!');
          } else {
            const errorText = await emailResponse.text();
            console.error('❌ Email failed:', errorText);
          }
        } else {
          console.log('❌ No transcript in webhook data');
        }
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
    }, 2000); // Reduced wait time since we're not fetching
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${PORT}`);
});
