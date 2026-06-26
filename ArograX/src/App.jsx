import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

import PatientMedicalRecord from './PatientMedicalRecord';
import PatientDashboard from './PatientDashboard';
import DoctorDashboard from './DoctorDashboard';
import OnboardingForm from './OnboardingForm'; 

function App() {
  const [role, setRole] = useState('patient'); 
  const [userData, setUserData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [pendingCredential, setPendingCredential] = useState('');
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleSuccess = async (credentialResponse, selectedRole) => {
    setErrorMsg('');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/google-login', {
        credential: credentialResponse.credential,
        role: selectedRole
      });

      if (response.data.needsRoleSelection) {
        setPendingCredential(credentialResponse.credential);
        setPendingGoogleProfile(response.data.googleProfile);
        return;
      }

      localStorage.setItem('token', response.data.token);
      
      const loggedUser = {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        role: response.data.user.role,
        avatar: response.data.user.avatar,
        isOnboarded: response.data.user.isOnboarded,
        patientProfile: response.data.user.patientProfile,
        doctorProfile: response.data.user.doctorProfile
      };

      setUserData(loggedUser);
      setPendingCredential('');
      setPendingGoogleProfile(null);

      if (!response.data.user.isOnboarded) {
        setNeedsOnboarding(true);
      } else {
        routeToDashboard(response.data.user.role);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Authentication system error happened.');
    }
  };

  const handleRoleCreate = (selectedRole) => {
    if (!pendingCredential) return;
    setRole(selectedRole);
    handleGoogleSuccess({ credential: pendingCredential }, selectedRole);
  };

  const routeToDashboard = (userRole) => {
    if (userRole === 'doctor') navigate('/doctor-dashboard');
    else navigate('/patient-dashboard');
  };

  const handleOnboardingComplete = (updatedUserFromDb) => {
    setNeedsOnboarding(false);
    setUserData({
      ...userData,
      isOnboarded: true,
      patientProfile: updatedUserFromDb.patientProfile,
      doctorProfile: updatedUserFromDb.doctorProfile
    });
    routeToDashboard(userData.role);
  };

  const handleProfileUpdate = (updatedUserFromDb) => {
    setUserData((currentUser) => ({
      ...currentUser,
      isOnboarded: updatedUserFromDb.isOnboarded,
      patientProfile: updatedUserFromDb.patientProfile,
      doctorProfile: updatedUserFromDb.doctorProfile
    }));
  };

  const handleClearSession = () => {
    localStorage.removeItem('token');
    setUserData(null);
    setNeedsOnboarding(false);
    setPendingCredential('');
    setPendingGoogleProfile(null);
    navigate('/');
  };

  if (showSplash) {
    return (
      <div className="splash-screen">
        <div className="splash-shell">
          <img className="splash-logo" src="/logo.png" alt="AroyaX Logo" />
          <div className="splash-loader" />
        </div>
      </div>
    );
  }

  if (needsOnboarding && userData) {
    return <OnboardingForm user={userData} onComplete={handleOnboardingComplete} />;
  }

  return (
    <Routes>
      {/* Route 1: Auth Entrance Screen */}
      <Route path="/" element={
        <div className="auth-page">
          <section className="auth-hero">
            <div className="auth-logo-lockup">
              <img src="/logo.png" alt="AroyaX" />
              <span>Your Health, Our Priority</span>
            </div>
            <h1>Smart Healthcare. Secured for <span>You.</span></h1>
            <p>AroyaX securely stores your medical records and makes them accessible in seconds using QR technology.</p>
            <div className="hero-illustration" aria-hidden="true">
              <div className="hero-shield">+</div>
              <span className="orbit orbit-one">kit</span>
              <span className="orbit orbit-two">med</span>
              <span className="orbit orbit-three">id</span>
            </div>
            <div className="auth-benefits">
              <div><strong>Secure & Encrypted</strong><span>Your data is 100% safe</span></div>
              <div><strong>QR Based Access</strong><span>Instant access to records</span></div>
              <div><strong>For Everyone</strong><span>Patients, Doctors & Hospitals</span></div>
            </div>
          </section>
          <div className="auth-card">
            <div className="auth-brand">
              <h2>Welcome Back!</h2>
              <p>Login to your account</p>
            </div>
            
            {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

            <div>
              {pendingGoogleProfile ? (
                <div className="new-account-panel">
                  <p className="field-title">Create profile for {pendingGoogleProfile.email}</p>
                  <div className="role-switch">
                    <button className={role === 'patient' ? 'role-option is-active' : 'role-option'} onClick={() => handleRoleCreate('patient')}>Patient Portal</button>
                    <button className={role === 'doctor' ? 'role-option is-active' : 'role-option'} onClick={() => handleRoleCreate('doctor')}>Doctor Portal</button>
                  </div>
                  <button className="btn btn-secondary auth-reset-btn" onClick={() => {
                    setPendingCredential('');
                    setPendingGoogleProfile(null);
                  }}>
                    Use another Google account
                  </button>
                </div>
              ) : (
                <div className="login-stack">
                  <div className="auth-divider"><span>Continue securely with Google</span></div>
                  <GoogleLogin onSuccess={(credentialResponse) => handleGoogleSuccess(credentialResponse)} onError={() => setErrorMsg('Google Sign-In failed.')} />
                </div>
              )}
            </div>
          </div>
        </div>
      } />

      {/* Route 2: Patient Portal Dashboard */}
      <Route path="/patient-dashboard" element={<PatientDashboard user={userData} onLogout={handleClearSession} onProfileUpdate={handleProfileUpdate} />} />
      
      {/* Route 3: Doctor Workspace Dashboard */}
      <Route path="/doctor-dashboard" element={<DoctorDashboard user={userData} onLogout={handleClearSession} onProfileUpdate={handleProfileUpdate} />} />

      {/* Route 4: secure scan overview link */}
      <Route path="/patient-record/:patientId" element={<PatientMedicalRecord currentUser={userData} />} />
    </Routes>
  );
}

export default App;
