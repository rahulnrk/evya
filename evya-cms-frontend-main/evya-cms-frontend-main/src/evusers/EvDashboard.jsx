import React, { useState } from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const connectors = [
  { id: 1, status: 'Available', slot: 'Slot A', type: 'CCS2', price: '₹20/kW', level: 'Level 1 (AC)', power: '60 kW' },
  { id: 2, status: 'In Use', slot: 'Slot A', type: 'CCS2', price: '₹20/kW', level: 'Level 1 (AC)', power: '60 kW' },
  { id: 3, status: 'Inactive', slot: 'Slot A', type: 'CCS2', price: '₹20/kW', level: 'Level 1 (AC)', power: '60 kW' },
  { id: 4, status: 'Available', slot: 'Slot A', type: 'CCS2', price: '₹20/kW', level: 'Level 1 (AC)', power: '60 kW' },
];

const amenities = [
  'Restrooms', 'Lounge', 'Wi-Fi', 'Shopping', 'Cafe', 'Mechanic'
];

export default function EvDashboard() {
  const [selectedTab, setSelectedTab] = useState('Connectors');
  const [selectedConnector, setSelectedConnector] = useState(null);
  const navigate=useNavigate();
  const [connect,setConnect]=useState(false);

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen p-4 font-sans">
      <h2 className="text-lg font-semibold mb-4">Station Details</h2>

      <img
        src="/public/images/logo.svg"
        alt="EV Station"
        className="rounded-xl mb-4 w-full h-40 object-cover"
      />

      <div>
        <h3 className="text-md font-bold">GoGreen EV Charging P...</h3>
        <p className="text-sm text-gray-600">
          Road Number 12, Indian Oil Petrol Pump Indira Nagar, Gachibowli, Hyderabad - 500033
        </p>
      </div>

      <div className="flex space-x-4 mt-4 border-b">
        <button
          className={`pb-2 ${selectedTab === 'Connectors' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}
          onClick={() => setSelectedTab('Connectors')}
        >
          Connectors
        </button>
        <button
          className={`pb-2 ${selectedTab === 'Information' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}
          onClick={() => setSelectedTab('Information')}
        >
          Information
        </button>
      </div>

      {selectedTab === 'Connectors' ? (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Select a Connector</h4>
          {connectors.map((conn) => (
            <div
              key={conn.id}
              className={`rounded-lg p-4 mb-2 ${conn.status === 'Available' ? 'bg-green-100 border-l-4 border-green-400' : conn.status === 'In Use' ? 'bg-yellow-100 border-l-4 border-yellow-400' : 'bg-gray-200 border-l-4 border-gray-400'} ${selectedConnector === conn.id ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => conn.status === 'Available' && setSelectedConnector(conn.id)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{conn.slot}</span>
                <span className={`text-xs ${conn.status === 'Available' ? 'text-green-600' : conn.status === 'In Use' ? 'text-yellow-600' : 'text-gray-500'}`}>{conn.status}</span>
              </div>
              <div className="text-sm text-gray-700 mt-2">{conn.type}</div>
              <div className="text-sm">{conn.price}</div>
              <div className="text-sm">{conn.level} - {conn.power}</div>
            </div>
          ))}
          {/* <div className="fixed bottom-0 left-0 w-full max-w-md mx-auto p-4 bg-white flex justify-around border-t"> */}
          <div>
        {selectedConnector === null ? (null
        ) : (
          <button className="px-6 py-2 bg-green-600 rounded text-white font-semibold w-full" onClick={()=>navigate("connecting")}>Connect</button>
        )}
      </div>
        </div>
      ) : (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Amenities</h4>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {amenities.map((amenity, index) => (
              <div key={index} className="flex flex-col items-center text-sm text-gray-600">
                <div className="w-10 h-10 bg-gray-200 rounded-full mb-1"></div>
                {amenity}
              </div>
            ))}
          </div>
          <h4 className="font-semibold mb-1">Contact Details</h4>
          <div className="text-sm text-gray-600">
            <div className="flex items-start mb-2">
              <MapPin className="w-4 h-4 mt-1 mr-2" />
              Road Number 12, Indian Oil Petrol Pump Indira Nagar, Gachibowli, Hyderabad - 500033
            </div>
            <img
              src="/map.png"
              alt="Map"
              className="rounded-xl mb-2 w-full h-32 object-cover"
            />
            <div className="flex items-center mb-1 text-green-600">
              <Phone className="w-4 h-4 mr-2" /> +91 9876 5432 10
            </div>
            <div className="flex items-center text-green-600">
              <Mail className="w-4 h-4 mr-2" /> gogreen_ev_charging@evya.com
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}
