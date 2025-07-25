const { User } = require('../models');
const { tokenUtils, passwordUtils } = require('../utils/encryption');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email setup (adjust as per your config)
const transporter = nodemailer.createTransport({
  service: 'Gmail',
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
  // Create token
  const token = crypto.randomBytes(32).toString('hex');
  // Set expiration
  const expiresAt = Date.now() + 15 * 60 * 1000;

  // Store token
  emailVerificationTokens.set(token, { userId, expiresAt });

  // Create link
  const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  // Send email
  await transporter.sendMail({
    to: email,
    subject: 'Verify your email',
    html: `<p>Click to verify your email:</p><a href="${link}">${link}</a>`,
  });

  return true;
};

const verifyEmail = async (token) => {
  // Check if token is valid
  const data = emailVerificationTokens.get(token);

  // Check if token is expired
  if (!data || data.expiresAt < Date.now()) {
    throw new Error('Invalid or expired verification token');
  }

  // Check if user exists
  const user = await User.findByPk(data.userId);
  if (!user) throw new Error('User not found');

  // Update user
  user.email_verified = true;
  await user.save();

  // Delete token
  emailVerificationTokens.delete(token);
  return true;
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  sendEmailVerification,
  verifyEmail,
};
