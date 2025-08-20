


import React, { useState, useEffect, useRef } from 'react';
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
import { db } from '../Universal/firebase';
import Navbar from '../Universal/Navbar';
import TeacherAssignmentHome from './TeacherAssignments/TeacherAssignmentHome'; // Ensure this component handles creating assignments

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
  ChevronDown,
  SlidersHorizontal,
  X,
  CalendarArrowDown,
  CalendarArrowUp,
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowDown10,
  ArrowUp01,
  ArrowDown01,
  ArrowUp,
  ListFilter,
} from 'lucide-react';
import CreateFolder from './TeacherAssignments/CreateFolder';

import Folders from './TeacherAssignments/Folders';
import FolderModal from './TeacherAssignments/FolderModal';
import FolderView from './TeacherAssignments/FolderView';

import AddAssignmentsView from './TeacherAssignments/AddAssignmentsModal';
import FolderHeader from './TeacherAssignments/FolderHeader';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import { GlassContainer } from '../../styles';
import TabButtons from '../Universal/TabButtons';

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

function TeacherClassHome() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('activeTab');
    // If the saved tab was 'create' or doesn't exist, default to 'published'
    return (savedTab === 'create' || !savedTab) ? 'published' : savedTab;
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
  const [classPerformance, setClassPerformance] = useState([]);
  const [classData, setClassData] = useState({});
  const [classAverage, setClassAverage] = useState(0);
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showFiltersPopup, setShowFiltersPopup] = useState(false);
  const [sortOrder, setSortOrder] = useState('new-old'); // Default sort
  const [alphabeticalOrder, setAlphabeticalOrder] = useState(null); // 'a-z' or 'z-a' or null
  const [gradeOrder, setGradeOrder] = useState(null); // 'high-low' or 'low-high' or null
  const [showAdaptiveOnly, setShowAdaptiveOnly] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [selectedGradeRange, setSelectedGradeRange] = useState('all');

  // Add ref for clicking outside detection
  const filtersRef = useRef(null);

  // Handle clicking outside of filters popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setShowFiltersPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAddAssignmentToFolder = async (assignmentId) => {
    try {
      const folderToUpdate = folders.find(f => f.id === selectedFolder);
      if (!folderToUpdate) return;
  
      const updatedFolder = {
        ...folderToUpdate,
        assignments: [...folderToUpdate.assignments, assignmentId]
      };
  
      const updatedFolders = folders.map(f => 
        f.id === selectedFolder ? updatedFolder : f
      );
  
      const classDocRef = doc(db, 'classes', classId);
      await updateDoc(classDocRef, {
        folders: updatedFolders
      });
  
      setFolders(updatedFolders);
    } catch (error) {
      console.error('Error adding assignment to folder:', error);
    }
  };
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
  const handleDeleteFolder = async (folderId) => {
    try {
      const updatedFolders = folders.filter(f => f.id !== folderId);
      
      const classDocRef = doc(db, 'classes', classId);
      await updateDoc(classDocRef, {
        folders: updatedFolders
      });
  
      setFolders(updatedFolders);
      setSelectedFolder(null); // Go back to folders view
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
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
    // Don't save 'create' tab state to localStorage
    if (activeTab !== 'create') {
      localStorage.setItem('activeTab', activeTab);
    }

    // Reset filtered assignments when tab changes
    const fetchData = async () => {
      if (activeTab === 'published') {
        await fetchAssignments();
      } else if (activeTab === 'drafts') {
        await fetchDrafts();
      }
    };
    fetchData();
  }, [activeTab]);

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update the useEffect that handles graph visibility
  useEffect(() => {
    // Auto-close graph when viewing a specific folder
    if (activeTab === 'folders' && selectedFolder) {
      setIsGraphExpanded(false);
    }
  }, [activeTab, selectedFolder]);

  // Update the graph toggle function
  const toggleGraph = () => {
    // Only allow toggling if not viewing a specific folder
    if (!(activeTab === 'folders' && selectedFolder)) {
      setIsGraphExpanded(!isGraphExpanded);
    }
  };

  const getGradeColors = (grade) => {
    if (grade === undefined || grade === null || grade === 0) return { color: '#858585', variant: 'clear' };
    if (grade < 50) return { color: '#c63e3e', variant: 'red' };
    if (grade < 60) return { color: '#ff8800', variant: 'orange' };
    if (grade < 70) return { color: '#ffc300', variant: 'yellow' };
    if (grade < 80) return { color: '#29c60f', variant: 'green' };
    if (grade < 90) return { color: '#006400', variant: 'darkgreen' };
    return { color: '#f198ff', variant: 'pink' };
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
        // Store all class data including period
        setClassData({
          ...data,
          period: data.period || parseInt(data.className?.split(' ')[1]) || 1
        });
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

        // Calculate class average
        const assignmentsWithAverages = processedAssignments.filter(a => a.average > 0);
        const totalAverage = assignmentsWithAverages.length > 0
          ? assignmentsWithAverages.reduce((sum, curr) => sum + curr.average, 0) / assignmentsWithAverages.length
          : 0;
        setClassAverage(Math.round(totalAverage));
  
        setAssignments(sortedAssignments);

        const performanceData = sortedAssignments
          .filter(assignment => assignment.average > 0)
          .map(assignment => ({
            name: assignment.name,
            average: Number(assignment.average),
            date: formatDate(assignment.timestamp)
          }))
          .reverse();

        setClassPerformance(performanceData);
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
  const handleSortClick = (tab) => {
    setActiveTab(tab);
    // Reset all filters and sorting when changing tabs
    setSortOrder('new-old');
    setAlphabeticalOrder(null);
    setGradeOrder(null);
    setShowAdaptiveOnly(false);
    setSearchTerm('');
    
    if (tab === 'create') {
      setShowCreateModal(true);
    } else {
      setShowCreateModal(false);
      setSelectedFolder(null);
    }
  };

  // Handle search
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Add filter handlers
  const handleTypeFilter = (type) => {
    setSelectedType(type === selectedType ? 'all' : type);
  };

  const handleDateFilter = (range) => {
    setSelectedDateRange(range === selectedDateRange ? 'all' : range);
  };

  const handleGradeFilter = (range) => {
    setSelectedGradeRange(range === selectedGradeRange ? 'all' : range);
  };

  // Update handlers
  const handleSortOrderChange = (order) => {
    setSortOrder(order);
    // Clear other sorting methods when changing date order
    setAlphabeticalOrder(null);
    setGradeOrder(null);
  };

  const handleAlphabeticalToggle = (order) => {
    if (alphabeticalOrder === order) {
      setAlphabeticalOrder(null);
    } else {
      setAlphabeticalOrder(order);
      setGradeOrder(null); // Clear grade sorting when using alphabetical
    }
  };

  const handleGradeOrderToggle = (order) => {
    if (gradeOrder === order) {
      setGradeOrder(null);
    } else {
      setGradeOrder(order);
      setAlphabeticalOrder(null); // Clear alphabetical sorting when using grade
    }
  };

  const handleAdaptiveToggle = () => {
    setShowAdaptiveOnly(!showAdaptiveOnly);
  };

  // Filter and sort assignments
  const getFilteredAssignments = () => {
    let filtered = [];

    // Get the base list depending on the active tab
    if (activeTab === 'published') {
      filtered = [...assignments]; // Create a new array to avoid reference issues
    } else if (activeTab === 'folders' && selectedFolder) {
      const folder = folders.find((f) => f.id === selectedFolder);
      filtered = assignments.filter((assignment) =>
        folder?.assignments.includes(assignment.id)
      );
    } else if (activeTab === 'drafts') {
      filtered = [...drafts]; // Create a new array to avoid reference issues
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply adaptive filter
    if (showAdaptiveOnly) {
      filtered = filtered.filter(item => 
        item.type === 'AMCQ' || item.type === 'AOE'
      );
    }

    // Apply sorting
    if (alphabeticalOrder === 'a-z') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (alphabeticalOrder === 'z-a') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else if (gradeOrder === 'high-low') {
      filtered.sort((a, b) => (b.average || 0) - (a.average || 0));
    } else if (gradeOrder === 'low-high') {
      filtered.sort((a, b) => (a.average || 0) - (b.average || 0));
    } else if (sortOrder === 'new-old') {
      filtered.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    } else if (sortOrder === 'old-new') {
      filtered.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
    }

    return filtered;
  };

  const filteredAssignments = getFilteredAssignments();

  // Handle item click
  const handleItemClick = (item) => {
    const format = item.type;
    if (activeTab === 'drafts') {
      switch (format) {
        case 'OE':
          navigate(`/class/${classId}/createassignment/DRAFT${item.id}`);
          break;
        case 'AOE':
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
        case 'AOE':
          navigate(`/class/${classId}/assignment/${item.id}/TeacherResultsASAQ`);
          break;
        case 'AMCQ':
          navigate(`/class/${classId}/assignment/${item.id}/TeacherResultsAMCQ`);
          break;
        case 'OE':
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
// Inside Assignments.js

// Define openFolderModal function
const openFolderModal = (folder) => {
  if (!folder) return;
  console.log('Opening Folder Modal for:', folder); // Debugging log
  setSelectedFolder(folder);
  setShowFolderModal(true);
  
  // If you're fetching folder assignments:
  const assignmentsInFolder = folder.assignments || [];
  setFolderAssignments(assignmentsInFolder);
};


  // Tooltip Display based on Assignment Type
  const getFormatDisplay = (type) => {
    switch (type) {
      case 'AOE':
      case 'OE':
        return (
          <>
            <span
              style={{
                position: 'absolute',
                right: '-10px',
                top: '5px',
                fontWeight: '500',
                width: '60px',
                fontFamily: "'Montserrat', sans-serif",
                color: type === 'OE' ? '#00CCB4' : '#00CCB4',
              }}
            >
              {type === 'OE' ? 'OE' : 'OE'}
            </span>
            {type === 'AOE' && (
              <span
                style={{
                  position: 'absolute',
                  right: '-35px',
                  top: '0px',
                  fontWeight: '500',
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
                fontWeight: '500',
                width: '60px',
                fontFamily: "'Montserrat', sans-serif",
                color: type === 'MCQ' ? '#7D00EA' : '#7D00EA',
              }}
            >
              {type === 'MCQ' ? 'MC' : 'MC'}
            </span>
            {type === 'AMCQ' && (
              <span
                style={{
                  position: 'absolute',
                  right: '-38px',
                  top: '0px',
                  fontWeight: '500',
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
              fontWeight: '500',
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
          zIndex: 10,
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
        

          {/* Modal Header */}
       

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

  const renderPublishedContent = () => {
    return (
      <ul style={{ 
        listStyleType: 'none', 
        padding: 0,  
        background: 'none',
        width: 'calc(100% - 200px)', 
        marginTop: '120px', 
        marginLeft: '200px',
      }}>
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((item) => (
            <li
              key={item.id}
              onClick={() => handleItemClick(item)}
              style={{
                padding: '20px 2%',
                width: '92%',
                margin: '0px 2%',
                background: 'none',
                borderBottom: '1px solid #EDEDED',
                display: 'flex',
                gap: '7px', 
                fontSize: '1rem',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.005)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
          <div>
                {item.name}
                </div>
                 <div style={{ marginRight: '10px', height: '26px', width: '50px', position: 'relative', fontSize: '.8rem'}}>
                  {getFormatDisplay(item.type)}
                </div>
         
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                fontSize: '16px',
                marginLeft: 'auto',
                position: 'relative'
              }}>
                {item.average ? (
                  <div style={{
                    position: 'absolute',
                    right: 'calc(4% + 240px)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <GlassContainer
                      size={0}
                      variant={getGradeColors(item.average).variant}
                      contentStyle={{
                        padding: '2px 10px',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ 
                        color: getGradeColors(item.average).color,
                        fontWeight: '500',
                        fontSize: '.8rem',
                        fontFamily: "'Montserrat', sans-serif"
                      }}>
                        {item.average}%
                      </span>
                    </GlassContainer>
                  </div>
                ) : (
                  <div style={{
                    position: 'absolute',
                    right: 'calc(4% + 240px)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                  
                      <span style={{ 
                        color: '#858585',
                        fontWeight: '500',
                        fontSize: '.8rem',   padding: '5px 10px',
                        textAlign: 'center',
                        fontFamily: "'Montserrat', sans-serif"
                      }}>
                        -
                      </span>
                  </div>
                )}
                <span style={{
                  fontSize: '.8rem',
                  color: 'grey',
                  right: 'calc(4%)',
                  fontWeight: '400',
                  position: 'absolute',
                  fontFamily: "'Montserrat', sans-serif",
                }}>
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
                    <Flag 
                      size={20} 
                      color="red" 
                      style={{position: 'absolute', right: 'calc(4% + 450px)'}}
                    />
                  )}
                  {item.viewable && (
             <div style={{position: 'absolute', right: 'calc(4% + 370px)'}}>
                    <GlassContainer
                    
                                          variant='blue'
                                          size={0}
                                          contentStyle={{padding: '2px 4px'}}
                                          style={{zIndex: '1'}}
                                        > <Eye size={16} color="#020CFF" style={{ verticalAlign: 'middle' }} /> 
                                        </GlassContainer> 
                                        </div>
                  )}
                </div>

                {/* Format Display */}
               
              </div>
            </li>
          ))
        ) : (
          <h1 style={{marginTop: '-20px', fontWeight: '500'}}>
            {renderNoContentMessage()}
          </h1>
        )}
      </ul>
    );
  };

  const renderFolderContent = () => {
    if (selectedFolder) {
      return (
        <>
          <FolderHeader
            folder={folders.find(f => f.id === selectedFolder)}
            onBack={() => {
              if (showAddAssignmentsModal) {
                setShowAddAssignmentsModal(false);
              } else {
                setSelectedFolder(null);
              }
            }}
            onAddAssignments={() => setShowAddAssignmentsModal(!showAddAssignmentsModal)}
            onDeleteFolder={handleDeleteFolder}
            isAddingAssignments={showAddAssignmentsModal}
          />
          {showAddAssignmentsModal ? (
            <AddAssignmentsView
              folder={folders.find(f => f.id === selectedFolder)}
              assignments={assignments}
              onAddAssignment={(assignmentId) => {
                handleAddAssignmentToFolder(assignmentId);
              }}
              getFormatDisplay={getFormatDisplay}
              formatDate={formatDate}
              getGradeColors={getGradeColors}
              flaggedAssignments={flaggedAssignments}
            />
          ) : (
            <FolderView
              folder={folders.find(f => f.id === selectedFolder)}
              assignments={assignments}
              getFormatDisplay={getFormatDisplay}
              handleItemClick={handleItemClick}
              formatDate={formatDate}
              getGradeColors={getGradeColors}
              flaggedAssignments={flaggedAssignments}
            />
          )}
        </>
      );
    }
    
    return (
      <Folders
        classId={classId}
        folders={folders}
        assignments={assignments}
        pastelColors={pastelColors}
        onFoldersUpdated={setFolders}
        openFolderModal={(folder) => {
          setSelectedFolder(folder.id);
        }}
        onCreateFolder={() => setShowFolderForm(true)}
        periodStyle={getCurrentPeriodStyle()}
      />
    );
  };

  const renderDraftContent = () => {
    const draftAssignments = filteredAssignments.filter(item => !item.published);
    return (
      <ul style={{ 
        listStyleType: 'none', 
        padding: 0,  
        width: 'calc(100% - 200px)', 
        marginTop: '120px', 
        marginLeft: '200px',
      }}>
        {draftAssignments.length > 0 ? (
          draftAssignments.map((item) => (
            <li
              key={item.id}
              onClick={() => handleItemClick(item)}
              style={{
                  padding: '20px 2%',
                width: '92%',
                margin: '0px 2%',
                background: 'none',
                borderBottom: '1px solid #EDEDED',
                display: 'flex',
                gap: '7px', 
                fontSize: '1rem',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.005)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
          <div>
                {item.name}
                </div>
                 <div style={{ marginRight: '10px', height: '26px', width: '50px', position: 'relative', fontSize: '.8rem'}}>
                  {getFormatDisplay(item.type)}
                </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                fontSize: '16px',
                marginLeft: 'auto',
                position: 'relative'
              }}>
               
                <span style={{
                  fontSize: '16px',
                  color: 'grey',
                  right: 'calc(4% )',
                  fontWeight: '400',
                  position: 'absolute',
                  fontFamily: "'Montserrat', sans-serif",
                }}>
                  {formatDate(item.id)}
                </span>

            

              
              </div>
            </li>
          ))
        ) : (
          <h1 style={{ fontWeight: '500', color: 'grey', fontSize: '1rem', marginTop: '30px', marginLeft: '4%'}}>
            No drafted assignments found
          </h1>
        )}
      </ul>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          marginTop: '80px'
        }}>
          <p>Loading...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'published':
        return renderPublishedContent();
      case 'folders':
        return renderFolderContent();
      case 'drafts':
        return renderDraftContent();
      case 'create':
        return renderCreateModal();
      default:
        return renderPublishedContent();
    }
  };

  // Add periodStyles constant
  const periodStyles = {
    1: { variant: 'teal', color: "#1EC8bc", borderColor: "#83E2F5" },
    2: { variant: 'purple', color: "#8324e1", borderColor: "#cf9eff" },
    3: { variant: 'orange', color: "#ff8800", borderColor: "#f1ab5a" },
    4: { variant: 'yellow', color: "#ffc300", borderColor: "#Ecca5a" },
    5: { variant: 'green', color: "#29c60f", borderColor: "#aef2a3" },
    6: { variant: 'blue', color: "#1651d4", borderColor: "#b5ccff" },
    7: { variant: 'pink', color: "#d138e9", borderColor: "#f198ff" },
    8: { variant: 'red', color: "#c63e3e", borderColor: "#ffa3a3" },
  };

  // Get current period color
  const getCurrentPeriodStyle = () => {
    const period = classData?.period;
    return periodStyles[period] || periodStyles[1];
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
          display: 'flex',
          position: 'fixed',
          zIndex: '30',
          top: '0px',
          left: '200px',
          paddingTop: '20px',
          background: 'rgb(255,255,255,.9)',
          backdropFilter: 'blur(5px)',
          borderBottom: isScrolled ? '1px solid #ddd' : 'transparent',
          transition: 'border-bottom 0.3s ease',
          paddingBottom: '20px',
        }}
      >
        <div style={{
          display: 'flex',
          width: '92%',
          margin: '0 auto',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Left side with class info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}>
            <h1 style={{
              fontSize: '1.3rem',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: '400',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              margin: 0,
            }}>
              {classData.classChoice || 'Class'}
              <div 
                onClick={toggleGraph}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: activeTab === 'folders' && selectedFolder ? 'default' : 'pointer',
                  opacity: activeTab === 'folders' && selectedFolder ? 0.5 : 1,
                }}
              >
                <GlassContainer
                  size={0}
                  
          enableRotation={true}
                  variant={classAverage ? getGradeColors(classAverage).variant : 'clear'}
                  contentStyle={{
                    padding: '5px 10px',
                    textAlign: 'center',
                    display: 'flex',
                    height: '1rem',
                  }}
                >
                  <div style={{display: 'flex', marginTop: '-12px'}}>
                  <h1 style={{
                    color: classAverage ? getGradeColors(classAverage).color : '#858585',
                    fontWeight: '500',
                    fontSize: '1rem',

                    fontFamily: "'Montserrat', sans-serif"
                  }}>
                    {classAverage ? `${classAverage}%` : '-'}
                  </h1>
                  {/* Only show chevron if not in a specific folder view */}
                  {!(activeTab === 'folders' && selectedFolder) && (
                    <ChevronDown 
                      size={20} 
                      strokeWidth={2}
                      style={{
                        transform: isGraphExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                        color: classAverage ? getGradeColors(classAverage).color : '#858585',
                        marginTop: '10px',
                        marginLeft: '5px'
                      }}
                    />
                  )}
</div>
                </GlassContainer>
             
              </div>
            </h1>
          </div>

          {/* Right side with tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}>
            <TabButtons
              tabs={[
                { id: 'published', label: 'Assessments' },
                { id: 'drafts', label: 'Drafts' },
                { id: 'folders', label: 'Folders' },
                { id: 'create', label: 'Create +' }
              ]}
              activeTab={activeTab}
              onTabClick={handleSortClick}
              variant={getCurrentPeriodStyle().variant}
              color={getCurrentPeriodStyle().color}
            />
            </div>

            {/* Remove old search section */}
          </div>
        </div>


{/* Graph Section */}
      {/* Graph Section */}
      {activeTab !== 'create' && (
        <div style={{
          height: isGraphExpanded ? '300px' : '0',
          overflow: 'hidden',
          transition: 'height 0.3s ease',
          width: 'calc(100% - 200px)',
          marginLeft: '200px',
          marginTop: '100px', // Moved down 100px
          opacity: isGraphExpanded ? 1 : 0,
        }}>
          {isGraphExpanded && (
<ResponsiveContainer style={{width: 'calc(100%)',
          marginBottom: '60px',}}>
  <AreaChart 
    data={classPerformance}
    style={{ width: 'calc(100%)'}}
  >
    <defs>
      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={getCurrentPeriodStyle().color} stopOpacity={0.15} />
        <stop offset="100%" stopColor={getCurrentPeriodStyle().color} stopOpacity={0} />
      </linearGradient>
    </defs>
        <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <GlassContainer
                          variant={getCurrentPeriodStyle().variant}
                          size={2}
                          style={{
                            minWidth: '200px',
                          }}
                          contentStyle={{
                            padding: '12px 16px',
                            margin: '0',
                            fontFamily: "'Montserrat', sans-serif",
                          }}
                        >
                          <p style={{ 
                            margin: '0',
                            color: getCurrentPeriodStyle().color,
                            fontWeight: '600',
                            fontSize: '.9rem'
                          }}>
                            {data.name}
                          </p>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginTop: '4px'
                          }}>
                            <span style={{ 
                              color: getCurrentPeriodStyle().color,
                              fontSize: '14px',
                              fontWeight: '500'
                            }}>
                              {data.average}%
                            </span>
                            <span style={{
                              color: 'grey',
                              fontSize: '14px'
                            }}>
                              {data.date}
                            </span>
                          </div>
                        </GlassContainer>
                      );
                    }
                    return null;
                  }}
                />
    <Area 
      type="monotone"
      dataKey="average"
      stroke={getCurrentPeriodStyle().color}
      fill="url(#areaGradient)"
      strokeWidth={2}
    />
  </AreaChart>
</ResponsiveContainer>
          )}
        </div>
      
      )}
      {/* Search and Filters Section */}
      {activeTab !== 'create' && activeTab !== 'folders' && (
        <div style={{
          width: 'calc(92% - 200px)',
          marginLeft: '200px',
          marginTop: '-10px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Filters */}
          <div style={{
            display: 'flex',
            gap: '15px',
            position: 'relative',
            alignItems: 'center',
          }}>
            {/* Tab Title */}
            {(activeTab === 'published' || activeTab === 'drafts') && (
              <h2 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '400',
                marginLeft: '-10px', 
                color: '#858585',
                fontFamily: "'Montserrat', sans-serif",
                paddingRight: '15px',
                borderRight: '1px solid #ddd'
              }}>
                {activeTab === 'published' ? 'Assessments' : 'Drafts'}
              </h2>
            )}
            {/* Filter Icon and Popup */}
            <div ref={filtersRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowFiltersPopup(!showFiltersPopup)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#858585',
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: '14px',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <ListFilter
                  size={18} 
                  color="#858585"
                />
                Sort & Filter
              </button>

              {/* Filters Popup */}
              {showFiltersPopup && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  marginTop: '10px',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  padding: '15px',
                  zIndex: 1000,
                  minWidth: '200px',
                  border: '1px solid #eee',
                }}>
                  {/* Sort Options */}
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#858585', 
                      marginBottom: '8px',
                      fontFamily: "'Montserrat', sans-serif",
                    }}>
                      SORT BY
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}>
                      <button
                        onClick={() => {
                          handleSortOrderChange('new-old');
                          setAlphabeticalOrder(null);
                          setGradeOrder(null);
                        }}
                        style={{
                          width: 'calc(50% - 4px)',
                          padding: '8px 12px',
                          border: `1px solid ${sortOrder === 'new-old' ? '#858585' : '#ddd'}`,
                          borderRadius: '100px',
                          background: sortOrder === 'new-old' ? 'rgba(219, 219, 219, 0.1)' : 'white',
                          color: sortOrder === 'new-old' ? '#858585' : 'grey',
                          cursor: 'pointer',
                          fontFamily: "'Montserrat', sans-serif",
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <CalendarArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => {
                          handleSortOrderChange('old-new');
                          setAlphabeticalOrder(null);
                          setGradeOrder(null);
                        }}
                        style={{
                          width: 'calc(50% - 4px)',
                          padding: '8px 12px',
                          border: `1px solid ${sortOrder === 'old-new' ? '#858585' : '#ddd'}`,
                          borderRadius: '100px',
                          background: sortOrder === 'old-new' ? 'rgba(219, 219, 219, 0.1)' : 'white',
                          color: sortOrder === 'old-new' ? '#858585' : 'grey',
                          cursor: 'pointer',
                          fontFamily: "'Montserrat', sans-serif",
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <CalendarArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => {
                          handleAlphabeticalToggle('a-z');
                          setSortOrder(null);
                          setGradeOrder(null);
                        }}
                        style={{
                          width: 'calc(50% - 4px)',
                          padding: '8px 12px',
                          border: `1px solid ${alphabeticalOrder === 'a-z' ? '#858585' : '#ddd'}`,
                          borderRadius: '100px',
                          background: alphabeticalOrder === 'a-z' ? 'rgba(219, 219, 219, 0.1)' : 'white',
                          color: alphabeticalOrder === 'a-z' ? '#858585' : 'grey',
                          cursor: 'pointer',
                          fontFamily: "'Montserrat', sans-serif",
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <ArrowDownAZ size={16} />
                      </button>
                      <button
                        onClick={() => {
                          handleAlphabeticalToggle('z-a');
                          setSortOrder(null);
                          setGradeOrder(null);
                        }}
                        style={{
                          width: 'calc(50% - 4px)',
                          padding: '8px 12px',
                          border: `1px solid ${alphabeticalOrder === 'z-a' ? '#858585' : '#ddd'}`,
                          borderRadius: '100px',
                          background: alphabeticalOrder === 'z-a' ? 'rgba(219, 219, 219, 0.1)': 'white',
                          color: alphabeticalOrder === 'z-a' ? '#858585' : 'grey',
                          cursor: 'pointer',
                          fontFamily: "'Montserrat', sans-serif",
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <ArrowUpAZ size={16} />
                      </button>
                      <button
                        onClick={() => {
                          handleGradeOrderToggle('high-low');
                          setSortOrder(null);
                          setAlphabeticalOrder(null);
                        }}
                        style={{
                          width: 'calc(50% - 4px)',
                          padding: '8px 12px',
                          border: `1px solid ${gradeOrder === 'high-low' ? '#858585' : '#ddd'}`,
                          borderRadius: '100px',
                          background: gradeOrder === 'high-low' ? 'rgba(219, 219, 219, 0.1)' : 'white',
                          color: gradeOrder === 'high-low' ? '#858585' : 'grey',
                          cursor: 'pointer',
                          fontFamily: "'Montserrat', sans-serif",
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <ArrowDown10 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          handleGradeOrderToggle('low-high');
                          setSortOrder(null);
                          setAlphabeticalOrder(null);
                        }}
                        style={{
                          width: 'calc(50% - 4px)',
                          padding: '8px 12px',
                          border: `1px solid ${gradeOrder === 'low-high' ? '#858585' : '#ddd'}`,
                          borderRadius: '100px',
                          background: gradeOrder === 'low-high' ? 'rgba(219, 219, 219, 0.1)' : 'white',
                          color: gradeOrder === 'low-high' ? '#858585' : 'grey',
                          cursor: 'pointer',
                          fontFamily: "'Montserrat', sans-serif",
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <ArrowUp01 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Filter Options */}
                  <div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#858585', 
                      marginBottom: '8px',
                      fontFamily: "'Montserrat', sans-serif",
                    }}>
                      FILTER
                    </div>
                    <button
                      onClick={handleAdaptiveToggle}
                      style={{
                        width: '100%',
                        padding: '8px 15px',
                        border: `1px solid ${showAdaptiveOnly ? '#858585' : '#ddd'}`,
                        borderRadius: '100px',
                        background: showAdaptiveOnly ? 'rgba(133, 133, 133, 0.1)' : 'white',
                        color: showAdaptiveOnly ? '#858585' : 'grey',
                        cursor: 'pointer',
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: '14px',
                        textAlign: 'left',
                      }}
                    >
                      Adaptive Only
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Active Options Display */}
            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}>
              {/* Sort Display */}
              {(sortOrder || alphabeticalOrder || gradeOrder) && (
                <button
                  style={{
                    padding: '6px 12px',
                    paddingRight: '30px',
                    border: '1px solid #ddd',
                    borderRadius: '100px',
                    background: 'rgba(219, 219, 219, 0.1)',
                    color: '#858585',
                    cursor: 'pointer',
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '12px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={() => setShowFiltersPopup(true)}
                >
                  {sortOrder === 'new-old' ? (
                    <>
                      <CalendarArrowDown size={14} /> Newest First
                    </>
                  ) : sortOrder === 'old-new' ? (
                    <>
                      <CalendarArrowUp size={14} /> Oldest First
                    </>
                  ) : alphabeticalOrder === 'a-z' ? (
                    <>
                      <ArrowDownAZ size={14} /> A to Z
                    </>
                  ) : alphabeticalOrder === 'z-a' ? (
                    <>
                      <ArrowUpAZ size={14} /> Z to A
                    </>
                  ) : gradeOrder === 'high-low' ? (
                    <>
                      <ArrowDown10 size={14} /> Highest Grade First
                    </>
                  ) : (
                    <>
                      <ArrowUp01 size={14} /> Lowest Grade First
                    </>
                  )}
                  <ChevronDown
                    size={12}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                </button>
              )}

              {/* Filter Display */}
              {showAdaptiveOnly && (
                <button
                  onClick={handleAdaptiveToggle}
                  style={{
                    padding: '6px 12px',
                    paddingRight: '30px',
                    border: '1px solid #858585',
                    borderRadius: '100px',
                    background: 'rgba(133, 133, 133, 0.1)',
                    color: '#858585',
                    cursor: 'pointer',
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '12px',
                    position: 'relative',
                  }}
                >
                  Adaptive Only
                  <X
                    size={12}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Search */}
    
            <div style={{
              position: 'relative',
              width: '300px', border: '1px solid #ddd', borderRadius: '1rem'
            }}>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search assignments..."
                style={{
                  width: '80%',
                  padding: '8px 12px',
                  paddingLeft: '40px',
                  border: 'none',
                  outline: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: "'Montserrat', sans-serif",
                  background: 'transparent',
                }}
              />
              <Search 
                size={20} 
                color="#858585" 
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        width: '100%',
        borderRadius: '15px',
        marginBottom: '40px',
        marginTop: '-140px', // Moved up 100px
        padding: '10px 2%',
      }}>
        {renderContent()}
        {showFolderForm && (
          <CreateFolder
            classId={classId}
            onFolderCreated={handleFolderCreated}
            onClose={() => setShowFolderForm(false)}
          />
        )}
      </div>

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

{showFolderModal && selectedFolder && (
        <FolderModal
          folder={selectedFolder}
          assignments={assignments}
          onClose={() => setShowFolderModal(false)}
        />
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

// Add helper function to convert hex to rgb
const hexToRgb = (hex) => {
  // Remove the hash if it exists
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
};

export default TeacherClassHome;
