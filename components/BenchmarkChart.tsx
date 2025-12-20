import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { MetricPoint } from '../types';

interface Props {
  data: MetricPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-2 rounded shadow-xl text-xs">
        <p className="text-gray-400">Input: <span className="text-white font-mono">{label}</span></p>
        <p className="text-cyan-400">Time: <span className="text-white font-mono">{payload[0].value}ms</span></p>
      </div>
    );
  }
  return null;
};

export const BenchmarkChart: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-gray-500 text-sm">No benchmark data available.</div>;

  return (
    <div className="w-full h-64 bg-gray-900/50 rounded-lg p-4 border border-gray-800">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Runtime Latency (ms) vs Input Size</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey="inputSize" 
            stroke="#666" 
            tick={{fontSize: 10}}
            label={{ value: 'N', position: 'insideBottomRight', offset: -5, fill: '#666' }}
          />
          <YAxis 
            stroke="#666" 
            tick={{fontSize: 10}}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="timeMs" 
            stroke="#06b6d4" 
            strokeWidth={2} 
            dot={{ r: 3, fill: '#06b6d4' }} 
            activeDot={{ r: 5, fill: '#fff' }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};