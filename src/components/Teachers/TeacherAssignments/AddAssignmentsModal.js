import React, { useState } from 'react';
import { SquareArrowLeft, SquarePlus } from 'lucide-react';
import { formatDate } from './utils';

function AddAssignmentsModal({ assignments, folder, addAssignmentToFolder, onClose }) {
  const [searchTermAddAssignments, setSearchTermAddAssignments] = useState('');

  return (
    <div
      style={{
        position: 'fixed',
        width: '854px',
        backdropFilter: 'blur(5px)',
        backgroundColor: 'rgb(255,255,255,1)',
        border: '10px solid white',
        boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
        borderTop: 'none',
        padding: '20px',
        marginLeft: '-67px',
        zIndex: 102,
        height: '440px',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', marginTop: '-30px' }}>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            opacity: 0.5,
          }}
        >
          <SquareArrowLeft size={40} style={{ color: 'grey' }} />
        </button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '15px',
            marginBottom: '20px',
          }}
        >
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchTermAddAssignments}
            onChange={(e) => setSearchTermAddAssignments(e.target.value)}
            style={{
              width: '760px',
              padding: '10px',
              border: '2px solid #f4f4f4',
              borderRadius: '5px',
              flexGrow: 1,
            }}
          />
        </div>
      </div>

      {assignments.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          {assignments
            .filter(
              (assignment) =>
                (assignment.name || assignment.assignmentName)
                  .toLowerCase()
                  .includes(searchTermAddAssignments.toLowerCase()) &&
                (!assignment.folders || !assignment.folders.includes(folder.id))
            )
            .map((assignment) => (
              <div
                key={assignment.id}
                style={{
                  width: '390px',
                  marginBottom: '20px',
                  borderRadius: '10px',
                  padding: '10px',
                  height: '60px',
                  position: 'relative',
                  backgroundColor: 'white',
                  border: '2px solid #f4f4f4',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'montserrat', sans-serif",
                      fontWeight: 'bold',
                      fontSize: '20px',
                    }}
                  >
                    {assignment.name || assignment.assignmentName}
                  </div>
                  <span
                    style={{
                      position: 'absolute',
                      right: '50px',
                      bottom: '10px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'grey',
                    }}
                  >
                    {formatDate(assignment.timestamp)}
                  </span>
                </div>
                <button
                  onClick={() => addAssignmentToFolder(assignment)}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    backgroundColor: 'white',
                    color: 'white',
                    border: 'none',
                    zIndex: '80',
                    borderRadius: '5px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                  }}
                >
                  <SquarePlus size={40} color="#7BE06A" strokeWidth={2} />
                </button>
              </div>
            ))}
        </div>
      ) : (
        <div
          style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}
        >
          No assignments available to add.
        </div>
      )}
    </div>
  );
}

export default AddAssignmentsModal;
