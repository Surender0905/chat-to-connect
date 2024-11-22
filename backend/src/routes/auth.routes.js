import express from "express";
import {
  checkAuth,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile,
  updateProfilePic,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", registerUser);

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post("/login", loginUser);

// @route   GET /api/auth/logout
// @desc    Logout user & clear cookie
// @access  Private
router.get("/logout", verifyJWT, logoutUser);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", verifyJWT, getCurrentUser);

// @route   PUT /api/auth/update-profile
// @desc    Update user details
// @access  Private
router.put("/update-profile", verifyJWT, updateProfile);

// @route   PUT /api/auth/update-profile-pic
// @desc    Update user profile picture
// @access  Private
router.put(
  "/update-profile-pic",
  verifyJWT,
  upload.single("profilePic"),
  updateProfilePic
);

// @route   GET /api/auth/check
// @desc    Check if user is authenticated
// @access  Private
router.get("/check", verifyJWT, checkAuth);

export default router;
