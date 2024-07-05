import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import Navbar from './Navbar';

const Chat = () => {
  const { classId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetching messages
  useEffect(() => {
    const messagesRef = collection(db, 'classes', classId, 'messages');
    const q = query(messagesRef, orderBy('timestamp'));
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const currentUserId = auth.currentUser.uid;
        setMessages(snapshot.docs.map(doc => {
          const messageData = doc.data();
          const messageTimestamp = messageData.timestamp ? new Date(messageData.timestamp.seconds * 1000) : null;
          return {
            id: doc.id,
            ...messageData,
            timestamp: messageTimestamp,
            isCurrentUser: messageData.sender === currentUserId
          };
        }));
      });
    
      return () => unsubscribe();
    }, [classId]);

  // Handle new message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const messagesRef = collection(db, 'classes', classId, 'messages');
    await addDoc(messagesRef, {
      text: newMessage,
      sender: auth.currentUser.uid,
      timestamp: serverTimestamp(),
    });
    setNewMessage('');
  };



  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white'}}>
       <Navbar userType="teacher" />
     <div style={{ flex: 1, overflowY: 'auto', marginTop: '50px', width: '1000px',marginBottom: '120px', marginLeft: 'auto', 
    marginRight: 'auto'}}>
  {messages.map(message => (
    <div 
    key={message.id}
    style={{  
      display: 'flex',
     
      flexDirection: 'column',
      alignItems: message.isCurrentUser ? 'flex-end' : 'flex-start',
      width: '900px',
      marginRight: 'auto', marginLeft: 'auto', 
      marginTop: '50px',
     fontFamily: "'Radio Canada', sans-serif",
     
    }}
  >
  <small style={{ 
      marginTop: '8px',fontFamily: "'Radio Canada', sans-serif",
      textAlign: 'right' 
    }}>
      {message.sender}
    </small>
    <div style={{
      backgroundColor: message.isCurrentUser ? 'black' : '#ECECEC',  
      color: message.isCurrentUser ? 'white' : 'darkgrey',  
      borderRadius: '10px',
      padding: '10px',fontFamily: "'Radio Canada', sans-serif",
      height: '',
      minWidth: '100px',
      textAlign: 'center'
    }}>
      <p style={{ width: '' }}>{message.text}</p>
    </div>
  
    
  
    {message.timestamp && 
      <small style={{
        marginTop: '4px',
        textAlign: 'right',
        fontSize: '12px', 
        color: '#666' 
      }}>
        {message.timestamp.toLocaleString()} 
      </small>
    }
  
  </div>
  ))}
</div>
      <div style={{ 
       display: 'flex', 
       alignItems: 'center', 
       width: '100%', 
       marginLeft: 'auto', 
       marginRight: 'auto', 
       position: 'fixed', 
       bottom: 0, }}>
        <div style={{width: '1000px ',marginLeft: 'auto', marginRight:'auto', display: 'flex' ,     backgrondColor: 'transparent',}}>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{ flex: 1, borderColor: 'transparent',fontFamily: "'Radio Canada', sans-serif",
          padding: '20px', height: '50px', backgroundColor: '	grey', opacity: '60%', borderTopLeftRadius: '10px',
          borderBottomLeftRadius: '10px', fontSize: '18px', borderStyle: 'solid'  }}
        />
        <button onClick={handleSendMessage} style={{height: '92px', backgroundColor: 'black',color: 'white', borderTopRightRadius: '10px',
          borderBottomRightRadius: '10px',fontFamily: "'Radio Canada', sans-serif",
          borderStyle: 'solid', }}>Send</button>
          </div>
      </div>
    </div>
  );
};

export default Chat;