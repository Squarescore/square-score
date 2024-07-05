// QuestionPreview.js
import React, { useState } from 'react';

function QuestionPreview({ questions }) {
  const [expandedExplanations, setExpandedExplanations] = useState({});

  const toggleExplanation = (questionIndex, choice) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [`${questionIndex}-${choice}`]: !prev[`${questionIndex}-${choice}`]
    }));
  };

  return (
    <div>
      {questions.map((question, index) => (
        <div key={index}>
          <h3>{question.difficulty} - {question.question}</h3>
          <p>Number of choices: {question.choices}</p>
          {Object.keys(question)
            .filter(key => key.length === 1 && key >= 'A' && key <= String.fromCharCode(64 + parseInt(question.choices)))
            .map(choice => (
              <div key={choice}>
                <button onClick={() => toggleExplanation(index, choice)}>
                  {choice}: {question[choice]}
                </button>
                {expandedExplanations[`${index}-${choice}`] && (
                  <p>{question[`explanation ${choice}`]}</p>
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

export default QuestionPreview;