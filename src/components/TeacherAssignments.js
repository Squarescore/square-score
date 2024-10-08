import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc , setDoc, arrayUnion} from 'firebase/firestore';
import { db } from './firebase';
import { updateDoc, addDoc } from 'firebase/firestore';
import Navbar from './Navbar';
import { useLocation } from 'react-router-dom';
import TeacherAssignmentHome from './TeacherAssignmentHome'; // Import the TeacherAssignmentHome component
import { v4 as uuidv4 } from 'uuid';
import { BookOpenText, SquareX, SquarePlus, PencilRuler, Folder } from 'lucide-react';
const pastelColors = [
  
  { bg: '#FFECA9', text: '#F0856E' },
  { bg: '#FFB3BA', text: '#A30015' },
  { bg: '#BAFFC9', text: '#147B00' },
  { bg: '#BAE1FF', text: '#0057A3' },
  { bg: '#FFC6FF', text: '#8B008B' },
  { bg: '#FFDFBA', text: '#A36200' },
  { bg: '#E0BBFF', text: '#4B0082' },
  { bg: '#B5EAD7', text: '#006400' },
  
];

function Assignments() {
  const [activeTab, setActiveTab] = useState('Assignments');

  const { classId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [sortBy, setSortBy] = useState('assignments');
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

 
  const handleAddAssignmentsToFolder = (folderId) => {
    setSelectedFolderForAssignments(folderId);
  };
 
  const location = useLocation();
  const navigate = useNavigate();
  const getSortButtonStyle = (option) => {
    const baseStyle = {
      fontSize: '25px',
      height: '20px',
      fontWeight: 'bold',
      width: '230px',
      display: 'flex',
      fontFamily: "'Radio Canada', sans-serif",
      borderRadius: '8px',
      border: '4px solid ',
      marginTop: '20px',
      zIndex: '100',
      textAlign: 'left',
    lineHeight: '0px',
      cursor: 'pointer',padding: '25px 10px',
    };

    if (sortBy === option) {
      switch (option) {
        case 'assignments':
          return { ...baseStyle, backgroundColor: '#B0BDFF', color: '#020CFF', borderColor: '#020CFF' };
        case 'folders':
          return { ...baseStyle, backgroundColor: '#FFECA9', color: '#F0856E',borderColor: '#F0856E'  };
        case 'format':
          return { ...baseStyle, backgroundColor: '#BAA9FF', color: '#4A0BFF',borderColor: '#4A0BFF'  };
        case 'drafts':
          return { ...baseStyle, backgroundColor: '#F8CFFF', color: '#E01FFF',borderColor: '#E01FFF'  };
        default:
          return baseStyle;
      }
    } else {
      return { ...baseStyle, backgroundColor: 'transparent', color: '#676767',borderColor: 'transparent'  };
    }
    
  };

  

  const handleCreateFolder = async () => {
    if (newFolderName.trim() === '') return;

    try {
      const newFolderRef = await addDoc(collection(db, 'folders'), {
        name: newFolderName,
        color: newFolderColor,
        classId: classId,
        assignments: []
      });

      const classDocRef = doc(db, 'classes', classId);
      const classDocSnap = await getDoc(classDocRef);
      if (classDocSnap.exists()) {
        const currentFolders = classDocSnap.data().folders || [];
        await updateDoc(classDocRef, {
          folders: [...currentFolders, newFolderRef.id]
        });
      }

      setFolders([...folders, { id: newFolderRef.id, name: newFolderName, color: newFolderColor }]);
      setShowFolderForm(false);
      setNewFolderName('');
      setNewFolderColor(pastelColors[0]);
    } catch (error) {
      console.error("Error creating folder:", error);
    }
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
  
  const getSearchBarStyle = () => {
    let backgroundColor, color, iconSrc;
    switch (sortBy) {
      case 'assignments':
        backgroundColor = 'rgba(176, 189, 255, 0.3)';  // #B0BDFF with 30% opacity
        color = '#020CFF';
        
        iconSrc = '/BlueSearch.png';
        break;
      case 'folders':
        backgroundColor = 'rgba(255, 236, 169, 0.3)';  // #FFECA9 with 30% opacity
        color = '#F0856E';
        iconSrc = '/OrangeSearch.png';
        break;
      case 'format':
        backgroundColor = 'rgba(186, 169, 255, 0.3)';  // #BAA9FF with 30% opacity
        color = '#4A0BFF';
        iconSrc = '/PurpleSearch.png';
        break;
      case 'drafts':
        backgroundColor = 'rgba(248, 207, 255, 0.3)';  // #F8CFFF with 30% opacity
        color = '#E01FFF';
        iconSrc = '/PinkSearch.png';
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

  const handleFormatSelect = async (selectedFormat) => {
    if (!classId || !selectedFormat) {
      console.error('ClassId is empty or no format selected');
      return;
    }

    const newAssignmentId = uuidv4();
    let assignmentId = `${classId}+${newAssignmentId}+${selectedFormat}`;
    let collectionName = '';
    let classFieldName = '';
    let navigationPath = '';

    switch (selectedFormat) {
      case 'SAQ':
        collectionName = 'assignments(saq)';
        classFieldName = 'assignment(saq)';
        navigationPath = `/class/${classId}/createassignment/${assignmentId}`;
        break;
      case 'ASAQ':
        collectionName = 'assignments(Asaq)';
        classFieldName = 'assignment(Asaq)';
        navigationPath = `/class/${classId}/SAQA/${assignmentId}`;
        break;
      case 'MCQ':
        collectionName = 'assignments(mcq)';
        classFieldName = 'assignment(mcq)';
        navigationPath = `/class/${classId}/MCQ/${assignmentId}`;
        break;
      case 'AMCQ':
        collectionName = 'assignments(Amcq)';
        classFieldName = 'assignment(Amcq)';
        navigationPath = `/class/${classId}/MCQA/${assignmentId}`;
        break;
      default:
        console.error('Invalid format selected');
        return;
    }

    const assignmentData = {
      classId,
      assignmentType: selectedFormat,
      isAdaptive: selectedFormat === 'ASAQ' || selectedFormat === 'AMCQ',
      assignmentId
    };
    
    try {
      const assignmentRef = doc(db, collectionName, assignmentId);
      await setDoc(assignmentRef, assignmentData);
    
      const classRef = doc(db, 'classes', classId);
      await updateDoc(classRef, {
        [classFieldName]: arrayUnion(assignmentId)
      });
    
      navigate(navigationPath);
    } catch (error) {
      console.error('Error creating assignment:', error);
      // Handle the error (e.g., show an error message to the user)
    }
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
          zIndex: 1000,
          display: 'flex',
          backdropFilter: 'blur(5px)',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          overflow: 'auto'
        }}
      >
      
        <div style={{position: 'relative', width:'500px', background: '#f4f4f4', padding: '10px', borderRadius: '20px', height:'200px', border: '10px solid lightgrey'}}>
        <button 
          onClick={toggleCreateModal}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '30px',
            height: '30px', 
            background: 'white',
            fontSize: '24px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <div style={{marginTop: '-5px', marginLeft: '-8px'}}>
          <SquareX size={40} color="#a3a3a3" strokeWidth={3} /></div>
        </button>
        <h2 style={{ fontSize: '50px', marginBottom: '20px', fontFamily: "'Rajdhani', sans-serif", textAlign: 'center', color:'grey' }}>Select Format</h2>
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

  const handleSortClick = (type) => {
    setSortBy(type);
    setActiveTab (type)
    setSelectedFolder(null);
    setSelectedFormat(null);
    setSearchTerm('');
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
              fontFamily: "'Radio Canada', sans-serif",
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
                fontFamily: "'Radio Canada', sans-serif",
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
              fontFamily: "'Radio Canada', sans-serif",
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
                fontFamily: "'Radio Canada', sans-serif",
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
            fontFamily: "'Radio Canada', sans-serif",
            color: '#E01FFF'  // Color for unknown types or drafts
          }}>
            {type}
          </span>
        );
    }
  };

  const addAssignmentToFolder = async (assignmentId) => {
    try {
      const type = getAssignmentType(assignmentId);
      const collectionName = `assignments(${type.toLowerCase()})`;
      const assignmentRef = doc(db, collectionName, assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);

      if (assignmentDoc.exists()) {
        const currentFolders = assignmentDoc.data().folders || [];
        if (!currentFolders.includes(selectedFolder.id)) {
          await updateDoc(assignmentRef, {
            folders: [...currentFolders, selectedFolder.id]
          });
        }

        // Update local state
        setAllAssignments(prevAssignments => 
          prevAssignments.map(assignment => 
            assignment.id === assignmentId 
              ? { ...assignment, folders: [...(assignment.folders || []), selectedFolder.id] }
              : assignment
          )
        );

        // Refresh folder assignments
        const updatedFolderAssignments = await fetchFolderAssignments(selectedFolder.id);
        setFolderAssignments(updatedFolderAssignments);
      }
    } catch (error) {
      console.error("Error adding assignment to folder:", error);
    }
  };

  const fetchFolderAssignments = async (folderId) => {
    const assignmentCollections = ['assignments(saq)', 'assignments(asaq)', 'assignments(mcq)', 'assignments(amcq)'];
    let folderAssignments = [];

    for (const collectionName of assignmentCollections) {
      const q = query(collection(db, collectionName), where('folders', 'array-contains', folderId));
      const querySnapshot = await getDocs(q);
      folderAssignments = [...folderAssignments, ...querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))];
    }

    return folderAssignments;
  };

  const openFolderModal = async (folder) => {
    setSelectedFolder(folder);
    setShowFolderModal(true);
    const folderAssignments = await fetchFolderAssignments(folder.id);
    setFolderAssignments(folderAssignments);
  };
  const renderAddAssignmentsModal = () => {
    if (!showAddAssignmentsModal) return null;
    return (
      <div style={{
        position: 'fixed',
        width: '800px', // Increased width to accommodate 2 columns
        backdropFilter: 'blur(5px)',
        backgroundColor: 'rgb(250,250,250,.9)',
        borderLeft: `4px solid grey`,
        padding: '20px',
        zIndex: 102,
        height: '700px',
        overflowY: 'auto'
      }}>
        <button
          onClick={() => setShowAddAssignmentsModal(false)}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            opacity: 0.5,
          }}
        >
          ×
        </button>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '100px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchTermAddAssignments}
            onChange={(e) => setSearchTermAddAssignments(e.target.value)}
            style={{
              width: '300px',
              padding: '10px',
              border: `2px solid ${selectedFolder.color.text}`,
              borderRadius: '5px',
              flexGrow: 1,
            }}
          />
          <button
            onClick={() => setSearchTermAddAssignments('')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              marginLeft: '10px',
            }}
          >
            ×
          </button>
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
                  width: '350px', 
                  marginBottom: '20px',
                  borderRadius: '15px',
                  padding: '10px',
                  height: '60px',
                  position: 'relative',
                  backgroundColor: 'white',
                  border: '4px solid #f4f4f4',
                }}>
                  <div>
                    <div style={{
                      fontFamily: "'Radio Canada', sans-serif",
                      fontWeight: 'bold',
                      fontSize: '20px'
                    }}>
                      {assignment.name || assignment.assignmentName}
                    </div>
                    <h1 style={{
                      fontSize: '20px',
                      zIndex: '50',
                      position: 'absolute',
                      top: '-20px',
                      left: '80px'
                    }}>
                      {getFormatDisplay(assignment)}
                    </h1>
                  </div>
                  <button
                    onClick={() => addAssignmentToFolder(assignment.id)}
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
          height: '60%',
          backgroundColor: selectedFolder.color.bg,
          border: `10px solid ${selectedFolder.color.text}`,
          borderRadius: '30px',
          padding: '20px',
          display: 'flex',
          position: 'relative',
          flexDirection: 'column',
        }}>
          <button
            onClick={() => setSelectedFolder(null)}
            style={{
              position: 'absolute',
              top: '20px',
              fontWeight: 'bold',
              right: '20px',
              background: 'none',
              border: 'none',
              fontSize: '44px',
              cursor: 'pointer',
              color: selectedFolder.color.text,
              zIndex: 102,
            }}
          >
           <SquareX size={40} color={selectedFolder.color.text} strokeWidth={3} />
          </button>
          <div style={{
            backgroundColor: selectedFolder.color.bg,
            height: '70px',
            width: '300px',
            position: 'absolute',
            top: '-65px',
            zIndex: '-1',
            left: '-6px',
            border: `10px solid ${selectedFolder.color.text}`,
            borderRadius: '30px',
            borderBottomLeftRadius: '0px',
            borderBottomRightRadius: '0px',
          }}>
            <h2 style={{
              color: selectedFolder.color.text,
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '34px',
              marginTop: '5px',
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
              top: '30px',
              width: '400px',
              left: '20px',
              padding: '10px 20px',
              color: selectedFolder.color.text,
              border: `0px solid ${selectedFolder.color.text}`,
              backgroundColor: getBackgroundColorWithOpacity(selectedFolder.color.text, 0.2), // 0.2 is the opacity, adjust as needed
              borderRadius: '15px',
              cursor: 'pointer',
              fontSize: '30px',
              display: 'flex' ,
              height: '60px',
              fontFamily: "'Radio Canada', sans-serif",
              fontWeight: 'bold',
            }}
          >
            Add Assignments <div style={{marginLeft: '60px'}}><SquarePlus size={40} color={selectedFolder.color.text} strokeWidth={3} /></div> 
          </button>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', overflow: 'auto', marginTop: '100px', left: '10px' }}>
            {folderAssignments.length > 0 ? (
              folderAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  onClick={() => handleItemClick(assignment)}
                  style={{
                    width: 'calc(30.33% - 20px)',
                    padding: '10px',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: `3px solid ${selectedFolder.color.text}`,
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
                      fontFamily: "'Radio Canada', sans-serif", 
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '70%'
                    }}>
                      {assignment.name || assignment.assignmentName}
                    </h3>
                   <div style={{position: 'absolute',top: '-50px'}}> {getFormatDisplay(assignment.id)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                width: '100%', 
                textAlign: 'center', 
                color: selectedFolder.color.text, 
                fontFamily: "'Radio Canada', sans-serif",
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
    ) : assignments.length > 0 || drafts.length > 0 ? (
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
            <h1 style={{ color: 'black', fontSize: '80px', fontFamily: "'Rajdhani', sans-serif", marginLeft: '0px' }}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <div style={{marginTop: '80px', width: '300px', marginLeft: '100px', position: 'relative'}}>
            {sortBy === 'folder' && (
                <button
                  onClick={() => setShowFolderForm(!showFolderForm)}
                  style={{
                    backgroundColor: "#f4f4f4",
                   
                   marginLeft: '250px',
                    width: showSearchBar ? '70px' : '300px',
                    height: '70px',
                    cursor: 'pointer',
                    fontSize: showSearchBar ? '24px' : '30px', 
                    borderRadius: '10px',
                    color: 'grey',
                    border: `4px solid #f4f4f4`,
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 'bold',
                    zIndex: 9,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {showSearchBar ? '+' : 'Create Folder'}
                </button>
              )}


{!showSearchBar ? (
                  <button
                    onClick={() => setShowSearchBar(true)}
                    style={{ 
                      height: '50px', 
                      backgroundColor: 'transparent', 
                      border: 'none',
                      padding: '5px', 
                      width: '80px',
                      cursor: 'pointer',
                    }}
                  >
                    <img style={{ width: '30px' }} src={getSearchBarStyle().iconSrc} alt="Search" />
                  </button>
              ) : (














                <div style={{ position: 'relative', width: '300px', height: '40px' }}>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    height: '100%',
                    fontSize: '20px',
                    fontFamily: "'Radio Canada', sans-serif",
                    padding: '5px 40px 5px 20px',
                    border: 'none',
                    marginLeft: '-50px',
                    backgroundColor: getSearchBarStyle().backgroundColor,
                    color: getSearchBarStyle().color,
                    borderRadius: '100px',
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
                    top: '75%',
                    right: '25px',
                    transform: 'translateY(-65%)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                  }}
                >
                  <img style={{ width: '30px' }} src={getSearchBarStyle().iconSrc} alt="Close" />
                </button>
              </div>
            )}
            </div>
                        </div>













            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', width: '920px', marginLeft: '20px' }}>
              <div style={{
               
                flexDirection: 'column',
                padding: '20px',
                marginTop: '-15px',
                width: '250px',
                 position: 'fixed',
                 left: '0px', top: '0px' ,
                 height: '100%',

              background:'#f4f4f4'
              }}>
               <div style={{  height: '25px', zIndex: '10', width: '100px', marginTop: '100px',
                 
                }}>
                    <button
  onClick={toggleCreateModal}
  style={{
    border: '4px solid transparent',
    padding: '5px',
    zIndex: 100,
    width: '230px',
    height: '80px',
    color:'grey',
    fontFamily: "'Radio Canada', sans-serif",
    display: 'flex',
    backgroundColor: 'transparent',
    textAlign: 'center',
    borderRadius: '10px',
    padding: '25px 10px',
    cursor: 'pointer',
    transition: '.3s',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.borderColor = '#00B94A';
    e.currentTarget.style.backgroundColor = '#AEF2A3';
    e.currentTarget.style.color = '#1ca800';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.borderColor = 'transparent';
    e.currentTarget.style.color = 'grey';
    e.currentTarget.style.backgroundColor = 'transparent';
  }}
>
  <div style={{ display: 'flex', alignItems: 'center', marginTop: '-35px' }}>
    <SquarePlus size={50} />
    <h2 style={{
      fontSize: '35px',
      fontWeight: 'bold',
      userSelect: 'none',
      width: '200px',
      textAlign: 'left',
      marginTop: '25px',
      marginLeft: '10px',
      fontFamily: "'Radio Canada', sans-serif",
    }}>
      Create
    </h2>
  </div>
</button>

          <div style={{ 
              height: '4px', 
              width: '220px', 
              background: '#DEDEDE', 
              marginLeft: '10px',  
              marginTop: '20px'
            }}></div>

                
                  {[
                    { option: 'assignments', icon: BookOpenText },
                    { option: 'folders', icon: Folder },
                    { option: 'drafts', icon: PencilRuler },
                    
                  ].map(({option, icon: Icon})  => (
                    
                    <div>
                      <button
                      key={option}
                      style={getSortButtonStyle(option)}
                      onClick={() => handleSortClick(option)}
                    >
                        <div style={{display: 'flex', marginTop: '-20px'}}>
                    <Icon 
                size={40} 
                color={getSortButtonStyle[option]} 
                strokeWidth={ 2} 
              />
              <h1 style={{fontSize: '25px', marginTop: '20px', marginLeft: '10px'}}>   {option.charAt(0).toUpperCase() + option.slice(1)}
              </h1>
                     </div>
                    </button>
                    <div style={{ 
              height: '4px', 
              width: '205px', 
              background: '#DEDEDE', 
              marginLeft: '10px',  
              marginTop: '20px'
            }}></div>
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
        backgroundColor: 'rgba(250, 250, 250, 0.9)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 101,
      }} 
      >
        <div style={{width: '600px', height: '400px'}}>
         <button
      onClick={() => setShowFolderForm(!showFolderForm)}
      style={{
        padding: '10px',
        height: '70px',
        backgroundColor: showFolderForm ? (newFolderColor ? newFolderColor.bg : '#FFECA9') : 'white',
        width: '300px',
        borderRadius: showFolderForm ? '30px 30px 0 0' : '0',
        cursor: 'pointer',
        marginRight: 'auto',
        fontSize: '30px', 
        color: newFolderColor ? newFolderColor.text : '#F0856E',
        border: `4px solid ${newFolderColor ? newFolderColor.text : '#F0856E'}`,
        borderBottom: showFolderForm ? `4px solid ${newFolderColor ? newFolderColor.bg : '#FFECA9'}` : `4px solid ${newFolderColor ? newFolderColor.text : '#F0856E'}`,
        fontFamily: "'Radio Canada', sans-serif",
        fontWeight: 'bold',
        position: 'relative',
        textAlign: 'left',
        zIndex: 9
      }}
    >
      <h1 style={{fontSize: '30px', marginLeft: '20px', marginTop: '-5px'}}>X</h1>
    </button>
      <div style={{
        
        position: 'absolute',
        
        height: '380px',
        width: '630px',
         
        backgroundColor: newFolderColor ? newFolderColor.bg : '#FFECA9',
        border: `4px solid ${newFolderColor ? newFolderColor.text : '#F0856E'}`,
        borderRadius: '30px',
        zIndex: '10',
        marginTop: '-20px',
        display: 'flex'
      }}>
         <div style={{flex: 2, padding: '20px'}}>
         <div style={{position: 'relative'}}>
         <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value.slice(0, 25))}
                    placeholder="Name"
                    style={{
                      width: '500px',
                      padding: '25px',
                      position: 'relative',
                      marginBottom: '10px',
                      color: newFolderColor ? newFolderColor.text : '#F0856E',
                      fontFamily: "'Radio Canada', sans-serif", 
                      backgroundColor: newFolderColor ? newFolderColor.bg : '#FFECA9',
                      fontWeight: 'bold',
                      fontSize: '30px',
                      outline: 'none',
                      border: `4px solid ${newFolderColor ? newFolderColor.text : '#F0856E'}`,
                      borderRadius: '15px'
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '45px',
                    bottom: '20px',
                    color: newFolderColor ? newFolderColor.text : '#F0856E',
                    fontFamily: "'Radio Canada', sans-serif",
                    fontSize: '14px'
                  }}>
                    {newFolderName.length}/25
                  </span>
                  </div>
            
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              marginBottom: '10px',
              width: '510px',
              border: `4px solid ${newFolderColor ? newFolderColor.text : '#F0856E'}`,
              borderRadius: '20px',
              padding: '20px',
              marginTop: '20px'
            }}>
              <h1 style={{
                width: '150px',
                height: '20px',
                marginBottom: '20px',
                marginTop: '-40px',
                color: newFolderColor ? newFolderColor.text : '#F0856E',
                textAlign: 'center',
                fontFamily: "'Radio Canada', sans-serif",
                background: newFolderColor ? newFolderColor.bg : '#FFECA9',
                padding: '0px 0px'
              }}>
                Theme
              </h1>
              
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center'}}>
                {pastelColors.map((color, index) => (
                  <div
                    key={index}
                    onClick={() => setNewFolderColor(color)}
                    style={{
                      width: '50px',
                      height: '60px',
                      marginTop: '20px',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '5px',
                      backgroundColor: color.bg,
                      borderTopLeftRadius: '10px',
                      borderTopRightRadius: '10px',
                      borderTop: `3px solid ${color.text}`,
                      borderLeft: `3px solid ${color.text}`,
                      borderRight: `3px solid ${color.text}`,
                      boxSizing: 'border-box'
                    }} />
                    <div style={{
                      width: '100%',
                      height: '35px',
                      backgroundColor: color.bg,
                      borderRadius: '3px',
                      border: `3px solid ${color.text}`,
                      boxSizing: 'border-box'
                    }} />
                    {newFolderColor === color && (
                      <div style={{
                        position: 'absolute',
                        top: '22px',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: color.text,
                        border: `2px solid ${color.text}`
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          
            <button
              onClick={handleCreateFolder}
              style={{
                padding: '10px 30px',
                backgroundColor: newFolderColor ? newFolderColor.text : '#F0856E',
                fontWeight: 'bold',
                fontSize: '30px',
                fontFamily: "'Radio Canada', sans-serif",
                color: newFolderColor ? newFolderColor.bg : 'white',
                border: 'none',
                borderRadius: '10px',
                marginTop: '20px',
                cursor: 'pointer'
              }}
            >
              Create Folder
            </button>
          </div>
        </div>
        </div>
      </div>
    )}
    







    <div style={{
      marginTop: '30px', 
      display: 'flex', 
      flexWrap: 'wrap', 
      width: '100%', 
      
      gap: '50px'
    }}>
   {folders
        .filter(folder => folder.classId === classId)
        .map((folder, index) => (
          <div 
            key={folder.id} 
            onClick={() => openFolderModal(folder)}
            style={{ 
              width: 'calc(28% - 14px)', 
              marginBottom: '40px',
              cursor: 'pointer',
            }}
          >
            <div style={{
              padding: '10px',
              height: '130px',
              position: 'relative',
              borderWidth: '6px',
              borderStyle: 'solid',
              borderColor: folder.color.text,
              backgroundColor: folder.color.bg,
              color: folder.color.text,
              borderRadius: '20px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '30px',
            }}>
              <div style={{
                 borderWidth: '6px',
                 borderStyle: 'solid',
                 borderColor: folder.color.text,
                
              backgroundColor: folder.color.bg,
                width: '100px',
                 height: '40px',
                 zIndex: '-1',
                 
              borderRadius: '20px 20px 0px 0px',
                 position: 'absolute',
                  left: '-6px',
                   top: '-30px'
                   
                   }}
                   >

                   </div>
              {folder.name} 
            </div>
          </div>
        ))
      }
           {showFolderModal && renderFolderModal()}
      {showAddAssignmentsModal && renderAddAssignmentsModal()}
  
    </div>
  </div>
)}

          </div>
        </div>
      </div>

        <ul style={{ width: '100%', display: 'flex', flexWrap: 'wrap', padding: 0, margin: 'auto' }}>
        {sortBy !== 'folders' && filteredAssignments.map((item, index) => (
            <li
            key={item.id}
            onClick={() => handleItemClick(item)}
            style={{
              backgroundColor: 'white',
              fontSize: '23px',
              color: 'black',
              width: '350px',
              height: '70px',
              margin: '20px 10px',
              position: 'relative',
              fontFamily: "'Radio Canada', sans-serif",
              listStyleType: 'none',
              textAlign: 'left',
              border: sortBy === 'drafts' ? '4px solid #FBD3FF' : '4px solid #F4F4F4',
              padding: '10px',
              borderRadius: '10px',
              transition: 'all 0.3s ease',
              transform: 'scale(1)',
              cursor: 'pointer', // Always show pointer cursor
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = sortBy === 'drafts' ? '#D500E9' : ' lightgrey';
           
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = sortBy === 'drafts' ? '#FBD3FF' : ' #F4F4F4';
            }}
          >
              <span
                style={{
                  cursor: 'pointer',
                  fontFamily: "'Radio Canada', sans-serif",
                  marginLeft: '10px',
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
                  fontSize: '30px',
                  fontFamily: "'Radio Canada', sans-serif",
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
                    fontWeight: 'bold',
                    width: '60px',
                    marginTop: '0px',
                    fontFamily: "'Radio Canada', sans-serif",
                    color: 'green'
                  }}>
                    MCQ
                  </span>
                  <span style={{
                    position: 'absolute',
                    right: '-38px',
                    top: '40px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    width: '60px',
                    marginTop: '0px',
                    fontFamily: "'Radio Canada', sans-serif",
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
                    width: '60px',
                    marginTop: '0px',
                    fontFamily: "'Radio Canada', sans-serif",
                    color: '#020CFF'
                  }}>
                    SAQ
                  </span>
                  <span style={{
                    position: 'absolute',
                    right: '-38px',
                    top: '40px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    width: '60px',
                    marginTop: '0px',
                    fontFamily: "'Radio Canada', sans-serif",
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
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    width: '60px',
                    marginTop: '0px',
                    fontFamily: "'Radio Canada', sans-serif",
                    color: '#020CFF'
                  }}>
                    SAQ
                  </span>
                 
                </>
              ) :(
                <span style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  width: '60px',
                  marginTop: '0px',
                  fontFamily: "'Radio Canada', sans-serif",
                  color: 'green'
                }}>
                  {item.type}
                </span>
              )}
              <span
                style={{
                  position: 'absolute',
                  left: '20px',
                  bottom: '10px',
                  
                  fontSize: '12px',
                  fontFamily: "'Radio Canada', sans-serif",
                  color: 'lightgrey',
                }}
              >
                {item.createdAt && item.createdAt.toDate().toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
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
         
          <h1 style={{ color: 'black', fontSize: '60px', fontFamily: "'Rajdhani', sans-serif", marginRight: 'auto', marginTop: '100px', }}>Create Your First Assignment</h1>
          
   <h1 style={{width: '940px', textAlign: 'Left', color: 'GREY', marginTop: '-30px'}}>Later you can access assignments, grades, and drafts here. Start by creating your first assignment.</h1>
        <div
         
          style={{
            padding: '10px 10px 30px 0px',
          width: '440px',
          marginTop :'20px',
            fontWeight: 'bold',
            position: 'relative',
            border: '15px solid #f4f4f4',
            fontFamily: "'Rajdhani', sans-serif", 
            fontSize: '60px',
            backgroundColor: 'white',
            color: 'black',
            marginRight: 'auto',
            borderRadius: '30px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
       
        >
         <h1 style={{      fontFamily: "'Rajdhani', sans-serif", 
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
