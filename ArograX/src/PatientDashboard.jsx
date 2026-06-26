import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

const ADMIN_EMAIL = 'princep4732355@gmail.com';

function PatientDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [recordsError, setRecordsError] = useState('');

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
        const res = await axios.get('http://localhost:5000/api/auth/patient/my-reports', {
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

  const handleSignOut = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="portal-shell patient-theme">
      <aside className="side-nav">
        <div className="nav-brand">
          <img src="/logo.png" alt="AroyaX" />
        </div>
        <nav>
          <a className="nav-item is-active" href="#dashboard">Dashboard</a>
          <a className="nav-item" href="#records">My Records</a>
          <a className="nav-item" href="#health-card">Health Card</a>
          <a className="nav-item" href="#emergency">Emergency</a>
          <a className="nav-item" href="#medicine">Medications</a>
          <a className="nav-item" href="#settings">Settings</a>
        </nav>
        <button className="nav-logout" onClick={handleSignOut}>Logout</button>
      </aside>

      <div className="portal-main">
        <header className="topbar">
          <button className="icon-button" aria-label="Open menu">Menu</button>
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

        <main className="dashboard-canvas patient-dashboard-layout" id="dashboard">
          <section className="dashboard-content">
            <div className="welcome-row">
              <div>
                <p>Welcome back,</p>
                <h1>{user?.name || 'Patient'}</h1>
                <small>Here is your health overview</small>
              </div>
            </div>

            <div className="metric-grid">
              <div className="metric-card blue"><span>Total Records</span><strong>{reports.length + 6}</strong><a>View all</a></div>
              <div className="metric-card green"><span>Prescriptions</span><strong>{reports.filter((report) => report.title?.toLowerCase().includes('prescription')).length || 2}</strong><a>View all</a></div>
              <div className="metric-card orange"><span>Reports</span><strong>{reports.length}</strong><a>View all</a></div>
              <div className="metric-card purple"><span>Appointments</span><strong>05</strong><a>View all</a></div>
            </div>

            <div className="panel-grid two-col">
              <section className="dash-panel" id="records">
                <div className="panel-title">
                  <h2>Recent Records</h2>
                  <a>View All</a>
                </div>
                {recordsError && <div className="alert alert-error">{recordsError}</div>}
                <div className="compact-list">
                  {reports.length ? reports.slice(0, 4).map((report) => (
                    <article className="compact-row" key={report._id}>
                      <div className="row-icon blue">REC</div>
                      <div>
                        <strong>{report.title}</strong>
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                      <a className="mini-pill" href={report.reportUrl} target="_blank" rel="noreferrer">Report</a>
                    </article>
                  )) : (
                    <div className="empty-state">No doctor reports have been added yet.</div>
                  )}
                </div>
              </section>

              <section className="dash-panel">
                <div className="panel-title">
                  <h2>Upcoming Appointments</h2>
                  <a>View All</a>
                </div>
                <div className="compact-list">
                  <article className="compact-row">
                    <img className="row-avatar" src="/logo.png" alt="" />
                    <div>
                      <strong>Dr. AroyaX Care</strong>
                      <span>{nextCheckup} - 11:30 AM</span>
                    </div>
                  </article>
                  <article className="compact-row">
                    <img className="row-avatar" src={user?.avatar} alt="" />
                    <div>
                      <strong>Health Follow Up</strong>
                      <span>{nextCheckup} - 02:00 PM</span>
                    </div>
                  </article>
                </div>
              </section>
            </div>

            <div className="banner-grid">
              <section className="emergency-banner" id="emergency">
                <div>
                  <h2>Emergency Access</h2>
                  <p>In case of emergency, your health information can save your life.</p>
                  <a
                    className="btn btn-danger"
                    href={`mailto:${ADMIN_EMAIL}?subject=Emergency%20help%20request&body=Patient:%20${encodeURIComponent(user?.name || '')}%0AEmail:%20${encodeURIComponent(user?.email || '')}%0APhone:%20${encodeURIComponent(user?.patientProfile?.phone || '')}%0A%0AEmergency%20details:%20`}
                  >
                    View Emergency Info
                  </a>
                </div>
                <div className="ambulance-visual">ER</div>
              </section>

              <section className="tip-banner" id="medicine">
                <h2>Buy Medicine</h2>
                <p>Send a medicine request directly to admin.</p>
                <a
                  className="btn btn-primary"
                  href={`mailto:${ADMIN_EMAIL}?subject=Buy%20medicine%20request&body=Patient:%20${encodeURIComponent(user?.name || '')}%0AEmail:%20${encodeURIComponent(user?.email || '')}%0A%0AMedicine%20name:%20%0AQuantity:%20%0AAddress:%20${encodeURIComponent(user?.patientProfile?.address || '')}`}
                >
                  Order Medicine
                </a>
              </section>
            </div>
          </section>

          <aside className="right-rail">
            <section className="dash-panel qr-card" id="health-card">
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
                <a>View All</a>
              </div>
              <div className="health-list">
                <div><span>Blood Group</span><strong>{user?.patientProfile?.bloodType || 'O+'}</strong></div>
                <div><span>Allergies</span><strong>{user?.patientProfile?.allergies || 'None'}</strong></div>
                <div><span>Chronic Conditions</span><strong>{user?.patientProfile?.chronicConditions || 'None'}</strong></div>
                <div><span>Last Checkup</span><strong>{nextCheckup}</strong></div>
              </div>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}

export default PatientDashboard;
