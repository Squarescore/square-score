// FolderModal.js
import React from 'react';
import { SquareArrowLeft, SquareX } from 'lucide-react';

function FolderModal({ folder, assignments, onClose }) {
  const folderAssignments = assignments.filter(assignment =>
    folder.assignments.includes(assignment.id)
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1001,
      }}
      onClick={onClose} // Close modal when clicking outside the content
    >
      <div
        style={{
          width: '600px',
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '12px',
          position: 'relative',
          boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: '600' }}>
            {folder.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <SquareX size={24} />
          </button>
        </div>

        {/* Assignments List */}
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {folderAssignments.length > 0 ? (
            folderAssignments.map((assignment) => (
              <li
                key={assignment.id}
                style={{
                  padding: '10px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                {assignment.name}
              </li>
            ))
          ) : (
            <p>No assignments in this folder.</p>
          )}
        </ul>
      </div>
    </div>
  );
}

export default FolderModal;
