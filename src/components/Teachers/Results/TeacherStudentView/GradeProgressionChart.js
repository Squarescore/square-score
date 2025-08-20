import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { GlassContainer } from '../../../../styles';

const GradeProgressionChart = ({ grades, period = 4 }) => {
  const periodStyles = {
    1: { variant: 'teal', color: "#1EC8bc", borderColor: "#83E2F5" },
    2: { variant: 'purple', color: "#8324e1", borderColor: "#cf9eff" },
    3: { variant: 'orange', color: "#ff8800", borderColor: "#f1ab5a" },
    4: { variant: 'yellow', color: "#ffc300", borderColor: "#Ecca5a" },
    5: { variant: 'green', color: "#29c60f", borderColor: "#aef2a3" },
    6: { variant: 'blue', color: "#1651d4", borderColor: "#b5ccff" },
    7: { variant: 'pink', color: "#d138e9", borderColor: "#f198ff" },
    8: { variant: 'red', color: "#c63e3e", borderColor: "#ffa3a3" },
  };

  // Process grades to create chart data
  const chartData = grades
    .sort((a, b) => a.submittedAt.toDate() - b.submittedAt.toDate())
    .map(grade => ({
      name: grade.assignmentName,
      average: grade.score || 0,
      date: new Date(grade.submittedAt.toDate()).toLocaleDateString()
    }));

  const currentPeriodStyle = periodStyles[period] || periodStyles[4]; // Default to period 4 if not found



  return (
    <div style={{
      width: 'calc(100%)',
      padding: '0px',
      height: "190px",
      marginTop: '30px', 
      marginBottom: '100px',
      position: 'relative'
    }}>

      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -30, bottom: 5 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={currentPeriodStyle.color} stopOpacity={0.10} />
              <stop offset="100%" stopColor={currentPeriodStyle.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <GlassContainer
                    variant={currentPeriodStyle.variant}
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
                      color: currentPeriodStyle.color,
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
                        color: currentPeriodStyle.color,
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {data.average}%
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
          <Area 
            type="monotone"
            dataKey="average"
            stroke={currentPeriodStyle.color}
            fill="url(#areaGradient)"
            strokeWidth={2}
            connectNulls={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    
    </div>
  );
};

export default GradeProgressionChart;