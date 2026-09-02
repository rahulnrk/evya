
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRupeeSign, FaBolt, FaPercentage } from 'react-icons/fa';

export default function EvPayment() {
  const [price, setPrice] = useState(35);
  const [inputValue, setInputValue] = useState('');
  const [selectedType, setSelectedType] = useState('price');
  const navigate = useNavigate();

  const unitRate = 3;
  const fullChargePrice = 200;

  const calculatePrice = (value, type) => {
    if (type === 'price') return parseFloat(value);
    if (type === 'units') return value * unitRate;
    if (type === 'percentage') return (value / 100) * fullChargePrice;
    return 0;
  };

  const handleInputChange = (e) => {
    const val = parseFloat(e.target.value);
    setInputValue(e.target.value);
    setPrice(!isNaN(val) ? calculatePrice(val, selectedType) : 0);
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setInputValue('');
    setPrice(0);
  };

  const getPlaceholder = () => {
    switch (selectedType) {
      case 'price': return 'Enter ₹ amount';
      case 'units': return 'Enter number of units';
      case 'percentage': return 'Enter battery percentage';
      default: return '';
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 p-6 rounded-xl shadow-md font-sans">
      <h2 className="text-2xl font-bold text-center mb-6 text-green-700">💸 EV Charging Check-In</h2>

      {/* Toggle Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { key: 'price', label: 'By Price', icon: <FaRupeeSign /> },
          { key: 'units', label: 'By Units', icon: <FaBolt /> },
          { key: 'percentage', label: 'By %', icon: <FaPercentage /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => handleTypeChange(key)}
            className={`flex flex-col items-center py-3 px-2 border rounded-lg transition ${
              selectedType === key
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
            }`}
          >
            <div className="text-lg">{icon}</div>
            <span className="text-sm font-medium mt-1">{label}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="relative mb-4">
        <input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          className="w-full border border-gray-300 pl-4 pr-4 py-3 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
          placeholder={getPlaceholder()}
        />
        <p className="text-center text-2xl font-bold mt-3 text-green-700">₹{price.toFixed(2)}</p>
      </div>

      {/* Alerts */}
      <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-md mb-6 text-sm shadow-sm">
        <p>🔌 Please connect the charging gun properly before proceeding.</p>
        <p>💰 A minimum of ₹50 is required  to start charging.</p>
      </div>

      {/* Cost Display */}
      <div className="bg-white border border-gray-200 p-4 rounded-md shadow-sm mb-6">
        <div className="flex justify-between text-gray-700 font-medium text-sm">
          <span>Total Charging Cost</span>
          <span className="text-lg font-bold text-black">₹{price.toFixed(2)}</span>
        </div>
        <div className="text-xs text-green-600 underline mt-2 text-right cursor-pointer">
          View cost breakup
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex justify-between items-center">
        <div>
          {/* Wallet UI can go here if needed */}
        </div>
        <button
          onClick={() => navigate('/evdashboard/connecting/evpayments/chargingstatus')}
          disabled={price < 50}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-semibold transition duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Pay & Charge
        </button>
      </div>
    </div>
  );
}
