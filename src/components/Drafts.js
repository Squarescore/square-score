import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from './firebase';
import Navbar from './Navbar';
import { v4 as uuidv4 } from 'uuid';

const Drafts = () => {
  const [drafts, setDrafts] = useState([]);
  const [filteredDrafts, setFilteredDrafts] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const navigate = useNavigate();
  const { classId } = useParams();
  const [selectedDraft, setSelectedDraft] = useState(null);

  const openModal = (draft) => {
    setSelectedDraft(draft);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const classDocRef = doc(db, 'classes', classId);
        const classDocSnap = await getDoc(classDocRef);

        if (classDocSnap.exists()) {
          const classData = classDocSnap.data();
          const draftIds = classData.draftIds || [];
          const draftsPromises = draftIds.map(draftId => getDoc(doc(db, 'drafts', draftId)));
          const draftsDocs = await Promise.all(draftsPromises);
          const draftsData = draftsDocs.map(draftDoc => ({ id: draftDoc.id, ...draftDoc.data() }));

          const sortedDrafts = draftsData.sort((a, b) => {
            const lastEditedA = a.lastEdited ? a.lastEdited.toDate() : new Date(0);
            const lastEditedB = b.lastEdited ? b.lastEdited.toDate() : new Date(0);
            return lastEditedB - lastEditedA;
          });

          setDrafts(sortedDrafts);
          setFilteredDrafts(sortedDrafts);
        } else {
          console.error("Class not found:", classId);
        }
      } catch (error) {
        console.error("Error fetching drafts:", error);
      }
    };

    fetchDrafts();
  }, [classId]);

  useEffect(() => {
    const fetchTeacherClasses = async () => {
      try {
        const classesRef = collection(db, 'classes');
        const teacherUID = auth.currentUser.uid;
        const classQuery = query(classesRef, where('teacherUID', '==', teacherUID));
        const querySnapshot = await getDocs(classQuery);

        const classes = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(classItem => classItem.id !== classId)
          .sort((a, b) => a.className.localeCompare(b.className));

        setTeacherClasses(classes);
      } catch (error) {
        console.error("Error fetching teacher classes:", error);
      }
    };

    fetchTeacherClasses();
  }, [classId]);

  useEffect(() => {
    const handleSearch = () => {
      const filtered = drafts.filter(draft => 
        draft.assignmentName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDrafts(filtered);
    };

    handleSearch();
  }, [searchTerm, drafts]);

  const handleBack = () => {
    navigate(-1);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedClasses([]);
  };

  const handleClassSelect = (classId) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    } else {
      setSelectedClasses([...selectedClasses, classId]);
    }
  };

  const duplicateDraft = async (draft) => {
    try {
      for (const classId of selectedClasses) {
        const newDraftId = uuidv4();
        const newAssignmentId = uuidv4();

        const newDraftData = {
          ...draft,
          id: newDraftId,
          assignmentId: newAssignmentId,
          classId: classId,
        };

        await setDoc(doc(db, 'drafts', newDraftId), newDraftData);

        const originalAssignmentRef = doc(db, 'assignments', draft.assignmentId);
        const originalAssignmentSnapshot = await getDoc(originalAssignmentRef);

        if (originalAssignmentSnapshot.exists()) {
          const originalAssignmentData = originalAssignmentSnapshot.data();
          const duplicatedAssignmentData = {
            ...originalAssignmentData,
            assignmentId: newAssignmentId,
          };

          await setDoc(doc(db, 'assignments', newAssignmentId), duplicatedAssignmentData);
        } else {
          console.error("Original assignment not found:", draft.assignmentId);
        }

        const classDocRef = doc(db, 'classes', classId);
        await updateDoc(classDocRef, {
          draftIds: arrayUnion(newDraftId),
        });
      }

      closeModal();
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error duplicating draft:", error);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
      <Navbar userType="teacher" />
      <div style={{ width: '1000px', marginLeft: 'auto', marginRight: 'auto', height: '100px', marginTop: '80px', backgroundColor: 'transparent', display: 'flex', marginBottom: '60px' }}>
  <h1 style={{ fontSize: '60px', fontFamily: "'Radio Canada', sans-serif" }}>Resources</h1>
  {!showSearchBar ? (
    <button
      onClick={() => setShowSearchBar(true)}
      style={{ width: '40px', height: '40px', marginLeft: 'auto', marginRight: '20px', backgroundColor: 'transparent', borderColor: 'transparent', marginTop: '60px', padding: '5px', cursor: 'pointer' }}
    >

      <img style={{ width: '30px' }} src="/PurpleSearch.png" alt="Search" />
    </button>
  ) : (
    <div style={{ position: 'relative', width: '300px', height: '30px', marginLeft: 'auto', marginRight: '20px', marginTop: '60px' }}>
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
          border: '4px solid #B500D2',
          backgroundColor: 'transparent',
          
          borderRadius: '100px',
          paddingLeft: '20px',
          color: 'black',
          
          outlineColor: '#B500D2',
        }}
      
        
      />
      <button
        onClick={() => setShowSearchBar(false)}
        style={{
          width: '30px',
          height: '30px',
          position: 'absolute',
          top: '17px',
          right: '5px',
          transform: 'translateY(-39%)',
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          cursor: 'pointer',
          padding: '0',
        }}
      >
        <img style={{ width: '30px' }} src="/PurpleSearch.png" alt="Search" />
      </button>
    </div>
  )}
