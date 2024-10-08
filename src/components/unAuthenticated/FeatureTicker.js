import React from 'react';
import './FeatureTicker.css';

const FeatureTicker = () => {
  const features = [
    "Built in Time accommodations",
    "Square Score grading system",
    "YouTube link assignment generation",
    "Unlimited classes",
    "Manual teacher review",
    "Student flagging",
    "Partial credit",
    "Draft assignments",
    "Custom assign and publish date and times",
    "Compatibility with thousands of courses",
    "Multilingual assignments",
    "Instant feedback",
    "ReType answer technology"
  ];

  return (
    <div className="ticker-wrap">
      <h1 className="ticker-header">Countless Features</h1>
      <div className="ticker">
        <div className="ticker-move">
          {features.map((feature, index) => (
            <span key={index} className="ticker__item">{feature}</span>
          ))}
        </div>
        <div className="ticker-move">
          {features.map((feature, index) => (
            <span key={index + features.length} className="ticker__item">{feature}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureTicker;