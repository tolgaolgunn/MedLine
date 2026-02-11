const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.MY_GMAIL,
    pass: process.env.MY_PASSWORD,
  },
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify transporter connection
transporter.verify(function (error, success) {
  if (error) {
    console.log('MailService Error: Transporter connection failed:', error);
    console.error('MailService: Check your EMAIL_USER and EMAIL_PASS (or App Password) in .env');
  } else {
    console.log('MailService: Server is ready to take our messages');
    console.log('MailService Config loaded for:', process.env.EMAIL_USER);
  }
});

async function sendResetMail(to, subject, html) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
}

async function sendAppointmentRejection(to, appointmentDetails) {
  const { doctorName, doctorSpecialty, date, time, reason } = appointmentDetails;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Randevu Red Bildirimi</h2>
      <p>Sayın Hastamız,</p>
      <p>Randevunuz aşağıdaki sebepten dolayı reddedilmiştir:</p>
      
      <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Red Sebebi:</strong> ${reason || 'Doktor tarafından uygun görülmedi.'}</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Randevu Detayları:</strong></p>
        <p><strong>Doktor:</strong> ${doctorName}</p>
        <p><strong>Uzmanlık Alanı:</strong> ${doctorSpecialty}</p>
        <p><strong>Tarih:</strong> ${date}</p>
        <p><strong>Saat:</strong> ${time}</p>
      </div>
      
      <p>Yeni bir randevu oluşturmak için lütfen sistemimizi kullanınız.</p>
      <p>Anlayışınız için teşekkür ederiz.</p>
      
      <p>Sağlıklı günler dileriz.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Randevu Red Bildirimi',
    html,
  });
}

async function sendAppointmentConfirmation(to, appointmentDetails) {
  console.log('MailService: sendAppointmentConfirmation called for:', to);
  const { doctorName, doctorSpecialty, date, time, location, appointmentType } = appointmentDetails;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a8a;">Randevu Onayı</h2>
      <p>Sayın Hastamız,</p>
      <p>Randevunuz başarıyla oluşturulmuştur. Randevu detayları aşağıdadır:</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Doktor:</strong> ${doctorName}</p>
        <p><strong>Uzmanlık Alanı:</strong> ${doctorSpecialty}</p>
        <p><strong>Tarih:</strong> ${date}</p>
        <p><strong>Saat:</strong> ${time}</p>
        <p><strong>Konum:</strong> ${location}</p>
        <p><strong>Randevu Türü:</strong> ${appointmentType}</p>
      </div>
      
      <p>Randevunuza gelmeden önce lütfen aşağıdaki hususlara dikkat ediniz:</p>
      <ul>
        <li>Randevunuzdan 10 dakika önce hazır bulununuz.</li>
        <li>Gerekli sağlık belgelerinizi yanınızda getiriniz.</li>
        <li>Randevunuzu iptal etmek veya değiştirmek için lütfen en az 24 saat öncesinden bildiriniz.</li>
      </ul>
      
      <p>Sağlıklı günler dileriz.</p>
      <p style="color: #475569;">MedLine Sağlık</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Randevu Onayı - MedLine',
      html,
    });
    console.log('MailService: Email sent. MessageId:', info.messageId);
  } catch (error) {
    console.error('MailService: Error sending email in sendAppointmentConfirmation:', error);
    throw error;
  }
}


module.exports = { sendResetMail, sendAppointmentConfirmation, sendAppointmentRejection };