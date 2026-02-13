import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = "no-reply@sendgrid.net";

// RESET MAIL
async function sendResetMail(to, subject, html) {
  try {
    const info = await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject,
      html,
    });

    console.log(
      "MailService: Reset email sent:",
      info[0]?.headers["x-message-id"]
    );
  } catch (error) {
    console.error(
      "MailService: Error sending reset email:",
      error.response?.body || error.message
    );
    throw error;
  }
}

// APPOINTMENT REJECTION
async function sendAppointmentRejection(to, appointmentDetails) {
  const {
    doctorName,
    doctorSpecialty,
    date,
    time,
    location,
    appointmentType,
    reason,
  } = appointmentDetails;

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
        <p><strong>Konum:</strong> ${location}</p>
        <p><strong>Tür:</strong> ${appointmentType}</p>
      </div>
    </div>
  `;

  try {
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject: "Randevu Red Bildirimi",
      html,
    });

    console.log("MailService: Rejection email sent →", to);
  } catch (error) {
    console.error(
      "MailService: Error sending rejection email:",
      error.response?.body || error.message
    );
  }
}

// APPOINTMENT CONFIRMATION
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
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject: "Randevu Onayı - MedLine",
      html,
    });

    console.log("MailService: Confirmation email sent →", to);
  } catch (error) {
    console.error(
      "MailService: Error sending confirmation email:",
      error.response?.body || error.message
    );
    throw error;
  }
}

export {
  sendResetMail,
  sendAppointmentConfirmation,
  sendAppointmentRejection,
};
