const mongoose = require("mongoose");
const { Readable } = require("stream");

/**
 * Upload a file buffer to MongoDB GridFS
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - File mimetype
 * @returns {Promise<mongoose.Types.ObjectId>} - Promise resolving to the GridFS file ID
 */
function uploadToGridFS(buffer, filename, mimetype) {
  return new Promise((resolve, reject) => {
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "complaintPhotos",
    });

    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { contentType: mimetype },
    });

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);

    readableStream
      .pipe(uploadStream)
      .on("error", (error) => reject(error))
      .on("finish", () => resolve(uploadStream.id));
  });
}

/**
 * Download a file stream from MongoDB GridFS
 * @param {string|mongoose.Types.ObjectId} fileId - The GridFS file ID
 * @returns {Promise<{stream: NodeJS.ReadableStream, contentType: string, filename: string}|null>}
 */
async function downloadFromGridFS(fileId) {
  try {
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "complaintPhotos",
    });

    const objId = new mongoose.Types.ObjectId(fileId.toString());

    // Find the file metadata to extract content-type
    const files = await db.collection("complaintPhotos.files").find({ _id: objId }).toArray();
    if (!files || files.length === 0) {
      return null;
    }

    const fileInfo = files[0];
    const downloadStream = bucket.openDownloadStream(objId);

    return {
      stream: downloadStream,
      contentType: fileInfo.metadata?.contentType || "image/jpeg",
      filename: fileInfo.filename,
    };
  } catch (error) {
    console.error("GridFS download error:", error);
    return null;
  }
}

module.exports = {
  uploadToGridFS,
  downloadFromGridFS,
};
