const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [3, 'Name must be at least 3 characters long'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            validate: {
                validator: function (v) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); // Email regex
                },
                message: (props) => `${props.value} is not a valid email address`,
            },
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters long'],
           
        },
        role: {
            type: String,
            enum: ['rider', 'driver', 'admin'], // Added 'admin' for scalability
            required: [true, 'User role is required'],
        },
        isOnline: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, 
    }
);

// Hash the password before saving
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Method to check if entered password is correct
userSchema.methods.comparePassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

// Soft delete method
userSchema.methods.softDelete = async function () {
    this.isDeleted = true;
    await this.save();
};

// Virtual field to mask sensitive data when converting to JSON
userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password; // Remove password from JSON responses
        delete ret.__v; // Remove version key
    },
});

module.exports = mongoose.model('User', userSchema);
