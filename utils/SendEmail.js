import nodemailer from 'nodemailer'

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })

  const info = await transporter.sendMail({
    from: `"OBISCO Gadgets" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  })

  console.log('✅ Email sent to:', to)
  console.log('📧 Message ID:', info.messageId)
}

export default sendEmail