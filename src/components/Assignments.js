import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { updateDoc, addDoc } from 'firebase/firestore';
import Navbar from './Navbar';
import { useLocation } from 'react-router-dom';

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
  const { classId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [sortBy, setSortBy] = useState('assignment');
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
 
  const handleAddAssignmentsToFolder = (folderId) => {
    setSelectedFolderForAssignments(folderId);
  };
  const location = useLocation();
  const navigate = useNavigate();
  const getSortButtonStyle = (option) => {
    const baseStyle = {
      fontSize: '16px',
      height: '40px',
      fontWeight: 'bold',
      paddingTop: '10px',
      paddingBottom: '30px',
      paddingLeft: '15px',
      paddingRight: '15px',
      fontFamily: "'Radio Canada', sans-serif",
      borderRadius: '5px',
      border: '0px solid #48A49E',
      marginTop: '-7px',
      zIndex: '100',
      cursor: 'pointer',
    };

    if (sortBy === option) {
      switch (option) {
        case 'assignment':
          return { ...baseStyle, backgroundColor: '#B0BDFF', color: '#020CFF' };
        case 'folder':
          return { ...baseStyle, backgroundColor: '#FFECA9', color: '#F0856E' };
        case 'format':
          return { ...baseStyle, backgroundColor: '#BAA9FF', color: '#4A0BFF' };
        case 'drafts':
          return { ...baseStyle, backgroundColor: '#F8CFFF', color: '#E01FFF' };
        default:
          return baseStyle;
      }
    } else {
      return { ...baseStyle, backgroundColor: 'white', color: 'black' };
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

  const handleAddAssignmentToFolder = async (folderId, assignmentId) => {
    try {
      const folderRef = doc(db, 'folders', folderId);
      const folderSnap = await getDoc(folderRef);
      if (folderSnap.exists()) {
        const currentAssignments = folderSnap.data().assignments || [];
        await updateDoc(folderRef, {
          assignments: [...currentAssignments, assignmentId]
        });

        // Update local state
        setFolders(folders.map(folder => 
          folder.id === folderId 
            ? { ...folder, assignments: [...(folder.assignments || []), assignmentId] }
            : folder
        ));
      }
    } catch (error) {
      console.error("Error adding assignment to folder:", error);
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
      case 'assignment':
        backgroundColor = 'rgba(176, 189, 255, 0.3)';  // #B0BDFF with 30% opacity
        color = '#020CFF';
        
        iconSrc = '/BlueSearch.png';
        break;
      case 'folder':
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
  }, [classId]);


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
        snapshots.forEach((snapshot, index) => {
          const filteredDocs = snapshot.docs.filter(doc => doc.id.startsWith(`${classId}+`));
          const assignments = filteredDocs
            .map(doc => {
              const data = doc.data();
              const [, , type] = doc.id.split('+');
              return {
                id: doc.id,
                ...data,
                type: type.replace('*', ''),
                name: data.assignmentName || data.name
              };
            })
            .filter(assignment => assignment.name); // Filter out assignments without names
  
          allAssignments = allAssignments.concat(assignments);
        });
  
        const sortedAssignments = allAssignments.sort((a, b) => {
          const dateA = a.createdDate && typeof a.createdDate.toDate === 'function' ? a.createdDate.toDate() : new Date(0);
          const dateB = b.createdDate && typeof b.createdDate.toDate === 'function' ? b.createdDate.toDate() : new Date(0);
          return dateB - dateA;
        });
  
        setAssignments(sortedAssignments);
        setHasContent(allAssignments.length > 0);
        setFilteredAssignments(sortedAssignments);
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
          default:
            // Default case, if format is not specified or is something else
            navigate(`/class/${classId}/createassignment/DRAFT${item.id}`);
        }
      } else {
        // Navigation for non-draft assignments based on format
        switch (format) {
          case 'ASAQ':
            navigate(`/class/${classId}/dbq/${item.id}/TeacherResultsASAQ`);
            break;
          case 'AMCQ':
            navigate(`/class/${classId}/assignment/${item.id}/TeacherResultsAMCQ`);
            break;
          default:
            navigate(`/class/${classId}/assignment/${item.id}/TeacherResults`);
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
    setSelectedFolder(null);
    setSelectedFormat(null);
    setSearchTerm('');
  };
  const getFormatDisplay = (type) => {
    switch(type) {
      case 'ASAQ':
      case 'SAQ':
        return (
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
            {type === 'ASAQ' && (
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
              cursor: 'pointer',
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
                cursor: 'pointer',
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
        return null;
    }
  };
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar userType="teacher" />

      
    {isLoading ? (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
       
      </div>
    ) : assignments.length > 0 || drafts.length > 0 ? (
        <div style={{ width: '1000px', marginLeft: 'auto', marginRight: 'auto' }}>
            <div 
              onClick={handleCreateFirstAssignment}
            style={{
        border: '15px solid #00B94A',
        padding: '5px',
        zIndex: 100,
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
        width: '350px',
        fontFamily: "'Radio Canada', sans-serif",
        position: 'fixed',
        top: '-60px',
        right: '-80px',
        backgroundColor: 'white',
        textAlign: 'center',
        borderRadius:  '30px',
        height: '200px',
        transition: 'all 0.3s ease-in-out',
      }}>
            <h2 
        style={{
          fontSize: '50px',
          fontWeight: 'bold',
          userSelect: 'none',
          color: 'black',
          width: '280px',
          borderBottomLeftRadius: '10px',
          backgroundColor: 'white',
          marginLeft:  '10px',
          marginTop: '125px',
          fontFamily: "'Rajdhani', sans-serif",
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
        }}>
          Create
        </h2>
    
      </div>
        <div style={{
          marginLeft: 'auto',
          marginRight: 'auto',
          marginTop: '70px',
          padding: '10px',
          backgroundColor: 'transparent',
          borderRadius: '10px'
        }}>
          <h1 style={{ color: 'black', fontSize: '80px', fontFamily: "'Rajdhani', sans-serif", marginLeft: '20px' }}>
            Assignments</h1>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px',justifyContent: 'space-between', position: 'relative', width: '920px',  marginLeft: '20px' }}>
          <div style={{
              width: '400px',
              border: '6px solid #D7D7D7',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px',
              borderRadius: '10px',
              marginTop: '-15px'
            }}>



              <h1 style={{ position: 'absolute', marginTop: '-50px', fontSize: '26px', padding: '8px', backgroundColor: 'white', fontFamily: "'Radio Canada', sans-serif" }}> Sort By</h1>
              <div style={{ display: 'flex', height: '25px' }}>
                {['assignment', 'folder', 'format', 'drafts'].map((option) => (
                  <button
                    key={option}
                    style={getSortButtonStyle(option)}
                    onClick={() => handleSortClick(option)}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
              







              {sortBy === 'format' && (
                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  {[
                    { label: 'SAQ', color: '#020CFF', hasAsterisk: true, value: 'ASAQ' },
                    { label: 'SAQ', color: '#020CFF', hasAsterisk: false, value: 'SAQ' },
                    { label: 'MCQ', color: 'green', hasAsterisk: true, value: 'AMCQ' },
                    { label: 'MCQ', color: 'green', hasAsterisk: false, value: 'MCQ' }
                  ].map(format => (
                    <button
                      key={format.value}
                      style={{
                        padding: '10px',
                        border: selectedFormat === format.value ? `4px solid ${format.color}` : '4px solid #D7D7D7',
                        borderRadius: '10px',
                        backgroundColor: 'white',
                        color: format.color,
                        height: '50px',
                        fontSize: '20px',
                        cursor: 'pointer',
                        fontFamily: "'Radio Canada', sans-serif",
                        fontWeight: 'bold',
                        position: 'relative',
                        width: '80px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                      onClick={() => setSelectedFormat(selectedFormat === format.value ? null : format.value)}
                    >
                      {format.label}
                      {format.hasAsterisk && (
                        <span style={{
                          position: 'absolute',
                          right: '3px',
                          top: '-3px',
                          fontWeight: 'bold',
                          fontFamily: "'Radio Canada', sans-serif",
                          color: '#FCCA18',
                          fontSize: '24px'
                        }}>
                          *
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            



            


            <div style={{  gap: '20px' }}>
           
            {sortBy === 'folder' && (
  <div style={{width: '1000px', position: 'absolute', left: '0px', top: '100px'}}>
    <button
      onClick={() => setShowFolderForm(!showFolderForm)}
      style={{
        padding: '10px',
        backgroundColor: showFolderForm ? (newFolderColor ? newFolderColor.bg : '#FFECA9') : 'white',
        width: '300px',
        cursor: 'pointer',
        marginRight: 'auto',
        fontSize: '30px', 
        borderRadius: '10px',
        color: 'grey',
        border: `6px solid #f4f4f4`,
        fontFamily: "'Radio Canada', sans-serif",
        fontWeight: 'bold',
        position: 'relative',
        zIndex: 9
      }}
    >
      Create Folder
    </button>
    
    {showFolderForm && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(250, 250, 250, 0.5)',
        backdropFilter: 'blur(10px)',
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
        border: `6px solid ${newFolderColor ? newFolderColor.text : '#F0856E'}`,
        borderBottom: showFolderForm ? `6px solid ${newFolderColor ? newFolderColor.bg : '#FFECA9'}` : `6px solid ${newFolderColor ? newFolderColor.text : '#F0856E'}`,
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
        border: `6px solid ${newFolderColor ? newFolderColor.text : '#F0856E'}`,
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
                      border: `6px solid ${newFolderColor ? newFolderColor.text : '#F0856E'}`,
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
              border: `6px solid ${newFolderColor ? newFolderColor.text : '#F0856E'}`,
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
      marginTop: '40px', 
      display: 'flex', 
      flexWrap: 'wrap', 
      width: '100%', 
      
      gap: '20px'
    }}>
    {folders
        .filter(folder => folder.classId === classId)
        .map((folder, index) => (
          <div 
            key={folder.id} 
            style={{ 
              width: 'calc(28% - 14px)', 
              marginBottom: '40px',
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
              fontSize: '30px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
              {folder.name} dsad asd
            </div>
          </div>
        ))
      }
    </div>
  </div>
)}

              {!showSearchBar ? (
                <button
                  onClick={() => setShowSearchBar(true)}
                  style={{ 
                   
                    height: '40px', 
                    backgroundColor: 'transparent', 
                    border: 'none',
                    padding: '5px', 
                   width:' 80px',
                    cursor: 'pointer',
                    alignSelf: 'flex-end'
                  }}
                >
                  <img style={{ width: '30px' }} src={getSearchBarStyle().iconSrc} alt="Search" />
                </button>
              ) : (














                <div style={{ position: 'relative', width: '300px', height: '30px', marginRight: '20px' }}>
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
                      padding: '5px',
                      border: `none`,
                      backgroundColor: getSearchBarStyle().backgroundColor,
                      color: getSearchBarStyle().color,
                      borderRadius: '100px',
                      paddingLeft: '20px',
                      
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => setShowSearchBar(false)}
                    style={{
                      width: '30px',
                      height: '30px',
                      position: 'absolute',
                      top: '20px',
                      right: '5px',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0',
                    }}
                  >
                    <img style={{ width: '30px' }} src={getSearchBarStyle().iconSrc} alt="Search" />
                  </button>
                </div>
              )}
              </div>
          </div>
        </div>

        <ul style={{ width: '100%', display: 'flex', flexWrap: 'wrap', padding: 0, margin: 'auto' }}>
        {sortBy !== 'folder' && filteredAssignments.map((item, index) => (
            <li
            key={item.id}
            onClick={() => handleItemClick(item)}
            style={{
              backgroundColor: 'white',
              fontSize: '23px',
              color: 'black',
              width: '410px',
              height: '70px',
              margin: '25px',
              position: 'relative',
              fontFamily: "'Radio Canada', sans-serif",
              listStyleType: 'none',
              textAlign: 'left',
              border: sortBy === 'drafts' ? '6px solid #FBD3FF' : '6px solid #F4F4F4',
              padding: '10px',
              borderRadius: '10px',
              transition: 'all 0.3s ease',
              transform: 'scale(1)',
              cursor: 'pointer', // Always show pointer cursor
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'scale(1)';
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
                  fontSize: '40px',
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
              ) : (
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
         
          <h1 style={{ color: 'black', fontSize: '80px', fontFamily: "'Rajdhani', sans-serif", marginRight: 'auto' }}>Assignments</h1>
          
   <h1 style={{width: '940px', textAlign: 'Left', color: 'GREY', marginTop: '-30px'}}>This is the page where grades and all assignment information such as grades, settings, and drafts can be accessed, get started by creating this classes first assignment</h1>
        <button
          onClick={handleCreateFirstAssignment}
          style={{
            padding: '55px 30px',
          width: '940px',
          marginTop :'40px',
            fontWeight: 'bold',
            border: '15px solid #00D355',
            fontFamily: "'Rajdhani', sans-serif", 
            fontSize: '60px',
            backgroundColor: 'white',
            color: 'black',
            borderRadius: '30px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = '0px 6px 8px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = 'none';
          }}
        >
          Create Assignment +
        </button>
      </div>
    )}
  </div>
);
}

export default Assignments;
