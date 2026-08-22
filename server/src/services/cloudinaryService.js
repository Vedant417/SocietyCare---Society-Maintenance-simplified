const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

/**
 * Uploads a memory buffer stream to Cloudinary.
 * If Cloudinary is not configured, it returns a high-quality placeholder image URL.
 */
function uploadToCloudinary(fileBuffer, mimeType) {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      console.log('Cloudinary not configured. Returning fallback placeholder image.');
      // Return a clean, descriptive unsplash image matching a repair scenario
      return resolve('https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=800');
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'societycare_complaints',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error('Failed to upload image to Cloudinary.'));
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

module.exports = {
  uploadToCloudinary,
};
