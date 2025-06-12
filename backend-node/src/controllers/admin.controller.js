import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Transaction } from "../models/transaction.models.js";
import mongoose from "mongoose";

export const getStatsByRegion = asyncHandler(async (req, res) => {
    const { region } = req.body;

    if (!region) {
        throw new ApiError(400, "Region query parameter is required");
    }

    // Fetch users and transactions by region
    const users = await User.find({ region });
    const transactions = await Transaction.find({location : region });
    console.log("Transactions in region:", transactions);
    const totalUsers = users.length;
    const totalTransactions = transactions.length;
    const totalAmountTransacted = transactions.reduce((sum, txn) => sum + txn.amount, 0);

    const averageAmountTransacted = totalTransactions > 0
        ? totalAmountTransacted / totalTransactions
        : 0;

    const averageFraudPercentage = totalTransactions > 0
        ? transactions.reduce((sum, txn) => sum + txn.fraudPercentage, 0) / totalTransactions
        : 0;

    // === Total Transactions Daywise ===
    const transactionsDaywise = {};
    transactions.forEach(txn => {
        const date = new Date(txn.createdAt).toISOString().split("T")[0];
        transactionsDaywise[date] = (transactionsDaywise[date] || 0) + 1;
    });

    // === Suspicious Accounts Detection ===
    const suspiciousMap = new Map();

    for (const txn of transactions) {
        const sender = txn.senderAccountNumber;
        if (txn.fraudPercentage > 0.8) {
            suspiciousMap.set(sender, (suspiciousMap.get(sender) || 0) + 1);
        }
    }

    const suspiciousAccounts = [];
    for (const [accountNumber, count] of suspiciousMap) {
        if (count >= 3) {
            suspiciousAccounts.push(accountNumber);
        }
    }

    res.status(200).json(new ApiResponse(200, {
        averageFraudPercentage,
        averageAmountTransacted,
        totalAmountTransacted,
        totalUsers,
        totalTransactions,
        totalTransactionsDaywise: transactionsDaywise,
        suspiciousAccounts
    }, "Region stats retrieved successfully"));
});

export const getStatsByUser = asyncHandler(async (req, res) => {
    const userId = req.params.id;

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Fetch all transactions where the user is sender or receiver
    const transactions = await Transaction.find({
        $or: [
            { senderAccountNumber: user.accountNumber },
            { receiverAccountNumber: user.accountNumber }
        ]
    });

    const totalTransactions = transactions.length;

    let totalAmountSent = 0;
    let totalAmountReceived = 0;
    let fraudSum = 0;
    let highRiskCount = 0;
    const transactionsDaywise = {};

    transactions.forEach(txn => {
        const date = new Date(txn.createdAt).toISOString().split("T")[0];
        transactionsDaywise[date] = (transactionsDaywise[date] || 0) + 1;

        if (txn.senderAccountNumber === user.accountNumber) {
            totalAmountSent += txn.amount;
        }
        if (txn.receiverAccountNumber === user.accountNumber) {
            totalAmountReceived += txn.amount;
        }

        fraudSum += txn.fraudPercentage;
        if (txn.fraudPercentage > 0.8) {
            highRiskCount++;
        }
    });

    const totalAmountTransacted = totalAmountSent + totalAmountReceived;
    const averageTransactionAmount = totalTransactions > 0 ? totalAmountTransacted / totalTransactions : 0;
    const averageFraudPercentage = totalTransactions > 0 ? fraudSum / totalTransactions : 0;
    const suspicious = highRiskCount >= 3;

    res.status(200).json(new ApiResponse(200, {
        user,
        totalTransactions,
        totalAmountSent,
        totalAmountReceived,
        totalAmountTransacted,
        averageTransactionAmount,
        averageFraudPercentage,
        highRiskTransactions: highRiskCount,
        transactionsDaywise,
        suspicious
    }, "User stats retrieved successfully"));
});

export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password -refreshToken");
    if (!users || users.length === 0) {
        throw new ApiError(404, "No users found");
    }
    res.status(200).json(new ApiResponse(200, { users }, "Users retrieved successfully"));
});

export const getAllTransactions = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [transactions, totalCount] = await Promise.all([
        Transaction.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Transaction.countDocuments()
    ]);

    if (!transactions || transactions.length === 0) {
        throw new ApiError(404, "No transactions found");
    }

    res.status(200).json(new ApiResponse(200, {
        transactions,
        pagination: {
            totalTransactions: totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            limit
        }
    }, "Transactions retrieved successfully"));
});


export const registerEmployee = asyncHandler(async (req, res) => {
    const {name , email , contact , pin} = req.body;
    if (!name || !email || !contact || !pin) {
        throw new ApiError(400, "All fields are required");
    }
    const existingEmployee = await User.findOne({ email, role: 'employee' });
    if (existingEmployee) {
        throw new ApiError(400, "Employee with this email already exists");
    }
    const employee = await User.create({
        name,
        email,
        contact,
        pin,
        role: 'employee'
    });
    const createdEmployee = await User.findById(employee._id).select("-pin -refreshToken");
    if (!createdEmployee) {
        throw new ApiError(500, "Employee creation failed");
    }
    res.status(201).json(new ApiResponse(201, { employee }, "Employee registered successfully"));
})

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