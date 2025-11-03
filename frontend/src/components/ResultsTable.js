import React from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import './ResultsTable.css';

const ResultsTable = ({ results, loading, selectedYear, selectedSemester, onDelete }) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading results...</p>
      </div>
    );
  }

  if (!results || !results.subjects || results.subjects.length === 0) {
    return (
      <motion.div
        className="empty-state"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="empty-icon">📚</div>
        <h3>No subjects added yet</h3>
        <p>Add your first subject to see results here</p>
      </motion.div>
    );
  }

  const getGradeColor = (grade) => {
    const gradeColors = {
      'A+': '#10b981',
      'A': '#3b82f6',
      'A-': '#3b82f6',
      'B+': '#6366f1',
      'B': '#8b5cf6',
      'B-': '#a855f7',
      'C+': '#f59e0b',
      'C': '#f59e0b',
      'C-': '#f97316',
      'D+': '#ef4444',
      'D': '#dc2626',
      'F': '#991b1b'
    };
    return gradeColors[grade] || '#64748b';
  };

  return (
    <motion.div
      className="results-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="results-header">
        <h2>
          Year {selectedYear} | Semester {selectedSemester}
        </h2>
        <div className="semester-gpa">
          <span className="gpa-label">Semester GPA:</span>
          <motion.span
            className="gpa-value"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            style={{ color: getGradeColor(results.gpa >= 3.5 ? 'A' : results.gpa >= 3.0 ? 'B+' : 'C+') }}
          >
            {results.gpa.toFixed(2)}
          </motion.span>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th>Subject Code</th>
              <th>Subject</th>
              <th>Credits</th>
              <th>CA %</th>
              <th>Attempt</th>
              <th>Grade</th>
              <th>Period</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.subjects.map((subject, index) => (
              <motion.tr
                key={subject._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="table-row"
              >
                <td>
                  <div className="subject-code-cell">
                    <span>{subject.subjectCode}</span>
                    <span className="caret-icon">▼</span>
                  </div>
                </td>
                <td className="subject-name">{subject.subjectName}</td>
                <td>{subject.credits}</td>
                <td>{subject.caPercentage.toFixed(2)}</td>
                <td>{subject.attempts}</td>
                <td>
                  <span
                    className="grade-badge"
                    style={{ backgroundColor: getGradeColor(subject.grade) }}
                  >
                    {subject.grade}
                  </span>
                </td>
                <td className="period">Not Available</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => onDelete(subject._id)}
                    title="Delete subject"
                  >
                    🗑️
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="results-footer">
        <div className="footer-info">
          <span>Total Credits: <strong>{results.totalCredits}</strong></span>
          <span>Total Subjects: <strong>{results.subjects.length}</strong></span>
        </div>
      </div>
    </motion.div>
  );
};

export default ResultsTable;

