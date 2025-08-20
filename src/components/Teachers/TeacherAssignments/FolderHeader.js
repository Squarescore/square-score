import React, { useState, useEffect } from 'react';
import { ArrowLeft, Folder, Trash2, X } from 'lucide-react';
import { GlassContainer } from '../../../styles';

// Color mapping for variants
const variantColors = {
  teal: { color: "#1EC8bc", borderColor: "#83E2F5" },
  purple: { color: "#8324e1", borderColor: "#cf9eff" },
  orange: { color: "#ff8800", borderColor: "#f1ab5a" },
  yellow: { color: "#ffc300", borderColor: "#Ecca5a" },
  green: { color: "#29c60f", borderColor: "#aef2a3" },
  blue: { color: "#1651d4", borderColor: "#b5ccff" },
  pink: { color: "#d138e9", borderColor: "#f198ff" },
  red: { color: "#c63e3e", borderColor: "#ffa3a3" }
};

const FolderHeader = ({ 
  folder,
  onBack,
  onAddAssignments,
  onDeleteFolder,
  isAddingAssignments = false 
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const DeleteConfirmModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(5px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <GlassContainer
        variant="clear"
        size={2}
        style={{
          width: '400px',
          backgroundColor: 'white'
        }}
        contentStyle={{
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          userSelect: 'none'
        }}
      >
        <h2 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: '400',
          color: 'black',
          fontFamily: "'Montserrat', sans-serif"
        }}>
          Delete "{folder?.name}"?
        </h2>
        <p style={{
          margin: '10px 0',
          fontSize: '1rem',
          color: 'grey',
          fontFamily: "'Montserrat', sans-serif"
        }}>
          This action cannot be undone. All assignments will be removed from this folder.
        </p>
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end',
          marginTop: '10px'
        }}>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            style={{
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '50px',
              padding: '5px 15px',
              color: 'grey',
              cursor: 'pointer',
              fontSize: '.9rem',
              fontWeight: '400',
              width: '100px',
              fontFamily: "'Montserrat', sans-serif"
            }}
          >
            Cancel
          </button>
          <GlassContainer
            variant="red"
            size={0}
            onClick={() => {
              onDeleteFolder(folder.id);
              setShowDeleteConfirm(false);
            }}
            style={{
              cursor: 'pointer',
              width: '100px'
            }}
            contentStyle={{
              padding: '5px 15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{
              color: '#c63e3e',
              fontSize: '.9rem',
              fontWeight: '400',
              fontFamily: "'Montserrat', sans-serif"
            }}>
              Delete
            </span>
          </GlassContainer>
        </div>
      </GlassContainer>
    </div>
  );

  const folderVariant = folder.variant || folder.color?.variant || 'clear';
  const folderColor = variantColors[folderVariant]?.color || 'grey';

  return (
    <>
      {showDeleteConfirm && <DeleteConfirmModal />}
      <div style={{
        width: 'calc(92% - 200px)',
        position: 'fixed',
        top: '70px',
        left: '200px',
        zIndex: '99',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(5px)',
        borderBottom: `1px solid ${isScrolled ? '#ddd' : 'transparent'}`,
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 4%',
        transition: 'border-color 0.3s ease'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          height: '25px',
          gap: '20px'
        }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0'
            }}
          >
            <ArrowLeft size={25} color={folderColor} />
          </button>

          <GlassContainer
            variant={folderVariant}
            size={0}
            contentStyle={{
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Folder size={20} color={folderColor} />
          </GlassContainer>

          <span style={{
            fontSize: '1.3rem',
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: '500',
            color: folderColor
          }}>
            {folder?.name}
          </span>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '10px',
          alignItems: 'center',
          marginLeft: 'auto'
        }}>
          <button
            onClick={onAddAssignments}
            style={{
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '25px',
              padding: '4px 15px',
              fontSize: '.8rem',
              fontFamily: "'Montserrat', sans-serif",
              color: 'grey',
              cursor: 'pointer',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              userSelect: 'none'
            }}
          >
            {isAddingAssignments ? 'done' : 'Add Assignments'}
          </button>
          
          <GlassContainer
            variant="red"
            size={0}
            onClick={handleDeleteClick}
            style={{
              cursor: 'pointer',
              opacity: 0.8
            }}
            contentStyle={{
              padding: '5px 15px',
              height: '20px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Trash2 size={16} color="#c63e3e" />
          </GlassContainer>
        </div>
      </div>
    </>
  );
};

export default FolderHeader;