</div>

      <main style={{ flexGrow: 1, display: 'grid', marginBottom: '200px', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', backgroundColor: 'transparent', padding: '20px', width: '1000px', marginLeft: 'auto', marginRight: 'auto' }}>
        {filteredDrafts.length > 0 ? (
          filteredDrafts.map((draft) => (
            <div
              key={draft.id}
              style={{
                alignItems: 'center',
                width: '230px',
                marginBottom: '20px',
                height: '160px',
                padding: '0px',
                border: '4px solid #D2D2D2',
                borderRadius: '21px',
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                transition: '.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.border = '4px solid #B500D2';
                e.currentTarget.querySelector('.top-tag').style.border = '4px solid #B500D2';
                e.currentTarget.querySelector('.top-tag').style.backgroundColor = '#F4AFFF';
                e.currentTarget.querySelector('.saq-text').style.display = 'none';
                e.currentTarget.querySelector('.export-button').style.display = 'block';
                e.currentTarget.querySelector('.export-button').style.color = '#8B008B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1.0)';
                e.currentTarget.style.border = '4px solid #D2D2D2';
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.querySelector('.top-tag').style.border = '4px solid blue';
                e.currentTarget.querySelector('.saq-text').style.display = 'block';
                e.currentTarget.querySelector('.top-tag').style.backgroundColor = '#627BFF';
                e.currentTarget.querySelector('.export-button').style.display = 'none';
                e.currentTarget.querySelector('.export-button').style.color = '#B500D2';
              }}
              onClick={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.border = '4px solid #B500D2';
                e.currentTarget.querySelector('.top-tag').style.border = '4px solid #B500D2';
                e.currentTarget.querySelector('.top-tag').style.backgroundColor = '#F4AFFF';
                e.currentTarget.querySelector('.saq-text').style.display = 'none';
                e.currentTarget.querySelector('.export-button').style.display = 'block';
                e.currentTarget.querySelector('.export-button').style.color = '#8B008B';
              }}
            >
              <div
                className="top-tag"
                style={{
                  width: '230px',
                  backgroundColor: '#627BFF',
                  height: '30px',
                  border: '4px solid blue',
                  borderTopLeftRadius: '20px',
                  borderTopRightRadius: '20px',
                  marginTop: '-4px',
                  marginBottom: '10px',
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                <h1 className="saq-text" style={{ fontSize: '20px', fontWeight: 'bold', width: '100%', textAlign: 'center', marginTop: '4px', color: 'WHITE' }}>SAQ</h1>
                <button
                  className="export-button"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'TRANSPARENT',
                    color: '#B500D2',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    display: 'none',
                    fontFamily: "'Radio Canada', sans-serif",
                    transition: '.3s',
                    fontSize: '20px', fontWeight: 'bold', width: '100%', textAlign: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.fontSize = '21px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.fontSize = '20px';
                  }}
                  onClick={() => openModal(draft)}
                >
                  Export
                </button>
              </div>
              <Link
                to={`/class/${classId}/createassignment/${draft.assignmentId}?draftId=${draft.id}`}
                style={{ textDecoration: 'none', color: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90%' }}
                onClick={async () => {
                  const assignmentRef = doc(db, 'assignments', draft.assignmentId);
                  const assignmentSnapshot = await getDoc(assignmentRef);

                  if (assignmentSnapshot.exists()) {
                    const assignmentData = assignmentSnapshot.data();
                    if (assignmentData.classId !== classId) {
                      await updateDoc(assignmentRef, { classId: classId });
                    }
                  }
                }}
              >
                <h2 style={{ 
                  fontSize: '22px', 
                  marginBottom: '5px', 
                  width: '96%', 
                  marginRight: 'auto', 
                  marginLeft: '5px', 
                  marginTop: '10px', 
                  fontFamily: "'Radio Canada', sans-serif", 
                  height: '70px', 
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                  lineHeight: '1.2'
                }} 
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#585858';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'black';
                }}>
                  {draft.assignmentName}
                </h2>
                <p style={{ position: 'absolute', marginTop: '79px', marginRight: '100px', fontSize: '19px', fontFamily: "'Radio Canada', sans-serif", color: '#A8A8A8' }}>{new Date(draft.lastEdited?.toDate()).toLocaleDateString()}</p>
              </Link>
            </div>
          ))
        ) : (
          <div>No drafts available for this class.</div>
        )}
      </main>
      {isModalOpen && (
  <div style={{ position: 'fixed', width: '100%', height: '1000px', top: '20px', left: 'auto', right: 'auto', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ padding: '20px', borderRadius: '30px', height: '500px', width: '900px', border: '10px solid rgb(244, 175, 255)', backdropFilter: 'blur(15px)', boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)', marginTop: '-100px' , }}>
    <h2 style={{
  fontSize: '40px',
  backgroundColor: 'rgba(255,255,255,0.99)',
  borderRadius: '10px',
  position: 'absolute',
  textAlign: 'center',
  marginTop: '-70px',
  backdropFilter: 'blur(5px)',
  padding: '20px',
  fontFamily: "'Radio Canada', sans-serif",
  left: '50%',
  transform: 'translateX(-50%)'
}}>
  Export {selectedDraft?.assignmentName}
</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', width: '84%', backgroundColor: 'transparent' , marginLeft: 'auto', marginRight: 'auto', marginTop: '50px'}}>
        {teacherClasses.map((classItem) => (
          <div
            key={classItem.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              padding: '10px',
              border: '6px solid',
              borderColor: selectedClasses.includes(classItem.id) ? 'lightgreen' : 'lightgrey',
              borderRadius: '15px',
              cursor: 'pointer',
              width: '200px',
              height: '100px',
              fontSize: '35px',
              fontWeight: 'bold',
              fontFamily: "'Radio Canada', sans-serif",
              textAlign: 'center',
              transition: '.2s',
              backgroundColor: 'rgb(255,255,255,.5)',
              color: 'black',
              margin: '10px',
            }}
            onClick={() => handleClassSelect(classItem.id)}
            onMouseEnter={(e) => {
              if (!selectedClasses.includes(classItem.id)) {
                e.target.style.borderColor = 'grey';
              }
            }}
            onMouseLeave={(e) => {
              if (!selectedClasses.includes(classItem.id)) {
                e.target.style.borderColor = 'lightgrey';
              }
            }}
          >
            {classItem.className}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button style={{ position: 'absolute', color: 'grey', borderRadius: '3px', width: '70px', height: '50px', borderColor: 'transparent', fontWeight: 'bold', fontSize: '25px', cursor: 'pointer', top: '-20px', backgroundColor: 'transparent', right: '-30px' }} onClick={closeModal}>
          <img style={{ width: '60px', marginTop: '-20px' , borderRadius: '100px',transition: '.3s',}} src='/redcirclex.png'  
          onMouseEnter={(e) => {
            e.target.style.opacity = '90%';
            e.target.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '100%';
            e.target.style.boxShadow = 'none';
          }}/>
        </button>
        <button
          onClick={() => duplicateDraft(selectedDraft)}
          style={{
            position: 'fixed',
            width: '200px',
            height: '80px',
            padding: '10px 20px',
            right: '370px',
            bottom: '-50px',
            backgroundColor: '#FBD3FF',
            border: '7px solid #E01FFF',
            fontSize: '30px',
            color: '#E01FFF',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: '.3s',
            fontFamily: "'Radio Canada', sans-serif"
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = '95%';
            e.target.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '100%';
            e.target.style.boxShadow = 'none';
          }}
        >
          Export
        </button>
      </div>
    </div>
  </div>
)}


      {showSuccessModal && (
          <div style={{position: 'fixed', width: '100%',  top: '70px',backgroundColor: '#00E833', height: '4px'}}>
      <div style={{ padding: '0px', display: 'flex', alignItems: 'center', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px', width: '250px', backgroundColor: '#9BFFA5', backdropFilter: 'blur(15px)', border: '4px solid #00E833', left: '50%', transform: 'translateX(-50%)', position: 'fixed', top: '70px' }}>
  
      <h2 style={{ fontSize: '20px', textAlign: 'center', fontFamily: "'Radio Canada', sans-serif", color: '#009006', marginLeft: '40px', marginRight: '10px' }}>Success!</h2>
      <button style={{ backgroundColor: 'white', color: 'black', borderRadius: '16px', width: '60px', height: '40px', border: '4px solid #00E833', fontWeight: 'bold', fontSize: '20px', cursor: 'pointer', fontFamily: "'Radio Canada', sans-serif", marginRight: '40px', marginLeft: 'auto' }} onClick={() => setShowSuccessModal(false)}>OK</button>
    </div>
    </div>
   
      )}
    </div>
  );
};

export default Drafts;
