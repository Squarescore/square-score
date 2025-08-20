// src/components/Teachers/TeacherHome/Tutorials.js

import React, { useState } from 'react';

// Array of YouTube URLs with Titles
const youtubeLinks = [
  
      {
        url: 'https://youtu.be/Qcb7rROATWk',
        title: 'Create open ended assignment step by step',
      },
      {
        url: 'https://youtu.be/s927tExq0Pw',
        title: 'Create a class add students to class',
      },
      {
        url: 'https://youtu.be/XWE_7WzzN8A',
        title: 'Export assignment to other classes share assignment to other classes move assignment ',
      },
  {
    url: 'https://youtu.be/eVK70JgjxSQ',
    title: 'How to draft an assignment and publish a draft',
  },
  {
    url: 'https://youtu.be/a3Ppq6ipKkk',
    title: 'Make due dates custom per student',
  },

  {
    url: 'https://youtu.be/XumK_jYpdFg',
    title: 'see students grades individual grades student performance',
  },
  {
    url: 'https://youtu.be/Uz6jUf0vU2c',
    title: 'Extended time accomodations add extended time',
  },
  {
    url: 'https://youtu.be/RbuVKaq8NpY',
    title: 'Change settings on published assignments delete assignments',
  },
  {
    url: 'https://youtu.be/isnkG-bv5G0',
    title: 'Reset a student assignment and renew access if submitted renew access to submitted assignment',
  },
 
  {
    url: 'https://youtu.be/R0p8wEamQhk',
    title: 'How to add access key and gain access',
  },
];

// Function to extract YouTube Video ID from URL
const getYouTubeID = (url) => {
  const regex = /youtu\.be\/([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Tutorials Component
const Tutorials = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter tutorials based on search term
  const filteredTutorials = youtubeLinks.filter((tutorial) =>
    tutorial.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* Search Bar */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search Tutorials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Tutorials Grid */}
      <div style={styles.grid}>
        {filteredTutorials.length > 0 ? (
          filteredTutorials.map((tutorial, index) => {
            const videoId = getYouTubeID(tutorial.url);
            const thumbnail = videoId
              ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` // Use higher resolution thumbnails
              : '';

            return (
              <div key={index} style={styles.card}>
                <a href={tutorial.url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                  <img
                    src={thumbnail}
                    alt={tutorial.title}
                    style={styles.thumbnail}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                    }}
                  />
              
                </a>
              </div>
            );
          })
        ) : (
          <p style={styles.noResults}>No tutorials found.</p>
        )}
      </div>
    </div>
  );
};

// Inline Styles
const styles = {
  container: {
    marginTop: '20px',
    fontFamily: "'Montserrat', sans-serif",
    backgroundColor: 'white',
    minHeight: '80vh',
    width: '100%',
    boxSizing: 'border-box',
  },
  searchContainer: {
    marginBottom: '20px',
  },
  searchInput: {
    width: '80%',
    maxWidth: '500px',
    padding: '10px 15px',
    marginRight: 'auto',
    fontSize: '16px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    outline: 'none',
    transition: 'border 0.3s',
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    justifyContent: 'flex-start',
  },
  card: {
    width: '300px', // Fixed width
    height: '158.75px', // 300px * 9 / 16 to maintain 16:9 aspect ratio
    cursor: 'pointer',   border: '1px solid #ededed',
    boxShadow: 'rgba(50, 50, 205, 0.01) 0px 2px 5px 0px, rgba(0, 0, 0, 0.01) 0px 1px 1px 0px',
  
    borderRadius: '15px', 
    overflow: 'hidden',
    transition: 'transform 0.2s',
    position: 'relative',
    backgroundColor: '#000', // Fallback background color
  },
  link: {
    textDecoration: 'none',
    color: 'inherit',
    position: 'relative',
    display: 'block',
    width: '100%',
    height: '100%',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover', // Ensures the image covers the container without distortion
    display: 'block',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    width: '100%',
    background: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    padding: '5px 10px',
    boxSizing: 'border-box',
    textAlign: 'center',
  },
  titleText: {
    margin: '0',
    fontSize: '14px',
    fontWeight: '500',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  noResults: {
    fontFamily: "'Montserrat', sans-serif",
    color: 'grey',
    fontSize: '18px',
    marginTop: '20px',
  },
};

export default Tutorials;
