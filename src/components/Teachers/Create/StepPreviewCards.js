import React, { useState } from 'react';
import { 
  Settings, 
  SquareDashedMousePointer, 
  Sparkles, 
  Eye, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';

const StepCard = ({ 
    stepNumber,
    title, 
    icon: Icon, 
    color, 
    bgColor, 
    isPrevious,
    position,
    canProgress,
    onClick 
  }) => {
    const [isClickable, setIsClickable] = useState(true);
    const [showError, setShowError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
      if (canProgress && isClickable) {
        onClick();
        setIsClickable(false);
        setTimeout(() => {
          setIsClickable(true);
        }, 1000);
      } else if (!canProgress) {
        setShowError(true);
        setTimeout(() => {
          setShowError(false);
        }, 500);
      }
    };

    const renderContent = () => {
      switch (stepNumber) {
        case 1:
          return (
            <div style={{ padding: '0 30px', height: '150px', marginTop: '20px' }}>
              <h1 style={{ fontSize: '8px', color: 'grey' }}>Assignment Name</h1>
              <input style={{ width: '100%', height: '20px', marginBottom: '10px' }} />
              <h1 style={{ fontSize: '8px', color: 'grey' }}>Assign on:</h1>
              <input style={{ width: '100%', height: '8px', marginTop: '-10px' }} />
              <h1 style={{ fontSize: '8px', color: 'grey', marginBottom: '5px', lineHeight: '20px' }}>
                Timer<br />
                Feedback<br />
                Save & Exit<br />
                Lockdown
              </h1>
            </div>
          );
        case 2:
          return (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '4px', 
              padding: '0 30px', 
              height: '150px', 
              overflowY: 'auto', 
              marginTop: '20px' 
            }}>
              {Array.from({ length: 17 }, (_, i) => (
                <div 
                  key={i} 
                  style={{ 
                    height: '20px', 
                    border: `1px solid #2BB514`, 
                    fontSize: '8px', 
                    lineHeight: "20px", 
                    borderRadius: '5px', 
                    textAlign: 'center' 
                  }}
                >
                  User Mock
                </div>
              ))}
            </div>
          );
        case 3:
          return (
            <div style={{ padding: '0 30px', height: '150px', marginTop: '20px' }}>
              <h1 style={{ fontSize: '8px', color: 'grey' }}>Generate Questions</h1>
              <textarea 
                style={{ 
                  height: '100px', 
                  width: '330px', 
                  resize: 'none', 
                  marginTop: '10px' 
                }} 
              />
            </div>
          );
        case 4:
          return (
            <div style={{ padding: '0 30px', height: '150px', marginTop: '20px' }}>
              {Array.from({ length: 4 }, (_, i) => (
                <input 
                  key={i} 
                  style={{ 
                    height: '20px', 
                    width: '330px', 
                    marginTop: '10px' 
                  }} 
                />
              ))}
            </div>
          );
        default:
          return null;
      }
    };

    const borderColor = showError 
      ? 'red' 
      : (isPrevious || canProgress) 
        ? 'lightgreen' 
        : 'none';

    const arrowColor = showError 
      ? 'red' 
      : (position === 'left' 
        ? 'lightgreen' 
        : (canProgress ? 'lightgreen' : '#d1d1d1'));

    return (
      <div 
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
            width: '400px',
            height: '250px',
            transform: `scale(${isHovered ? 1.1 : 1})`,
            transition: 'transform 0.3s ease, opacity 0.3s ease',
            cursor: isClickable && canProgress ? 'pointer' : 'not-allowed',
            zIndex: 1,
            opacity: isClickable || !canProgress ? 1 : 0.6,
          }}
      >
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          backgroundColor: 'rgb(255,255,255,.5)',
          backdropFilter: 'blur(2px)',
          width:isClickable && canProgress ? '396px' : '400px', 
          height: '250px',
          borderRadius: '20px',
          border: borderColor !== 'none' ? `2px solid ${borderColor}` : 'none',
          zIndex: 1
        }} />

        {position === 'left' ? (
          <div style={{
            position: 'absolute',
            left: '10px',
            top: '120px',
            zIndex: 2
          }}>
            <ChevronLeft color={arrowColor} size={40} />
          </div>
        ) : (
          <div style={{
            position: 'absolute',
            right: '10px',
            top: '120px',
            zIndex: 2
          }}>
            <ChevronRight color={arrowColor} size={40} />
          </div>
        )}

        <div style={{
         
        border: `1px solid lightgrey`,
          width: '400px',
          height: '250px',
          borderRadius: '20px',
          background: 'white',
          position: 'relative'
        }}>
          <div style={{
            marginLeft: '0px',
            color: color,
            border: `7px solid white`,
            borderRadius: '20px 20px 0px 0px',
            height: '35px',
            display: 'flex',
            alignItems: 'center',
            width: '386px',
            background: bgColor,
            marginBottom: '10px',
            fontWeight: 'bold'
          }}>
            <Icon size={20} style={{ marginLeft: '20px' }} />
            <h1 style={{ fontSize: '16px', marginLeft: '10px' , fontWeight: '600'}}>{title}</h1>
          </div>

          {renderContent()}
        </div>
      </div>
    );
  };

const StepPreviewCards = ({
  currentStep,
  onNextStep,
  onPrevStep,
  assignmentName,
  hasGeneratedQuestions
}) => {
  const steps = [
    {
      stepNumber: 1,
      title: 'Settings',
      icon: Settings,
      color: 'black',
      bgColor: 'white'
    },
    {
      stepNumber: 2,
      title: 'Select Students',
      icon: SquareDashedMousePointer,
      color: 'black',
      bgColor: 'white'
    },
    {
      stepNumber: 3,
      title: 'Generate Questions',
      icon: Sparkles,
      color: 'black',
      bgColor: 'white'
    },
    {
      stepNumber: 4,
      title: 'Preview',
      icon: Eye,
      color: 'black',
      bgColor: 'white'
    }
  ];

  const checkCanProgress = (stepIndex) => {
    switch (stepIndex) {
      case 1:
        return assignmentName?.length > 0;
      case 2:
        return true;
      case 3:
        return hasGeneratedQuestions;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: '170px'
    }}>
      {currentStep === 1 ? (
        <>
          <div style={{ width: '400px' }} /> {/* Transparent placeholder */}
          <StepCard
            {...steps[currentStep]}
            position="right"
            isPrevious={false}
            onClick={checkCanProgress(currentStep) ? onNextStep : undefined}
            canProgress={checkCanProgress(currentStep)}
          />
        </>
      ) : currentStep === 4 ? (
        <>
          <StepCard
            {...steps[currentStep - 2]}
            position="left"
            isPrevious={true}
            onClick={onPrevStep}
            canProgress={true}
          />
          <div style={{ width: '400px' }} /> {/* Transparent placeholder */}
        </>
      ) : (
        <>
          {currentStep > 1 && (
            <StepCard
              {...steps[currentStep - 2]}
              position="left"
              isPrevious={true}
              onClick={onPrevStep}
              canProgress={true}
            />
          )}
          {currentStep < 4 && (
            <StepCard
              {...steps[currentStep]}
              position="right"
              isPrevious={false}
              onClick={checkCanProgress(currentStep) ? onNextStep : undefined}
              canProgress={checkCanProgress(currentStep)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default StepPreviewCards;