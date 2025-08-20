import { db } from '../../Universal/firebase';
import { doc, getDoc, writeBatch, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';

// Function to handle class grouping logic during class creation
const handleClassGrouping = async (classData, teacherUID) => {
  try {
    const batch = writeBatch(db);
    const teacherRef = doc(db, 'teachers', teacherUID);
    const teacherDoc = await getDoc(teacherRef);

    if (!teacherDoc.exists()) {
      throw new Error('Teacher document not found');
    }

    const teacherData = teacherDoc.data();
    const classes = teacherData.classes || [];
    const classGroups = teacherData.classGroups || {};

    // Find matching classes with the same classChoice
    const matchingClasses = classes.filter(c => c.classChoice === classData.classChoice);
    const matchingClassIds = matchingClasses.map(c => c.classId);

    // Add new class to matching classes array
    matchingClassIds.push(classData.classId);

    // Update or create class group in teacher document
    if (matchingClassIds.length > 0) {
      batch.update(teacherRef, {
        [`classGroups.${classData.classChoice}`]: matchingClassIds
      });

      // Update each class document with grouped information
      for (const classId of matchingClassIds) {
        const classRef = doc(db, 'classes', classId);
        batch.update(classRef, {
          grouped: matchingClassIds.filter(id => id !== classId)
        });
      }
    }

    await batch.commit();
    return { success: true, groupedClasses: matchingClassIds };
  } catch (error) {
    console.error('Error in handleClassGrouping:', error);
    throw error;
  }
};

// Function to update existing classes with grouping information
const updateExistingClassGroups = async (teacherUID) => {
  try {
    const batch = writeBatch(db);
    const teacherRef = doc(db, 'teachers', teacherUID);
    const teacherDoc = await getDoc(teacherRef);

    if (!teacherDoc.exists()) {
      throw new Error('Teacher document not found');
    }

    const teacherData = teacherDoc.data();
    const classes = teacherData.classes || [];
    const classGroups = {};

    // Group classes by classChoice
    const groupedByChoice = classes.reduce((acc, curr) => {
      const choice = curr.classChoice;
      if (!acc[choice]) {
        acc[choice] = [];
      }
      acc[choice].push(curr.classId);
      return acc;
    }, {});

    // Update teacher document with class groups
    batch.update(teacherRef, {
      classGroups: groupedByChoice
    });

    // Update each class document with its grouped classes
    for (const [choice, classIds] of Object.entries(groupedByChoice)) {
      for (const classId of classIds) {
        const classRef = doc(db, 'classes', classId);
        batch.update(classRef, {
          grouped: classIds.filter(id => id !== classId)
        });
      }
    }

    await batch.commit();
    return { success: true, groupedByChoice };
  } catch (error) {
    console.error('Error in updateExistingClassGroups:', error);
    throw error;
  }
};

const createClassWithGrouping = async (classData, teacherUID) => {
    try {
      const classRef = doc(db, 'classes', classData.classId);
      const teacherRef = doc(db, 'teachers', teacherUID);
      
      const batch = writeBatch(db);
      
      // Set only the essential class data
      batch.set(classRef, {
        teacherUID,
        classId: classData.classId,
        period: classData.period,
        classChoice: classData.classChoice,
        classCode: classData.classCode
      });
      
      // Update teacher's classes array with minimal data
      batch.update(teacherRef, {
        classes: arrayUnion({
          classId: classData.classId,
          period: classData.period,
          classChoice: classData.classChoice,
          classCode: classData.classCode
        })
      });
      
      await batch.commit();
  
      // After class is created, handle grouping
      await handleClassGrouping(classData, teacherUID);
  
      return { success: true, classId: classData.classId };
    } catch (error) {
      console.error('Error in createClassWithGrouping:', error);
      throw error;
    }
  };

export { createClassWithGrouping, handleClassGrouping, updateExistingClassGroups };