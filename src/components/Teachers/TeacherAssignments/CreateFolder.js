import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../Universal/firebase';
import { FolderPlus } from 'lucide-react';
import { GlassContainer } from '../../../styles';

// Simplified folder style variants
const folderVariants = [
  'teal',
  'purple',
  'orange',
  'yellow',
  'green',
  'blue',
  'pink',
  'red'
];

const MAX_LENGTH = 20;

const CreateFolder = ({ classId, onFolderCreated, onClose }) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(folderVariants[0]);

  const handleCreateFolder = async () => {
    if (newFolderName.trim() === '') return;

    try {
      const classDocRef = doc(db, 'classes', classId);
      const newFolder = {
        name: newFolderName,
        variant: selectedVariant,
        assignments: [],
        id: Date.now().toString()
      };

      await updateDoc(classDocRef, {
        folders: arrayUnion(newFolder),
      });

      onFolderCreated();
      onClose();
      setNewFolderName('');
      setSelectedVariant(folderVariants[0]);
    } catch (error) {
      console.error('Error creating folder:', error);
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
      <GlassContainer
        variant="clear"
        size={1}
        style={{
          width: '500px'
        }}
        contentStyle={{
          padding: '30px'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <FolderPlus size={35} strokeWidth={1.5} style={{ marginRight: '10px', color: 'black' }} />
          <h1 style={{
            fontSize: '30px',
            fontWeight: '400',
            margin: 0,
            color: 'black'
          }}>
            Create New Folder
          </h1>
        </div>

        {/* Folder Name Input */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          marginBottom: '30px',
          position: 'relative'
        }}>
          <label style={{
            padding: '0 5px',
            fontFamily: "'montserrat', sans-serif",
            fontWeight: '500',
            color: 'grey',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            width: '120px'
          }}>
            Folder Name
          </label>
          <div style={{ position: 'relative', flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value.slice(0, MAX_LENGTH))}
              style={{
                width: '250px',
                padding: '8px 15px',
                border: '1px solid #ddd',
                borderRadius: '25px',
                fontSize: '1rem',
                fontFamily: "'montserrat', sans-serif",
                outline: 'none'
              }}
            />
            <div style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '.8rem',
              color: newFolderName.length === MAX_LENGTH ? '#ff6b6b' : 'lightgrey',
              fontFamily: "'montserrat', sans-serif",
              fontWeight: '500'
            }}>
              {newFolderName.length}/{MAX_LENGTH}
            </div>
          </div>
        </div>

        {/* Theme Selector */}
        <div style={{ 
          marginBottom: '30px',
          display: 'flex',
          width: '100%',
          alignItems: 'center'
        }}>
          <label style={{
            padding: '0 5px',
            fontFamily: "'montserrat', sans-serif",
            fontWeight: '500',
            color: 'grey',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            width: '120px'
          }}>
            Theme
          </label>
          <div style={{ 
            display: 'flex',
            gap: '3px',
            marginLeft: 'auto',
            marginRight: '20px'
          }}>
            {folderVariants.map((variant) => (
              <div key={variant} style={{
                zIndex: '2', 
                border: `1.5px solid ${variant === selectedVariant ? '#ddd' : 'transparent'}`, 
                padding: '4px', 
                height: '16px',
                width: '16px',
                borderRadius: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <GlassContainer
                  variant={variant}
                  size={0}
                  onClick={() => setSelectedVariant(variant)}
                  style={{
                    cursor: 'pointer'
                  }}
                  contentStyle={{
                    width: '16px',
                    height: '16px'
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginTop: '20px'
        }}>
          <div>
          <GlassContainer
            variant={newFolderName.trim() ? "teal" : "clear"}
            size={0}
            onClick={handleCreateFolder}
            style={{
              cursor: newFolderName.trim() ? 'pointer' : 'not-allowed',
           
            }}
            contentStyle={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '5px 0',
                 width: '160px',
              height: '20px'
            }}
          >
            <span style={{
              fontSize: '1rem',
              color: newFolderName.trim() ? '#008080' : '#808080',
              fontWeight: '500',
              fontFamily: "'montserrat', sans-serif"
            }}>
              Create Folder
            </span>
          </GlassContainer>
</div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #ddd',
              borderRadius: '25px',
              padding: '0',
              fontSize: '1rem',
              color: 'grey',
              fontWeight: '500',
              fontFamily: "'montserrat', sans-serif",
              cursor: 'pointer',
              width: '120px',
              height: '34px'
            }}
          >
            Cancel
          </button>
        </div>
      </GlassContainer>
    </div>
  );
};

export default CreateFolder;