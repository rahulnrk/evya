import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDispatch, useSelector } from 'react-redux';
import { PlusCircle, Trash2 } from 'lucide-react';
import { fetchManufacturerById, updateManufacturer } from '@/store/reducers/manufacturer/manufacturerSlice';
import BackButton from '@/users/BackButton';
import { validateChargerType, validateTotalCapacity, validateCurrentType, validateConnectorType, validatePortCapacity, validatePortDisplayName } from '@/pages/validations/Validation';

export function AddCharger({ onSuccess }) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const navigate=useNavigate();
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [manufacturerData, setManufacturerData] = useState({
    manufacturerName: '',
    country: '',
    contactInfo: '',
    chargers: [{
      chargerType: '',
      totalCapacityKW: '',
      currentType: '',
      ports: [{
        connectorType: '',
        portCapacityKW: '',
        maxInputVoltageV: '',
        maxOutputVoltageV: '',
        outputCurrentA: '',
        portDisplayName: ''
      }]
    }]
  });

  const { loading: reduxLoading, error, selectedManufacturer } = useSelector((state) => state.manufacturer);
  const isLoading = isSubmitting || reduxLoading;

  useEffect(() => {
    if (id) {
      dispatch(fetchManufacturerById(id));
    }
  }, [dispatch, id]);
  useEffect(() => {
  if (selectedManufacturer) {
    setManufacturerData({
      manufacturerName: selectedManufacturer.manufacturerName || '',
      country: selectedManufacturer.country || '',
      contactInfo: selectedManufacturer.contactInfo || '',
      chargers: [{
        chargerType: '',
        totalCapacityKW: '',
        currentType: '',
        ports: [{
          connectorType: '',
          portCapacityKW: '',
          maxInputVoltageV: '',
          maxOutputVoltageV: '',
          outputCurrentA: '',
          portDisplayName: ''
        }]
      }]
    });
  }
}, [selectedManufacturer]);



useEffect(() => {
  const handleOpenAddCharger = () => {
    console.log('🎯 Navigating to Add Charger page from Copilot');
    // Already on the page if the route matches
    // No need to do anything extra
  };

  window.addEventListener('openAddChargerDialog', handleOpenAddCharger);
  
  return () => {
    window.removeEventListener('openAddChargerDialog', handleOpenAddCharger);
  };
}, []);


// In AddCharger.jsx, add this after the useState declarations
useEffect(() => {
  if (!id) {
    toast({
      title: "Error",
      description: "No manufacturer selected. Please go to a manufacturer details page first.",
      variant: "destructive",
    });
    navigate('/manufacturers');
  }
}, [id, navigate, toast]);

  const handleChange = (e) => {
    setManufacturerData({
      ...manufacturerData,
      [e.target.name]: e.target.value
    });
  };

  const handleChargerChange = (chargerIndex, field, value) => {
    const updatedChargers = [...manufacturerData.chargers];
    updatedChargers[chargerIndex][field] = value;
    setManufacturerData({
      ...manufacturerData,
      chargers: updatedChargers
    });
  };

  const handlePortChange = (chargerIndex, portIndex, field, value) => {
    const updatedChargers = [...manufacturerData.chargers];
    updatedChargers[chargerIndex].ports[portIndex][field] = value;
    setManufacturerData({
      ...manufacturerData,
      chargers: updatedChargers
    });
  };

  const handleAddPort = (chargerIndex) => {
    const updatedChargers = [...manufacturerData.chargers];
    updatedChargers[chargerIndex].ports.push({
      connectorType: '',
      portCapacityKW: '',
      maxInputVoltageV: '',
      maxOutputVoltageV: '',
      outputCurrentA: '',
      portDisplayName: ''
    });
    setManufacturerData({
      ...manufacturerData,
      chargers: updatedChargers
    });
  };

  const handleRemovePort = (chargerIndex, portIndex) => {
    const updatedChargers = [...manufacturerData.chargers];
    updatedChargers[chargerIndex].ports = updatedChargers[chargerIndex].ports.filter((_, index) => index !== portIndex);
    setManufacturerData({
      ...manufacturerData,
      chargers: updatedChargers
    });
  };

  const handleAddCharger = () => {
    setManufacturerData({
      ...manufacturerData,
      chargers: [
        ...manufacturerData.chargers,
        {
          chargerType: '',
          totalCapacityKW: '',
          currentType: '',
          ports: [{
            connectorType: '',
            portCapacityKW: '',
            maxInputVoltageV: '',
            maxOutputVoltageV: '',
            outputCurrentA: '',
            portDisplayName: ''
          }]
        }
      ]
    });
  };

  const handleRemoveCharger = (chargerIndex) => {
    const updatedChargers = manufacturerData.chargers.filter((_, index) => index !== chargerIndex);
    setManufacturerData({
      ...manufacturerData,
      chargers: updatedChargers
    });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { chargers: [] };

    manufacturerData.chargers.forEach((charger, chargerIndex) => {
      const chargerErrors = {
        chargerType: validateChargerType(charger.chargerType),
        totalCapacityKW: validateTotalCapacity(charger.totalCapacityKW),
        currentType: validateCurrentType(charger.currentType),
        ports: []
      };

      charger.ports.forEach((port, portIndex) => {
        chargerErrors.ports[portIndex] = {
          connectorType: validateConnectorType(port.connectorType),
          portCapacityKW: validatePortCapacity(port.portCapacityKW),
          portDisplayName: validatePortDisplayName(port.portDisplayName)
        };
      });

      if (chargerErrors.chargerType || chargerErrors.totalCapacityKW || chargerErrors.currentType || 
          chargerErrors.ports.some(port => Object.values(port).some(Boolean))) {
        isValid = false;
      }

      newErrors.chargers[chargerIndex] = chargerErrors;
    });

    setFormErrors(newErrors);
    return isValid;
  };
