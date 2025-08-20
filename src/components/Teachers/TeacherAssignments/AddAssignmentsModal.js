import React from 'react';
import { Eye, EyeOff, Plus } from 'lucide-react';
import { GlassContainer } from '../../../styles';

const AddAssignmentsView = ({
  folder,
  assignments,
  onAddAssignment,
  getFormatDisplay,
  formatDate,
  getGradeColors,
  flaggedAssignments
}) => {
  // Filter out assignments already in the folder
  const availableAssignments = assignments.filter(
    assignment => !folder.assignments.includes(assignment.id)
  );

  return (
    <div style={{ 
      marginTop: '150px', 
      marginLeft: '200px', 
      padding: '0 4%', 
      width: 'calc(92% - 200px)',
    }}>
      {availableAssignments.length === 0 ? (
        <h1 style={{ 
          fontWeight: '500', 
          color: 'grey', 
          fontSize: '1rem', 
          marginTop: '30px'
        }}>
          No assignments available to add
        </h1>
      ) : (
        <ul style={{ 
          listStyleType: 'none', 
          padding: 0,
          margin: 0,
          width: '100%'
        }}>
          {availableAssignments.map((assignment) => (
            <li
              key={assignment.id}
              style={{
                padding: '20px 2%',
                width: '100%',
                marginLeft: '-2%',
                background: 'none',
                borderBottom: '1px solid #EDEDED',
                display: 'flex',
                gap: '7px', 
                fontSize: '1rem',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.005)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontFamily: "'montserrat', sans-serif",
                }}>
                  {assignment.name}
                  <div style={{
                    marginRight: '10px',
                    height: '26px',
                    width: '50px',
                    position: 'relative',
                    fontSize: '.8rem'
                  }}>
                    {getFormatDisplay(assignment.type)}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                fontSize: '16px',
                marginLeft: 'auto',
                position: 'relative'
              }}>
                {assignment.average ? (
                  <div style={{
                    position: 'absolute',
                    right: 'calc(4% + 240px)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <GlassContainer
                      size={0}
                      variant={getGradeColors(assignment.average).variant}
                      contentStyle={{
                        padding: '2px 10px',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ 
                        color: getGradeColors(assignment.average).color,
                        fontWeight: '500',
                        fontSize: '.8rem',
                        fontFamily: "'Montserrat', sans-serif"
                      }}>
                        {assignment.average}%
                      </span>
                    </GlassContainer>
                  </div>
                ) : (
                  <div style={{
                    position: 'absolute',
                    right: 'calc(4% + 240px)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      color: '#858585',
                      fontWeight: '500',
                      fontSize: '.8rem',
                      padding: '5px 10px',
                      textAlign: 'center',
                      fontFamily: "'Montserrat', sans-serif"
                    }}>
                      -
                    </span>
                  </div>
                )}

                <span style={{
                  fontSize: '.8rem',
                  color: 'grey',
                  right: 'calc(4% + 70px)',
                  fontWeight: '400',
                  position: 'absolute',
                  fontFamily: "'Montserrat', sans-serif",
                }}>
                  {formatDate(assignment.id)}
                </span>

                <div style={{
                  position: 'absolute',
                  right: 'calc(4% + 370px)',
                }}>
                  {assignment.viewable && (
                    <GlassContainer
                      variant='blue'
                      size={0}
                      contentStyle={{padding: '2px 4px'}}
                      style={{zIndex: '1'}}
                    >
                      <Eye size={16} color="#020CFF" />
                    </GlassContainer>
                  )}
                </div>

                <GlassContainer
                  variant="green"
                  size={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddAssignment(assignment.id);
                  }}
                  style={{
                    cursor: 'pointer',
                    position: 'absolute',
                    right: '0',
                    opacity: 0.9
                  }}
                  contentStyle={{
                    padding: '2px 4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Plus size={16} color="#29c60f" />
                </GlassContainer>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddAssignmentsView;