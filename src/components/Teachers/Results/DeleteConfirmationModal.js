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
      zIndex: 100,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        width: '500px',
        backgroundColor: 'white',
        borderRadius: '20px',
        border: '10px solid #f4f4f4',
        fontFamily: '"montserrat", sans-serif',
      }}>
        <div style={{
          backgroundColor: '#FFB3B3',
          color: '#FF0000',
          border: '10px solid #FF0000',
          borderTopRightRadius: '15px',
          borderTopLeftRadius: '15px',
          padding: '15px',
          fontSize: '24px',
          margin: '-10px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Trash2 size={30} style={{ marginRight: '10px' }} />
          Delete Assignment
          <button 
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#FF0000',
            }}
          >
            <SquareX size={30} />
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          <h2 style={{ marginBottom: '20px', }}>
            Are you sure you want to delete {assignmentName}?
          </h2>
          <p style={{ color: '#FF0000', marginBottom: '20px',
              fontWeight: '600', }}>
            This action cannot be undone. All related data will be permanently deleted.
          </p>
          {error && <p style={{ color: '#FF0000', marginBottom: '10px' }}>{error}</p>}
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          padding: '0 20px 20px'
        }}>
          <button 
            onClick={onClose}
            disabled={isDeleting}
            style={{
              padding: '10px 40px',
              fontSize: '16px',
              borderRadius: '10px',
              fontWeight: '600',
            fontFamily: '"montserrat", sans-serif',
              cursor: 'pointer',
              
              border: '4px solid lightgrey',
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
              padding: '10px 40px',
              fontSize: '16px',
              borderRadius: '10px',
              border: '4px solid #FF0000',
              fontWeight: '600',
        fontFamily: '"montserrat", sans-serif',
             
              cursor: 'pointer',
              backgroundColor: '#FFB3B3',
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