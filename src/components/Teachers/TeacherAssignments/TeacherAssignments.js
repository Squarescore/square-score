


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
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
} from 'lucide-react';
import CreateFolder from './CreateFolder';
import SearchToggle from './SearchToggle';

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

  const fetchAssignments = async () => {
    try {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);
  
      if (classDoc.exists()) {
        const data = classDoc.data();
        const assignmentsData = data.assignments || [];
  
        // Get the viewable assignments array
        const viewableAssignments = data.viewableAssignments || [];
  
        const fetchedAssignments = assignmentsData.map((assignment) => {
          const id = assignment.id;
          const name = assignment.name;
          const timestamp = id.split('+')[1];
          const format = id.split('+')[2];
  
          return {
            id,
            name,
            type: format,
            timestamp,
            date: new Date(parseInt(timestamp)),
            // Only set viewable to true if the ID is explicitly in the viewableAssignments array
            viewable: viewableAssignments.includes(id),
          };
        });
  
        const sortedAssignments = fetchedAssignments.sort(
          (a, b) => b.date - a.date
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
        const folderIds = classDocSnap.data().folders || [];
        const folderPromises = folderIds.map((folderId) =>
          getDoc(doc(db, 'folders', folderId))
        );
        const folderSnapshots = await Promise.all(folderPromises);
        const fetchedFolders = folderSnapshots.map((snap) => ({
          id: snap.id,
          ...snap.data(),
        }));
        setFolders(fetchedFolders);
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

  // Handle creating a new folder
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
          folders: [...currentFolders, newFolderRef.id],
        });
      }

      setFolders([
        ...folders,
        { id: newFolderRef.id, name: newFolderName, color: newFolderColor, assignments: [] },
      ]);
      setShowFolderForm(false);
      setNewFolderName('');
      setNewFolderColor(pastelColors[0]);
      await fetchFolders();
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  // Handle adding assignment to folder
  const addAssignmentToFolder = async (assignment) => {
    if (!selectedFolder) return;

    try {
      const folderRef = doc(db, 'folders', selectedFolder);
      const folderDoc = await getDoc(folderRef);

      if (folderDoc.exists()) {
        const currentAssignments = folderDoc.data().assignments || [];

        // Handle different date formats
        let createdAtString = '';
        if (assignment.createdDate) {
          if (typeof assignment.createdDate.toDate === 'function') {
            createdAtString = assignment.createdDate.toDate().toISOString();
          } else if (assignment.createdDate instanceof Date) {
            createdAtString = assignment.createdDate.toISOString();
          } else if (typeof assignment.createdDate === 'string') {
            createdAtString = assignment.createdDate;
          }
        } else {
          createdAtString = new Date().toISOString();
        }

        const assignmentInfo = {
          id: assignment.id,
          name: assignment.name || assignment.assignmentName,
          createdAt: createdAtString,
        };

        if (!currentAssignments.some((a) => a.id === assignment.id)) {
          await updateDoc(folderRef, {
            assignments: [...currentAssignments, assignmentInfo],
          });

          // Update local state
          setFolders((prevFolders) =>
            prevFolders.map((f) =>
              f.id === selectedFolder
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

  // Fetch assignments within a folder
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

  // Open folder modal
  const openFolderModal = async (folder) => {
    setSelectedFolder(folder.id);
    setShowFolderModal(true);
    const assignmentsInFolder = await fetchFolderAssignments(folder.id);
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
          textAlign: 'center',
          color: '#666',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '18px',
          marginTop: '40px',
        }}
      >
        {message}
      </div>
    );
  };

  // Render Folder Modal
  const renderFolderModal = () => {
    if (!selectedFolder) return null;
    const folder = folders.find((f) => f.id === selectedFolder);
    if (!folder) return null;

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
            width: '500px',
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '12px',
            position: 'relative',
          }}
        >
          <button
            onClick={() => setSelectedFolder(null)}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <SquareX size={24} />
          </button>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              backgroundColor: folder.color.bg,
              height: '70px',
              width: '100%',
              border: `10px solid ${folder.color.text}`,
              borderRadius: '20px 20px 0px 0px',
              position: 'relative',
            }}
          >
            <Folder
              size={40}
              color={folder.color.text}
              strokeWidth={3}
              style={{ marginLeft: '30px', marginTop: '15px' }}
            />
            <h2
              style={{
                marginLeft: '20px',
                color: folder.color.text,
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              {folder.name}
            </h2>
          </div>
          <button
            onClick={() => setShowAddAssignmentsModal(true)}
            style={{
              backgroundColor: folder.color.bg,
              color: folder.color.text,
              border: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '16px',
              marginBottom: '20px',
            }}
          >
            Add Assignments <SquarePlus size={20} />
          </button>
          {/* Render folder assignments if any */}
          {folderAssignments.length > 0 ? (
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              {folderAssignments.map((assignment) => (
                <li
                  key={assignment.id}
                  onClick={() => handleItemClick(assignment)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 15px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      fontSize: '18px',
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: '500',
                    }}
                  >
                    {assignment.name}
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      color: '#666',
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                    {formatDate(assignment.createdAt)}
                  </span>
                  {assignment.viewable && <Eye size={16} color="#92A3FF" />}
                </li>
              ))}
            </ul>
          ) : (
            <div
              style={{
                textAlign: 'center',
                color: '#666',
                fontFamily: "'Montserrat', sans-serif",
                fontSize: '18px',
                marginTop: '40px',
              }}
            >
              This folder is empty. Add assignments using the button above.
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Add Assignments Modal
  const renderAddAssignmentsModal = () => {
    if (!showAddAssignmentsModal) return null;

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
            width: '500px',
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '12px',
            position: 'relative',
            boxShadow: '0px 4px 10px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <button
              onClick={() => setShowAddAssignmentsModal(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginRight: '10px',
              }}
            >
              <SquareArrowLeft size={24} />
            </button>
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 8px 8px 35px',
                borderRadius: '20px',
                border: '1px solid #ccc',
                fontSize: '16px',
                outline: 'none',
              }}
            />
          </div>
          <div
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {assignments.length > 0 ? (
              assignments
                .filter(
                  (assignment) =>
                    (assignment.name || assignment.assignmentName)
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) &&
                    (!selectedFolder ||
                      !folders.find((f) => f.id === selectedFolder)?.assignments.includes(assignment.id))
                )
                .map((assignment) => (
                  <div
                    key={assignment.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 15px',
                      borderRadius: '8px',
                      border: '1px solid #f0f0f0',
                      marginBottom: '10px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '18px',
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: '500',
                      }}
                    >
                      {assignment.name}
                    </span>
                    <span
                      style={{
                        fontSize: '14px',
                        color: '#666',
                        fontFamily: "'Montserrat', sans-serif",
                      }}
                    >
                      {formatDate(assignment.timestamp)}
                    </span>
                    <button
                      onClick={() => addAssignmentToFolder(assignment)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <SquarePlus size={20} color="#7BE06A" />
                    </button>
                  </div>
                ))
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  color: '#666',
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: '18px',
                  marginTop: '40px',
                }}
              >
                No assignments available to add.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
      </div>




      {/* Active Tab Info and Action Button */}
      <div
        style={{
          width: 'calc(100% - 200px)',
          marginLeft: '200px',
          marginTop: '150px',
          display: 'flex',
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
              color: 'grey', marginTop: '10px',
              marginBottom: '-10px',
              border: '1px solid lightgrey',
              padding: '8px 16px',
              borderRadius: '5px',
              marginRight: '4%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '16px',
            }}
          >
            Create Folder <FolderPlus size={20} />
          </button>
        ) : activeTab === 'published' ? (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              backgroundColor: 'white',
              color: 'grey',
              border: '1px solid lightgrey',
              marginTop: '10px',
              marginBottom: '-10px',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '4%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '16px',
            }}
          >
            Create Assignment <SquarePlus size={20} />
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
              marginRight: '4%',
              display: 'flex',
              fontWeight: '500',

              alignItems: 'center',
              gap: '8px',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '16px',
            }}
          >
           Continue where you left off
          </h1>
        ) : null}

      </div>

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
          {renderFolderModal()}
          {renderAddAssignmentsModal()}

          {activeTab === 'folders' ? (
            folders.length > 0 ? (
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                {folders.map((folder) => (
                  <li
                    key={folder.id}
                    onClick={() => openFolderModal(folder)}
                    style={{
                      backgroundColor: '#fff',
                      padding: '15px 20px',
                      marginBottom: '10px',
                      borderRadius: '8px',
                      boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
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
                        fontSize: '18px',
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: '500',
                      }}
                    >
                      {folder.name}
                    </span>
                    <button
                      style={{
                        backgroundColor: '#007BFF',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontFamily: "'Montserrat', sans-serif",
                      }}
                    >
                      View
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <h1 style={{marginTop: '-20px', fontWeight: '500'}}>
                {renderNoContentMessage()}</h1>
            )
          ) : (









            <ul style={{ listStyleType: 'none', padding: 0,  width: 'calc(100% - 200px)', 
              marginLeft: '200px', }}>
              {filteredAssignments.length > 0 ? (
             filteredAssignments.map((item, index) => (
                  <li
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    style={{
                  
                      padding: ' 20px 4% ',
                      width: '92%',
                      borderBottom:  '2px solid #f4f4f4',
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
                    <span
                      style={{
                        fontSize: '16px',
                        color: 'lightgrey',
                        marginLeft: 'auto',
                        marginRight: '100px',
                        fontWeight: '600',
                        fontFamily: "'Montserrat', sans-serif",
                      }}
                    >
                      {formatDate(item.id)}
                    </span>
                    <div style={{ marginRight: '0px', height: '30px', width: '50px', position: 'relative'}}>{getFormatDisplay(item.type)}</div>
                    {item.viewable && (
                      <Eye
                        size={20}
                        strokeWidth={3}
                        color="#92A3FF"
                        style={{
                          position: 'absolute',
                          right: '200px',
                          bottom: '16px',
                        }}
                      />
                    )}
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
