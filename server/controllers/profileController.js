const User = require('../models/User');
const mongoose = require('mongoose');

exports.completeOnboarding = async (req, res) => {
  try {
    const { userId, role, profileData } = req.body;
    const authenticatedUserId = req.user?.id;

    if (!authenticatedUserId || !['patient', 'doctor'].includes(role) || !profileData) {
      return res.status(400).json({
        success: false,
        message: 'User session, role, and profile data are required'
      });
    }

    if (userId && userId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Profile role does not match your signed-in account'
      });
    }

    const profileField = role === 'patient' ? 'patientProfile' : 'doctorProfile';

    const user = await User.findByIdAndUpdate(
      authenticatedUserId,
      {
        $set: {
          isOnboarded: true,
          [profileField]: profileData
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
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
    console.error('Onboarding Error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPatientDataForDoctor = async (req, res) => {
  const { patientId } = req.params;

  try {
    const patient = await User.findById(patientId).select('-googleId');

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      patient
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.addPatientMedicalReport = async (req, res) => {
  const { patientId } = req.params;
  const { title, reportUrl, notes, prescribedMedicines } = req.body;

  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid patient QR record ID. Please scan the patient QR again.'
    });
  }

  if (!title?.trim() || !reportUrl?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Report title and report file link are required'
    });
  }

  try {
    const doctor = await User.findById(req.user.id);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can add patient medical reports'
      });
    }

    const report = {
      title: title.trim(),
      reportUrl: reportUrl.trim(),
      notes: notes?.trim() || '',
      prescribedMedicines: prescribedMedicines?.trim() || '',
      doctorId: doctor._id,
      doctorName: doctor.name,
      doctorSpecialization: doctor.doctorProfile?.specialization || '',
      createdAt: new Date()
    };

    const patient = await User.findOneAndUpdate(
      { _id: patientId, role: 'patient' },
      { $push: { medicalReports: report } },
      { new: true }
    ).select('-googleId');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found. Open the record from a valid patient QR before adding a report.'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Medical report added to patient records',
      patient,
      report: patient.medicalReports[patient.medicalReports.length - 1]
    });
  } catch (error) {
    console.error('Add report error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMyMedicalReports = async (req, res) => {
  try {
    const patient = await User.findById(req.user.id).select('role medicalReports');

    if (!patient || patient.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can view this records section'
      });
    }

    const reports = [...patient.medicalReports].sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Fetch patient reports error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getDoctorReportHistory = async (req, res) => {
  try {
    const patients = await User.find({
      role: 'patient',
      'medicalReports.doctorId': req.user.id
    }).select('name email patientProfile medicalReports');

    const reports = patients
      .flatMap((patient) => patient.medicalReports
        .filter((report) => report.doctorId.toString() === req.user.id)
        .map((report) => ({
          id: report._id,
          title: report.title,
          reportUrl: report.reportUrl,
          notes: report.notes,
          prescribedMedicines: report.prescribedMedicines,
          createdAt: report.createdAt,
          patientId: patient._id,
          patientName: patient.name,
          patientEmail: patient.email,
          patientBloodType: patient.patientProfile?.bloodType || ''
        })))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Fetch doctor report history error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
