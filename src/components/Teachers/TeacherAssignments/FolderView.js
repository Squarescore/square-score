import React from 'react';
import { Flag, Eye, SquarePlus } from 'lucide-react';

const FolderView = ({ 
  folder, 
  assignments, 
  onBack, 
  getFormatDisplay, 
  handleItemClick, 
  formatDate, 
  getGradeColors, 
  flaggedAssignments,
  onAddAssignments 
}) => {
  // Get assignments not in the current folder
  const availableAssignments = assignments.filter(assignment => 
    !folder.assignments.includes(assignment.id)
  );

  // Current folder assignments
  const folderAssignments = assignments.filter(assignment =>
    folder.assignments.includes(assignment.id)
  );

  return (
    <div style={{ width: 'calc(100% - 200px)', marginLeft: '200px', }}>
  

      <ul style={{ listStyleType: 'none', padding: 0, width: '100%',marginTop: '180px'}}>
     

        {folderAssignments.length > 0 ? (
          folderAssignments.map((item) => (
            <li
              key={item.id}
              onClick={() => handleItemClick(item)}
              style={{
                padding: '20px 4%',
                width: '92%',
                borderBottom: '1px solid #EDEDED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
              }}
            >
              <span
                style={{
                  fontSize: '16px',
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: '500',
                }}
              >
                {item.name}
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                marginLeft: 'auto',
                position: 'relative'
              }}>
                {item.average ? (
                  <span style={{ 
                    right: 'calc(4% + 240px)',
                    fontWeight: '500',
                    position: 'absolute',
                    background: getGradeColors(item.average).background,
                    color: getGradeColors(item.average).color,
                    padding: '5px',
                    borderRadius: '5px',
                    width: '40px',
                    textAlign: 'center',
                  }}>
                    {item.average}%
                  </span>
                ) : (
                  <span style={{ 
                    right: 'calc(4% + 240px)',
                    fontWeight: '500',
                    position: 'absolute',
                    background: 'white',
                    color: '#858585',
                    padding: '5px',
                    borderRadius: '5px',
                    width: '40px',
                    textAlign: 'center',
                  }}>
                    -
                  </span>
                )}
                <span
                  style={{
                    fontSize: '16px',
                    color: 'lightgrey',
                    right: 'calc(4% + 100px)',
                    fontWeight: '500',
                    position: 'absolute',
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  {formatDate(item.id)}
                </span>

                {/* Flag and Eye Icons */}
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  marginLeft: '10px'
                }}>
                  {flaggedAssignments.has(item.id) && (
                    <Flag size={20} color="red" 
                    style={{position: 'absolute', right: 'calc(4% + 450px)'}}
                    />
                  )}
                  {item.viewable && (
                    <Eye size={20} color="#020CFF"
                    style={{position: 'absolute', right: 'calc(4% + 370px)'}}
                     />
                  )}
                </div>

                {/* Format Display */}
                <div style={{ marginRight: '0px', height: '30px', width: '50px', position: 'relative' }}>
                  {getFormatDisplay(item.type)}
                </div>
              </div>
            </li>
          ))
        ) : (
            <div>
           
          <li style={{
            padding: '20px 4%',
            color: 'lightgrey',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '18px',
            marginTop: '20px',
            fontWeight: '500'
          }}>

            No assignments in this folder.
          </li>
          </div>
        )}
      </ul>
    </div>
  );
};

export default FolderView;