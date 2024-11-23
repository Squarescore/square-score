import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getCountFromServer } from 'firebase/firestore'; // Updated imports
import { db } from '../Universal/firebase';
import { BookOpen, BookOpenText, ChevronLeft, ChevronRight, Eye, Flag, Folder, PencilRuler, SquareCheck, SquareX, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Navbar from '../Universal/Navbar';
import CopyLinkButton from './CopyLinkButtonPink';

const TeacherClassHome = () => {
  // Existing States
  const [activeTab, setActiveTab] = useState('recent');
  const [assignments, setAssignments] = useState([]);
  const [classPerformance, setClassPerformance] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const { classId } = useParams();
  const [joinRequests, setJoinRequests] = useState([]);
  const [classData, setClassData] = useState({});
  const [classAverage, setClassAverage] = useState(0);
  const [assignmentsPerPage, setAssignmentsPerPage] = useState(4);
  const [currentPage, setCurrentPage] = useState(1);
  const [flaggedAssignments, setFlaggedAssignments] = useState(new Set());
  const getGradeColors = (grade) => {
    if (grade === undefined || grade === null || grade === 0) return { color: '#858585', background: 'white' };
    if (grade < 50) return { color: '#FF0000', background: '#FFCBCB' };
    if (grade < 70) return { color: '#FF4400', background: '#FFC6A8' };
    if (grade < 80) return { color: '#EFAA14', background: '#FFF4DC' };
    if (grade < 90) return { color: '#9ED604', background: '#EDFFC1' };
    if (grade > 99) return { color: '#E01FFF', background: '#F7C7FF' };
    return { color: '#2BB514', background: '#D3FFCC' };
  };
  
  const navigate = useNavigate();

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  useEffect(() => {
    fetchAssignments();
  }, [classId]);

  // Function to Check for Flagged Assignments
  const checkFlaggedAssignments = async (processedAssignments) => {
    const gradesCollection = collection(db, 'grades');
    const flaggedSet = new Set();
    for (const assignment of processedAssignments) {
      const flaggedQuery = query(
        gradesCollection,
        where('assignmentId', '==', assignment.id),
        where('classId', '==', classId),
        
      where('hasFlaggedQuestions', '==', true)
      );
      try {
        const snapshot = await getCountFromServer(flaggedQuery);
        if (snapshot.data().count > 0) {
          flaggedSet.add(assignment.id);
        }
      } catch (error) {
        console.error("Error checking flagged responses:", error);
      }
    }
    setFlaggedAssignments(flaggedSet);
  };

  // Updated fetchAssignments Function
  const fetchAssignments = async () => {
    try {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);

      if (classDoc.exists()) {
        const data = classDoc.data();
        const assignmentsData = data.assignments || [];
        const viewableAssignments = data.viewableAssignments || [];

        // Process assignments with all needed data
        const processedAssignments = assignmentsData.map((assignment) => {
          const id = assignment.id;
          const [baseId, timestamp, format] = id.split('+');
          const parsedTimestamp = parseInt(timestamp);

          return {
            id,
            name: assignment.name,
            format,
            timestamp: parsedTimestamp,
            date: formatDate(parsedTimestamp),
            average: assignment.average ? Number(assignment.average) : 0,
            viewable: viewableAssignments.includes(id)
          };
        });

        // Check for flagged assignments
        await checkFlaggedAssignments(processedAssignments);

        // Calculate overall class average
        const assignmentsWithAverages = processedAssignments.filter(a => a.average > 0);
        const totalAverage = assignmentsWithAverages.length > 0
          ? assignmentsWithAverages.reduce((sum, curr) => sum + curr.average, 0) / assignmentsWithAverages.length
          : 0;

        setClassAverage(Math.round(totalAverage));

        // Sort assignments by timestamp descending
        const sortedAssignments = processedAssignments.sort(
          (a, b) => b.timestamp - a.timestamp
        );

        setAssignments(sortedAssignments);
        setRecentAssignments(sortedAssignments.slice(0, 3));

        const performanceData = sortedAssignments
          .filter(assignment => assignment.average > 0)
          .map(assignment => ({
            name: assignment.name,
            average: Number(assignment.average),
            date: formatDate(assignment.timestamp)
          }));

        setClassPerformance(performanceData);

        // Process join requests...
        if (Array.isArray(data.joinRequests)) {
          const joinRequestPromises = data.joinRequests.map(async (requestUID) => {
            const studentDoc = await getDoc(doc(db, 'students', requestUID));
            if (studentDoc.exists()) {
              const studentData = studentDoc.data();
              return {
                uid: requestUID,
                name: `${studentData.firstName.trim()} ${studentData.lastName.trim()}`,
                email: studentData.email
              };
            }
            return null;
          });

          const processedJoinRequests = (await Promise.all(joinRequestPromises))
            .filter(Boolean);

          setClassData(prev => ({
            ...prev,
            ...data,
            joinRequests: processedJoinRequests
          }));
        } else {
          setClassData(prev => ({
            ...prev,
            ...data,
            joinRequests: []
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Updated getDisplayedAssignments Function
  const getDisplayedAssignments = () => {
    switch(activeTab) {
      case 'recent':
        return assignments.slice(0, 3);
      case 'reviewable':
        return assignments.filter(a => a.viewable);
      case 'flagged':
        return assignments.filter(a => flaggedAssignments.has(a.id));
      default:
        return [];
    }
  };
  // Updated Tab Count Logic in Rendering
  const renderTabs = () => (
    <div style={{
      display: 'flex',
      zIndex: '10',
      gap: '20px',
      marginTop: '0px',
      marginBottom: '0px',
    }}>
      {['recent', 'reviewable', 'flagged'].map(tab => {
        // Get count based on tab type
        let count = 0;
        if (tab !== 'recent') { // Don't show count for recent tab
          switch(tab) {
            case 'reviewable':
              count = assignments.filter(a => a.viewable).length;
              break;
            case 'flagged':
              count = flaggedAssignments.size;
              break;
            default:
              count = 0;
          }
        }

        return (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '600',
              padding: '12px 10px',
              fontFamily: "'Montserrat', sans-serif",
              borderBottom: activeTab === tab ? '2px solid #E01FFF' : '2px solid transparent',
              color: activeTab === tab ? '#E01FFF' : 'grey',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>
            {tab === 'recent' ? 'Recent' :
               tab === 'reviewable' ? 'Open For Review' :
               tab === 'flagged' ? 'Flagged Questions' : 
               ''}
            </span>
            {count > 0 && (
              <span style={{
                background: 'red',
                color:  'white',
                padding: '0px 2px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                minWidth: '20px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  // Handle Assignment Click
  const handleAssignmentClick = (assignment) => {
    const path = `/class/${classId}/assignment/${assignment.id}/`;
    
    switch(assignment.format) {
      case 'AMCQ':
        navigate(path + 'TeacherResultsAMCQ');
        break;
      case 'MCQ':
        navigate(path + 'TeacherResultsMCQ');
        break;
      case 'ASAQ':
        navigate(path + 'TeacherResultsASAQ');
        break;
      case 'SAQ':
        navigate(path + 'TeacherResults');
        break;
      default:
        console.error('Unknown format:', assignment.format);
    }
  };
  const renderAssignmentList = (assignmentsList) => {
    return (
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', flexWrap: 'wrap', marginTop: '' }}>
        {assignmentsList.map((assignment, index) => {
            const gradeStyle = getGradeColors(assignment.average);
            const hasFlaggedResponses = flaggedAssignments.has(assignment.id);
          
            return (
              <div
                key={assignment.id}
                onClick={() => handleAssignmentClick(assignment)}
                style={{
                  padding: '25px 0px',
                  backgroundColor: 'white',
                  width: '100%',
                  borderBottom: '1px solid #ededed',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  
                animationDelay: `${index * 0.1}s`
                  
                }}
              >
                <span style={{
                  fontWeight: '600',
                  marginLeft: '6.15%',
                  fontFamily: "'Montserrat', sans-serif"
                }}>
                  {assignment.name}
                </span>
                <span style={{position: 'absolute', right: 'calc(6.15% + 70px)', color: 'lightgrey'}}>{assignment.date ? `${assignment.date}` : 'N/A'}</span>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  position: 'absolute', right: 'calc(6.15%)',
                  color: assignment.format.includes('MCQ') ? '#29DB0B' : '#020CFF'
                }}>
                  {assignment.format}
                </span>
                {hasFlaggedResponses && <Flag size={16} color="red"  style={{position: 'absolute', right: 'calc(6.15% + 300px)'}}/>}
                {assignment.viewable && <Eye size={16} color="#020CFF" style={{position: 'absolute', right: 'calc(6.15% + 250px)'}}/>}
                <span style={{ 
  fontWeight: '500',
  position: 'absolute', 
  right: 'calc(6.15% + 180px)',
  background: assignment.average ? gradeStyle.background : 'white',
  padding: '5px',
  borderRadius: '5px',
  width: '40px',
  textAlign: 'center',
  marginTop: '-5px',
  color: assignment.average ? gradeStyle.color : '#858585'
}}>
  {assignment.average ? `${assignment.average}%` : '-'}
</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Handle Admitting a Student
  const handleAdmitStudent = async (student) => {
    try {
      const classRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classRef);
  
      if (!classDoc.exists()) {
        console.error("Class document does not exist");
        return;
      }
  
      const currentData = classDoc.data();
  
      const isAlreadyParticipant = currentData.participants?.some(p => p.uid === student.uid);
      if (isAlreadyParticipant) {
        console.log("Student is already a participant");
        return;
      }
  
      // Add student to participants
      const updatedParticipants = [...(currentData.participants || []), {
        uid: student.uid,
        name: student.name,
        email: student.email
      }];
  
      // Update students array
      const updatedStudents = [...(currentData.students || []), student.uid];
  
      // Update joinRequests
      const updatedJoinRequests = (currentData.joinRequests || [])
        .filter(uid => uid !== student.uid);
  
      // Sort participants by last name
      updatedParticipants.sort((a, b) => 
        a.name.split(' ').pop().localeCompare(b.name.split(' ').pop())
      );
  
      await updateDoc(classRef, {
        participants: updatedParticipants,
        joinRequests: updatedJoinRequests,
        students: updatedStudents
      });
  
      // Update local state
      setClassData(prev => ({
        ...prev,
        participants: updatedParticipants,
        joinRequests: prev.joinRequests.filter(req => req.uid !== student.uid),
        students: updatedStudents
      }));
  
    } catch (error) {
      console.error("Error admitting student:", error);
    }
  };

  // Handle Rejecting a Student
  const handleRejectStudent = async (studentUID) => {
    try {
      const classRef = doc(db, 'classes', classId);
      const updatedJoinRequests = classData.joinRequests.filter(req => req.uid !== studentUID);

      await updateDoc(classRef, {
        joinRequests: updatedJoinRequests.map(req => req.uid)
      });

      setClassData(prev => ({
        ...prev,
        joinRequests: updatedJoinRequests
      }));
    } catch (error) {
      console.error("Error rejecting student:", error);
    }
  };

  // Render Content Based on Active Tab
  const renderContent = () => {
    if (activeTab === 'joinRequests') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {classData.joinRequests?.length > 0 ? (
            classData.joinRequests.map(student => (
          ''
            ))
          ) : (
           ''
          )}
        </div>
      );
    }
    
    return renderAssignmentList(getDisplayedAssignments());
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      backgroundColor: 'white',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      <Navbar userType="teacher" />

      {/* Header */}
      <div style={{
        width: 'calc(100% - 200px)',
        marginLeft: '200px',
        borderBottom: '1px solid lightgrey',
        height: '100px',
        position: 'fixed',
        top: '0px',
        zIndex: '50',
        background: 'rgb(255,255,255,.9)',
        backdropFilter: 'blur(5px)'
      }}>
        <h1 style={{
          fontSize: '30px',
          fontFamily: "'Montserrat', sans-serif",
          color: 'black',
          marginBottom: '20px',
          marginLeft: '4%',
        }}>
          Dashboard
        </h1>

        {/* Class Average Display */}
     

        {/* Tabs */}
       
      </div>

      {/* Main Content */}
   

      {/* Additional Main Content Sections */}
      <div style={{
        display: 'flex',
        padding: '0px 0px 0px 4%',
        gap: '40px',
        marginTop: '100px',
        marginLeft: '200px',
        width: 'calc(96% - 200px)'
      }}>
        {/* Recent Assignments */}
      
        {/* Right Side - Performance Graph */}
        <div style={{   
          width: '75%', 
          borderRight: '1px solid #ededed', 
          position: 'relative',  
          paddingTop: '10px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '30px',
            fontFamily: "'Montserrat', sans-serif",
            color: '#E01FFF',
            borderLeft: '4px solid #E01FFF', 
            paddingLeft: '10px'
          }}>
            Class Performance
          </h2>
          <div style={{ height: '300px', width: '95%', marginLeft: '-30px',  }}>

          <div style={{
  fontSize: '25px',
  fontWeight: '600',
  width: '80px',
  height: '40px',
  position: 'absolute',
  background: classAverage ? getGradeColors(classAverage).background : 'white',
  borderRadius: '10px',
  top: '20px',
  right: '20px',
  textAlign: 'center',
  lineHeight: '40px',
  color: classAverage ? getGradeColors(classAverage).color : '#858585'
}}> 
  {classAverage ? `${classAverage}%` : '-'}
</div>
  <ResponsiveContainer>
    <LineChart data={classPerformance}>
      <CartesianGrid strokeDasharray="3 3" stroke="#ededed" />
      <XAxis
        dataKey="name"
        tick={false}  // This removes the bottom labels
        stroke="lightgrey"
        height={20}   // Reduced height since we don't need space for labels
      />
      <YAxis
        domain={[40, 100]}
        stroke="lightgrey"
        ticks={[40, 50, 60, 70, 80, 90, 100]}
        axisLine={true}
      />
      <Tooltip
        content={({ active, payload }) => {
          if (active && payload && payload.length) {
            const data = payload[0].payload;
            const gradeStyle = getGradeColors(data.average);
            return (
              <div style={{
                padding: '5px 15px',
                borderRadius: '10px',
                backgroundColor: 'white',
                cursor: 'pointer',
                border: '1px solid #ededed',
                boxShadow: 'rgba(50, 50, 205, 0.10) 0px 2px 5px 0px, rgba(0, 0, 0, 0.05) 0px 1px 1px 0px',
              }}>
              <p style={{ fontWeight: '600', marginBottom: '5px' }}>{data.name}</p>
          <div style={{display: 'flex'}}>
            <p style={{ color: 'grey', marginBottom: '5px' }}>{data.date}</p>
            <p style={{ 
              marginLeft: '20px',
              color: data.average ? gradeStyle.color : '#858585',
              background: data.average ? gradeStyle.background : 'white',
              padding: '2px 8px',
              borderRadius: '5px',
            }}>
              {data.average ? `${data.average}%` : '-'}
            </p> </div>
              </div>
            );
          }
          return null;
        }}
      />
      <Line
        type="monotone"
        dataKey="average"
        stroke="#E01FFF"
        strokeWidth={2}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
        connectNulls={true}
      />
    </LineChart>
  </ResponsiveContainer>

          </div>
          {renderTabs()}
         






          <div style={{borderTop: "1px solid lightgrey", marginLeft: '-7%'}}>
            
            {renderContent()}
            </div>
        </div>


        <div style={{width: '30%',  marginLeft: '-40px'}}>
        <div style={{height:' 100px', borderBottom: '1px solid lightgrey'}}>

        <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginLeft: '8%',
            marginBottom: '30px',
            display: 'flex',
            fontFamily: "'Montserrat', sans-serif",
            color: '#E01FFF',
            borderLeft: '4px solid #E01FFF', 
            paddingLeft: '10px'
          }}>
            Join Code 
            
       
          </h2>


          <div style={{
            fontSize: '40px',
            marginTop: '20px',
            width: '210px',
            height: "25px",
            paddingLeft: '20px',
            display: 'flex',
            color: '#E01FFF',
            lineHeight: '20px',
            background: '#F8CBFF',
            marginRight: 'auto',
            fontFamily: "'montserrat', sans-serif",
            fontWeight: '600',
            marginLeft: '8%'
          }}>

          {classData.classCode}
            <CopyLinkButton
  classCode={classData.classCode}
  className={classData.className}
  classChoice={classData.classChoice}
/>


</div>

</div>

<div style={{ width: '77%', alignItems: 'center', gap: '20px', marginLeft: '7%', height: 'calc(100vh - 240px)' }}>
      <div
        onClick={() => navigate(`/class/${classId}/assignments`)}
        style={{
          alignItems: 'left',
          gap: '10px',
          border: '1px solid #ededed',
          position: 'relative',
          padding: '15px 15px',
          marginTop: '20px',
          borderRadius: '15px',
          boxShadow: 'rgba(50, 50, 205, 0.05) 0px 2px 5px 0px, rgba(0, 0, 0, 0.05) 0px 1px 1px 0px',
          cursor: 'pointer',
          height: '80px'
        }}
      >
        <div style={{ display: 'flex', height: '35px', color: 'blue',  }}>
          <BookOpenText size={35} />
          <h1 style={{
            color: 'black',
            fontWeight: '600',
            fontSize: '30px',
            borderRadius: '10px',
            marginTop: '0px',
            marginLeft: '20px'
          }}>
            {assignments?.length || 0}
          </h1>
        </div>
        <h1 style={{
          color: 'grey',
          fontWeight: '500',
          fontSize: '20px',
          marginTop: '20px',
          position: 'absolute'
        }}>
          Assignments
        </h1>
      </div>

      <div
        onClick={() => navigate(`/class/${classId}/participants`)}
        style={{
          alignItems: 'left',
          gap: '10px',
          border: '1px solid #ededed',
          position: 'relative',
          padding: '15px 15px',
          marginTop: '20px',
          borderRadius: '15px',
          boxShadow: 'rgba(50, 50, 205, 0.05) 0px 2px 5px 0px, rgba(0, 0, 0, 0.05) 0px 1px 1px 0px',
          cursor: 'pointer',
          height: '80px'
        }}
      >
        <div style={{ display: 'flex', height: '35px', color: '#FFAE00' }}>
          <Users size={35} />
          <h1 style={{
            color: 'black',
            fontWeight: '600',
            fontSize: '30px',
            borderRadius: '10px',
            marginTop: '0px',
            marginLeft: '20px'
          }}>
            {classData.students?.length || 0}
          </h1>
        </div>
        <h1 style={{
          color: 'grey',
          fontWeight: '500',
          fontSize: '20px',
          marginTop: '20px',
          position: 'absolute'
        }}>
          Students
        </h1>
      </div>

      <div
        onClick={() => navigate(`/class/${classId}/assignments`)}
        style={{
          alignItems: 'left',
          gap: '10px',
          border: '1px solid #ededed',
          position: 'relative',
          padding: '15px 15px',
          marginTop: '20px',
          borderRadius: '15px',
          boxShadow: 'rgba(50, 50, 205, 0.05) 0px 2px 5px 0px, rgba(0, 0, 0, 0.05) 0px 1px 1px 0px',
          cursor: 'pointer',
          height: '80px'
        }}
      >
        <div style={{ display: 'flex', height: '35px', color: 'grey' }}>
          <PencilRuler size={35} />
          <h1 style={{
            color: 'black',
            fontWeight: '600',
            fontSize: '30px',
            borderRadius: '10px',
            marginTop: '0px',
            marginLeft: '20px'
          }}>
            {classData.drafts?.length || 0}
          </h1>
        </div>
        <h1 style={{
          color: 'grey',
          fontWeight: '500',
          fontSize: '20px',
          marginTop: '20px',
          position: 'absolute'
        }}>
          Drafts
        </h1>
      </div>

      <div
        onClick={() => navigate(`/class/${classId}/assignments`)}
        style={{
          alignItems: 'left',
          gap: '10px',
          border: '1px solid #ededed',
          position: 'relative',
          padding: '15px 15px',
          marginTop: '20px',
          borderRadius: '15px',
          boxShadow: 'rgba(50, 50, 205, 0.05) 0px 2px 5px 0px, rgba(0, 0, 0, 0.05) 0px 1px 1px 0px',
          cursor: 'pointer',
          height: '80px'
        }}
      >
        <div style={{ display: 'flex', height: '35px', color: '#38BFB8' }}>
          <Folder size={35} />
          <h1 style={{
            color: 'black',
            fontWeight: '600',
            fontSize: '30px',
            borderRadius: '10px',
            marginTop: '0px',
            marginLeft: '20px'
          }}>
            {classData.Folders?.length || 0}
          </h1>
        </div>
        <h1 style={{
          color: 'grey',
          fontWeight: '500',
          fontSize: '20px',
          marginTop: '20px',
          position: 'absolute'
        }}>
          Folders
        </h1>
      </div>
    </div>
    </div>


        
      </div>

    


    </div>
  );
};

export default TeacherClassHome;
