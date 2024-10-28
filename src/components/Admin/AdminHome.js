import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../Universal/firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuthState } from 'react-firebase-hooks/auth';
import HomeNavbar from '../Universal/HomeNavbar';
import Footer from '../Universal/Footer';
import { Link } from 'react-router-dom';
const AdminHome = () => {
  const [user, loading, error] = useAuthState(auth);
  const [hasSchool, setHasSchool] = useState(false);
  const [schoolData, setSchoolData] = useState(null);
  const [formData, setFormData] = useState({
    schoolName: '',
    postalCode: '',
    country: '',
    state: '',
    county: '',
    schoolLevel: ''
  });
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSchool = async () => {
      if (user) {
        try {
          const docRef = doc(db, "schools", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setHasSchool(true);
            setSchoolData(docSnap.data());
          } else {
            setHasSchool(false);
          }
        } catch (err) {
          console.error("Error checking school:", err);
        }
      }
    };
    checkSchool();
  }, [user]);

  const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'schoolLevel') {
      setFormData({ ...formData, [name]: value });
    } else {
      const capitalizedValue = capitalizeWords(value);
      setFormData({ ...formData, [name]: capitalizedValue });
    }
  };

  const handleInputFocus = (name) => {
    setFocusedField(name);
  };

  const handleInputBlur = () => {
    setFocusedField(null);
  };

  const generateJoinCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user) {
      try {
        console.log("Submitting form with data:", formData);

        // Check if the user is indeed an admin
        const adminDocRef = doc(db, 'admin', user.uid);
        const adminDocSnap = await getDoc(adminDocRef);
  
        if (adminDocSnap.exists()) {
          const adminData = adminDocSnap.data();
          const adminName = `${adminData.firstName} ${adminData.lastName}`;
  
          const joinCode = generateJoinCode(); // Generate a join code
          const schoolData = {
            ...formData,
            adminName: adminName,
            adminUID: user.uid,
            joinCode: joinCode
          };

          // Save school data to the 'schools' collection
          await setDoc(doc(db, "schools", user.uid), schoolData);
          console.log("School registered successfully:", schoolData);
          setHasSchool(true);
          setSchoolData(schoolData); // Update state with new school data
        } else {
          console.error("Admin profile not found for user:", user.uid);
        }
      } catch (error) {
        console.error("Error saving school data:", error);
      }
    } else {
      console.error("User is not authenticated");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const renderInput = (name, placeholder, required = true, customStyle = {}) => {
    const isSchoolName = name === 'schoolName';
    const labelFontSize = isSchoolName
      ? focusedField === name || formData[name]
        ? '16px'
        : '24px'
      : focusedField === name || formData[name]
      ? '12px'
      : '16px';
  
    const labelTop = isSchoolName
      ? focusedField === name || formData[name]
        ? '-10px'
        : '15px'
      : focusedField === name || formData[name]
      ? '-5px'
      : '10px';
  
    return (
      <div style={{ ...inputContainerStyle, ...customStyle.container }}>
        <input
          type="text"
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          onFocus={() => handleInputFocus(name)}
          onBlur={handleInputBlur}
          required={required}
          style={{
            ...inputStyle,
            ...customStyle.input,
            borderColor: focusedField === name ? '#45B434' : '#ccc',
          }}
        />
        <label
          style={{
            ...labelStyle,
            ...customStyle.label,
            top: labelTop,
            fontSize: labelFontSize,
          }}
        >
          {placeholder}
        </label>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: "'montserrat', sans-serif", fontWeight: 'bold', minHeight: '100vh', backgroundColor: 'white' }}>
      <HomeNavbar userType="admin" />
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
        {!hasSchool ? (
          <div style={{ width: '100%', maxWidth: '500px', marginTop: '50px' }}>
            <form onSubmit={handleSubmit} style={{ marginLeft: '40px' }}>
              <h2 style={{ fontFamily: "'montserrat', sans-serif", fontSize: '32px', marginBottom: '40px', marginTop: '100px', textAlign: 'center' }}>Register Your School</h2>
              
              {renderInput('schoolName', 'School Name', true, schoolNameStyle)}

              <div style={inputContainerStyle}>
                <select
                  name="schoolLevel"
                  value={formData.schoolLevel}
                  onChange={handleInputChange}
                  onFocus={() => handleInputFocus('schoolLevel')}
                  onBlur={handleInputBlur}
                  required
                  style={{
                    ...selectStyle,
                    borderColor: focusedField === 'schoolLevel' ? '#45B434' : '#ccc',
                  }}
                >
                  <option value="elementary">Elementary</option>
                  <option value="middle">Middle</option>
                  <option value="high">High School</option>
                  <option value="k-8">K-8</option>
                  <option value="k-12">K-12</option>
                  <option value="college">College</option>
                </select>
                <label
                  style={{
                    ...labelStyle,
                    top: focusedField === 'schoolLevel' || formData.schoolLevel ? '-5px' : '10px',
                    fontSize: focusedField === 'schoolLevel' || formData.schoolLevel ? '12px' : '16px',
                  }}
                >
                  School Level
                </label>
              </div>

              {renderInput('country', 'Country')}
              {renderInput('state', 'State/Province')}
              {renderInput('county', 'County', false)}
              {renderInput('postalCode', 'Postal Code')}

              <button type="submit" style={buttonStyle}>Register School</button>
            </form>
          </div>
        ) : (

          <div style={{ width: '100%', maxWidth: '1000px', textAlign: 'left', marginTop: '50px' }}>
            <h2 style={{
fontSize: '50px',
paddingBottom: '20px',
fontFamily: "'montserrat', sans-serif",
borderBottom: '4px solid lightgrey'

            }}
            >
              {schoolData.schoolName}</h2>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px', marginBottom: '100px' }}>
              <div style={{ flex: 1, padding: '0px', border: '10px solid white', borderRadius: '30px', marginRight: '10px' }}>
              <div
  style={{
    border: '10px solid lightgrey',
    background: '#f4f4f4',
    display: 'flex',
    height: '70px',
    marginTop: '-10px',
    marginLeft: '-10px',
    marginRight: '-10px',
    justifyContent: 'center',
    alignItems: 'center', // Center content vertically
    borderRadius: '30px',
    borderBottomLeftRadius: '0px',
    borderBottomRightRadius: '0px',
  }}
>
  <h3
    style={{
      fontSize: '30px',
    }}
  >
    Join Code:
  </h3>
  <p
    style={{
      marginLeft: '20px',
      fontSize: '45px',
      color: 'blue',
    }}
  >
    {schoolData.joinCode}
  </p>
</div>

                <h2
                style={{width: '90%', marginLeft: '5%',
                  paddingBottom:'10px'
                  
                }}>To join the school, have teachers input this code on their home page</h2>
              </div>
              <Link to="/admin-ub" style={{ textDecoration: 'none' }}> {/* Add the Link component */}
  <div style={{ flex: 1, padding: '20px', border: '10px solid white', borderRadius: '30px', marginLeft: '10px' }}>
    <div>
      <h3
        style={{
          fontSize: '50px',
          color: 'grey',
          textAlign: 'center',
          marginTop: '50px',
        }}
      >
        Usage & Billing
      </h3>
    </div>
  </div>
</Link>
            </div>
          </div>
        )}
      </main>
      <Footer/>
    </div>
  );
};

const inputContainerStyle = {
  position: 'relative',
  marginBottom: '20px',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  paddingTop: '10px',
  borderRadius: '5px',
  border: '1px solid #ccc',
  fontSize: '16px',
  transition: 'all 0.3s ease',
};

const labelStyle = {
  position: 'absolute',
  left: '10px',
  transition: 'all 0.3s ease',
  pointerEvents: 'none',
  paddingLeft: '5px',
  paddingRight: '5px',
  backgroundColor: 'white',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  width: '104%',
  backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px top 50%',
  backgroundSize: '12px auto'
};

const buttonStyle = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#AEF2A3',
  color: '#45B434',
  border: '4px solid #45B434',
  borderRadius: '10px',
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: '0.3s'
};

const schoolNameStyle = {
  container: {
    marginBottom: '30px',
    width: '98%',
  },
  input: {
    fontSize: '24px',
    padding: '15px',
    fontFamily: "'montserrat', sans-serif",
    fontWeight: 'bold',
    paddingTop: '15px',
  }
};

export default AdminHome;
