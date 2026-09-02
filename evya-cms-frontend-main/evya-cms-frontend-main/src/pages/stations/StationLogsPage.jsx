import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  RefreshCw, 
  ArrowLeft, 
  Loader2,
  Filter,
  Zap,
  ChevronDown,
  Search
} from "lucide-react";
import { toast } from '@/components/ui/use-toast';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStationDetails } from '@/store/reducers/stations/stationsSlice';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import OCPPControl from './OCPPControl';

const StationLogsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentStation, status, error } = useSelector((state) => state.stations);
  
  const [logFiles, setLogFiles] = useState([]);
  const [selectedLogFile, setSelectedLogFile] = useState("");
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileSearchTerm, setFileSearchTerm] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000); 
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedPort, setSelectedPort] = useState(null);
  const [selectedCommand, setSelectedCommand] = useState('');
  const [ocppDialogOpen, setOcppDialogOpen] = useState(false);
  const [selectedPortId, setSelectedPortId] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  
  const OCPP_INSTRUCTIONS = [
    "All",
    "StartTransaction",
    "StopTransaction",
    "RemoteStart",
    "RemoteStop",
    "Heartbeat",
    "StatusNotification",
    "BootNotification",
    "Authorize",
    "MeterValues",
    "FirmwareStatusNotification",
    "DiagnosticsStatusNotification"
  ];
  
  const LOGS_BASE_URL = "https://ocpp.evyaa.com/ocpp";
  
  useEffect(() => {
    if (id) {
      dispatch(fetchStationDetails(id));
    }
  }, [dispatch, id]);
  
  useEffect(() => {
    if (currentStation?.ocppid) {
      fetchLogFiles();
    }
  }, [currentStation?.ocppid]);
  
  useEffect(() => {
    if (logs.length > 0) {
      applyLocalFilters();
    }
  }, [logs, filter, searchTerm]);
  
  useEffect(() => {
    if (!selectedLogFile || !currentStation?.ocppid || !autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchLogs(filter);
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, selectedLogFile, currentStation?.ocppid, filter, refreshInterval]);
  
  const logContainerRef = useRef(null);
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [filteredLogs]);
  
  const applyLocalFilters = useCallback(() => {
    let filtered = [...logs];
    
    if (filter && filter !== "All") {
      filtered = filtered.filter(log => 
        log.content.includes(`[${filter}]`) || 
        log.content.toLowerCase().includes(filter.toLowerCase())
      );
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.content.toLowerCase().includes(term)
      );
    }
    
    setFilteredLogs(filtered);
  }, [logs, filter, searchTerm]);


  const normalizeOcppId = (ocppId) => {
  if (!ocppId) return '';
  return ocppId.toLowerCase().trim();
};

const fetchLogFiles = async () => {
  if (!currentStation?.ocppid) return;
  
  setLoadingFiles(true);
  try {
    const normalizedOcppId = normalizeOcppId(currentStation.ocppid);
    const response = await axios.get(`${LOGS_BASE_URL}/${normalizedOcppId}`);
    
    if (response.data && Array.isArray(response.data)) {
      const sortedFiles = response.data.sort((a, b) => {
        const dateA = extractDateFromFileName(a);
        const dateB = extractDateFromFileName(b);
        return dateB - dateA;
      });
      setLogFiles(sortedFiles);
      
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const todayFile = sortedFiles.find(file => file.includes(todayStr));
      
      if (todayFile) {
        setSelectedLogFile(todayFile);
      } else if (sortedFiles.length > 0) {
        setSelectedLogFile(sortedFiles[0]);
      }
    } else {
      setLogFiles([]);
    }
  } catch (error) {
    console.error("Error fetching log files:", error);
    toast({
      title: 'Error',
      description: `Failed to fetch log files for OCPP ID: "${currentStation.ocppid}". Please check if the station has connected and generated logs.`,
      variant: 'destructive',
    });
  } finally {
    setLoadingFiles(false);
  }
};
  const toggleFullscreen = () => {
  setIsFullscreen(prev => !prev);
};

