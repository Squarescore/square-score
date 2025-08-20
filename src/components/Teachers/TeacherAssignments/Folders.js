import React from 'react';
import { Folder, FolderPlus } from 'lucide-react';
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

const Folders = ({
  classId,
  folders,
  assignments,
  pastelColors,
  onFoldersUpdated,
  openFolderModal,
  onCreateFolder,
  periodStyle
}) => {
  const getFolderAssignmentCount = (folder) => {
    return folder.assignments ? folder.assignments.length : 0;
  };

  return (
    <div style={{ 
      marginTop: '150px', 
      marginLeft: '200px', 
      padding: '0 4%', 
      width: 'calc(92% - 200px)',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        width: '100%', 
      }}>
        {/* Create Folder Button */}
        <div>
          <GlassContainer
            variant={periodStyle.variant}
            size={1}
            onClick={onCreateFolder}
            style={{
              cursor: 'pointer',
            }}
            contentStyle={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 60px',
              boxSizing: 'border-box',
            }}
          >
            <div style={{
              justifyContent: 'center',
              display: 'flex' 
            }}>
              <FolderPlus style={{marginTop: '10px'}} size={30} color={periodStyle.color} />
              <h1 style={{
                marginLeft: '20px',
                fontSize: '1.3rem',
                fontFamily: "'Montserrat', sans-serif",
                color: periodStyle.color,
                fontWeight: '500'
              }}>
                Create Folder
              </h1>
            </div>
          </GlassContainer>
        </div>

        {/* Folder Cards */}
        {folders.map((folder) => (
          <div key={folder.id}>
            <GlassContainer
              variant="clear"
              size={1}
              onClick={() => openFolderModal(folder)}
              style={{
                cursor: 'pointer',
              }}
              contentStyle={{
                display: 'flex',
                padding: '20px',
                width: '300px',
                height: '50px',
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', marginTop: '5px'}}>
                 <Folder 
                size={40} 
                color={variantColors[folder.variant || folder.color?.variant]?.color || '#ddd'}
              />
              <div style={{marginLeft: '15px', borderLeft: '1px solid #ddd', paddingLeft: '15px', height: '30px',
                  marginTop: '5px',}}>
             
                <h1 style={{
                  marginTop: '-5px',
                  fontSize: '1rem',
                  fontFamily: "'Montserrat', sans-serif",
                  color: 'grey',
                  fontWeight: '500',
                  textAlign: 'left',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '210px'
                }}>
                  {folder.name}
                </h1>
                <h1 style={{
                  marginTop: '-10px',
                  fontSize: '.8rem',
                  fontFamily: "'Montserrat', sans-serif",
                  color: '#666',
                  fontWeight: '400'
                }}>
                  {getFolderAssignmentCount(folder)} {getFolderAssignmentCount(folder) === 1 ? 'Assignment' : 'Assignments'}
                </h1>
              </div>
              </div>
            </GlassContainer>
            
          </div>
        ))}
      </div>
    </div>
  );
};

export default Folders;