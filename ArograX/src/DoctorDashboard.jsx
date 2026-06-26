import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function DoctorDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [historyReports, setHistoryReports] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const scannerElementId = useMemo(() => 'patient-qr-reader', []);
  const page = location.pathname.replace('/doctor-dashboard', '').replace('/', '') || 'overview';

  const dailyPatientChart = useMemo(() => {
    const dayCounts = historyReports.reduce((counts, report) => {
      const dayKey = new Date(report.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      counts[dayKey] = (counts[dayKey] || 0) + 1;
      return counts;
    }, {});

    const chartDays = Object.entries(dayCounts).slice(-7);
    const highestCount = Math.max(1, ...chartDays.map(([, count]) => count));

    return chartDays.map(([day, count]) => ({
      day,
      count,
      height: `${Math.max(12, Math.round((count / highestCount) * 100))}%`
    }));
  }, [historyReports]);

  const extractPatientId = (scanValue) => {
    const value = scanValue.trim();

    try {
      const scannedUrl = new URL(value, window.location.origin);
      const match = scannedUrl.pathname.match(/\/patient-record\/([^/?#]+)/);
      if (match?.[1]) return decodeURIComponent(match[1]);
    } catch {
      // Continue with plain ID parsing below.
    }

    const pathMatch = value.match(/patient-record\/([^/?#]+)/);
    if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1]);
    if (/^[a-f\d]{24}$/i.test(value)) return value;
    return '';
  };

  useEffect(() => {
    const fetchReportHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/auth/doctor/report-history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setHistoryReports(res.data.reports);
        }
      } catch (err) {
        setHistoryError(err.response?.data?.message || 'Unable to load report history.');
      }
    };

    if (user?.role === 'doctor') {
      fetchReportHistory();
    }
  }, [user]);

  useEffect(() => {
    if (!scannerOpen || page !== 'scan') return undefined;

    const scanner = new Html5QrcodeScanner(
      scannerElementId,
      {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        rememberLastUsedCamera: true
      },
      false
    );

    scanner.render(
      (decodedText) => {
        const patientId = extractPatientId(decodedText);

        if (!patientId) {
          setScanMessage('This QR code is not a valid AroyaX patient record.');
          return;
        }

        setScanMessage('Patient QR scanned. Opening medical record...');
        scanner.clear().finally(() => {
          setScannerOpen(false);
          navigate(`/patient-record/${patientId}`);
        });
      },
      () => {
        setScanMessage('Point the camera at the patient QR code.');
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [navigate, page, scannerElementId, scannerOpen]);

  const closeMenu = () => setNavOpen(false);
  const handleNavClick = () => {
    setScannerOpen(false);
    setScanMessage('');
    closeMenu();
  };

  const handleSignOut = () => {
    onLogout();
    navigate('/');
  };

  const renderMetrics = () => (
    <section className="metric-grid doctor-metrics">
      <button className="metric-card blue" onClick={() => navigate('/doctor-dashboard/patients')}>
        <span>Patients Today</span><strong>{historyReports.length || 18}</strong><em>View patients</em>
      </button>
      <button className="metric-card green" onClick={() => navigate('/doctor-dashboard/appointments')}>
        <span>Appointments</span><strong>10</strong><em>Schedule</em>
      </button>
      <button className="metric-card orange" onClick={() => navigate('/doctor-dashboard/reports')}>
        <span>Prescriptions</span><strong>{historyReports.filter((report) => report.title?.toLowerCase().includes('prescription')).length || 14}</strong><em>Reports</em>
      </button>
      <button className="metric-card purple" onClick={() => navigate('/doctor-dashboard/analytics')}>
        <span>Reports Added</span><strong>{historyReports.length}</strong><em>Analyze</em>
      </button>
    </section>
  );

  const renderScanner = () => (
    <div className="dash-panel scanner-panel">
      <div className="panel-title">
        <div>
          <h2>Scan Patient QR</h2>
          <p>Scan the patient QR code to access their medical records instantly.</p>
        </div>
      </div>

      <div className={scannerOpen ? 'scan-box is-active' : 'scan-box'}>
        {scannerOpen ? <div id={scannerElementId} /> : <span />}
      </div>

      <button
        className="btn btn-primary"
        onClick={() => {
          setScanMessage('');
          setScannerOpen((isOpen) => !isOpen);
        }}
      >
        {scannerOpen ? 'Close Scanner' : 'Start Scanning'}
      </button>

      {scanMessage && (
        <div className={scanMessage.includes('not valid') ? 'alert alert-error scan-alert' : 'alert alert-success scan-alert'}>
          {scanMessage}
        </div>
      )}
    </div>
  );

  const renderPatients = (limit) => (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <h2>{limit ? 'Recent Patients' : 'Patient History'}</h2>
          <p>Patients connected through QR scans and saved reports.</p>
        </div>
        {limit && <NavLink to="/doctor-dashboard/patients">View All</NavLink>}
      </div>
      {historyError && <div className="alert alert-error">{historyError}</div>}
      <div className="compact-list">
        {(limit ? historyReports.slice(0, limit) : historyReports).length ? (limit ? historyReports.slice(0, limit) : historyReports).map((report) => (
          <article className="compact-row" key={report.id}>
            <img className="row-avatar" src={user?.avatar || '/logo.png'} alt="" />
            <div>
              <strong>{report.patientName}</strong>
              <span>{report.patientBloodType || 'Patient'} - {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <button className="mini-pill" onClick={() => navigate(`/patient-record/${report.patientId}`)}>Open</button>
          </article>
        )) : (
          <div className="empty-state">Scan a patient QR and add a report to start history.</div>
        )}
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="dash-panel">
      <div className="panel-title">
        <h2>Today's Appointments</h2>
      </div>
      <div className="compact-list">
        {['Riya Sharma', 'Karan Mehta', 'Pooja Singh'].map((name, index) => (
          <article className="compact-row" key={name}>
            <img className="row-avatar" src={user?.avatar || '/logo.png'} alt="" />
            <div>
              <strong>{name}</strong>
              <span>{index === 0 ? 'Cardiology' : 'General Checkup'}</span>
            </div>
            <time>{index === 0 ? '10:30 AM' : index === 1 ? '11:30 AM' : '01:00 PM'}</time>
          </article>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <h2>Analyze Patients</h2>
          <p>Daily patient activity based on reports you added.</p>
        </div>
      </div>
      <div className="chart-panel" aria-label="Daily patient activity chart">
        {dailyPatientChart.length ? dailyPatientChart.map((item) => (
          <div className="chart-column" key={item.day}>
            <strong>{item.count}</strong>
            <div className="chart-track">
              <span style={{ height: item.height }} />
            </div>
            <small>{item.day}</small>
          </div>
        )) : (
          <div className="empty-state">No patient activity yet.</div>
        )}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="panel-grid two-col">
      <div className="dash-panel quick-actions">
        <div className="panel-title">
          <div>
            <h2>Add Medical Work</h2>
            <p>Open a patient from a scan or patient history, then add the report there.</p>
          </div>
        </div>
        <button className="quick-button" onClick={() => navigate('/doctor-dashboard/scan')}>Scan Patient QR</button>
        <button className="quick-button" onClick={() => navigate('/doctor-dashboard/patients')}>Open Patient</button>
        <button className="quick-button">Add Prescription</button>
        <button className="quick-button">Write Note</button>
      </div>
      {renderPatients(4)}
    </div>
  );

  const renderSettings = () => (
    <section className="dash-panel">
      <div className="panel-title">
        <div>
          <h2>Doctor Settings</h2>
          <p>Your account and professional profile summary.</p>
        </div>
      </div>
      <div className="info-grid">
        <div className="info-tile"><span>Name</span><strong>Dr. {user?.name || 'Doctor'}</strong></div>
        <div className="info-tile"><span>Email</span><strong>{user?.email || 'Not added'}</strong></div>
        <div className="info-tile"><span>Specialization</span><strong>{user?.doctorProfile?.specialization || 'Not added'}</strong></div>
        <div className="info-tile"><span>License</span><strong>{user?.doctorProfile?.licenseNumber || 'Not added'}</strong></div>
      </div>
    </section>
  );

  const renderPage = () => {
    if (page === 'scan') return renderScanner();
    if (page === 'patients') return renderPatients();
    if (page === 'appointments') return renderAppointments();
    if (page === 'analytics') return renderAnalytics();
    if (page === 'reports') return renderReports();
    if (page === 'settings') return renderSettings();

    return (
      <>
        <div className="welcome-row">
          <div>
            <p>Welcome back,</p>
            <h1>Dr. {user?.name || 'Doctor'}</h1>
            <small>Here is your clinical workspace overview</small>
          </div>
        </div>
        {renderMetrics()}
        <section className="panel-grid doctor-main-grid">
          {renderScanner()}
          {renderPatients(5)}
          {renderAppointments()}
        </section>
      </>
    );
  };

  return (
    <div className={navOpen ? 'portal-shell doctor-theme nav-open' : 'portal-shell doctor-theme'}>
      <aside className="side-nav">
        <div className="nav-brand">
          <img src="/logo.png" alt="AroyaX" />
        </div>
        <nav>
          <NavLink end className={({ isActive }) => isActive ? 'nav-item is-active' : 'nav-item'} to="/doctor-dashboard" onClick={handleNavClick}>Dashboard</NavLink>
          <NavLink className={({ isActive }) => isActive ? 'nav-item is-active' : 'nav-item'} to="/doctor-dashboard/scan" onClick={handleNavClick}>Scan QR</NavLink>
          <NavLink className={({ isActive }) => isActive ? 'nav-item is-active' : 'nav-item'} to="/doctor-dashboard/patients" onClick={handleNavClick}>Patients</NavLink>
          <NavLink className={({ isActive }) => isActive ? 'nav-item is-active' : 'nav-item'} to="/doctor-dashboard/reports" onClick={handleNavClick}>Add Report</NavLink>
          <NavLink className={({ isActive }) => isActive ? 'nav-item is-active' : 'nav-item'} to="/doctor-dashboard/analytics" onClick={handleNavClick}>Analytics</NavLink>
          <NavLink className={({ isActive }) => isActive ? 'nav-item is-active' : 'nav-item'} to="/doctor-dashboard/settings" onClick={handleNavClick}>Settings</NavLink>
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
          <div className="search-box">Search patient by name, ID or phone...</div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notifications">Bell</button>
            <button className="icon-button" aria-label="Messages">Msg</button>
            <div className="user-chip">
              <img src={user?.avatar} alt={user?.name || 'Doctor'} />
              <span>Dr. {user?.name || 'Doctor'}</span>
            </div>
          </div>
        </header>

        <main className="dashboard-canvas doctor-dashboard-layout">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default DoctorDashboard;
