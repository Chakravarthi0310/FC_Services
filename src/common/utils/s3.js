const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../../config/aws');
const config = require('../../config/env');

/**
 * Generate a presigned URL for uploading a file to S3
 * @param {string} key S3 Object Key
 * @param {string} contentType MIME type of the file
 * @returns {Promise<string>} Presigned URL
 */
const generatePresignedUrl = async (key, contentType) => {
    const command = new PutObjectCommand({
        Bucket: config.AWS_S3_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    return getSignedUrl(s3Client, command, {
        expiresIn: 3600,
        unhoistableHeaders: new Set(['content-type']) // Force Content-Type to be part of the signed headers
    });
};

module.exports = {
    generatePresignedUrl,
};
