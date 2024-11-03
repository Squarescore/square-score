import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import Auth from './components/unAuthenticated/Auth';
import LogIn from './components/unAuthenticated/LogIn';
import Loader from './components/Universal/Loader';
import SignUp from './components/unAuthenticated/SignUp';
import StudentHome from './components/Students/StudentHome';
import TakeMCQ from './components/Students/TakeAssignments/TakeMCQ';
import TeacherHome from './components/Teachers/TeacherHome/TeacherHome';
import AdminHome from './components/Admin/AdminHome';
import TeacherClassHome from './components/Teachers/TeacherClassHome';
import TeacherAssignmentHome from './components/Teachers/TeacherAssignments/TeacherAssignmentHome';
import CreateAssignment from './components/Teachers/Create/CreateSAQ';
import SAQA from './components/Teachers/Create/CreateASAQ';
import Participants from './components/Teachers/Participants';
import Assignments from './components/Teachers/TeacherAssignments/TeacherAssignments';
import TeacherReview from './components/Teachers/Results/TeacherReview';
import TeacherPreview from './components/Teachers/Create/PreviewSAQ';
import TeacherHomeWaitlist from './components/Teachers/TeacherHome/TeacherHomeWaitlist';
import StudentAssignments from './components/Students/StudentAssignments';
import TakeTest from './components/Students/TakeAssignments/TakeSAQ';
import TeacherStudentResults from './components/Teachers/Results/TeacherStudentView/TeacherStudentResults';
import SelectStudents from './components/Teachers/Create/SelectStudents';
import TeacherResults from './components/Teachers/Results/ResultsSAQ';
import StudentResultsMCQ from './components/Students/Results/StudentResultsMCQ';
import TeacherStudentResultsMCQ from './components/Teachers/Results/TeacherStudentView/TeacherStudentResultsMCQ';
import TeacherStudentResultsAMCQ from './components/Teachers/Results/TeacherStudentView/TeacherStudentResultsAMCQ';
import StudentResults from './components/Students/Results/StudentResults';
import TeacherResultsAMCQ from './components/Teachers/Results/ResultsAMCQ';
import TeacherPreviewASAQ from './components/Teachers/Create/PreviewASAQ';
import { doc, getDoc } from "firebase/firestore"; // Importing from Firestore
import { db, storage } from './components/Universal/firebase';
import MCQ from './components/Teachers/Create/CreateMCQ';
import { signOut } from 'firebase/auth';
import StudentResultsAMCQ from './components/Students/Results/StudentResultsAMCQ';
import TestPage  from './components/Universal/TestPage';
import TermsOfService from './components/Universal/TermsofService';
import MCQA from './components/Teachers/Create/CreateAMCQ';
import TeacherStudentGrades from './components/Teachers/Results/TeacherStudentView/TeacherStudentGrades';
import TakeASAQ from './components/Students/TakeAssignments/TakeASAQ';
import TakeAmcq from './components/Students/TakeAssignments/TakeAmcq';
import TeacherResultsASAQ from './components/Teachers/Results/ResultsASAQ';
import PrivacyPolicy from './components/Universal/PrivacyPolicy';
import TeacherResultsMCQ from './components/Teachers/Results/ResultsMCQ';
import AdminUB from './components/Admin/AdminUB';
import TeacherLogs from './components/Admin/TeacherLogs';
import SignUpAdmin from './components/unAuthenticated/SignUpAdmin';
import PageNotFound from './components/Universal/PageNotFound'; // Import the PageNotFound component
import QuestionResults from './components/Teachers/Results/QuestionResultsSAQ';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // State for storing user role
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true); // For authentication state loading

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
          setAuthLoading(false); // Set authLoading to false here
        });
      })
      .catch((error) => {
        console.error("Error in persistence setting", error);
        setAuthLoading(false); // Ensure authLoading is false even if there's an error
      });
  }, []);
  
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


  if (authLoading || (user && loading)) {
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
        {/* Or use your Loader component */}
        {/* <Loader /> */}
      </div>
    );
  }

  // If teacher's access is null, show loader
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
    <div style={{ fontFamily: "'montserrat', sans-serif"}}>
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
        
        <Route path="/questionResults/:assignmentId/:questionId" element={<QuestionResults  />} />
        
        <Route path="/class/:classId/assignment/:assignmentId/TeacherResults" element={<TeacherResults />} />
        <Route path="/class/:classId/assignment/:assignmentId/TeacherResultsASAQ" element={<TeacherResultsASAQ />} />
        <Route path="/class/:classId/assignment/:assignmentId/TeacherResultsAMCQ" element={<TeacherResultsAMCQ />} />
        
        <Route path="/class/:classId/assignment/:assignmentId/TeacherResultsMCQ" element={<TeacherResultsMCQ />} />
        <Route path="/teacherReview/:classId/:assignmentId" element={<TeacherReview currentPage="Grades"/>} />
        

        <Route path="/class/:classId/participants" element={<Participants currentPage="Participants"/>} />


        <Route path="/class/:classId" element={<TeacherClassHome />} />

        <Route path="/teacherhome" element={<TeacherHome />} />
        <Route path="/adminhome" element={<AdminHome />} />





        
            <Route path="/studenthome" element={<StudentHome />} />
            <Route path="/testPage" element={<TestPage />} />
        <Route path="/studentassignments/:classId" element={<StudentAssignments />} />
        <Route path="/taketests/:assignmentId" element={<TakeTest />} />
        
        <Route path="/takeMCQ/:assignmentId" element={<TakeMCQ/>} />
        <Route path="/takeASAQ/:assignmentId" element={<TakeASAQ/>} />
        <Route path="/takeAmcq/:assignmentId" element={<TakeAmcq/>} />
       <Route path="/studentresults/:assignmentId/:studentUid/:classId" element={<StudentResults/>} />
        <Route path="/studentresultsAMCQ/:assignmentId/:studentUid/:classId" element={<StudentResultsAMCQ/>} />
        
        <Route path="/studentresultsMCQ/:assignmentId/:studentUid/:classId" element={<StudentResultsMCQ/>} />
        <Route path="*" element={<PageNotFound />} />
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
             <Route path="*" element={<PageNotFound />} />
        </Routes>
        
      )}
    </Router>
    </div>
  );
}

export default App;




