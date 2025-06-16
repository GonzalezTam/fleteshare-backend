import { upload } from '@/config/multer.config';

export const uploadLicense = upload.single('license');
