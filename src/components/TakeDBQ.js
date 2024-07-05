import { useParams } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Ensure you've installed uuid
import { auth } from './firebase';
const TakeDBQ = () => {
  const { dbqId: dbqIdParam } = useParams();
  const [dbqId, setDbqId] = useState('');
  const [classId, setClassId] = useState(null); 
  const [assignment, setAssignment] = useState('');
  const [name, setName] = useState('');
  const [studentResponse, setStudentResponse] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [gradedResponse, setGradedResponse] = useState('');
  const [images, setImages] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [sources, setSources] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState(null);
  
  const studentUid = auth.currentUser.uid;
  useEffect(() => {
    
    const studentRef = doc(db, 'students', studentUid);
    const hash = window.location.hash ? window.location.hash.substring(1) : '';
    const fullDbqId = `${dbqIdParam}${hash ? '#' + hash : ''}`;
    setDbqId(fullDbqId);

   
    const fetchDBQDetails = async () => {
      const dbqDocRef = doc(db, 'dbqs', fullDbqId);
      const dbqDoc = await getDoc(dbqDocRef);
      const studentRef = doc(db, 'students', studentUid);
      const studentDoc = await getDoc(studentRef);
      const studentData = studentDoc.data();
      let multiplier = studentData.timeMultiplier || 1;
      if (dbqDoc.exists()) {
        const data = dbqDoc.data();
        setAssignment(data.assignment);
        setName(data.name);
        setClassId(data.classId);
        // Split the assignment data into prompt and sources
        const [promptPart, sourcesPart] = data.assignment.split("Sources:");
        setPrompt(promptPart.trim());
        setSources(sourcesPart.trim());
       
        setImages(data.imageUrl ? data.imageUrl.split(",") : []);
        

        if (data.timer && data.timer > 0) {
          setCountdown((data.timer * 60)* multiplier); // Convert minutes to seconds
        }
      }
    };

    fetchDBQDetails();
  }, [dbqIdParam]);

 

  
  const handleBeforeUnload = (event) => {
    event.preventDefault();
    event.returnValue = 'Are you sure you want to leave? Your work will be submitted if you proceed.';
    return event.returnValue;
  };
  useEffect(() => {
    let interval;
    if (countdown > 0 && !isSubmitting) {
      interval = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
    } else if (countdown === 0 && timer !== null && !isSubmitting) {
      clearInterval(interval);
      handleSubmit(); // Submit the form automatically when timer reaches 0
    }
  
    window.addEventListener('beforeunload', handleBeforeUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
    };
  }, [countdown, isSubmitting]);
  const formatTime = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };


  console.log('DBQ ID:', dbqId);
  // Your component code continues here...

  
  console.log('Assignment:', assignment);

  console.log('Student Response:', studentResponse);
  console.log('Is Modal Visible:', isModalVisible);
  console.log('Graded Response:', gradedResponse);

  const handleSubmit = async () => {
    try {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setIsSubmitting(true);
  
      const responses = await Promise.all([
        fetchGradedResponse(),
        fetchGradedResponse(),
        fetchGradedResponse(),
      ]);
  
      const longestResponse = responses.reduce((longest, current) => {
        return current.length > longest.length ? current : longest;
      }, '');
  
      setGradedResponse(longestResponse);
      setIsModalVisible(true);
  
      const dbqScoreId = uuidv4();
      await setDoc(doc(db, 'dbqscore', dbqScoreId), {
        apiResponse: longestResponse,
        studentResponse: studentResponse,
        dbqId: dbqId,
        classId: classId,
        studentUid: studentUid,
      });
  
      console.log('DBQ Score Saved with ID:', dbqScoreId);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error submitting the response:', error);
      setIsSubmitting(false);
    }
  };
  
  const fetchGradedResponse = async () => {
    try {
      let gradedResponse = '';
      while (gradedResponse.length < studentResponse.length) {
        const response = await fetch('https://us-central1-lirf4-41820.cloudfunctions.net/gradedbq', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            textbook: assignment,
            question: `in reference to the following AP style dbq  ${assignment}:you must score this student "${studentResponse}"written response with the rubric provided, and then rewrite the students entire essay as it is originally but annottate with your comments as if you were a teacher. these comments 
              can be congratulatory if a student does something right or alerts the student they did something wrong, the format for these comments is that the comment is in parenthesis and should say what the comment is in regard too, for example, good thesis, add detail, dont call the author only by first name, you have to continue elaborating POV, POV shouldnt only be 1 sentence, why,
              add context, overexplained, is this what the source is really saying, good job, nice pov, need another POV(studnets should have 3 povs in their writing which detail how the author was thinking and their motives if not included or elaborated on add them or comment) etc.. , you are grading how a teacher would annotate a students paper. this is the first part of the comment, the second part fixes the error mentioned in part one, for example: "Alexander hamilton did good for the county (add context: alexander hamilton spend his political carreer in search of a 
              fair government which he accomplished through....). Students shouldnt only use the documents but comment on them and show how they connect to what they are saying. Additionally somewhere in the student response should be a few sentences of historical context which explain what was happening at the time. It is imperative you use the parenthesis where you make comments. this is the rubric you should reference for your grading: A	 THESIS/CLAIM
              (0–1 pt)
              1 pt.
              Responds to the prompt with a
              historically defensible thesis/claim that
              establishes a line of reasoning.
              To earn this point, the thesis must make a claim that
              responds to the prompt rather than restating or
              rephrasing the prompt. The thesis must consist of
              one or more sentences located in one place, either in
              the introduction or the conclusion.
              
              1 pt. Context
              Describes a broader historical context
              relevant to the prompt.
              To earn this point, the response must relate the topic of
              the prompt to broader historical events, developments,
              or processes that occur before, during, or continue after
              the time frame of the question and elaborate on these historical events directly. This point is not awarded
              for merely a phrase or reference, moreover a student must show deep understanding for whats going on at the time outside of the sources and provide background they should provide facts and figures here rather than be broad, if there is not at least a clear 2 sentences explaining the historical context this point shouldnt be given.
              EVIDENCE
              (0–3 pts)
              Evidence from the Documents To earn one point, the response must accurately
              describe — rather than simply quote — the content
              from at least three of the documents.
              To earn two points, the response must accurately
              describe — rather than simply quote — the content
              from at least six documents. In addition, the response
              must use the content of the documents to support an
              argument in response to the prompt.
              1 pt.
              Uses at
              least three
              documents to
              address the
              topic of the
              prompt.
              OR 2 pts.
              Supports an
              argument in
              response to
              the prompt
              using at
              least six
              documents.

             
              1 pt.
             Uses a piece of external information as evidence and elaborates on it 
             Evidence beyond the Documents To earn this point, the response must describe
              the evidence and must use more than a phrase or
              reference. This additional piece of evidence must be
              different from the evidence used to earn the point for
              contextualization.



              1 pt.
              For at least three documents, explains
              how or why the document's point of
              view (POV), purpose, historical situation, and/or
              audience is relevant to an argument.
              To earn this point, the response must explain how or
              why (rather than simply identifying) the document's
              point of view, purpose, historical situation, or audience
              is relevant to an argument about the prompt for each of
              the three documents sourced. This point should only be given if the POV, purpose, historical situation, or audience are talked about explicitly and elaborated on with accurate information
              1 pt.
              Demonstrates a complex
              understanding of the historical
              development that is the focus of the
              prompt, using evidence to corroborate,
              qualify, or modify an argument that
              addresses the question.
              A response may demonstrate a complex
              understanding in a variety of ways, such as:
              • Explaining nuance of an issue by analyzing multiple
              variables
              • Explaining both similarity and difference, or
              explaining both continuity and change, or
              explaining multiple causes, or explaining both
              cause and effect
              • Explaining relevant and insightful connections
              within and across periods
              • Confirming the validity of an argument by
              corroborating multiple perspectives across themes
              • Qualifying or modifying an argument by considering
              diverse or alternative views or evidence
              This understanding must be part of the argument, not
              merely a phrase or reference, the reference must the explanation must explicitly say what it is to show complexity, this is the strictest and hardest point';
              
              This is the prompt and sources :
              this is the student response: "${studentResponse}"
              REMEMBER the format of you response should be how many points in each category, no further explanation here ex. "Thesis/claim: x points, contextualization: x points, evidence: x points, analysis and reasoning: x points' and then you rewrite the students submission with comments and improvements in () this part is the most important. Remember to ensure responses have 3 solid POV's explaining why authors made sources and how they were feeling at the time which should each be 1+sentences when commenting and improving on povs dont just tell students to consider the motivations and reasons for authors to write as they did but you yourself take the historical situation and documens and provide a POV for the authors , additionally make sure responses  provide the broader context of the situation, if these arent present add them when you rewriote the student response, if they are present add comments and improvements with explanations to why you made such changes - do the smae for all other parts of the student response.You should not just tell students how to improve when rewriting the essay but implement the improvements and explain to the student why they were necessary every change you make must be in() and have a comment also in () as to why you made the change- comments should not be at the end of your response but inline with where each change is made vice versa - if you comment something you must include an improvement adressing what the comment was on so if your comment was to add context or pov for example you must then add the context or pov or anyother thing that must be corrected, furthermore any change you make whether its gramatical or a biggere change must be in () with an explanation to why you made the change,
              also remember that when making these comments, dont leave them open ended, you should elaborate and show yourself that you have a complete understanding of the historical situation, providing facts of the time as feedback for students . YOou should also provide feedback on the writing itsefl, for example if a thesis is weak in a comment you should explain why its weak or porrly phrased and put your improvement. Remember you are not making a new essay but are taking the students existing essay and throughout the essay adding comments with feedback. also remember you have to grade incredibly strictly as if you are an AP grader
              now do as I specified and remember to not leave all your comments for the end of the student response but weave them in throughout where appropriate.
              `,
          }),
        });
  
        if (response.ok) {
          const data = await response.json();
          gradedResponse = data.grade;
        } else {
          console.error('Error grading the response');
          break;
        }
      }
  
      return gradedResponse;
    } catch (error) {
      console.error('Error fetching graded response:', error);
      return '';
    }
  };

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };
  
  const modalContentStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    maxWidth: '80%',
    maxHeight: '80%',
    overflow: 'auto',
  };
  
  const formatAssignmentWithLineBreaks = (text) => {
    // Convert escaped newline characters to HTML line breaks
    // If your newlines are not escaped, adjust this line accordingly
    const formattedText = text.replace(/\\n/g, '<br />');
    return { __html: formattedText };
  };
  const renderSourcesWithNewlines = (sourcesText) => {
    const cleanedSourcesText = sourcesText.replace(/\[.*?\]/g, '');
    const lines = cleanedSourcesText.split('\n');
  
    const handleSelectText = (event) => {
      event.preventDefault();
      const selectedText = window.getSelection().toString();
      if (selectedText) {
        const comment = prompt('Add a comment:', '');
        if (comment) {
          const highlightedText = `<span style="background-color: yellow;">${selectedText}</span>`;
          const commentElement = `<span style="color: blue;">(${comment})</span>`;
          setSources(sources.replace(selectedText, `${highlightedText}${commentElement}`));
        }
      }
    };
  
    const handleCopy = (event) => {
      event.preventDefault();
      alert('Copying is not allowed.');
    };
  
    return lines.map((line, index) => (
      <React.Fragment key={index}>
        <span
          onMouseUp={handleSelectText}
          onCopy={handleCopy}
          style={{ userSelect: 'text' }}
        >
          {line}
        </span>
        <br />
      </React.Fragment>
    ));
  };
  const renderImages = () => {
    if (Array.isArray(images)) {
      return images.map((imageUrl, index) => (
        <img key={index} src={imageUrl} alt={`Attachment ${index + 1}`} style={{ maxWidth: '100%', margin: '10px 0' }} />
      ));
    } else if (images) { // Fallback for a single URL string
      return <img src={images} alt="Assignment Attachment" style={{ maxWidth: '100%', margin: '10px 0' }} />;
    }
  };




  return (
    <div>
     
     
      <div style={{width:'100%', position: 'fixed', height: '100px',marginLeft: 'auto', marginRight: 'auto', display: 'flex', alignItems: 'center',  bottomRightBorderRadius: '10px',bottomLeftBorderRadius: '10px',  backgroundColor: 'rgba(210,210,210,0.7)', 
marginTop: '-150px',
backdropFilter: 'blur(5px)',
flexDirection: 'column',
boxShadow: '2px 2px 30px 1px rgb(150,150,150,.2)'}}>



   <h1 style={{color: 'white', marginTop: '-0px', marginLeft: 'auto', marginRight: 'auto',width: '100%', textAlign: 'center', fontSize: '20px',  flexDirection: 'row', 
    backgroundColor: 'rgba(0,0,0,0.8)', 

    
    backdropFilter: 'blur(5px)', 
    boxShadow: '2px 2px 30px 1px rgb(0,0,0,.2)' }}>
        <button style={{ position: 'absolute', color: 'white',left: '0px',padding: '10px 10px',cursor: 'pointer', height: '30px', lineHeight: '10px', fontFamily: "'Radio Canada', sans-serif", backgroundColor: 'transparent', border: '0px solid transparent', borderLeft: '2px solid transparent',fontWeight: 'bold'}}  >Save and Exit</button>
     <button style={{  position: 'absolute',color: 'white', left: '110px',padding: '10px 10px',cursor: 'pointer', height: '30px', lineHeight: '10px', fontFamily: "'Radio Canada', sans-serif", backgroundColor: 'transparent', border: '0px solid transparent', borderLeft: '2px solid grey',fontWeight: 'bold'
  
  
 

   }}  onClick={handleSubmit}>Submit</button>



 
   {name}
   
     
     
    </h1>

    
  
   
    {countdown > 0 && (<h2 style={{position: 'fixed'  , color: 'white', textAlign: ' center', lineHeight: '90px', height: '90px', width: '90px', borderRadius: '50px', right: '30px', top: '-15px', 
    
    
    backgroundColor: 'rgba(0,0,110,0.3)', 

    
    backdropFilter: 'blur(5px)', 
    boxShadow: '2px 2px 30px 1px rgb(0,0,0,.1)' , }}>{formatTime()}</h2>  )}
     
     
     </div>
     <div style={{width: '1000px', marginLeft: 'auto', marginRight: 'auto', position: 'fixed', top: '40px', }}>
     <div style={{userSelect: 'none', width: '700px', marginLeft: '150px',
    
    
    color: 'grey',
    backgroundColor: 'transparent', 
lineHeight: '20px',
alignItems: 'center', borderRadius: '10px', padding: '5px',
    

    }} dangerouslySetInnerHTML={formatAssignmentWithLineBreaks(prompt)} />
     </div>
     {isSubmitting && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  }}>
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    }}>
      <h2>Submitting...</h2>
      <p>Please wait while your response is being submitted.</p>
    </div>
  </div>
)}
    <h1 style={{ marginTop: '150px', background: 'white', textAlign: 'center', fontSize: '20px', color: 'grey'}}> For Assistance Contact 305-479-0981</h1>
      {assignment ? (
        <div style={{width: '85%', border: '2px solid lightGrey', zIndex: -21,
        height: '500px',
        backgroundColor: 'rgba(110,110,110,0.1)', 

    
       
        boxShadow: '2px 2px 30px 1px rgb(0,0,0,.1)', borderRadius: '15px', padding: '20px', marginLeft: 'auto', marginRight: 'auto', marginTop:'', display: 'flex'}}>
         
          <div style={{width: '50%',  height: '400px',
    overflowY: 'auto', }}>
            {/* Render the assignment with formatted line breaks */}

            <h1>Sources:</h1>
    <div style={{userSelect: 'none'}}>
      {renderSourcesWithNewlines(sources)}
    </div>
    {renderImages()}
  </div>
          <div style={{ width: '45%', marginLeft: 'auto', display: 'flex', alignItems: "rows"}}>
          <textarea style={{height: '95%', width: '100%', 
            backgroundColor: 'rgba(250,250,250,.6)',  borderColor: 'transparent', padding: '20px',

    
            
            boxShadow: '2px 2px 30px 1px rgb(0,0,0,.1)', outline: 'transparent', borderRadius: '7px'}}
          onpaste="return false;"
            value={studentResponse}
            onChange={(e) => setStudentResponse(e.target.value)}
          />
          
        </div>
        </div>
      ) : (
        <div>Loading...</div>
      )}
     {isModalVisible && (
  <div style={modalStyle}>
    <div style={modalContentStyle}>
      <h2>Graded Response:</h2>
      <p
        dangerouslySetInnerHTML={{
          __html: gradedResponse.replace(
            /\(([^)]+)\)/g,
            '<span style="color: blue;">($1)</span>'
          ),
        }}
      ></p>
      <button onClick={() => setIsModalVisible(false)}>Close</button>
    </div>
  </div>
)}
    </div>
  );
};

export default TakeDBQ;