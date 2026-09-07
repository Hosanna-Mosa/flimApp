const Support = require('../models/Support.model');
const { sendEmail, DETACHED_SEND_TIMEOUT_MS } = require('../services/mail.service');
const { success } = require('../utils/response');

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

        // If imageUrl is base64, upload to Cloudinary with strict validation
        if (imageUrl && imageUrl.startsWith('data:image')) {
            // 1. Validate MIME type
            const mimeTypeMatch = imageUrl.match(/^data:(image\/(jpeg|png|webp|gif));base64,/);
            if (!mimeTypeMatch) {
                return res.status(400).json({ message: 'Invalid image format. Supported formats are JPEG, PNG, WEBP, and GIF.' });
            }

            // 2. Validate approximate file size (Limit to 5MB)
            const approxSizeInBytes = (imageUrl.length * 3) / 4;
            if (approxSizeInBytes > 5 * 1024 * 1024) {
                return res.status(400).json({ message: 'Attached image is too large. Max allowed size is 5MB.' });
            }

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
            }
        } else if (imageUrl) {
            // Only accept https URLs on our own Cloudinary account. nodemailer's
            // `path` also resolves LOCAL FILESYSTEM paths, so an unvalidated
            // value here would let a caller mail themselves server files.
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            const allowedPrefix = `https://res.cloudinary.com/${cloudName}/`;
            if (typeof imageUrl === 'string' && imageUrl.startsWith(allowedPrefix)) {
                finalImageUrl = imageUrl;
                attachmentPath = imageUrl;
            } else {
                return res.status(400).json({ message: 'Invalid image URL' });
            }
        }

        // Escape anything user-controlled before it goes into the HTML email.
        const escapeHtml = (value) =>
            String(value == null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

        const newSupportRequest = new Support({
            userId: user.id,
            reason,
            imageUrl: finalImageUrl,
        });

        await newSupportRequest.save();

        // Send Email to Admin
        const adminEmail = process.env.SUPPORT_ADMIN_EMAIL || process.env.SMTP_USER;
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
    <p><strong>User:</strong> ${escapeHtml(user.name)} (<a href="mailto:${escapeHtml(user.email)}">${escapeHtml(user.email)}</a>)</p>
    <p><strong>User ID:</strong> ${escapeHtml(user.id)}</p>
    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
    <p><strong>Reason:</strong></p>
    <p style="background-color: #f9f9f9; padding: 15px; border-radius: 4px;">${escapeHtml(reason)}</p>
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
            html += `<p><strong>Attachment:</strong> <a href="${escapeHtml(attachmentPath)}" download style="color: #007bff; text-decoration: none;">Download Image</a></p>`;
        }

        html += `</div>`;

        // The request is already saved above; this email only notifies the
        // admin, and the user is not waiting on it. Detach it so their response
        // is not held behind Gmail, and give it the longer detached budget
        // since nodemailer fetches any attachment from its URL during send.
        void sendEmail({
            to: adminEmail,
            subject,
            text,
            html,
            attachments,
            timeoutMs: DETACHED_SEND_TIMEOUT_MS
        })
            .then((info) => {
                if (!info) console.error('[Support] Request saved, admin notification email failed');
            })
            .catch((mailErr) => {
                console.error('[Support] Admin notification email threw:', mailErr.message);
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
