import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Transaction } from "../models/transaction.models.js";
import axios from "axios";

export const createTransaction = asyncHandler(async (req, res) => {
    const {
        receiverAccountNumber,
        amount,
        type,
        location,
        deviceId
    } = req.body;
    const senderAccountNumber = req.user.accountNumber;
    // Validate required fields
    if (!senderAccountNumber || !receiverAccountNumber || !amount || !type || !location || !deviceId) {
        throw new ApiError(400, "Required fields missing");
    }
    if( type !== 'Credit' && type !== 'Debit') {
        throw new ApiError(400, "Invalid transaction type. Must be 'Credit' or 'Debit'.");
    }
    if (amount <= 0) {
        throw new ApiError(400, "Amount must be greater than zero");
    }
    const senderAccount = req.user;
    const receiverAccount = await Transaction.findOne({ receiverAccountNumber });
    if (!senderAccount) {
        throw new ApiError(404, "Sender account not found");
    }
    if (!receiverAccount) {
        throw new ApiError(404, "Receiver account not found");
    }
    if(senderAccount.blocked || receiverAccount.blocked) {
        throw new ApiError(403, "Transaction not allowed for blocked accounts");
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
        user: req.user
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

export const rollbackTransaction = asyncHandler(async (req , res) => {
    
}) 
