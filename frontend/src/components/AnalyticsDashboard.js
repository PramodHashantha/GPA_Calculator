import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../utils/api';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const [semesterHistory, setSemesterHistory] = useState([]);
  const [subjectPerformance, setSubjectPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [history, performance] = await Promise.all([
        api.get('/analytics/semester-history'),
        api.get('/analytics/subject-performance')
      ]);
      setSemesterHistory(history.data);
      setSubjectPerformance(performance.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const getAverageTrend = () => {
    if (semesterHistory.length === 0) return 0;
    const sum = semesterHistory.reduce((acc, s) => acc + s.gpa, 0);
    return (sum / semesterHistory.length).toFixed(2);
  };

  const getTrend = () => {
    if (semesterHistory.length < 2) return 'N/A';
    const recent = semesterHistory.slice(-2);
    if (recent[1].gpa > recent[0].gpa) return '📈 Improving';
    if (recent[1].gpa < recent[0].gpa) return '📉 Declining';
    return '➡️ Stable';
  };

  return (
    <div className="analytics-dashboard">
      <motion.div
        className="analytics-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>Analytics Dashboard</h2>
        <div className="trend-badge">
          <span>{getTrend()}</span>
          <span className="avg-trend">Avg: {getAverageTrend()}</span>
        </div>
      </motion.div>

      <div className="analytics-grid">
        <motion.div
          className="analytics-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3>Semester GPA History</h3>
          {semesterHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={semesterHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  style={{ fontSize: '0.75rem' }}
                />
                <YAxis
                  domain={[0, 4.0]}
                  style={{ fontSize: '0.75rem' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="gpa"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Semester GPA"
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No semester data available</div>
          )}
        </motion.div>

        <motion.div
          className="analytics-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3>Best & Worst Subjects</h3>
          {subjectPerformance ? (
            <div className="performance-comparison">
              <div className="performance-section">
                <h4>🏆 Best Subjects</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={subjectPerformance.best.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="subjectCode"
                      style={{ fontSize: '0.7rem' }}
                    />
                    <YAxis domain={[0, 4.0]} />
                    <Tooltip />
                    <Bar dataKey="points" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="performance-section">
                <h4>⚠️ Needs Improvement</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={subjectPerformance.worst.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="subjectCode"
                      style={{ fontSize: '0.7rem' }}
                    />
                    <YAxis domain={[0, 4.0]} />
                    <Tooltip />
                    <Bar dataKey="points" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="no-data">No performance data available</div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

