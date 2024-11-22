import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
import { ApiError } from "./ApiError.js";

// Load env vars
dotenv.config({
  path: "./.env",
});

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      throw new ApiError(400, "No file provided");
    }

    // Check if file exists
    if (!fs.existsSync(localFilePath)) {
      throw new ApiError(400, `File not found at path: ${localFilePath}`);
    }

    // Upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "chat_app/profile_pics",
    });

    // File uploaded successfully
    console.log("File uploaded on cloudinary:", response.url);

    // Remove locally saved temp file
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    // Remove locally saved temp file as upload operation failed
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    console.error("Cloudinary upload error:", error);
    throw new ApiError(
      500,
      "Error uploading file to cloudinary: " + error.message
    );
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;

    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new ApiError(500, "Error deleting file from cloudinary");
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
