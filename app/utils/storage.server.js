import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const provider = process.env.STORAGE_PROVIDER || "local";
const uploadDir = path.join(process.cwd(), "public", "uploads");

// Cloud storage configuration
const cloudConfig = {
  bucket: process.env.STORAGE_BUCKET,
  endpoint: process.env.STORAGE_ENDPOINT,
  accessKey: process.env.STORAGE_ACCESS_KEY,
  secretKey: process.env.STORAGE_SECRET_KEY,
  region: process.env.STORAGE_REGION || "us-east-1"
};


async function ensureDir() {
await fs.mkdir(uploadDir, { recursive: true });
}


export async function saveImage(file) {
const ext = path.extname(file.name) || ".jpg";
const id = randomUUID();
const fileName = `${id}${ext}`;


if (provider === "local") {
await ensureDir();
const arrayBuffer = await file.arrayBuffer();
const buf = Buffer.from(arrayBuffer);
const filePath = path.join(uploadDir, fileName);
await fs.writeFile(filePath, buf);
const publicUrl = `/uploads/${fileName}`;
return { url: publicUrl, id };
}


// TODO: implement S3 upload here using @aws-sdk/client-s3 when switching provider
throw new Error("S3 provider not yet wired; set STORAGE_PROVIDER=local in .env");
}

/**
 * Convert a blob URL or data URL to a permanent file
 * @param {string} imageUrl - Blob URL, data URL, or existing permanent URL
 * @returns {Promise<string>} Permanent URL
 */
export async function convertToPermanentImage(imageUrl) {
  try {
    // If it's already a permanent URL (starts with /uploads/ or http), return as is
    if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // If it's a data URL, convert it to a file
    if (imageUrl.startsWith('data:')) {
      const id = randomUUID();
      const fileName = `${id}.jpg`;
      
      if (provider === "local") {
        await ensureDir();
        
        // Parse data URL
        const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          console.error('Invalid data URL format:', imageUrl.substring(0, 100) + '...');
          return '/api/placeholder/200/150';
        }
        
        const base64Data = matches[2];
        const buf = Buffer.from(base64Data, 'base64');
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buf);
        
        console.log('Successfully saved image locally:', fileName);
        return `/uploads/${fileName}`;
      }
      
      if (provider === "cloudinary") {
        // Use Cloudinary for production
        return await uploadToCloudinary(imageUrl, fileName);
      }
      
      if (provider === "s3") {
        // Use AWS S3 for production
        return await uploadToS3(imageUrl, fileName);
      }
      
      throw new Error(`Unsupported storage provider: ${provider}`);
    }

    // If it's a blob URL or placeholder, return placeholder
    if (imageUrl.startsWith('blob:') || imageUrl.includes('/api/placeholder/')) {
      console.log('Using placeholder for blob URL or placeholder');
      return '/api/placeholder/200/150';
    }

    // Default fallback
    console.log('Using fallback placeholder for unknown URL type:', imageUrl.substring(0, 50));
    return '/api/placeholder/200/150';
  } catch (error) {
    console.error('Error in convertToPermanentImage:', error.message);
    return '/api/placeholder/200/150';
  }
}

// Cloudinary upload function
async function uploadToCloudinary(dataUrl, fileName) {
  try {
    // Parse data URL
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid data URL format');
    }
    
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Convert to base64 string for Cloudinary
    const base64String = `data:image/jpeg;base64,${base64Data}`;
    
    const formData = new FormData();
    formData.append('file', base64String);
    formData.append('public_id', `keys/${fileName.replace('.jpg', '')}`);
    formData.append('folder', 'keycliq');
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString('base64')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Successfully uploaded to Cloudinary:', result.public_id);
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

// S3 upload function (placeholder - needs AWS SDK)
async function uploadToS3(dataUrl, fileName) {
  console.log('S3 upload not implemented yet - using placeholder');
  return '/api/placeholder/200/150';
}