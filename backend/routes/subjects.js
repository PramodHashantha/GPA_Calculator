const express = require('express');
const Subject = require('../models/Subject');
const auth = require('../middleware/auth');

const router = express.Router();

// Grade to GPA points mapping
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

// Helper function to extract credit from subject code (last digit)
const extractCreditFromCode = (subjectCode) => {
  const lastChar = subjectCode.slice(-1);
  const credit = parseInt(lastChar);
  return isNaN(credit) ? null : credit;
};

// Add Subject
router.post('/add', auth, async (req, res) => {
  try {
    const { subjectCode, subjectName, caPercentage, grade, year, semester, attempts } = req.body;

    // Validation
    if (!subjectCode || !subjectName || !grade || !year || !semester) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Extract credit from subject code (last digit)
    let credits = extractCreditFromCode(subjectCode);
    if (credits === null) {
      return res.status(400).json({ message: 'Unable to extract credits from subject code' });
    }

    // Create subject
    const subject = new Subject({
      user: req.user._id,
      subjectCode: subjectCode.toUpperCase(),
      subjectName,
      credits,
      caPercentage: caPercentage !== undefined ? caPercentage : 0,
      grade: grade.toUpperCase(),
      year,
      semester,
      attempts: attempts || 1
    });

    await subject.save();

    res.status(201).json({
      message: 'Subject added successfully',
      subject
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding subject', error: error.message });
  }
});

// Get All Subjects
router.get('/', auth, async (req, res) => {
  try {
    const { year, semester } = req.query;
    const query = { user: req.user._id };
    
    if (year) query.year = parseInt(year);
    if (semester) query.semester = parseInt(semester);

    const subjects = await Subject.find(query).sort({ year: -1, semester: -1, createdAt: -1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects', error: error.message });
  }
});

// Get Subjects by Year and Semester
router.get('/results', auth, async (req, res) => {
  try {
    const { year, semester } = req.query;

    if (!year || !semester) {
      return res.status(400).json({ message: 'Year and semester are required' });
    }

    const subjects = await Subject.find({
      user: req.user._id,
      year: parseInt(year),
      semester: parseInt(semester)
    }).sort({ subjectCode: 1 });

    // Calculate GPA
    let totalPoints = 0;
    let totalCredits = 0;

    subjects.forEach(subject => {
      const points = gradeToPoints[subject.grade] || 0;
      totalPoints += points * subject.credits;
      totalCredits += subject.credits;
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

    res.json({
      subjects,
      gpa: parseFloat(gpa),
      totalCredits
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching results', error: error.message });
  }
});

// Calculate Overall GPA
router.get('/gpa', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id });

    let totalPoints = 0;
    let totalCredits = 0;

    subjects.forEach(subject => {
      const points = gradeToPoints[subject.grade] || 0;
      totalPoints += points * subject.credits;
      totalCredits += subject.credits;
    });

    const overallGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

    res.json({
      overallGPA: parseFloat(overallGPA),
      totalCredits,
      totalSubjects: subjects.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating GPA', error: error.message });
  }
});

// Update Subject
router.put('/:id', auth, async (req, res) => {
  try {
    const { subjectCode, subjectName, caPercentage, grade, year, semester, attempts } = req.body;

    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Extract credit from subject code if code changed
    if (subjectCode && subjectCode !== subject.subjectCode) {
      const credits = extractCreditFromCode(subjectCode);
      if (credits !== null) {
        subject.credits = credits;
      }
    }

    if (subjectCode) subject.subjectCode = subjectCode.toUpperCase();
    if (subjectName) subject.subjectName = subjectName;
    if (caPercentage !== undefined) subject.caPercentage = caPercentage;
    if (grade) subject.grade = grade.toUpperCase();
    if (year) subject.year = year;
    if (semester) subject.semester = semester;
    if (attempts) subject.attempts = attempts;

    await subject.save();

    res.json({
      message: 'Subject updated successfully',
      subject
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating subject', error: error.message });
  }
});

// Delete Subject
router.delete('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting subject', error: error.message });
  }
});

module.exports = router;

