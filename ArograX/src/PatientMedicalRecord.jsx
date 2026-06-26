import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/auth';

function PatientMedicalRecord({ currentUser }) {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [reportForm, setReportForm] = useState({
    title: '',
    reportUrl: '',
    notes: ''
  });

  const [reportMessage, setReportMessage] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const accessDenied = !currentUser || currentUser.role !== 'doctor';

  // -----------------------------
  // FETCH PATIENT RECORD
  // -----------------------------
  useEffect(() => {
    const fetchPatientRecord = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await axios.get(
          `${API_BASE}/patient-record/${patientId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (res.data?.success) {
          setPatientData(res.data.patient);
        } else {
          setErrorMsg('Invalid response from server.');
        }
      } catch (err) {
        setErrorMsg(
          err.response?.data?.message ||
          'Failed to load patient record (backend route missing or server down).'
        );
      } finally {
        setLoading(false);
      }
    };

    if (!accessDenied) fetchPatientRecord();
  }, [patientId, accessDenied]);

  // -----------------------------
  // SUBMIT REPORT
  // -----------------------------
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReport(true);
    setReportMessage('');

    try {
      const token = localStorage.getItem('token');

      const res = await axios.post(
        `${API_BASE}/patient-record/${patientId}/reports`,
        reportForm,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data?.success) {
        setPatientData(res.data.patient);

        setReportForm({
          title: '',
          reportUrl: '',
          notes: ''
        });

        setReportMessage('Report successfully added.');
      } else {
        setReportMessage('Unexpected server response.');
      }
    } catch (err) {
      const status = err.response?.status;
      const serverMessage = err.response?.data?.message;
      setReportMessage(
        serverMessage ||
        (status ? `Failed to save report. Server returned ${status}.` : 'Failed to save report. Backend server is not reachable.')
      );
    } finally {
      setSubmittingReport(false);
    }
  };

  // -----------------------------
  // SORT REPORTS
  // -----------------------------
  const reports = (patientData?.medicalReports || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // -----------------------------
  // LOADING STATE
  // -----------------------------
  if (accessDenied) {
    return (
      <div className="record-page">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          Back
        </button>
        <div className="alert alert-error record-page-alert">
          Access Denied. Doctor login required.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        Loading Patient Medical Record...
      </div>
    );
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="record-page">
      <button className="btn btn-secondary" onClick={() => navigate('/doctor-dashboard')}>
        Back
      </button>

      {errorMsg ? (
        <div className="alert alert-error record-page-alert">
          {errorMsg}
        </div>
      ) : (
        <>
          <div className="record-header">
            <img
              src={
                patientData?.patientProfile?.uploadedPhotoUrl ||
                patientData?.avatar ||
                'https://via.placeholder.com/90'
              }
              alt="Patient profile"
            />

            <div>
              <p className="eyebrow">Patient Record</p>
              <h2>{patientData?.name}</h2>
              <p className="muted">{patientData?.email}</p>
            </div>
          </div>

          <section className="surface-card record-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Vitals</p>
                <h2>Demographics</h2>
              </div>
            </div>
            <div className="info-grid">
              <div className="info-tile">
                <span>DOB</span>
                <strong>{patientData?.patientProfile?.dob || 'Not added'}</strong>
              </div>
              <div className="info-tile">
                <span>Gender</span>
                <strong>{patientData?.patientProfile?.gender || 'Not added'}</strong>
              </div>
              <div className="info-tile">
                <span>Blood Type</span>
                <strong>{patientData?.patientProfile?.bloodType || 'Not added'}</strong>
              </div>
              <div className="info-tile">
                <span>Phone</span>
                <strong>{patientData?.patientProfile?.phone || 'Not added'}</strong>
              </div>
            </div>
          </section>

          <section className="surface-card record-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">New Report</p>
                <h2>Add Scanned Medical Report</h2>
              </div>
            </div>
            <form className="report-form" onSubmit={handleReportSubmit}>
              <input
                type="text"
                placeholder="Report Title"
                value={reportForm.title}
                onChange={(e) =>
                  setReportForm({ ...reportForm, title: e.target.value })
                }
                required
              />

              <input
                type="url"
                placeholder="Report URL"
                value={reportForm.reportUrl}
                onChange={(e) =>
                  setReportForm({ ...reportForm, reportUrl: e.target.value })
                }
                required
              />

              <textarea
                placeholder="Notes"
                value={reportForm.notes}
                onChange={(e) =>
                  setReportForm({ ...reportForm, notes: e.target.value })
                }
                rows="4"
              />

              <button className="btn btn-primary" type="submit" disabled={submittingReport}>
                {submittingReport ? 'Saving...' : 'Save Report'}
              </button>

              {reportMessage && (
                <div className={reportMessage.includes('Failed') ? 'alert alert-error' : 'alert alert-success'}>
                  {reportMessage}
                </div>
              )}
            </form>
          </section>

          <section className="surface-card record-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">History</p>
                <h2>Medical Reports</h2>
              </div>
            </div>

            <div className="record-list">
              {reports.length === 0 ? (
                <div className="empty-state">No reports found.</div>
              ) : (
                reports.map((report) => (
                  <article className="record-item" key={report._id}>
                    <div>
                      <strong>{report.title}</strong>
                      <p>{report.notes || 'No notes added.'}</p>
                      <span>
                        By Dr. {report.doctorName} on{' '}
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <a className="btn btn-secondary" href={report.reportUrl} target="_blank" rel="noreferrer">
                      Open Report
                    </a>
                  </article>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default PatientMedicalRecord;
