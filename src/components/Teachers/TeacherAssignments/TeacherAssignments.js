import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc , setDoc, arrayUnion} from 'firebase/firestore';
import { db } from '../../Universal/firebase';
import { updateDoc, addDoc } from 'firebase/firestore';
import Navbar from '../../Universal/Navbar';
import { useLocation } from 'react-router-dom';
import TeacherAssignmentHome from './TeacherAssignmentHome'; // Import the TeacherAssignmentHome component
import { v4 as uuidv4 } from 'uuid';
import Tooltip from './AssignmentsToolTip';
import { BookOpenText, SquareX, SquarePlus, PencilRuler, Folder, FolderPlus,  Palette, Search, Eye, SquareArrowLeft } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState(() => {
    // Retrieve the active tab from localStorage or default to 'assignments'
    return localStorage.getItem('activeTab') || 'assignments';
  });
  const { classId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [sortBy, setSortBy] = useState(() => {
    // Retrieve the sort method from localStorage or default to 'assignments'
    return localStorage.getItem('sortBy') || 'assignments';
  });
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [hasContent, setHasContent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newDraftId, setNewDraftId] = useState(null);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(pastelColors[0]);
  const [selectedFolderForAssignments, setSelectedFolderForAssignments] = useState(null);
  const [showAddAssignmentsModal, setShowAddAssignmentsModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderAssignments, setFolderAssignments] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [searchTermAddAssignments, setSearchTermAddAssignments] = useState('');
  const [showFolderSearchBar, setShowFolderSearchBar] = useState(false);
  const [folderSearchTerm, setFolderSearchTerm] = useState('');
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const formatISODate = (isoString) => {
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
   const handleCreateFolder = async () => {
    if (newFolderName.trim() === '') return;
  
    try {
      const newFolderRef = await addDoc(collection(db, 'folders'), {
        name: newFolderName,
        color: newFolderColor,
        classId: classId,
        assignments: [], // New array to store assignment info
      });
  
      const classDocRef = doc(db, 'classes', classId);
      const classDocSnap = await getDoc(classDocRef);
      if (classDocSnap.exists()) {
        const currentFolders = classDocSnap.data().folders || [];
        await updateDoc(classDocRef, {
          folders: [...currentFolders, newFolderRef.id]
        });
      }
  
      setFolders([...folders, { id: newFolderRef.id, name: newFolderName, color: newFolderColor, assignments: [] }]);
      setShowFolderForm(false);
      setNewFolderName('');
      setNewFolderColor(pastelColors[0]);
      await fetchFolders();
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };
  const fetchFolders = async () => {
    try {
      const classDocRef = doc(db, 'classes', classId);
      const classDocSnap = await getDoc(classDocRef);
      if (classDocSnap.exists()) {
        const folderIds = classDocSnap.data().folders || [];
        const folderPromises = folderIds.map(folderId => getDoc(doc(db, 'folders', folderId)));
        const folderSnapshots = await Promise.all(folderPromises);
        const fetchedFolders = folderSnapshots.map(snap => ({
          id: snap.id,
          ...snap.data()
        }));
        setFolders(fetchedFolders);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  };
  const addAssignmentToFolder = async (assignment) => {
    try {
      const folderRef = doc(db, 'folders', selectedFolder.id);
      const folderDoc = await getDoc(folderRef);
  
      if (folderDoc.exists()) {
        const currentAssignments = folderDoc.data().assignments || [];
        
        // Handle different date formats
        let createdAtString;
        if (assignment.createdDate) {
          // If it's a Firestore Timestamp
          if (typeof assignment.createdDate.toDate === 'function') {
            createdAtString = assignment.createdDate.toDate().toISOString();
          } 
          // If it's already a JavaScript Date object
          else if (assignment.createdDate instanceof Date) {
            createdAtString = assignment.createdDate.toISOString();
          }
          // If it's already a string
          else if (typeof assignment.createdDate === 'string') {
            createdAtString = assignment.createdDate;
          }
        } else {
          // If no date is provided, use current date
          createdAtString = new Date().toISOString();
        }
  
        const assignmentInfo = {
          id: assignment.id,
          name: assignment.name || assignment.assignmentName,
          createdAt: createdAtString
        };
  
        if (!currentAssignments.some(a => a.id === assignment.id)) {
          await updateDoc(folderRef, {
            assignments: [...currentAssignments, assignmentInfo]
          });
  
          // Log the assignment details
          console.log('Assignment added to folder:', assignmentInfo);
  
          // Update local state
          setFolders(prevFolders => 
            prevFolders.map(f => 
              f.id === selectedFolder.id
                ? { ...f, assignments: [...(f.assignments || []), assignmentInfo] }
                : f
            )
          );
  
          // Refresh folder assignments
          const updatedFolder = await getDoc(folderRef);
          setFolderAssignments(updatedFolder.data().assignments || []);
        }
      }
    } catch (error) {
      console.error("Error adding assignment to folder:", error);
    }
  };
  const fetchFolderAssignments = async (folderId) => {
    try {
      const folderRef = doc(db, 'folders', folderId);
      const folderDoc = await getDoc(folderRef);
  
      if (folderDoc.exists()) {
        return folderDoc.data().assignments || [];
      } else {
        console.error("Folder not found");
        return [];
      }
    } catch (error) {
      console.error("Error fetching folder assignments:", error);
      return [];
    }
  };
  const openFolderModal = async (folder) => {
    setSelectedFolder(folder);
    setShowFolderModal(true);
    const folderAssignments = await fetchFolderAssignments(folder.id);
    setFolderAssignments(folderAssignments);
  };
 
  const location = useLocation();
  const navigate = useNavigate();

  const getSortButtonStyle = (option) => {
    const baseStyle = {
      fontSize: '15px',
      height: '60px',
      fontWeight: 'bold',
      width: '60px',
      display: 'flex',
      fontFamily: "'montserrat', sans-serif",
      borderRadius: '8px',
      border: '4px solid ',
      marginTop: '20px',
      zIndex: '100',
      textAlign: 'left',
      lineHeight: '0px',
      marginLeft: '20px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    };
  
    let style = { ...baseStyle };
  
    if (sortBy === option) {
      switch (option) {
        case 'assignments':
          style = { ...style, backgroundColor: '#B0BDFF', color: '#020CFF', borderColor: '#020CFF' };
          break;
        case 'folders':
          style = { ...style, backgroundColor: '#FFECA9', color: '#F0856E', borderColor: '#F0856E' };
          break;
        case 'drafts':
          style = { ...style, backgroundColor: '#f4f4f4', color: '#A7A7A7', borderColor: '#A7A7A7' };
          break;
        default:
          break;
      }
    } else {
      style = { ...style, backgroundColor: 'transparent', color: '#9C9C9C', borderColor: 'transparent' };
    }
  
    return style;
  };


  

  const renderNoContentMessage = () => {
    let message = '';
    switch(sortBy) {
      case 'assignments':
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
      <div style={{
        width: '100%',
        textAlign: 'center',
        color: '#666',
        fontFamily: "'montserrat', sans-serif",
        fontSize: '20px',
        marginTop: '50px'
      }}>
        {message}
      </div>
    );
  };
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchAssignments();
        await fetchFolders();
        await fetchDrafts();

        // Check if we're coming from saving a draft
        if (location.state?.showDrafts) {
          setSortBy('drafts');
          setActiveTab('drafts');
          setNewDraftId(location.state.newDraftId);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [classId, location.state]);
  
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
    localStorage.setItem('sortBy', sortBy);
  }, [activeTab, sortBy]);

  const handleSortClick = (type) => {
    setSortBy(type);
    setActiveTab(type);
    setSelectedFolder(null);
    setSelectedFormat(null);
    setSearchTerm('');
  };
  const getSearchBarStyle = () => {
    let backgroundColor, color, iconSrc;
    switch (sortBy) {
      case 'assignments':
        backgroundColor = 'rgba(176, 189, 255, 0.3)';  // #B0BDFF with 30% opacity
        color = '#020CFF';
        
        
        break;
      case 'folders':
        backgroundColor = 'rgba(255, 236, 169, 0.3)';  // #FFECA9 with 30% opacity
        color = '#F0856E';
     
        break;
      case 'format':
        backgroundColor = 'rgba(186, 169, 255, 0.3)';  // #BAA9FF with 30% opacity
        color = '#4A0BFF';
       
        break;
      case 'drafts':
        backgroundColor = '#f4f4f4';  // #F8CFFF with 30% opacity
        color = '#989898';
       
        break;
      default:
        backgroundColor = 'rgba(255, 255, 255, 0.3)';  // white with 30% opacity
        color = 'tranparent';
        iconSrc = '/BlueSearch.png';
    }
  
    return { backgroundColor, color, iconSrc };
  };
  const toggleCreateSection = () => {
    setShowCreateSection(prev => !prev);
  };

  const handleFormatSelect = (selectedFormat) => {
    if (!classId || !selectedFormat) {
      console.error('ClassId is empty or no format selected');
      return;
    }

    const newAssignmentId = uuidv4();
    let assignmentId = `${classId}+${newAssignmentId}+${selectedFormat}`;
    let navigationPath = '';

    switch (selectedFormat) {
      case 'SAQ':
        navigationPath = `/class/${classId}/createassignment/${assignmentId}`;
        break;
      case 'ASAQ':
        navigationPath = `/class/${classId}/SAQA/${assignmentId}`;
        break;
      case 'MCQ':
        navigationPath = `/class/${classId}/MCQ/${assignmentId}`;
        break;
      case 'AMCQ':
        navigationPath = `/class/${classId}/MCQA/${assignmentId}`;
        break;
      default:
        console.error('Invalid format selected');
        return;
    }

    // Instead of creating the document here, we'll pass the necessary information
    // to the creation page through the navigation state
    navigate(navigationPath, {
      state: {
        assignmentType: selectedFormat,
        isAdaptive: selectedFormat === 'ASAQ' || selectedFormat === 'AMCQ',
        assignmentId,
        classId
      }
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchAssignments();
        await fetchFolders();
        await fetchDrafts();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setShowFolderForm(false);
        setShowFolderModal(false);
        setShowAddAssignmentsModal(false);
      }
    };

    window.addEventListener('keydown', handleEscKey);

    // Clean up the event listener
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [classId, location.state]);

  const toggleCreateModal = () => {
    setShowCreateModal(!showCreateModal);
  };
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchAssignments();
        await fetchFolders();
        await fetchDrafts();
        
        // Set allAssignments after fetching
        setAllAssignments(assignments);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [classId, location.state]);

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
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 100,
          display: 'flex',
          backdropFilter: 'blur(5px)',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          overflow: 'auto'
        }}
      >
      
        <div style={{position: 'relative', width:'450px', background: 'white', padding: '10px', borderRadius: '20px', height:'240px', border: '10px solid #f4f4f4'}}>
        <button 
          onClick={toggleCreateModal}
          style={{
            position: 'absolute',
            top: '-15px',
            right: '20px',
            width: '30px',
            height: '30px', 
            background: 'transparent',
            fontSize: '24px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <div style={{marginTop: '-5px', marginLeft: '-8px'}}>
          <SquareX size={40} color="#a3a3a3" strokeWidth={3} /></div>
        </button>
        <h2 style={{ fontSize: '30px',  padding: '10px 10px 10px 30px',marginBottom: '20px', fontFamily: "'montserrat', sans-serif", textAlign: 'left', color:'grey',  border: '10px solid lightgray',borderRadius:'20px 20px 0px 0px', marginLeft: '-20px', marginRight: '-20px', marginTop: '-50px'
          , background: '#f4f4f4'
        }}>Select Format</h2>
        <TeacherAssignmentHome onFormatSelect={(format) => {
          handleFormatSelect(format);
          toggleCreateModal();
        }} />
      </div></div>
    );
  };

  const fetchAssignments = async () => {
    try {
      const assignmentsCollections = [
        'assignments(saq)',
        'assignments(Asaq)',
        'assignments(mcq)',
        'assignments(Amcq)'
      ];
  
      const fetchPromises = assignmentsCollections.map(collectionName =>
        getDocs(collection(db, collectionName))
      );
  
      const snapshots = await Promise.all(fetchPromises);
  
      let allAssignments = [];
      snapshots.forEach((snapshot) => {
        const filteredDocs = snapshot.docs.filter(doc => doc.id.startsWith(`${classId}+`));
        const assignments = filteredDocs
          .map(doc => {
            const data = doc.data();
            const [, , type] = doc.id.split('+');
            return {
              id: doc.id,
              ...data,
              type: type.replace('*', ''),
              name: data.assignmentName || data.name,
              date: data.createdAt || data.createdDate || new Date(0) // Use createdAt or createdDate, fallback to epoch
            };
          })
          .filter(assignment => assignment.name);
  
        allAssignments = allAssignments.concat(assignments);
      });
  
      const sortedAssignments = allAssignments.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate();
        const dateB = b.date instanceof Date ? b.date : b.date.toDate();
        return dateB - dateA; // Sort in descending order (newest first)
      });
  
      setAssignments(sortedAssignments);
      setAllAssignments(sortedAssignments);
      setFilteredAssignments(sortedAssignments);
      setHasContent(sortedAssignments.length > 0);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };


    const handleItemClick = (item) => {
      // Extract the format from the end of the item.id
      const parts = item.id.split('+');
      const format = parts[parts.length - 1];  // Get the last part after splitting
      const type = item.doc?.data()?.type || 'default';
      if (sortBy === 'drafts') {
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
            // Default case, if format is not specified or is something else
            navigate(`/class/${classId}/createassignment/DRAFT${item.id}`);
        }
      } else {
        // Navigation for non-draft assignments based on format
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
                break;;
        }
      }
    };
    
  const fetchDrafts = async () => {
    try {
      const draftsRef = collection(db, 'drafts');
      const q = query(draftsRef, where('classId', '==', classId));
      const querySnapshot = await getDocs(q);
      const fetchedDrafts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().assignmentName || 'Untitled Draft',
       
        ...doc.data()
      }));
      
      setDrafts(fetchedDrafts);
    } catch (error) {
      console.error("Error fetching drafts:", error);
    }
  };


  useEffect(() => {
    const handleFilter = () => {
      let filtered = assignments;

      if (selectedFolder) {
        filtered = filtered.filter(assignment => folders.find(folder => folder.id === selectedFolder)?.assignments.includes(assignment.id));
      }

      if (selectedFormat) {
        filtered = filtered.filter(assignment => assignment.type === selectedFormat);
      }

      if (sortBy === 'drafts') {
        filtered = drafts;
      }

      if (searchTerm) {
        filtered = filtered.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setFilteredAssignments(filtered);
    };

    handleFilter();
  }, [searchTerm, assignments, selectedFolder, selectedFormat, sortBy, folders, drafts]);
  const handleCreateFirstAssignment = () => {
    // Implement the logic to create the first assignment
   
    navigate(`/class/${classId}/teacherassignmenthome`)
    // For example:
    // navigate(`/class/${classId}/create-assignment`);
  };
  const create = () => {
    // Implement the logic to create the first assignment
   
    navigate(`/class/${classId}/teacherassignmenthome`)
    // For example:
    // navigate(`/class/${classId}/create-assignment`);
  };
  const formatDate = (createdDate) => {
    if (createdDate && typeof createdDate.toDate === 'function') {
      const date = createdDate.toDate();
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return '';
  };

 
  
  const getFormatDisplay = (item) => {
    const type = getAssignmentType(item);
    switch(type) {
      case 'ASAQ':
      case 'SAQ':
        return (
          <>
            <span style={{
              position: 'absolute',
              right: '10px',
              top: '50px',
              fontWeight: 'bold',
              width: '60px',
              marginTop: '0px',
              fontFamily: "'montserrat', sans-serif",
              color: '#020CFF'
            }}>
              SAQ
            </span>
            {type === 'ASAQ' && (
              <span style={{
                position: 'absolute',
                right: '-38px',
                top: '40px',
                fontWeight: 'bold',
                width: '60px',
                marginTop: '0px',
                fontFamily: "'montserrat', sans-serif",
                color: '#FCCA18'
              }}>
                *
              </span>
            )}
          </>
        );
      case 'AMCQ':
      case 'MCQ':
        return (
          <>
            <span style={{
              position: 'absolute',
              right: '10px',
              top: '50px',
              fontWeight: 'bold',
              width: '60px',
              marginTop: '0px',
              fontFamily: "'montserrat', sans-serif",
              color: 'green'
            }}>
              MCQ
            </span>
            {type === 'AMCQ' && (
              <span style={{
                position: 'absolute',
                right: '-38px',
                top: '40px',
                fontWeight: 'bold',
                width: '60px',
                marginTop: '0px',
                fontFamily: "'montserrat', sans-serif",
                color: '#FCCA18'
              }}>
                *
              </span>
            )}
          </>
        );
      default:
        return (
          <span style={{
            position: 'absolute',
            right: '10px',
            top: '50px',
            fontWeight: 'bold',
            width: '60px',
            marginTop: '0px',
            fontFamily: "'montserrat', sans-serif",
            color: '#E01FFF'  // Color for unknown types or drafts
          }}>
            {type}
          </span>
        );
    }
  };

  const renderAddAssignmentsModal = () => {
    if (!showAddAssignmentsModal) return null;
    return (
      <div style={{
        position: 'fixed',
        width: '854px', // Increased width to accommodate 2 columns
        backdropFilter: 'blur(5px)',
        backgroundColor: 'rgb(255,255,255,1)',
        border: `10px solid #f4f4f4`,
        borderTop: "none",
        padding: '20px',
marginLeft: '-67px',
        zIndex: 102,
        height: '440px',
        overflowY: 'auto'
      }}>
        <div style={{display: 'flex', marginTop: '-30px'}}>
        <button
          onClick={() => setShowAddAssignmentsModal(false)}
          style={{
           
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            opacity: 0.5,
          }}
        >
          <SquareArrowLeft size={40} style={{color: 'grey'}}/>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '15px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchTermAddAssignments}
            onChange={(e) => setSearchTermAddAssignments(e.target.value)}
            style={{
              width: '760px',
              padding: '10px',
              border: `2px solid #e4e4e4`,
              borderRadius: '5px',
              flexGrow: 1,
            }}
          />
        </div>
        </div>






        {assignments.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {assignments
              .filter(assignment => 
                (assignment.name || assignment.assignmentName).toLowerCase().includes(searchTermAddAssignments.toLowerCase()) &&
                (!assignment.folders || !assignment.folders.includes(selectedFolder.id))
              )
              .map(assignment => (
                <div key={assignment.id} style={{
                  width: '390px', 
                  marginBottom: '20px',
                  borderRadius: '10px',
                  padding: '10px',
                  height: '60px',
                  position: 'relative',
                  backgroundColor: 'white',
                  border: '2px solid #e4e4e4',
                }}>
                  <div>
                    <div style={{
                      fontFamily: "'montserrat', sans-serif",
                      fontWeight: 'bold',
                      fontSize: '20px'
                    }}>
                      {assignment.name || assignment.assignmentName}
                    </div>
                    <span style={{position: 'absolute', right: '50px', bottom: '10px', fontSize: '12px', fontWeight: 'bold', color: 'grey'}}>

                    {assignment.createdAt.toDate().toLocaleString()}

                    </span>
                    <h1 style={{
                      position: 'absolute', right: '180px', bottom: '68px', fontSize: '12px',
                      zIndex: '50',
                    }}>
                      {getFormatDisplay(assignment)}
                    </h1>
                  </div>
                  <button
                    onClick={() => addAssignmentToFolder(assignment)}
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      backgroundColor: 'white',
                      color: 'white',
                      border: 'none',
                      zIndex: '80',
                      borderRadius: '5px',
                      padding: '5px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    <SquarePlus size={40} color='#7BE06A' strokeWidth={2} />
                  </button>
                </div>
              ))
            }
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
            No assignments available to add.
          </div>
        )}
      </div>
    );
  };
 
  const getAssignmentType = (item) => {
    const id = item.id || '';
    const parts = id.split('+');
    return parts[parts.length - 1] || item.type || 'Unknown';
  };
  
  const getBackgroundColorWithOpacity = (color, opacity) => {
    // Check if the color is in hexadecimal format
    if (color.startsWith('#')) {
      // Convert hex to RGB
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    // If it's already in RGB format, just add the opacity
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  };
  const renderFolderModal = () => {
    if (!selectedFolder) return null;
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(250, 250, 250, 0.9)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 101,
      }}>
        <div style={{
          width: '60%',
          height: '50%',
          backgroundColor: 'white',
          border: `10px solid #f4f4f4`,
          borderRadius: '20px',
          padding: '20px',
          display: 'flex',
          position: 'relative',
          flexDirection: 'column',
        }}>
          <button
            onClick={() => setSelectedFolder(null)}
            style={{
              position: 'absolute',
              top: '-40px',
              fontWeight: 'bold',
              right: '20px',
              background: 'none',
              border: 'none',
              fontSize: '44px',
              cursor: 'pointer',
              color: selectedFolder.color.text,
              zIndex: 104,
            }}
          >
           <SquareX size={40} color={selectedFolder.color.text} strokeWidth={3} />
          </button>
          <div style={{
            backgroundColor: selectedFolder.color.bg,
            height: '70px',
            width: '100%',
            position: 'absolute',
            top: '-65px',
            left: '-10px',
            display: 'flex',
            zIndex: '103',
            border: `10px solid ${selectedFolder.color.text}`,
            borderRadius: '20px',
            borderBottomLeftRadius: '0px',
            borderBottomRightRadius: '0px',
          }}>
            <Folder size={40} color={selectedFolder.color.text} strokeWidth={3} style={{ marginLeft: '30px', marginTop: '15px',}} />
            <h2 style={{
              color: selectedFolder.color.text,
              fontFamily: "'montserrat', sans-serif",
              fontSize: '34px',
              marginTop: '15px',
              marginLeft: '20px'
            }}>
              {selectedFolder.name} 
            </h2>
          </div>
          
          <button
            onClick={() => {
              setSelectedFolderForAssignments(selectedFolder.id);
              setShowAddAssignmentsModal(true);
            }}
            style={{
              position: 'absolute',
              top: '50px',
              width: '350px',
              left: '20px',
              padding: '10px 20px',
              color: selectedFolder.color.text,
              border: `0px solid ${selectedFolder.color.text}`,
              backgroundColor: getBackgroundColorWithOpacity(selectedFolder.color.text, 0.2), // 0.2 is the opacity, adjust as needed
              borderRadius: '15px',
              cursor: 'pointer',
              fontSize: '25px',
              display: 'flex' ,
              height: '50px',
              fontFamily: "'montserrat', sans-serif",
              fontWeight: 'bold',
            }}
          >
          Add Assignments <div style={{marginLeft: '40px',}}><SquarePlus size={30} color={selectedFolder.color.text} strokeWidth={2} /></div> 
          </button>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', overflow: 'auto', marginTop: '100px', left: '10px' }}>
            {folderAssignments.length > 0 ? (
              folderAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  onClick={() => handleItemClick(assignment)}
                  style={{
                    width: 'calc(47% - 20px)',
                    padding: '10px',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: `2px solid #e6e6e6`,
                    position: 'relative',
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '5px'
                  }}>
                    <h3 style={{ 
                      color: 'black', 
                      fontFamily: "'montserrat', sans-serif", 
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '70%'
                    }}>
                      {assignment.name || assignment.assignmentName} 
                    </h3>
                   <div style={{position: 'absolute',right: '-15px', fontSize: '14px', color: 'lightgrey',
                    width: 'calc(30.33% - 20px)', fontWeight: '600'}}>   {formatISODate(assignment.createdAt)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                width: '100%', 
                textAlign: 'center', 
                color: selectedFolder.color.text, 
                fontFamily: "'montserrat', sans-serif",
                fontSize: '20px',
                marginTop: '20px'
              }}>
                This folder is empty. Add assignments using the button above.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  























  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }} onClick={() => showCreateSection && setShowCreateSection(false)}>
       <Navbar userType="teacher" />

      
    {isLoading ? (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
       
      </div>
     ) : assignments.length > 0 || drafts.length > 0 || folders.length > 0 ? (
      <div style={{ width: '800px', marginLeft: 'auto', marginRight: 'auto',  }}>
     
       
          {renderCreateModal()}

      <div style={{
            marginLeft: 'auto',
            marginRight: 'auto',
            marginTop: '70px',
            padding: '10px',
            backgroundColor: 'transparent',
            borderRadius: '10px'
          }}>
            <div style={{display: 'flex'}}>
            <h1 style={{ 
  color: 'black', 
  fontSize: activeTab === 'assignments' ? '55px' : '60px', 
  fontFamily: "'montserrat', sans-serif", 
  marginLeft: '0px' 
}}>
  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
</h1>

            {sortBy === 'folders' && (
                <button
                  onClick={() => setShowFolderForm(!showFolderForm)}
                  style={{
                    backgroundColor: "white",
                   marginTop: '55px',
                   marginLeft: '30px',
                    width: '70px',
                    height: '50px',
                    cursor: 'pointer',
                    fontSize: showSearchBar ? '18px' : '18px', 
                    borderRadius: '10px',
                    color: 'grey',
                    border: `4px solid white`,
                    fontFamily: "'montserrat', sans-serif",
                    fontWeight: 'bold',
                    zIndex: 9,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: '.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#00D909';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'grey';
                  }}
                >
              <FolderPlus  size={60} />
                </button>
              )}
            <div style={{marginTop: '50px', width: '350px', height: '60px', marginLeft: 'auto', position: 'relative', marginRight: '10px' }}>
           


{!showSearchBar ? (
                  <button
                    onClick={() => setShowSearchBar(true)}
                    style={{ 
                      height: '50px', 
                      backgroundColor: 'transparent', 
                      border: 'none',
                      position: 'absolute', 
                      right: '-18px',
                      top: '2px',
                      padding: '5px', 
                      width: '80px',
                      cursor: 'pointer',
                    }}
                  >
                     <Search size={30} strokeWidth={2.8}  color={getSearchBarStyle().color} />
                 </button>
              ) : (














                <div style={{ position: 'relative', width: '360px', height: '55px',  marginLeft: '-10px', marginTop: '0px'}}>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '300px',
                    height: '45px',
                    fontSize: '20px',
                    fontFamily: "'montserrat', sans-serif",
                    padding: '0px 40px 0px 20px',
                    border: '4px solid #f4f4f4',
                    marginLeft: '0px',
                    marginTop: '0px',
                    backgroundColor: 'white',
                    color: getSearchBarStyle().color,
                    borderRadius: '10px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => {
                    setShowSearchBar(false);
                    setSearchTerm('');
                  }}
                  style={{
                    position: 'absolute',
                    top: '35px',
                    right: '-8px',
                    height: '52px',
                    width: '60px',
                    borderRadius: '0px 10px 10px  0px ',
                    transform: 'translateY(-65%)',
                    backgroundColor: getSearchBarStyle().backgroundColor,
                    border: `4px solid ${getSearchBarStyle().color}`,
                    cursor: 'pointer',
                    padding: '0',
                  }}
                >
                         <Search size={30} strokeWidth={2.8} color={getSearchBarStyle().color} />
             
                </button>
              </div>
            )}
            </div>
                        </div>













            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', width: '920px', marginLeft: '20px' }}>
              <div style={{
               
                flexDirection: 'column',
                padding: '0px',
                marginTop: '-15px',
                width: '80px',
                 position: 'fixed',
                 left: '0px', top: '0px' ,
                 height: '100%',
                 borderRight: '4px solid #f4f4f4',
              background:'white'
              }}>
               <div style={{  height: '25px', zIndex: '10', width: '100px', marginTop: '80px', marginLeft: '-10px'
                 
                }}>
                     
                   <button
            onClick={toggleCreateModal}
            style={{
              padding: '5px',
              zIndex: 100,
              width: '85px',
              height: '60px',
              marginLeft: '10px',
              color:'grey',
              fontFamily: "'montserrat', sans-serif",
              display: 'flex',
              backgroundColor: '#f4f4f4',
              border: 'none',
              borderRight: '4px solid lightgrey',
              textAlign: 'left',
              borderRadius: '0px',
              cursor: 'pointer',
              transition: '.3s',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderRightColor = '#00D309';
              e.currentTarget.style.color = '#00D309';
              
              e.currentTarget.style.backgroundColor = '#C1FFB7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderRightColor = 'lightgrey';
              e.currentTarget.style.color = 'grey';
              e.currentTarget.style.backgroundColor = '#f4f4f4';
            }}
          >
              <Tooltip text="Create">
        
            <SquarePlus size={40}  style={{marginTop: '5px'}}/>
            </Tooltip>
          </button>
          {[
            { option: 'assignments', icon: BookOpenText, tooltip: 'Assignments' },
            { option: 'folders', icon: Folder, tooltip: 'Folders' },
            { option: 'drafts', icon: PencilRuler, tooltip: 'Drafts' },
          ].map(({option, icon: Icon, tooltip}) => (
            <div style={{marginTop: '10px'}} key={option}>
              <div style={{ 
                height: '4px', 
                width: '60px', 
                background: 'transparent', 
                marginLeft: '0px',  
                marginTop: '40px',
                marginBottom: '-10px'
              }}></div>
              <button
                  style={{
                    ...getSortButtonStyle(option),
                    position: 'relative', // Ensure the button is a positioning context for the tooltip
                  }}
                  onClick={() => handleSortClick(option)}
                  onMouseEnter={(e) => {
                    if (sortBy !== option) {
                      e.currentTarget.style.color = 'grey';
                      e.currentTarget.querySelector('svg').style.color = 'grey';
                      e.currentTarget.querySelector('svg').style.strokeWidth = '2';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (sortBy !== option) {
                      e.currentTarget.style.color = '#9C9C9C';
                      e.currentTarget.querySelector('svg').style.color = '#9C9C9C';
                      e.currentTarget.querySelector('svg').style.strokeWidth = '1.8';
                    }
                  }}
                >
                  <div style={{ marginTop: '5px'}}> <Tooltip text={tooltip}>
               
                    <Icon 
                      size={40} 
                      style={{marginLeft: '0px'}}
                      color={sortBy === option ? getSortButtonStyle(option).color : '#9C9C9C'} 
                      strokeWidth={sortBy === option ? 2 : 1.8} 
                    />
                     </Tooltip>
                  </div>

                </button>
             
            </div>
          ))}
        </div>
      </div>
            



            
           
    


            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
             
            {sortBy === 'folders' && (
  <div style={{width: '1000px', position: 'absolute', left: '0px', top: '100px'}}>
  





    {showFolderForm && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 101,
      }} 
      >
        <div style={{width: '800px', height: '400px'}}>
         <div
      style={{
        padding: '10px',
        height: '60px',
        width: '738px',
        backgroundColor: '#CDFFC5',
        
        borderRadius:  '20px 20px 0 0' ,
        cursor: 'pointer',
        marginRight: 'auto',
        fontSize: '30px', 
        color: '#2BB514',
        border: `10px solid #2BB514`,
     
        fontFamily: "'montserrat', sans-serif",
        fontWeight: 'bold',
        position: 'relative',
        textAlign: 'left',
        display: 'flex',
        zIndex: 11
      }}
     
    >
     
      <FolderPlus size={50} style={{marginLeft: '40px', marginTop: '6px',}}/>
      <h1 style={{fontSize: '40px', marginLeft: '20px', marginTop: '6px'}}>Create Folder</h1>
      <button 
        onClick={() => setShowFolderForm(!showFolderForm)}
      style={{height: '40px', border: 'none', marginLeft: 'auto', background: 'none', color: '#2BB514', cursor: 'pointer'}}>
        <SquareX size={50} style={{marginTop: '5px'}} /></button>
    </div>



      <div style={{
        
        position: 'absolute',
        
        height: '330px',
        width: '758px',
         borderRadius: '0 0 20px 20px ',
        backgroundColor: 'white'  ,
        border: `10px solid #f4f4f4`,
   
        zIndex: '10',
        marginTop: '-20px',
        display: 'flex'
      }}>
         <div style={{flex: 2, padding: '20px',marginLeft: '30px', marginTop: '20px',}}>
        <div style={{position: 'relative', width: '680px', }}>
         <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value.slice(0, 15))}
                    placeholder="Name"
                    style={{
                      width: '600px',
                      padding: '20px',
                      position: 'relative',
                      marginBottom: '10px',
                      color: '#454545',
                      fontFamily: "'montserrat', sans-serif", 
                      backgroundColor: 'white',
                      fontWeight: 'bold',
                      fontSize: '30px',
                      outline: 'none',
                      border: `4px solid #f4f4f4`,
                      borderRadius: '10px'
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '45px',
                    bottom: '20px',
                    color: 'lightgrey',
                    fontFamily: "'montserrat', sans-serif",
                    fontSize: '14px'
                  }}>
                    {newFolderName.length}/15
                  </span>
                  </div>
            
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              marginBottom: '10px',
              width: '600px',
              height: '30px',
              border: '4px solid #f4f4f4',
              borderRadius: '10px',
              padding: '20px',
              marginTop: '10px'
            }}>
              <div style={{display: 'flex'}}>
                <Palette size={40} strokeWidth={2.5} style={{marginTop: '-5px'}}/>
              <h1 style={{
                width: '150px',
                height: '20px',
                marginTop: '-5px',
                color: '#454545',
                textAlign: 'center',
                fontFamily: "'montserrat', sans-serif",
                padding: '0px 0px'
              }}>
                Theme
              </h1>
              
              </div>
              <div style={{height: '30px', width: '4px', background: '#f4f4f4'}}></div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px',  height: '20px', marginTop: '30px', marginLeft: '20px'}}>
                {pastelColors.map((color, index) => (
                  <div
                    key={index}
                    onClick={() => setNewFolderColor(color)}
                    style={{
                      width: '30px',
                      height: '30px',
                      marginTop: '-30px',
                     
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: '25px',
                      height: '25px',
                      backgroundColor: color.bg,
                      borderRadius: '5px',
                      border: `4px solid ${color.text}`,
                      boxSizing: 'border-box'
                    }} />
                   
                    {newFolderColor === color && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        transform: 'translate(-50%, -50%)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        backgroundColor: 'transparent',
                        border: `4px solid #2BB514`
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          
            <button
              onClick={handleCreateFolder}
              style={{
                padding: '5px 50px',
                backgroundColor: '#CDFFC5',
                fontWeight: 'bold',
                fontSize: '25px',
                fontFamily: "'montserrat', sans-serif",
                color: newFolderColor ? '#2BB514' : 'white',
                border: '4px solid #2BB514',
                borderRadius: '10px',
                marginTop: '20px',
                cursor: 'pointer'
              }}
            >
              Create 
            </button>
          </div>
        </div>
        </div>
      </div>
    )}
    







    <div style={{
      marginTop: '-100px', 
      display: 'flex', 
      flexWrap: 'wrap', 
      width: '790px', 
      marginLeft: '-20px',
      gap: '30px'
    }}>
   {folders
        .filter(folder => folder.classId === classId)
        .map((folder, index) => (
          <div 
            key={folder.id} 
            onClick={() => openFolderModal(folder)}
            style={{ 
              width: 'calc(50% - 20px)', 
              marginBottom: '-10px',
              cursor: 'pointer',
            }}
          >
            <div style={{
              padding: '10px',
              height: '50px',
              position: 'relative',
              border: '2px solid #e4e4e4',
              backgroundColor: 'white',
              color: 'black',
              borderRadius: '10px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              
              fontFamily: "'montserrat', sans-serif",
              fontSize: '25px',
            }}>
              <Folder size={40} style={{marginLeft: '10px',
              color: folder.color.text,}}/>
             <h1 style={{fontSize:'20px',marginLeft: '10px' }}></h1>
              {folder.name} 
            </div>
          </div>
        ))
      }
           {showFolderModal && renderFolderModal()}
      {showAddAssignmentsModal && renderAddAssignmentsModal()}
      {folders.filter(folder => folder.classId === classId).length === 0 && renderNoContentMessage()}
      
    </div>
  </div>
)}

          </div>
        </div>
      </div>
      {sortBy !== 'folders' && (
        <ul style={{ width: '100%', display: 'flex', flexWrap: 'wrap', padding: 0, margin: 'auto' }}>
        {filteredAssignments.length > 0 ? (
                filteredAssignments.map((item, index) => (

            <li
            key={item.id}
            onClick={() => handleItemClick(item)}
            style={{
              backgroundColor: sortBy === 'drafts' ? '#f4f4f4' : 'white',
              fontSize: '23px',
              color: sortBy === 'drafts' ? 'grey' : 'black',
              width: '350px',
              height: '70px',
              margin: '10px 10px',
              position: 'relative',
              fontFamily: "'montserrat', sans-serif",
              listStyleType: 'none',
              textAlign: 'left',
              border: sortBy === 'drafts' ? '2px solid lightgrey' : '2px solid #E8E8E8',
              padding: '10px',
              borderRadius: '10px',
              transition: 'all 0.3s ease',
              transform: 'scale(1)',
              cursor: 'pointer', // Always show pointer cursor
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = sortBy === 'drafts' ? '#ADADAD' : ' lightgrey';
           
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = sortBy === 'drafts' ? 'lightgray' : ' #E8E8E8';
            }}
          >
              <span
                style={{
                  cursor: 'pointer',
                  fontFamily: "'montserrat', sans-serif",
                  marginLeft: '10px',
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              >
                {item.name}
              </span>
              <p
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '40px',
                  cursor: 'pointer',
                  marginTop: '0px',
                  fontSize: '20px',
                  fontFamily: "'montserrat', sans-serif",
                  color: '#9DCDCD',
                  fontWeight: 'bold',
                }}
              >
                {formatDate(item.createdDate)}
              </p>
              {item.type === 'AMCQ' ? (
                <>
                  <span style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50px',
                    cursor: 'pointer',
                    
                  fontSize: '20px',
                    fontWeight: 'bold',
                    width: '60px',
                    marginTop: '0px',
                    fontFamily: "'montserrat', sans-serif",
                    color: 'green'
                  }}>
                    MCQ
                  </span>
                  <span style={{
                    position: 'absolute',
                    right: '-38px',
                    top: '40px',
                    cursor: 'pointer',
                    
                  fontSize: '20px',
                    fontWeight: 'bold',
                    width: '60px',
                    marginTop: '0px',
                    fontFamily: "'montserrat', sans-serif",
                    color: '#FCCA18'
                  }}>
                    *
                  </span>
                </>
              ) : item.type === 'ASAQ' ? (
                <>
                  <span style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    
                  fontSize: '20px',
                    width: '60px',
                    marginTop: '0px',
                    fontFamily: "'montserrat', sans-serif",
                    color: '#020CFF'
                  }}>
                    SAQ
                  </span>
                  <span style={{
                    position: 'absolute',
                    right: '-38px',
                    top: '40px',
                    cursor: 'pointer',
                    
                  fontSize: '20px',
                    fontWeight: 'bold',
                    width: '60px',
                    marginTop: '0px',
                    fontFamily: "'montserrat', sans-serif",
                    color: '#FCCA18'
                  }}>
                    *
                  </span>
                </>
              ) :  item.type === 'SAQ' ? (
                <>
                  <span style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50px',
                    
                  fontSize: '20px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    width: '60px',
                    marginTop: '0px',
                    fontFamily: "'montserrat', sans-serif",
                    color: '#020CFF'
                  }}>
                    SAQ
                  </span>
                 
                </>
              ) :(
                <span style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  width: '60px',
                  marginTop: '0px',
                  fontFamily: "'montserrat', sans-serif",
                  color: 'green'
                }}>
                  {item.type}
                </span>
              )}
                 {item.viewable && (
        <Eye
          size={20}
          strokeWidth={3}
          color="#92A3FF"
          style={{   position: 'absolute', left: '210px',
            bottom: '16px',}}
        />
      )}
              <span
                style={{
                  position: 'absolute',
                  left: '20px',
                  bottom: '16px',
                  fontWeight: '600',
                  fontSize: '16px',
                  fontFamily: "'montserrat', sans-serif",
                  color: 'lightgrey',
                }}
              >
                {item.createdAt && item.createdAt.toDate().toLocaleString()}
              </span>
            </li>
            ))
          ) : (
            renderNoContentMessage()
          )}
        </ul>
      )}
      </div>
     ) : (
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '940px',
        marginLeft: 'auto', marginRight: 'auto',
        height: 'calc(100vh - 60px)', // Adjust based on your Navbar height
      }}>
         
          <h1 style={{ color: 'black', fontSize: '60px', fontFamily: "'montserrat', sans-serif", marginRight: 'auto', marginTop: '100px', }}>Create Your First Assignment</h1>
          
   <h1 style={{width: '940px', textAlign: 'Left', color: 'GREY', marginTop: '-30px'}}>Later you can access assignments, grades, and drafts here. Start by creating your first assignment.</h1>
        <div
         
          style={{
            padding: '10px 10px 30px 0px',
          width: '440px',
          marginTop :'20px',
            fontWeight: 'bold',
            position: 'relative',
            border: '15px solid #f4f4f4',
            fontFamily: "'montserrat', sans-serif", 
            fontSize: '60px',
            backgroundColor: 'white',
            color: 'black',
            marginRight: 'auto',
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
       
        >
         <h1 style={{      fontFamily: "'montserrat', sans-serif", 
            fontSize: '30px', padding: '20px', position: 'absolute', 
            top: '-65px', color: 'grey', left: '40px',
            backgroundColor: 'white',}}>Format</h1>
        <TeacherAssignmentHome onFormatSelect={handleFormatSelect} />
        </div>
      </div>
    )}
   
  </div>
);
}

export default Assignments;