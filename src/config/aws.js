const { S3Client } = require('@aws-sdk/client-s3');
const config = require('./env');

const s3Client = new S3Client({
    region: config.AWS_REGION,
    credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED', // Disable automatic MD5/CRC32 which can break pre-signed URLs
});

module.exports = s3Client;
