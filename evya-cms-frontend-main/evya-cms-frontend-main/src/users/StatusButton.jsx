import React from 'react';

export default function StatusButton({ status }) {
  return (
    <button
      className={` ms-3 flex items-center px-5 py-1.5 border rounded-full transition ${
        status === 'Active'
          ? 'bg-green-100 text-green-800 border-green-400'
          : status === 'In Maintaince'
          ? 'bg-yellow-100 text-yellow-800 border-yellow-400'
          : status === 'In Active'
          ? 'bg-red-100 text-red-800 border-red-400'
          : 'bg-gray-100 text-gray-800 border-gray-400'
      }`}
      onClick={() => setDropdownOpen((prev) => !prev)}
    >
      {status}
    </button>
  );
}
