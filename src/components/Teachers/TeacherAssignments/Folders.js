// Folders.js

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../Universal/firebase';
import { FolderPlus, SquarePlus, SquareX, SquareArrowLeft, Folder } from 'lucide-react';

function Folders({
  classId,
  folders,
  assignments,
  pastelColors,
  onFoldersUpdated,
  openFolderModal,
}) {
  const [showAddAssignmentsModal, setShowAddAssignmentsModal] = useState(false);
  const [selectedFolderIndex, setSelectedFolderIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const addAssignmentToFolder = async (assignment) => {
    if (selectedFolderIndex === null) return;

    try {
      const classDocRef = doc(db, 'classes', classId);

      const folder = folders[selectedFolderIndex];
      const currentAssignments = folder.assignments || [];

      if (!currentAssignments.includes(assignment.id)) {
        folder.assignments = [...currentAssignments, assignment.id];

        // Update the folders array in the class document
        folders[selectedFolderIndex] = folder;
        await updateDoc(classDocRef, { folders });

        onFoldersUpdated(folders);
      }
    } catch (error) {
      console.error('Error adding assignment to folder:', error);
    }
  };

  const renderAddAssignmentsModal = () => {
    if (!showAddAssignmentsModal) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(250, 250, 250, 0.95)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            width: '500px',
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '12px',
            position: 'relative',
            boxShadow: '0px 4px 10px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <button
              onClick={() => setShowAddAssignmentsModal(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginRight: '10px',
              }}
            >
              <SquareArrowLeft size={24} />
            </button>
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 8px 8px 35px',
                borderRadius: '20px',
                border: '1px solid #ccc',
                fontSize: '16px',
                outline: 'none',
              }}
            />
          </div>
          <div
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {assignments.length > 0 ? (
              assignments
                .filter(
                  (assignment) =>
                    (assignment.name || assignment.assignmentName)
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) &&
                    !folders[selectedFolderIndex]?.assignments.includes(
                      assignment.id
                    )
                )
                .map((assignment) => (
                  <div
                    key={assignment.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 15px',
                      borderRadius: '8px',
                      border: '1px solid #f0f0f0',
                      marginBottom: '10px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '18px',
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: '500',
                      }}
                    >
                      {assignment.name}
                    </span>
                    <button
                      onClick={() => addAssignmentToFolder(assignment)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <SquarePlus size={20} color="#7BE06A" />
                    </button>
                  </div>
                ))
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  color: '#666',
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: '18px',
                  marginTop: '40px',
                }}
              >
                No assignments available to add.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: '120px', marginLeft: '200px', padding: '20px' }}>
      {/* Folder List */}
      {folders.length > 0 ? (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {folders.map((folder, index) => (
            <li
            key={folder.id} // Use the folder's ID
            onClick={() => openFolderModal(folder)}
              style={{
                backgroundColor: '#fff',
                padding: '15px 20px',
                marginBottom: '10px',
                borderRadius: '8px',
                boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.3s, border-color 0.3s, box-shadow 0.3s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Folder
                  size={24}
                  color="#007BFF"
                  style={{ marginRight: '10px' }}
                />
                <span
                  style={{
                    fontSize: '18px',
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: '500',
                  }}
                >
                  {folder.name}
                </span>
              </div>
              <button
                style={{
                  backgroundColor: '#007BFF',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: "'Montserrat', sans-serif",
                }}
                onClick={() => openFolderModal(folder)}
              >
                View
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <h1 style={{ marginTop: '20px', fontWeight: '500' }}>
          No folders created yet.
        </h1>
      )}

      {/* Add Assignments Modal */}
      {renderAddAssignmentsModal()}
    </div>
  );
}

export default Folders;
