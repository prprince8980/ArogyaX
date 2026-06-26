import { useState, useEffect } from 'react';
import { Navigate, Routes, Route, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

import PatientMedicalRecord from './PatientMedicalRecord';
import PatientDashboard from './PatientDashboard';
import DoctorDashboard from './DoctorDashboard';
import OnboardingForm from './OnboardingForm'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

const createLoggedUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  isOnboarded: user.isOnboarded,
  patientProfile: user.patientProfile,
  doctorProfile: user.doctorProfile
});

function App() {
  const [role, setRole] = useState('patient'); 
  const [userData, setUserData] = useState(() => readStoredUser());
  const [errorMsg, setErrorMsg] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [pendingCredential, setPendingCredential] = useState('');
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleSuccess = async (credentialResponse, selectedRole) => {
    setErrorMsg('');
    setAuthLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/google-login`, {
        credential: credentialResponse.credential,
        role: selectedRole
      });

      if (response.data.needsRoleSelection) {
        setPendingCredential(credentialResponse.credential);
        setPendingGoogleProfile(response.data.googleProfile);
        return;
      }

      localStorage.setItem('token', response.data.token);
      const loggedUser = createLoggedUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(loggedUser));

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
    } finally {
      setAuthLoading(false);
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
    const updatedUser = {
      ...userData,
      ...createLoggedUser(updatedUserFromDb),
      isOnboarded: true
    };

    setNeedsOnboarding(false);
    setUserData(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    routeToDashboard(updatedUser.role);
  };

  const handleProfileUpdate = (updatedUserFromDb) => {
    setUserData((currentUser) => {
      const updatedUser = {
        ...currentUser,
        isOnboarded: updatedUserFromDb.isOnboarded,
        patientProfile: updatedUserFromDb.patientProfile,
        doctorProfile: updatedUserFromDb.doctorProfile
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const handleClearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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

  const requireUser = (element, allowedRole) => {
    if (!userData) return <Navigate to="/" replace />;
    if (allowedRole && userData.role !== allowedRole) return <Navigate to="/" replace />;
    return element;
  };

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
            <h1>AroyaX Health Records for <span>Patients and Doctors.</span></h1>
            <p>Store medical records, scan QR health cards, review doctor reports, order medicines, and track health insights from one secure workspace.</p>
            <div className="auth-hero-stats" aria-label="AroyaX platform highlights">
              <div><strong>QR</strong><span>Instant record access</span></div>
              <div><strong>AI</strong><span>Health chart preview</span></div>
              <div><strong>Rx</strong><span>Medicines and reports</span></div>
            </div>
            <div className="hero-illustration" aria-hidden="true">
              <div className="hero-shield">+</div>
              <span className="orbit orbit-one">kit</span>
              <span className="orbit orbit-two">med</span>
              <span className="orbit orbit-three">id</span>
            </div>
            <div className="auth-benefits">
              <div><strong>Patient Portal</strong><span>Records, medicine orders, QR health card</span></div>
              <div><strong>Doctor Workspace</strong><span>Scan patients, add reports and medicines</span></div>
              <div><strong>Secure Access</strong><span>Google login with role-based dashboards</span></div>
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
                    <button className={role === 'patient' ? 'role-option is-active' : 'role-option'} onClick={() => handleRoleCreate('patient')} disabled={authLoading}>Patient Portal</button>
                    <button className={role === 'doctor' ? 'role-option is-active' : 'role-option'} onClick={() => handleRoleCreate('doctor')} disabled={authLoading}>Doctor Portal</button>
                  </div>
                  <button className="btn btn-secondary auth-reset-btn" onClick={() => {
                    setPendingCredential('');
                    setPendingGoogleProfile(null);
                  }} disabled={authLoading}>
                    Use another Google account
                  </button>
                  {authLoading && <span className="auth-loading">Creating secure profile...</span>}
                </div>
              ) : (
                <div className="login-stack">
                  <div className="auth-divider"><span>Continue securely with Google</span></div>
                  <GoogleLogin onSuccess={(credentialResponse) => handleGoogleSuccess(credentialResponse)} onError={() => setErrorMsg('Google Sign-In failed.')} />
                  {authLoading && <span className="auth-loading">Signing you in...</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      } />

      {/* Route 2: Patient Portal Dashboard */}
      <Route path="/patient-dashboard/*" element={requireUser(<PatientDashboard user={userData} onLogout={handleClearSession} onProfileUpdate={handleProfileUpdate} />, 'patient')} />
      
      {/* Route 3: Doctor Workspace Dashboard */}
      <Route path="/doctor-dashboard/*" element={requireUser(<DoctorDashboard user={userData} onLogout={handleClearSession} onProfileUpdate={handleProfileUpdate} />, 'doctor')} />

      {/* Route 4: secure scan overview link */}
      <Route path="/patient-record/:patientId" element={requireUser(<PatientMedicalRecord currentUser={userData} />, 'doctor')} />
    </Routes>
  );
}

export default App;
