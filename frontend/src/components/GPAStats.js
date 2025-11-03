import React from 'react';
import { motion } from 'framer-motion';
import './GPAStats.css';

const GPAStats = ({ overallGPA }) => {
  const getGPAColor = (gpa) => {
    if (gpa >= 3.5) return '#10b981'; // green
    if (gpa >= 3.0) return '#3b82f6'; // blue
    if (gpa >= 2.5) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getGPALabel = (gpa) => {
    if (gpa >= 3.5) return 'Excellent';
    if (gpa >= 3.0) return 'Good';
    if (gpa >= 2.5) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <motion.div
      className="gpa-stats"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="gpa-card">
        <div className="gpa-icon">📊</div>
        <div className="gpa-content">
          <h3>Overall GPA</h3>
          <motion.div
            className="gpa-value"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            style={{ color: overallGPA ? getGPAColor(overallGPA.overallGPA || 0) : '#64748b' }}
          >
            {overallGPA ? (overallGPA.overallGPA || 0).toFixed(2) : '0.00'}
          </motion.div>
          <p className="gpa-label">
            {overallGPA ? getGPALabel(overallGPA.overallGPA || 0) : 'No data yet'}
          </p>
        </div>
        <div className="gpa-details">
          <div className="gpa-detail-item">
            <span className="detail-label">Total Credits</span>
            <span className="detail-value">{overallGPA?.totalCredits || 0}</span>
          </div>
          <div className="gpa-detail-item">
            <span className="detail-label">Total Subjects</span>
            <span className="detail-value">{overallGPA?.totalSubjects || 0}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GPAStats;

