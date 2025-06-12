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
        type,
        location,
        deviceId
    } = req.body;

    const senderAccountNumber = req.user.accountNumber;

    if (!senderAccountNumber || !receiverAccountNumber || !amount || !type || !location || !deviceId) {
        throw new ApiError(400, "Required fields missing");
    }

    if (type !== 'Credit' && type !== 'Debit') {
        throw new ApiError(400, "Invalid transaction type. Must be 'Credit' or 'Debit'.");
    }

    if (amount <= 0) {
        throw new ApiError(400, "Amount must be greater than zero");
    }

    const senderAccount = await User.findOne({ accountNumber: senderAccountNumber });
    const receiverAccount = await User.findOne({ accountNumber: receiverAccountNumber });

    if (!senderAccount) throw new ApiError(404, "Sender account not found");
    if (!receiverAccount) throw new ApiError(404, "Receiver account not found");
    if (senderAccount.blocked || receiverAccount.blocked) {
        throw new ApiError(403, "Transaction not allowed for blocked accounts");
    }

    const now = new Date();
    const hour = now.getHours();

    const previousTransaction = await Transaction.findOne({
        senderAccountNumber
    }).sort({ createdAt: -1 });

    const previousDate = previousTransaction ? previousTransaction.createdAt : now;
    const timeGapMinutes = Math.floor(Math.abs(now - previousDate) / (1000 * 60)); // In minutes
    const daysSinceLastTxn = Math.ceil(Math.abs(now - previousDate) / (1000 * 3600 * 24));

    // Calculate XGBoost-related values
    const oldBalanceOrig = senderAccount.accountBalance;
    const newBalanceOrig = oldBalanceOrig - amount;
    const oldBalanceDest = receiverAccount.accountBalance;
    const newBalanceDest = oldBalanceDest + amount;
    const errorBalanceOrig = oldBalanceOrig - newBalanceOrig - amount;
    const errorBalanceDest = newBalanceDest - oldBalanceDest - amount;

    const inputToML = {
        // Anomaly model inputs
        TransactionAmount: amount,
        TransactionType: type,
        CustomerOccupation: senderAccount.occupation,
        AccountBalance: oldBalanceOrig,
        DayOfWeek: now.toLocaleString('en-US', { weekday: 'long' }),
        Hour: hour,
        Time_Gap: timeGapMinutes,
        Hour_of_Transaction: hour,
        AgeGroup: getAgeGroup(senderAccount.age),
        Days_Since_Last_Transaction: daysSinceLastTxn,
        
        // XGBoost model inputs
        amount: amount,
        oldBalanceOrig: oldBalanceOrig,
        newBalanceOrig: newBalanceOrig,
        oldBalanceDest: oldBalanceDest,
        newBalanceDest: newBalanceDest,
        errorBalanceOrig: errorBalanceOrig,
        errorBalanceDest: errorBalanceDest
    };


    let fraudPercentage = 0;
    try {
        const { data } = await axios.post("http://127.0.0.1:8000/predict", inputToML);
        fraudPercentage = data.risk_score ? parseFloat((data.risk_score * 100).toFixed(2)) : 0;
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

    res.status(201).json(new ApiResponse("Transaction created successfully", transaction));
});
