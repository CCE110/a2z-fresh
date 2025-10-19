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
        console.log('📡 Fetching from Bland API...');
        
        const blandResponse = await fetch(`https://api.bland.ai/v1/calls/${callId}`, {
          headers: {
            'authorization': 'org_9758994f0c3e0bbd36b5fd7fc06dc0a84a66a022964733c85749be98cecd430514699510f86e8d33ad4969'
          }
        });
        
        console.log('Bland API status:', blandResponse.status);
        
        if (blandResponse.ok) {
          const callData = await blandResponse.json();
          console.log('✅ Got transcript, length:', callData.concatenated_transcript?.length);
          
          // Parse job details
          const transcript = callData.concatenated_transcript || '';
          const workerMatch = transcript.match(/user:\s*([A-Za-z\s]+)\.\s*\n\s*assistant:\s*Thanks/);
          const addressMatch = transcript.match(/assistant:\s*Thanks.*What's the job address\?\s*\n\s*user:\s*([^\n]+)/);
          const businessMatch = transcript.match(/assistant:.*Business or residential\?\s*\n\s*user:\s*([^\n]+)/);
          const clientMatch = transcript.match(/assistant:.*Who's the client\?\s*\n\s*user:\s*([^\n]+)/);
          const workMatch = transcript.match(/assistant:.*What work needs doing\?\s*\n\s*user:\s*([^\n]+)/);
          
          const workerName = workerMatch ? workerMatch[1].trim() : 'Unknown';
          const jobAddress = addressMatch ? addressMatch[1].trim() : 'Unknown';
          const businessType = businessMatch ? businessMatch[1].trim() : 'Unknown';
          const clientName = clientMatch ? clientMatch[1].trim() : 'Unknown';
          const workDescription = workMatch ? workMatch[1].trim() : 'Unknown';
          
          console.log('📧 Sending email...');
          
          const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              personalizations: [{
                to: [{ email: 'admin@a2zh.com.au' }]
              }],
              from: { email: 'rob@kvell.net' },
              subject: `A2Z Job - ${workerName} - ${jobAddress}`,
              content: [{
                type: 'text/html',
                value: `
                  <h2>New Job Recording</h2>
                  <p><strong>Worker:</strong> ${workerName}</p>
                  <p><strong>Address:</strong> ${jobAddress}</p>
                  <p><strong>Type:</strong> ${businessType}</p>
                  <p><strong>Client:</strong> ${clientName}</p>
                  <p><strong>Work:</strong> ${workDescription}</p>
                  <hr>
                  <h3>Summary</h3>
                  <p>${callData.summary || 'No summary'}</p>
                  <hr>
                  <h3>Full Transcript</h3>
                  <pre>${callData.concatenated_transcript}</pre>
                  <hr>
                  <p><small>Duration: ${callData.call_length} min | Cost: $${callData.price}</small></p>
                `
              }]
            })
          });
          
          console.log('Email status:', emailResponse.status);
          
          if (emailResponse.ok) {
            console.log('✅ EMAIL SENT!');
          } else {
            console.error('❌ Email failed:', await emailResponse.text());
          }
        } else {
          console.error('❌ Bland API error:', blandResponse.status);
        }
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
    }, 7000);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${PORT}`);
});
