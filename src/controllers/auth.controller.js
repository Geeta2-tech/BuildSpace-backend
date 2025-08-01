const authService = require('../services/auth.service');

// ----------------------- REGISTER -----------------------
const register = async (req, res) => {
  try {
    const { user, tokens } = await authService.registerUser(req.body);

    res
      .cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000,
      })
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(201)
      .json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          email_verified: user.email_verified,
        },
      });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ----------------------- LOGIN -----------------------
const login = async (req, res) => {
  try {
    const { user, tokens } = await authService.loginUser(req.body);

    res
      .cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000,
      })
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          email_verified: user.email_verified,
        },
      });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ----------------------- LOGOUT -----------------------
const logout = (req, res) => {
  res
    .clearCookie('accessToken')
    .clearCookie('refreshToken')
    .status(200)
    .json({ message: 'Logged out successfully' });
};

// ------------------- REFRESH TOKEN ---------------------
const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const newAccessToken = authService.refreshAccessToken(refreshToken);

    res
      .cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000,
      })
      .status(200)
      .json({ message: 'Access token refreshed' });
  } catch (err) {
    res.status(401).json({
      message: 'Invalid or expired refresh token',
      details: err.message,
    });
  }
};

// ------------------- FORGOT PASSWORD ---------------------
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.status(200).json({ message: 'Password reset link sent to email' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ------------------- RESET PASSWORD ---------------------
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ------------------- SEND EMAIL VERIFICATION ---------------------
const sendEmailVerification = async (req, res) => {
  try {
    const user = req.user; // from auth middleware
    await authService.sendEmailVerification(user.id, user.email);
    res.status(200).json({ message: 'Verification email sent' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ------------------- VERIFY EMAIL ---------------------
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    await authService.verifyEmail(token);
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ------------------- SEND 4-DIGIT CODE ---------------------
const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    await authService.sendVerificationCode(email); // Call service to send code
    res.status(200).json({ message: 'Verification code sent to your email' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ------------------- VERIFY CODE AND REGISTER ---------------------
const verifyCodeAndRegister = async (req, res) => {
  try {
    const { email, code } = req.body; // Assuming userData includes the registration details
    const { user, tokens } = await authService.verifyCodeAndRegister(
      email,
      code
    );

    // res
    //   .cookie('accessToken', tokens.accessToken, {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === 'production',
    //     maxAge: 15 * 60 * 1000,
    //   })
    //   .cookie('refreshToken', tokens.refreshToken, {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === 'production',
    //     maxAge: 7 * 24 * 60 * 60 * 1000,
    //   })
    //   .status(201)
    //   .json({
    //     user: {
    //       id: user.id,
    //       name: user.name,
    //       email: user.email,
    //       avatar: user.avatar,
    //       email_verified: user.email_verified,
    //     },
    //   });

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        email_verified: user.email_verified,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  sendEmailVerification,
  verifyEmail,
  sendVerificationCode,
  verifyCodeAndRegister,
};
