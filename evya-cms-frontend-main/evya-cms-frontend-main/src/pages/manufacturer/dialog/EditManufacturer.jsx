import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDispatch } from 'react-redux';
import { updateManufacturer } from '@/store/reducers/manufacturer/manufacturerSlice';

export function EditManufacturer({ manufacturer, open, onOpenChange, onSuccess }) {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [chargers, setChargers] = useState([
    {
      modelName: '',
      type: 'AC',
      ports: [{
        capacity: '',
        portNumber: 1,
        standard: '',
        maxOutputVoltage: '',
        maxAmperes: ''
      }]
    }
  ]);

  useEffect(() => {
    if (manufacturer) {
      setName(manufacturer.name);
      if (manufacturer.chargingStation) {
        setChargers(manufacturer.chargingStation.map(station => ({
          modelName: station.modelName,
          type: station.type,
          ports: station.chargingPort.map(port => ({
            capacity: port.capacity,
            portNumber: port.portNumber,
            standard: port.standard,
            maxOutputVoltage: port.maxOutputVoltage,
            maxAmperes: port.maxAmperes
          }))
        })));
      }
    }
  }, [manufacturer]);

  const handleAddPort = (chargerIndex) => {
    const updatedChargers = [...chargers];
    const newPortNumber = updatedChargers[chargerIndex].ports.length + 1;
    updatedChargers[chargerIndex].ports.push({
      capacity: '',
      portNumber: newPortNumber,
      standard: '',
      maxOutputVoltage: '',
      maxAmperes: ''
    });
    setChargers(updatedChargers);
  };

  const handleAddCharger = () => {
    setChargers([...chargers, {
      modelName: '',
      type: 'AC',
      ports: [{
        capacity: '',
        portNumber: 1,
        standard: '',
        maxOutputVoltage: '',
        maxAmperes: ''
      }]
    }]);
  };

  const handleChargerChange = (index, field, value) => {
    const updatedChargers = [...chargers];
    updatedChargers[index][field] = value;
    setChargers(updatedChargers);
  };

  const handlePortChange = (chargerIndex, portIndex, field, value) => {
    const updatedChargers = [...chargers];
    updatedChargers[chargerIndex].ports[portIndex][field] = value;
    setChargers(updatedChargers);
  };

  const handleSubmit = async () => {
    const manufacturerData = {
      id: manufacturer.id,
      name,
      chargingStation: chargers.map(charger => ({
        modelName: charger.modelName,
        type: charger.type,
        chargingPort: charger.ports.map(port => ({
          capacity: parseFloat(port.capacity),
          portNumber: port.portNumber,
          standard: port.standard,
          maxOutputVoltage: parseFloat(port.maxOutputVoltage),
          maxAmperes: parseFloat(port.maxAmperes)
        }))
      }))
    };
    try {
      await dispatch(updateManufacturer(manufacturerData)).unwrap();
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Manufacturer updated successfully",
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update manufacturer: " + error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Manufacturer</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Manufacturer Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter manufacturer name"
            />
          </div>
          {chargers.map((charger, chargerIndex) => (
            <div key={chargerIndex} className="space-y-4 p-4 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Model Name</Label>
                  <Input
                    value={charger.modelName}
                    onChange={(e) => handleChargerChange(chargerIndex, 'modelName', e.target.value)}
                    placeholder="Enter model name"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={charger.type}
                    onValueChange={(value) => handleChargerChange(chargerIndex, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AC">AC</SelectItem>
                      <SelectItem value="DC">DC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Ports</Label>
                {charger.ports.map((port, portIndex) => (
                  <div key={portIndex} className="space-y-4 border-b pb-4">
                    <div className="w-20 mb-2">
                      <Label>Port {port.portNumber}</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Capacity (kW)</Label>
                        <Input
                          type="number"
                          value={port.capacity}
                          onChange={(e) => handlePortChange(chargerIndex, portIndex, 'capacity', e.target.value)}
                          placeholder="Enter capacity"
                        />
                      </div>
                      <div>
                        <Label>Standard</Label>
                        <Select
                          value={port.standard}
                          onValueChange={(value) => handlePortChange(chargerIndex, portIndex, 'standard', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select standard" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CCS1">CCS1</SelectItem>
                            <SelectItem value="CCS2">CCS2</SelectItem>
                            <SelectItem value="CHAdeMO">CHAdeMO</SelectItem>
                            <SelectItem value="Type1">Type1</SelectItem>
                            <SelectItem value="Type2">Type2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Max Output Voltage</Label>
                        <Input
                          type="number"
                          value={port.maxOutputVoltage}
                          onChange={(e) => handlePortChange(chargerIndex, portIndex, 'maxOutputVoltage', e.target.value)}
                          placeholder="Enter max voltage"
                        />
                      </div>
                      <div>
                        <Label>Max Amperes</Label>
                        <Input
                          type="number"
                          value={port.maxAmperes}
                          onChange={(e) => handlePortChange(chargerIndex, portIndex, 'maxAmperes', e.target.value)}
                          placeholder="Enter max amperes"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddPort(chargerIndex)}
                >
                  Add Port
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCharger}
            className="w-full"
          > Add Another Charger
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="w-full"
          > Update
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
EditManufacturer.propTypes = {
  manufacturer: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    chargingStation: PropTypes.arrayOf(PropTypes.shape({
      modelName: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      chargingPort: PropTypes.arrayOf(PropTypes.shape({
        capacity: PropTypes.number.isRequired,
        portNumber: PropTypes.number.isRequired,
        standard: PropTypes.string.isRequired,
        maxOutputVoltage: PropTypes.number.isRequired,
        maxAmperes: PropTypes.number.isRequired
      })).isRequired
    }))
  }),
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onSuccess: PropTypes.func
};
EditManufacturer.defaultProps = {
  onSuccess: () => {}
};