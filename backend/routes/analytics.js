const express = require('express');
const Subject = require('../models/Subject');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const gradeToPoints = {
  'A+': 4.0,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'F': 0.0
};

// Get Degree Progress
router.get('/degree-progress', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const subjects = await Subject.find({ user: req.user._id });
    
    const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
    const degreeTotalCredits = user.degreeTotalCredits || 120;
    const percentage = degreeTotalCredits > 0 ? (totalCredits / degreeTotalCredits) * 100 : 0;

    res.json({
      completedCredits: totalCredits,
      totalCredits: degreeTotalCredits,
      percentage: parseFloat(percentage.toFixed(2)),
      remainingCredits: Math.max(0, degreeTotalCredits - totalCredits),
      degreeName: user.degreeName || 'Computer Science'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching degree progress', error: error.message });
  }
});

// Update Degree Total Credits and Degree Name
router.put('/degree-progress', auth, async (req, res) => {
  try {
    const { totalCredits, degreeName } = req.body;
    
    if (totalCredits && (totalCredits < 1 || !Number.isInteger(totalCredits))) {
      return res.status(400).json({ message: 'Valid total credits required (minimum 1)' });
    }

    const user = await User.findById(req.user._id);
    
    if (totalCredits !== undefined) {
      user.degreeTotalCredits = totalCredits;
    }
    
    if (degreeName !== undefined && degreeName.trim()) {
      user.degreeName = degreeName.trim();
    }
    
    await user.save();

    res.json({ 
      message: 'Degree information updated', 
      degreeTotalCredits: user.degreeTotalCredits,
      degreeName: user.degreeName
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating degree progress', error: error.message });
  }
});

// Get Semester GPA History
router.get('/semester-history', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id }).sort({ year: 1, semester: 1 });

    const semesterMap = new Map();
    
    subjects.forEach(subject => {
      const key = `Year ${subject.year} Sem ${subject.semester}`;
      if (!semesterMap.has(key)) {
        semesterMap.set(key, { credits: 0, points: 0, subjects: [] });
      }
      const semester = semesterMap.get(key);
      semester.credits += subject.credits;
      semester.points += gradeToPoints[subject.grade] * subject.credits;
      semester.subjects.push(subject);
    });

    const history = Array.from(semesterMap.entries()).map(([label, data]) => ({
      label,
      gpa: data.credits > 0 ? parseFloat((data.points / data.credits).toFixed(2)) : 0,
      credits: data.credits,
      subjectCount: data.subjects.length,
      year: parseInt(label.split(' ')[1]),
      semester: parseInt(label.split(' ')[3])
    })).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.semester - b.semester;
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching semester history', error: error.message });
  }
});

// Get Best and Worst Subjects
router.get('/subject-performance', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id });

    const subjectsWithPoints = subjects.map(subject => ({
      ...subject.toObject(),
      points: gradeToPoints[subject.grade] || 0
    }));

    const sorted = subjectsWithPoints.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      return b.credits - a.credits;
    });

    const best = sorted.slice(0, 5);
    const worst = sorted.slice(-5).reverse();

    res.json({ best, worst });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subject performance', error: error.message });
  }
});

