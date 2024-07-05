import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';
import { where, query, getDocs, collection } from 'firebase/firestore';
import Navbar from './Navbar';
const DBQStudentResults = () => {
  const { dbqId: dbqIdParam } = useParams();
  const [dbqId, setDbqId] = useState('');

  const [assignment, setAssignment] = useState('');
  const [studentResponse, setStudentResponse] = useState('');
  const [gradedResponse, setGradedResponse] = useState('');
  const [images, setImages] = useState([]);
  const [selectedView, setSelectedView] = useState('assignment');
  const [classId, setClassId] = useState(null); 
  const [name, setName] = useState('');
  const studentUid = auth.currentUser.uid;

  useEffect(() => {
    
    const hash = window.location.hash ? window.location.hash.substring(1) : '';
    const fullDbqId = `${dbqIdParam}${hash ? '#' + hash : ''}`;
    setDbqId(fullDbqId);





    const fetchDBQDetails = async () => {
      try {
        const dbqDocRef = doc(db, 'dbqs', dbqId);
        const dbqDoc = await getDoc(dbqDocRef);
        if (dbqDoc.exists()) {
          const data = dbqDoc.data();
          console.log('DBQ Data:', data);
          // Log individual fields
          console.log('Assignment:', data.assignment);
          console.log('Name:', data.name);
          console.log('Class ID:', data.classId);
          console.log('Timer:', data.timer);
          console.log('Multiple Days:', data.multipleDays);
          console.log('Lockdown Mode:', data.lockdownMode);
          // Set the assignment state
          setAssignment(data.assignment);
          setClassId(data.classId);
          setName(data.name);
          setImages(data.imageUrl ? data.imageUrl.split(",") : []);
        } else {
          console.log('DBQ document does not exist');
        }
      } catch (error) {
        console.error('Error fetching DBQ details:', error);
      }
    };
      
      const fetchDBQScore = async () => {
        const dbqScoreQuery = query(
          collection(db, 'dbqscore'),
          where('dbqId', '==', dbqId),
          where('studentUid', '==', studentUid)
        );
        const querySnapshot = await getDocs(dbqScoreQuery);
        if (!querySnapshot.empty) {
          const dbqScoreDoc = querySnapshot.docs[0];
          const dbqScoreData = dbqScoreDoc.data();
          console.log('DBQ Score Data:', dbqScoreData);
          setStudentResponse(dbqScoreData.studentResponse);
          setGradedResponse(dbqScoreData.apiResponse);
        } else {
          console.log('No DBQ score found');
        }
      };

    fetchDBQDetails();
    fetchDBQScore();
  }, [dbqId, studentUid]);
  const renderImages = () => {
    if (Array.isArray(images)) {
      return images.map((imageUrl, index) => (
        <img key={index} src={imageUrl} alt={`Attachment ${index + 1}`} style={{ maxWidth: '100%', margin: '10px 0' }} />
      ));
    } else if (images) { // Fallback for a single URL string
      return <img src={images} alt="Assignment Attachment" style={{ maxWidth: '100%', margin: '10px 0' }} />;
    }
  };
  const renderSourcesWithNewlines = (sourcesText) => {
    // Using a regular expression to match content within square brackets, including the brackets themselves
    const cleanedSourcesText = sourcesText.replace(/\[.*?\]/g, '');
    const formattedText = cleanedSourcesText.split('\n').map((line, index) => (
      `${line}<br />`
    )).join('');
    return { __html: formattedText };
  };
  
  
  const renderContent = () => {
    switch (selectedView) {
      case 'assignment':
        return (
       
          <div >
       <div style={{userSelect: 'none'}}>
  <div dangerouslySetInnerHTML={renderSourcesWithNewlines(assignment)} />
  </div>
  {renderImages()}
</div>
        );
      case 'studentResponse':
       
      
      
      
      return <div>{studentResponse}</div>;
      case 'gradedResponse':
        return (
          <div
            dangerouslySetInnerHTML={{
              __html: gradedResponse.replace(
                /\(([^)]+)\)/g,
                '<span style="color: green;">($1)</span>'
              ),
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F9F9F9'}}>

      <div style={{ width: '30%', backgroundColor: '#f0f0f0', padding: '20px' }}>
        <h2>DBQ Student Results</h2>
        <button onClick={() => setSelectedView('assignment')}>
          DBQ Assignment
        </button>
        <button onClick={() => setSelectedView('studentResponse')}>
          Student Response
        </button>
        <button onClick={() => setSelectedView('gradedResponse')}>
          Graded Response
        </button>
      </div>
      <div style={{ width: '70%', padding: '20px' }}>{renderContent()}</div>
    </div>
  );
};

export default DBQStudentResults;