
import React from 'react';
import Card from '../ui/Card';

interface ChartData {
  label: string;
  value: number;
}

interface WeeklyProgressChartProps {
  data: ChartData[];
  title: string;
}

const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid division by zero
  const chartHeight = 150; // in pixels

  return (
    <Card>
      <h3 className="font-bold text-lg mb-4">{title}</h3>
      <div className="flex justify-around items-end h-[150px] space-x-2">
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          return (
            <div key={index} className="flex-1 flex flex-col items-center justify-end group">
                <p className="text-xs font-semibold text-gray-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.value}</p>
                <div
                    className="w-full bg-primary-200 rounded-t-md group-hover:bg-primary-400 transition-all duration-300"
                    style={{ height: `${barHeight}px` }}
                    title={`${item.label}: ${item.value} tasks`}
                ></div>
                <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default WeeklyProgressChart;
