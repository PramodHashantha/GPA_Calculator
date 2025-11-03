import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import './DegreeProgress.css';

// Custom Circular Progress Component
const CircularProgress = ({ percentage, size = 180 }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="circular-progress-wrapper" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="circular-progress-svg">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="12"
          className="progress-bg-circle"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="progress-circle"
        />
      </svg>
      <div className="circular-progress-text">
        <span className="progress-percentage">{percentage.toFixed(1)}%</span>
        <span className="progress-label">Complete</span>
      </div>
    </div>
  );
};

const DegreeProgress = () => {
  const [progress, setProgress] = useState(null);
  const [totalCredits, setTotalCredits] = useState(120);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await api.get('/analytics/degree-progress');
      setProgress(response.data);
      setTotalCredits(response.data.totalCredits);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleUpdateTotalCredits = async () => {
    setLoading(true);
    try {
      await api.put('/analytics/degree-progress', { totalCredits });
      await fetchProgress();
      setEditing(false);
      toast.success('Total credits updated successfully!');
    } catch (error) {
      console.error('Error updating credits:', error);
      toast.error('Failed to update total credits');
    } finally {
      setLoading(false);
    }
  };

  if (!progress) {
    return (
      <div className="degree-progress-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const percentage = progress.percentage || 0;

  return (
    <motion.div
      className="degree-progress-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="progress-header">
        <div className="header-content">
          <div>
            <h3>Degree Progress</h3>
            <p className="degree-title">Track your academic journey</p>
          </div>
          {!editing ? (
            <button className="edit-btn" onClick={() => setEditing(true)} title="Edit total credits">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          ) : (
            <div className="edit-actions">
              <button className="cancel-btn" onClick={() => { setEditing(false); setTotalCredits(progress.totalCredits); }} title="Cancel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <button className="save-btn" onClick={handleUpdateTotalCredits} disabled={loading} title="Save">
                {loading ? (
                  <div className="mini-spinner"></div>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="progress-content">
        {/* Circular Progress */}
        <div className="progress-visual">
          <CircularProgress percentage={percentage} />
        </div>

        {/* Stats Grid */}
        <div className="progress-stats-grid">
          <div className="stat-card">
            <div className="stat-icon completed">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{progress.completedCredits}</span>
              <span className="stat-unit">credits</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon remaining">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Remaining</span>
              <span className="stat-value">{progress.remainingCredits}</span>
              <span className="stat-unit">credits</span>
            </div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-icon total">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="22"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Required</span>
              {editing ? (
                <input
                  type="number"
                  value={totalCredits}
                  onChange={(e) => setTotalCredits(parseInt(e.target.value) || 120)}
                  className="credit-input"
                  min="1"
                  autoFocus
                />
              ) : (
                <span className="stat-value">{progress.totalCredits}</span>
              )}
              <span className="stat-unit">credits</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-section">
          <div className="progress-bar-header">
            <span className="progress-bar-label">Overall Progress</span>
            <span className="progress-bar-percentage">{percentage.toFixed(1)}%</span>
          </div>
          <div className="progress-bar-container">
            <motion.div
              className="progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <p className="progress-summary">
            <strong>{progress.completedCredits}</strong> of <strong>{progress.totalCredits}</strong> credits completed
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default DegreeProgress;
