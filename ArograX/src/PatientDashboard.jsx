import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

const ADMIN_EMAIL = 'princep4732355@gmail.com';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const medicineCatalog = [
  { name: 'Paracetamol 500mg', type: 'Fever and pain', price: 25 },
  { name: 'Cetirizine 10mg', type: 'Allergy relief', price: 18 },
  { name: 'Azithromycin 500mg', type: 'Antibiotic', price: 90 },
  { name: 'Amoxicillin 500mg', type: 'Antibiotic', price: 75 },
  { name: 'Pantoprazole 40mg', type: 'Acidity control', price: 42 },
  { name: 'Omeprazole 20mg', type: 'Acidity control', price: 36 },
  { name: 'Metformin 500mg', type: 'Diabetes care', price: 32 },
  { name: 'Amlodipine 5mg', type: 'Blood pressure', price: 28 },
  { name: 'Atorvastatin 10mg', type: 'Cholesterol care', price: 48 },
  { name: 'Losartan 50mg', type: 'Blood pressure', price: 55 },
  { name: 'Dolo 650', type: 'Fever and pain', price: 30 },
  { name: 'ORS Sachet', type: 'Hydration', price: 20 },
  { name: 'Vitamin C Tablets', type: 'Immunity', price: 60 },
  { name: 'Vitamin D3 60K', type: 'Bone health', price: 85 },
  { name: 'Calcium Tablets', type: 'Bone health', price: 110 },
  { name: 'Iron Folic Acid', type: 'Nutrition', price: 45 },
  { name: 'Cough Syrup', type: 'Cough relief', price: 95 },
  { name: 'Antacid Gel', type: 'Acidity relief', price: 120 },
  { name: 'Ibuprofen 400mg', type: 'Pain relief', price: 35 },
  { name: 'Levocetirizine 5mg', type: 'Allergy relief', price: 24 }
];

function PatientDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [recordsError, setRecordsError] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [selectedMedicines, setSelectedMedicines] = useState([]);

  const page = location.pathname.replace('/patient-dashboard', '').replace('/', '') || 'overview';

  const aiHealthSignals = [
    { label: 'Sleep', value: 78, status: 'Stable', height: '78%' },
    { label: 'Heart', value: 84, status: 'Good', height: '84%' },
    { label: 'Sugar', value: 61, status: 'Watch', height: '61%' },
    { label: 'Stress', value: 42, status: 'Low', height: '42%' },
    { label: 'Activity', value: 72, status: 'Rising', height: '72%' }
  ];

  const qrIdentityLink = `${window.location.origin}/patient-record/${user?.id}`;
  const nextCheckup = useMemo(() => new Date().toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }), []);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/auth/patient/my-reports`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setReports(res.data.reports);
        }
      } catch (err) {
        setRecordsError(err.response?.data?.message || 'Unable to load medical reports.');
      }
    };

    if (user?.role === 'patient') {
      fetchReports();
    }
  }, [user]);

  const closeMenu = () => setNavOpen(false);

  const handleSignOut = () => {
    onLogout();
    navigate('/');
  };

  const toggleMedicine = (medicineName) => {
    setSelectedMedicines((current) => (
      current.includes(medicineName)
        ? current.filter((item) => item !== medicineName)
        : [...current, medicineName]
    ));
  };

  const renderMetrics = () => (
    <div className="metric-grid">
      <button className="metric-card blue" onClick={() => navigate('/patient-dashboard/records')}>
        <span>Total Records</span><strong>{reports.length + 6}</strong><em>View all</em>
      </button>
      <button className="metric-card green" onClick={() => navigate('/patient-dashboard/records')}>
        <span>Prescriptions</span><strong>{reports.filter((report) => report.title?.toLowerCase().includes('prescription')).length || 2}</strong><em>View all</em>
      </button>
      <button className="metric-card orange" onClick={() => navigate('/patient-dashboard/records')}>
        <span>Reports</span><strong>{reports.length}</strong><em>View all</em>
      </button>
      <button className="metric-card purple" onClick={() => navigate('/patient-dashboard/health-card')}>
        <span>Appointments</span><strong>05</strong><em>Health card</em>
      </button>
    </div>
  );

  const renderAiChart = () => (
    <section className="dash-panel ai-chart-board">
      <div className="panel-title">
        <div>
          <h2>AI Health Chart Board</h2>
          <p>Analyze health signals from reports, vitals, and daily health inputs.</p>
        </div>
        <span className="feature-badge">Analyze</span>
      </div>

      <div className="ai-board-grid">
        <div className="ai-score-card">
          <span>Predicted Wellness Score</span>
          <strong>76%</strong>
          <p>Sample AI score based on available health trends.</p>
        </div>

        <div className="ai-signal-chart" aria-label="AI health signal preview chart">
          {aiHealthSignals.map((signal) => (
            <div className="ai-signal-column" key={signal.label}>
              <strong>{signal.value}</strong>
              <div className="ai-signal-track">
                <span style={{ height: signal.height, '--signal-width': `${signal.value}%` }} />
              </div>
              <small>{signal.label}</small>
              <em>{signal.status}</em>
            </div>
          ))}
        </div>

        <div className="ai-insight-list">
          <article><strong>Report Scan</strong><span>Detect abnormal values from uploaded medical reports.</span></article>
          <article><strong>Risk Alerts</strong><span>Show early warning signals for sugar, BP, sleep, and stress.</span></article>
          <article><strong>Doctor Summary</strong><span>Create a short health summary before consultations.</span></article>
        </div>
      </div>
    </section>
  );

  const renderRecords = (limit) => (
    <section className="dash-panel">
      <div className="panel-title">
        <div>
          <h2>{limit ? 'Recent Records' : 'My Medical Records'}</h2>
          <p>Reports added by doctors after scanning your health card.</p>
        </div>
        {limit && <NavLink to="/patient-dashboard/records">View All</NavLink>}
      </div>
      {recordsError && <div className="alert alert-error">{recordsError}</div>}
      <div className="compact-list">
        {(limit ? reports.slice(0, limit) : reports).length ? (limit ? reports.slice(0, limit) : reports).map((report) => (
          <article className="compact-row" key={report._id}>
            <div className="row-icon blue">REC</div>
            <div>
              <strong>{report.title}</strong>
              <span>{new Date(report.createdAt).toLocaleDateString()}</span>
              {report.prescribedMedicines && <span className="medicine-line">Medicines: {report.prescribedMedicines}</span>}
            </div>
            <a className="mini-pill" href={report.reportUrl} target="_blank" rel="noreferrer">Report</a>
          </article>
        )) : (
          <div className="empty-state">No doctor reports have been added yet.</div>
        )}
      </div>
    </section>
  );

  const renderHealthCard = () => (
    <div className="panel-grid two-col">
      <section className="dash-panel qr-card">
        <h2>My Health Card (QR)</h2>
        <div className="qr-frame">
          <QRCodeSVG value={qrIdentityLink} size={176} bgColor="#ffffff" fgColor="#0f172a" level="H" />
        </div>
        <strong>{user?.name || 'Patient'}</strong>
        <span>ID: {user?.id?.slice(-8)?.toUpperCase() || 'ACTIVE'}</span>
        <button className="btn btn-secondary">Share Card</button>
      </section>

      <section className="dash-panel">
        <div className="panel-title">
          <h2>Health Overview</h2>
        </div>
        <div className="health-list">
          <div><span>Blood Group</span><strong>{user?.patientProfile?.bloodType || 'O+'}</strong></div>
          <div><span>Allergies</span><strong>{user?.patientProfile?.allergies || 'None'}</strong></div>
          <div><span>Chronic Conditions</span><strong>{user?.patientProfile?.chronicConditions || 'None'}</strong></div>
          <div><span>Last Checkup</span><strong>{nextCheckup}</strong></div>
        </div>
      </section>
    </div>
  );

  const renderAppointments = () => (
    <section className="dash-panel">
      <div className="panel-title">
        <h2>Upcoming Appointments</h2>
      </div>
      <div className="compact-list">
        <article className="compact-row">
          <img className="row-avatar" src="/logo.png" alt="" />
          <div><strong>Dr. AroyaX Care</strong><span>{nextCheckup} - 11:30 AM</span></div>
        </article>
        <article className="compact-row">
          <img className="row-avatar" src={user?.avatar} alt="" />
          <div><strong>Health Follow Up</strong><span>{nextCheckup} - 02:00 PM</span></div>
        </article>
      </div>
    </section>
  );

  const renderEmergency = () => (
    <section className="emergency-banner page-banner">
      <div>
        <h2>Emergency Access</h2>
        <p>Send your identity and emergency details directly to admin.</p>
        <a
          className="btn btn-danger"
          href={`mailto:${ADMIN_EMAIL}?subject=Emergency%20help%20request&body=Patient:%20${encodeURIComponent(user?.name || '')}%0AEmail:%20${encodeURIComponent(user?.email || '')}%0APhone:%20${encodeURIComponent(user?.patientProfile?.phone || '')}%0A%0AEmergency%20details:%20`}
        >
          View Emergency Info
        </a>
      </div>
      <div className="ambulance-visual">ER</div>
    </section>
  );

  const renderMedicine = () => (
    <section className="dash-panel">
      <div className="panel-title">
        <div>
          <h2>Buy Medicine</h2>
          <p>Select medicines and send the order request to admin.</p>
        </div>
        <span className="feature-badge">{selectedMedicines.length} Selected</span>
      </div>

      <div className="medicine-grid">
        {medicineCatalog.map((medicine) => {
          const isSelected = selectedMedicines.includes(medicine.name);
          return (
            <button
              className={isSelected ? 'medicine-card is-selected' : 'medicine-card'}
              key={medicine.name}
              onClick={() => toggleMedicine(medicine.name)}
              type="button"
            >
              <strong>{medicine.name}</strong>
              <span>{medicine.type}</span>
              <em>Rs. {medicine.price}</em>
            </button>
          );
        })}
      </div>

      <div className="medicine-order-bar">
        <div>
          <strong>Selected order</strong>
          <span>{selectedMedicines.length ? selectedMedicines.join(', ') : 'No medicines selected yet.'}</span>
        </div>
        <a
          className="btn btn-primary"
          href={`mailto:${ADMIN_EMAIL}?subject=Buy%20medicine%20request&body=Patient:%20${encodeURIComponent(user?.name || '')}%0AEmail:%20${encodeURIComponent(user?.email || '')}%0ASelected%20medicines:%20${encodeURIComponent(selectedMedicines.join(', ') || 'Please add medicine name here')}%0AQuantity:%20%0AAddress:%20${encodeURIComponent(user?.patientProfile?.address || '')}`}
        >
          Order Selected
        </a>
      </div>
    </section>
  );

  const renderSettings = () => (
    <section className="dash-panel">
      <div className="panel-title">
        <div>
          <h2>Profile Settings</h2>
          <p>Your account and profile summary.</p>
        </div>
      </div>
      <div className="info-grid">
        <div className="info-tile"><span>Name</span><strong>{user?.name || 'Patient'}</strong></div>
        <div className="info-tile"><span>Email</span><strong>{user?.email || 'Not added'}</strong></div>
        <div className="info-tile"><span>Phone</span><strong>{user?.patientProfile?.phone || 'Not added'}</strong></div>
        <div className="info-tile"><span>Address</span><strong>{user?.patientProfile?.address || 'Not added'}</strong></div>
      </div>
    </section>
  );

  const renderPage = () => {
    if (page === 'records') return renderRecords();
    if (page === 'ai-chart') return renderAiChart();
    if (page === 'health-card') return renderHealthCard();
    if (page === 'emergency') return renderEmergency();
    if (page === 'medicine') return renderMedicine();
    if (page === 'settings') return renderSettings();

    return (
      <>
        <div className="welcome-row">
          <div>
            <p>Welcome back,</p>
            <h1>{user?.name || 'Patient'}</h1>
            <small>Here is your health overview</small>
          </div>
        </div>
        {renderMetrics()}
        <div className="panel-grid two-col">
          {renderRecords(4)}
          {renderAppointments()}
        </div>
      </>
    );
  };

  return (
    <div className={navOpen ? 'portal-shell patient-theme nav-open' : 'portal-shell patient-theme'}>
      <aside className="side-nav">
        <div className="nav-brand">
          <img src="/logo.png" alt="AroyaX" />
        </div>
        <nav>
          <NavLink end className={({ isActive }) => isActive ? 'nav-item is-active' : 'nav-item'} to="/patient-dashboard" onClick={closeMenu}>Dashboard</NavLink>
          <NavLink className={({ isActive }) => isActive ? 'nav-item is-active' : 'nav-item'} to="/patient-dashboard/records" onClick={closeMenu}>My Records</NavLink>
          <NavLink className={({ isActive }) => isActive ? 'nav-item is-active' : 'nav-item'} to="/patient-dashboard/ai-chart" onClick={closeMenu}>AI Chart</NavLink>
          <NavLink className={({ isActive }) => isActive ? 'nav-item is-active' : 'nav-item'} to="/patient-dashboard/health-card" onClick={closeMenu}>Health Card</NavLink>
          <NavLink className={({ isActive }) => isActive ? 'nav-item is-active' : 'nav-item'} to="/patient-dashboard/emergency" onClick={closeMenu}>Emergency</NavLink>
          <NavLink className={({ isActive }) => isActive ? 'nav-item is-active' : 'nav-item'} to="/patient-dashboard/medicine" onClick={closeMenu}>Medications</NavLink>
          <NavLink className={({ isActive }) => isActive ? 'nav-item is-active' : 'nav-item'} to="/patient-dashboard/settings" onClick={closeMenu}>Settings</NavLink>
        </nav>
        <button className="nav-logout" onClick={handleSignOut}>Logout</button>
      </aside>
      <button className="nav-backdrop" aria-label="Close menu" onClick={closeMenu} />

      <div className="portal-main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu-button"
            aria-label={navOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((isOpen) => !isOpen)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="search-box">Search anything...</div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notifications">Alerts</button>
            <button className="icon-button" aria-label="Messages">Inbox</button>
            <div className="user-chip">
              <img src={user?.avatar} alt={user?.name || 'Patient'} />
              <span>{user?.name || 'Patient'}</span>
            </div>
          </div>
        </header>

        <main className="dashboard-canvas dashboard-single">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default PatientDashboard;
