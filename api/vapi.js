export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const data = req.body;
  console.log('Received from Vapi:', JSON.stringify(data));
  
  const jobDetails = data.message?.toolCalls?.[0]?.function?.arguments || data;
  
  res.status(200).json({ 
    success: true,
    message: 'Job received',
    job_number: 'A2Z-' + Date.now(),
    details: jobDetails
  });
}
