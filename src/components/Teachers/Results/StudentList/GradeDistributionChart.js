import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GlassContainer } from '../../../../styles';

const GradeDistributionChart = ({ grades, assignmentType, periodStyle }) => {
  // Create data points for every 10%
  const ranges = Array.from({ length: 11 }, (_, i) => ({
    percentage: i * 10,
    count: 0,
    label: `${i * 10}%`
  }));
  
  // Process grades to populate the ranges based on assignment type
  Object.values(grades).forEach(gradeData => {
    if (!gradeData) return;
    
    let score;
    if (assignmentType === 'AMCQ') {
      score = typeof gradeData.SquareScore === 'number' ? Math.round(gradeData.SquareScore) : null;
    } else { // OE
      score = typeof gradeData.percentageScore === 'number' ? Math.round(gradeData.percentageScore) : null;
    }

    if (score !== null) {
      const bucketIndex = Math.min(Math.floor(score / 10), 10);
      if (bucketIndex >= 0 && bucketIndex < ranges.length) {
        ranges[bucketIndex].count++;
      }
    }
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <GlassContainer
          variant={periodStyle.variant}
          size={0}
          style={{
            minWidth: '70px',
           
          }}
          contentStyle={{
            padding: '5px 20px',
             height: '40px'
          }}
        >
          <p style={{
            fontWeight: '500',
            color: periodStyle.color,
            fontFamily: "'Montserrat', sans-serif",
            marginTop: '-0px',
            fontSize: '14px'
          }}>
            {payload[0].payload.label}
          </p>
          <p style={{
            color: 'grey',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '12px',
            marginTop: '-10px'
          }}>
            {`${payload[0].value} student${payload[0].value !== 1 ? 's' : ''}`}
          </p>
        </GlassContainer>
      );
    }
    return null;
  };

  return (
    <div style={{
      width: '110%',
      paddingTop: '30px',
      paddingBottom: '30px',
    }}>
      <div style={{width: 'calc(92% + 40px)', height: '200px', marginLeft: '4%'}}>
        <ResponsiveContainer style={{width: 'calc(92% + 50px)'}}>
          <AreaChart 
            data={ranges} 
            style={{marginLeft: '-40px', width: 'calc(100%)'}}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#e5e5e5"
            />
            <XAxis 
              dataKey="label"
              interval={0}
              tick={{ fill: 'lightgray', fontSize: '12px' }}
              axisLine={{ stroke: 'lightgray' }}
            />
            <YAxis 
              allowDecimals={false}
              tick={{ fill: 'lightgray', fontSize: '12px' }}
              axisLine={{ stroke: 'lightgray' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone"
              dataKey="count"
              stroke={periodStyle.color}
              fill="none"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GradeDistributionChart;