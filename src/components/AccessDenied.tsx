
import React from 'react';

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-2xl border border-rose-100 shadow-sm">
      <h1 className="text-4xl font-bold text-rose-600 mb-4">Access Denied</h1>
      <p className="text-slate-600 mb-6">You do not have permission to view this page.</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold"
      >
        Go Back
      </button>
    </div>
  );
}
