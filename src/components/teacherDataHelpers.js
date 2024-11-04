// src/utils/classDataHelpers.js
// src/utils/classDataHelpers.js
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './Universal/firebase';

const functionsInstance = getFunctions();

export const classDataHelpers = {
  // Update basic class data
  updateClassData: async (classId, className, classChoice , classCode) => {
    const updateClass = httpsCallable(functionsInstance, 'updateClassData');
    return updateClass({ classId, className, classChoice, classCode });
  },

  // Add assignment to class
  addAssignmentToClass: async (classId, assignmentId, assignmentName, format) => {
    const addAssignment = httpsCallable(functionsInstance, 'addAssignmentToClass');
    return addAssignment({ 
      classId, 
      assignmentId, 
      assignmentName,
      format 
    });
  },

  // Add draft to class
  addDraftToClass: async (classId, draftId, assignmentName, format) => {
    const addDraft = httpsCallable(functionsInstance, 'addDraftToClass');
    return addDraft({ 
      classId, 
      draftId, 
      assignmentName,
      format 
    });
  },

  // Update class participants
  updateClassParticipants: async (classId, participants) => {
    const updateParticipants = httpsCallable(functionsInstance, 'updateClassParticipants');
    return updateParticipants({ classId, participants });
  },

  // Move draft to published assignment
  moveDraftToAssignment: async (classId, draftId, assignmentId, assignmentName, format) => {
    const moveDraft = httpsCallable(functionsInstance, 'moveDraftToAssignment');
    return moveDraft({ 
      classId, 
      draftId, 
      assignmentId, 
      assignmentName,
      format 
    });
  }
};

// Helper function to get current user ID
export const getCurrentUserId = () => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user found');
  }
  return auth.currentUser.uid;
};

// Safe Class Update Function
export const safeClassUpdate = async (operation, data) => {
  try {
    const cloudFunction = httpsCallable(functionsInstance, operation);
    const response = await cloudFunction(data);
    return response;
  } catch (error) {
    console.error(`Error in ${operation}:`, error);
    throw error;
  }
};
