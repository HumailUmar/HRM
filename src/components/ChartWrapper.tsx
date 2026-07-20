import React from 'react';

interface ChartWrapperProps {
  data: any[];
  children: React.ReactNode;
  emptyMessage?: string;
  loading?: boolean;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  data,
  children,
  emptyMessage = 'No data available to display.',
  loading = false,
}) => {
  if (loading) {
    return <div className="flex items-center justify-center h-48 text-slate-500">Loading...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-lg border border-slate-200 text-slate-400">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
};
