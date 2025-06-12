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

export const login = asyncHandler(async (req, res) => {
  const { accountNumber, pin, userType } = req.body;

  if (!accountNumber || !pin) {
    throw new ApiError(400, "Account number and PIN are required");
  }

  // Include pin to verify it later
  const user = await User.findOne({ accountNumber }).select("+pin +refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.blocked) {
    throw new ApiError(403, "User is blocked");
  }

  // Validate PIN
  const isPinValid = await user.isPasswordCorrect(pin);
  if (!isPinValid) {
    throw new ApiError(401, "Incorrect PIN");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  // Return user data without sensitive fields
  const loggedInUser = await User.findById(user._id).select("-pin -refreshToken");

  const options = { httpOnly: true, secure: true };
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken },
        "Login successful"
      )
    );
});


export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  const options = { httpOnly: true, secure: true };
  res.clearCookie("accessToken", options).clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});



export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-pin -refreshToken");
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    res.status(200).json(new ApiResponse(200, { user }, "User found"));
})


export const addSavedContact = asyncHandler(async (req, res) => {
    const { contactName, contactNumber } = req.body;

    if (!contactName || !contactNumber) {
        throw new ApiError(400, "Contact name and number are required");
    }

    // Step 1: Ensure the contact being added is a valid user
    const contactUser = await User.findOne({ contact: contactNumber });
    if (!contactUser) {
        throw new ApiError(404, "No user found with this contact number");
    }

    // Step 2: Get the current logged-in user
    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
        throw new ApiError(404, "Current user not found");
    }

    // Step 3: Check if contact already exists in current user's savedContacts
    const alreadyExists = currentUser.savedContacts.some(
        contact => contact.contact === contactNumber
    );
    if (alreadyExists) {
        throw new ApiError(400, "Contact already exists in your saved list");
    }

    // Step 4: Add new contact to savedContacts of the current user
    currentUser.savedContacts.push({ name: contactName, contact: contactNumber });
    await currentUser.save();

    res.status(201).json(
        new ApiResponse(201, { savedContacts: currentUser.savedContacts }, "Contact added successfully")
    );
});