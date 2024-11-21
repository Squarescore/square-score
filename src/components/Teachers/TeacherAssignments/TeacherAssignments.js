


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../../Universal/firebase';
import Navbar from '../../Universal/Navbar';
import TeacherAssignmentHome from './TeacherAssignmentHome'; // Ensure this component handles creating assignments
import Tooltip from './AssignmentsToolTip';
import {
  FolderPlus,
  SquarePlus,
  PencilRuler,
  Search,
  Eye,
  SquareArrowLeft,
  SquareX,
  Folder,
  BookOpenText,
  Flag,
} from 'lucide-react';
import CreateFolder from './CreateFolder';
import SearchToggle from './SearchToggle';
import Folders from './Folders';
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

function Assignments() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'published';
  });
  const [assignments, setAssignments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showAddAssignmentsModal, setShowAddAssignmentsModal] = useState(false);
  const [folderAssignments, setFolderAssignments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [newFolderColor, setNewFolderColor] = useState(pastelColors[0]);

  // Formatting Functions
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    // If timestamp is a string (from assignment ID), parse it
    if (typeof timestamp === 'string') {
      const parts = timestamp.split('+');
      if (parts.length > 1) {
        timestamp = parts[1]; // Extract timestamp portion from ID
      }
    }
    
    // Convert to number if it's a string
    const timeNum = parseInt(timestamp);
    if (isNaN(timeNum)) return '';
    
    const date = new Date(timeNum);
    if (isNaN(date)) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };
  
  // Fetch Functions
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchAssignments();
        await fetchFolders();
        await fetchDrafts();

        if (location.state?.showDrafts) {
          setActiveTab('drafts');
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Handle Escape key for modals
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setShowFolderForm(false);
        setSelectedFolder(null);
        setShowAddAssignmentsModal(false);
        setShowCreateModal(false);
      }
    };

    window.addEventListener('keydown', handleEscKey);

    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [classId, location.state]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const getGradeColors = (grade) => {
    if (grade === undefined || grade === null || grade === 0) return { color: '#858585', background: 'white' };
    if (grade < 50) return { color: '#FF0000', background: '#FFCBCB' };
    if (grade < 70) return { color: '#FF4400', background: '#FFC6A8' };
    if (grade < 80) return { color: '#EFAA14', background: '#FFF4DC' };
    if (grade < 90) return { color: '#9ED604', background: '#EDFFC1' };
    if (grade > 99) return { color: '#E01FFF', background: '#F7C7FF' };
    return { color: '#2BB514', background: '#D3FFCC' };
  };
  
  // Add state for flagged assignments
  const [flaggedAssignments, setFlaggedAssignments] = useState(new Set());
  
  // Add the checkFlaggedAssignments function
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
  
  // Update the fetchAssignments function to include average and check for flagged
  const fetchAssignments = async () => {
    try {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);
  
      if (classDoc.exists()) {
        const data = classDoc.data();
        const assignmentsData = data.assignments || [];
        const viewableAssignments = data.viewableAssignments || [];
  
        const processedAssignments = assignmentsData.map((assignment) => {
          const id = assignment.id;
          const name = assignment.name;
          const timestamp = id.split('+')[1];
          const format = id.split('+')[2];
          return {
            id,
            name: assignment.name,
            
            type: format,
            timestamp,
            date: new Date(parseInt(timestamp)),
            average: assignment.average ? Number(assignment.average) : 0,
            viewable: viewableAssignments.includes(id)
          };
        });
  
        await checkFlaggedAssignments(processedAssignments);
  
        const sortedAssignments = processedAssignments.sort(
          (a, b) => b.timestamp - a.timestamp
        );
  
        setAssignments(sortedAssignments);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };
  const fetchFolders = async () => {
    try {
      const classDocRef = doc(db, 'classes', classId);
      const classDocSnap = await getDoc(classDocRef);
      if (classDocSnap.exists()) {
        const foldersData = classDocSnap.data().folders || [];
        console.log('Fetched Folders Data:', foldersData); // Add this line
        setFolders(foldersData);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };
  
  const fetchDrafts = async () => {
    try {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);

      if (classDoc.exists()) {
        const data = classDoc.data();
        const draftsData = data.drafts || [];

        const fetchedDrafts = draftsData.map((draft) => {
          const id = draft.id;
          const name = draft.name;

          const parts = id.split('+');
          const timestamp = parseInt(parts[1]);
          const format = parts[2];

          return {
            id,
            name,
            type: format,
            date: new Date(timestamp),
          };
        });

        const sortedDrafts = fetchedDrafts.sort(
          (a, b) => b.date - a.date
        );

        setDrafts(sortedDrafts);
      }
    } catch (error) {
      console.error("Error fetching drafts:", error);
    }
  };

  // Handle sorting/tab selection
  const handleSortClick = (type) => {
    setActiveTab(type);
    setSelectedFolder(null);
    setSearchTerm('');
  };

  // Handle search
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter assignments based on active tab and search term
  const getFilteredAssignments = () => {
    let filtered = [];

    if (activeTab === 'published') {
      filtered = assignments;
    } else if (activeTab === 'folders' && selectedFolder) {
      const folder = folders.find((f) => f.id === selectedFolder);
      filtered = assignments.filter((assignment) =>
        folder?.assignments.includes(assignment.id)
      );
    } else if (activeTab === 'drafts') {
      filtered = drafts;
    }

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredAssignments = getFilteredAssignments();

  // Handle item click
  const handleItemClick = (item) => {
    const format = item.type;
    if (activeTab === 'drafts') {
      switch (format) {
        case 'SAQ':
          navigate(`/class/${classId}/createassignment/DRAFT${item.id}`);
          break;
        case 'ASAQ':
          navigate(`/class/${classId}/SAQA/DRAFT${item.id}`);
          break;
        case 'AMCQ':
          navigate(`/class/${classId}/MCQA/DRAFT${item.id}`);
          break;
        case 'MCQ':
          navigate(`/class/${classId}/MCQ/DRAFT${item.id}`);
          break;
        default:
          navigate(`/class/${classId}/createassignment/DRAFT${item.id}`);
      }
    } else {
      switch (format) {
        case 'ASAQ':
          navigate(`/class/${classId}/assignment/${item.id}/TeacherResultsASAQ`);
          break;
        case 'AMCQ':
          navigate(`/class/${classId}/assignment/${item.id}/TeacherResultsAMCQ`);
          break;
        case 'SAQ':
          navigate(`/class/${classId}/assignment/${item.id}/TeacherResults`);
          break;
        case 'MCQ':
          navigate(`/class/${classId}/assignment/${item.id}/TeacherResultsMCQ`);
          break;
        default:
          break;
      }
    }
  };

  const handleFolderCreated = async () => {
    await fetchFolders();
    setShowFolderForm(false);
  };

  // Define openFolderModal function
  const openFolderModal = (folder) => {
    if (!folder) return;
    setSelectedFolder(folder);
    setShowFolderModal(true);
    // If you're fetching folder assignments:
    const assignmentsInFolder = folder.assignments || [];
    setFolderAssignments(assignmentsInFolder);
  };

  // Tooltip Display based on Assignment Type
  const getFormatDisplay = (type) => {
    switch (type) {
      case 'ASAQ':
      case 'SAQ':
        return (
          <>
            <span
              style={{
                position: 'absolute',
                right: '-10px',
                top: '5px',
                fontWeight: 'bold',
                width: '60px',
                fontFamily: "'Montserrat', sans-serif",
                color: type === 'SAQ' ? '#020CFF' : '#020CFF',
              }}
            >
              {type === 'SAQ' ? 'SAQ' : 'SAQ'}
            </span>
            {type === 'ASAQ' && (
              <span
                style={{
                  position: 'absolute',
                  right: '-45px',
                  top: '0px',
                  fontWeight: 'bold',
                  width: '60px',
                  fontFamily: "'Montserrat', sans-serif",
                  color: '#FCCA18',
                }}
              >
                *
              </span>
            )}
          </>
        );
      case 'AMCQ':
      case 'MCQ':
        return (
          <>
            <span
              style={{
                position: 'absolute',
                right: '-10px',
                top: '5px',
                fontWeight: 'bold',
                width: '60px',
                fontFamily: "'Montserrat', sans-serif",
                color: type === 'MCQ' ? 'green' : 'green',
              }}
            >
              {type === 'MCQ' ? 'MCQ' : 'MCQ'}
            </span>
            {type === 'AMCQ' && (
              <span
                style={{
                  position: 'absolute',
                  right: '-48px',
                  top: '0px',
                  fontWeight: 'bold',
                  width: '60px',
                  fontFamily: "'Montserrat', sans-serif",
                  color: '#FCCA18',
                }}
              >
                *
              </span>
            )}
          </>
        );
      default:
        return (
          <span
            style={{
              position: 'absolute',
              right: '10px',
              top: '50px',
              fontWeight: 'bold',
              width: '60px',
              fontFamily: "'Montserrat', sans-serif",
              color: '#E01FFF', // Color for unknown types or drafts
            }}
          >
            {type}
          </span>
        );
    }
  };

  // Render No Content Message
  const renderNoContentMessage = () => {
    let message = '';
    switch (activeTab) {
      case 'published':
        message = 'No published assignments yet.';
        break;
      case 'folders':
        message = 'No folders created yet.';
        break;
      case 'drafts':
        message = 'No drafts saved yet.';
        break;
      default:
        message = 'No content available.';
    }

    return (
      <div
        style={{
          textAlign: 'left',
          color: '#666',
          marginLeft: '4%',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '18px',
          marginTop: '160px',
        }}
      >
        {message}
      </div>
    );
  };

  // Render Folder Modal


  // Render Create Assignment Modal
  const renderCreateModal = () => {
    if (!showCreateModal) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(250, 250, 250, 0.95)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            width: '450px',
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '12px',
            position: 'relative',
            boxShadow: '0px 4px 10px rgba(0,0,0,0.1)',
          }}
        >
          <button
            onClick={() => setShowCreateModal(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '30px',
              width: '30px',
              height: '30px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <SquareX size={30} color="#a3a3a3" strokeWidth={3} />
          </button>

          {/* Modal Header */}
          <h2
            style={{
              fontSize: '24px',
              padding: '10px 0',
              marginBottom: '20px',
              fontFamily: "'Montserrat', sans-serif",
              textAlign: 'center',
              color: 'grey',
              borderRadius: '20px 20px 0px 0px',
              background: '#f4f4f4',
              margin: '-20px',
              border: '10px solid lightgrey',
            }}
          >
            Select Format
          </h2>

          {/* Format Selection Buttons */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              marginTop: '40px',
              alignItems: 'center',
            }}
          >
            <TeacherAssignmentHome onClose={() => setShowCreateModal(false)} />
          </div>
        </div>
      </div>
    );
  };

































  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        overflow: 'hidden',
        flexDirection: 'column',
        position: 'relative',
        alignItems: 'center',
      }}
      onClick={() => setShowCreateSection(false)}
    >
      <Navbar userType="teacher" />

      {/* Top Section */}
      <div
        style={{
          width: 'calc(100% - 200px)',
          display: 'flex',position:'fixed',zIndex:'3', top: '0px', left: '200px',
        background: 'rgb(255,255,255,.9)', backdropFilter: 'blur(5px)',
     
          borderBottom: '1px solid lightgrey',
          marginTop: '0px',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '30px', marginRight: 'auto',
            marginLeft: '4%',
            fontFamily: "'Montserrat', sans-serif",
            marginBottom: '20px',
          }}
        >
          Assignments
        </h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width:'92%',
            marginTop: '0px',
            justifyContent: 'space-between',
          }}
        >


