import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { fetchOcppStations, sendOcppRequest, clearRequestResponse } from '@/store/reducers/ocpp/ocppSlice';
import { ReloadIcon, ExclamationTriangleIcon, CheckCircledIcon, LightningBoltIcon, MixerVerticalIcon, MagnifyingGlassIcon, ChevronDownIcon, PlusIcon, TrashIcon, ActivityLogIcon, EyeOpenIcon, EyeClosedIcon } from "@radix-ui/react-icons";
import Loading from '@/users/Loading';


const formatLocalDateTime = (date) => {
  const pad = (num) => String(num).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};


const WebSocketLogsDialog = ({ open, onClose, logs, isConnected }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const logsEndRef = useRef(null);





  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filter !== 'all' && log.type !== filter) {
        return false;
      }
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          (log.message && log.message.toLowerCase().includes(searchLower)) ||
          (log.timestamp && log.timestamp.toLowerCase().includes(searchLower)) ||
          (log.data && JSON.stringify(log.data).toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });
  }, [logs, filter, searchTerm]);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [filteredLogs]);

  const getLogTypeColor = (type) => {
    switch (type) {
      case 'incoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'outgoing': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'info': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose} className="max-w-4xl">
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col border border-gray-200">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 font-medium">
              <ActivityLogIcon className="h-5 w-5 text-gray-600" />
              WebSocket Connection Logs
              <Badge variant={isConnected ? "default" : "destructive"} className="ml-2">
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
                className="text-gray-600"
              >
                Clear Logs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={scrollToBottom}
                className="text-gray-600"
              >
                Scroll to Bottom
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <DialogDescription className="flex-1 flex flex-col pt-6">
          {/* Filters and Search */}
          <div className="mb-4 space-y-4">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'incoming' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('incoming')}
                className="flex items-center gap-1"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Incoming
              </Button>
              <Button
                variant={filter === 'outgoing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('outgoing')}
                className="flex items-center gap-1"
              >
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Outgoing
              </Button>
              <Button
                variant={filter === 'error' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('error')}
                className="flex items-center gap-1"
              >
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Errors
              </Button>
            </div>
            
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  ×
                </Button>
              )}
            </div>
          </div>

          {/* Logs Container */}
          <ScrollArea className="flex-1 border border-gray-200 rounded-lg">
            <div className="p-4 space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No logs to display
                </div>
              ) : (
                filteredLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${getLogTypeColor(log.type)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getLogTypeColor(log.type)} border-0`}
                        >
                          {log.type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-600">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      {log.stationId && (
                        <Badge variant="outline" className="text-xs">
                          Station: {log.stationId}
                        </Badge>
                      )}
                    </div>
                    
                    {log.message && (
                      <div className="font-medium mb-2">{log.message}</div>
                    )}
                    
                    {log.data && (
                      <div className="mt-2">
                        <div className="text-xs font-medium text-gray-600 mb-1">Data:</div>
                        <pre className="text-xs bg-black bg-opacity-10 p-2 rounded overflow-x-auto">
                          {typeof log.data === 'string' 
                            ? log.data 
                            : JSON.stringify(log.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </ScrollArea>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Incoming: {logs.filter(l => l.type === 'incoming').length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Outgoing: {logs.filter(l => l.type === 'outgoing').length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Errors: {logs.filter(l => l.type === 'error').length}</span>
                </div>
              </div>
              <div>Total: {logs.length} logs</div>
            </div>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

const OCPP_SETTINGS = {
  RemoteStart: {
    requiresIdTag: true,
    requiresStartEndDate: true,
    cardColor: 'bg-gray-50 border-gray-200',
    buttonColor: 'bg-gradient-to-r from-green-500 to-emerald-600'
  },
  RemoteStop: {
    cardColor: 'bg-gray-50 border-gray-200',
    buttonColor: 'bg-gradient-to-r from-green-500 to-emerald-600'
  },
  Reset: {
    type: ['Soft', 'Hard'],
    cardColor: 'bg-gray-50 border-gray-200',
    buttonColor: 'bg-gradient-to-r from-green-500 to-emerald-600'
  },
  TriggerMessage: {
    key: ['BootNotification', 'Heartbeat', 'MeterValues', 'StatusNotification'],
    cardColor: 'bg-gray-50 border-gray-200',
    buttonColor: 'bg-gradient-to-r from-green-500 to-emerald-600'
  },
  ChangeAvailability: {
    type: ['Operative', 'Inoperative'],
    cardColor: 'bg-gray-50 border-gray-200',
    buttonColor: 'bg-gradient-to-r from-green-500 to-emerald-600'
  },
  ChangeConfiguration: {
    key: [
      'AuthorizationRequired',
      'HeartbeatInterval',
      'ConnectionTimeOut',
      'ResetRetries',
      'BlinkRepeat',
      'LightIntensity',
      'MeterValueSampleInterval',
      'LocalAuthListEnabled',
      'LocalPreAuthorize',
      'StopTransactionOnInvalidId',
      'MaxEnergyOnInvalidId'
    ],
    value: [true, false],
    cardColor: 'bg-gray-50 border-gray-200',
    buttonColor: 'bg-gradient-to-r from-green-500 to-emerald-600'
  },
  GetConfiguration: {
    key: ['AllKeys'],
    cardColor: 'bg-gray-50 border-gray-200',
    buttonColor: 'bg-gradient-to-r from-green-500 to-emerald-600'
  },
  ClearCache: {
    cardColor: 'bg-gray-50 border-gray-200',
    buttonColor: 'bg-gradient-to-r from-green-500 to-emerald-600'
  },
  SetChargingProfile: {
    cardColor: 'bg-gray-50 border-gray-200',
    buttonColor: 'bg-gradient-to-r from-green-500 to-emerald-600'
  },
  Custom: {
    requiresCustomMessage: true,
    cardColor: 'bg-gray-50 border-gray-200',
    buttonColor: 'bg-gradient-to-r from-green-500 to-emerald-600'
  }
};

const CHARGING_PROFILE_PURPOSES = {
  TX_DEFAULT_PROFILE: 'TxDefaultProfile',
  TX_PROFILE: 'TxProfile',
  CHARGE_POINT_MAX_PROFILE: 'ChargePointMaxProfile'
};

const CHARGING_PROFILE_KINDS = {
  ABSOLUTE: 'Absolute',
  RECURRING: 'Recurring',
  RELATIVE: 'Relative'
};

const CHARGING_RATE_UNITS = {
  AMPERES: 'A',
  WATTS: 'W'
};

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  CHARGING: 'bg-blue-100 text-blue-800 border-blue-200',
  UNAVAILABLE: 'bg-red-100 text-red-800 border-red-200',
  PREPARING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DEFAULT: 'bg-gray-100 text-gray-800 border-gray-200'
};

const useClickOutside = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, callback]);
};

const useStationData = () => {
  const dispatch = useDispatch();
  const { 
    stations = [], 
    status, 
    requestStatus, 
    requestResponse, 
    requestError 
  } = useSelector((state) => state.ocpp);

  useEffect(() => {
    dispatch(fetchOcppStations());
  }, [dispatch]);

  return {
    stations,
    status,
    requestStatus,
    requestResponse,
    requestError,
    dispatch
  };
};

const getStatusColor = (status) => {
  if (!status) return STATUS_COLORS.DEFAULT;
  const statusLower = status.toLowerCase();
  if (statusLower === 'active' || statusLower === 'available' || 
      statusLower === 'operative' || statusLower === 'ready') {
    return STATUS_COLORS.ACTIVE;
  }
  
  if (statusLower.includes('charging') || statusLower === 'occupied') {
    return STATUS_COLORS.CHARGING;
  }
  
  if (statusLower === 'unavailable' || statusLower === 'inoperative' || 
      statusLower === 'faulted' || statusLower === 'error') {
    return STATUS_COLORS.UNAVAILABLE;
  }
  
  if (statusLower === 'preparing' || statusLower === 'finishing' || 
      statusLower === 'suspendedevse' || statusLower === 'suspended') {
    return STATUS_COLORS.PREPARING;
  }
  
  return STATUS_COLORS.DEFAULT;
};

const getStatusDisplayText = (status) => status || 'Unknown';

const getStationDisplayName = (station) => {
  if (!station) return '';
  if (station.stationName === station.referNo) {
    return station.stationName;
  }  
  if (station.stationName && station.referNo) {
    return `${station.stationName} (${station.referNo})`;
  }  
  return station.stationName || station.referNo || `Station ${station.id}`;
};

const formatDuration = (seconds) => {
  if (!seconds) return '';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};

const ensureChargingScheduleArray = (profile) => {
  if (!profile.csChargingProfiles || !Array.isArray(profile.csChargingProfiles)) {
    return { csChargingProfiles: [] };
  }  
  return {
    ...profile,
    csChargingProfiles: profile.csChargingProfiles.map(cp => ({
      ...cp,
      chargingSchedule: Array.isArray(cp.chargingSchedule) 
        ? cp.chargingSchedule 
        : cp.chargingSchedule ? [cp.chargingSchedule] : []
    }))
  };
};

const ErrorState = ({ error }) => (
  <Alert variant="destructive" className="border border-red-200 bg-red-50">
    <ExclamationTriangleIcon className="h-5 w-5" />
    <AlertTitle className="font-medium">Connection Error</AlertTitle>
    <AlertDescription>
      Failed to load stations: {error || 'Unknown error occurred'}
    </AlertDescription>
  </Alert>
);

const ResponseDialog = ({ open, onClose, response, error }) => {
  const isSuccess = response?.status === 'Accepted';
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border border-gray-200">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="flex items-center gap-3 font-medium">
            {isSuccess ? (
              <CheckCircledIcon className="h-5 w-5 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            )}
            Command {isSuccess ? 'Successfully Executed' : 'Failed'}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="pt-6">
          <div className={`p-4 rounded-lg ${
            isSuccess
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <strong>Response:</strong> 
            <div className="mt-1">{response?.message || error}</div>
          </div>
          {isSuccess && (
            <div className="mt-3 text-sm text-gray-600 text-center">
              Your command has been processed successfully by the charging station.
            </div>
          )}
          
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-2"
            >
              Close
            </Button>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

const ChargingProfileConfiguration = ({
  chargingProfilePurpose,
  setChargingProfilePurpose,
  chargingProfileKind,
  setChargingProfileKind,
  recurrencyKind,
  setRecurrencyKind,
  chargingRateUnit,
  setChargingRateUnit,
  validFrom,
  setValidFrom,
  validTo,
  setValidTo,
  duration,
  setDuration,
  stackLevel,
  setStackLevel,
  transactionId,
  setTransactionId,
  chargingSchedulePeriods,
  setChargingSchedulePeriods,
  usePriceCalculation,
}) => {
  const addChargingSchedulePeriod = useCallback(() => {
    setChargingSchedulePeriods(prev => [
      ...prev,
      { startPeriod: 0, limit: 16.0, numberPhases: 1 }
    ]);
  }, [setChargingSchedulePeriods]);

  const removeChargingSchedulePeriod = useCallback((index) => {
    if (chargingSchedulePeriods.length > 1) {
      setChargingSchedulePeriods(prev => prev.filter((_, i) => i !== index));
    }
  }, [chargingSchedulePeriods.length, setChargingSchedulePeriods]);

  const updateChargingSchedulePeriod = useCallback((index, field, value) => {
    setChargingSchedulePeriods(prev => 
      prev.map((period, i) => 
        i === index ? { ...period, [field]: value } : period
      )
    );
  }, [setChargingSchedulePeriods]);

  return (
    <Card className="bg-gray-50 border-gray-200 shadow-sm mt-6">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-3">
          <LightningBoltIcon className="h-5 w-5 text-gray-600" />
          Set Charging Profile Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            Stack Level *
          </Label>
          <Input 
            type="number"
            placeholder="Enter stack level"
            value={stackLevel}
            onChange={(e) => setStackLevel(parseInt(e.target.value) || 1)}
            className="h-12 bg-white border border-gray-300 focus:border-gray-400"
            min="0"
            max="10"
          />
          <p className="text-xs text-gray-500">
            Priority level (0-10) - higher values have higher priority
          </p>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            Charging Profile Purpose *
          </Label>
          <Select 
            value={chargingProfilePurpose} 
            onValueChange={setChargingProfilePurpose}
          >
            <SelectTrigger className="h-12 bg-white border border-gray-300 focus:border-gray-400">
              <SelectValue placeholder="Select profile purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TxDefaultProfile">TxDefaultProfile (Default for transactions)</SelectItem>
              <SelectItem value="TxProfile">TxProfile (Specific transaction)</SelectItem>
              <SelectItem value="ChargePointMaxProfile">ChargePointMaxProfile (Station maximum)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            {chargingProfilePurpose === CHARGING_PROFILE_PURPOSES.CHARGE_POINT_MAX_PROFILE 
              ? 'Applied to entire station (connectorId: 0)' 
              : 'Applied to selected connector'}
          </p>
        </div>

        {chargingProfilePurpose === CHARGING_PROFILE_PURPOSES.TX_PROFILE && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Transaction ID *
            </Label>
            <Input 
              type="number"
              placeholder="Enter transaction ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="h-12 bg-white border border-gray-300 focus:border-gray-400"
              min="1"
            />
            <p className="text-xs text-gray-500">
              Required for TxProfile - enter the active transaction ID
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            Charging Profile Kind *
          </Label>
          <Select 
            value={chargingProfileKind} 
            onValueChange={setChargingProfileKind}
          >
            <SelectTrigger className="h-12 bg-white border border-gray-300 focus:border-gray-400">
              <SelectValue placeholder="Select profile kind" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Absolute">Absolute (Specific time period)</SelectItem>
              <SelectItem value="Recurring">Recurring (Repeating pattern)</SelectItem>
              <SelectItem value="Relative">Relative (From transaction start)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {chargingProfileKind === CHARGING_PROFILE_KINDS.RECURRING && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Recurrency Kind *
            </Label>
            <Select 
              value={recurrencyKind} 
              onValueChange={setRecurrencyKind}
            >
              <SelectTrigger className="h-12 bg-white border border-gray-300 focus:border-gray-400">
                <SelectValue placeholder="Select recurrency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Valid From
            </Label>
            <Input 
              type="datetime-local"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="h-12 bg-white border border-gray-300 focus:border-gray-400"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Valid To
            </Label>
            <Input 
              type="datetime-local"
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
              className="h-12 bg-white border border-gray-300 focus:border-gray-400"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-gray-700">
              Charging Schedule
            </Label>
            <Button
              type="button"
              onClick={addChargingSchedulePeriod}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              size="sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Period
            </Button>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Duration (seconds) {usePriceCalculation && "✓"}
            </Label>
            <Input 
              type="number"
              placeholder="e.g., 3600 for 1 hour, 86400 for 24 hours"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="h-12 bg-white border border-gray-300 focus:border-gray-400"
              disabled={usePriceCalculation}
            />
            {duration && (
              <p className="text-xs text-gray-600">
                Equivalent to: {formatDuration(parseInt(duration))}
              </p>
            )}
            {usePriceCalculation && (
              <p className="text-xs text-green-600">
                Duration is automatically set from price calculation
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Charging Rate Unit *
            </Label>
            <Select 
              value={chargingRateUnit} 
              onValueChange={setChargingRateUnit}
            >
              <SelectTrigger className="h-12 bg-white border border-gray-300 focus:border-gray-400">
                <SelectValue placeholder="Select rate unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Amperes (A)</SelectItem>
                <SelectItem value="W">Watts (W)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">
              Charging Schedule Periods
            </Label>
            {chargingSchedulePeriods.map((period, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-gray-700">Period {index + 1}</span>
                  {chargingSchedulePeriods.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeChargingSchedulePeriod(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-gray-600">Start Period (seconds)</Label>
                    <Input 
                      type="number"
                      value={period.startPeriod}
                      onChange={(e) => updateChargingSchedulePeriod(index, 'startPeriod', parseInt(e.target.value) || 0)}
                      className="h-10 bg-white border border-gray-300 focus:border-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-gray-600">Limit ({chargingRateUnit})</Label>
                    <Input 
                      type="number"
                      step="0.1"
                      value={period.limit}
                      onChange={(e) => updateChargingSchedulePeriod(index, 'limit', parseFloat(e.target.value) || 0)}
                      className="h-10 bg-white border border-gray-300 focus:border-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-gray-600">Number of Phases</Label>
                    <Input 
                      type="number"
                      min="1"
                      max="3"
                      value={period.numberPhases}
                      onChange={(e) => updateChargingSchedulePeriod(index, 'numberPhases', parseInt(e.target.value) || 1)}
                      className="h-10 bg-white border border-gray-300 focus:border-gray-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OCPPCommands = ({ 
  selectedStation, 
  selectedPort, 
  selectedSetting, 
  onSettingSelect,
  renderSettingInputs,
  onSubmit,
  requestStatus 
}) => {
  const getCurrentButtonColor = useCallback(() => 
    selectedSetting 
      ? OCPP_SETTINGS[selectedSetting]?.buttonColor || 'bg-gradient-to-r from-green-500 to-emerald-600'
      : 'bg-gradient-to-r from-green-500 to-emerald-600'
  , [selectedSetting]);

  return (
    <Card className="border border-gray-200 bg-white rounded-none">
      <CardHeader className="pb-4 bg-gray-50 border-b">
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-3">
          <LightningBoltIcon className="h-5 w-5 text-gray-600" />
          OCPP Commands
          <div className="flex gap-2 ml-auto">
            <Badge variant="outline" className="bg-white text-gray-700 border-gray-300">
              {selectedStation.stationName}
            </Badge>
            <Badge className="bg-gray-100 text-gray-800 border-0">
              {selectedPort.portName}
            </Badge>
            <Badge className={`${getStatusColor(selectedPort.status)} border-0 hover:bg-inherit`}>
              {getStatusDisplayText(selectedPort.status)}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-4">
          <Label className="text-base font-medium text-gray-700">
            Select Command Type
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(OCPP_SETTINGS).map(([key, setting]) => (
              <div
                key={key}
                className={`py-3 px-1 text-sm rounded-lg border cursor-pointer transition-all ${
                  selectedSetting === key 
                    ? `${setting.cardColor} border-gray-400` 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onSettingSelect(key)}
              >
                <div className={`text-center font-medium ${
                  selectedSetting === key ? 'text-gray-800' : 'text-gray-700'
                }`}>
                  {key}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedSetting && renderSettingInputs()}

        {selectedSetting && (
          <Button 
            onClick={onSubmit} 
            disabled={requestStatus === 'loading'}
            className={`w-full h-12 text-white font-medium transition-all ${getCurrentButtonColor()}`}
          >
            {requestStatus === 'loading' ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Sending Command...
              </>
            ) : (
              `Send ${selectedSetting}`
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const OCPP = () => {
  const { stations, status, requestStatus, requestResponse, requestError, dispatch } = useStationData();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(''); 
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedPort, setSelectedPort] = useState(null);
  const [selectedSetting, setSelectedSetting] = useState('');
  const [requestData, setRequestData] = useState({});
  const [showResponse, setShowResponse] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAutoSelected, setIsAutoSelected] = useState(false); // ✅ ఈ line add చేయండి

  const [chargingProfilePurpose, setChargingProfilePurpose] = useState(CHARGING_PROFILE_PURPOSES.TX_DEFAULT_PROFILE);
  const [chargingProfileKind, setChargingProfileKind] = useState(CHARGING_PROFILE_KINDS.RECURRING);
  const [recurrencyKind, setRecurrencyKind] = useState('Daily');
  const [chargingRateUnit, setChargingRateUnit] = useState(CHARGING_RATE_UNITS.AMPERES);
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [duration, setDuration] = useState('');
  const [stackLevel, setStackLevel] = useState(1);
  const [transactionId, setTransactionId] = useState('');
  const [chargingSchedulePeriods, setChargingSchedulePeriods] = useState([
    { startPeriod: 0, limit: 16.0, numberPhases: 1 }
  ]);

  const [amount, setAmount] = useState('');
  const [pricePerKwh, setPricePerKwh] = useState('');
  const [chargingPower, setChargingPower] = useState('');
  const [calculatedDuration, setCalculatedDuration] = useState('');
  const [usePriceCalculation, setUsePriceCalculation] = useState(false);

  const [showWebSocketLogs, setShowWebSocketLogs] = useState(false);
  const [isWebSocketLoggingEnabled, setIsWebSocketLoggingEnabled] = useState(false);
  const webSocketLogs = useSelector((state) => state.ocpp.webSocketLogs || []);
  const isWebSocketConnected = useSelector((state) => state.ocpp.isWebSocketConnected || false);

   const handleToggleWebSocketLogs = useCallback(() => {
    if (!isWebSocketLoggingEnabled) {
      setShowWebSocketLogs(true);
    }
    setIsWebSocketLoggingEnabled(!isWebSocketLoggingEnabled);
    dispatch(toggleWebSocketLogs(!isWebSocketLoggingEnabled));
  }, [isWebSocketLoggingEnabled, dispatch]);
  
  useEffect(() => {
    if (location.state?.selectedStationId && location.state?.selectedPortId) {
      console.log('🚀 OCPP: Received data from StationDetails:', location.state);
      const station = stations.find(s => s.id === location.state.selectedStationId);
      if (station) {
        const processedStation = {
          ...station,
          ports: (station.port || []).map(port => ({
            id: port.id,
            connectorId: port.connectorId,
            portName: port.connectorName || `Port ${port.connectorId}`,
            status: port.statusNotifcation?.[0]?.status ||
                   port.statusNotifcation?.status ||      
                   port.connectorStatus ||                
                   port.status ||                         
                   'Unknown',
            originalPort: port
          }))
        };
        
        setSelectedStation(processedStation);
        setSearchTerm(processedStation.stationName || '');        
        const port = processedStation.ports.find(p => p.id === location.state.selectedPortId);
        if (port) {
          setSelectedPort(port);
          setIsAutoSelected(true);
          navigate(location.pathname, { replace: true, state: {} });
        }
      }
    }
  }, [location.state, stations, navigate, location.pathname]);

  useEffect(() => {
    if (requestStatus === 'succeeded' || requestStatus === 'failed') {
      setShowResponse(true);
    }
  }, [requestStatus]);

  const calculateDurationFromAmount = useCallback(() => {
    if (!amount || !pricePerKwh || !chargingPower) {
      setCalculatedDuration('');
      return;
    }
    try {
      const amountValue = parseFloat(amount);
      const priceValue = parseFloat(pricePerKwh);
      const powerValue = parseFloat(chargingPower);

      if (amountValue <= 0 || priceValue <= 0 || powerValue <= 0) {
        setCalculatedDuration('');
        return;
      }
      const energyKwh = amountValue / priceValue;
      const timeHours = energyKwh / powerValue;
      const timeSeconds = Math.round(timeHours * 3600);
      
      setCalculatedDuration(timeSeconds.toString());
      
      if (usePriceCalculation) {
        setDuration(timeSeconds.toString());
      }
    } catch (error) {
      console.error('Error calculating duration:', error);
      setCalculatedDuration('');
    }
  }, [amount, pricePerKwh, chargingPower, usePriceCalculation]);

  useEffect(() => {
    calculateDurationFromAmount();
  }, [calculateDurationFromAmount]);

  const buildChargingProfileRequest = useCallback(() => {
    const chargingSchedule = [{
      duration: parseInt(duration) || 86400,
      chargingRateUnit: chargingRateUnit,
      chargingSchedulePeriod: chargingSchedulePeriods,
      startSchedule: validFrom || new Date().toISOString(),
      minChargingRate: 0
    }];

    const csChargingProfiles = {
      stackLevel: parseInt(stackLevel) || 1,
      chargingProfilePurpose: chargingProfilePurpose,
      chargingProfileKind: chargingProfileKind,
      chargingSchedule: chargingSchedule,
    };

    if (validFrom) csChargingProfiles.validFrom = validFrom;
    if (validTo) csChargingProfiles.validTo = validTo;

    if (chargingProfileKind === CHARGING_PROFILE_KINDS.RECURRING) {
      csChargingProfiles.recurrencyKind = recurrencyKind;
    }

    if (chargingProfilePurpose === CHARGING_PROFILE_PURPOSES.TX_PROFILE && transactionId) {
      csChargingProfiles.transactionId = parseInt(transactionId);
    }

    const request = {
      stationId: selectedStation.id,
      portId: selectedPort.id,
      connectorId: chargingProfilePurpose === CHARGING_PROFILE_PURPOSES.CHARGE_POINT_MAX_PROFILE ? 0 : selectedPort.connectorId,
      requestType: 'SetChargingProfile',
      clientId: "Portal",
      portalReqID: `SCP-REQ-${Date.now()}`,
      startTimeStamp: new Date().toISOString(),
      csChargingProfiles: [csChargingProfiles]
    };

    return ensureChargingScheduleArray(request);
  }, [
    duration,
    chargingRateUnit,
    chargingSchedulePeriods,
    validFrom,
    validTo,
    stackLevel,
    chargingProfilePurpose,
    chargingProfileKind,
    recurrencyKind,
    transactionId,
    selectedStation,
    selectedPort
  ]);

  const handleStationSelect = useCallback((stationId) => {
    if (!stationId || !Array.isArray(stations)) return;
    const station = stations.find((s) => s?.id?.toString() === stationId.toString());

    if (station) {
      const processedStation = {
        ...station,
        ports: (station.port || []).map(port => ({
          id: port.id,
          connectorId: port.connectorId,
          portName: port.connectorName || `Port ${port.connectorId}`,
          status: port.statusNotifcation?.[0]?.status ||
                 port.statusNotifcation?.status ||      
                 port.connectorStatus ||                
                 port.status ||                         
                 'Unknown'
        }))
      };
      
      setSelectedStation(processedStation);
      setSelectedPort(null);
      setSelectedSetting('');
      setRequestData({});
      setShowResponse(false);
      setSearchTerm('');
    }
  }, [stations]);

  const handlePortSelect = useCallback((portId) => {
    if (!selectedStation?.ports) return;

    const port = selectedStation.ports.find(p => p.id.toString() === portId);
    if (port) {
      setSelectedPort(port);
      setShowResponse(false);
    }
  }, [selectedStation]);

  const handleSettingSelect = useCallback((setting) => {
    if (!selectedStation || !selectedPort) return;
    
    setSelectedSetting(setting);

    const requestObj = {
      stationId: selectedStation.id,
      portId: selectedPort.id,
      connectorId: selectedPort.connectorId,
      requestType: setting,
      clientId: "Portal",
      portalReqID: `CA-REQ-${Date.now()}`,
      startTimeStamp: new Date().toISOString()
    };

    if (setting === 'RemoteStart') {

      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      setStartDate(formatLocalDateTime(now));
setEndDate(formatLocalDateTime(oneHourLater));
      
     
    }

    if (setting === 'ChangeAvailability') {
      requestObj.type = 'Operative';
    }

    setRequestData(requestObj);
    setShowResponse(false);
  }, [selectedStation, selectedPort]);

  const handleSettingValueChange = useCallback((field, value) => {
    setRequestData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!requestData.requestType) return;
    setShowResponse(false);
    dispatch(clearRequestResponse());
    let finalRequest = { ...requestData };
    if (selectedSetting === 'RemoteStart') {
     



const convertTime = (localDateTime) => {
  if (!localDateTime) return null;

  const date = new Date(localDateTime);

  const adjusted = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));

  return adjusted.toISOString();
};

if (startDate) {
  finalRequest.startDate = convertTime(startDate);
}

if (endDate) {
  finalRequest.endDate = convertTime(endDate);
}

finalRequest.userId = 1; 
    }
    
    if (selectedSetting === 'SetChargingProfile') {
      finalRequest = buildChargingProfileRequest();
    }
    dispatch(sendOcppRequest(finalRequest));
  }, [
    requestData, 
    selectedSetting, 
    dispatch, 
    buildChargingProfileRequest,
    startDate,
    endDate
  ]);

  const handleCloseResponse = useCallback(() => {
    setShowResponse(false);
    dispatch(clearRequestResponse());
  }, [dispatch]);

  const handleBackToStationDetails = () => {
    if (selectedStation && selectedPort) {
      navigate(`/stations/${selectedStation.id}`, {
        state: { 
          scrollToPort: selectedPort.id,
          activeTab: 'ports' 
        }
      });
    } else {
      navigate('/stations');
    }
  };

  const StationSearch = ({ 
    stations, 
    selectedStation, 
    onStationSelect, 
    searchTerm, 
    onSearchChange,
    isDropdownOpen,
    onDropdownToggle 
  }) => {
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    
    useClickOutside(dropdownRef, () => onDropdownToggle(false));

    const filteredStations = useMemo(() => 
      stations.filter(station => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          station.stationName?.toLowerCase().includes(searchLower) ||
          station.referNo?.toLowerCase().includes(searchLower) ||
          station.id?.toString().includes(searchLower)
        );
      }),
      [stations, searchTerm]
    );

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-base font-medium text-gray-700">
            Select Charging Station *
          </Label>
        </div>

        <div className="relative">
          <div className="relative" ref={inputRef}>
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <Input
              type="text"
              placeholder="Search and select station..."
              value={selectedStation ? getStationDisplayName(selectedStation) : searchTerm}
              onChange={onSearchChange}
              onFocus={() => onDropdownToggle(true)}
              onClick={() => onDropdownToggle(true)}
              className="pl-10 pr-10 h-12 bg-white border border-gray-300 focus:border-gray-400 cursor-text"
            />
            <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {isDropdownOpen && (
            <div 
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
              ref={dropdownRef}
            >
              {filteredStations.length > 0 ? (
                filteredStations.map(station => (
                  <div
                    key={station.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      selectedStation?.id === station.id ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => {
                      onStationSelect(station.id.toString());
                      onDropdownToggle(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {getStationDisplayName(station)}
                      </span>
                      {station.stationName !== station.referNo && station.referNo && (
                        <span className="text-sm text-gray-500">Ref: {station.referNo}</span>
                      )}
                      {station.port && (
                        <span className="text-xs text-gray-400">
                          {station.port.length} connector(s)
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No stations found matching "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const PortSelection = ({ station, selectedPort, onPortSelect }) => {
    if (!station?.ports?.length) {
      return (
        <Alert variant="destructive" className="border border-red-200 bg-red-50">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle className="font-medium">No Connectors Available</AlertTitle>
          <AlertDescription>
            This station doesn't have any available connectors.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Card className="bg-white border border-gray-200 rounded-none">
        <CardHeader className="pb-4 bg-gray-50 border-b">
          <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-3">
            <MixerVerticalIcon className="h-5 w-5 text-gray-600" />
            Available Connectors
            <Badge variant="outline" className="bg-white text-gray-700 border-gray-300">
              {station.ports.length} Ports
            </Badge>
            <span className="text-gray-600 ml-auto">
              {station.stationName}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <RadioGroup 
            onValueChange={onPortSelect}
            value={selectedPort?.id?.toString()}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {station.ports.map(port => (
              <div 
                key={port.id} 
                className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedPort?.id === port.id 
                    ? isAutoSelected && selectedPort?.id === port.id
                      ? 'border-blue-400 bg-blue-50 shadow-sm ring-2 ring-blue-200'
                      : 'border-gray-400 bg-gray-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <RadioGroupItem 
                  value={port.id.toString()} 
                  id={`port-${port.id}`}
                  className="text-gray-600"
                />
                <Label 
                  htmlFor={`port-${port.id}`} 
                  className="flex-1 cursor-pointer ml-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                        {port.portName}
                        {isAutoSelected && selectedPort?.id === port.id && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            Auto
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Connector ID: <span className="font-normal">{port.connectorId}</span></div>
                        <div>Port ID: <span className="font-normal">{port.id}</span></div>
                      </div>
                    </div>
                    <Badge 
                      className={`border text-sm font-normal px-2 py-1 ${getStatusColor(port.status)} hover:bg-inherit`}
                    >
                      {getStatusDisplayText(port.status)}
                    </Badge>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    );
  };

  const renderSettingInputs = useCallback(() => {
    const setting = OCPP_SETTINGS[selectedSetting];
    if (!setting) return null;

    if (selectedSetting === 'SetChargingProfile') {
      return (
        <ChargingProfileConfiguration
          chargingProfilePurpose={chargingProfilePurpose}
          setChargingProfilePurpose={setChargingProfilePurpose}
          chargingProfileKind={chargingProfileKind}
          setChargingProfileKind={setChargingProfileKind}
          recurrencyKind={recurrencyKind}
          setRecurrencyKind={setRecurrencyKind}
          chargingRateUnit={chargingRateUnit}
          setChargingRateUnit={setChargingRateUnit}
          validFrom={validFrom}
          setValidFrom={setValidFrom}
          validTo={validTo}
          setValidTo={setValidTo}
          duration={duration}
          setDuration={setDuration}
          stackLevel={stackLevel}
          setStackLevel={setStackLevel}
          transactionId={transactionId}
          setTransactionId={setTransactionId}
          chargingSchedulePeriods={chargingSchedulePeriods}
          setChargingSchedulePeriods={setChargingSchedulePeriods}
          usePriceCalculation={usePriceCalculation}
          calculatedDuration={calculatedDuration}
        />
      );
    }

    return (
      <Card className={`${setting.cardColor} shadow-sm mt-6`}>
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-3">
            <LightningBoltIcon className="h-5 w-5 text-gray-600" />
            {selectedSetting} Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {setting.requiresIdTag && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                IdTag (Phone Number or RFID No)*
              </Label>
              <Input 
                type="text" 
                placeholder="Enter IdTag"
                className="h-12 bg-white border border-gray-300 focus:border-gray-400"
                onChange={(e) => handleSettingValueChange('idTag', e.target.value)}
                required
              />
            </div>
          )}

          {setting.requiresStartEndDate && (
            <div className="space-y-4">
              <Label className="text-base font-medium text-gray-700">
                Charging Schedule
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Start Date & Time *
                  </Label>
                  <Input 
                    type="datetime-local"
                    value={startDate}
                  onChange={(e) => {
  setStartDate(e.target.value);
}}
                    className="h-12 bg-white border border-gray-300 focus:border-gray-400"
                    min={formatLocalDateTime(new Date())}
                  />
                  <p className="text-xs text-gray-500">
                    Scheduled start time for charging session
                  </p>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    End Date & Time *
                  </Label>
                  <Input 
                    type="datetime-local"
                    value={endDate}
                    

                    onChange={(e) => {
  setEndDate(e.target.value);
}}
                    className="h-12 bg-white border border-gray-300 focus:border-gray-400"
                    min={startDate || formatLocalDateTime(new Date())}
                  />
                  <p className="text-xs text-gray-500">
                    Scheduled end time for charging session
                  </p>
                </div>
              </div>
            </div>
          )}

          {setting.type && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Reset Type
              </Label>
              <Select onValueChange={(value) => handleSettingValueChange('type', value)}>
                <SelectTrigger className="h-12 bg-white border border-gray-300 focus:border-gray-400">
                  <SelectValue placeholder="Select reset type" />
                </SelectTrigger>
                <SelectContent>
                  {setting.type.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {setting.key && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Configuration Key
              </Label>
              <Select onValueChange={(value) => handleSettingValueChange('key', value)}>
                <SelectTrigger className="h-12 bg-white border border-gray-300 focus:border-gray-400">
                  <SelectValue placeholder="Select configuration key" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-72">
                    {setting.key.map(key => (
                      <SelectItem key={key} value={key}>
                        {key}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          )}

          {setting.value && requestData.key === 'AuthorizationRequired' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Value
              </Label>
              <Select onValueChange={(value) => handleSettingValueChange('value', value)}>
                <SelectTrigger className="h-12 bg-white border border-gray-300 focus:border-gray-400">
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  {setting.value.map(val => (
                    <SelectItem key={val.toString()} value={val}>
                      {val.toString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {setting.value && requestData.key !== 'AuthorizationRequired' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Value
              </Label>
              <Input 
                type="text" 
                placeholder="Enter value"
                className="h-12 bg-white border border-gray-300 focus:border-gray-400"
                onChange={(e) => handleSettingValueChange('value', e.target.value)}
              />
            </div>
          )}

          {setting.requiresCustomMessage && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Custom JSON / Message *
              </Label>
              <textarea
                rows={6}
                placeholder='Enter your custom OCPP JSON or string message'
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
                onChange={(e) => handleSettingValueChange('key', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Example: {"[2, '123', 'DataTransfer', {'vendorId': 'MyVendor', 'messageId': 'Test'}]"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }, [
    selectedSetting,
    chargingProfilePurpose,
    chargingProfileKind,
    recurrencyKind,
    chargingRateUnit,
    validFrom,
    validTo,
    duration,
    stackLevel,
    transactionId,
    chargingSchedulePeriods,
    usePriceCalculation,
    calculatedDuration,
    handleSettingValueChange,
    requestData.key,
    startDate,
    endDate
  ]);

  const filteredStations = useMemo(() => 
    stations.filter(station => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        station.stationName?.toLowerCase().includes(searchLower) ||
        station.referNo?.toLowerCase().includes(searchLower) ||
        station.id?.toString().includes(searchLower)
      );
    }),
    [stations, searchTerm]
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            OCPP Station Management
          </h1>
           {isAutoSelected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToStationDetails}
              className="text-sm"
            >
              ← Back
            </Button>
          )}
        </div>
        <Card className="shadow-sm border border-gray-200 bg-white rounded-none">
          <CardHeader className="bg-gray-50 border-b py-5">
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-3">
              <MixerVerticalIcon className="h-5 w-5 text-gray-600" />
              Charging Stations
              <Badge variant="outline" className="bg-white text-gray-700 border-gray-300">
                {filteredStations.length} of {stations.length} stations
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {status === 'loading' ? (
              <Loading />
            ) : status === 'failed' ? (
              <ErrorState error={requestError} />
            ) : (
              <>
                <StationSearch
                  stations={stations}
                  selectedStation={selectedStation}
                  onStationSelect={handleStationSelect}
                  searchTerm={searchTerm}
                  onSearchChange={(e) => setSearchTerm(e.target.value)}
                  isDropdownOpen={isDropdownOpen}
                  onDropdownToggle={setIsDropdownOpen}
                />

                {selectedStation && (
                  <PortSelection
                    station={selectedStation}
                    selectedPort={selectedPort}
                    onPortSelect={handlePortSelect}
                  />
                )}

                {selectedPort && (
                  <OCPPCommands
                    selectedStation={selectedStation}
                    selectedPort={selectedPort}
                    selectedSetting={selectedSetting}
                    onSettingSelect={handleSettingSelect}
                    onSettingValueChange={handleSettingValueChange}
                    requestData={requestData}
                    renderSettingInputs={renderSettingInputs}
                    onSubmit={handleSubmit}
                    requestStatus={requestStatus}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
        <ResponseDialog
          open={showResponse}
          onClose={handleCloseResponse}
          response={requestResponse}
          error={requestError}
        />
      </div>
    </div>
  );
};
export default OCPP;