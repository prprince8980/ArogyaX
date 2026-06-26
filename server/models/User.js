const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  avatar: { type: String },
  role: { type: String, enum: ['patient', 'doctor'], required: true },
  isOnboarded: { type: Boolean, default: false }, // Flags if onboarding is complete
  
  // Patient Profile Data Matrix
  patientProfile: {
    phone: { type: String, default: '' },
    dob: { type: String, default: '' },
    gender: { type: String, default: '' },
    address: { type: String, default: '' },
    emergencyContactName: { type: String, default: '' },
    emergencyContactPhone: { type: String, default: '' },
    bloodType: { type: String, default: '' },
    heightCm: { type: String, default: '' },
    weightKg: { type: String, default: '' },
    allergies: { type: String, default: '' },
    chronicConditions: { type: String, default: '' },
    currentMedications: { type: String, default: '' },
    pastSurgeries: { type: String, default: '' },
    insuranceProvider: { type: String, default: '' },
    uploadedPhotoUrl: { type: String, default: '' }
  },

  medicalReports: [{
    title: { type: String, required: true },
    reportUrl: { type: String, required: true },
    notes: { type: String, default: '' },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorName: { type: String, required: true },
    doctorSpecialization: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  }],

  // Doctor Profile Data Matrix
  doctorProfile: {
    phone: { type: String, default: '' },
    specialization: { type: String, default: '' },
    qualification: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    experienceYears: { type: String, default: '' },
    hospitalAffiliation: { type: String, default: '' },
    clinicAddress: { type: String, default: '' },
    consultationFee: { type: String, default: '' },
    languages: { type: String, default: '' },
    availableHours: { type: String, default: '' },
    certificateUrl: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
