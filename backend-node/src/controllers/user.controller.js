import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";

// Helper to generate access and refresh tokens
const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

// Controller to register user
export const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    age,
    gender,
    occupation,
    pin,
    contact,
    region,
    accountNumber,
    email,
    role,
    savedContacts
  } = req.body;

  // Basic field checks
  if (!name || !email || !accountNumber || !pin) {
    throw new ApiError(400, "Required fields missing");
  }

  // Check if email or account number already exists
  const [emailExists, accountExists] = await Promise.all([
    User.findOne({ email }),
    User.findOne({ accountNumber })
  ]);

  if (emailExists) {
    throw new ApiError(400, "Email already registered");
  }

  if (accountExists) {
    throw new ApiError(400, "Account number already in use");
  }

  // Create user
  const user = await User.create({
    name,
    age,
    gender,
    occupation,
    pin,
    contact,
    region,
    accountNumber,
    email,
    role
  });

  const createdUser = await User.findById(user._id).select("-pin -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "User creation failed");
  }

  // Optionally: generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  res.status(201).json(new ApiResponse(201, {
    user: createdUser,
    tokens: { accessToken, refreshToken }
  }, "User registered successfully"));
});

export const login = asyncHandler(async (req , res) => {
    const { accountNumber, pin , userType} = req.body;
    if (!accountNumber || !pin) {
        throw new ApiError(400, "Account number and PIN are required");
    }
    const user = await User.findOne({ accountNumber , userType }).select("-pin -refreshToken");
    if (!user) {
        throw new ApiError(404, "User not found");
    }   

    if( user.blocked ){
        throw new ApiError(403, "User is blocked");
    }


    if(!await user.method.isPasswordCorrect(pin)){
        throw new ApiError(401, "Incorrect PIN");  
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password");

    const options = { httpOnly: true, secure: true };
    res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { user: loggedInUser, accessToken }, "Login successful"));
})

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  const options = { httpOnly: true, secure: true };
  res.clearCookie("accessToken", options).clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

export const ToggleBlockUser = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    if( !userId ) {
        throw new ApiError(400, "User ID is required");
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    user.blocked = !user.blocked; 
    await user.save();
    res.status(200).json(new ApiResponse(200, { user }, "User blocked successfully"));
}) 

export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-pin -refreshToken");
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    res.status(200).json(new ApiResponse(200, { user }, "User found"));
})