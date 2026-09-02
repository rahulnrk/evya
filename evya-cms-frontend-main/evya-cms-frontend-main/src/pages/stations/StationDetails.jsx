import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStationDetails } from '@/store/reducers/stations/stationsSlice';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AxiosServices from '@/services/AxiosServices';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from 'lucide-react';
import Loading from '@/users/Loading';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { StarFilledIcon, StarIcon, EyeNoneIcon, BarChartIcon } from "@radix-ui/react-icons";
import { updatePortPrice } from '@/services/AxiosServices';
import OCPPControl from './OCPPControl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from "@/components/ui/dialog";
import { FileText, Download, RefreshCw } from "lucide-react";
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCodeIcon } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {Pencil, 
  Zap,
  Settings
} from 'lucide-react';
export default function StationDetails() {
  const dispatch = useDispatch();
  const { id } = useParams();
  const navigate = useNavigate(); 
  const { currentStation, status, error } = useSelector((state) => state.stations);
  console.log(currentStation);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stationStatus, setStationStatus] = useState('INACTIVE');
  const [billingAmounts, setBillingAmounts] = useState({});
  const [editingPortId, setEditingPortId] = useState(null);  
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  // Add these states near your other useState declarations
const [ocppDialogOpen, setOcppDialogOpen] = useState(false);
const [selectedPort, setSelectedPort] = useState(null);
const [selectedCommand, setSelectedCommand] = useState('');
const [expandedPortId, setExpandedPortId] = useState(null);
// Add these with your other useState declarations
const [showLogs, setShowLogs] = useState(false);
const [logFiles, setLogFiles] = useState([]);
const [selectedLogFile, setSelectedLogFile] = useState("");
const [logs, setLogs] = useState([]);
const [loadingLogs, setLoadingLogs] = useState(false);
const [fileSearchTerm, setFileSearchTerm] = useState("");
const [autoRefresh, setAutoRefresh] = useState(false);
const LOGS_BASE_URL = "http://13.232.8.31:8085/ocpp";
// Fetch log files for the current station

const qrUrl = currentStation
  ? `https://backend.chargeevya.com/?siteId=0&stationId=${currentStation.id}&portId=0`
  : "";
const handleQrView = () => {
  window.open(qrUrl, "_blank");
};

