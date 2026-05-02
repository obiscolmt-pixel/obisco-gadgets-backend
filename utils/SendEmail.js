const sendEmail = async ({ to, subject, html }) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: 'OBISCO STORE',
        email: process.env.EMAIL_USER,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Email failed')
  }

  console.log('✅ Email sent to:', to)
  return data
}

export default sendEmail