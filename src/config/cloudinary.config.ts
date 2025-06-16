import { v2 as cloudinary } from 'cloudinary';
import { CONFIG } from './env.config';

cloudinary.config({
  cloud_name: CONFIG.cloudinaryCloudName,
  api_key: CONFIG.cloudinaryApiKey,
  api_secret: CONFIG.cloudinaryApiSecret,
  secure: true,
});

export default cloudinary;
