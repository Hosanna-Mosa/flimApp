const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['VERIFICATION_ADMIN', 'SUPER_ADMIN'], 
      default: 'VERIFICATION_ADMIN' 
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// Hash password before saving
AdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = model('Admin', AdminSchema);
