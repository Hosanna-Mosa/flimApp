const { Schema, model } = require('mongoose');

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    bio: { type: String, maxlength: 500 },
    roles: [{ type: String, required: true }],
    industries: [{ type: String, required: true }],
    experience: { type: Number, default: 0 },
    location: { type: String },
    portfolio: [
      {
        title: String,
        type: { type: String },
        url: String,
      },
    ],
    refreshTokens: [{ type: String }],
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = model('User', UserSchema);

