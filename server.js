const express = require('express');
const sgMail = require('@sendgrid/mail');

const app = express();
app.use(express.json());

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid initialized');
} else {
  console.error('WARNING: SENDGRID_API_KEY not set!');
}

app.post('/api/bland', async (req, res) => {
  console.log('Webhook received:', req.body.message);
  res.json({ success: true });
  
  if (req.body.message && req.body.message.includes("Closing call stream")) {
    const callId = req.body.call_id;
    console.log("Call ended:", callId);
    
    setTimeout(async () => {
      try {
        console.log("Fetching transcript...");
        const response = await fetch(`https://api.bland.ai/v1/calls/${callId}`, {
          headers: { 
            'Authorization': 'org_9758994f0c3e0bbd36b5fd7fc06dc0a84a66a022964733c85749be98cecd430514699510f86e8d33ad4969'
          }
        });
        
        const data = await response.json();
        console.log("Got data, transcript length:", data.concatenated_transcript?.length || 0);
        
        if (data.concatenated_transcript) {
          await sgMail.send({
            to: 'admin@a2zh.com.au',
            from: 'rob@kvell.net',
            subject: 'A2Z Job Recording',
            text: (data.summary || 'No summary') + '\n\nTranscript:\n' + data.concatenated_transcript
          });
          console.log("Email sent!");
        }
      } catch (error) {
        console.error("Error:", error.message);
      }
    }, 5000);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
