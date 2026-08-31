const MediaService = require('../services/media.service');
const { success, fail } = require('../utils/response');

/**
 * Media Controller - Handles HTTP requests for media operations
 */
class MediaController {
  /**
   * Generate upload signature for Cloudinary
   * POST /api/media/signature
   */
  static async generateSignature(req, res, next) {
    try {
      const { type } = req.body;
      const userId = req.user.id;

      if (!type) {
        return fail(res, 'Media type is required', 400);
      }

      const signatureData = await MediaService.generateUploadSignature(type, userId);
      
      return success(res, signatureData, 200);
    } catch (err) {
      console.error('Error generating signature:', err);
      return next(err);
    }
  }

  /**
   * Validate media upload
   * POST /api/media/validate
   */
  static async validateMedia(req, res, next) {
    try {
      const { type, metadata } = req.body;

      if (!type || !metadata) {
        return fail(res, 'Type and metadata are required', 400);
      }

      const isValid = MediaService.validateMediaMetadata(metadata, type);
      
      return success(res, { valid: isValid }, 200);
    } catch (err) {
      console.error('Error validating media:', err);
      return fail(res, err.message, 400);
    }
  }

  /**
   * Delete media
   * DELETE /api/media/:publicId
   */
  static async deleteMedia(req, res, next) {
    try {
      const { publicId } = req.params;
      const { resourceType } = req.query;

      if (!publicId) {
        return fail(res, 'Public ID is required', 400);
      }

      // Without this, any authenticated user could delete any other user's
      // media by passing their publicId.
      if (!MediaService.isOwnedBy(publicId, req.user.id)) {
        return fail(res, 'Forbidden', 403);
      }

      const result = await MediaService.deleteMedia(
        publicId,
        resourceType || 'image'
      );
      
      return success(res, result, 200);
    } catch (err) {
      console.error('Error deleting media:', err);
      return next(err);
    }
  }
}

module.exports = MediaController;