<div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '300px',
            justifyContent: 'space-between',
          }}
        >


          <button
            onClick={() => handleSortClick('published')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: "600",
              padding: '12px 10px',
              fontFamily: "'Montserrat', sans-serif",
              borderBottom: activeTab === 'published' ? '2px solid #020CFF' : '2px solid transparent',
              color: activeTab === 'published' ? '#020CFF' : 'grey',
            }}
          >
            Published
          </button>
          <button
            onClick={() => handleSortClick('folders')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              
              fontWeight: "600",
              padding: '12px 10px',
              fontFamily: "'Montserrat', sans-serif",
              borderBottom: activeTab === 'folders' ? '2px solid #020CFF' : '2px solid transparent',
              color: activeTab === 'folders' ? '#020CFF' : 'grey',
            }}
          >
            Folders
          </button>
          <button
            onClick={() => handleSortClick('drafts')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: "600",
              padding: '12px 10px',
              fontFamily: "'Montserrat', sans-serif",
              borderBottom: activeTab === 'drafts' ? '2px solid #020CFF' : '2px solid transparent',
              color: activeTab === 'drafts' ? '#020CFF' : 'grey',
            }}
          >
            Drafts
          </button>
          </div>
          {/* Search Bar */}
      {/* Search Bar */}

        </div>


        <div
        style={{
          width: '350px',
          position: 'absolute',
          top: '10px',
          right: '4%',
          marginTop: '10px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
              <SearchToggle
  searchTerm={searchTerm} 
  handleSearchChange={handleSearchChange}
  activeTab={activeTab}
/>
        {activeTab === 'folders' ? (
          <button
            onClick={() => setShowFolderForm(true)}
            style={{
              backgroundColor: 'white',
              color: '#29DB0B', marginTop: '10px',
              marginBottom: '-10px',
              border: '1px solid white',
              padding: '8px 16px',
              borderRadius: '5px',
              
              marginLeft: 'auto',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '16px',
            }}
          >
          <FolderPlus size={20} />
          </button>
        ) : activeTab === 'published' ? (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              backgroundColor: 'white',
              color: '#29DB0B', marginTop: '10px',
              marginBottom: '-10px',
              border: '1px solid white',
              padding: '8px 16px',
              borderRadius: '5px',
              
              marginLeft: 'auto',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '16px',
            }}
          >
             <SquarePlus size={20} />
          </button>
        ) : activeTab === 'drafts' ? (
          <h1
            
            style={{
              backgroundColor: 'white',
              color: 'grey',
              border: '1px solid white',
              marginTop: '10px',
              marginBottom: '-10px',
              padding: '8px 0px',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'flex',
              fontWeight: '500',
textAlign: 'right',
              alignItems: 'right',
              gap: '8px',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '16px',
            }}
          >
           Continue where you left off
          </h1>
        ) : null}

      </div>




      </div>




      {/* Active Tab Info and Action Button */}
    

      {/* Main Content */}
      {isLoading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
          }}
        >
          {/* You can add a loader here */}
          <p>Loading...</p>
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            borderRadius: '15px',
          marginBottom: '40px',
          marginTop: '-10px',
            padding: '10px 2%',
          }}
        >
          {renderCreateModal()} 
           {showFolderForm && (
    <CreateFolder
      classId={classId}
      onFolderCreated={handleFolderCreated}
      onClose={() => setShowFolderForm(false)}
    />
  )}

