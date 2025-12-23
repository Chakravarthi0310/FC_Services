const dotenv = require('dotenv');
const { z } = require('zod');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
    PORT: z.string().transform(Number).default('5000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    MONGO_URI: z.string().url(),
    AWS_REGION: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    AWS_S3_BUCKET_NAME: z.string(),
    JWT_SECRET: z.string(),
    CORS_ORIGIN: z.string().default('*'),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
    RAZORPAY_KEY_ID: z.string(),
    RAZORPAY_KEY_SECRET: z.string(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error('❌ Invalid environment variables:', parsedEnv.error.format());
    process.exit(1);
}

module.exports = parsedEnv.data;
