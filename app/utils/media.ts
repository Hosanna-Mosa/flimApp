import api from './api';

export interface CloudinaryResponse {
  url: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  pages?: number;
  thumbnail_url?: string;
}

export type UploadProgressCallback = (percent: number) => void;

/**
 * Upload media directly to Cloudinary using signed uploads
 */
export const uploadMediaToCloudinary = async (
  file: { uri: string; type?: string; name?: string; size?: number },
  type: 'image' | 'video' | 'audio' | 'script',
  token: string,
  onProgress?: UploadProgressCallback
): Promise<CloudinaryResponse> => {
  try {
    // 1. Get Signature from Backend
    const config = await api.getMediaSignature(type, token);
    const { signature, timestamp, apiKey, cloudName, folder } = config;

    // 2. Prepare Form Data
    const formData = new FormData();
    
    // Determine mime type if missing
    let mimeType = file.type;
    if (!mimeType) {
      if (type === 'image') mimeType = 'image/jpeg';
      else if (type === 'video') mimeType = 'video/mp4';
      else if (type === 'audio') mimeType = 'audio/mpeg';
      else if (type === 'script') mimeType = 'application/pdf';
    }

    // Append file
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData.append('file', {
      uri: file.uri,
      type: mimeType,
      name: file.name || `upload_${Date.now()}.${mimeType?.split('/')[1] || 'tmp'}`,
    } as any);

    // Append standard parameters
    formData.append('api_key', apiKey);
    formData.append('signature', signature);
    
    // Append all signed parameters from backend
    if (config.params) {
      Object.keys(config.params).forEach((key) => {
        formData.append(key, config.params[key]);
      });
    } else {
      // Fallback for backward compatibility
      formData.append('timestamp', timestamp.toString());
      formData.append('folder', folder);
    }
    
    // 3. Upload using XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Determine Cloudinary resource type for URL
      // scripts usually are 'raw' or 'image' (if PDF -> image can work for previews and page counting, but 'raw' is default for docs)
      // To get 'pages' count and 'pg_x' image generation, PDF must be uploaded as 'image' (or 'paged')
      let resourceType = 'auto'; // Default
      
      if (type === 'image') resourceType = 'image';
      if (type === 'video') resourceType = 'video';
      if (type === 'audio') resourceType = 'video'; // Cloudinary handles audio under video resource type
      if (type === 'script') {
         const isPdf = mimeType === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
         resourceType = isPdf ? 'image' : 'raw'; 
      }

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      xhr.open('POST', uploadUrl);

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              url: response.secure_url,
              publicId: response.public_id,
              format: response.format,
              width: response.width,
              height: response.height,
              duration: response.duration,
              bytes: response.bytes,
              pages: response.pages,
              thumbnail_url: response.thumbnail_url
            });
          } catch (e) {
            reject(new Error('Failed to parse Cloudinary response'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error?.message || 'Upload failed'));
          } catch (e) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network request failed'));
      };

      xhr.send(formData);
    });

  } catch (error) {
    console.error('Media upload error:', error);
    throw error;
  }
};
