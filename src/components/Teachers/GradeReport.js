import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Calendar, Download, Printer, X } from 'lucide-react';
import { db } from '../Universal/firebase';
import * as XLSX from 'xlsx';

const GradeReport = ({ isOpen, onClose, classId }) => {
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('');
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [gradeData, setGradeData] = useState({});

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  useEffect(() => {
    if (isOpen) {
      fetchGradeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, classId, startDate, endDate]);

  const extractTimestamp = assignmentId => {
    const parts = assignmentId.split('+');
    return parts.length >= 2 ? parseInt(parts[1]) : 0;
  };
  const isAssignmentInDateRange = assignmentId => {
    const timestamp = extractTimestamp(assignmentId);
    const date = new Date(timestamp);
    
    if (!startDate && !endDate) return true;
    
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date(8640000000000000); // Max date
    
    return date >= start && date <= end;
  };
  const fetchGradeData = async () => {
    setLoading(true);
    try {
      // Fetch class document
      const classRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classRef);
      if (!classDoc.exists()) {
        console.error('Class document does not exist');
        return;
      }
      const classData = classDoc.data();
      setClassName(classData.className || 'Unnamed Class');
      const studentIds = classData.students || [];

      // Initialize a Map to collect unique assignments and their names
      const allAssignmentsMap = new Map();

      // Temporary storage for student data
      const tempStudents = [];
      const tempGradeData = {};

      // Fetch each student's data
      for (const studentId of studentIds) {
        const studentRef = doc(db, 'students', studentId);
        const studentDoc = await getDoc(studentRef);
        if (!studentDoc.exists()) {
          console.warn(`Student document with ID ${studentId} does not exist`);
          continue;
        }
        const student = studentDoc.data();

        // Filter assignments by date range and classId
        const filterAssignmentsByDateAndClass = assignments =>
          assignments.filter(id => 
            id.startsWith(`${classId}+`) && isAssignmentInDateRange(id)
          );

        const assignmentsToTake = filterAssignmentsByDateAndClass(student.assignmentsToTake || []);
        const assignmentsInProgress = filterAssignmentsByDateAndClass(student.assignmentsInProgress || []);
        const assignmentsPaused = filterAssignmentsByDateAndClass(student.assignmentsPaused || []);

        // Combine all assignments assigned to the student
        const studentAssignedAssignments = new Set([
          ...assignmentsToTake,
          ...assignmentsInProgress,
          ...assignmentsPaused,
        ]);

        // Fetch grades for the specified class
        const classGrades = student[`class_${classId}`]?.grades || {};

        // Filter grades by date range
        const filteredGrades = {};
        Object.entries(classGrades).forEach(([assignmentId, gradeData]) => {
          if (assignmentId.startsWith(`${classId}+`) && isAssignmentInDateRange(assignmentId)) {
            filteredGrades[assignmentId] = gradeData;
            if (!allAssignmentsMap.has(assignmentId)) {
              allAssignmentsMap.set(assignmentId, gradeData.assignmentName || `Assignment ${assignmentId}`);
            }
          }
        });

        // Store student info
        tempStudents.push({
          id: studentId,
          name: `${student.lastName}, ${student.firstName}`,
          email: student.email,
        });

        // Initialize grade data for the student
        tempGradeData[studentId] = {
          grades: filteredGrades,
          assignedAssignments: studentAssignedAssignments,
        };
      }

      // Convert allAssignmentsMap to an array and sort by timestamp
      const allAssignmentsArray = Array.from(allAssignmentsMap.entries())
        .map(([id, name]) => ({
          id,
          name,
          timestamp: extractTimestamp(id)
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      setStudents(tempStudents);
      setAssignments(allAssignmentsArray);
      setGradeData(tempGradeData);
    } catch (error) {
      console.error('Error fetching grade data:', error);
    } finally {
      setLoading(false);
    }
  };
  const isValidGrade = grade => {
    // Improved grade validation
    if (grade === undefined || grade === null || grade === 'X' || grade === 'NA') {
      return false;
    }
    const numericGrade = parseFloat(grade);
    return !isNaN(numericGrade) && numericGrade >= 0 && numericGrade <= 100;
  };

  const calculateStudentAverage = studentId => {
    const studentData = gradeData[studentId];
    if (!studentData) return 'N/A';

    const { grades } = studentData;
    let totalScore = 0;
    let totalAssignments = 0;

    // Loop through all assignments
    assignments.forEach(assignment => {
      const grade = grades[assignment.id]?.score;

      // Only count if it's a numeric grade (not X, NA, undefined, or null)
      if (isValidGrade(grade)) {
        const numericGrade = parseFloat(grade);
        totalScore += numericGrade;
        totalAssignments++;
      }
    });

    // Return N/A if no valid assignments
    if (totalAssignments === 0) return 'N/A';

    // Calculate average and round to 1 decimal place
    return (totalScore / totalAssignments).toFixed(1) + '%';
  };

  const calculateAssignmentAverage = assignmentId => {
    let totalScore = 0;
    let totalStudents = 0;

    students.forEach(student => {
      const grade = gradeData[student.id]?.grades[assignmentId]?.score;

      // Only count if it's a numeric grade
      if (isValidGrade(grade)) {
        const numericGrade = parseFloat(grade);
        totalScore += numericGrade;
        totalStudents++;
      }
    });

    if (totalStudents === 0) return 'N/A';
    return (totalScore / totalStudents).toFixed(1) + '%';
  };

  // Calculate letter grade based on percentage
  const getLetterGrade = percentage => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    // Create CSV headers
    const headers = ['Class Name', className, '', '']; // Including class name
    const assignmentNames = assignments.map(a => a.name);
    const headerRow = ['Student Name', 'Email', ...assignmentNames, 'Average', 'Grade'];

    let csv = [];
    csv.push(headers.join(','));
    csv.push(headerRow.join(','));

    // Populate student rows
    students.forEach(student => {
      const studentData = gradeData[student.id];
      const average = calculateStudentAverage(student.id);
      const letterGrade =
        average !== 'N/A' ? getLetterGrade(parseFloat(average)) : 'N/A';
      const row = [
        `"${student.name}"`,
        `"${student.email}"`,
        ...assignments.map(assignment => {
          if (studentData.assignedAssignments.has(assignment.id)) {
            const grade = studentData.grades[assignment.id]?.score;
            if (
              grade !== undefined &&
              grade !== null &&
              grade !== 'X' &&
              grade !== 'NA'
            ) {
              return `${grade.toFixed(1)}%`;
            } else if (grade === 'X' || grade === 'NA') {
              return `"${grade}"`;
            } else {
              return `"NA"`;
            }
          } else {
            // Check if a grade exists for this assignment
            const grade = studentData.grades[assignment.id]?.score;
            return grade !== undefined ? `"${grade.toFixed(1)}%"` : `"X"`;
          }
        }),
        average,
        letterGrade,
      ];
      csv.push(row.join(','));
    });

    // Add class averages
    const averageRow = [
      `"Class Average"`,
      `""`,
      ...assignments.map(a => calculateAssignmentAverage(a.id)),
      `""`,
      `""`,
    ];
    csv.push(averageRow.join(','));

    // Create and trigger CSV download
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grade-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportXLSX = () => {
    // Prepare worksheet data
    const worksheetData = [];

    // Add class name
    worksheetData.push(['Class Name', className, '', '']);

    // Add headers
    const headers = [
      'Student Name',
      'Email',
      ...assignments.map(a => a.name),
      'Average',
      'Grade',
    ];
    worksheetData.push(headers);

    // Add student rows
    students.forEach(student => {
      const studentData = gradeData[student.id];
      const average = calculateStudentAverage(student.id);
      const letterGrade =
        average !== 'N/A' ? getLetterGrade(parseFloat(average)) : 'N/A';
      const row = [
        student.name,
        student.email,
        ...assignments.map(assignment => {
          if (studentData.assignedAssignments.has(assignment.id)) {
            const grade = studentData.grades[assignment.id]?.score;
            if (
              grade !== undefined &&
              grade !== null &&
              grade !== 'X' &&
              grade !== 'NA'
            ) {
              return `${grade.toFixed(1)}%`;
            } else if (grade === 'X' || grade === 'NA') {
              return grade;
            } else {
              return 'NA';
            }
          } else {
            // Check if a grade exists for this assignment
            const grade = studentData.grades[assignment.id]?.score;
            return grade !== undefined ? `${grade.toFixed(1)}%` : 'X';
          }
        }),
        average,
        letterGrade,
      ];
      worksheetData.push(row);
    });

    // Add class averages
    const averageRow = [
      'Class Average',
      '',
      ...assignments.map(a => calculateAssignmentAverage(a.id)),
      '',
      '',
    ];
    worksheetData.push(averageRow);

    // Create worksheet and workbook
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Grade Report');
    XLSX.writeFile(workbook, 'grade-report.xlsx');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="grade-report-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="grade-report-header">
          <h2>Grade Report for {className}</h2>
          <div className="date-filter">
            <div className="date-input-group">
              <Calendar size={20} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="date-input"
                placeholder="Start Date"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="date-input"
                placeholder="End Date"
              />
            </div>
          </div>
          <div className="grade-report-buttons">
            <button onClick={handleExportCSV} className="export-button">
              <Download size={20} />
              Export CSV
            </button>
            <button onClick={handleExportXLSX} className="export-button">
              <Download size={20} />
              Export XLSX
            </button>
            <button onClick={handlePrint} className="export-button">
              <Printer size={20} />
              Print
            </button>
            <button onClick={onClose} className="export-button close-button">
              <X size={20} />
              Close
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading grade data...</div>
        ) : (
          <div className="grade-report-table-container">
            <table className="grade-report-table">
              <thead>
                <tr>
                  <th className="student-col">Student</th>
                  <th className="email-col">Email</th>
                  <th className="average-col">Average</th>
                  <th className="letter-grade-col">Grade</th>
                  {assignments.map(assignment => (
                    <th key={assignment.id} className="assignment-col">
                      {assignment.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(student => {
                  const average = calculateStudentAverage(student.id);
                  const letterGrade =
                    average !== 'N/A'
                      ? getLetterGrade(parseFloat(average))
                      : 'N/A';
                  return (
                    <tr key={student.id}>
                      <td className="student-col">{student.name}</td>
                      <td className="email-col">{student.email}</td>
                      <td className="average-col average-cell">{average}</td>
                      <td className="letter-grade-col letter-grade-cell">
                        {letterGrade}
                      </td>
                      {assignments.map(assignment => {
                        const studentData = gradeData[student.id];
                        if (
                          studentData.assignedAssignments.has(assignment.id)
                        ) {
                          const grade = studentData.grades[assignment.id]
                            ?.score;
                          let displayGrade;
                          let gradeColor;

                          if (
                            grade !== undefined &&
                            grade !== null &&
                            grade !== 'X' &&
                            grade !== 'NA'
                          ) {
                            displayGrade = `${grade.toFixed(1)}%`;
                            gradeColor =
                              grade >= 90
                                ? '#D3FFCC'
                                : grade >= 80
                                ? '#EDFFC1'
                                : grade >= 70
                                ? '#FFF4DC'
                                : grade >= 60
                                ? '#FFC6A8'
                                : '#FFCBCB';
                          } else if (grade === 'X' || grade === 'NA') {
                            displayGrade = grade;
                            gradeColor = '#F0F0F0'; // Neutral color for non-applicable grades
                          } else {
                            displayGrade = 'NA';
                            gradeColor = '#F0F0F0';
                          }

                          return (
                            <td
                              key={assignment.id}
                              className="assignment-cell"
                              style={{ backgroundColor: gradeColor }}
                            >
                              {displayGrade}
                            </td>
                          );
                        } else {
                          // Check if a grade exists for this assignment
                          const grade = studentData.grades[assignment.id]
                            ?.score;
                          let displayGrade;
                          let gradeColor;

                          if (
                            grade !== undefined &&
                            grade !== null &&
                            grade !== 'X' &&
                            grade !== 'NA'
                          ) {
                            displayGrade = `${grade.toFixed(1)}%`;
                            gradeColor =
                              grade >= 90
                                ? '#D3FFCC'
                                : grade >= 80
                                ? '#EDFFC1'
                                : grade >= 70
                                ? '#FFF4DC'
                                : grade >= 60
                                ? '#FFC6A8'
                                : '#FFCBCB';
                          } else if (grade === 'X' || grade === 'NA') {
                            displayGrade = grade;
                            gradeColor = '#F0F0F0'; // Neutral color for non-applicable grades
                          } else {
                            displayGrade = 'X';
                            gradeColor = '#F0F0F0'; // Neutral color for missing grades
                          }

                          return (
                            <td
                              key={assignment.id}
                              className="assignment-cell"
                              style={{ backgroundColor: gradeColor }}
                            >
                              {displayGrade}
                            </td>
                          );
                        }
                      })}
                    </tr>
                  );
                })}

                <tr className="class-average-row">
                  <td colSpan={4} className="class-average-label">
                    Class Average
                  </td>
                  {assignments.map(assignment => (
                    <td key={assignment.id} className="class-average-cell">
                      {calculateAssignmentAverage(assignment.id)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Styles */}
        <style jsx>{`
          /* Modal Overlay */


          
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow-y: auto;
            padding: 20px;
          }

          /* Modal Container */
          .grade-report-modal {
            background: white;
            padding: 20px;
            max-height: 90%;
            overflow-y: auto;
            border-radius: 8px;
            width: 90%;
            max-width: 1200px;
            position: relative;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          }

          /* Header */
          .grade-report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }

          .grade-report-header h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }

          /* Buttons */
          .grade-report-buttons {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 10px;
          }

          .export-button {
            background: #f0f0f0;
            border: none;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            cursor: pointer;
            border-radius: 4px;
            transition: background 0.3s;
          }

          .export-button:hover {
            background: #e0e0e0;
          }

          .close-button {
            background: transparent;
            padding: 8px 12px;
          }

          .close-button:hover {
            background: #f0f0f0;
          }

          /* Loading */
          .loading {
            text-align: center;
            font-size: 18px;
            color: #555;
            padding: 50px 0;
          }

          /* Table Container */
          .grade-report-table-container {
            overflow-x: auto;
          }

          /* Table Styles */
          .grade-report-table {
            width: 100%;
            border-collapse: collapse;
          }

          .grade-report-table th,
          .grade-report-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            white-space: nowrap;
          }

          .grade-report-table th {
            background-color: #f9f9f9;
            font-weight: 600;
          }

          /* Specific Column Widths */
          .student-col {
            width: 20%;
          }

          .email-col {
            width: 20%;
          }

          .average-col {
            width: 10%;
          }

          .letter-grade-col {
            width: 10%;
          }

          .assignment-col {
            width: auto;
          }

          /* Class Average Row */
          .class-average-row .class-average-label {
            font-weight: 600;
            background-color: #f9f9f9;
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .grade-report-header {
              flex-direction: column;
              align-items: flex-start;
            }

            .grade-report-buttons {
              justify-content: flex-start;
            }

            .grade-report-header h2 {
              margin-bottom: 10px;
            }

            .grade-report-buttons {
              flex-direction: column;
              align-items: flex-start;
            }

            .export-button {
              width: 100%;
              margin-bottom: 10px;
            }

            .grade-report-modal {
              width: 100%;
              height: 100%;
              max-width: none;
              border-radius: 0;
            }
          }

          /* Print Styles */
          @media print {
            @page {
              size: A5 landscape;
              margin: 10mm;
            }

            body * {
              visibility: hidden;
            }

            .modal-overlay {
              position: relative !important;
              display: block !important;
              margin: 0 auto !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              background: none !important;
              left: auto !important;
              right: auto !important;
              top: auto !important;
              transform: none !important;
            }

            .grade-report-modal {
              position: relative !important;
              display: block !important;
              margin: 0 auto !important;
              padding: 0.5cm !important;
              width: 100% !important;
              max-width: none !important;
              box-shadow: none !important;
              border: none !important;
              background: none !important;
              transform: none !important;
            }

            .grade-report-modal,
            .grade-report-modal * {
              visibility: visible;
            }

            .grade-report-table-container {
              width: 100% !important;
              margin: 0 auto !important;
              overflow: visible !important;
              display: block !important;
            }

            .grade-report-table {
              margin: 0 auto !important;
              width: 100% !important;
              font-size: 8pt !important;
              page-break-inside: avoid !important;
              table-layout: fixed !important;
            }

            .grade-report-header {
              text-align: center !important;
              margin-bottom: 10px !important;
              padding-bottom: 5px !important;
              display: block !important;
            }

            .grade-report-header h2 {
              text-align: center !important;
              width: 100% !important;
              font-size: 14pt !important;
              margin: 0 auto 0.5cm auto !important;
            }

            .grade-report-buttons {
              display: none !important;
            }

            .grade-report-table th,
            .grade-report-table td {
              padding: 4px !important;
              border: 0.5pt solid #000 !important;
              word-break: break-word !important;
              white-space: nowrap !important;
            }

            /* Adjust column widths for print */
            .student-col {
              width: 15% !important;
            }

            .email-col {
              width: 15% !important;
            }

            .average-col {
              width: 8% !important;
            }

            .letter-grade-col {
              width: 5% !important;
            }

            .assignment-col {
              width: auto !important;
            }

            /* Ensure no page breaks inside rows */
            .grade-report-table tr {
              page-break-inside: avoid !important;
            }

            /* Remove background colors for better printing */
            .grade-report-table td,
            .grade-report-table th {
              background-color: transparent !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Force backgrounds to print */
            .assignment-cell {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Prevent orphaned headers */
            thead {
              display: table-header-group !important;
            }

            /* Ensure last page doesn't break awkwardly */
            tbody {
              page-break-after: avoid !important;
            }

            /* Hide scrollbars when printing */
            ::-webkit-scrollbar {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default GradeReport;
