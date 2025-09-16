import React from 'react';
import Card from '../ui/Card';

interface DistributionData {
  label: string;
  value: number;
  color: string;
}

interface DistributionBarProps {
  data: DistributionData[];
  title: string;
  totalValue: number;
}

const DistributionBar: React.FC<DistributionBarProps> = ({ data, title, totalValue }) => {
  if (data.length === 0 || totalValue === 0) {
    return (
        <Card>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-gray-500 text-center py-4">No cost data available for the selected period.</p>
        </Card>
    );
  }
  
  return (
    <Card>
      <h3 className="font-bold text-lg mb-4">{title}</h3>
      <div className="w-full flex h-6 rounded-full overflow-hidden mb-4">
        {data.map((item, index) => (
          <div
            key={index}
            className="h-full"
            style={{
              width: `${(item.value / totalValue) * 100}%`,
              backgroundColor: item.color,
            }}
            title={`${item.label}: ₹${item.value.toLocaleString()}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <span
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: item.color }}
            />
            <span className="flex-grow truncate text-gray-700">{item.label}</span>
            <span className="font-semibold text-gray-800">
                {((item.value / totalValue) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DistributionBar;
