import { Button } from '@/components/ui/button';
import AxiosServices from '@/services/AxiosServices';
import BackButton from '@/users/BackButton';
import React, { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchSiteDetails } from '@/store/reducers/sites/sitesSlice';
import { validateStationName, validateOcppId, validateFirmwareVersion, validateVoltageRange } from '@/pages/validations/Validation';
import { useDispatch, useSelector } from 'react-redux';

const AddStationPage = () => {
  const [manufacturers, setManufacturers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [selectedsite, setSelectedsite] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isLoadingSites, setIsLoadingSites] = useState(true); //added for loaders
  const [isLoadingManufacturers, setIsLoadingManufacturers]= useState(true);
  const navigate = useNavigate();
  const [formErrors, setFormErrors] = useState({});
  const location = useLocation();
  const dispatch = useDispatch();

  const from =location.state?.from;
  const siteId = location.state?.siteId;
  const currentSite = useSelector(state => state.sites.currentSite);

  useEffect(() => {
  if (from === 'site' && siteId) {
    dispatch(fetchSiteDetails(siteId)).then(() => {
      setFormData(prev => ({
        ...prev,
        siteId: siteId
      }));
    });
  }
}, [from, siteId, dispatch]);

  const [formData, setFormData] = useState({
    stationName: '',
    OCPPId: '',
    serialNo: '',
    model: '',
    manufacturerId: '',
    firmware_version: '',
    ocppVersion: '',
    communication_method: '',
    stationStatus: 'Active',
    max_output_power_kW: 0,
    voltage_range: '',
    current_type: '',
    number_of_ports: 0,
    v2G_support: false,
    plug_and_charger: false,
    lastHeartBeat: new Date().toISOString().split('T')[0],
    siteId: '',
    chargerdetailsId: '',
    
    connectorId1: '',
    current_type1: '',

    connectorName1: '',
    connector_type1: '',
    power_type1: '',
    voltage_rating1: 0,
    current_rating1: 0,
    max_power_kW1: 0,
    billingUnits1: 'kWh',
    billingAmount1: 0,
    connectorDetailsID1: '',
    
    connectorId2: '',
    current_type2: '',
    connectorName2: '',
    connector_type2: '',
    power_type2: '',
    voltage_rating2: 0,
    current_rating2: 0,
    max_power_kW2: 0,
    billingUnits2: 'kWh',
    billingAmount2: 0,
    connectorDetailsID2: '',
    
    connectorId3: '',
    current_type3: '',
    connectorName3: '',
    connector_type3: '',
    power_type3: '',
    voltage_rating3: 0,
    current_rating3: 0,
    max_power_kW3: 0,
    billingUnits3: 'kWh',
    billingAmount3: 0,
    connectorDetailsID3: '',
  });

useEffect(() => {
  const errors = {};

  const stationNameError = validateStationName(formData.stationName);
  if (stationNameError) errors.stationName = stationNameError;

  const ocppIdError = validateOcppId(formData.OCPPId);
  if (ocppIdError) errors.OCPPId = ocppIdError;

  const firmware_versionError = validateFirmwareVersion(formData.firmware_version);
  if (firmware_versionError) errors.firmware_version = firmware_versionError;

  const voltage_rangeError = validateVoltageRange(formData.voltage_range);
  if (voltage_rangeError) errors.voltage_range = voltage_rangeError;

  setFormErrors(errors);
}, [formData]);

 const [touched, setTouched] = useState({
    stationName: false,
    OCPPId: false,
    serialNo: false,
    firmware_version: false,
    voltage_range: false
  });

const validateStationForm = (formData) => {
  const errors = {};
  
  // Validate required fields
  if (!formData.stationName.trim()) {
    errors.stationName = 'Station name is required';
  } else {
    const stationNameError = validateStationName(formData.stationName);
    if (stationNameError) errors.stationName = stationNameError;
  }

  if (!formData.OCPPId.trim()) {
    errors.OCPPId = 'OCPP ID is required';
  } else {
    const ocppIdError = validateOcppId(formData.OCPPId);
    if (ocppIdError) errors.OCPPId = ocppIdError;
  }
  if (!formData.serialNo.trim()) {
    errors.serialNo = 'Serial number is required';
  }
  if (!formData.siteId) {
    errors.siteId = 'Site selection is required';
  }
  if (!formData.manufacturerId) {
    errors.manufacturerId = 'Manufacturer selection is required';
  }
  if (!formData.chargerdetailsId) {
    errors.chargerdetailsId = 'Charger type selection is required';
  }
  if (formData.firmware_version && formData.firmware_version.trim()) {
    const firmware_versionError = validateFirmwareVersion(formData.firmware_version);
    if (firmware_versionError) errors.firmware_version = firmware_versionError;
  }

  if (formData.voltage_range && formData.voltage_range.trim()) {
    const voltage_rangeError = validateVoltageRange(formData.voltage_range);
    if (voltage_rangeError) errors.voltage_range = voltage_rangeError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

 useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setIsLoadingSites(true);
      setIsLoadingManufacturers(true);
      
      const [manufacturerData, siteData] = await Promise.all([
        AxiosServices.getManufacturers(),
        AxiosServices.getSites()
      ]);

      setManufacturers(manufacturerData);
      setSites(siteData);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsLoadingSites(false);
      setIsLoadingManufacturers(false);
    }
  };

  fetchData();
}, []);

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
    setTouched({
    stationName: true,
    OCPPId: true,
    serialNo: true,
    firmware_version: true,
    voltage_range: true,
    siteId: true,
    manufacturerId: true,
    chargerdetailsId: true
  });

  const { isValid, errors } = validateStationForm(formData);
  setFormErrors(errors);

  if (!isValid) {
    setIsSubmitting(false);
    toast({
      title: 'Validation Error',
      description: 'Please fix all errors before submitting',
      variant: 'destructive',
    });
    return;
  }

  try {
    console.log('Submitting station data:', formData);
    const response = await AxiosServices.addStation(formData);
    console.log('API Response:', response);    
    toast({
      title: 'Success',
      description: response.data?.message || 'Station added successfully',
      variant: 'default',
    });

    // Reset form after successful submission
    setFormData({
      stationName: '',
      OCPPId: '',
      serialNo: '',
      model: '',
      manufacturerId: '',
      firmware_version: '',
      ocppVersion: '',
      communication_method: '',
      stationStatus: 'Active',
      max_output_power_kW: 0,
      voltage_range: '',
      current_type: '',
      number_of_ports: 0,
      v2G_support: false,
      plug_and_charger: false,
      lastHeartBeat: new Date().toISOString().split('T')[0],
      siteId: '',
      chargerdetailsId: '',
    });

    setSelectedManufacturer(null);
    setSelectedsite(null);
    setSelectedStation(null);

 if (from === 'site' && siteId) {
  navigate(`/site/${siteId}`);
} else {
  navigate('/stations');
}
  } catch (err) {
  console.error('API Error:', err);

  let errorMessage = 'Failed to add station';
  if (err.response?.data) {
    errorMessage = err.response.data.message || JSON.stringify(err.response.data);
  } else if (err.message) {
    errorMessage = err.message;
  }
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  } finally {
    setIsSubmitting(false);
  }
}

