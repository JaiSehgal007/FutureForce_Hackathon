import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Transaction } from "../models/transaction.models.js";
import { User } from "../models/user.models.js";  // Make sure this is imported
import axios from "axios";

function getAgeGroup(age) {
    if (age >= 18 && age <= 25) return "18-25";
    if (age >= 26 && age <= 35) return "26-35";
    if (age >= 36 && age <= 50) return "36-50";
    if (age >= 51) return "51+";
    return "null";
}

export const createTransaction = asyncHandler(async (req, res) => {
    const {
        receiverAccountNumber,
        amount,
        type = 'Debit',
        location,
        deviceId,
        pin
    } = req.body;
    
    const senderAccountNumber = req.user.accountNumber;

    if (!senderAccountNumber || !receiverAccountNumber || !amount || !type || !location || !deviceId || !pin) {
        throw new ApiError(400, "Required fields missing");
    }

    if (type !== 'Credit' && type !== 'Debit') {
        throw new ApiError(400, "Invalid transaction type. Must be 'Credit' or 'Debit'.");
    }

    const senderAccount = await User.findOne({ accountNumber: senderAccountNumber });
    const receiverAccount = await User.findOne({ accountNumber: receiverAccountNumber });
    // console.log(receiverAccount)
    if (!senderAccount) throw new ApiError(404, "Sender account not found");
    if (!receiverAccount) throw new ApiError(404, "Receiver account not found");

    if (senderAccount.blocked || receiverAccount.blocked) {
        throw new ApiError(403, "Transaction not allowed for blocked accounts");
    }

    if (!await senderAccount.isPasswordCorrect(pin)) {
        throw new ApiError(403, "Incorrect PIN");
    }

    // ✅ Store original balances before changing them
    const oldBalanceOrig = senderAccount.accountBalance;
    const oldBalanceDest = receiverAccount.accountBalance;

    if (type === 'Debit' && amount > oldBalanceOrig) {
        throw new ApiError(400, "Insufficient balance for debit transaction");
    }

    const newBalanceOrig = Number(oldBalanceOrig) - Number(amount);
    const newBalanceDest = Number(oldBalanceDest) + Number(amount);
    console.log("newBalanceOrig:", newBalanceOrig, "newBalanceDest:", newBalanceDest);
    
    // ✅ Save updated balances
    senderAccount.accountBalance = Number(newBalanceOrig);
    receiverAccount.accountBalance = Number(newBalanceDest);
    await senderAccount.save();
    await receiverAccount.save();

    const now = new Date();
    const hour = now.getHours();

    const previousTransaction = await Transaction.find({
        senderAccountNumber
    }).sort({ createdAt: -1 }).limit(3);

    const previousDate = previousTransaction[0] ? previousTransaction[0].createdAt : now;
    const timeGapMinutes = Math.floor(Math.abs(now - previousDate) / (1000 * 60));
    const daysSinceLastTxn = Math.ceil(Math.abs(now - previousDate) / (1000 * 3600 * 24));

    // ✅ Fraud detection input
    const errorBalanceOrig = oldBalanceOrig - newBalanceOrig - amount;
    const errorBalanceDest = newBalanceDest - oldBalanceDest - amount;
    console.log("previousTransaction:", previousTransaction);
    const inputToML = {
        // Anomaly model inputs
        TransactionAmount: Number(amount),
        TransactionType: type,
        CustomerOccupation: senderAccount.occupation || "Unknown",
        AccountBalance: oldBalanceOrig,
        DayOfWeek: now.toLocaleString('en-US', { weekday: 'long' }),
        Hour: hour,
        Time_Gap: timeGapMinutes,
        Hour_of_Transaction: hour,
        AgeGroup: getAgeGroup(senderAccount.age),
        Days_Since_Last_Transaction: daysSinceLastTxn,
        location : location,
        previousTransactions : previousTransaction,
        // XGBoost model inputs
        amount : Number(amount),
        oldBalanceOrig : Number(oldBalanceOrig),
        newBalanceOrig : Number(newBalanceOrig),
        oldBalanceDest : Number(oldBalanceDest),
        newBalanceDest : Number(newBalanceDest),
        errorBalanceOrig : Number(errorBalanceOrig),
        errorBalanceDest : Number(errorBalanceDest)
    };
    // console.log("previousTransaction:", previousTransaction);
    console.log("Input to ML:", inputToML);
    let fraudPercentage = 0;
    try {
        const { data } = await axios.post(`${process.env.PYTHON_API_URL}/predict`, inputToML);
        console.log("ML backend response:", data);
        fraudPercentage = data.fraud_percentage ? data.fraud_percentage : 0;
    } catch (error) {
        console.error("ML backend error:", error?.response?.data || error.message);
        fraudPercentage = 0;
    }

    const transaction = await Transaction.create({
        senderAccountNumber,
        receiverAccountNumber,
        amount,
        type,
        location,
        fraudPercentage,
        deviceId
    });

    res.status(201).json(new ApiResponse(201, transaction, "Transaction created successfully"));
});

export const getTransactionHistory = asyncHandler(async (req, res) => {
    const accountNumber = req.user.accountNumber;

    if (!accountNumber) {
        throw new ApiError(400, "Account number is required");
    }

    const transactions = await Transaction.find({
        $or: [
            { senderAccountNumber: accountNumber },
            { receiverAccountNumber: accountNumber }
        ]
    }).sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse("Transaction history retrieved successfully", transactions));
});
