import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GlassContainer } from '../../../../styles';

const GradeProgressionChart2 = ({ grades, periodStyle = { variant: 'teal', color: "#1EC8bc", borderColor: "#83E2F5" } }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const data = grades
    .filter(assignment => assignment.status === 'completed')
    .map(assignment => ({
      name: assignment.assignmentName || assignment.name, // Handle both possible name properties
      score: assignment.score,
      date: assignment.submittedAt ? 
        formatDate(assignment.submittedAt.toDate()) : 
        formatDate(assignment.date)
    }))
    .reverse();

  return (
    <ResponsiveContainer>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ededed" />
        <XAxis 
          dataKey="name"
          tick={false}
          stroke="lightgrey"
          height={20}
        />
        <YAxis 
          stroke="lightgrey"
          tick={{ fill: 'grey', fontSize: 12 }}
          domain={[0, 100]}
          axisLine={true}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <GlassContainer
                  variant={periodStyle.variant}
                  size={2}
                  style={{
                    minWidth: '200px',
                  }}
                  contentStyle={{
                    padding: '12px 16px',
                    margin: '0',
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  <p style={{ 
                    margin: '0',
                    color: periodStyle.color,
                    fontWeight: '600',
                    fontSize: '.9rem'
                  }}>
                    {data.name}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '4px'
                  }}>
                    <span style={{ 
                      color: periodStyle.color,
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {data.score}%
                    </span>
                    <span style={{
                      color: 'grey',
                      fontSize: '14px'
                    }}>
                      {data.date}
                    </span>
                  </div>
                </GlassContainer>
              );
            }
            return null;
          }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke={periodStyle.color}
          strokeWidth={2}
          dot={({ cx, cy }) => (
            <g>
              {/* Larger outer circle for glass effect */}
              <circle
                cx={cx}
                cy={cy}
                r={6}
                fill="white"
                fillOpacity={0.2}
                stroke={periodStyle.borderColor}
                strokeWidth={1}
                style={{
                  filter: 'blur(0.5px)',
                }}
              />
              {/* Inner circle for solid color */}
              <circle
                cx={cx}
                cy={cy}
                r={3}
                fill={periodStyle.color}
                stroke="white"
                strokeWidth={1.5}
              />
            </g>
          )}
          activeDot={({ cx, cy }) => (
            <g>
              {/* Larger outer circle for glass effect */}
              <circle
                cx={cx}
                cy={cy}
                r={8}
                fill="white"
                fillOpacity={0.3}
                stroke={periodStyle.borderColor}
                strokeWidth={1}
                style={{
                  filter: 'blur(1px)',
                }}
              />
              {/* Inner circle for solid color */}
              <circle
                cx={cx}
                cy={cy}
                r={4}
                fill={periodStyle.color}
                stroke="white"
                strokeWidth={2}
              />
            </g>
          )}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default GradeProgressionChart2;