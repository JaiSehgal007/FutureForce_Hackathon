import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Transaction } from "../models/transaction.models.js";
import axios from "axios";

export const createTransaction = asyncHandler(async (req, res) => {
    const {
        senderAccountNumber,
        receiverAccountNumber,
        amount,
        type,
        location,
        deviceId
    } = req.body;
    
    // Validate required fields
    if (!senderAccountNumber || !receiverAccountNumber || !amount || !type || !location || !deviceId) {
        throw new ApiError(400, "Required fields missing");
    }
    
    // Create transaction
    const currentTransaction = {
        senderAccountNumber,
        receiverAccountNumber,
        amount,
        type,
        location,
        deviceId
    };

    const fraudPercentage = axios.get("Link" , {
        currentTransaction,
        userId: req.user._id
    })

    const transaction = await Transaction.create({
        senderAccountNumber,
        receiverAccountNumber,
        amount,
        type,
        location,
        fraudPercentage: fraudPercentage || 0, // Default to 0 if not provided
        deviceId
    });
    
    // Send response
    res.status(201).json(new ApiResponse("Transaction created successfully", transaction));
})