{activeTab === 'folders' ? (
  <Folders
    classId={classId}
    folders={folders}
    assignments={assignments}
    pastelColors={pastelColors}
    onFoldersUpdated={setFolders}
    openFolderModal={openFolderModal}
  />
          ) : (









            <ul style={{ listStyleType: 'none', padding: 0,  width: 'calc(100% - 200px)', marginTop: '120px', 
              marginLeft: '200px', }}>
              {filteredAssignments.length > 0 ? (
             filteredAssignments.map((item, index) => (
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
    transition: 'background-color 0.3s, border-color 0.3s, box-shadow 0.3s',
  }}
>
  <span
    style={{
      fontSize: '20px',
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: '600',
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
        fontWeight: '500',position: 'absolute',
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
        fontWeight: '500',position: 'absolute',
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
        fontWeight: '500',position: 'absolute',
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
    <div style={{ marginRight: '0px', height: '30px', width: '50px', position: 'relative'}}>{getFormatDisplay(item.type)}</div>
  </div>
</li>
                ))
              ) : (
                <h1 style={{marginTop: '-20px', fontWeight: '500'}}>
                {renderNoContentMessage()}</h1>
              )}
            </ul>
          )}
        </div>
      )}

      {/* Create Folder Form */}
      {showFolderForm && (
        <CreateFolder
          classId={classId}
          onFolderCreated={() => {
            fetchFolders();
            setShowFolderForm(false);
          }}
          onClose={() => setShowFolderForm(false)}
        />
      )}
    </div>
  );
}

export default Assignments;
