// CreateFolder.js
import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../Universal/firebase';
import { FolderPlus, SquareX } from 'lucide-react';

const pastelColors = [
  { bg: '#FFF2A9', text: '#FFD000' },
  { bg: '#FFB411', text: '#EA6200' },
  { bg: '#F7C7FF', text: '#B513D2' },
  { bg: '#FFBCBC', text: '#C10E0E' },
  { bg: '#84FDFF', text: '#00D3D7' },
  { bg: '#DAB5FF', text: '#7C00F8' },
  { bg: '#9EADFF', text: '#020CFF' },
  { bg: '#C1FFC7', text: '#48E758' },
];

function CreateFolder({ classId, onFolderCreated, onClose }) {
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(pastelColors[0]); // Store full color object

  const handleCreateFolder = async () => {
    if (newFolderName.trim() === '') return;

    try {
      const classDocRef = doc(db, 'classes', classId);

      // Create a new folder object with all necessary properties
      const newFolder = {
        name: newFolderName,
        color: selectedColor, // Store the full color object
        assignments: [],
        id: Date.now().toString() // Add a unique ID
      };

      await updateDoc(classDocRef, {
        folders: arrayUnion(newFolder),
      });

      onFolderCreated(); // Refresh folders
      onClose();
      setNewFolderName('');
      setSelectedColor(pastelColors[0]);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 101,
      }}
    >
      <div style={{ width: '800px', height: '400px' }}>
        <div
          style={{
            padding: '10px',
            height: '60px',
            width: '738px',
            backgroundColor: '#CDFFC5',
            borderRadius: '20px 20px 0 0',
            cursor: 'pointer',
            marginRight: 'auto',
            fontSize: '30px',
            color: '#2BB514',
            border: '10px solid #2BB514',
            fontFamily: "'montserrat', sans-serif",
            fontWeight: 'bold',
            position: 'relative',
            textAlign: 'left',
            display: 'flex',
            zIndex: 11,
          }}
        >
          <FolderPlus size={50} style={{ marginLeft: '40px', marginTop: '6px' }} />
          <h1 style={{ fontSize: '40px', marginLeft: '20px', marginTop: '6px' }}>
            Create Folder
          </h1>
          <button
            onClick={onClose}
            style={{
              height: '40px',
              border: 'none',
              marginLeft: 'auto',
              background: 'none',
              color: '#2BB514',
              cursor: 'pointer',
            }}
          >
            <SquareX size={50} style={{ marginTop: '5px' }} />
          </button>
        </div>

        <div
          style={{
            position: 'absolute',
            height: '330px',
            width: '758px',
            borderRadius: '0 0 20px 20px',
            backgroundColor: 'white',
            border: '10px solid white',
            boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
            zIndex: '10',
            marginTop: '-20px',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
          }}
        >
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value.slice(0, 15))}
            placeholder="Folder Name"
            style={{
              width: '90%',
              padding: '15px',
              marginBottom: '20px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '18px',
              fontFamily: "'montserrat', sans-serif",
            }}
          />

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px', fontFamily: "'montserrat', sans-serif" }}>
              Select Color
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              {pastelColors.map((color, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: color.bg,
                    border: selectedColor === color ? `3px solid ${color.text}` : '3px solid transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleCreateFolder}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2BB514',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: "'montserrat', sans-serif",
              marginTop: 'auto',
              width: 'fit-content',
            }}
          >
            Create Folder
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateFolder;