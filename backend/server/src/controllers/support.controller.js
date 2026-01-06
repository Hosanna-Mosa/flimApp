const Support = require('../models/Support.model');
const { sendEmail } = require('../services/mail.service');
const { success, error } = require('../utils/response');

const createSupportRequest = async (req, res, next) => {
    try {
        const { reason, imageUrl } = req.body;
        const user = req.user;

        if (!reason) {
            return res.status(400).json({ message: 'Reason is required' });
        }

        const newSupportRequest = new Support({
            userId: user.id,
            reason,
            imageUrl,
        });

        await newSupportRequest.save();

        // Send Email to Admin
        const adminEmail = 'hosannamosa4190@gmail.com';
        const subject = `New Support Request from ${user.name}`;
        const text = `
User: ${user.name} (${user.email})
User ID: ${user.id}
Reason: ${reason}
Date: ${new Date().toLocaleString()}
${imageUrl ? 'Image attached' : 'No image attached'}
        `;

        // Use CID for inline image to work in Gmail
        const imageCid = 'support-image-' + Date.now();

        let html = `
<div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
    <h2 style="color: #333;">New Support Request</h2>
    <p><strong>User:</strong> ${user.name} (<a href="mailto:${user.email}">${user.email}</a>)</p>
    <p><strong>User ID:</strong> ${user.id}</p>
    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
    <p><strong>Reason:</strong></p>
    <p style="background-color: #f9f9f9; padding: 15px; border-radius: 4px;">${reason}</p>
    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
`;

        const attachments = [];
        if (imageUrl) {
            // Pass data URI directly. Nodemailer handles it if path is set to data URI.
            // We give it a cid to reference in HTML.
            attachments.push({
                path: imageUrl,
                cid: imageCid
            });
            html += `<p><strong>Attachment:</strong></p><img src="cid:${imageCid}" style="max-width: 500px; height: auto; border-radius: 4px;" />`;
        }

        html += `</div>`;

        await sendEmail({
            to: adminEmail,
            subject,
            text,
            html,
            attachments
        });

        return res.status(201).json({
            success: true,
            message: 'Support request submitted successfully',
            data: newSupportRequest,
        });
    } catch (err) {
        console.error('Error creating support request:', err);
        return next(err); // Pass error to global error handler
    }
};

module.exports = {
    createSupportRequest,
};
