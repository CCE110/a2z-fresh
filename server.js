const express = require('express');
const sgMail = require('@sendgrid/mail');

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'a2z-fresh' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✓ SendGrid initialized');
} else {
  console.error('✗ SENDGRID_API_KEY missing!');
}

app.post('/api/bland', async (req, res) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('WEBHOOK RECEIVED');
  console.log('Message:', req.body.message);
  console.log('Call ID:', req.body.call_id);
  
  res.json({ success: true });
  
  if (req.body.message && req.body.message.includes("Closing call stream")) {
    const callId = req.body.call_id;
    console.log('🔴 CALL ENDED - Processing:', callId);
    
    setTimeout(async () => {
      try {
        console.log('⏳ Waiting 5 seconds...');
        console.log('📡 Fetching transcript...');
        
        const response = await fetch(`https://api.bland.ai/v1/calls/${callId}`, {
          headers: { 
            'Authorization': 'org_9758994f0c3e0bbd36b5fd7fc06dc0a84a66a022964733c85749be98cecd430514699510f86e8d33ad4969'
          }
        });
        
        const data = await response.json();
        console.log('📄 Got transcript, length:', data.concatenated_transcript?.length || 0);
        
        if (data.concatenated_transcript) {
          console.log('📧 Sending email...');
          await sgMail.send({
            to: 'admin@a2zh.com.au',
            from: 'rob@kvell.net',
            subject: 'A2Z Job Recording',
            text: (data.summary || 'No summary') + '\n\nTranscript:\n' + data.concatenated_transcript
          });
          console.log('✅ EMAIL SENT!');
        }
      } catch (error) {
        console.error('❌ ERROR:', error.message);
      }
    }, 5000);
  }
});

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✓ Server listening on 0.0.0.0:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
