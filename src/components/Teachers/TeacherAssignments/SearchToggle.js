import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SearchToggle = ({ searchTerm, handleSearchChange, activeTab }) => {
  const [showSearchBar, setShowSearchBar] = useState(false);

  const getSearchBarStyle = () => {
    let color;
    switch (activeTab) {
      case 'published':
        color = '#020CFF';
        break;
      case 'folders':
        color = '#FFAE00';
        break;
      case 'drafts':
        color = '#000';
        break;
      default:
        color = 'grey';
    }
    return { color };
  };

  return (
    <div style={{ width: '350px', height: '30px', position: 'relative', marginTop: '-25px', marginLeft: 'auto'}}>
  
        <div style={{ 
          position: 'relative', 
          width: '340px', 
          height: '30px', 
        }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '300px',
              height: '30px',
              fontSize: '14px',
              border: '1px solid lightgrey',
              fontFamily: "'Montserrat', sans-serif",
              padding: '0px 40px 0px 10px',
              backgroundColor: 'white',
              color: getSearchBarStyle().color,
              borderRadius: '5px',
              outline: 'none',
            }}
          />
          <button
            onClick={() => {
              setShowSearchBar(false);
              handleSearchChange({ target: { value: '' } });
            }}
            style={{
              position: 'absolute',
              top: '5px',
              right: '-5px',
              height: '25px',
              width: '35px',
              borderRadius: '0 10px 10px 0',
              backgroundColor: 'white',
              border: `0px solid transparent`,
          
              padding: '0',
            }}
          >
            <Search 
              size={16} 
              strokeWidth={2.8} 
              color={getSearchBarStyle().color} 
            />
          </button>
        </div>
    
    </div>
  );
};

export default SearchToggle;