const highlightLogText = (text) => {
  const keywords = /(rejected|disconnected)/gi;

  return text.split(keywords).map((part, index) => {
    if (keywords.test(part)) {
      return (
        <span key={index} className="text-red-500 font-semibold">
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};


useEffect(() => {
  const handleEsc = (e) => {
    if (e.key === "Escape") {
      setIsFullscreen(false);
    }
  };
  if (isFullscreen) {
    window.addEventListener("keydown", handleEsc);
  }
  return () => window.removeEventListener("keydown", handleEsc);
}, [isFullscreen]);

const fetchLogs = async (selectedFilter = filter) => {
  if (!currentStation?.ocppid || !selectedLogFile) return;
  
  setLoadingLogs(true);
  try {
    const normalizedOcppId = normalizeOcppId(currentStation.ocppid);
    let apiUrl = "";
    
    if (selectedFilter === "All") {
      apiUrl = `${LOGS_BASE_URL}/${normalizedOcppId}/${encodeURIComponent(selectedLogFile)}`;
    } else {
      apiUrl = `${LOGS_BASE_URL}/${normalizedOcppId}/${encodeURIComponent(selectedLogFile)}?filter=${encodeURIComponent(selectedFilter)}`;
    }
    
    const response = await axios.get(apiUrl, { responseType: "text" });
    
    if (response.data) {
      const logArray = parseLogFile(response.data);
      setLogs(logArray);
      setFilteredLogs(logArray);
    }
  } catch (error) {
    console.error("Error fetching logs:", error);
    toast({
      title: 'Error',
      description: 'Failed to fetch logs. The log file might be empty or inaccessible.',
      variant: 'destructive',
    });
    setLogs([]);
    setFilteredLogs([]);
  } finally {
    setLoadingLogs(false);
  }
};
  
  useEffect(() => {
    if (selectedLogFile && currentStation?.ocppid) {
      if (filter !== "All") {
        fetchLogs(filter);
      } else {
        fetchLogs();
      }
    }
  }, [selectedLogFile, currentStation?.ocppid, filter]);

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

  const extractDateFromFileName = (fileName) => {
    const match = fileName.match(/(\d{4}-\d{2}-\d{2})/);
    return match ? new Date(match[1]) : new Date(0);
  };

  const formatFileNameDate = (fileName) => {
    const date = extractDateFromFileName(fileName);
    if (date.getTime() === 0) return "Unknown date";
    
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

const handleFilteredDownload = async () => {
  if (!selectedLogFile || !currentStation?.ocppid) {
    toast({
      title: 'Error',
      description: 'Missing OCPP ID or file',
      variant: 'destructive',
    });
    return;
  }

  try {
    const encodedFile = encodeURIComponent(selectedLogFile);
    const normalizedOcppId = normalizeOcppId(currentStation.ocppid);
    let apiUrl = "";
    let downloadFilter = filter;
    
    if (downloadFilter === "All") {
      apiUrl = `${LOGS_BASE_URL}/${normalizedOcppId}/${encodedFile}`;
    } else {
      const encodedFilter = encodeURIComponent(downloadFilter);
      apiUrl = `${LOGS_BASE_URL}/${normalizedOcppId}/${encodedFile}?filter=${encodedFilter}`;
    }
    
    const response = await axios.get(apiUrl, {
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = downloadFilter === "All" 
      ? `${selectedLogFile.replace(".txt", "")}_all.txt`
      : `${selectedLogFile.replace(".txt", "")}_${downloadFilter}.txt`;
    
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: 'Success',
      description: `Downloaded ${selectedLogFile}${downloadFilter !== "All" ? ` filtered by ${downloadFilter}` : ''}`,
      variant: 'default',
    });
    
  } catch (error) {
    console.error("Download failed:", error);
    toast({
      title: 'Error',
      description: error.response?.status === 404 ? 'File not found on server' : 'Download failed',
      variant: 'destructive',
    });
  }
};

  const handleRefreshLogs = () => {
    if (selectedLogFile && currentStation?.ocppid) {
      fetchLogs(filter);
    }
  };

  const handleRefreshFiles = () => {
    fetchLogFiles();
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    setSearchTerm("");
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleOcppCommandSelect = (command) => {
    if (!selectedPortId) {
      toast({
        title: 'Select Port First',
        description: 'Please select a port before sending command',
        variant: 'destructive',
      });
      return;
    }
    
    const port = currentStation.port?.find(p => p.id === selectedPortId);
    if (!port) return;
    
    setSelectedPort(port);
    setSelectedCommand(command);
    setOcppDialogOpen(true);
  };

  const handleQuickCommand = (command) => {
    handleOcppCommandSelect(command);
  };

  if (status === 'loading') {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Loading station details...</span>
        </div>
      </div>
    );
  }

  if (status === 'failed' || !currentStation) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="mr-3"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Station Not Found</h3>
          <p className="text-gray-600 mb-4">
            {error || "The station could not be loaded."}
          </p>
          <Button onClick={() => navigate('/stations')} variant="outline" className="mt-4">
            Go to Stations List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentStation.stationName || currentStation.serialNo} - Logs & OCPP Control
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              OCPP ID: {currentStation.ocppid}
            </p>
          </div>
        <div className="flex items-center">
          
          <Button
            variant="outline"
            size="md"
            className="mr-3 p-2 hover:bg-gray-100"
            onClick={() => navigate(`/stations/${currentStation.id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
        </div>
      </div>
<div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    
    {/* File Selection */}
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-gray-600" />
        <label className="text-sm font-medium text-gray-900">Log File</label>
      </div>
      <Select 
        value={selectedLogFile} 
        onValueChange={(value) => {
          setSelectedLogFile(value);
          setFileSearchTerm("");
          setSearchTerm("");
        }}
        disabled={loadingFiles}
      >
        <SelectTrigger className="w-full bg-white border-gray-300 hover:bg-gray-50 h-11">
          <SelectValue 
            placeholder={loadingFiles ? "Loading files..." : "Select file"} 
            className="text-sm"
          />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 shadow-lg">
          <div className="p-2 border-b">
            <Input
              placeholder="Search files..."
              value={fileSearchTerm}
              onChange={(e) => setFileSearchTerm(e.target.value)}
              className="h-9 text-sm border-gray-300"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ScrollArea className="h-64">
            {logFiles
              .filter(file => file.toLowerCase().includes(fileSearchTerm.toLowerCase()))
              .map((file) => (
                <SelectItem key={file} value={file} className="text-sm py-2 hover:bg-gray-100">
                  <div className="font-medium">{file}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatFileNameDate(file)}
                  </div>
                </SelectItem>
              ))
            }
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
    
    {/* Filter */}
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-600" />
        <label className="text-sm font-medium text-gray-900">Filter by Instruction</label>
      </div>
      <Select value={filter} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-full bg-white border-gray-300 hover:bg-gray-50 h-11 text-sm">
          <SelectValue placeholder="All instructions" />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 shadow-lg">
          {OCPP_INSTRUCTIONS.map((instruction) => (
            <SelectItem key={instruction} value={instruction} className="text-sm hover:bg-gray-100">
              {instruction}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    
    {/* Actions */}
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 text-gray-600" />
        <label className="text-sm font-medium text-gray-900">Actions</label>
      </div>
      <div className="flex gap-3">
        <Button
          onClick={handleFilteredDownload}
          disabled={!selectedLogFile || logs.length === 0 || loadingLogs}
          className="h-11 flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Download {filter === "All" ? "All" : ""}
        </Button>
        <Button
          variant={autoRefresh ? "default" : "outline"}
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`h-11 px-4 ${autoRefresh ? "bg-green-600 hover:bg-green-700 text-white" : "border-gray-300"}`}
        >
          {autoRefresh ? (
            <>
              <div className="h-2 w-2 rounded-full bg-white mr-2 animate-pulse" />
              Live
            </>
          ) : (
            "Paused"
          )}
        </Button>
      </div>
    </div>
  </div>
  
  {/* Divider */}
  <div className="my-6 border-t border-gray-200" />
  
  {/* OCPP Control */}
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <Zap className="h-4 w-4 text-amber-500" />
      <span className="text-sm font-medium text-gray-900">OCPP Control</span>
    </div>
    
    <div className="flex flex-col sm:flex-row gap-3">
      <Select value={selectedPortId} onValueChange={setSelectedPortId}>
  <SelectTrigger className="sm:w-48 h-11">
    <SelectValue placeholder="Select Port" />
  </SelectTrigger>
  <SelectContent>
    {currentStation.port?.map((port, i) => {
      const status = port.statusNotifcation?.[0]?.status || 'Unknown';     
      return (
        <SelectItem key={port.id || i} value={port.id}>
          <div className="flex items-center justify-between w-full">
            <span>{port.connectorName || `Port ${i + 1}`}</span>
            <Badge 
              variant={
                status === 'Inoperative' || status === 'Faulted' || status === 'Unavailable' 
                  ? 'destructive' 
                  : 'default'
              }
              className="ml-2 text-xs"
            >
              {status}
            </Badge>
          </div>
        </SelectItem>
      );
    })}
  </SelectContent>
</Select>
      
      <Select 
        onValueChange={handleQuickCommand}
        disabled={!selectedPortId}
      >
        <SelectTrigger className="flex-1 h-11">
          <SelectValue placeholder="Select Command" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="RemoteStart">Remote Start</SelectItem>
          <SelectItem value="RemoteStop">Remote Stop</SelectItem>
          <SelectItem value="Reset">Reset</SelectItem>
          <SelectItem value="TriggerMessage">Trigger Message</SelectItem>
          <SelectItem value="ChangeAvailability">Change Availability</SelectItem>
          <SelectItem value="ChangeConfiguration">Change Configuration</SelectItem>
          <SelectItem value="GetConfiguration">Get Configuration</SelectItem>
          <SelectItem value="ClearCache">Clear Cache</SelectItem>
          <SelectItem value="SetChargingProfile">Set Charging Profile</SelectItem>
          <SelectItem value="Heartbeat">Heartbeat</SelectItem>
          <SelectItem value="Custom">Custom</SelectItem>         
        </SelectContent>
      </Select>
    </div>
  </div>
</div>
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          {selectedLogFile && logs.length > 0 && (
            <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
              <div className="flex items-center gap-4">
                {filter !== "All" && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    Filter: {filter}
                  </Badge>
                )}
                
              </div>
              <div className="text-xs text-gray-500">
                File: {selectedLogFile}
              </div>
            </div>
          )}          
          {selectedLogFile ? (
            <div className="mt-4">
              {loadingLogs ? (
                <div className="flex flex-col items-center justify-center h-[600px] bg-black rounded-lg">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-400"></div>
                  <span className="ml-3 mt-4 text-white text-lg">Loading logs...</span>
                  <span className="text-gray-400 text-sm mt-2">Please wait</span>
                </div>
              ) : filteredLogs.length > 0 ? (
               <div
                  ref={logContainerRef}
                  className={`
                    bg-black text-white font-mono text-sm border border-gray-800
                    overflow-y-auto overflow-x-hidden
                    ${isFullscreen 
                      ? "fixed inset-0 z-50 rounded-none h-screen w-screen" 
                      : "rounded-lg h-[500px]"
                    }
                  `}
                >
                 <div className="sticky top-0 bg-gray-900 text-gray-400 text-xs px-4 py-3 border-b border-gray-800 flex justify-between items-center">
  <span>
    Terminal Output - {filteredLogs.length} line{filteredLogs.length !== 1 ? 's' : ''}
    {filter !== "All" && ` (${filter} only)`}
    {searchTerm && ` matching "${searchTerm}"`}
  </span>

  <div className="flex items-center gap-3">
    <Button
      size="icon"
      variant="ghost"
      className="text-gray-300 hover:text-white hover:bg-gray-800"
      onClick={toggleFullscreen}
    >
      {isFullscreen ? "✕" : "⛶"}
    </Button>

    <div className="flex items-center gap-2">
      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
      {new Date().toLocaleTimeString()}
    </div>
  </div>
</div>

                  
                  <div className="p-4 space-y-0.5">
                    {filteredLogs.map((log, index) => (
                      <div key={log.id} className="group hover:bg-gray-900 px-2 py-0.5 rounded transition-colors">
                        <div className="flex">
                          <span className="text-cyan-300 min-w-[60px] text-right pr-3 opacity-70">
                            {index + 1}
                          </span>
                         <span
                            className={`
                              flex-1 whitespace-pre-wrap break-all
                              ${/rejected|disconnected/i.test(log.content)
                                ? "text-red-500 font-semibold"
                                : "text-white"
                              }
                            `}
                          >
                            {log.content}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[500px] bg-black rounded-lg border border-gray-800">
                  <Filter className="h-12 w-12 text-gray-600 mb-3" />
                  <span className="text-gray-400 text-lg">
                    {logs.length === 0 ? "No logs found in this file" : "No logs match your filter"}
                  </span>
                  <span className="text-gray-500 text-sm mt-1">
                    {logs.length === 0 
                      ? "The log file might be empty" 
                      : `Try changing the filter or search term. There are ${logs.length} total logs.`}
                  </span>
                </div>
              )}
            </div>
          ) : logFiles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Log Files Available</h3>
              <div className="mt-4 flex flex-col items-center gap-2">
                {loadingFiles ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">
                      Checking for new log files...
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-gray-500 italic">
                    Waiting for station to generate logs…
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Select a Log File</h3>
              <p className="text-gray-600">
                Choose a log file from the dropdown above to view logs.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={ocppDialogOpen} onOpenChange={setOcppDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              {selectedCommand ? `OCPP Command: ${selectedCommand}` : 'OCPP Commands'}
            </DialogTitle>
            <DialogDescription>
              {selectedPort ? 
                `${selectedPort.connectorName} • Connector ID: ${selectedPort.connectorId}` : 
                'Select a port and command to send'}
            </DialogDescription>
          </DialogHeader>
          
          {ocppDialogOpen && (
            <OCPPControl 
              station={currentStation}
              ports={selectedPort ? [selectedPort] : currentStation.port || []}
              preselectedCommand={selectedCommand}
              isDialogMode={true}
              onClose={() => {
                setOcppDialogOpen(false);
                setSelectedCommand('');
                setSelectedPort(null);
              }}
              onCommandSent={() => {
                if (selectedLogFile && autoRefresh) {
                  setTimeout(() => fetchLogs(filter), 2000);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StationLogsPage;

