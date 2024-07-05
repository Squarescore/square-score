import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';


const Footer = () => {

    const foot = {  fontFamily: "'Radio Canada', sans-serif", color: 'darkgrey', fontSize: '14', marginTop: '10px', textDecoration: 'none'}

return (
    <div style={
        {position: 'absolute',width: '100%',
        height: '100px', bottom: '-110px',
        borderTop: '5px solid lightgrey',
        backgroundColor: 'white' 
        }}>

<div style={{width: '100%', height: '200px', backgroundColor: 'white', marginLeft: 'auto',
marginRight: 'auto',display: 'flex', flexDirection: 'row', marginTop: '50px'}}>

<div style={{width: '900px', marginLeft: 'auto', marginRight: 'auto', display: 'flex', flexDirection: 'row'}}>
  <div style={{width: '50%', backgroundColor: 'white', height: '200px', marginLeft: 'auto', flexDirection: 'row',display: 'flex'}}>

<div style={{width: '50%', backgroundColor: 'white', height: '200px', flexDirection: 'column',display: 'flex',}}>
<h4 style={{fontWeight:'bold', fontSize: '16px', marginBottom: '0px'}}>SquareScore</h4>
<Link style={{...foot}}>About us</Link>
  <Link style={{...foot}}>Tutorials</Link>
  <Link style={{...foot}}>Help</Link>
  <Link style={{...foot}}>Feedback</Link>
  
</div>
<div style={{width: '50%', backgroundColor: ' white', height: '200px', flexDirection: 'column',display: 'flex',}}>
<h4 style={{fontWeight:'bold', fontSize: '16px', marginBottom: '0px'}}>Legal</h4>
<Link style={{...foot}}>Privacy Policy</Link>
<Link to="/termsofservice"style={{...foot}}>Terms of Service</Link>
</div>

  </div>
  
<div style={{width: '25%', backgroundColor: 'white', height: '200px', marginRight: 'auto', flexDirection: 'column',display: 'flex'}}>
<div style={{height: '50%' ,backgroundColor: 'white'}}>
  <img src='
/Footer.png'
style={{width: '250px', marginTop: '7px', marginLeft: 'auto', marginRight: 'auto'}}/>

</div>
<div style={{height: '20%',marginTop: '45px', backgroundColor: 'white', flexDirection: 'row',display: 'flex'}}>
  <Link style={{width: '53px', backgroundColor: 'transparent', cursor: 'pointer', borderColor: 'transparent'}}>
    <img src='https://cdn3.iconfinder.com/data/icons/picons-social/57/06-facebook-512.png'style={{width: '30px', backgroundColor: 'transparent', cursor: 'pointer', borderColor: 'transparent'}}/>
  </Link>
  <Link style={{width: '53px', marginLeft: '23px',backgroundColor: 'transparent', cursor: 'pointer', borderColor: 'transparent'}}>
    <img src='https://cdn4.iconfinder.com/data/icons/social-media-black-white-2/600/Instagram_glyph_svg-512.png'style={{width: '30px', backgroundColor: 'transparent', cursor: 'pointer', borderColor: 'transparent'}}/>
  </Link>
  <Link style={{width: '53px',marginLeft: '23px', backgroundColor: 'transparent', cursor: 'pointer', borderColor: 'transparent'}}>
    <img src='https://www.svgrepo.com/show/333611/tiktok.svg'style={{width: '30px', backgroundColor: 'transparent', cursor: 'pointer', borderColor: 'transparent'}}/>
  </Link>
  <Link style={{width: '53px',marginLeft: '23px', backgroundColor: 'transparent', cursor: 'pointer', borderColor: 'transparent'}}>
    <img src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMzArllT3OlZ_oaqOTCCigwY0CWVu50szLpSTTaoOlSg&s'style={{width: '30px', backgroundColor: 'transparent', cursor: 'pointer', borderColor: 'transparent'}}/>
  </Link>
  <Link style={{width: '53px', marginLeft: '23px', backgroundColor: 'transparent', cursor: 'pointer', borderColor: 'transparent'}}>
    <img src='https://cdn-icons-png.flaticon.com/512/717/717426.png' style={{width: '30px', backgroundColor: 'transparent', cursor: 'pointer', borderColor: 'transparent'}}/>
  </Link>
</div>

</div>


</div>
</div>
</div>
);
};

export default Footer;
