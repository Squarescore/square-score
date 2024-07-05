import React, { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const DBQTeacherPreview = ({ assignmentId }) => {
  const [assignment, setAssignment] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedAssignment, setEditedAssignment] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignment = async () => {
      setLoading(true);
      if (!assignmentId) return;

      const assignmentRef = doc(db, 'dbqs', assignmentId);
      const docSnap = await getDoc(assignmentRef);

      if (docSnap.exists()) {
        setAssignment(docSnap.data().assignment); // Assuming 'assignment' is the field name
        setEditedAssignment(docSnap.data().assignment); // Pre-populate the editable field
      } else {
        console.log("No such document!");
      }

      setLoading(false);
    };

    fetchAssignment();
  }, [assignmentId]);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleFileChange = (event) => {
    if (event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    let imageUrl = '';
  
    if (selectedFile) {
      // Use the assignmentId as part of the file path
      const filePath = `assignments/${assignmentId}/${selectedFile.name}`;
      const storageRef = ref(storage, filePath);
  
      await uploadBytes(storageRef, selectedFile).then(async () => {
        imageUrl = await getDownloadURL(storageRef);
      });
  
      // Update the document with the new assignment text and image URL
      const assignmentRef = doc(db, 'dbqs', assignmentId);
      await updateDoc(assignmentRef, {
        assignment: editedAssignment,
        imageUrl: imageUrl, // Store the image URL in the same document as the assignment
      });
  
      // Optionally, you might want to set the image URL in the state if you need to display it right away
      // setImageUrl(imageUrl);
    } else {
      // If no image was selected, just update the text
      const assignmentRef = doc(db, 'dbqs', assignmentId);
      await updateDoc(assignmentRef, {
        assignment: editedAssignment,
        // Optionally clear the imageUrl if you allow removing the image
        // imageUrl: firebase.firestore.FieldValue.delete(),
      });
    }
  
    setAssignment(editedAssignment);
    setEditMode(false);
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {!editMode ? (
        <div>
          <p>{assignment}</p>
          <button onClick={handleEdit}>Edit</button>
        </div>
      ) : (
        <div>
          <textarea style={{width: '800px', height :'400px' }}value={editedAssignment} onChange={(e) => setEditedAssignment(e.target.value)} />
          <input type="file" onChange={handleFileChange} />
          <button onClick={handleSave}>Save</button>
        </div>
      )}
    </div>
  );
};

export default DBQTeacherPreview;
