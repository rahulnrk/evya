import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  sendOcppRequest, 
  clearRequestResponse 
} from '@/store/reducers/ocpp/ocppSlice';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Send,
  Search,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { 
  LightningBoltIcon,
  MixerHorizontalIcon 
} from "@radix-ui/react-icons";

const OCPP_SETTINGS = {
  RemoteStart: {
    requiresIdTag: true,
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

const OCPPControl = ({ station, ports, preselectedCommand, isDialogMode = false, onClose }) => {
  const dispatch = useDispatch();
  const { 
    requestStatus, 
    requestResponse, 
    requestError 
  } = useSelector((state) => state.ocpp);

  // State
  const [selectedPort, setSelectedPort] = useState(null);
  const [selectedSetting, setSelectedSetting] = useState(preselectedCommand || '');
  const [requestData, setRequestData] = useState({});
  const [showResponse, setShowResponse] = useState(false);
  
  // Charging Profile State
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

  // Effects
  useEffect(() => {
    if (ports?.length > 0 && !selectedPort) {
      const firstPort = processPortData(ports[0]);
      setSelectedPort(firstPort);
    }
  }, [ports]);

  useEffect(() => {
    if (preselectedCommand) {
      setSelectedSetting(preselectedCommand);
      if (selectedPort) {
        handleSettingSelect(preselectedCommand);
      }
    }
  }, [preselectedCommand, selectedPort]);

  useEffect(() => {
    if (requestStatus === 'succeeded' || requestStatus === 'failed') {
      setShowResponse(true);
    }
  }, [requestStatus]);

  // Helper Functions
  const processPortData = (port) => ({
    id: port.id,
    connectorId: port.connectorId,
    connectorName: port.connectorName || `Port ${port.connectorId}`,
    status: port.statusNotifcation?.[0]?.status ||
            port.statusNotifcation?.status ||
            port.connectorStatus ||
            port.status ||
            'Unknown',
    voltage: port.voltage_rating,
    current: port.current_rating,
    maxPower: port.max_power_kW,
    connectorType: port.connector_type,
    powerType: port.power_type
  });

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
  const handlePortSelect = useCallback((portId) => {
    if (!ports) return;
    
    const port = ports.find(p => p.id.toString() === portId);
    if (port) {
      const processedPort = processPortData(port);
      setSelectedPort(processedPort);
      setSelectedSetting('');
      setRequestData({});
      setShowResponse(false);
    }
  }, [ports]);

  const handleSettingSelect = useCallback((setting) => {
    if (!selectedPort) return;
    
    setSelectedSetting(setting);

    const requestObj = {
      stationId: station.id,
      portId: selectedPort.id,
      connectorId: selectedPort.connectorId,
      requestType: setting,
      clientId: "Portal",
      portalReqID: `CA-REQ-${Date.now()}`,
      startTimeStamp: new Date().toISOString()
    };

    if (setting === 'ChangeAvailability') {
      requestObj.type = 'Operative';
    }

    setRequestData(requestObj);
    setShowResponse(false);
  }, [selectedPort, station]);

  const handleSettingValueChange = useCallback((field, value) => {
    setRequestData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!requestData.requestType || !selectedPort) return;
    
    setShowResponse(false);
    dispatch(clearRequestResponse());
    
    const finalRequest = selectedSetting === 'SetChargingProfile' 
      ? buildChargingProfileRequest() 
      : requestData;

    console.log('Sending OCPP Request:', finalRequest);
    dispatch(sendOcppRequest(finalRequest));
  }, [requestData, selectedSetting, selectedPort, dispatch]);

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

    return {
      stationId: station.id,
      portId: selectedPort.id,
      connectorId: chargingProfilePurpose === CHARGING_PROFILE_PURPOSES.CHARGE_POINT_MAX_PROFILE ? 0 : selectedPort.connectorId,
      requestType: 'SetChargingProfile',
      clientId: "Portal",
      portalReqID: `SCP-REQ-${Date.now()}`,
      startTimeStamp: new Date().toISOString(),
      csChargingProfiles: [csChargingProfiles]
    };
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
    station,
    selectedPort
  ]);

  const handleCloseResponse = useCallback(() => {
    setShowResponse(false);
    dispatch(clearRequestResponse());
    
    // If in dialog mode and response is successful, close the dialog
    if (isDialogMode && requestResponse?.status === 'Accepted') {
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    }
  }, [dispatch, isDialogMode, requestResponse, onClose]);

  const handleCancel = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  // Render Functions
  const renderSettingInputs = useCallback(() => {
    const setting = OCPP_SETTINGS[selectedSetting];
    if (!setting) return null;

    if (selectedSetting === 'SetChargingProfile') {
      return (
        <Card className="bg-gray-50 border-gray-200 shadow-sm mt-6">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-3">
              <Zap className="h-5 w-5 text-gray-600" />
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

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Duration (seconds)
              </Label>
              <Input 
                type="number"
                placeholder="e.g., 3600 for 1 hour"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-12 bg-white border border-gray-300 focus:border-gray-400"
              />
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
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium text-gray-700">
                  Charging Schedule Periods
                </Label>
                <Button
                  type="button"
                  onClick={() => setChargingSchedulePeriods(prev => [
                    ...prev,
                    { startPeriod: 0, limit: 16.0, numberPhases: 1 }
                  ])}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Period
                </Button>
              </div>

              {chargingSchedulePeriods.map((period, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-700">Period {index + 1}</span>
                    {chargingSchedulePeriods.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => setChargingSchedulePeriods(prev => 
                          prev.filter((_, i) => i !== index)
                        )}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-gray-600">Start Period (seconds)</Label>
                      <Input 
                        type="number"
                        value={period.startPeriod}
                        onChange={(e) => {
                          const newPeriods = [...chargingSchedulePeriods];
                          newPeriods[index].startPeriod = parseInt(e.target.value) || 0;
                          setChargingSchedulePeriods(newPeriods);
                        }}
                        className="h-10 bg-white border border-gray-300 focus:border-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-gray-600">Limit ({chargingRateUnit})</Label>
                      <Input 
                        type="number"
                        step="0.1"
                        value={period.limit}
                        onChange={(e) => {
                          const newPeriods = [...chargingSchedulePeriods];
                          newPeriods[index].limit = parseFloat(e.target.value) || 0;
                          setChargingSchedulePeriods(newPeriods);
                        }}
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
                        onChange={(e) => {
                          const newPeriods = [...chargingSchedulePeriods];
                          newPeriods[index].numberPhases = parseInt(e.target.value) || 1;
                          setChargingSchedulePeriods(newPeriods);
                        }}
                        className="h-10 bg-white border border-gray-300 focus:border-gray-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={`${setting.cardColor} shadow-sm mt-6`}>
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-3">
            <Zap className="h-5 w-5 text-gray-600" />
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
    handleSettingValueChange,
    requestData.key
  ]);

  const ResponseDialog = () => (
    <Dialog open={showResponse} onOpenChange={handleCloseResponse}>
      <DialogContent className="sm:max-w-md border border-gray-200">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="flex items-center gap-3 font-medium">
            {requestResponse?.status === 'Accepted' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            Command {requestResponse?.status === 'Accepted' ? 'Successfully Executed' : 'Failed'}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="pt-6">
          <div className={`p-4 rounded-lg ${
            requestResponse?.status === 'Accepted'
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <strong>Response:</strong> 
            <div className="mt-1">{requestResponse?.message || requestError}</div>
          </div>
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={handleCloseResponse}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-2"
            >
              Close
            </Button>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );

  if (!ports?.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Ports Available</AlertTitle>
        <AlertDescription>
          This station doesn't have any ports configured for OCPP control.
        </AlertDescription>
      </Alert>
    );
  }

  if (isDialogMode) {
    return (
      <div className="space-y-6">
        {selectedPort && (
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">{selectedPort.connectorName}</div>
                  <div className="text-sm text-gray-600">
                    Connector ID: {selectedPort.connectorId} • Power: {selectedPort.maxPower || '-'} kW
                  </div>
                </div>
                <Badge 
                  className={`border text-sm font-normal px-2 py-1 ${getStatusColor(selectedPort.status)} hover:bg-inherit`}
                >
                  {getStatusDisplayText(selectedPort.status)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedSetting ? (
          <>
            {renderSettingInputs()}
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1 h-12 border-gray-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={requestStatus === 'loading'}
                className={`flex-1 h-12 text-white font-medium ${
                  OCPP_SETTINGS[selectedSetting]?.buttonColor || 'bg-gradient-to-r from-green-500 to-emerald-600'
                }`}
              >
                {requestStatus === 'loading' ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending Command...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send {selectedSetting} Command
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select OCPP Command
              </h3>
              <p className="text-gray-600 mb-6">
                Please select a command from the dropdown to configure and send.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(OCPP_SETTINGS).map(([key, setting]) => (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSetting === key 
                        ? `${setting.cardColor} border-gray-400 shadow-md` 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSettingSelect(key)}
                  >
                    <div className={`text-center font-medium ${
                      selectedSetting === key ? 'text-gray-800' : 'text-gray-700'
                    }`}>
                      {key}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        <ResponseDialog />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-gray-200">
        <CardHeader className="pb-4 bg-gray-50 border-b">
          <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-3">
            <Settings className="h-5 w-5 text-gray-600" />
            Select Port for OCPP Control
            <Badge variant="outline" className="bg-white text-gray-700 border-gray-300">
              {ports.length} Ports Available
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <RadioGroup 
            onValueChange={handlePortSelect}
            value={selectedPort?.id?.toString()}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {ports.map(port => {
              const processedPort = processPortData(port);
              return (
                <div 
                  key={port.id} 
                  className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedPort?.id === port.id 
                      ? 'border-gray-400 bg-gray-50 shadow-sm' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem 
                    value={port.id.toString()} 
                    id={`port-ocpp-${port.id}`}
                    className="text-gray-600"
                  />
                  <Label 
                    htmlFor={`port-ocpp-${port.id}`} 
                    className="flex-1 cursor-pointer ml-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">
                          {processedPort.connectorName}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Connector ID: <span className="font-normal">{processedPort.connectorId}</span></div>
                          <div>Power: <span className="font-normal">{processedPort.maxPower || '-'} kW</span></div>
                        </div>
                      </div>
                      <Badge 
                        className={`border text-sm font-normal px-2 py-1 ${getStatusColor(processedPort.status)} hover:bg-inherit`}
                      >
                        {getStatusDisplayText(processedPort.status)}
                      </Badge>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* OCPP Commands */}
      {selectedPort && (
        <Card className="border border-gray-200 bg-white">
          <CardHeader className="pb-5 bg-gray-50 border-b">
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-3">
              <Zap className="h-5 w-5 text-gray-600" />
              OCPP Commands
              <div className="flex gap-2 ml-auto">
                <Badge variant="outline" className="bg-white text-gray-700 border-gray-300">
                  {station.stationName}
                </Badge>
                <Badge className="bg-gray-100 text-gray-800 border-0">
                  {selectedPort.connectorName}
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(OCPP_SETTINGS).map(([key, setting]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedSetting === key 
                        ? `${setting.cardColor} border-gray-400 shadow-md` 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSettingSelect(key)}
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
                onClick={handleSubmit} 
                disabled={requestStatus === 'loading'}
                className={`w-full h-12 text-white font-medium transition-all ${
                  OCPP_SETTINGS[selectedSetting]?.buttonColor || 'bg-gradient-to-r from-green-500 to-emerald-600'
                }`}
              >
                {requestStatus === 'loading' ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending Command...
                  </>
                ) : (
                  `Send ${selectedSetting}`
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      <ResponseDialog />
    </div>
  );
};

export default OCPPControl;
