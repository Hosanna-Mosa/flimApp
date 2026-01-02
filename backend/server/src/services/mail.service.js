const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, text, html, attachments }) => {
  try {
    // If not in production and no real SMTP configured, just log to console
    if (process.env.NODE_ENV !== 'production' && (!process.env.SMTP_USER || process.env.SMTP_USER === 'mock_user')) {
      console.log('-----------------------------------------');
      console.log('📧 MOCK EMAIL SENT TO:', to);
      console.log('Subject:', subject);
      console.log('Content:', text);
      if (attachments) console.log('Attachments:', attachments.length);
      console.log('-----------------------------------------');
      return { messageId: 'mock-id' };
    }

    const info = await transporter.sendMail({
      from: `"Flim App" <${process.env.SMTP_FROM || 'noreply@flimy.app'}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });


    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw error to avoid breaking the main flow, but log it
    return null;
  }
};

const sendVerificationApproved = async (user, notes) => {
  return sendEmail({
    to: user.email,
    subject: 'Verification Request Approved! 🎉',
    text: `Hi ${user.name},\n\nGreat news! Your verification request has been approved. You now have a verified badge on your profile.\n\n${notes ? `Admin Notes: ${notes}` : ''}\n\nBest regards,\nThe Flim Team`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Congratulations, ${user.name}!</h2>
        <p>Your verification request has been <strong>approved</strong>. 🎉</p>
        <p>A verified badge has been added to your profile, confirming your professional presence on Flim.</p>
        ${notes ? `<div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;"><strong>Admin Notes:</strong><br/>${notes}</div>` : ''}
        <p>Keep creating amazing content!</p>
        <br/>
        <p>Best regards,<br/>The Flim Team</p>
      </div>
    `
  });
};

const sendVerificationRejected = async (user, notes) => {
  return sendEmail({
    to: user.email,
    subject: 'Update on Your Verification Request',
    text: `Hi ${user.name},\n\nThank you for applying for verification. After reviewing your request, we are unable to approve it at this time.\n\n${notes ? `Reason: ${notes}` : ''}\n\nYou can re-apply once you have addressed the requirements mentioned.\n\nBest regards,\nThe Flim Team`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Hi ${user.name},</h2>
        <p>Thank you for your interest in getting verified on Flim.</p>
        <p>After careful review, we are unable to approve your verification request at this time.</p>
        ${notes ? `<div style="background: #fff0f0; padding: 15px; border-left: 4px solid #ff4d4d; margin: 20px 0;"><strong>Reason:</strong><br/>${notes}</div>` : ''}
        <p>Don't worry! You can apply again in the future once you have more supporting documentation or your profile meets all our criteria.</p>
        <br/>
        <p>Best regards,<br/>The Flim Team</p>
      </div>
    `
  });
};

module.exports = {
  sendEmail,
  sendVerificationApproved,
  sendVerificationRejected
};
