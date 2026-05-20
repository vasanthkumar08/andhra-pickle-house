import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    AUTH_PROVIDER: z.enum(['firebase', 'legacy']).default('firebase'),
    API_PORT: z
      .preprocess((value) => value ?? process.env.PORT, z.coerce.number().int().positive().default(4000)),
    DATABASE_URL: z
      .string()
      .min(1)
      .refine((value) => value.startsWith('postgresql://') || value.startsWith('postgres://'), {
        message:
          'DATABASE_URL must be a PostgreSQL connection string. Supabase REST URLs are not valid for Prisma.',
      }),
    DIRECT_URL: z
      .string()
      .optional()
      .refine(
        (value) => !value || value.startsWith('postgresql://') || value.startsWith('postgres://'),
        { message: 'DIRECT_URL must be a PostgreSQL connection string when provided.' }
      ),
    REDIS_URL: z.string().url().default('redis://localhost:6379'),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES: z.string().default('15m'),
    JWT_REFRESH_EXPIRES: z.string().default('7d'),
    WEB_URL: z.string().url(),
    CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001,http://localhost:3002'),
    OTP_PROVIDER: z.enum(['console', 'twilio', 'msg91']).default('console'),
    OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(5),
    OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    WHATSAPP_BUSINESS_NUMBER: z.string().min(10),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),
    TWILIO_FROM_PHONE: z.string().optional(),
    TWILIO_WHATSAPP_FROM: z.string().optional(),
    ADMIN_PHONE: z.string().optional(),
    MAX_UPLOAD_MB: z.coerce.number().int().positive().default(50),
    UPLOAD_DIR: z.string().default('./uploads'),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    CLOUDINARY_UPLOAD_FOLDER: z.string().default('andhra-pickle-house'),
    CLOUDINARY_REQUIRED: z.coerce.boolean().default(false),
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
    QUEUE_WORKER_ENABLED: z.coerce.boolean().default(false),
    WORKER_CONCURRENCY: z.coerce.number().int().positive().max(50).default(5),
  })
  .superRefine((value, ctx) => {
    const cloudinaryRequired = value.NODE_ENV === 'production' || value.CLOUDINARY_REQUIRED;
    const hasCloudinary =
      Boolean(value.CLOUDINARY_CLOUD_NAME) &&
      Boolean(value.CLOUDINARY_API_KEY) &&
      Boolean(value.CLOUDINARY_API_SECRET);

    if (cloudinaryRequired && !hasCloudinary) {
      for (const key of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'] as const) {
        if (!value[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: 'Cloudinary credentials are required in production or when CLOUDINARY_REQUIRED=true.',
          });
        }
      }
    }

    if (value.AUTH_PROVIDER === 'firebase') {
      for (const key of ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'] as const) {
        if (!value[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: 'Firebase Admin credentials are required when AUTH_PROVIDER=firebase.',
          });
        }
      }
    }

    if (value.AUTH_PROVIDER === 'legacy' && value.NODE_ENV === 'production' && value.OTP_PROVIDER === 'console') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['OTP_PROVIDER'],
        message: 'Console OTP provider is not allowed in production.',
      });
    }

    if (value.NODE_ENV === 'production' && value.OTP_PROVIDER === 'msg91') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['OTP_PROVIDER'],
        message: 'MSG91 provider is not implemented. Use twilio or add a real MSG91 adapter.',
      });
    }

    if (value.OTP_PROVIDER === 'twilio') {
      const canSendSms =
        Boolean(value.TWILIO_MESSAGING_SERVICE_SID) || Boolean(value.TWILIO_FROM_PHONE);
      for (const key of ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'] as const) {
        if (!value[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: 'Twilio credentials are required when OTP_PROVIDER=twilio.',
          });
        }
      }
      if (!canSendSms) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['TWILIO_MESSAGING_SERVICE_SID'],
          message: 'Set TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_PHONE when OTP_PROVIDER=twilio.',
        });
      }
    }
  });

export type EnvSchema = z.infer<typeof envSchema>;
