const { S3Client } = require('@aws-sdk/client-s3');
const config = require('./env');

const s3Client = new S3Client({
    region: config.AWS_REGION,
    credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
    // Prevent automatic checksum parameters in signed URLs which can cause CORS/Signature issues with simple fetch
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
});

module.exports = s3Client;
