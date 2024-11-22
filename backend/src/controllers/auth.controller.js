import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

//generate token
const generateToken = (userId) => {
  return jwt.sign({ _id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;

  if (!username || !email || !fullName || !password) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new ApiError(
      409,
      existingUser.email === email
        ? "Email already registered"
        : "Username already taken"
    );
  }

  // Create new user
  const user = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    fullName,
    password,
  });

  const createdUser = await User.findById(user._id).select("-password");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */

export const loginUser = asyncHandler(async (req, res) => {
  // 1. Get email/username and password from request body
  const { username, email, password } = req.body;

  console.log(process.env.NODE_ENV, "test 1");

  // 2. Check if username/email is provided
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  // 3. Check if password is provided
  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  // 4. Find user in database using username/email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  }).select("+password"); // explicitly select password since it's default false

  // 5. Check if user exists
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // 6. Verify password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // 7. Generate JWT token
  const token = generateToken(user._id);

  // 8. Remove password from response
  const loggedInUser = user.toPublicProfile();

  // 9. Set token in cookie
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  // 10. Send success response
  return res
    .status(200)
    .cookie("token", token, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, token },
        "User logged in successfully"
      )
    );
});

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Public
 */

export const logoutUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .cookie("token", "", { maxAge: 0 })
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

/**
 * Update user profile
 * @route PUT /api/auth/update-profile
 * @access Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, email, username } = req.body;

  // 1. Get user ID from authenticated request
  const userId = req.user._id;

  // 2. Find user and update
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 3. Update fields if provided
  if (fullName) user.fullName = fullName;
  if (email) user.email = email;
  if (username) user.username = username;

  // 4. Save updated user
  await user.save();

  // 5. Get updated user profile without sensitive data
  const updatedUser = user.toPublicProfile();

  // 6. Send success response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: updatedUser },
        "Profile updated successfully"
      )
    );
});

/**
 * Update user profile picture
 * @route PUT /api/auth/update-profile-pic
 * @access Private
 */

export const updateProfilePic = asyncHandler(async (req, res) => {
  // 1. Check if file exists
  const profilePic = req.file;

  console.log(profilePic, "test 3");
  if (!profilePic) {
    throw new ApiError(400, "Profile picture is required");
  }
  //TODO: delete old image

  // 1. Upload profile picture to cloudinary
  const avatar = await uploadOnCloudinary(profilePic.path);

  if (!avatar) {
    throw new ApiError(500, "Failed to upload profile picture to cloudinary");
  }

  // 2. Get user ID from authenticated request
  const userId = req.user._id;

  // 3. Find user and update profile picture path
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 4. Update profile picture field
  user.profilePic = avatar.url;

  // 5. Save updated user
  await user.save();

  // 6. Get updated user profile without sensitive data
  const updatedUser = user.toPublicProfile();

  // 7. Send success response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: updatedUser },
        "Profile picture updated successfully"
      )
    );
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile fetched"));
});

/**
 * Check if user is authenticated
 * @route GET /api/auth/check
 * @access Private
 */
export const checkAuth = asyncHandler(async (req, res) => {
  // Since this route uses auth middleware, if we reach here the user is authenticated
  const user = req.user;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isAuthenticated: true, user },
        "User is authenticated"
      )
    );
});
