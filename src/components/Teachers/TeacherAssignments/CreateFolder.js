import React, { useState } from 'react';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../Universal/firebase';
import { SquareX, FolderPlus, Palette } from 'lucide-react';

function CreateFolder({ classId, onFolderCreated, onClose }) {
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
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(pastelColors[0]);

  const handleCreateFolder = async () => {
    if (newFolderName.trim() === '') return;

    try {
      const newFolderRef = await addDoc(collection(db, 'folders'), {
        name: newFolderName,
        color: newFolderColor,
        classId: classId,
        assignments: [],
      });

      const classDocRef = doc(db, 'classes', classId);
      const classDocSnap = await getDoc(classDocRef);
      if (classDocSnap.exists()) {
        const currentFolders = classDocSnap.data().folders || [];
        await updateDoc(classDocRef, {
          folders: [...currentFolders, newFolderRef.id],
        });
      }

      onFolderCreated({
        id: newFolderRef.id,
        name: newFolderName,
        color: newFolderColor,
        assignments: [],
      });

      setNewFolderName('');
      setNewFolderColor(pastelColors[0]);
      onClose();
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
          }}
        >
          <div style={{ flex: 2, padding: '20px', marginLeft: '30px', marginTop: '20px' }}>
            <div style={{ position: 'relative', width: '680px' }}>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value.slice(0, 15))}
                placeholder="Name"
                style={{
                  width: '600px',
                  padding: '20px',
                  position: 'relative',
                  marginBottom: '10px',
                  color: '#454545',
                  fontFamily: "'montserrat', sans-serif",
                  backgroundColor: 'white',
                  fontWeight: 'bold',
                  fontSize: '30px',
                  outline: 'none',
                  border: '4px solid #f4f4f4',
                  borderRadius: '10px',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '45px',
                  bottom: '20px',
                  color: 'lightgrey',
                  fontFamily: "'montserrat', sans-serif",
                  fontSize: '14px',
                }}
              >
                {newFolderName.length}/15
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                marginBottom: '10px',
                width: '600px',
                height: '30px',
                border: '4px solid #f4f4f4',
                borderRadius: '10px',
                padding: '20px',
                marginTop: '10px',
              }}
            >
              <div style={{ display: 'flex' }}>
                <Palette size={40} strokeWidth={2.5} style={{ marginTop: '-5px' }} />
                <h1
                  style={{
                    width: '150px',
                    height: '20px',
                    marginTop: '-5px',
                    color: '#454545',
                    textAlign: 'center',
                    fontFamily: "'montserrat', sans-serif",
                    padding: '0px 0px',
                  }}
                >
                  Theme
                </h1>
              </div>
              <div style={{ height: '30px', width: '4px', background: '#f4f4f4' }}></div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '15px',
                  height: '20px',
                  marginTop: '30px',
                  marginLeft: '20px',
                }}
              >
                {pastelColors.map((color, index) => (
                  <div
                    key={index}
                    onClick={() => setNewFolderColor(color)}
                    style={{
                      width: '30px',
                      height: '30px',
                      marginTop: '-30px',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: '25px',
                        height: '25px',
                        backgroundColor: color.bg,
                        borderRadius: '5px',
                        border: `4px solid ${color.text}`,
                        boxSizing: 'border-box',
                      }}
                    />
                    {newFolderColor === color && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          transform: 'translate(-50%, -50%)',
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          backgroundColor: 'transparent',
                          border: '4px solid #2BB514',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateFolder}
              style={{
                padding: '5px 50px',
                backgroundColor: '#CDFFC5',
                fontWeight: 'bold',
                fontSize: '25px',
                fontFamily: "'montserrat', sans-serif",
                color: newFolderColor ? '#2BB514' : 'white',
                border: '4px solid #2BB514',
                borderRadius: '10px',
                marginTop: '20px',
                cursor: 'pointer',
              }}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateFolder;
