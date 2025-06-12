import mongoose from mongoose
import { User } from "../models/user.models.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Transaction } from "../models/transaction.models.js"
export const addMoneyToWallet = asyncHandler(async (req, res) => {
    const { AccountNumber , amount , location , deviceId } = req.body;
    if (!AccountNumber || !amount) {
        throw new ApiError(400, "User ID and amount are required");
    }
    if (amount <= 0) {
        throw new ApiError(400, "Amount must be greater than zero");
    }
    const user = await User.findOne({ accountNumber: AccountNumber });
    if (!user) {
        throw new ApiError(404, "User not found with the given account number");
    }
    if (user.blocked) {
        throw new ApiError(403, "User is blocked and cannot perform this operation");
    }
    const createdTransaction = await Transaction.create({
        senderAccountNumber: "System",
        receiverAccountNumber: AccountNumber,
        amount,
        type: "Credit",
        location: req.body.location || "Unknown",
        deviceId: req.body.deviceId || "Unknown",
        fraudPercentage: 0 // Default to 0 for wallet top-up
    });
    if (!createdTransaction) {
        throw new ApiError(500, "Failed to create transaction");
    }
    user.balance = (user.balance || 0) + amount;
    await user.save();
    res.status(201).json(new ApiResponse(201, {
        transaction: createdTransaction,
        user: await User.findById(user._id).select("-pin -refreshToken")
    }, "Money added to wallet successfully"));
})

