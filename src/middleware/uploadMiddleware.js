import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";

const s3 = new S3Client({
  region: env.awsRegion,
  credentials: {
    accessKeyId: env.awsAccessKeyId,
    secretAccessKey: env.awsSecretAccessKey
  }
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
    return;
  }

  cb(new Error("Only image files are allowed."), false);
};

const storage = multerS3({
  s3,
  bucket: env.awsBucketName,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  contentDisposition: "inline",
  key: (_req, file, cb) => {
    const fileName = `uploads/${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, fileName);
  }
});

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

export const singleUploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }
}).single("image");
