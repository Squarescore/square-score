import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../Universal/firebase';
import { Folder as FolderIcon, SquareX, SquarePlus } from 'lucide-react';
import { getBackgroundColorWithOpacity } from './utils';
import { formatISODate } from './utils';
import AddAssignmentsModal from './AddAssignmentsModal';

function Folder({
  folder,
  assignments,
  onClose,
  addAssignmentToFolder,
  fetchFolderAssignments,
}) {
  const [folderAssignments, setFolderAssignments] = useState([]);
  const [showAddAssignmentsModal, setShowAddAssignmentsModal] = useState(false);
  const [searchTermAddAssignments, setSearchTermAddAssignments] = useState('');

  useEffect(() => {
    const fetchAssignments = async () => {
      const assignments = await fetchFolderAssignments(folder.id);
      setFolderAssignments(assignments);
    };
    fetchAssignments();
  }, [folder.id, fetchFolderAssignments]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(250, 250, 250, 0.9)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 101,
      }}
    >
      <div
        style={{
          width: '60%',
          height: '50%',
          backgroundColor: 'white',
          border: '10px solid white',
          boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
          borderRadius: '20px',
          padding: '20px',
          display: 'flex',
          position: 'relative',
          flexDirection: 'column',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-40px',
            fontWeight: 'bold',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '44px',
            cursor: 'pointer',
            color: folder.color.text,
            zIndex: 104,
          }}
        >
          <SquareX size={40} color={folder.color.text} strokeWidth={3} />
        </button>
        <div
          style={{
            backgroundColor: folder.color.bg,
            height: '70px',
            width: '100%',
            position: 'absolute',
            top: '-65px',
            left: '-10px',
            display: 'flex',
            zIndex: '103',
            border: `10px solid ${folder.color.text}`,
            borderRadius: '20px',
            borderBottomLeftRadius: '0px',
            borderBottomRightRadius: '0px',
          }}
        >
          <FolderIcon
            size={40}
            color={folder.color.text}
            strokeWidth={3}
            style={{ marginLeft: '30px', marginTop: '15px' }}
          />
          <h2
            style={{
              color: folder.color.text,
              fontFamily: "'montserrat', sans-serif",
              fontSize: '34px',
              marginTop: '15px',
              marginLeft: '20px',
            }}
          >
            {folder.name}
          </h2>
        </div>

        <button
          onClick={() => setShowAddAssignmentsModal(true)}
          style={{
            position: 'absolute',
            top: '50px',
            width: '350px',
            left: '20px',
            padding: '10px 20px',
            color: folder.color.text,
            border: `0px solid ${folder.color.text}`,
            backgroundColor: getBackgroundColorWithOpacity(folder.color.text, 0.2),
            borderRadius: '15px',
            cursor: 'pointer',
            fontSize: '25px',
            display: 'flex',
            height: '50px',
            fontFamily: "'montserrat', sans-serif",
            fontWeight: 'bold',
          }}
        >
          Add Assignments
          <div style={{ marginLeft: '40px' }}>
            <SquarePlus size={30} color={folder.color.text} strokeWidth={2} />
          </div>
        </button>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            overflow: 'auto',
            marginTop: '100px',
            left: '10px',
          }}
        >
          {folderAssignments.length > 0 ? (
            folderAssignments.map((assignment) => (
              <div
                key={assignment.id}
                style={{
                  width: 'calc(47% - 20px)',
                  padding: '10px',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '5px',
                  }}
                >
                  <h3
                    style={{
                      color: 'black',
                      fontFamily: "'montserrat', sans-serif",
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '70%',
                    }}
                  >
                    {assignment.name || assignment.assignmentName}
                  </h3>
                  <div
                    style={{
                      position: 'absolute',
                      right: '-15px',
                      fontSize: '14px',
                      color: 'lightgrey',
                      width: 'calc(30.33% - 20px)',
                      fontWeight: '600',
                    }}
                  >
                    {formatISODate(assignment.createdAt)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                width: '100%',
                textAlign: 'center',
                color: folder.color.text,
                fontFamily: "'montserrat', sans-serif",
                fontSize: '20px',
                marginTop: '20px',
              }}
            >
              This folder is empty. Add assignments using the button above.
            </div>
          )}
        </div>
        {showAddAssignmentsModal && (
          <AddAssignmentsModal
            assignments={assignments}
            folder={folder}
            addAssignmentToFolder={addAssignmentToFolder}
            onClose={() => setShowAddAssignmentsModal(false)}
          />
        )}
      </div>
    </div>
  );
}

export default Folder;
