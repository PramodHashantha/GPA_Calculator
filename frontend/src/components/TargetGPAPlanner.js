import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import './TargetGPAPlanner.css';

const TargetGPAPlanner = () => {
  const [targetGPA, setTargetGPA] = useState(3.70);
  const [futureCredits, setFutureCredits] = useState('');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [academicData, setAcademicData] = useState(null);
  const [remainingCredits, setRemainingCredits] = useState(null);
  const toast = useToast();

  // Fetch academic data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progressResponse, gpaResponse] = await Promise.all([
          api.get('/analytics/degree-progress'),
          api.get('/subjects/gpa')
        ]);
        
        const remaining = progressResponse.data.remainingCredits || 0;
        setRemainingCredits(remaining);
        setFutureCredits(remaining > 0 ? Math.floor(remaining / 2) : '');
        
        // Calculate total quality points
        const completedCredits = progressResponse.data.completedCredits || 0;
        const currentGPA = gpaResponse.data.overallGPA || 0;
        const totalQualityPoints = currentGPA * completedCredits;
        
        setAcademicData({
          completedCredits,
          currentGPA,
          totalQualityPoints: parseFloat(totalQualityPoints.toFixed(1)),
          remainingCredits: remaining
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleFutureCreditsChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setFutureCredits('');
      return;
    }
    const credits = parseFloat(value);
    if (remainingCredits !== null && credits > remainingCredits) {
      setFutureCredits(remainingCredits);
      toast.warning(`Maximum ${remainingCredits} remaining credits available.`);
      return;
    }
    if (!isNaN(credits) && credits >= 1) {
      setFutureCredits(value);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const payload = {
        targetGPA: parseFloat(targetGPA) || 0,
        futureCredits: futureCredits ? parseFloat(futureCredits) : null
      };
      const response = await api.post('/analytics/target-gpa', payload);
      setPlan(response.data);
      if (response.data.remainingCredits !== undefined) {
        setRemainingCredits(response.data.remainingCredits);
      }
    } catch (error) {
      console.error('Error calculating target GPA:', error);
      toast.error(error.response?.data?.message || 'Failed to calculate target GPA plan');
    } finally {
      setLoading(false);
    }
  };

  // Calculate grade distribution needed
  const calculateGradeDistribution = () => {
    if (!plan || !plan.requiredGPA || plan.requiredGPA > 4.0 || plan.requiredGPA <= 0) return null;

    const requiredGPA = plan.requiredGPA;
    const futureCreditsPlanned = plan.futureCredits || 0;

    // Determine grade mix needed based on required GPA
    let gradeA = 0, gradeB = 0, gradeC = 0, belowC = 0;

    if (requiredGPA >= 4.0) {
      // Need all A+ or A
      gradeA = futureCreditsPlanned;
    } else if (requiredGPA >= 3.7) {
      // Mostly A with some A-
      gradeA = Math.ceil(futureCreditsPlanned * 0.85);
      gradeB = futureCreditsPlanned - gradeA;
    } else if (requiredGPA >= 3.5) {
      // Mix of A and B+
      gradeA = Math.ceil(futureCreditsPlanned * 0.7);
      gradeB = futureCreditsPlanned - gradeA;
    } else if (requiredGPA >= 3.3) {
      // Mix of A and B
      gradeA = Math.ceil(futureCreditsPlanned * 0.6);
      gradeB = futureCreditsPlanned - gradeA;
    } else if (requiredGPA >= 3.0) {
      // Mix of A and B
      gradeA = Math.ceil(futureCreditsPlanned * 0.5);
      gradeB = futureCreditsPlanned - gradeA;
    } else if (requiredGPA >= 2.5) {
      // Mix of B and C
      gradeB = Math.ceil(futureCreditsPlanned * 0.6);
      gradeC = futureCreditsPlanned - gradeB;
    } else if (requiredGPA >= 2.0) {
      // Mix of B and C
      gradeB = Math.ceil(futureCreditsPlanned * 0.4);
      gradeC = futureCreditsPlanned - gradeB;
    } else {
      gradeC = futureCreditsPlanned;
    }

    return { gradeA, gradeB, gradeC, belowC };
  };

  const getFeasibility = (requiredGPA) => {
    if (!requiredGPA || requiredGPA > 4.0) return { text: 'Impossible', color: '#ef4444' };
    if (requiredGPA >= 3.8) return { text: 'Challenging', color: '#f59e0b' };
    if (requiredGPA >= 3.5) return { text: 'Moderate', color: '#3b82f6' };
    return { text: 'Achievable', color: '#10b981' };
  };

  const gradeDist = calculateGradeDistribution();
  const feasibility = plan ? getFeasibility(plan.requiredGPA) : null;

  return (
    <div className="target-gpa-planner-new">
      {/* Header */}
      <div className="planner-new-header">
        <h1>Target GPA Planner</h1>
        <p>Set your target GPA and see what grades you need to achieve it</p>
      </div>

      {/* Two Column Cards */}
      <div className="planner-cards-container">
        {/* Left Card: Plan Your Target GPA */}
        <motion.div
          className="planner-card planner-card-left"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2>Plan Your Target GPA</h2>
          
          <div className="card-content-grid">
            {/* Current Academic Status */}
            <div className="status-column">
              <h3>Current Academic Status</h3>
              <div className="status-item">
                <span className="status-label">Completed Credits</span>
                <span className="status-value">{academicData?.completedCredits || 0}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Current GPA</span>
                <span className="status-value">{academicData?.currentGPA?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Total Quality Points</span>
                <span className="status-value">{academicData?.totalQualityPoints || '0.0'}</span>
              </div>
              <div className="status-item highlight-green">
                <span className="status-label">Remaining Credits</span>
                <span className="status-value">{academicData?.remainingCredits || 0}</span>
              </div>
            </div>

            {/* Set Your Goals */}
            <div className="goals-column">
              <h3>Set Your Goals</h3>
              <div className="input-group-new">
                <label htmlFor="targetGPA">Target GPA</label>
                <input
                  type="number"
                  id="targetGPA"
                  min="0"
                  max="4.0"
                  step="0.01"
                  value={targetGPA}
                  onChange={(e) => setTargetGPA(e.target.value)}
                  className="gpa-input"
                />
              </div>
              <div className="input-group-new">
                <label htmlFor="futureCredits">Credits to Use</label>
                <input
                  type="number"
                  id="futureCredits"
                  min="1"
                  max={remainingCredits || undefined}
                  step="1"
                  value={futureCredits}
                  onChange={handleFutureCreditsChange}
                  className="credits-input"
                />
                <small className="input-hint-new">
                  Maximum: {remainingCredits || 0} remaining credits
                </small>
              </div>
            </div>
          </div>

          <button
            className="calculate-btn-new"
            onClick={handleCalculate}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2"/>
              <path d="M8 6h8M8 10h8M8 14h4M12 18h4"/>
            </svg>
            Calculate Required GPA
          </button>
        </motion.div>

        {/* Right Card: GPA Calculation Summary */}
        <motion.div
          className="planner-card planner-card-right"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2>GPA Calculation Summary</h2>
          
          {plan ? (
            plan.achievable && plan.requiredGPA > 0 ? (
              <>
                <div className="required-gpa-box">
                  <div className="required-gpa-label">Required GPA</div>
                  <div className="required-gpa-value">{plan.requiredGPA.toFixed(2)}</div>
                  <div className="required-gpa-hint">For next {plan.futureCredits || 0} credits</div>
                </div>

                <div className="summary-list">
                  <div className="summary-item">
                    <span className="summary-label">Target GPA</span>
                    <span className="summary-value">{plan.targetGPA.toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Credits Planned</span>
                    <span className="summary-value">{plan.futureCredits || 0}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Feasibility</span>
                    <span className="summary-value" style={{ color: feasibility?.color }}>
                      {feasibility?.text}
                    </span>
                  </div>
                </div>
              </>
            ) : plan.achievable && plan.requiredGPA === 0 ? (
              <div className="exceeded-message">
                <p>✓ You already exceed this target GPA!</p>
                <p>Any grade will work for remaining courses.</p>
              </div>
            ) : (
              <div className="error-message-box">
                <p>⚠️ Target Not Achievable</p>
                <p>Required GPA ({plan.requiredGPA.toFixed(2)}) exceeds maximum possible (4.0)</p>
              </div>
            )
          ) : (
            <div className="empty-state">
              <p>Enter your target GPA and click "Calculate Required GPA" to see the summary.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Grade Distribution Section */}
      {plan && plan.achievable && plan.requiredGPA > 0 && gradeDist && (
        <motion.div
          className="grade-distribution-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2>Grade Distribution Needed</h2>
          
          <div className="grade-cards-container">
            <div className="grade-card grade-a">
              <div className="grade-circle">A</div>
              <div className="grade-info">
                <div className="grade-name">Grade A (4.0)</div>
                <div className="grade-credits">{gradeDist.gradeA} credits needed</div>
              </div>
            </div>

            <div className="grade-card grade-b">
              <div className="grade-circle">B</div>
              <div className="grade-info">
                <div className="grade-name">Grade B (3.0)</div>
                <div className="grade-credits">{gradeDist.gradeB} credits needed</div>
              </div>
            </div>

            <div className="grade-card grade-c">
              <div className="grade-circle">C</div>
              <div className="grade-info">
                <div className="grade-name">Grade C (2.0)</div>
                <div className="grade-credits">{gradeDist.gradeC} credits needed</div>
              </div>
            </div>

            <div className="grade-card grade-below">
              <div className="grade-circle">D</div>
              <div className="grade-info">
                <div className="grade-name">Below C</div>
                <div className="grade-credits">{gradeDist.belowC} credits allowed</div>
              </div>
            </div>
          </div>

          {/* Recommendation Box */}
          <div className="recommendation-box">
            <svg className="info-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            <div className="recommendation-text">
              <strong>Recommendation:</strong> To achieve your target GPA of {plan.targetGPA.toFixed(2)}, you need to maintain an average of {plan.requiredGPA.toFixed(2)} GPA across your next {plan.futureCredits || 0} credits. Focus on getting mostly {plan.minGradeRequired || 'A'} grades{plan.minGradeRequired && plan.minGradeRequired !== 'A+' && plan.minGradeRequired !== 'A' ? ` with occasional ${getNextLowerGrade(plan.minGradeRequired)} grades` : ''}.
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Helper function to get next lower grade for recommendation
const getNextLowerGrade = (currentGrade) => {
  const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
  const index = grades.indexOf(currentGrade);
  return index < grades.length - 1 ? grades[index + 1] : 'F';
};

export default TargetGPAPlanner;
