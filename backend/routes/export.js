const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
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

// Export to PDF
router.get('/pdf', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const subjects = await Subject.find({ user: req.user._id }).sort({ year: 1, semester: 1, subjectCode: 1 });

    const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
    const totalPoints = subjects.reduce((sum, s) => sum + (gradeToPoints[s.grade] || 0) * s.credits, 0);
    const overallGPA = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
    const progressPercentage = user.degreeTotalCredits > 0 
      ? ((totalCredits / user.degreeTotalCredits) * 100).toFixed(1) 
      : 0;

    // Calculate semester GPAs
    const semesterGroups = {};
    subjects.forEach(subject => {
      const key = `Year ${subject.year} Semester ${subject.semester}`;
      if (!semesterGroups[key]) {
        semesterGroups[key] = [];
      }
      semesterGroups[key].push(subject);
    });

    const doc = new PDFDocument({ 
      margin: 50,
      size: 'LETTER',
      info: {
        Title: `GPA Academic Report - ${user.name}`,
        Author: 'GPA Calculator',
        Subject: 'Academic Transcript'
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="GPA_Report_${user.name.replace(/\s/g, '_')}.pdf"`);

    doc.pipe(res);

    // Professional Header with Colors
    doc.rect(0, 0, doc.page.width, 120)
       .fill('#1e40af')
       .fillColor('#ffffff');
    
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .text('ACADEMIC TRANSCRIPT', 50, 35, { align: 'center' });
    
    doc.fontSize(16)
       .font('Helvetica')
       .text(user.degreeName || 'Computer Science', 50, 70, { align: 'center' });
    
    doc.fontSize(12)
       .text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 95, { align: 'center' });
    
    doc.fillColor('#000000');
    doc.moveDown(2);

    // Student Information Box
    const infoY = 150;
    doc.rect(50, infoY, 495, 60)
       .stroke('#e5e7eb')
       .fill('#f9fafb');
    
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937').text('Student Information', 60, infoY + 10);
    doc.fontSize(11).font('Helvetica').fillColor('#4b5563');
    const nameText = user.name || 'Not provided';
    const emailText = user.email || 'Not provided';
    const degreeText = user.degreeName || 'Computer Science';
    
    doc.text(`Name: ${nameText}`, 60, infoY + 32);
    doc.text(`Email: ${emailText}`, 280, infoY + 32);
    doc.text(`Degree: ${degreeText}`, 60, infoY + 48);

    doc.fillColor('#000000');
    doc.moveTo(50, 220).lineTo(545, 220).stroke('#e5e7eb');
    doc.y = 240;

    // Academic Summary with visual enhancement
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e40af').text('Academic Summary', 50);
    doc.moveDown(0.5);
    
    const summaryY = doc.y;
    const summaryHeight = 100;
    
    // Summary box with border
    doc.rect(50, summaryY, 495, summaryHeight)
       .stroke('#1e40af')
       .lineWidth(2)
       .fill('#eff6ff');
    
    // GPA Display (Large and prominent)
    const gpaDisplay = overallGPA.toFixed(2);
    doc.fontSize(36).font('Helvetica-Bold').fillColor('#1e40af')
       .text(gpaDisplay, 60, summaryY + 10);
    
    doc.fontSize(14).font('Helvetica').fillColor('#64748b')
       .text('Overall GPA', 60, summaryY + 50);
    
    // Progress Bar Visualization
    const progressBarWidth = 200;
    const progressBarHeight = 12;
    const progressBarX = 350;
    const progressBarY = summaryY + 20;
    
    // Progress bar background
    doc.rect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
       .fill('#e5e7eb')
       .stroke('#d1d5db');
    
    // Progress bar fill
    const fillWidth = (progressPercentage / 100) * progressBarWidth;
    const progressColor = parseFloat(progressPercentage) >= 75 ? '#059669' 
      : parseFloat(progressPercentage) >= 50 ? '#3b82f6'
      : '#f59e0b';
    
    doc.rect(progressBarX, progressBarY, fillWidth, progressBarHeight)
       .fill(progressColor);
    
    // Progress text
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937')
       .text(`${progressPercentage}% Complete`, progressBarX, progressBarY + 18);
    
    // Details section
    doc.fontSize(11).font('Helvetica').fillColor('#374151');
    doc.text(`Credits: ${totalCredits} / ${user.degreeTotalCredits || 120}`, 60, summaryY + 70);
    doc.text(`Subjects: ${subjects.length}`, 60, summaryY + 85);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, 350, summaryY + 85);

    doc.fillColor('#000000');
    doc.y = summaryY + 100;

    // Semester-wise Breakdown
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e40af').text('Semester-wise Performance', 50);
    doc.moveDown(1);

    Object.keys(semesterGroups).sort().forEach((semester, semIndex) => {
      const semesterSubjects = semesterGroups[semester];
      let semesterCredits = 0;
      let semesterPoints = 0;

      semesterSubjects.forEach(subject => {
        semesterCredits += subject.credits;
        semesterPoints += (gradeToPoints[subject.grade] || 0) * subject.credits;
      });

      const semesterGPA = semesterCredits > 0 ? (semesterPoints / semesterCredits).toFixed(2) : 0;

      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
        doc.y = 50;
      }

      // Semester Header
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937')
         .text(semester, 50);
      doc.fontSize(11).font('Helvetica').fillColor('#059669')
         .text(`Semester GPA: ${semesterGPA} | Credits: ${semesterCredits}`, 50, doc.y);
      doc.moveDown(0.8);

      // Table Header with better formatting
      const tableY = doc.y;
      const tableWidth = 495;
      const colWidths = {
        code: 90,
        name: 250,
        credits: 60,
        grade: 60,
        points: 65
      };
      
      // Header background
      doc.rect(50, tableY, tableWidth, 28)
         .fill('#1e40af');
      
      // Header text
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff');
      const headerY = tableY + 9;
      doc.text('Subject Code', 55, headerY);
      doc.text('Subject Name', 150, headerY);
      doc.text('Credits', 410, headerY);
      doc.text('Grade', 475, headerY);
      doc.text('Points', 520, headerY);

      // Header border
      doc.rect(50, tableY, tableWidth, 28)
         .stroke('#1e40af');
      
      doc.fillColor('#000000');
      doc.y = tableY + 32;

      // Table Rows with proper borders and spacing
      semesterSubjects.forEach((subject, index) => {
        if (doc.y > 730) {
          doc.addPage();
          doc.y = 50;
        }

        const rowY = doc.y;
        const rowHeight = 24;
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
        
        // Row background
        doc.rect(50, rowY, tableWidth, rowHeight)
           .fill(bgColor);
        
        // Row border
        doc.rect(50, rowY, tableWidth, rowHeight)
           .stroke('#e5e7eb');
        
        doc.fontSize(10).font('Helvetica').fillColor('#1f2937');
        const textY = rowY + 7;
        
        // Subject Code
        doc.text(subject.subjectCode || 'N/A', 55, textY, { width: colWidths.code - 10 });
        
        // Subject Name (with proper text wrapping)
        const name = subject.subjectName || 'N/A';
        const maxNameWidth = colWidths.name;
        doc.text(name, 150, textY, { 
          width: maxNameWidth,
          ellipsis: true
        });
        
        // Credits
        doc.text(subject.credits ? subject.credits.toString() : '0', 410, textY, { 
          width: colWidths.credits - 5,
          align: 'center'
        });
        
        // Grade with color coding
        const gradePoints = gradeToPoints[subject.grade] || 0;
        let gradeColor = '#059669'; // Green
        if (gradePoints >= 3.7) gradeColor = '#059669';
        else if (gradePoints >= 3.0) gradeColor = '#3b82f6';
        else if (gradePoints >= 2.0) gradeColor = '#f59e0b';
        else gradeColor = '#ef4444';
        
        doc.font('Helvetica-Bold').fillColor(gradeColor);
        doc.text(subject.grade || 'N/A', 475, textY, { 
          width: colWidths.grade - 5,
          align: 'center'
        });
        
        // Points
        doc.font('Helvetica').fillColor('#374151');
        doc.text(gradePoints.toFixed(1), 520, textY, { 
          width: colWidths.points - 5,
          align: 'center'
        });

        doc.y = rowY + rowHeight;
      });

      // Add spacing after semester
      doc.moveDown(0.8);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb').lineWidth(1);
      doc.moveDown(1.2);
    });

    // Add footer to current page before ending (no recursive events)
    // Store current position
    const finalY = doc.y;
    
    // Add footer at bottom of last page only
    if (doc.page) {
      doc.fontSize(8).font('Helvetica').fillColor('#6b7280');
      doc.text('This is an unofficial transcript. For official transcripts, please contact your academic institution.',
               50, doc.page.height - 40, { align: 'center', width: 495 });
    }
    
    // End the document
    doc.end();
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

// Export to Excel
router.get('/excel', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const subjects = await Subject.find({ user: req.user._id }).sort({ year: 1, semester: 1, subjectCode: 1 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GPA Calculator';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Academic Summary');
    summarySheet.views = [{ state: 'frozen', ySplit: 6 }];

    // Professional Header
    summarySheet.mergeCells('A1:H1');
    summarySheet.getCell('A1').value = 'ACADEMIC TRANSCRIPT';
    summarySheet.getCell('A1').font = { size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1e40af' }
    };
    summarySheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    summarySheet.getRow(1).height = 35;

    summarySheet.mergeCells('A2:H2');
    summarySheet.getCell('A2').value = user.degreeName || 'Computer Science';
    summarySheet.getCell('A2').font = { size: 14, color: { argb: 'FF1e40af' } };
    summarySheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(2).height = 25;

    // Student Information
    summarySheet.getCell('A4').value = 'Student Name:';
    summarySheet.getCell('B4').value = user.name;
    summarySheet.getCell('A5').value = 'Email:';
    summarySheet.getCell('B5').value = user.email;
    summarySheet.getCell('A6').value = 'Report Generated:';
    summarySheet.getCell('B6').value = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Calculate overall GPA
    const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
    const totalPoints = subjects.reduce((sum, s) => sum + (gradeToPoints[s.grade] || 0) * s.credits, 0);
    const overallGPA = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
    const progressPercentage = user.degreeTotalCredits > 0 
      ? ((totalCredits / user.degreeTotalCredits) * 100).toFixed(1) 
      : 0;

    // Academic Summary Box
    summarySheet.mergeCells('D4:H4');
    summarySheet.getCell('D4').value = 'ACADEMIC SUMMARY';
    summarySheet.getCell('D4').font = { size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getCell('D4').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1e40af' }
    };
    summarySheet.getCell('D4').alignment = { horizontal: 'center', vertical: 'middle' };

    summarySheet.getCell('D5').value = 'Overall GPA:';
    summarySheet.getCell('E5').value = overallGPA.toFixed(2);
    summarySheet.getCell('E5').font = { size: 14, bold: true, color: { argb: 'FF059669' } };
    summarySheet.getCell('D6').value = `Credits: ${totalCredits} / ${user.degreeTotalCredits || 120}`;
    summarySheet.getCell('E6').value = `Progress: ${progressPercentage}%`;
    summarySheet.getCell('D7').value = `Total Subjects: ${subjects.length}`;

    // Table Headers
    const headerRow = summarySheet.addRow([
      'Year',
      'Semester',
      'Subject Code',
      'Subject Name',
      'Credits',
      'CA %',
      'Grade',
      'Grade Points'
    ]);

    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1e40af' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.height = 25;

    // Add subjects with conditional formatting
    subjects.forEach(subject => {
      const row = summarySheet.addRow([
        subject.year,
        subject.semester,
        subject.subjectCode,
        subject.subjectName,
        subject.credits,
        subject.caPercentage.toFixed(2),
        subject.grade,
        gradeToPoints[subject.grade] || 0
      ]);

      // Color code grades
      const gradePoints = gradeToPoints[subject.grade] || 0;
      let gradeColor = 'FFef4444'; // Red for low grades
      if (gradePoints >= 3.7) gradeColor = 'FF059669'; // Green
      else if (gradePoints >= 3.0) gradeColor = 'FF3b82f6'; // Blue
      else if (gradePoints >= 2.0) gradeColor = 'FFf59e0b'; // Orange

      row.getCell(7).font = { bold: true, color: { argb: gradeColor } };
      row.getCell(8).font = { bold: true };
      row.alignment = { vertical: 'middle' };
      row.height = 20;
    });

    // Format columns
    summarySheet.columns = [
      { width: 8 },   // Year
      { width: 10 },  // Semester
      { width: 15 }, // Code
      { width: 45 }, // Name
      { width: 10 }, // Credits
      { width: 10 }, // CA%
      { width: 10 }, // Grade
      { width: 12 }  // Points
    ];

    // Add borders to data area
    const dataStartRow = 8;
    const dataEndRow = dataStartRow + subjects.length;
    for (let row = dataStartRow; row <= dataEndRow; row++) {
      for (let col = 1; col <= 8; col++) {
        const cell = summarySheet.getCell(row, col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFe5e7eb' } },
          left: { style: 'thin', color: { argb: 'FFe5e7eb' } },
          bottom: { style: 'thin', color: { argb: 'FFe5e7eb' } },
          right: { style: 'thin', color: { argb: 'FFe5e7eb' } }
        };
      }
    }

    // Semester-wise Sheet
    const semesterSheet = workbook.addWorksheet('Semester Breakdown');
    
    // Group by semester
    const semesterGroups = {};
    subjects.forEach(subject => {
      const key = `Year ${subject.year} - Semester ${subject.semester}`;
      if (!semesterGroups[key]) {
        semesterGroups[key] = [];
      }
      semesterGroups[key].push(subject);
    });

    let currentRow = 1;
    Object.keys(semesterGroups).sort().forEach(semester => {
      const semesterSubjects = semesterGroups[semester];
      let semesterCredits = 0;
      let semesterPoints = 0;

      semesterSubjects.forEach(subject => {
        semesterCredits += subject.credits;
        semesterPoints += (gradeToPoints[subject.grade] || 0) * subject.credits;
      });

      const semesterGPA = semesterCredits > 0 ? (semesterPoints / semesterCredits).toFixed(2) : 0;

      // Semester Header
      semesterSheet.mergeCells(`A${currentRow}:H${currentRow}`);
      semesterSheet.getCell(`A${currentRow}`).value = semester;
      semesterSheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      semesterSheet.getCell(`A${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1e40af' }
      };
      semesterSheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      semesterSheet.getRow(currentRow).height = 25;
      currentRow++;

      // Semester GPA
      semesterSheet.getCell(`A${currentRow}`).value = `Semester GPA: ${semesterGPA} | Credits: ${semesterCredits}`;
      semesterSheet.getCell(`A${currentRow}`).font = { size: 11, bold: true, color: { argb: 'FF059669' } };
      currentRow++;

      // Headers
      const headerRow = semesterSheet.addRow([
        'Subject Code',
        'Subject Name',
        'Credits',
        'CA %',
        'Grade',
        'Grade Points',
        'Quality Points',
        'Attempt'
      ]);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF64748b' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      currentRow++;

      // Subjects
      semesterSubjects.forEach(subject => {
        const gradePoints = gradeToPoints[subject.grade] || 0;
        const qualityPoints = gradePoints * subject.credits;
        const row = semesterSheet.addRow([
          subject.subjectCode,
          subject.subjectName,
          subject.credits,
          subject.caPercentage.toFixed(2),
          subject.grade,
          gradePoints.toFixed(1),
          qualityPoints.toFixed(1),
          subject.attempts
        ]);

        row.getCell(5).font = { bold: true };
        row.getCell(7).font = { bold: true };
        currentRow++;
      });

      currentRow += 2; // Space between semesters
    });

    // Format semester sheet
    semesterSheet.columns = [
      { width: 15 }, { width: 45 }, { width: 10 }, { width: 10 },
      { width: 10 }, { width: 12 }, { width: 12 }, { width: 10 }
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="GPA_Report_${user.name.replace(/\s/g, '_')}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel Generation Error:', error);
    res.status(500).json({ message: 'Error generating Excel', error: error.message });
  }
});

