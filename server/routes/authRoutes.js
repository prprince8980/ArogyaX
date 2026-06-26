const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const {
  googleLoginOrSignup
} = require('../controllers/authController');

const {
  completeOnboarding,
  getPatientDataForDoctor,
  addPatientMedicalReport,
  getMyMedicalReports,
  getDoctorReportHistory
} = require('../controllers/profileController');

// -----------------------
// AUTH MIDDLEWARE
// -----------------------
const verifySession = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// -----------------------
// DOCTOR ONLY
// -----------------------
const verifyDoctor = (req, res, next) => {
  verifySession(req, res, () => {
    if (req.user?.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Doctor access only'
      });
    }
    next();
  });
};

// -----------------------
// ROUTES
// -----------------------
router.post('/google-login', googleLoginOrSignup);

router.post('/complete-onboarding', verifySession, completeOnboarding);

// DOCTOR ROUTES
router.get(
  '/patient-record/:patientId',
  verifyDoctor,
  getPatientDataForDoctor
);

router.post(
  '/patient-record/:patientId/reports',
  verifyDoctor,
  addPatientMedicalReport
);

router.get(
  '/doctor/report-history',
  verifyDoctor,
  getDoctorReportHistory
);

// PATIENT ROUTES
router.get(
  '/patient/my-reports',
  verifySession,
  getMyMedicalReports
);

module.exports = router;