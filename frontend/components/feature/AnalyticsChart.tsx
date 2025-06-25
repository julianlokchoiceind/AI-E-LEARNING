import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface AnalyticsChartProps {
  title: string;
  data: DataPoint[];
  type?: 'bar' | 'line' | 'pie';
  height?: number;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  title,
  data,
  type = 'bar',
  height = 200
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));

  if (type === 'bar') {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || '#3B82F6'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    // Simple pie chart representation using CSS
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="relative" style={{ height }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-8 border-gray-200 relative overflow-hidden">
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100;
                const rotation = data.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 360, 0);
                
                return (
                  <div
                    key={index}
                    className="absolute inset-0"
                    style={{
                      background: `conic-gradient(${item.color || '#3B82F6'} 0deg ${percentage * 3.6}deg, transparent ${percentage * 3.6}deg)`,
                      transform: `rotate(${rotation}deg)`
                    }}
                  />
                );
              })}
            </div>
          </div>
          <div className="mt-40 space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color || '#3B82F6' }}
                  />
                  <span className="text-gray-600">{item.label}</span>
                </div>
                <span className="font-medium">
                  {item.value} ({((item.value / total) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Line chart (simplified representation)
  if (type === 'line') {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="relative" style={{ height }}>
          <div className="absolute inset-0 flex items-end justify-between gap-1">
            {data.map((item, index) => (
              <div
                key={index}
                className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group"
                style={{
                  height: `${(item.value / maxValue) * 100}%`,
                  minHeight: '4px'
                }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-600 mt-2">
            {data.map((item, index) => (
              <span key={index} className="transform rotate-45 origin-left">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AnalyticsChart;