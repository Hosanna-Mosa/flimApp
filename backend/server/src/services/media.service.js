const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

/**
 * Media Service - Handles Cloudinary upload signatures and validation
 * Follows production best practices for secure media uploads
 */
class MediaService {
  /**
   * Folder mapping for different media types
   */
  static FOLDERS = {
    image: 'images',
    video: 'videos',
    audio: 'audio',
    script: 'scripts',
  };

  /**
   * File size limits (in bytes)
   */
  static SIZE_LIMITS = {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 20 * 1024 * 1024, // 20MB
    script: 5 * 1024 * 1024, // 5MB
  };

  /**
   * Allowed file formats
   */
  static ALLOWED_FORMATS = {
    image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'heic', 'svg', 'ico'],
    video: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', '3gp', 'm4v', 'ts', 'mts'],
    audio: ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg', 'wma', 'mp4', 'amr', 'aiff', 'alac'],
    script: ['pdf', 'txt', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'rtf', 'odt', 'pages', 'key', 'numbers', 'epub'],
  };

  /**
   * Generate Cloudinary upload signature
   * @param {string} type - Media type (image|video|audio|script)
   * @param {string} userId - User ID for folder organization
   * @returns {Object} Upload configuration with signature
   */
  static async generateUploadSignature(type, userId) {
    if (!['image', 'video', 'audio', 'script'].includes(type)) {
      throw new Error('Invalid media type');
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `${this.FOLDERS[type]}/${userId}`;

    // Upload parameters
    const uploadParams = {
      timestamp,
      folder,
    };

    // Add type-specific transformations
    // Note: Eager transformations must be sent as parameters by client if included here
    /*
    if (type === 'video') {
      uploadParams.eager = 'c_pad,h_300,w_400|c_crop,h_200,w_260';
      uploadParams.eager_async = true;
      uploadParams.eager_notification_url = `${process.env.API_URL}/webhooks/cloudinary`;
    }
    */

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      process.env.CLOUDINARY_API_SECRET
    );

    return {
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
      params: uploadParams, // Return signed params so client can use exact same values
      uploadPreset: null,
      resourceType: type === 'video' ? 'video' : type === 'audio' ? 'video' : 'auto',
      maxFileSize: this.SIZE_LIMITS[type],
      allowedFormats: this.ALLOWED_FORMATS[type],
    };
  }

  /**
   * Validate uploaded media metadata
   * @param {Object} metadata - Media metadata from client
   * @param {string} type - Expected media type
   * @returns {boolean} Validation result
   */
  static validateMediaMetadata(metadata, type) {
    if (!metadata || !metadata.url) {
      throw new Error('Media URL is required');
    }

    // Verify URL is from our Cloudinary account
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!metadata.url.includes(`res.cloudinary.com/${cloudName}`)) {
      throw new Error('Invalid media URL source');
    }

    // Validate format
    if (metadata.format && this.ALLOWED_FORMATS[type]) {
      const format = metadata.format.toLowerCase();
      if (!this.ALLOWED_FORMATS[type].includes(format)) {
        throw new Error(`Invalid format for ${type}: ${format}`);
      }
    }

    // Validate size
    if (metadata.size && metadata.size > this.SIZE_LIMITS[type]) {
      throw new Error(`File size exceeds limit for ${type}`);
    }

    return true;
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param {string} url - Cloudinary URL
   * @returns {string} Public ID
   */
  static extractPublicId(url) {
    try {
      const parts = url.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex === -1) return null;
      
      // Get everything after /upload/v{version}/
      const pathParts = parts.slice(uploadIndex + 2);
      const publicIdWithExt = pathParts.join('/');
      
      // Remove file extension
      return publicIdWithExt.replace(/\.[^/.]+$/, '');
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete media from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @param {string} resourceType - Resource type (image|video|raw)
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteMedia(publicId, resourceType = 'image') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });
      return result;
    } catch (error) {
      console.error('Error deleting media from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Generate video thumbnail URL
   * @param {string} videoUrl - Video URL
   * @returns {string} Thumbnail URL
   */
  static generateVideoThumbnail(videoUrl) {
    // Extract public ID and generate thumbnail transformation
    const publicId = this.extractPublicId(videoUrl);
    if (!publicId) return null;

    return cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: [
        { width: 400, height: 300, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'jpg' },
      ],
    });
  }
}

module.exports = MediaService;
