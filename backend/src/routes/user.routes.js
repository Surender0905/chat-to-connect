import express from "express";

import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

// Protect all routes
router.use(verifyJWT);

// Get all users except the logged in user
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("-password")
      .sort({ fullName: 1 });

    if (!users?.length) {
      throw new ApiError(404, "No users found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, users, "Users fetched successfully"));
  })
);

export default router;