const handleQrDownload = () => {
  const canvas = document.getElementById("stationQrCode");
  if (!canvas) return;

  const pngUrl = canvas
    .toDataURL("image/png")
    .replace("image/png", "image/octet-stream");

  const link = document.createElement("a");
  link.href = pngUrl;
  link.download = `${currentStation.stationName || "station"}-QR.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const fetchLogFiles = async () => {
  if (!currentStation?.ocppid) return;
  
  try {
    const response = await axios.get(`${LOGS_BASE_URL}/${currentStation.ocppid}`);
    if (response.data && Array.isArray(response.data)) {
      // Sort files by date (newest first)
      const sortedFiles = response.data.sort((a, b) => {
        const dateA = extractDateFromFileName(a);
        const dateB = extractDateFromFileName(b);
        return dateB - dateA;
      });
      setLogFiles(sortedFiles);
      
      // Auto-select today's file or the first one
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const todayFile = sortedFiles.find(file => file.includes(todayStr));
      
      if (todayFile) {
        setSelectedLogFile(todayFile);
      } else if (sortedFiles.length > 0) {
        setSelectedLogFile(sortedFiles[0]);
      }
    }
  } catch (error) {
    console.error("Error fetching log files:", error);
    toast({
      title: 'Error',
      description: 'Failed to fetch log files',
      variant: 'destructive',
    });
  }
};
// Fetch logs for selected file
const fetchLogs = async (fileName) => {
  if (!currentStation?.ocppid || !fileName) return;
  
  setLoadingLogs(true);
  try {
    const response = await axios.get(
      `${LOGS_BASE_URL}/${currentStation.ocppid}/${fileName}`,
      { responseType: "text" }
    );
    
    if (response.data) {
      const logArray = parseLogFile(response.data);
      setLogs(logArray);
    }
  } catch (error) {
    console.error("Error fetching logs:", error);
    toast({
      title: 'Error',
      description: 'Failed to fetch logs',
      variant: 'destructive',
    });
  } finally {
    setLoadingLogs(false);
  }
};

// Helper functions
const parseLogFile = (logContent) => {
  const lines = logContent.split("\n");
  const parsedLogs = [];
  
  lines.forEach((line, index) => {
    if (line.trim()) {
      parsedLogs.push({
        id: `${index}-${Date.now()}`,
        content: line.trim(),
        raw: line.trim()
      });
    }
  });
  
  return parsedLogs;
};


const normalizeStatus = (status) =>
  (status || '').toString().trim().toUpperCase();


const extractDateFromFileName = (fileName) => {
  const match = fileName.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? new Date(match[1]) : new Date(0);
};

const formatFileNameDate = (fileName) => {
  const date = extractDateFromFileName(fileName);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};
// Add this useEffect
useEffect(() => {
  if (showLogs && currentStation?.ocppid) {
    fetchLogFiles();
  }
}, [showLogs, currentStation?.ocppid]);

// Add this useEffect to fetch logs when selected file changes
useEffect(() => {
  if (selectedLogFile && currentStation?.ocppid) {
    fetchLogs(selectedLogFile);
  }
}, [selectedLogFile, currentStation?.ocppid]);

  useEffect(() => {
    if (id) {
      dispatch(fetchStationDetails(id));
    }
  }, [dispatch, id]);


useEffect(() => {
  if (currentStation) {
    setStationStatus(normalizeStatus(currentStation.stationStatus));
    const billings = {};
    currentStation.port?.forEach((p) => {
      billings[p.id] = p.billingAmount ?? p.portPrice ?? 0;
    });
    setBillingAmounts(billings);
  }
}, [currentStation]);


//for logs
useEffect(() => {
  if (currentStation?.ocppid) {
    localStorage.setItem('lastViewedOcppId', currentStation.ocppid);
        if (currentStation.stationName) {
      localStorage.setItem(`station_${currentStation.ocppid}`, currentStation.stationName);
    }
  }
}, [currentStation]);
// Auto-refresh effect
useEffect(() => {
  let intervalId;
  
  if (autoRefresh && selectedLogFile && currentStation?.ocppid) {
    intervalId = setInterval(() => {
      fetchLogs(selectedLogFile);
    }, 5000); // Refresh every 5 seconds
  }
  
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}, [autoRefresh, selectedLogFile, currentStation?.ocppid]);

const handleStatusChange = async (newStatus) => {
  try {
    const normalizedStatus = normalizeStatus(newStatus);
    setStationStatus(normalizedStatus);

    await AxiosServices.updateStationStatus(
      currentStation.id,
      normalizedStatus
    );

    toast({
      title: 'Success',
      description: 'Status updated successfully',
    });
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to update status',
      variant: 'destructive',
    });
  } finally {
    setDropdownOpen(false);
  }
};


const handleUpdateBillingAmount = async (portId) => {
  try {
    const newBillingAmount = billingAmounts[portId];
    console.log('Updating port billing:', { portId, newBillingAmount });
    
    await updatePortPrice(portId, newBillingAmount);
    
    toast({
      title: 'Success',
      description: `Port ${portId} billing amount updated successfully.`,
      variant: 'default',
    });
    
    dispatch(fetchStationDetails(id));
    
  } catch (error) {
    console.error('Update billing error:', error);
    toast({
      title: 'Error',
      description: `Failed to update billing amount for Port ${portId}: ${error.message || error}`,
      variant: 'destructive',
    });
  }
};
 
  const renderStars = (rating = 0) => {
    return Array(5).fill(0).map((_, i) => (
      i < rating ?
        <StarFilledIcon key={i} className="h-5 w-5 text-yellow-400" /> :
        <StarIcon key={i} className="h-5 w-5 text-gray-300" />
    ));
  };

  if (status === 'loading' || !currentStation) {
  return <Loading />;
}

  if (status === 'failed') {
    toast({
      title: 'Error',
      description: error || 'Failed to load station details',
      variant: 'destructive',
    });
  } 

  return (
    <div className="p-6">
<div className="flex justify-between items-center mb-6">
  <div className="flex items-center gap-4 mb-6">
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
      {currentStation.serialNo} / {currentStation.stationName}
    </h1>
    <div className="relative">
      <button
        className={`flex items-center px-4 py-1.5 border rounded-full transition ${
          stationStatus === 'ACTIVE'
            ? 'bg-green-100 text-green-800 border-green-400'
            : stationStatus === 'MAINTENANCE'
            ? 'bg-yellow-100 text-yellow-800 border-yellow-400'
            : stationStatus === 'INACTIVE'
            ? 'bg-red-100 text-red-800 border-red-400'
            : 'bg-gray-100 text-gray-800 border-gray-400'
        }`}
        onClick={() => setDropdownOpen((prev) => !prev)}
      >
        {stationStatus}
        {dropdownOpen ? (
          <ChevronUp className="ml-2 h-4 w-4" />
        ) : (
          <ChevronDown className="ml-2 h-4 w-4" />
        )}
      </button>
      {dropdownOpen && (
        <div className="absolute mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md z-10 p-3">
          <p className="font-medium text-sm mb-2 text-gray-700 dark:text-gray-300">
            Select Status
          </p>
          {['ACTIVE', 'INACTIVE', 'MAINTENANCE'].map((option) => (
            <button
              key={option}
              className={`w-full text-left px-4 py-1.5 mb-1 rounded-full border transition ${
                option === 'ACTIVE'
                  ? 'bg-green-100 text-green-800 border-green-400'
                  : option === 'MAINTENANCE'
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-400'
                  : option === 'INACTIVE'
                  ? 'bg-red-100 text-red-800 border-red-400'
                  : 'bg-blue-100 text-blue-800 border-blue-400'
              }`}
              onClick={() => handleStatusChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
           <div className="flex gap-2">
          <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/stations/${currentStation.id}/logs`)}
              className="ml-2 bg-green-600 text-white border-green-600 hover:bg-green-600"
            >
              <FileText className="h-4 w-4 mr-2" />
              Logs
            </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="icon"  onClick={() => setQrDialogOpen(true)}>
            <QrCodeIcon className="w-5 h-5" />
          </Button>
          </div>
          <Button
           variant="outline"
            size="md"
            className="mr-3 p-2 hover:bg-gray-100"
            onClick={() => navigate("/stations")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          </div>
          </div>
     <Tabs defaultValue="overview" className="w-full mt-6">
      {/* <TabsList className="grid grid-cols-3 w-full mb-4">
        <TabsTrigger value="overview">Basic Info</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
        <TabsTrigger value="port">Port Instructions</TabsTrigger>
      </TabsList> */}

      <TabsContent value="overview">
        <Tabs defaultValue="details" className="w-full">          
         <div className="space-y-6">
          <div className="flex justify-between items-center mb-2">
            <div><h2 className="text-xl font-semibold mb-4">Basic Details</h2></div>
            {/* <Button  className="flex gap-2  w-24" onClick={()=>navigate(`/editstation/${id}`)}>Edit</Button> */}
            </div>          
            <Card className="p-6">
            <div className="p-2 rounded-lg mb-2">
              <h3 className="text-lg font-semibold mb-4">Station Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-600">Serial Number</p>
                  <p className="font-medium">{currentStation.serialNo || '-'}</p>        
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-600">Station Name</p>
                  <p className="font-medium">{currentStation.stationName || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-600">Model</p>
                  <p className="font-medium">{currentStation.model || '-'}</p>
                </div>
                <div className="">
                  <p className="font-semibold text-gray-600">OCPP ID</p>
                  <p className="font-medium">{currentStation.ocppid || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-600">Manufacturer ID</p>
                  <p className="font-medium">{currentStation.manufacturerId || '-'}</p>
                </div>
              </div>
            </div>
            <div className="p-2 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Site Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-600">Site Name</p>
                  <p className="font-medium">{currentStation.site?.siteName || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-600">Site Owner</p>
                  <p className="text-base">{currentStation.site?.org?.orgName || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-600">Go Live Date</p>
                  <p className="font-medium">
                    {currentStation.creationDate ? new Date(currentStation.creationDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-600">Station Mode</p>
                  <p className="font-medium">{currentStation.stationMode || 'Payment Mode'}</p>
                </div>
              </div>
            </div>
            </Card>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Specifications</h2>
              </div>
            <Card className="p-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="font-semibold text-gray-600">Firmware Version</p>
                  <p className="font-medium">{currentStation.firmware_version || '-'}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-600">Communication Method</p>
                  <p className="font-medium">{currentStation.communication_method || '-'}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-600">Current Type</p>
                  <p className="font-medium">{currentStation.current_type || '-'}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-600">Max Output Power</p>
                  <p className="font-medium">{currentStation.max_output_power_kW || '-'} kW</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-600">Voltage Range</p>
                  <p className="font-medium">{currentStation.voltage_range || '-'} V</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-600">Number of Ports</p>  
                  <p className="font-medium">{currentStation.number_of_ports || '-'}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-600">V2G Support</p>
                  <Badge variant={currentStation.v2G_support ? "success" : "secondary"}>
                    {currentStation.v2G_support ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Rating</p>
                  <div className="flex items-center">
                    {renderStars(currentStation.rating || 0)}
                  </div>
                </div>
              </div>
            </Card>
            <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Ports</h2>
                </div>
            </div>
            <Card className="p-2">
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Port Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Nominal Volts</TableHead>
                      <TableHead>Max Amps</TableHead>
                      <TableHead>Max Power</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Billing Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentStation.port?.map((port, index) => (
                      <TableRow key={port.id || index}>
                        <TableCell>{port.connectorName || `Port ${index + 1}`}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              port.statusNotifcation?.[0]?.status === 'Inoperative' 
                                ? 'destructive' 
                                : 'default'
                            } 
                            className="text-xs"
                          >
                            {port.statusNotifcation?.[0]?.status || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>{port.voltage_rating || '-'} V</TableCell>
                        <TableCell>{port.current_rating || '-'} A</TableCell>
                        <TableCell>{port.max_power_kW || '-'} kW</TableCell>
                        <TableCell>{port.connector_type || '-'}, {port.power_type || '-'}</TableCell>
                         <TableCell className="flex items-center gap-2">
                          <input
                            type="number"
                            value={
                              billingAmounts[port.id] ??
                              port.billingAmount ??
                              ""
                            }
                            disabled={editingPortId !== port.id}
                            onChange={(e) =>
                              setBillingAmounts((prev) => ({
                                ...prev,
                                [port.id]: e.target.value,
                              }))
                            }
                            className={`border rounded p-1 w-14 text-sm ${
                              editingPortId === port.id
                                ? "bg-white"
                                : "bg-gray-100 cursor-not-allowed"
                            }`}
                          />
                          <span className="text-xs text-gray-500">
                            / {port.billingUnits || "kWh"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {editingPortId === port.id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              handleUpdateBillingAmount(port.id);
                              setEditingPortId(null);
                            }}
                          >
                            Save
                          </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingPortId(port.id);
                                setBillingAmounts((prev) => ({
                                  ...prev,
                                  [port.id]: port.billingAmount,
                                }));
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </Card>
              </div>
            </Tabs>
          </TabsContent>
        </Tabs>
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>Station QR Code</DialogTitle>
      <DialogDescription>
        Scan to access charging station
      </DialogDescription>
    </DialogHeader>

    <div className="flex flex-col items-center gap-4">
      {qrUrl && (
        <QRCodeCanvas
          id="stationQrCode"
          value={qrUrl}
          size={220}
          includeMargin={true}
        />
      )}

      {/* <p className="text-xs text-center break-all text-gray-500">
        {qrUrl}
      </p> */}

      <Button onClick={handleQrDownload} className="w-full">
        <Download className="h-4 w-4 mr-2" />
        Download QR
      </Button>
    </div>
  </DialogContent>
</Dialog>
    </div>
  );
}
//stationDetails.jsx