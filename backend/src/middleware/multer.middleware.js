import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + getExtension(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  // Accept images and documents
  if (
    file.mimetype.startsWith("image/")
    // file.mimetype === "application/pdf" ||
    // file.mimetype.startsWith("application/msword") ||
    // file.mimetype.startsWith("application/vnd.openxmlformats-officedocument")
  ) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Unsupported file type"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

function getExtension(filename) {
  return filename.substring(filename.lastIndexOf("."));
}

export { upload };
