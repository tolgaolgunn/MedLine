const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MY_GMAIL,
    pass: process.env.MY_PASSWORD,
  },
});



async function sendResetMail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log("MailService: Reset email sent:", info.messageId);
  } catch (error) {
    console.error("MailService: Error sending reset email:", error.message || error);
    throw error;
  }
}

async function sendAppointmentRejection(to, appointmentDetails) {
  const { doctorName, doctorSpecialty, date, time, reason } = appointmentDetails;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Randevu Red Bildirimi</h2>
      <p>Sayın Hastamız,</p>
      <p>Randevunuz aşağıdaki sebepten dolayı reddedilmiştir:</p>

      <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px;">
        <strong>Red Sebebi:</strong> ${reason || "Doktor tarafından uygun görülmedi."}
      </div>

      <div style="margin-top:20px">
        <p><strong>Doktor:</strong> ${doctorName}</p>
        <p><strong>Uzmanlık:</strong> ${doctorSpecialty}</p>
        <p><strong>Tarih:</strong> ${date}</p>
        <p><strong>Saat:</strong> ${time}</p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: "Randevu Red Bildirimi",
      html,
    });

    console.log("MailService: Rejection email sent →", to);
  } catch (error) {
    console.error("MailService: Error sending rejection email:", error.message || error);
  }
}

async function sendAppointmentConfirmation(to, appointmentDetails) {
  const { doctorName, doctorSpecialty, date, time, location, appointmentType } =
    appointmentDetails;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a8a;">Randevu Onayı</h2>
      <p>Sayın Hastamız,</p>

      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
        <p><strong>Doktor:</strong> ${doctorName}</p>
        <p><strong>Uzmanlık:</strong> ${doctorSpecialty}</p>
        <p><strong>Tarih:</strong> ${date}</p>
        <p><strong>Saat:</strong> ${time}</p>
        <p><strong>Konum:</strong> ${location}</p>
        <p><strong>Tür:</strong> ${appointmentType}</p>
      </div>

      <p>Sağlıklı günler dileriz.</p>
      <p><strong>MedLine Sağlık</strong></p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: "Randevu Onayı - MedLine",
      html,
    });

    console.log("MailService: Confirmation email sent →", to);
  } catch (error) {
    console.error(
      "MailService: Error sending confirmation email:",
      error.message || error
    );
    throw error;
  }
}

module.exports = {
  sendResetMail,
  sendAppointmentConfirmation,
  sendAppointmentRejection,
};
