const { User, EmailVerificationToken } = require('../models');
const { tokenUtils, passwordUtils } = require('../utils/encryption');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Op } = require('sequelize');

// Email setup (adjust as per your config)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const registerUser = async ({ email, password, name }) => {
  // Check if email is already registered
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) throw new Error('Email already registered');

  // Create user
  const hashedPassword = await passwordUtils.hash(password);
  const user = await User.create({ email, name, password: hashedPassword });

  // Generate tokens
  const payload = { userId: user.id };
  const tokens = tokenUtils.generateTokenPair(payload);

  return { user, tokens };
};

const loginUser = async ({ email, password }) => {
  // Check if user exists
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error('Invalid credentials');

  // Verify password
  const isMatch = await passwordUtils.verify(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  // Generate tokens
  const payload = { userId: user.id };
  const tokens = tokenUtils.generateTokenPair(payload);

  return { user, tokens };
};

const refreshAccessToken = (refreshToken) => {
  // Verify and decode refresh token
  const decoded = tokenUtils.verifyRefreshToken(refreshToken);

  // Generate payload
  const payload = {
    userId: decoded.userId,
    tokenVersion: decoded.tokenVersion || 0,
  };

  // Generate new access token
  const accessToken = tokenUtils.generateAccessToken(payload);
  return accessToken;
};

// In-memory store for tokens (can use DB or Redis in prod)
const passwordResetTokens = new Map();
const emailVerificationTokens = new Map();

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error('User not found with this email');

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

  passwordResetTokens.set(token, { userId: user.id, expiresAt });

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    to: user.email,
    subject: 'Reset your password',
    html: `<p>Click below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
  });

  return true;
};

const resetPassword = async (token, newPassword) => {
  // Check if token is valid
  const data = passwordResetTokens.get(token);

  // Check if token is expired
  if (!data || data.expiresAt < Date.now()) {
    throw new Error('Invalid or expired token');
  }

  // Check if user exists
  const user = await User.findByPk(data.userId);
  if (!user) throw new Error('User not found');

  // Update password
  const hashed = await passwordUtils.hash(newPassword);
  user.password = hashed;
  await user.save();

  // Delete token
  passwordResetTokens.delete(token);
  return true;
};

const sendEmailVerification = async (userId, email) => {
  // Generate a secure, random token
  const token = crypto.randomBytes(32).toString('hex');
  // Set the expiration time (e.g., 15 minutes from now)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // If the user already has a verification token, delete it
  const existingToken = await EmailVerificationToken.findOne({
    where: { userId},
  });

  if (existingToken) {
    await instance.destroy();
  }

  // Store the token and its details in the database
  await EmailVerificationToken.create({
    userId,
    token,
    expiresAt,
  });

  // Create the verification link
  const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  // Send the verification email
  await transporter.sendMail({
    to: email,
    subject: 'Verify your email for BuildSpace',
    html: `
      <h2>Welcome to BuildSpace!</h2>
      <p>Please click the link below to verify your email address. This link is valid for 15 minutes.</p>
      <a href="${link}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
    `,
  });

  return true;
};

const verifyEmail = async (token) => {
  // Find the token in the database
  const verificationToken = await EmailVerificationToken.findOne({
    where: {
      token,
      expiresAt: { [Op.gt]: new Date() }, // Check that the token is not expired
    },
  });

  // If no token is found or it's expired, throw an error
  if (!verificationToken) {
    throw new Error('Invalid or expired verification token');
  }

  // Find the user associated with the token
  const user = await User.findByPk(verificationToken.userId);
  if (!user) throw new Error('User not found');

  // Update the user's verification status
  user.email_verified = true;
  await user.save();

  // Delete the token so it cannot be used again
  await verificationToken.destroy();

  return true;
};

// In-memory store for verification codes (this is temporary)
const verificationCodes = {};

// Send 4-digit code via email
const sendVerificationCode = async (email) => {
  const code = crypto.randomInt(1000, 9999); // Generate a random 4-digit code

  // Store the code in memory with an expiration time (e.g., 10 minutes)
  verificationCodes[email] = {
    code: code,
    expiresAt: Date.now() + 10 * 60 * 1000, // Code expires in 10 minutes
  };

  // Send the code via email using nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your email here
      pass: process.env.EMAIL_PASS, // Your email password or app password here
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your 4-Digit Verification Code',
    text: `Your verification code is: ${code}`,
  };

  await transporter.sendMail(mailOptions);
};

// Verify the code and register the user
const verifyCodeAndRegister = async (email, code) => {
  // Check if the code is in memory for this email
  const storedCode = verificationCodes[email];
  console.log('Stored Code:', storedCode.code);
  console.log('Received Code:', code);
  if (!storedCode) {
    throw new Error('No verification code sent to this email');
  }

  // Check if the verification code has expired
  if (storedCode.expiresAt < Date.now()) {
    delete verificationCodes[email]; // Remove expired code from memory
    throw new Error('Verification code expired');
  }

  // Check if the provided code matches the stored code
  if (storedCode.code !== code) {
    throw new Error('Invalid verification code');
  }

  // Check if the user already exists
  let user = await User.findOne({ where: { email } });

  if (user) {
    // If user exists, just log them in by generating tokens
    const payload = { userId: user.id };
    const tokens = tokenUtils.generateTokenPair(payload);
    return { user, tokens }; // Return the existing user and tokens
  }

  // If user does not exist, create a new user
  user = await User.create({
    email,
    password: '', // You can set an empty password or leave it for now
    name: '', // Empty name, you can update this later if needed
  });

  // Generate tokens for the new user
  const payload = { userId: user.id };
  const tokens = tokenUtils.generateTokenPair(payload);

  await user.save(); // Save the new user

  // Optionally, clear the code after successful registration
  delete verificationCodes[email]; // Remove code from memory after use

  return { user, tokens }; // Return the new user and tokens
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  sendEmailVerification,
  verifyEmail,
  sendVerificationCode,
  verifyCodeAndRegister,
};
