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

        // Handle Image Upload if present
        let finalImageUrl = imageUrl;
        let attachmentPath = null;

        // If imageUrl is base64, upload to Cloudinary
        if (imageUrl && imageUrl.startsWith('data:image')) {
            try {
                const cloudinary = require('../config/cloudinary')();
                const uploadResponse = await cloudinary.uploader.upload(imageUrl, {
                    folder: 'support_requests',
                    resource_type: 'image'
                });
                finalImageUrl = uploadResponse.secure_url;
                attachmentPath = finalImageUrl;
            } catch (uploadError) {
                console.error('Cloudinary upload error:', uploadError);
                // Fallback: If upload fails, keep original base64 or log? 
                // We will continue but maybe without proper link.
                // Actually, if upload fails, we likely want to fail the request or just proceed with base64/no-image?
                // Let's proceed with base64 as fallback for safety, though it's huge.
                // Better to just not verify here and let standard error handling catch if critical.
                // For now, let's assume if it fails we don't block the support request but log it.
            }
        } else if (imageUrl) {
            // Already a URL
            attachmentPath = imageUrl;
        }

        const newSupportRequest = new Support({
            userId: user.id,
            reason,
            imageUrl: finalImageUrl,
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
${attachmentPath ? `Image Attached. Download here: ${attachmentPath}` : 'No image attached'}
        `;

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
        if (attachmentPath) {

            // 1. Add as downloadable attachment
            // Derive extension from URL if possible, default to jpg
            const extension = attachmentPath.split('.').pop().split(/[#?]/)[0] || 'jpg';
            const cleanExt = ['jpg', 'jpeg', 'png', 'webp'].includes(extension.toLowerCase()) ? extension : 'jpg';

            attachments.push({
                filename: `support-image-${Date.now()}.${cleanExt}`,
                path: attachmentPath // Nodemailer fetches from URL
            });

            // 2. Add download link in HTML
            html += `<p><strong>Attachment:</strong> <a href="${attachmentPath}" download style="color: #007bff; text-decoration: none;">Download Image</a></p>`;
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
