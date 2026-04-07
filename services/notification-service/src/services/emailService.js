import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"FoodEcom" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
    
    return {
      success: true,
      messageId: info.messageId,
      provider: 'smtp'
    };
  } catch (error) {
    console.error('Email failed:', error);
    return {
      success: false,
      error: error.message,
      provider: 'smtp'
    };
  }
};

export { sendEmail };