// Generate shareable link (returns shareable data)
router.get('/share', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const subjects = await Subject.find({ user: req.user._id }).sort({ year: 1, semester: 1 });

    const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
    const totalPoints = subjects.reduce((sum, s) => sum + (gradeToPoints[s.grade] || 0) * s.credits, 0);
    const overallGPA = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
    const progressPercentage = user.degreeTotalCredits > 0 
      ? ((totalCredits / user.degreeTotalCredits) * 100).toFixed(1) 
      : 0;

    // Calculate semester GPAs
    const semesterGroups = {};
    subjects.forEach(subject => {
      const key = `Year ${subject.year} - Semester ${subject.semester}`;
      if (!semesterGroups[key]) {
        semesterGroups[key] = { subjects: [], credits: 0, points: 0 };
      }
      semesterGroups[key].subjects.push(subject);
      semesterGroups[key].credits += subject.credits;
      semesterGroups[key].points += (gradeToPoints[subject.grade] || 0) * subject.credits;
    });

    const semesterBreakdown = Object.keys(semesterGroups).map(key => ({
      semester: key,
      credits: semesterGroups[key].credits,
      gpa: semesterGroups[key].credits > 0 
        ? (semesterGroups[key].points / semesterGroups[key].credits).toFixed(2) 
        : 0,
      subjectsCount: semesterGroups[key].subjects.length
    }));

    const shareData = {
      studentName: user.name,
      email: user.email,
      degreeName: user.degreeName || 'Computer Science',
      overallGPA: overallGPA.toFixed(2),
      totalCredits,
      totalSubjects: subjects.length,
      degreeTotalCredits: user.degreeTotalCredits || 120,
      progressPercentage,
      semesterBreakdown,
      generatedAt: new Date().toISOString(),
      summary: `${user.name} - ${user.degreeName || 'Computer Science'} | GPA: ${overallGPA.toFixed(2)} | Credits: ${totalCredits}/${user.degreeTotalCredits || 120} (${progressPercentage}%)`
    };

    // Create a unique share token (simple implementation - in production, use crypto)
    const shareToken = Buffer.from(`${user._id}-${Date.now()}`).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

    res.json({
      shareLink: `${req.protocol}://${req.get('host')}/share/${shareToken}`,
      shareToken,
      shareData
    });
  } catch (error) {
    console.error('Share Link Generation Error:', error);
    res.status(500).json({ message: 'Error generating share link', error: error.message });
  }
});

module.exports = router;