const handleManufacturerChange = (e) => {
    const manufacturerId = parseInt(e.target.value);
    const manufacturer = manufacturers.find(m => m.id === manufacturerId);
    setSelectedManufacturer(manufacturer);
    setSelectedStation(null);
    
    setFormData({
      ...formData,
      manufacturerId: manufacturerId,
      chargerdetailsId: '',
      number_of_ports: 0,
      current_type: '',
      connectorId1: '',
      connectorId2: '',
      connectorId3: '',
      current_type1: '',
      current_type2: '',
      current_type3: '',
    });
  };
 const handlesiteChange = (e) => {
    const siteId = parseInt(e.target.value);
    const site = sites.find(m => m.id === siteId);
    setSelectedsite(site);
    
    setFormData({
      ...formData,
      siteId: siteId,
    });
  };

  const handleStationChange = (e) => {
    const stationId = parseInt(e.target.value);
    const station = selectedManufacturer.chargingStation.find(s => s.id === stationId);
    setSelectedStation(station);
    
    const numPorts = station.chargingPort.length;
    const currentType = station.currentType || (station.chargingPort.some(port => 

    port.connectorType.includes('DC') || 
    ['CCS1', 'CCS2', 'CHAdeMO'].includes(port.connectorType)
    ) ? 'DC' : '');
    
    const updatedFormData = {
      ...formData,
      chargerdetailsId: stationId,
      model: station.chargerType,
      max_output_power_kW: station.totalCapacityKW,
      number_of_ports: numPorts,
      current_type:currentType,
    };
    
    station.chargingPort.forEach((port, index) => {
      const portNum = index + 1;
      if (portNum <= 3) { // We only support up to 3 ports as per requirements
        updatedFormData[`connectorId${portNum}`] = port.id;
        updatedFormData[`connectorName${portNum}`] = port.portDisplayName;
        updatedFormData[`connector_type${portNum}`] = port.connectorType;
        updatedFormData[`voltage_rating${portNum}`] = port.maxOutputVoltageV;
        updatedFormData[`current_rating${portNum}`] = port.outputCurrentA;
        updatedFormData[`max_power_kW${portNum}`] = port.portCapacityKW;
        updatedFormData[`connectorDetailsID${portNum}`] = port.id;
        updatedFormData[`current_type${portNum}`] =currentType;
        updatedFormData[`power_type${portNum}`] = currentType;
        
        // Set power type based on connector type (this is an assumption, adjust as needed)
        if (port.connectorType.includes('DC') || port.connectorType === 'CCS1' || 
            port.connectorType === 'CCS2' || port.connectorType === 'CHAdeMO') {
          updatedFormData[`power_type${portNum}`] = 'DC';
        } else {
          updatedFormData[`power_type${portNum}`] = 'AC';
        }
      }
    });
    
    setFormData(updatedFormData);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
       <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Add New Charging Station</h1>
       <div className="flex gap-2">
                 <BackButton  />
               </div>
             </div>
      <form onSubmit={handleSubmit} className="space-y-6">
      {/* site Selection */}
          <div className="mb-4">
  <label className="block text-gray-700 text-sm font-bold mb-2">Site Name</label>

  {from === 'site' && currentSite ? (
    <input
      type="text"
      value={currentSite.siteName}
      disabled
      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
    />
  ) : (
    <select
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      onChange={handlesiteChange}
      value={formData.siteId || ''}
      required
      disabled={isLoadingSites}
    >
      <option value="">{isLoadingSites ? 'Loading sites...' : 'Select Site'}</option>
      {!isLoadingSites &&
        sites.map(site => (
          <option key={site.id} value={site.id}>
            {site.siteName || 'Unnamed Site'}
          </option>
        ))}
    </select>
  )}
  </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Manufacturer
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleManufacturerChange}
            value={formData.manufacturerId || ''}
            required
            disabled={isLoadingManufacturers}
          >
            <option value="">{isLoadingManufacturers?'Loading Manufacturers...':'Select Manufacturer'}</option>
            {!isLoadingManufacturers && manufacturers.map(manufacturer => (
              <option key={manufacturer.id} value={manufacturer.id}>
                {manufacturer.manufacturerName || 'Unnamed Manufacturer'}
              </option>
            ))}
          </select>
        </div>
        
        {/* Charger Station Selection - Only show if manufacturer is selected */}
        {selectedManufacturer && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Charger Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={handleStationChange}
              value={formData.chargerdetailsId || ''}
              required
            >
              <option value="">Select Charger Type</option>
              {selectedManufacturer.chargingStation.map(station => (
                <option key={station.id} value={station.id}>
                    {station.chargerType} ({station.totalCapacityKW} KW)  
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Only show the rest of the form if a station is selected */}
        {selectedStation && (
          <>
            {/* Station Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Station Name
                </label>
                <input
                  type="text"
                  name="stationName"
                  value={formData.stationName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {formErrors.stationName && (  <p className="text-xs text-red-500 mt-1">{formErrors.stationName}</p>)}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  OCPP ID
                </label>
                <input
                  type="text"
                  name="OCPPId"
                  value={formData.OCPPId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {formErrors.OCPPId && (  <p className="text-xs text-red-500 mt-1">{formErrors.OCPPId}</p>)}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  name="serialNo"
                  value={formData.serialNo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {formErrors.serialNo && (  <p className="text-xs text-red-500 mt-1">{formErrors.serialNo}</p>)}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Firmware Version
                </label>
                <input
                  type="text"
                  name="firmware_version"
                  value={formData.firmware_version}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formErrors.firmware_version && (  <p className="text-xs text-red-500 mt-1">{formErrors.firmware_version}</p>)}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  OCPP Version
                </label>
                <select
                  name="ocppVersion"
                  value={formData.ocppVersion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select OCPP Version</option>
                  <option value="1.6">1.6</option>
                  <option value="2.0">2.0</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Communication Method
                </label>
                <select
                  name="communication_method"
                  value={formData.communication_method}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Communication Method</option>
                  <option value="GPRS">GPRS</option>
                  <option value="Ethernet">Ethernet</option>
                  <option value="WiFi">WiFi</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Station Status
                </label>
                <select
                  name="stationStatus"
                  value={formData.stationStatus}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Max Output Power (kW)
                </label>
                <input
                  type="number"
                  name="max_output_power_kW"
                  value={formData.max_output_power_kW}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Voltage Range
                </label>
                <input
                  type="text"
                  name="voltage_range"
                  value={formData.voltage_range}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formErrors.voltage_range && (  <p className="text-xs text-red-500 mt-1">{formErrors.voltage_range}</p>)}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Current Type
                </label>
               <input
                type="text"
                name="current_type"
                value={formData.current_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
              />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Number of Ports
                </label>
                <input
                  type="number"
                  name="number_of_ports"
                  value={formData.number_of_ports}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="3"
                  readOnly
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="v2G_support"
                    checked={formData.v2G_support}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    V2G Support
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="plug_and_charger"
                    checked={formData.plug_and_charger}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Plug and Charge
                  </label>
                </div>
              </div>
              
              <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Site ID
                  </label>
                  <input
                    type="text"
                    value={from === 'site' && currentSite ? currentSite.siteId : formData.siteId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    readOnly
                  />
                  <input 
                    type="hidden" 
                    name="siteId" 
                    value={from === 'site' && currentSite ? currentSite.siteId : formData.siteId} 
                  />
                </div>
            </div>
            
            {/* Port Details - Only show for the number of ports in the selected station */}
            {formData.number_of_ports > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Port Details</h2>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold mb-3">Port 1</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Connector Name
                      </label>
                      <input
                        type="text"
                        name="connectorName1"
                        value={formData.connectorName1}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Connector Type
                      </label>
                      <input
                        type="text"
                        name="connector_type1"
                        value={formData.connector_type1}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Power Type
                      </label>
                      <input
                        type="text"
                        name="power_type1"
                        value={formData.power_type1}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Voltage Rating (V)
                      </label>
                      <input
                        type="number"
                        name="voltage_rating1"
                        value={formData.voltage_rating1}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Current Rating (A)
                      </label>
                      <input
                        type="number"
                        name="current_rating1"
                        value={formData.current_rating1}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Max Power (kW)
                      </label>
                      <input
                        type="number"
                        name="max_power_kW1"
                        value={formData.max_power_kW1}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Billing Units
                      </label>
                      <select
                        name="billingUnits1"
                        value={formData.billingUnits1}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="kWh">kWh</option>
                        <option value="min">Minutes</option>
                        <option value="session">Per Session</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Billing Amount
                      </label>
                      <input
                        type="number"
                        name="billingAmount1"
                        value={formData.billingAmount1}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                {formData.number_of_ports >= 2 && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-semibold mb-3">Port 2</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Connector Name
                        </label>
                        <input
                          type="text"
                          name="connectorName2"
                          value={formData.connectorName2}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Connector Type
                        </label>
                        <input
                          type="text"
                          name="connector_type2"
                          value={formData.connector_type2}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Power Type
                        </label>
                        <input
                          type="text"
                          name="power_type2"
                          value={formData.power_type2}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Voltage Rating (V)
                        </label>
                        <input
                          type="number"
                          name="voltage_rating2"
                          value={formData.voltage_rating2}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Current Rating (A)
                        </label>
                        <input
                          type="number"
                          name="current_rating2"
                          value={formData.current_rating2}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Max Power (kW)
                        </label>
                        <input
                          type="number"
                          name="max_power_kW2"
                          value={formData.max_power_kW2}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Billing Units
                        </label>
                        <select
                          name="billingUnits2"
                          value={formData.billingUnits2}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="kWh">kWh</option>
                          <option value="min">Minutes</option>
                          <option value="session">Per Session</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Billing Amount
                        </label>
                        <input
                          type="number"
                          name="billingAmount2"
                          value={formData.billingAmount2}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Port 3 - Only show if station has 3 ports */}
                {formData.number_of_ports >= 3 && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-semibold mb-3">Port 3</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Connector Name
                        </label>
                        <input
                          type="text"
                          name="connectorName3"
                          value={formData.connectorName3}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Connector Type
                        </label>
                        <input
                          type="text"
                          name="connector_type3"
                          value={formData.connector_type3}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Power Type
                        </label>
                        <input
                          type="text"
                          name="power_type3"
                          value={formData.power_type3}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Voltage Rating (V)
                        </label>
                        <input
                          type="number"
                          name="voltage_rating3"
                          value={formData.voltage_rating3}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Current Rating (A)
                        </label>
                        <input
                          type="number"
                          name="current_rating3"
                          value={formData.current_rating3}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Max Power (kW)
                        </label>
                        <input
                          type="number"
                          name="max_power_kW3"
                          value={formData.max_power_kW3}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Billing Units
                        </label>
                        <select
                          name="billingUnits3"
                          value={formData.billingUnits3}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="kWh">kWh</option>
                          <option value="min">Minutes</option>
                          <option value="session">Per Session</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Billing Amount
                        </label>
                        <input
                          type="number"
                          name="billingAmount3"
                          value={formData.billingAmount3}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                     </div>
                    </div>
                    )}
                   </div>
                    )}
                   <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button" 
                        variant="outline" 
                        onClick= {() => {
                          if (from === 'site' && siteId) {
                            navigate(`/site/${siteId}`);
                          } else {
                            navigate('/stations');
                          }
                        }}>
                        Cancel
                      </Button>
                     <Button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2  text-white font-medium rounded-md  focus:outline-none focus:ring-2  focus:ring-offset-2 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Adding...' : 'Add Station'}
          </Button>
        </div>
          </>
        )}
      </form>
    </div>
  );
};

export default AddStationPage;