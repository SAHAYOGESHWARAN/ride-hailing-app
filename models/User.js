const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define the User schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
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
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: String,
      enum: ["rider", "driver", "admin"],
      required: [true, "User role is required"],
    },
    driverLat: {
      type: Number, // Latitude for drivers
      default: null,
    },
    driverLong: {
      type: Number, // Longitude for drivers
      default: null,
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
)

// Soft delete method
userSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  await this.save();
};

// Check if the model already exists before defining it
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
