import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, storage } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { serverTimestamp } from 'firebase/firestore';
import { useRef } from 'react';
import Navbar from './Navbar';
const TeacherUploads = () => {
  const { classId } = useParams();
  const [link, setLink] = useState('');
  const [linkName, setLinkName] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploads, setUploads] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState(null); // 'file' or 'link'
  const [openedFolders, setOpenedFolders] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const uploadRefs = useRef({});
  
    const handleSearchChange = (e) => {
      setSearchTerm(e.target.value);
    };
  
    const scrollToElement = (id) => {
      uploadRefs.current[id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    };
  const toggleFolder = (folderId) => {
    setOpenedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };
  const openModal = () => {
    setIsModalOpen(true);
    setUploadType(null); // Reset upload type each time modal is opened
  };

  const chooseUploadType = (type) => setUploadType(type);

  useEffect(() => {
    const uploadsRef = collection(db, 'classes', classId, 'uploads');
    const q = query(uploadsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUploads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [classId]);
  const handleFolderChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      setFile({ folderFiles: files });
      setFileName(files[0].webkitRelativePath.split('/')[0]); // Extract the folder name
    }
  };
  
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      if (files.length === 1 && !e.target.webkitdirectory) {
        // Single file upload
        setFile({ singleFile: files[0] });
        setFileName(files[0].name);
      } else {
        // Folder upload
        setFile({ folderFiles: files });
        setFileName(files[0].webkitRelativePath.split('/')[0]); // Extract the folder name
      }
    }
  };
  const uploadFiles = async (files) => {
    const uploadPromises = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileRef = ref(storage, `classes/${classId}/${file.name}`);
      uploadPromises.push(uploadBytes(fileRef, file).then(uploadResult => getDownloadURL(uploadResult.ref)));
    }
    return Promise.all(uploadPromises);
  };
  
  const handleSubmit = async () => {
    if (uploadType === 'file' && file) {
      if (file.folderFiles) {
        // Handle folder upload
        const fileUrls = await uploadFiles(file.folderFiles);
        await addDoc(collection(db, 'classes', classId, 'uploads'), {
          isFolder: true,
          folderName: fileName,
          files: fileUrls.map((url, index) => ({
            url,
            name: file.folderFiles[index].name
          })),
          timestamp: serverTimestamp(),
        });
      } else if (file.singleFile) {
        // Handle single file upload
        const fileRef = ref(storage, `classes/${classId}/${file.singleFile.name}`);
        const uploadResult = await uploadBytes(fileRef, file.singleFile);
        const fileUrl = await getDownloadURL(uploadResult.ref);
  
        await addDoc(collection(db, 'classes', classId, 'uploads'), {
          fileUrl,
          fileName: fileName || file.singleFile.name,
          timestamp: serverTimestamp(),
        });
      }
    }
  
    // Check if it's a link upload and process accordingly
    if (uploadType === 'link') {
      await addDoc(collection(db, 'classes', classId, 'uploads'), {
        link,
        linkName,
        timestamp: serverTimestamp(),
      });
    }
  
    // Reset the form and close the modal
    setLink('');
    setLinkName('');
    setFile(null);
    setFileName('');
    setIsModalOpen(false);
    setUploadType(null);
  };
  

  return (
    <div style={{marginTop: '150px'}}>
        <Navbar userType="teacher" />
          <div>
        <input
          type="text"
          placeholder="Search uploads"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <button onClick={() => scrollToElement(searchTerm)}>Search</button>
      </div>

      <button onClick={openModal}>New</button>

      {isModalOpen && (
        <div className="modal">
          <button onClick={() => chooseUploadType('link')}>Link</button>
          <button onClick={() => chooseUploadType('file')}>File</button>

          {uploadType === 'link' && (
            <>
              <input 
                type="text" 
                placeholder="Link name" 
                value={linkName} 
                onChange={(e) => setLinkName(e.target.value)} 
              />
              <input 
                type="text" 
                placeholder="Enter link" 
                value={link} 
                onChange={(e) => setLink(e.target.value)} 
              />
            </>
          )}

{uploadType === 'file' && (
  <>
    <input 
      type="text" 
      placeholder="File name" 
      value={fileName} 
      onChange={(e) => setFileName(e.target.value)} 
    />
    <input 
      type="file" 
      onChange={handleFileChange} 
    />
    <input 
      type="file" 
      multiple
      webkitdirectory="true" 
      onChange={handleFolderChange} // New function for folder selection
    />
  </>
)}

          <button onClick={handleSubmit}>Upload</button>
        </div>
      )}




<div>
  {uploads.map((upload) => {
    const uploadId = upload.fileName || upload.folderName || upload.linkName;
    const isMatch = searchTerm === uploadId;
    const refProp = isMatch ? { ref: el => uploadRefs.current[uploadId] = el } : {};

    return (
      <div 
        key={upload.id} 
        {...refProp}
        style={{
          marginBottom: '20px', 
          marginTop: '20px', 
          width: '100%', 
          backgroundColor: isMatch ? 'yellow' : 'white'
        }}
      >
        {upload.link && (
          <a href={upload.link} target="_blank" rel="noopener noreferrer">
            {upload.linkName || 'Unnamed Link'}
          </a>
        )}

        {upload.fileUrl && !upload.isFolder && (
          <a 
            href={upload.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: 'black', 
              textDecoration: 'none',
              backgroundColor: 'white',
              padding: '2px',
              fontSize: '20px',
              width: '70%',
              borderTop: '2px solid grey'
            }}
          >
            {upload.fileName}
          </a>
        )}

        {upload.isFolder && (
          <>
            <div style={{ color: 'green', cursor: 'pointer' }} onClick={() => toggleFolder(upload.id)}>
              {upload.folderName}
            </div>
            {openedFolders[upload.id] && (
              <div style={{ paddingLeft: '20px' }}>
                {upload.files.map(file => (
                  <div key={file.url} style={{ color: 'grey' }}>
                    <a href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  })}
</div>
    </div>
  );
};

export default TeacherUploads;