// Target GPA Planner
router.post('/target-gpa', auth, async (req, res) => {
  try {
    const { targetGPA, futureCredits } = req.body;
    if (!targetGPA || targetGPA < 0 || targetGPA > 4.0) {
      return res.status(400).json({ message: 'Valid target GPA required (0-4.0)' });
    }

    const user = await User.findById(req.user._id);
    const subjects = await Subject.find({ user: req.user._id });

    // ---------- Current GPA ----------
    const completedCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
    const completedPoints = subjects.reduce((sum, s) => sum + (gradeToPoints[s.grade] || 0) * s.credits, 0);
    const currentGPA = completedCredits > 0 ? parseFloat((completedPoints / completedCredits).toFixed(2)) : 0;

    // ---------- Future credits ----------
    const totalDegreeCredits = user.degreeTotalCredits || 120;
    const remainingCredits = Math.max(0, totalDegreeCredits - completedCredits);
    const plannedFutureCredits = futureCredits ? parseInt(futureCredits, 10) : remainingCredits;

    // Validation
    if (futureCredits && futureCredits > remainingCredits) {
      return res.status(400).json({
        message: `Future credits (${futureCredits}) cannot exceed remaining credits (${remainingCredits})`
      });
    }
    if (plannedFutureCredits <= 0) {
      return res.json({
        currentGPA,
        targetGPA,
        requiredGPA: null,
        minGradeRequired: null,
        subjectsNeeded: 0,
        achievable: true,
        message: 'Degree already completed'
      });
    }

    // ---------- Core formula ----------
    const futureGPARequired =
      (targetGPA * (completedCredits + plannedFutureCredits) - currentGPA * completedCredits) /
      plannedFutureCredits;

    // ---------- Achievable? ----------
    if (futureGPARequired > 4.0) {
      return res.json({
        currentGPA,
        completedCredits,
        targetGPA,
        futureCredits: plannedFutureCredits,
        remainingCredits,
        requiredGPA: parseFloat(futureGPARequired.toFixed(2)),
        minGradeRequired: null,
        estimatedSubjects: Math.ceil(plannedFutureCredits / 3),
        achievable: false,
        message: 'Target GPA not achievable – required GPA exceeds 4.0'
      });
    }

    // ---------- Already exceeding target ----------
    if (futureGPARequired <= 0) {
      const estimatedSubjects = Math.ceil(plannedFutureCredits / 3);
      return res.json({
        currentGPA,
        completedCredits,
        targetGPA,
        futureCredits: plannedFutureCredits,
        remainingCredits,
        requiredGPA: 0,
        minGradeRequired: 'F',
        estimatedSubjects,
        achievable: true,
        message: 'You already exceed this target GPA! Any grade will work.'
      });
    }

    // ---------- Determine minimum grade (CORRECTED LOGIC) ----------
    const gradeScale = [
      { grade: 'A+', value: 4.0 },
      { grade: 'A', value: 4.0 },
      { grade: 'A-', value: 3.7 },
      { grade: 'B+', value: 3.3 },
      { grade: 'B', value: 3.0 },
      { grade: 'B-', value: 2.7 },
      { grade: 'C+', value: 2.3 },
      { grade: 'C', value: 2.0 },
      { grade: 'C-', value: 1.7 },
      { grade: 'D+', value: 1.3 },
      { grade: 'D', value: 1.0 },
      { grade: 'F', value: 0.0 }
    ];

    let minGradeRequired = 'F'; // default fallback

    // Iterate from highest to lowest grade
    for (let i = 0; i < gradeScale.length; i++) {
      if (gradeScale[i].value >= futureGPARequired) {
        minGradeRequired = gradeScale[i].grade;
        // keep going – we want the *lowest* grade that still satisfies
      } else {
        break; // all remaining grades are lower
      }
    }

    // ---------- Estimated subjects ----------
    const averageCredits = 3;
    const estimatedSubjects = Math.ceil(plannedFutureCredits / averageCredits);

    const priorityMessage = `Focus on achieving at least ${minGradeRequired} in ${estimatedSubjects} future subject${estimatedSubjects > 1 ? 's' : ''}. Prioritize high-credit courses for maximum GPA impact.`;

    // ---------- Response ----------
    res.json({
      currentGPA,
      completedCredits,
      targetGPA,
      futureCredits: plannedFutureCredits,
      remainingCredits,
      requiredGPA: parseFloat(futureGPARequired.toFixed(2)),
      minGradeRequired,
      estimatedSubjects,
      achievable: true,
      priorityMessage
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating target GPA', error: error.message });
  }
});

// Get Analytics Summary
router.get('/summary', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const subjects = await Subject.find({ user: req.user._id });

    const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
    const totalPoints = subjects.reduce((sum, s) => sum + (gradeToPoints[s.grade] || 0) * s.credits, 0);
    const overallGPA = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;

    // Group by semester
    const semesterStats = {};
    subjects.forEach(subject => {
      const key = `Y${subject.year}S${subject.semester}`;
      if (!semesterStats[key]) {
        semesterStats[key] = { credits: 0, points: 0, count: 0 };
      }
      semesterStats[key].credits += subject.credits;
      semesterStats[key].points += gradeToPoints[subject.grade] * subject.credits;
      semesterStats[key].count += 1;
    });

    const semesterGPAs = Object.keys(semesterStats).map(key => {
      const stats = semesterStats[key];
      return {
        semester: key,
        gpa: stats.credits > 0 ? parseFloat((stats.points / stats.credits).toFixed(2)) : 0,
        credits: stats.credits,
        subjects: stats.count
      };
    });

    res.json({
      overallGPA,
      totalCredits,
      totalSubjects: subjects.length,
      degreeTotalCredits: user.degreeTotalCredits || 120,
      semesterGPAs,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics summary', error: error.message });
  }
});

// Get Credit Categories
router.get('/credit-categories', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const creditCategories = user.creditCategories || {
      coreSubjects: 24,
      majorRequirements: 84,
      electives: 24,
      generalEducation: 12
    };
    
    res.json(creditCategories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching credit categories', error: error.message });
  }
});

// Update Credit Categories
router.put('/credit-categories', auth, async (req, res) => {
  try {
    const { coreSubjects, majorRequirements, electives, generalEducation } = req.body;
    
    if (coreSubjects === undefined || majorRequirements === undefined || 
        electives === undefined || generalEducation === undefined) {
      return res.status(400).json({ message: 'All credit categories are required' });
    }
    
    if (coreSubjects < 0 || majorRequirements < 0 || electives < 0 || generalEducation < 0) {
      return res.status(400).json({ message: 'Credit values must be non-negative' });
    }
    
    const user = await User.findById(req.user._id);
    user.creditCategories = {
      coreSubjects: parseInt(coreSubjects),
      majorRequirements: parseInt(majorRequirements),
      electives: parseInt(electives),
      generalEducation: parseInt(generalEducation)
    };
    
    await user.save();
    
    res.json({ 
      message: 'Credit categories updated successfully',
      creditCategories: user.creditCategories
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating credit categories', error: error.message });
  }
});

module.exports = router;


