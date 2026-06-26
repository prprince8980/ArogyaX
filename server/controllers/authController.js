const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const hasCompletedProfile = (user) => {
  const profile = user.role === 'doctor' ? user.doctorProfile : user.patientProfile;
  if (!profile) return false;

  const requiredFields = user.role === 'doctor'
    ? ['phone', 'specialization', 'licenseNumber']
    : ['phone', 'dob', 'bloodType'];

  return requiredFields.every((field) => Boolean(profile[field]));
};

exports.googleLoginOrSignup = async (req, res) => {
  const { credential, role } = req.body;

  try {
    // 1. Verify Google Token securely
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ success: false, message: "Invalid Google credential token." });
    }

    const { sub: googleId, email, name, picture: avatar } = payload;

    // 2. Existing users go straight in. New users choose role after Google is verified.
    let user = await User.findOne({ googleId });

    if (!user) {
      if (!role) {
        return res.status(200).json({
          success: true,
          needsRoleSelection: true,
          googleProfile: { email, name, avatar },
          message: 'New Google account found. Choose Patient or Doctor to create your AroyaX profile.'
        });
      }

      if (!['patient', 'doctor'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Please select Patient or Doctor for your new account.'
        });
      }

      user = new User({
        googleId,
        email,
        name,
        avatar,
        role,
        isVerified: true // Auto-verified instantly
      });
      await user.save();
    }

    if (!user.isOnboarded && hasCompletedProfile(user)) {
      user.isOnboarded = true;
      await user.save();
    }

    // 3. Issue the App session JWT Token immediately
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isOnboarded: user.isOnboarded,
        patientProfile: user.patientProfile,
        doctorProfile: user.doctorProfile
      }
    });

  } catch (error) {
    console.error("Auth controller error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal authentication error." });
  }
};
