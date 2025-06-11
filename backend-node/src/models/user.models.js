import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 0
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  occupation: {
    type: String,
    required: true,
    trim: true
  },
  pin: {
    type: Number,
    required: true
  },
  blocked: {
    type: Boolean,
    default: false
  },
  accountBalance: {
    type: Number,
    default: 0
  },
  contact: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'employee'],
    default: 'user'
  },
  savedContacts: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    contact: {
      type: String,
      required: true,
      trim: true
    }
  }],
}, {
  timestamps: true
});


userSchema.pre("save", async function (next) {
  if (!this.isModified("pin")) return next();
  this.pin = await bcrypt.hash(this.pin, 10);
  next();
});


userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, name: this.name },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

userSchema.methods.isPasswordCorrect = async function (pin) {
  return await bcrypt.compare(pin, this.pin);
};


export const User = mongoose.model('User', userSchema);
