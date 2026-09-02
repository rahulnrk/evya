import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { fetchManufacturerById } from '@/store/reducers/manufacturer/manufacturerSlice';
import BackButton from '@/users/BackButton';
import Loading from '@/users/Loading';

const ManufacturerDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {selectedManufacturer, loading, error } = useSelector((state) => state.manufacturer);
  console.log(selectedManufacturer);
  useEffect(() => {
    if (id) {
      dispatch(fetchManufacturerById(id));
    }
  }, [dispatch, id]);

  // In ManufacturerDetails.jsx, add this useEffect
useEffect(() => {
  const handleAddChargerFromCopilot = () => {
    console.log('🎯 Adding charger from Copilot for manufacturer:', id);
    navigate(`/addcharger/${id}`);
  };

  window.addEventListener('openAddChargerDialog', handleAddChargerFromCopilot);
  
  return () => {
    window.removeEventListener('openAddChargerDialog', handleAddChargerFromCopilot);
  };
}, [id, navigate]);

  if (error) return <div>Error: {error}</div>;
if (loading) {
  return (
    <div className="flex justify-center items-center h-64">
      <Loading />
    </div>
  );
}

if (!selectedManufacturer) {
  return <div>No manufacturer found</div>;
}

  const calculateTotalPorts = () => {
    let totalPorts = 0;
    selectedManufacturer.chargingStation?.forEach(station => {
      totalPorts += station.chargingPort?.length || 0;
    });
    return totalPorts;
  };

  return (
    <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{selectedManufacturer.manufacturerName}</h1>
        <div>
          <BackButton to={"Manufacturers"}/>
          </div>
        </div>
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-gray-600">Country</h3>
            <p>{selectedManufacturer.country}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-600">Contact Info</h3>
            <p>{selectedManufacturer.contactInfo}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-600">Mobile Number</h3>
            <p>{selectedManufacturer.mobileNumber}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-600">Total Ports</h3>
            <p>{calculateTotalPorts()}</p>
          </div>
        </div>
      </Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold mb-4">Charging Stations ({selectedManufacturer.chargingStation?.length || 0})</h2>
        <div>
         <Button onClick={()=>navigate(`/addcharger/${id}`) }>Add Charger</Button> 
          </div></div>
        {selectedManufacturer.chargingStation?.map((station) => (
        <Card key={station.id} className="p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {station.chargerType}
            </h3>
            <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              Total Capacity: {station.totalCapacityKW} kW
            </div>
          </div>          
          <h4 className="font-medium mb-3">Charging Ports ({station.chargingPort?.length || 0})</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Connector Type</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Capacity (kW)</TableHead>
                <TableHead>Max Input Voltage (V)</TableHead>
                <TableHead>Max Output Voltage (V)</TableHead>
                <TableHead>Output Current (A)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {station.chargingPort?.map((port) => (
                <TableRow key={port.id}>
                  <TableCell>{port.connectorType}</TableCell>
                  <TableCell>{port.portDisplayName}</TableCell>
                  <TableCell>{port.portCapacityKW}</TableCell>
                  <TableCell>{port.maxInputVoltageV}</TableCell>
                  <TableCell>{port.maxOutputVoltageV}</TableCell>
                  <TableCell>{port.outputCurrentA}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ))}
    </div>
  );
};
export default ManufacturerDetails;