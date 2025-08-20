import { db } from '../../../Universal/firebase';
import { 
  doc, 
  deleteDoc, 
  writeBatch, 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  updateDoc
} from 'firebase/firestore';

const deleteAssignment = async (assignmentId, classId) => {
  const batch = writeBatch(db);

  try {
    // 1. Delete the assignment document
    const assignmentRef = doc(db, 'assignments', assignmentId);
    batch.delete(assignmentRef);

    // 2. Delete all grade documents for this assignment
    const gradesQuery = query(collection(db, 'grades'), where('assignmentId', '==', assignmentId));
    const gradesSnapshot = await getDocs(gradesQuery);
    gradesSnapshot.forEach((gradeDoc) => {
      batch.delete(gradeDoc.ref);
    });

    // 3. Delete all progress documents for this assignment
    const progressQuery = query(collection(db, 'assignments(progress)'), where('assignmentId', '==', assignmentId));
    const progressSnapshot = await getDocs(progressQuery);
    progressSnapshot.forEach((progressDoc) => {
      batch.delete(progressDoc.ref);
    });

    // 4. Update all student documents to remove this assignment
    const studentsQuery = query(collection(db, 'students'));
    const studentsSnapshot = await getDocs(studentsQuery);
    
    studentsSnapshot.forEach((studentDoc) => {
      const studentData = studentDoc.data();
      const updatedData = {
        assignmentsToTake: (studentData.assignmentsToTake || []).filter(id => id !== assignmentId),
        assignmentsTaken: (studentData.assignmentsTaken || []).filter(id => id !== assignmentId),
        assignmentsInProgress: (studentData.assignmentsInProgress || []).filter(id => id !== assignmentId),
      };
      batch.update(studentDoc.ref, updatedData);
    });

    // 5. Update the class document to remove this assignment
    const classRef = doc(db, 'classes', classId);
    const classDoc = await getDoc(classRef);
    if (classDoc.exists()) {
      const classData = classDoc.data();
      const updatedAssignments = (classData.assignments || []).filter(id => id !== assignmentId);
      batch.update(classRef, { assignments: updatedAssignments });
    }

    // Commit the batch
    await batch.commit();

    console.log("Assignment and all related data successfully deleted");
    return true;
  } catch (error) {
    console.error("Error deleting assignment:", error);
    throw error;
  }
};

export default deleteAssignment;