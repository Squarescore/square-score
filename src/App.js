import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import Auth from './components/Auth';
import LogIn from './components/LogIn';
import Loader from './components/Loader';
import SignUp from './components/SignUp';
import StudentHome from './components/StudentHome';
import TakeMCQ from './components/TakeMCQ';
import TeacherHome from './components/TeacherHome';
import AdminHome from './components/AdminHome';
import TeacherClassHome from './components/TeacherClassHome';
import TeacherAssignmentHome from './components/TeacherAssignmentHome';
import CreateAssignment from './components/CreateSAQ';
import SAQA from './components/CreateASAQ';
import Participants from './components/Participants';
import Assignments from './components/TeacherAssignments';
import TeacherReview from './components/TeacherReview';
import TeacherPreview from './components/PreviewSAQ';
import CreateClass from './components/CreateClass';
import JoinClass from './components/JoinClass';
import TeacherHomeWaitlist from './components/TeacherHomeWaitlist';
import StudentAssignments from './components/StudentAssignments';
import TakeTest from './components/TakeSAQ';
import TeacherStudentResults from './components/TeacherStudentResults';
import SelectStudents from './components/SelectStudents';
import TeacherResults from './components/ResultsSAQ';
import StudentResultsMCQ from './components/StudentResultsMCQ';
import TeacherStudentResultsMCQ from './components/TeacherStudentResultsMCQ';
import TeacherStudentResultsAMCQ from './components/TeacherStudentResultsAMCQ';
import StudentResults from './components/StudentResults';
import TeacherResultsAMCQ from './components/ResultsAMCQ';
import TeacherPreviewASAQ from './components/PreviewASAQ';
import { doc, getDoc } from "firebase/firestore"; // Importing from Firestore
import { db, storage } from './components/firebase';
import MCQ from './components/CreateMCQ';
import { signOut } from 'firebase/auth';
import StudentResultsAMCQ from './components/StudentResultsAMCQ';
import TestPage  from './components/TestPage';
import TermsOfService from './components/TermsofService';
import MCQA from './components/CreateAMCQ';
import TeacherStudentGrades from './components/TeacherStudentGrades';
import TakeASAQ from './components/TakeASAQ';
import TakeAmcq from './components/TakeAmcq';
import TeacherResultsASAQ from './components/ResultsASAQ';
import PrivacyPolicy from './components/PrivacyPolicy';
import TeacherResultsMCQ from './components/ResultsMCQ';
import AdminUB from './components/AdminUB';
import TeacherLogs from './components/TeacherLogs';
import SignUpAdmin from './components/SignUpAdmin';
function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // State for storing user role
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSignOut = () => {
    const auth = getAuth();
    signOut(auth);
    setUser(null);
  }

  const handleUnauthenticatedRoute = () => {
    if (user) {
      handleSignOut();
    }
  };
  useEffect(() => {
    const auth = getAuth();

    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        return onAuthStateChanged(auth, (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
            
          } else {
            setUser(null);
            setUserRole(null);
          }
        });
      })
      .catch((error) => {
        console.error("Error in persistence setting", error);
      });
  }, []);
  
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        setLoading(true);
        let userDocRef = doc(db, 'students', user.uid);
        let userProfile = await getDoc(userDocRef);

        if (!userProfile.exists()) {
          userDocRef = doc(db, 'teachers', user.uid);
          userProfile = await getDoc(userDocRef);
          
          if (!userProfile.exists()) {
            userDocRef = doc(db, 'admin', user.uid);
            userProfile = await getDoc(userDocRef);
          }
        }

        if (userProfile.exists()) {
          const userData = userProfile.data();
          if (userDocRef.path.startsWith('students')) {
            setUserRole('student');
          } else if (userDocRef.path.startsWith('teachers')) {
            setUserRole('teacher');
            setHasAccess(userData.hasAccess === true);
          } else if (userDocRef.path.startsWith('admin')) {
            setUserRole('admin');
          }
        }
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);


  if (user && userRole === 'teacher' && hasAccess === null) {
    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div className="lds-ripple"><div></div><div></div></div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Radio Canada', sans-serif"}}>
    <Router>
      
      {user ? (
          userRole ? ( 
           
            <Routes>
         {userRole === 'teacher' && hasAccess === false ? (
                <Route path="*" element={<TeacherHomeWaitlist />} />
              ) : (
                <>
                  <Route 
                    path="/" 
                    element={
                      <Navigate 
                        to={
                          userRole === 'student' 
                            ? "/studenthome" 
                            : userRole === 'teacher' 
                              ? (hasAccess ? "/teacherhome" : "/teacher-waitlist")
                              : "/adminhome"
                        } 
                      />
                    } 
                  />
                        <Route path="/adminhome" element={<AdminHome />} />
               
            <Route 
              path="/login" 
              element={
                <Navigate 
                  to={
                    userRole === 'student' 
                      ? "/studenthome" 
                      : userRole === 'teacher' 
                        ? (hasAccess ? "/teacherhome" : "/teacher-waitlist")
                        : "/adminhome"
                  } 
                />
              } 
            />
            <Route 
              path="/signup" 
              element={
                <Navigate 
                  to={
                    userRole === 'student' 
                      ? "/studenthome" 
                      : userRole === 'teacher' 
                        ? (hasAccess ? "/teacherhome" : "/teacher-waitlist")
                        : "/adminhome"
                  } 
                />
              } 
            />
 <Route path="/termsofservice" element={<TermsOfService />} />
 <Route path="/privacyPolicy" element={<PrivacyPolicy />} />

 <Route path="/adminhome" element={<AdminHome />} />
                
 <Route path="/admin-ub" element={<AdminUB />} />
 <Route path="/teacher-logs/:teacherId" element={<TeacherLogs />} /> {/* Implement this component separately */}
   
        <Route path="/class/:classId/teacherassignmenthome" element={<TeacherAssignmentHome currentPage="Grades"/>} />
        <Route path="/class/:classId/createassignment/:assignmentId" element={<CreateAssignment currentPage="Create"/>} />
        
        <Route path="/class/:classId/SAQA/:assignmentId" element={<SAQA currentPage="Create"/>} />
        <Route path="/class/:classId/MCQ/:assignmentId" element={<MCQ currentPage="Create"/>} />
        <Route path="/class/:classId/MCQA/:assignmentId" element={<MCQA currentPage="Create"/>} />
        <Route path="/class/:classId/teacherpreview" element={<TeacherPreview currentPage="Create"/>} />
        <Route path="/class/:classId/teacherpreviewASAQ" element={<TeacherPreviewASAQ currentPage="Create"/>} />
        <Route path="/class/:classId/selectstudents" element={<SelectStudents currentPage="Create"/>} />




        <Route path="/class/:classId/Assignments" element={<Assignments currentPage="Grades"/>} />
        <Route path="/class/:classId/student/:studentUid/grades" element={<TeacherStudentGrades currentPage="Grades"/>} />
        <Route path="/teacherStudentResults/:assignmentId/:studentUid/:classId" element={<TeacherStudentResults currentPage="Grades"/>} />
        <Route path="/teacherStudentResultsMCQ/:assignmentId/:studentUid/:classId" element={<TeacherStudentResultsMCQ currentPage="Grades"/>} />
        <Route path="/teacherStudentResultsAMCQ/:assignmentId/:studentUid/:classId" element={<TeacherStudentResultsAMCQ currentPage="Grades"/>} />
        
        <Route path="/class/:classId/assignment/:assignmentId/TeacherResults" element={<TeacherResults />} />
        <Route path="/class/:classId/assignment/:assignmentId/TeacherResultsASAQ" element={<TeacherResultsASAQ />} />
        <Route path="/class/:classId/assignment/:assignmentId/TeacherResultsAMCQ" element={<TeacherResultsAMCQ />} />
        
        <Route path="/class/:classId/assignment/:assignmentId/TeacherResultsMCQ" element={<TeacherResultsMCQ />} />
        <Route path="/teacherReview/:classId/:assignmentId" element={<TeacherReview currentPage="Grades"/>} />
        

        <Route path="/class/:classId/participants" element={<Participants currentPage="Participants"/>} />


        <Route path="/class/:classId" element={<TeacherClassHome />} />

        <Route path="/teacherhome" element={<TeacherHome />} />
        <Route path="/adminhome" element={<AdminHome />} />

        <Route path="/createclass" element={<CreateClass />} />




        
            <Route path="/studenthome" element={<StudentHome />} />
            <Route path="/testPage" element={<TestPage />} />
        <Route path="/studentassignments/:classId" element={<StudentAssignments />} />
        <Route path="/taketests/:assignmentId" element={<TakeTest />} />
        
        <Route path="/takeMCQ/:assignmentId" element={<TakeMCQ/>} />
        <Route path="/takeASAQ/:assignmentId" element={<TakeASAQ/>} />
        <Route path="/takeAmcq/:assignmentId" element={<TakeAmcq/>} />
        <Route path="/joinclass" element={<JoinClass />} />  
        <Route path="/studentresults/:assignmentId/:studentUid/:classId" element={<StudentResults/>} />
        <Route path="/studentresultsAMCQ/:assignmentId/:studentUid/:classId" element={<StudentResultsAMCQ/>} />
        
        <Route path="/studentresultsMCQ/:assignmentId/:studentUid/:classId" element={<StudentResultsMCQ/>} />
        </>
            )}
        </Routes>
        ) : (
          <div style={{position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',}}>    <div class="lds-ripple"><div></div><div></div></div></div> // Or some loading indicator
        )
      ) : (
        <Routes>
          {/* Routes for unauthenticated users */}
        
          <Route
            path="/"
            element={<Auth />}
            onEnter={handleUnauthenticatedRoute} 
          />
            <Route path="/termsofservice" element={<TermsOfService />} 
            />
            
            <Route path="/privacyPolicy" element={<PrivacyPolicy />} />
          <Route
            path="/login"
            element={<LogIn />} 
            onEnter={handleUnauthenticatedRoute}
          />
          <Route
            path="/signup"
            element={<SignUp />}
            onEnter={handleUnauthenticatedRoute} />
             <Route
            path="/signupadmin"
            element={<SignUpAdmin />}
            onEnter={handleUnauthenticatedRoute} />
        </Routes>
        
      )}
    </Router>
    </div>
  );
}

export default App;




