import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import './SubjectForm.scss';

const SubjectForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    grade: '',
    year: 1,
    semester: 1
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculatedCredit, setCalculatedCredit] = useState(null);
  const [recentSubjects, setRecentSubjects] = useState([]);
  const [degreeName, setDegreeName] = useState('Computer Science');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = user.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];

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

  // Get current route to highlight active nav item
  const activeNavId = navItems.find(item => item.path === location.pathname)?.id || 'subjects';

  useEffect(() => {
    fetchRecentSubjects();
    fetchDegreeProgress();
  }, []);

  const fetchDegreeProgress = async () => {
    try {
      const response = await api.get('/analytics/degree-progress');
      if (response.data.degreeName) {
        setDegreeName(response.data.degreeName);
      }
    } catch (error) {
      console.error('Error fetching degree progress:', error);
    }
  };

  const fetchRecentSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      const sorted = response.data
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentSubjects(sorted);
    } catch (error) {
      console.error('Error fetching recent subjects:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');

    // Auto-calculate credit from last digit of subject code
    if (name === 'subjectCode' && value) {
      const lastChar = value.slice(-1);
      const credit = parseInt(lastChar);
      if (!isNaN(credit) && credit > 0) {
        setCalculatedCredit(credit);
      } else {
        setCalculatedCredit(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!calculatedCredit) {
      setError('Subject code must end with a valid credit number (1-9)');
      setLoading(false);
      return;
    }

    try {
      await api.post('/subjects/add', {
        ...formData,
        caPercentage: 0, // Default CA percentage since it's not required
        year: parseInt(formData.year),
        semester: parseInt(formData.semester),
        attempts: 1
      });
      // Reset form
      setFormData({
        subjectCode: '',
        subjectName: '',
        grade: '',
        year: 1,
        semester: 1
      });
      setCalculatedCredit(null);
      await fetchRecentSubjects();
      // Show success message
      toast.success('Subject added successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add subject');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecent = async (id) => {
    // Use a simple confirmation approach with toast
    try {
      await api.delete(`/subjects/${id}`);
      await fetchRecentSubjects();
      toast.success('Subject deleted successfully!');
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject');
    }
  };

  const getYearLabel = (year) => {
    const labels = ['', '1st', '2nd', '3rd', '4th'];
    return labels[year] || `${year}th`;
  };

  const getGradeColor = (grade) => {
    if (['A+', 'A', 'A-'].includes(grade)) return 'green';
    if (['B+', 'B', 'B-'].includes(grade)) return 'blue';
    if (['C+', 'C', 'C-'].includes(grade)) return 'yellow';
    return 'red';
  };

  const getSemesterName = (year, semester) => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - (4 - year);
    if (semester === 1) return `Fall ${startYear}`;
    return `Spring ${startYear + 1}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/signin');
  };

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
              <h1 className="main-title">Subjects</h1>
              <p className="subtitle">Manage your subjects and academic records</p>
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
                className={`nav-item ${activeNavId === item.id ? 'active' : ''}`}
                onClick={() => {
                  // If navigating to dashboard with a tab, include tab in state
                  if (item.path === '/dashboard' && item.id !== 'dashboard') {
                    navigate(item.path, { state: { activeTab: item.id }, replace: true });
                  } else {
                    navigate(item.path);
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
                <div className="profile-major">{degreeName}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="subject-form-wrapper">
            {/* Form */}
            <form onSubmit={handleSubmit} className="subject-form">
              {error && (
                <motion.div
                  className="error-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="subjectName">Subject Name</label>
                  <input
                    type="text"
                    id="subjectName"
                    name="subjectName"
                    value={formData.subjectName}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Calculus I"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subjectCode">Subject Code</label>
                  <input
                    type="text"
                    id="subjectCode"
                    name="subjectCode"
                    value={formData.subjectCode}
                    onChange={handleChange}
                    required
                    placeholder="e.g., MATH 101"
                    autoComplete="off"
                  />
                  {calculatedCredit && (
                    <motion.span
                      className="credit-badge"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      {calculatedCredit} Credits (auto-calculated)
                    </motion.span>
                  )}
                </div>

                <div className="form-group has-select">
                  <label htmlFor="grade">Grade</label>
                  <select
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Grade</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group has-select">
                  <label htmlFor="year">Academic Year</label>
                  <select
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Year</option>
                    {[1, 2, 3, 4].map(year => (
                      <option key={year} value={year}>
                        {getYearLabel(year)} Year
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group has-select">
                  <label htmlFor="semester">Semester</label>
                  <select
                    id="semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Semester</option>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <motion.button
                  type="submit"
                  className="add-btn"
                  disabled={loading || !calculatedCredit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? 'Adding...' : '+ Add Subject'}
                </motion.button>
              </div>
            </form>

            {/* Recently Added Subjects */}
            <div className="recent-subjects-section">
              <h2 className="recent-title">Recently Added Subjects</h2>
              {recentSubjects.length > 0 ? (
                <div className="recent-subjects-list">
                  {recentSubjects.map((subject, index) => (
                    <motion.div
                      key={subject._id}
                      className="recent-subject-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="subject-icon-small">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                        </svg>
                      </div>
                      <div className="subject-info">
                        <div className="subject-name-text">{subject.subjectName}</div>
                        <div className="subject-meta-text">
                          {subject.subjectCode} • {subject.credits} Credits
                        </div>
                      </div>
                      <div className="subject-grade-badge" data-grade={getGradeColor(subject.grade)}>
                        {subject.grade}
                      </div>
                      <div className="subject-semester-text">
                        {getSemesterName(subject.year, subject.semester)}
                      </div>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteRecent(subject._id)}
                        title="Delete subject"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="empty-recent">No subjects added yet</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SubjectForm;
