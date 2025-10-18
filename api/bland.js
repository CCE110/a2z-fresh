const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  res.json({ success: true });
  
  if (req.body.message && req.body.message.includes("Closing call stream")) {
    const callId = req.body.call_id;
    
    // Don't wait - fetch and send immediately
    fetch(`https://api.bland.ai/v1/calls/${callId}`, {
      headers: { 'Authorization': 'org_9758994f0c3e0bbd36b5fd7fc06dc0a84a66a022964733c85749be98cecd430514699510f86e8d33ad4969' }
    })
    .then(r => r.json())
    .then(data => {
      if (data.concatenated_transcript) {
        return sgMail.send({
          to: 'admin@a2zh.com.au',
          from: 'rob@kvell.net',
          subject: 'A2Z Job Recording',
          text: (data.summary || 'No summary') + '\n\nTranscript:\n' + data.concatenated_transcript
        });
      }
    })
    .catch(err => console.error('Error:', err.message));
  }
}
