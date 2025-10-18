const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'a2z-fresh' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Store call data temporarily
const callData = {};

app.post('/api/bland', async (req, res) => {
  res.json({ success: true });
  
  const callId = req.body.call_id;
  
  // Log all webhooks to understand the flow
  console.log('WEBHOOK:', req.body.message, '| Call:', callId);
  
  // Store any data that comes through
  if (!callData[callId]) {
    callData[callId] = {};
  }
  
  // Collect transcript and summary from any webhook
  if (req.body.concatenated_transcript) {
    callData[callId].transcript = req.body.concatenated_transcript;
  }
  if (req.body.transcript) {
    callData[callId].transcript = req.body.transcript;
  }
  if (req.body.summary) {
    callData[callId].summary = req.body.summary;
  }
  
  // When call ends, send email with collected data
  if (req.body.message && req.body.message.includes("Closing call stream")) {
    console.log('🔴 Call ended:', callId);
    
    setTimeout(async () => {
      try {
        const data = callData[callId];
        
        if (data && data.transcript) {
          console.log('✅ Got transcript, length:', data.transcript.length);
          console.log('📧 Sending email...');
          
          const emailResponse = await fetch(`${process.env.SUPABASE_URL}/functions/v1/send-job-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              transcript: data.transcript,
              summary: data.summary || 'Job Recording',
              call_id: callId
            })
          });
          
          if (emailResponse.ok) {
            console.log('✅ EMAIL SENT SUCCESSFULLY!');
          } else {
            console.error('❌ Email failed:', await emailResponse.text());
          }
          
          // Cleanup
          delete callData[callId];
        } else {
          console.log('❌ No transcript found for call:', callId);
        }
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
    }, 2000);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${PORT}`);
});
