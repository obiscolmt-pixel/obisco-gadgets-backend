import nodemailer from 'nodemailer'

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
  })

  const info = await transporter.sendMail({
    from: `"OBISCO Gadgets" <obiscolmt@gmail.com>`,
    to,
    subject,
    html,
  })

  console.log('✅ Email sent to:', to)
  console.log('📧 Message ID:', info.messageId)
}

export default sendEmail