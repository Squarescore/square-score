import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SquareX, Trash2 } from 'lucide-react';
import deleteAssignment from './DeleteAssignment'; // Import the delete function

const DeleteConfirmationModal = ({ onClose, assignmentId, classId, assignmentName, onDeleteSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    try {
      await deleteAssignment(assignmentId, classId);
      onClose();
      onDeleteSuccess(); // Call the callback function
      navigate(`/class/${classId}/Assignments`);
    } catch (error) {
      setError('Failed to delete assignment. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backdropFilter: 'blur(5px)',
      background: 'rgba(255,255,255,0.8)',
      zIndex: 10,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        width: '500px',
        backgroundColor: 'white',
        borderRadius: '20px',
        border: '10px solid white',
        
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' ,
        fontFamily: '"montserrat", sans-serif',
      }}>
       
        <div style={{ padding: '20px', marginTop: '-20px' }}>
          <h2 style={{ marginBottom: '20px', fontWeight: '500'}}>
            Are you sure you want to delete <span style={{fontWeight: '600'}}>{assignmentName}?</span>
          </h2>
          <p style={{ color: '#FF0000', marginBottom: '20px',
              fontWeight: '500', }}>
            This action cannot be undone. All related data will be permanently deleted.
          </p>
          {error && <p style={{ color: '#FF0000', marginBottom: '10px' }}>{error}</p>}
        </div>
        <div style={{ 
          display: 'flex', 
          padding: '0 20px 20px'
        }}>
          <button 
            onClick={onClose}
            disabled={isDeleting}
            style={{
              padding: '5px 40px',
              fontSize: '14px',
              borderRadius: '5px',
              fontWeight: '500',
            fontFamily: '"montserrat", sans-serif',
              cursor: 'pointer',
              
              border: '1px solid lightgrey',
              backgroundColor: '#f4f4f4',
              color: '#333',
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              padding: '5px 40px',
              fontSize: '14px', marginLeft: '20px',
              borderRadius: '5px',
              border: '1px solid lightgrey',
              fontWeight: '500',
        fontFamily: '"montserrat", sans-serif',
             
              cursor: 'pointer',
              backgroundColor: 'white',
              color: '#FF0000',
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;