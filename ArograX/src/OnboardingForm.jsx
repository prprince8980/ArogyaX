import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth`;

const fieldStyle = {
  width: '100%',
  padding: '10px',
  marginTop: '5px',
  boxSizing: 'border-box'
};

const labelStyle = {
  display: 'block',
  marginBottom: '12px',
  fontWeight: '500'
};

function OnboardingForm({ user, onComplete, mode = 'onboarding', onCancel }) {
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const isEditMode = mode === 'edit';

  const [patientData, setPatientData] = useState({
    phone: '',
    dob: '',
    gender: 'Male',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodType: 'O+',
    heightCm: '',
    weightKg: '',
    allergies: '',
    chronicConditions: '',
    currentMedications: '',
    pastSurgeries: '',
    insuranceProvider: '',
    uploadedPhotoUrl: '',
    ...user.patientProfile
  });

  const [doctorData, setDoctorData] = useState({
    phone: '',
    specialization: '',
    qualification: '',
    licenseNumber: '',
    experienceYears: '',
    hospitalAffiliation: '',
    clinicAddress: '',
    consultationFee: '',
    languages: '',
    availableHours: '',
    certificateUrl: '',
    ...user.doctorProfile
  });

  const handleFileSelect = (event, updater, fieldName) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updater((current) => ({
        ...current,
        [fieldName]: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (role, profileData) => {
    try {
      const res = await axios.post(`${API_BASE}/complete-onboarding`, {
        userId: user.id || user._id,
        role,
        profileData
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) onComplete(res.data.user);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save profile details.');
    }
  };

  const handlePatientSubmit = (e) => {
    e.preventDefault();
    saveProfile('patient', patientData);
  };

  const handleDoctorSubmit = (e) => {
    e.preventDefault();
    saveProfile('doctor', doctorData);
  };

  const title = isEditMode ? 'Update Your Profile' : 'Complete Your Health Profile';
  const actionText = isEditMode ? 'Save Profile Changes' : 'Save Details & Open Portal';

  return (
    <div style={{ maxWidth: '720px', margin: '40px auto', fontFamily: 'sans-serif', padding: '30px', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', backgroundColor: '#ffffff' }}>
      <h2 style={{ color: '#111827', margin: '0 0 5px 0', textAlign: 'center' }}>{title}</h2>
      <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textAlign: 'center', marginBottom: '25px', letterSpacing: '1px' }}>
        AroyaX {user.role} Profile - Part {step} of 3
      </p>

      {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      {user.role === 'patient' && (
        <form onSubmit={handlePatientSubmit}>
          {step === 1 && (
            <div>
              <h4 style={{ margin: '0 0 15px 0' }}>Part 1: Personal Information</h4>
              <label style={labelStyle}>Contact Phone Number
                <input type="tel" placeholder="+91 99999 99999" style={fieldStyle} value={patientData.phone} onChange={e => setPatientData({ ...patientData, phone: e.target.value })} required />
              </label>
              <label style={labelStyle}>Date of Birth
                <input type="date" style={fieldStyle} value={patientData.dob} onChange={e => setPatientData({ ...patientData, dob: e.target.value })} required />
              </label>
              <label style={labelStyle}>Gender
                <select style={fieldStyle} value={patientData.gender} onChange={e => setPatientData({ ...patientData, gender: e.target.value })}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label style={labelStyle}>Address
                <textarea rows="3" placeholder="Home address" style={fieldStyle} value={patientData.address} onChange={e => setPatientData({ ...patientData, address: e.target.value })} />
              </label>
              <button type="button" onClick={() => setStep(2)} className="btn btn-primary" style={{ width: '100%' }}>Continue</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h4 style={{ margin: '0 0 15px 0' }}>Part 2: Emergency & Clinical Details</h4>
              <label style={labelStyle}>Emergency Contact Name
                <input type="text" placeholder="Family member or guardian" style={fieldStyle} value={patientData.emergencyContactName} onChange={e => setPatientData({ ...patientData, emergencyContactName: e.target.value })} />
              </label>
              <label style={labelStyle}>Emergency Contact Phone
                <input type="tel" placeholder="+91 99999 99999" style={fieldStyle} value={patientData.emergencyContactPhone} onChange={e => setPatientData({ ...patientData, emergencyContactPhone: e.target.value })} />
              </label>
              <label style={labelStyle}>Blood Group
                <select style={fieldStyle} value={patientData.bloodType} onChange={e => setPatientData({ ...patientData, bloodType: e.target.value })}>
                  <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="O+">O+</option><option value="O-">O-</option><option value="AB+">AB+</option><option value="AB-">AB-</option>
                </select>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={labelStyle}>Height (cm)
                  <input type="number" min="0" style={fieldStyle} value={patientData.heightCm} onChange={e => setPatientData({ ...patientData, heightCm: e.target.value })} />
                </label>
                <label style={labelStyle}>Weight (kg)
                  <input type="number" min="0" style={fieldStyle} value={patientData.weightKg} onChange={e => setPatientData({ ...patientData, weightKg: e.target.value })} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                <button type="button" onClick={() => setStep(3)} className="btn btn-primary" style={{ flex: 2 }}>Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h4 style={{ margin: '0 0 15px 0' }}>Part 3: Medical History & Photo</h4>
              <label style={labelStyle}>Allergies
                <input type="text" placeholder="e.g., Penicillin, peanuts, or None" style={fieldStyle} value={patientData.allergies} onChange={e => setPatientData({ ...patientData, allergies: e.target.value })} required />
              </label>
              <label style={labelStyle}>Chronic Conditions
                <input type="text" placeholder="e.g., Diabetes, asthma, or None" style={fieldStyle} value={patientData.chronicConditions} onChange={e => setPatientData({ ...patientData, chronicConditions: e.target.value })} />
              </label>
              <label style={labelStyle}>Current Medications
                <input type="text" placeholder="Medicine names and dosage" style={fieldStyle} value={patientData.currentMedications} onChange={e => setPatientData({ ...patientData, currentMedications: e.target.value })} />
              </label>
              <label style={labelStyle}>Past Surgeries
                <input type="text" placeholder="e.g., Appendectomy 2021" style={fieldStyle} value={patientData.pastSurgeries} onChange={e => setPatientData({ ...patientData, pastSurgeries: e.target.value })} />
              </label>
              <label style={labelStyle}>Insurance Provider
                <input type="text" placeholder="Provider and policy number" style={fieldStyle} value={patientData.insuranceProvider} onChange={e => setPatientData({ ...patientData, insuranceProvider: e.target.value })} />
              </label>
              <label style={labelStyle}>Profile Photo
                <input type="file" accept="image/*" style={fieldStyle} onChange={e => handleFileSelect(e, setPatientData, 'uploadedPhotoUrl')} />
              </label>
              {patientData.uploadedPhotoUrl && <img src={patientData.uploadedPhotoUrl} alt="Selected patient profile" style={{ width: '86px', height: '86px', objectFit: 'cover', borderRadius: '8px', marginBottom: '14px' }} />}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setStep(2)} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                {isEditMode && <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>}
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{actionText}</button>
              </div>
            </div>
          )}
        </form>
      )}

      {user.role === 'doctor' && (
        <form onSubmit={handleDoctorSubmit}>
          {step === 1 && (
            <div>
              <h4 style={{ margin: '0 0 15px 0' }}>Part 1: Personal & Contact Information</h4>
              <label style={labelStyle}>Contact Phone Number
                <input type="tel" placeholder="+91 88888 88888" style={fieldStyle} value={doctorData.phone} onChange={e => setDoctorData({ ...doctorData, phone: e.target.value })} required />
              </label>
              <label style={labelStyle}>Qualification
                <input type="text" placeholder="MBBS, MD, MS" style={fieldStyle} value={doctorData.qualification} onChange={e => setDoctorData({ ...doctorData, qualification: e.target.value })} />
              </label>
              <label style={labelStyle}>Specialization
                <input type="text" placeholder="e.g., Cardiologist, Pediatrician" style={fieldStyle} value={doctorData.specialization} onChange={e => setDoctorData({ ...doctorData, specialization: e.target.value })} required />
              </label>
              <button type="button" onClick={() => setStep(2)} className="btn btn-primary" style={{ width: '100%' }}>Continue</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h4 style={{ margin: '0 0 15px 0' }}>Part 2: Practice Details</h4>
              <label style={labelStyle}>Total Practice Experience (Years)
                <input type="number" min="0" placeholder="5" style={fieldStyle} value={doctorData.experienceYears} onChange={e => setDoctorData({ ...doctorData, experienceYears: e.target.value })} required />
              </label>
              <label style={labelStyle}>Primary Hospital Affiliation
                <input type="text" placeholder="Apollo / City General Hospital" style={fieldStyle} value={doctorData.hospitalAffiliation} onChange={e => setDoctorData({ ...doctorData, hospitalAffiliation: e.target.value })} required />
              </label>
              <label style={labelStyle}>Clinic Address
                <textarea rows="3" placeholder="Clinic or hospital address" style={fieldStyle} value={doctorData.clinicAddress} onChange={e => setDoctorData({ ...doctorData, clinicAddress: e.target.value })} />
              </label>
              <label style={labelStyle}>Consultation Fee
                <input type="text" placeholder="e.g., 500 INR" style={fieldStyle} value={doctorData.consultationFee} onChange={e => setDoctorData({ ...doctorData, consultationFee: e.target.value })} />
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                <button type="button" onClick={() => setStep(3)} className="btn btn-primary" style={{ flex: 2 }}>Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h4 style={{ margin: '0 0 15px 0' }}>Part 3: License & Availability</h4>
              <label style={labelStyle}>Medical Council Registration / License Number
                <input type="text" placeholder="REG-2026-X99" style={fieldStyle} value={doctorData.licenseNumber} onChange={e => setDoctorData({ ...doctorData, licenseNumber: e.target.value })} required />
              </label>
              <label style={labelStyle}>Languages
                <input type="text" placeholder="English, Hindi, Marathi" style={fieldStyle} value={doctorData.languages} onChange={e => setDoctorData({ ...doctorData, languages: e.target.value })} />
              </label>
              <label style={labelStyle}>Available Hours
                <input type="text" placeholder="Mon-Fri, 10 AM - 5 PM" style={fieldStyle} value={doctorData.availableHours} onChange={e => setDoctorData({ ...doctorData, availableHours: e.target.value })} />
              </label>
              <label style={labelStyle}>Medical Registration Certificate
                <input type="file" accept="image/*,.pdf" style={fieldStyle} onChange={e => handleFileSelect(e, setDoctorData, 'certificateUrl')} />
              </label>
              {doctorData.certificateUrl && (
                doctorData.certificateUrl.startsWith('data:image')
                  ? <img src={doctorData.certificateUrl} alt="Selected certificate" style={{ width: '120px', height: '86px', objectFit: 'cover', borderRadius: '8px', marginBottom: '14px' }} />
                  : <p className="muted">Certificate file selected.</p>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setStep(2)} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                {isEditMode && <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>}
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{isEditMode ? 'Save Profile Changes' : 'Verify Medical Registration'}</button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

export default OnboardingForm;