const handleSubmit = async () => {
  setIsSubmitting(true);
  
  if (!validateForm()) {
    toast({
      title: "Validation Error",
      description: "Please fix all errors before submitting",
      variant: "destructive",
    });
    setIsSubmitting(false);
    return;
  }

  // Filter out empty chargers (the ones user hasn't filled)
  const newChargers = manufacturerData.chargers.filter(charger => 
    charger.chargerType && charger.totalCapacityKW && charger.currentType
  ).map(charger => ({
    chargerType: charger.chargerType,
    totalCapacityKW: parseFloat(charger.totalCapacityKW),
    currentType: charger.currentType,
    ports: charger.ports.map(port => ({
      connectorType: port.connectorType,
      portCapacityKW: parseFloat(port.portCapacityKW),
      maxInputVoltageV: parseFloat(port.maxInputVoltageV) || 0,
      maxOutputVoltageV: parseFloat(port.maxOutputVoltageV) || 0,
      outputCurrentA: parseFloat(port.outputCurrentA) || 0,
      portDisplayName: port.portDisplayName
    }))
  }));

  // Send the complete manufacturer data with existing fields + new chargers
  const formattedData = {
    manufacturerId: id,
    manufacturerName: selectedManufacturer.manufacturerName,
    country: selectedManufacturer.country,
    contactInfo: selectedManufacturer.contactInfo,
    mobileNumber: selectedManufacturer.mobileNumber, // Make sure this is included
    chargers: newChargers
  };

  try {
    const response = await dispatch(updateManufacturer({ formattedData, id })).unwrap();
    if (response) {
      toast({
        title: 'Success',
        description: 'Charger added successfully',
      });
      
      // Refetch the manufacturer to get updated data
      await dispatch(fetchManufacturerById(id));
      
      // Reset only the chargers part, keep manufacturer data intact
      setManufacturerData(prev => ({
        ...prev,
        chargers: [{
          chargerType: '',
          totalCapacityKW: '',
          currentType: '',
          ports: [{
            connectorType: '',
            portCapacityKW: '',
            maxInputVoltageV: '',
            maxOutputVoltageV: '',
            outputCurrentA: '',
            portDisplayName: ''
          }]
        }]
      }));

      if (onSuccess) onSuccess();
      navigate(`/manufacturers/${id}`);
    }
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to add charger: ' + (error.message || 'Unknown error'),
      variant: 'destructive',
    });
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{manufacturerData.manufacturerName}</h1>
        <div>
          <BackButton to={"Manufacturers"}/>
        </div>
      </div>      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="manufacturerName">Manufacturer Name</Label>
          <Input
            id="manufacturerName"
            name="manufacturerName"
            value={manufacturerData.manufacturerName}
            onChange={handleChange}
            placeholder="Enter manufacturer name"
            readOnly
          />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            value={manufacturerData.country}
            onChange={handleChange}
            placeholder="Enter country"
            readOnly
          />
        </div>
        <div>
          <Label htmlFor="contactInfo">Contact Info (Email)</Label>
          <Input
            id="contactInfo"
            name="contactInfo"
            value={manufacturerData.contactInfo}
            onChange={handleChange}
            placeholder="Enter contact email"
            readOnly
          />
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Charging Stations</h3>
          <Button type="button" variant="outline" onClick={handleAddCharger}>
            <PlusCircle className="h-4 w-4 mr-2" /> Add Charger
          </Button>
        </div>
        {manufacturerData.chargers.map((charger, chargerIndex) => (
          <div key={chargerIndex} className="space-y-4 p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">New Charger</h4>
              {manufacturerData.chargers.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCharger(chargerIndex)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Charger Type</Label>
                <Input
                  value={charger.chargerType}
                  onChange={(e) => handleChargerChange(chargerIndex, 'chargerType', e.target.value)}
                />
                {validateChargerType(charger.chargerType) && (
                  <p className="text-xs text-red-500 mt-1">{validateChargerType(charger.chargerType)}</p>
                )}
              </div>
              <div>
                <Label>Total Capacity (kW)</Label>
                <Input
                  type="number"
                  value={charger.totalCapacityKW}
                  onChange={(e) => handleChargerChange(chargerIndex, 'totalCapacityKW', e.target.value)}
                />
                {validateTotalCapacity(charger.totalCapacityKW) && (
                  <p className="text-xs text-red-500 mt-1">{validateTotalCapacity(charger.totalCapacityKW)}</p>
                )}
              </div>
            </div>
            <div>
              <Label>Current Type</Label>
              <Input
                type="text"
                value={charger.currentType}
                onChange={(e) => handleChargerChange(chargerIndex, 'currentType', e.target.value)}
              />
              {validateCurrentType(charger.currentType) && (
                <p className="text-xs text-red-500 mt-1">{validateCurrentType(charger.currentType)}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Ports</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPort(chargerIndex)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Port
                </Button>
              </div>
              {charger.ports.map((port, portIndex) => (
                <div key={portIndex} className="p-3 border rounded-md space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="font-medium">Port {portIndex + 1}</h5>
                    {charger.ports.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePort(chargerIndex, portIndex)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Connector Type</Label>
                      <Input
                        type="text"
                        value={port.connectorType}
                        onChange={(e) => handlePortChange(chargerIndex, portIndex, 'connectorType', e.target.value)}
                      />
                      {validateConnectorType(port.connectorType) && (
                        <p className="text-xs text-red-500 mt-1">{validateConnectorType(port.connectorType)}</p>
                      )}
                    </div>
                    <div>
                      <Label>Port Capacity (kW)</Label>
                      <Input
                        type="number"
                        value={port.portCapacityKW}
                        onChange={(e) => handlePortChange(chargerIndex, portIndex, 'portCapacityKW', e.target.value)}
                        placeholder="Enter capacity"
                      />
                      {validatePortCapacity(port.portCapacityKW) && (
                        <p className="text-xs text-red-500 mt-1">{validatePortCapacity(port.portCapacityKW)}</p>
                      )}
                    </div>
                    <div>
                      <Label>Port Display Name</Label>
                      <Input
                        type="text"
                        value={port.portDisplayName}
                        onChange={(e) => handlePortChange(chargerIndex, portIndex, 'portDisplayName', e.target.value)}
                        placeholder="Enter port display name"
                      />
                      {validatePortDisplayName(port.portDisplayName) && (
                        <p className="text-xs text-red-500 mt-1">{validatePortDisplayName(port.portDisplayName)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button 
          type="button" 
          onClick={handleSubmit} 
          disabled={isLoading}
        >
          {isLoading ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}
AddCharger.propTypes = {
  onSuccess: PropTypes.func,
};