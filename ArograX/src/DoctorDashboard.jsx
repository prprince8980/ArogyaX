import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';

function DoctorDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [historyReports, setHistoryReports] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const scannerElementId = useMemo(() => 'patient-qr-reader', []);

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
        const res = await axios.get('http://localhost:5000/api/auth/doctor/report-history', {
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
    if (!scannerOpen) return undefined;

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
  }, [navigate, scannerElementId, scannerOpen]);

  const handleSignOut = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="portal-shell doctor-theme">
      <aside className="side-nav">
        <div className="nav-brand">
          <img src="/logo.png" alt="AroyaX" />
        </div>
        <nav>
          <a className="nav-item is-active" href="#dashboard">Dashboard</a>
          <a className="nav-item" href="#scan">Scan QR</a>
          <a className="nav-item" href="#patients">Patients</a>
          <a className="nav-item" href="#reports">Add Report</a>
          <a className="nav-item" href="#analytics">Analytics</a>
          <a className="nav-item" href="#settings">Settings</a>
        </nav>
        <button className="nav-logout" onClick={handleSignOut}>Logout</button>
      </aside>

      <div className="portal-main">
        <header className="topbar">
          <button className="icon-button" aria-label="Open menu">Menu</button>
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

        <main className="dashboard-canvas doctor-dashboard-layout" id="dashboard">
          <section className="metric-grid doctor-metrics">
            <div className="metric-card blue"><span>Patients Today</span><strong>{historyReports.length || 18}</strong></div>
            <div className="metric-card green"><span>Appointments</span><strong>10</strong></div>
            <div className="metric-card orange"><span>Prescriptions</span><strong>{historyReports.filter((report) => report.title?.toLowerCase().includes('prescription')).length || 14}</strong></div>
            <div className="metric-card purple"><span>Reports Added</span><strong>{historyReports.length}</strong></div>
          </section>

          <section className="panel-grid doctor-main-grid">
            <div className="dash-panel scanner-panel" id="scan">
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

            <div className="dash-panel" id="patients">
              <div className="panel-title">
                <h2>Recent Patients</h2>
                <a>View All</a>
              </div>
              {historyError && <div className="alert alert-error">{historyError}</div>}
              <div className="compact-list">
                {historyReports.length ? historyReports.slice(0, 5).map((report) => (
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

            <div className="dash-panel">
              <div className="panel-title">
                <h2>Today's Appointments</h2>
                <a>View Schedule</a>
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
          </section>

          <section className="panel-grid lower-grid">
            <div className="dash-panel" id="analytics">
              <div className="panel-title">
                <h2>Daily Customers</h2>
                <a>Analytics</a>
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

            <div className="dash-panel quick-actions" id="reports">
              <div className="panel-title">
                <h2>Quick Actions</h2>
              </div>
              <button className="quick-button">Add Prescription</button>
              <button className="quick-button">Add Report</button>
              <button className="quick-button">Add Diagnosis</button>
              <button className="quick-button">Write Note</button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default DoctorDashboard;
