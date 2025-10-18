const sgMail = require('@sendgrid/mail');

export default async function handler(req, res) {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    await sgMail.send({
      to: 'admin@a2zh.com.au',
      from: 'rob@kvell.net',
      subject: 'Test from A2Z System',
      text: 'If you receive this, SendGrid is working!'
    });
    
    res.json({ success: true, message: 'Email sent!' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
}
