const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  degreeName: {
    type: String,
    default: 'Computer Science',
    trim: true
  },
  degreeTotalCredits: {
    type: Number,
    default: 120,
    min: 1
  },
  creditCategories: {
    coreSubjects: {
      type: Number,
      default: 24,
      min: 0
    },
    majorRequirements: {
      type: Number,
      default: 84,
      min: 0
    },
    electives: {
      type: Number,
      default: 24,
      min: 0
    },
    generalEducation: {
      type: Number,
      default: 12,
      min: 0
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

