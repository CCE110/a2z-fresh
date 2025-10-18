const express = require('express');
const sgMail = require('@sendgrid/mail');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'a2z-fresh' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✓ SendGrid initialized');
}

app.post('/api/bland', async (req, res) => {
  console.log('WEBHOOK:', req.body.message);
  res.json({ success: true });
  
  if (req.body.message && req.body.message.includes("Closing call stream")) {
    const callId = req.body.call_id;
    console.log('🔴 Call ended:', callId);
    
    setTimeout(async () => {
      try {
        // Correct Bland API format with Bearer token
        const response = await fetch(`https://api.bland.ai/v1/calls/${callId}`, {
          method: 'GET',
          headers: { 
            'Authorization': 'sk-org_9758994f0c3e0bbd36b5fd7fc06dc0a84a66a022964733c85749be98cecd430514699510f86e8d33ad4969'
          }
        });
        
        const data = await response.json();
        
        if (data.concatenated_transcript) {
          await sgMail.send({
            to: 'admin@a2zh.com.au',
            from: 'rob@kvell.net',
            subject: 'A2Z Job Recording',
            text: data.concatenated_transcript
          });
          console.log('✅ EMAIL SENT!');
        } else {
          console.log('❌ No transcript found');
        }
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
    }, 5000);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${PORT}`);
});
