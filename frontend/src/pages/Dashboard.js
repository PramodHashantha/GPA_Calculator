import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import ResultsTable from '../components/ResultsTable';
import DegreeProgress from '../components/DegreeProgress';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import TargetGPAPlanner from '../components/TargetGPAPlanner';
import ExportPanel from '../components/ExportPanel';
import './Dashboard.scss';

const Dashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [results, setResults] = useState(null);
  const [overallGPA, setOverallGPA] = useState(null);
  const [semesterHistory, setSemesterHistory] = useState([]);
  const [degreeProgress, setDegreeProgress] = useState(null);
  const [totalCredits, setTotalCredits] = useState(120);
  const [degreeName, setDegreeName] = useState('Computer Science');
  const [editingTotalCredits, setEditingTotalCredits] = useState(false);
  const [editingDegreeName, setEditingDegreeName] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  // Initialize activeTab from location state to prevent flicker
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.activeTab || 'dashboard';
  });
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Professional SVG Icons
  const DashboardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  );

  const SubjectsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
    </svg>
  );

  const SemestersIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
    </svg>
  );

  const AchievementsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  );

  const SettingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );

  const getNavIcon = (id) => {
    switch(id) {
      case 'dashboard':
        return <DashboardIcon />;
      case 'subjects':
        return <SubjectsIcon />;
      case 'semesters':
        return <SemestersIcon />;
      case 'achievements':
        return <AchievementsIcon />;
      case 'settings':
        return <SettingsIcon />;
      default:
        return null;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { id: 'subjects', label: 'Subjects', path: '/add-subject' },
    { id: 'semesters', label: 'Semesters', path: '/dashboard' },
    { id: 'achievements', label: 'Target GPA', path: '/dashboard' },
    { id: 'settings', label: 'Settings', path: '/dashboard' }
  ];

  useEffect(() => {
    fetchSubjects();
    fetchOverallGPA();
    fetchSemesterHistory();
    fetchDegreeProgress();
  }, []);

  // Update active tab when location changes
  useEffect(() => {
    // Update tab if navigation state provides a different tab
    if (location.state?.activeTab && location.state.activeTab !== activeTab) {
      setActiveTab(location.state.activeTab);
    } else if (!location.state?.activeTab && location.pathname === '/dashboard' && activeTab !== 'dashboard') {
      // Reset to dashboard if no state is provided
      setActiveTab('dashboard');
    }
  }, [location.pathname, location.state?.activeTab]);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchOverallGPA = async () => {
    try {
      const response = await api.get('/subjects/gpa');
      setOverallGPA(response.data);
    } catch (error) {
      console.error('Error fetching overall GPA:', error);
    }
  };

  const fetchSemesterHistory = async () => {
    try {
      const response = await api.get('/analytics/semester-history');
      setSemesterHistory(response.data);
    } catch (error) {
      console.error('Error fetching semester history:', error);
    }
  };

  const fetchDegreeProgress = async () => {
    try {
      const response = await api.get('/analytics/degree-progress');
      setDegreeProgress(response.data);
      if (response.data.totalCredits) {
        setTotalCredits(response.data.totalCredits);
      }
      if (response.data.degreeName) {
        setDegreeName(response.data.degreeName);
      }
    } catch (error) {
      console.error('Error fetching degree progress:', error);
    }
  };


  const handleDeleteSubject = async (id) => {
    try {
      await api.delete(`/subjects/${id}`);
      await fetchSubjects();
      await fetchOverallGPA();
      await fetchSemesterHistory();
      await fetchDegreeProgress();
      toast.success('Subject deleted successfully!');
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/signin');
  };

  const handleSaveTotalCredits = async () => {
    setLoading(true);
    try {
      await api.put('/analytics/degree-progress', { totalCredits });
      await fetchDegreeProgress();
      setEditingTotalCredits(false);
      toast.success('Total credits updated successfully!');
    } catch (error) {
      console.error('Error updating total credits:', error);
      toast.error('Failed to update total credits');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDegreeName = async () => {
    setLoading(true);
    try {
      await api.put('/analytics/degree-progress', { degreeName });
      await fetchDegreeProgress();
      setEditingDegreeName(false);
      toast.success('Degree name updated successfully!');
    } catch (error) {
      console.error('Error updating degree name:', error);
      toast.error('Failed to update degree name');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (degreeProgress) {
      setTotalCredits(degreeProgress.totalCredits);
    }
  }, [degreeProgress]);

  const getGPAChange = () => {
    if (semesterHistory.length < 2) return null;
    const recent = semesterHistory.slice(-2);
    const change = recent[1].gpa - recent[0].gpa;
    return change > 0 ? `↑ +${change.toFixed(2)} this semester` : `↓ ${change.toFixed(2)} this semester`;
  };

  const recentSubjects = subjects
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const getSubjectIcon = (code) => {
    const iconIndex = code.length % 3;
    const icons = [
      <svg key="code" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>,
      <svg key="database" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>,
      <svg key="globe" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ];
    return icons[iconIndex];
  };

  const userInitials = user.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="dashboard">
      {/* Top Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-section">
              <div className="logo-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <div className="logo-text">GPA Tracker</div>
            </div>
            <div className="title-section">
              <h1 className="main-title">Academic Dashboard</h1>
              <p className="subtitle">Track your academic progress and GPA</p>
            </div>
          </div>
          <div className="header-right">
            <button className="notification-btn" title="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {theme === 'light' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )}
            </button>
            <button
              className="add-subject-btn"
              onClick={() => navigate('/add-subject')}
            >
              + Add Subject
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav className="nav-menu">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  // If clicking on subjects, navigate away
                  if (item.path === '/add-subject') {
                    navigate(item.path);
                  } else {
                    // For dashboard tabs, just set the tab without navigating if already on dashboard
                    if (location.pathname === '/dashboard') {
                      setActiveTab(item.id);
                    } else {
                      // If on another page, navigate with state
                      navigate('/dashboard', { state: { activeTab: item.id }, replace: true });
                    }
                  }
                }}
              >
                <span className="nav-icon">{getNavIcon(item.id)}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="user-profile">
            <div className="profile-content">
              <div className="profile-avatar">{userInitials}</div>
              <div className="profile-info">
                <div className="profile-name">{user.name || 'User'}</div>
                <div className="profile-major">Computer Science</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="dashboard-view"
            >
              {/* Summary Cards */}
              <div className="summary-cards">
                <motion.div
                  className="summary-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="card-header">
                    <div className="card-title">Overall GPA</div>
                    <div className="card-icon blue">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                      </svg>
                    </div>
                  </div>
                  <div className="card-value">
                    {overallGPA ? overallGPA.overallGPA.toFixed(2) : '0.00'}
                  </div>
                  <div className="card-footer">
                    {getGPAChange() && (
                      <span className="trend">
                        {getGPAChange()}
                      </span>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  className="summary-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="card-header">
                    <div className="card-title">Total Subjects</div>
                    <div className="card-icon green">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                      </svg>
                    </div>
                  </div>
                  <div className="card-value">{overallGPA?.totalSubjects || 0}</div>
                  <div className="card-footer">
                    Across {semesterHistory.length} semesters
                  </div>
                </motion.div>

                <motion.div
                  className="summary-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="card-header">
                    <div className="card-title">Total Credits</div>
                    <div className="card-icon purple">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="2" x2="12" y2="22"/>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    </div>
                  </div>
                  <div className="card-value">{overallGPA?.totalCredits || 0}</div>
                  <div className="card-footer">
                    Out of {degreeProgress?.totalCredits || 120} required
                  </div>
                </motion.div>

                <motion.div
                  className="summary-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="card-header">
                    <div className="card-title">Degree Progress</div>
                    <div className="card-icon orange">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                      </svg>
                    </div>
                  </div>
                  <div className="card-value">
                    {degreeProgress ? degreeProgress.percentage.toFixed(1) : '0'}%
                  </div>
                  <div className="card-footer">
                    <span className="trend">✓ On track</span>
                  </div>
                </motion.div>
              </div>

              {/* Two Column Layout */}
              <div className="two-column-layout">
                {/* Left Column */}
                <div>
                  {/* Degree Progress Section */}
                  <DegreeProgress />
                </div>

                {/* Right Column */}
                <div>
                  {/* GPA Overview */}
                  <div className="gpa-overview">
                    <h3 className="section-title">GPA Overview</h3>
                    <div className="gauge-container">
                      <div className="gpa-gauge">
                        <svg width="200" height="120" viewBox="0 0 200 120">
                          <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="12"
                          />
                          <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="12"
                            strokeDasharray={`${((overallGPA?.overallGPA || 0) / 4) * 502} 502`}
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="gpa-display">
                      <div className="gpa-value">
                        {overallGPA ? overallGPA.overallGPA.toFixed(2) : '0.00'}
                      </div>
                      <div className="gpa-label">Current GPA</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Two Columns */}
              <div className="two-column-layout">
                {/* Recent Subjects */}
                <div className="recent-subjects">
                  <h3 className="section-title">Recent Subjects</h3>
                  <div className="subject-list">
                    {recentSubjects.length > 0 ? (
                      recentSubjects.map((subject, index) => (
                        <motion.div
                          key={subject._id}
                          className="subject-card"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        >
                          <div className="subject-left">
                            <div className={`subject-icon ${index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'green' : 'purple'}`}>
                              {getSubjectIcon(subject.subjectCode)}
                            </div>
                            <div className="subject-info">
                              <div className="subject-name">{subject.subjectName}</div>
                              <div className="subject-meta">
                                {subject.subjectCode} • {subject.credits} Credits
                              </div>
                            </div>
                          </div>
                          <div className="subject-right">
                            <div className="subject-grade">{subject.grade}</div>
                            <div className="subject-gpa">
                              {(() => {
                                const gradePoints = {
                                  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
                                  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
                                  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
                                  'D+': 1.3, 'D': 1.0, 'F': 0.0
                                };
                                return gradePoints[subject.grade] || 0;
                              })().toFixed(1)} GPA
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="empty-state">No subjects added yet</div>
                    )}
                  </div>
                </div>

                {/* Semester Performance */}
                <div className="semester-performance">
                  <h3 className="section-title">Semester Performance</h3>
                  <div className="semester-list">
                    {semesterHistory.length > 0 ? (
                      semesterHistory.slice(-4).reverse().map((sem, index) => (
                        <motion.div
                          key={`${sem.year}-${sem.semester}`}
                          className="semester-item"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        >
                          <div className="semester-name">
                            {sem.label}
                          </div>
                          <div className="semester-gpa">{sem.gpa.toFixed(2)}</div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="empty-state">No semester data available</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Goal Card */}
              <motion.div
                className="academic-goal"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="goal-content">
                  <div className="goal-title">Academic Goal</div>
                  <div className="goal-text">
                    Maintain GPA above 3.8 for Dean's List
                  </div>
                  <div className="goal-footer">
                    <div className="goal-current">
                      Current: {overallGPA ? overallGPA.overallGPA.toFixed(2) : '0.00'}
                    </div>
                    <div className="goal-icon">🏆</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'subjects' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <ResultsTable
                results={results}
                loading={loading}
                selectedYear={1}
                selectedSemester={1}
                onDelete={handleDeleteSubject}
              />
            </motion.div>
          )}

          {activeTab === 'semesters' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AnalyticsDashboard />
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <TargetGPAPlanner />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="settings-view"
            >
              <div className="settings-container">
                <div className="settings-header">
                  <h2 className="settings-title">Settings</h2>
                  <p className="settings-description">Manage your degree information and preferences</p>
                </div>

                {/* Degree Information Section */}
                <div className="settings-card">
                  <div className="settings-card-header">
                    <div className="settings-card-title-group">
                      <div className="settings-card-icon degree-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="settings-card-title">Degree Information</h3>
                        <p className="settings-card-subtitle">Configure your degree details</p>
                      </div>
                    </div>
                  </div>

                  <div className="settings-card-content">
                    {/* Degree Name */}
                    <div className="setting-item">
                      <div className="setting-label-group">
                        <label className="setting-label">Degree Name</label>
                        <span className="setting-hint">e.g., Bachelor of Computer Science</span>
                      </div>
                      <div className="setting-input-group">
                        {editingDegreeName ? (
                          <>
                            <input
                              type="text"
                              className="setting-input"
                              value={degreeName}
                              onChange={(e) => setDegreeName(e.target.value)}
                              placeholder="Enter degree name"
                              autoFocus
                            />
                            <div className="setting-actions">
                              <button
                                className="setting-btn cancel-btn"
                                onClick={() => { setEditingDegreeName(false); setDegreeName(degreeProgress?.degreeName || 'Computer Science'); }}
                                disabled={loading}
                              >
                                Cancel
                              </button>
                              <button
                                className="setting-btn save-btn"
                                onClick={handleSaveDegreeName}
                                disabled={loading || !degreeName.trim()}
                              >
                                {loading ? (
                                  <span className="btn-loader"></span>
                                ) : (
                                  <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                    Save
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="setting-display">
                              <span className="setting-display-value">{degreeName || 'Computer Science'}</span>
                            </div>
                            <button
                              className="setting-btn edit-btn"
                              onClick={() => setEditingDegreeName(true)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Edit
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Total Credits */}
                    <div className="setting-item">
                      <div className="setting-label-group">
                        <label className="setting-label">Total Credits Required</label>
                        <span className="setting-hint">Total credits needed to complete your degree</span>
                      </div>
                      <div className="setting-input-group">
                        {editingTotalCredits ? (
                          <>
                            <input
                              type="number"
                              className="setting-input"
                              value={totalCredits}
                              onChange={(e) => setTotalCredits(parseInt(e.target.value) || 120)}
                              min="1"
                              autoFocus
                            />
                            <div className="setting-actions">
                              <button
                                className="setting-btn cancel-btn"
                                onClick={() => { setEditingTotalCredits(false); setTotalCredits(degreeProgress?.totalCredits || 120); }}
                                disabled={loading}
                              >
                                Cancel
                              </button>
                              <button
                                className="setting-btn save-btn"
                                onClick={handleSaveTotalCredits}
                                disabled={loading || totalCredits < 1}
                              >
                                {loading ? (
                                  <span className="btn-loader"></span>
                                ) : (
                                  <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                    Save
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="setting-display">
                              <span className="setting-display-value">{totalCredits}</span>
                              <span className="setting-display-unit">credits</span>
                            </div>
                            <button
                              className="setting-btn edit-btn"
                              onClick={() => setEditingTotalCredits(true)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Edit
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress Summary */}
                    {!editingTotalCredits && !editingDegreeName && degreeProgress && (
                      <div className="setting-progress-summary">
                        <div className="progress-summary-grid">
                          <div className="progress-summary-item">
                            <div className="progress-summary-label">Completed</div>
                            <div className="progress-summary-value">{overallGPA?.totalCredits || 0}</div>
                          </div>
                          <div className="progress-summary-item">
                            <div className="progress-summary-label">Remaining</div>
                            <div className="progress-summary-value">{degreeProgress.remainingCredits}</div>
                          </div>
                          <div className="progress-summary-item highlight">
                            <div className="progress-summary-label">Progress</div>
                            <div className="progress-summary-value">{degreeProgress.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appearance Section */}
                <div className="settings-card">
                  <div className="settings-card-header">
                    <div className="settings-card-title-group">
                      <div className="settings-card-icon appearance-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M12 1v6m0 6v6M1 12h6m6 0h6"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="settings-card-title">Appearance</h3>
                        <p className="settings-card-subtitle">Customize your theme</p>
                      </div>
                    </div>
                  </div>

                  <div className="settings-card-content">
                    <div className="setting-item">
                      <div className="setting-label-group">
                        <label className="setting-label">Theme</label>
                        <span className="setting-hint">Switch between light and dark mode</span>
                      </div>
                      <div className="setting-input-group">
                        <div className="theme-toggle-wrapper">
                          <span className="theme-current">{theme === 'light' ? 'Light' : 'Dark'} Mode</span>
                          <button
                            className="theme-toggle-btn"
                            onClick={toggleTheme}
                            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                          >
                            {theme === 'light' ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="5"/>
                                <line x1="12" y1="1" x2="12" y2="3"/>
                                <line x1="12" y1="21" x2="12" y2="23"/>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                                <line x1="1" y1="12" x2="3" y2="12"/>
                                <line x1="21" y1="12" x2="23" y2="12"/>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export & Share Section */}
                <div className="settings-card">
                  <div className="settings-card-header">
                    <div className="settings-card-title-group">
                      <div className="settings-card-icon export-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="settings-card-title">Export & Share</h3>
                        <p className="settings-card-subtitle">Download your GPA report or share it</p>
                      </div>
                    </div>
                  </div>

                  <div className="settings-card-content">
                    <ExportPanel />
                  </div>
                </div>

                {/* Account Section */}
                <div className="settings-card">
                  <div className="settings-card-header">
                    <div className="settings-card-title-group">
                      <div className="settings-card-icon account-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="settings-card-title">Account</h3>
                        <p className="settings-card-subtitle">Manage your account settings</p>
                      </div>
                    </div>
                  </div>

                  <div className="settings-card-content">
                    <div className="setting-item">
                      <div className="setting-label-group">
                        <label className="setting-label">Sign Out</label>
                        <span className="setting-hint">Sign out of your account</span>
                      </div>
                      <div className="setting-input-group">
                        <button
                          className="setting-btn logout-btn"
                          onClick={handleLogout}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>

    </div>
  );
};

export default Dashboard;
