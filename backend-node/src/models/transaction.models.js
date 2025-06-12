import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  senderAccountNumber: {
    type: String,
    required: true
  },
  receiverAccountNumber: {
    type: String, 
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['Credit', 'Debit'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  fraudPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  deviceId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const Transaction = mongoose.model('Transaction', transactionSchema);
