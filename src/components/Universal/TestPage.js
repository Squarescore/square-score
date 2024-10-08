import React, { useState, useEffect } from 'react';

const TestPage = () => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [nextDifficulty, setNextDifficulty] = useState('Medium');
  const [pointsConfig, setPointsConfig] = useState({
    Hard: { correct: 4, incorrect: -1 },
    Medium: { correct: 2.5, incorrect: -2 },
    Easy: { correct: 1.5, incorrect: -4 },
  });
  const [streakMultiplier, setStreakMultiplier] = useState(1);
  const [answers, setAnswers] = useState(Array(40).fill(null));
  const [difficulties, setDifficulties] = useState(Array(40).fill(undefined));
  const [answerHistory, setAnswerHistory] = useState([]);
  const [streakSaverThreshold, setStreakSaverThreshold] = useState(6);
  const [streakSaverCount, setStreakSaverCount] = useState(0);
  useEffect(() => {
    recalculateScore();
  }, [pointsConfig, streakMultiplier, streakSaverThreshold]);

  const recalculateScore = () => {
    let newScore = 0;
    let currentStreak = 0;
    let currentStreakSaverCount = 0;

    answerHistory.forEach(({ isCorrect, difficulty }, index) => {
      if (isCorrect) {
        currentStreak++;
        currentStreakSaverCount = 0;
        const streakBonus = (currentStreak - 1) * streakMultiplier;
        newScore += pointsConfig[difficulty].correct + streakBonus;
      } else {
        if (currentStreak >= streakSaverThreshold && currentStreakSaverCount < 1) {
          currentStreak = Math.floor(currentStreak / 2) + 1;
          currentStreakSaverCount++;
        } else {
          currentStreak = 0;
          currentStreakSaverCount = 0;
        }
        newScore += pointsConfig[difficulty].incorrect;
      }
    });

    setScore(newScore);
    setStreak(currentStreak);
    setStreakSaverCount(currentStreakSaverCount);
  };
  const handleAnswer = (index, isCorrect) => {
    const newAnswers = [...answers];
    newAnswers[index] = isCorrect;
    setAnswers(newAnswers);
  
    const newDifficulties = [...difficulties];
    newDifficulties[index] = nextDifficulty;
    setDifficulties(newDifficulties);
  
    // Remove the previous answer for this index if it exists
    const newAnswerHistory = answerHistory.filter(answer => answer.index !== index);
    // Add the new answer
    newAnswerHistory.push({ index, isCorrect, difficulty: nextDifficulty });
    setAnswerHistory(newAnswerHistory);
  
    recalculateScore();
    updateNextDifficulty(newAnswerHistory);
  };
  
  const updateNextDifficulty = (history) => {
    const lastAnswer = history[history.length - 1];
    if (lastAnswer) {
      if (lastAnswer.isCorrect) {
        setNextDifficulty(prevDifficulty => 
          prevDifficulty === 'Hard' ? 'Hard' : 
          prevDifficulty === 'Medium' ? 'Hard' : 'Medium'
        );
      } else {
        setNextDifficulty(prevDifficulty => 
          prevDifficulty === 'Easy' ? 'Easy' : 
          prevDifficulty === 'Medium' ? 'Easy' : 'Medium'
        );
      }
    }
  };
  

  const handleStreakSaverThresholdChange = (value) => {
    setStreakSaverThreshold(parseInt(value, 10));
  };


  const handlePointsConfigChange = (difficulty, type, value) => {
    setPointsConfig(prevConfig => ({
      ...prevConfig,
      [difficulty]: { ...prevConfig[difficulty], [type]: parseFloat(value) },
    }));
  };

  const handleStreakMultiplierChange = (value) => {
    setStreakMultiplier(parseFloat(value));
  };
  const resetSimulation = () => {
    setScore(0);
    setStreak(0);
    setNextDifficulty('Medium');
    setAnswers(Array(40).fill(null));
    setDifficulties(Array(40).fill(undefined));
    setAnswerHistory([]);
    setStreakSaverCount(0);

  };
  return (
    <div style={{ paddingBottom: '80px', marginLeft: '-3px', marginRight: '-3px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' }}>
      {/* ... (previous code for header, buttons, etc.) */}

      <div style={{ width: '1000px', marginLeft: 'auto', marginRight: 'auto', marginTop: '150px', position: 'relative' }}>
        <h2>Scoring Configuration</h2>
        {Object.entries(pointsConfig).map(([difficulty, points]) => (
          <div key={difficulty}>
            <h3>{difficulty}</h3>
            <label>
              Correct:
              <input
                type="number"
                value={points.correct}
                onChange={(e) => handlePointsConfigChange(difficulty, 'correct', e.target.value)}
              />
            </label>
            <label>
              Incorrect:
              <input
                type="number"
                value={points.incorrect}
                onChange={(e) => handlePointsConfigChange(difficulty, 'incorrect', e.target.value)}
              />
            </label>
          </div>
        ))}

<h3>Streak Saver Threshold</h3>
        <input
          type="number"
          value={streakSaverThreshold}
          onChange={(e) => handleStreakSaverThresholdChange(e.target.value)}
        />
        <h3>Streak Multiplier</h3>
        <input
          type="number"
          value={streakMultiplier}
          onChange={(e) => handleStreakMultiplierChange(e.target.value)}
        />

        <h2>Current Score: {score}</h2>
        <h3>Current Streak: {streak}</h3>
        <h3>Next Question Difficulty: {nextDifficulty}</h3>

        <button 
          onClick={resetSimulation}
          style={{
           
          }}
        >
          Reset Simulation
        </button>
        <h2>Answers</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
  {answers.map((answer, index) => (
    <div key={index}>
      <span>{index + 1}. </span>
      
      <label style={{ color: answer === true ? 'green' : 'inherit' }}>
        <input
          type="checkbox"
          checked={answer === true}
          onChange={() => handleAnswer(index, true)}
          style={{ accentColor: answer === true ? 'green' : 'inherit' }}
        />
        ✔
      </label>
      <label style={{ color: answer === false ? 'red' : 'inherit' }}>
        <input
          type="checkbox"
          checked={answer === false}
          onChange={() => handleAnswer(index, false)}
          style={{ accentColor: answer === false ? 'red' : 'inherit' }}
        />
        X
      </label>
      <span style={{ color: answer === false ? 'red' : answer === true ? 'green': 'grey' }}>
        ({difficulties[index] || 'Undefined'})
      </span>
    </div>
  ))}
</div>
      </div>
    </div>
  );
}

export default TestPage;