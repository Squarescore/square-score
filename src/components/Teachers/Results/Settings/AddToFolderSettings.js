import React, { useState, useEffect } from 'react';
import { doc, collection, writeBatch, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../Universal/firebase';
import { Folder, FolderPlus, ArrowLeft, Check } from 'lucide-react';
import { GlassContainer } from '../../../../styles';
import { useAuthState } from 'react-firebase-hooks/auth';
import { flushSync } from 'react-dom';

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

const AddToFolderSettings = ({ assignmentId, classId, onClose }) => {
  const [user] = useAuthState(auth);
  const [folders, setFolders] = useState([]);
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    const fetchFolders = async () => {
      if (!classId) return;

      try {
        const classRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classRef);
        
        if (classDoc.exists()) {
          const classData = classDoc.data();
          setFolders(classData.folders || []);
        }
      } catch (error) {
        console.error("Error fetching folders:", error);
      }
    };

    fetchFolders();
  }, [classId]);

  const handleAddToFolder = async (folder) => {
    try {
      const batch = writeBatch(db);
      
      // Update the folder's assignments array
      const classRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classRef);
      
      if (classDoc.exists()) {
        const classData = classDoc.data();
        const updatedFolders = classData.folders.map(f => {
          if (f.id === folder.id) {
            return {
              ...f,
              assignments: [...(f.assignments || []), assignmentId]
            };
          }
          return f;
        });

        batch.update(classRef, { folders: updatedFolders });
        await batch.commit();
        
        setAddSuccess(true);
        setTimeout(() => {
          setAddSuccess(false);
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error("Error adding to folder:", error);
    }
  };

  return (
    <div style={{
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px',
              display: 'flex'
            }}
          >
            <ArrowLeft size={20} color="black"  strokeWidth={1.5}/>
          </button>
          <h2 style={{
            margin: 0,
            fontSize: '1.2rem',
            fontWeight: '400',
            color: 'black',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            Add to Folder
          </h2>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
      
        width: 'calc(100% - 30px)',
        gap: '15px'
      }}>
        {folders.map((folder) => (
      <div 
        onClick={() => handleAddToFolder(folder)}
        style={{ 
          borderBottom: '1px solid #ddd',
          paddingBottom: '15px',
          userSelect: 'none',
          width: '100%',
          paddingLeft: "10px",
          marginLeft: '10px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
    
      >
            <div style={{display: 'flex', alignItems: 'center', height: '30px' }}>
              <Folder 
                size={20} 
                color={variantColors[folder.variant || folder.color?.variant]?.color || '#ddd'}
              />
              <div style={{
                marginLeft: '15px',
                height: '1.2rem' ,
                alignItems: 'center',
                borderLeft: '1px solid #ddd',
                paddingLeft: '15px',
                marginTop: '5px',
              }}>
                <h1 style={{
                  fontSize: '1rem',
                  fontFamily: "'Montserrat', sans-serif",
                  color: 'grey',
                  fontWeight: '500',
                  textAlign: 'left',
                  marginTop: '-0px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '410px'
                }}>
                  {folder.name}
                </h1>
          
              </div>
            </div></div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 10px',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '.9rem',
          fontWeight: '400',
          color: 'grey',
          fontFamily: "'Montserrat', sans-serif",
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Folder size={16} strokeWidth={1.5} />
            <span>Manage and create folders in the Folders tab</span>
          </div>
          <span style={{ 
            fontSize: '.8rem', 
            color: 'lightgrey',
            fontStyle: 'italic'
          }}>
            Found in your class dashboard
          </span>
        </div>
      </div>

      {addSuccess && (
        <GlassContainer
          variant="green"
          size={0}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
          }}
          contentStyle={{
            padding: '6px 24px',
            display: 'flex',
            color: 'green',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{display: 'flex'}}>
            <span style={{
              fontFamily: "'montserrat', sans-serif",
              fontWeight: '400',
              marginRight: '10px'
            }}>
              Successfully added to folder
            </span>
            <Check size={20} />
          </div>
        </GlassContainer>
      )}
    </div>
  );
};

export default AddToFolderSettings;