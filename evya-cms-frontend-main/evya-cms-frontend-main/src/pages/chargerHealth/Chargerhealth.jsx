import { useEffect, useState, useMemo } from 'react';
import AxiosServices from '@/services/AxiosServices';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Battery, 
  AlertTriangle, 
  Info, 
  ChevronDown,
  Filter,
  Edit,
  CircleHelp
} from 'lucide-react';
import Loading from '@/users/Loading';
import { AddChargerHealth } from './AddChargerHealth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

function Chargerhealth() {
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCpId, setSelectedCpId] = useState(null);
  const [search, setSearch] = useState('');
  const [showStationDropdown, setShowStationDropdown] = useState(false);

  useEffect(() => {
    loadAllAlerts();
    loadStations();
  }, []);

  const loadAllAlerts = async () => {
    setLoading(true);
    try {
      const data = await AxiosServices.getAllAlerts();
      setAlerts(data || []);
      setSelectedCpId(null);
      setShowStationDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  const loadStations = async () => {
    const res = await AxiosServices.getStations({ page: 0, size: 100 });
    setStations(res.data || []);
  };

  const loadAlertsByCp = async (ocppId) => {
    setLoading(true);
    setSelectedCpId(ocppId);
    try {
      const data = await AxiosServices.getAlertsByCpId(ocppId);
      setAlerts(data || []);
      setShowStationDropdown(false);
    } catch (err) {
      console.error(err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChargerSuccess = (cpId) => {
    if (cpId) {
      loadAlertsByCp(cpId);
    } else {
      loadAllAlerts();
    }
  };

  const stats = useMemo(() => {
    const totalStations = stations.length;
    const stationsWithAlerts = new Set(alerts.map(a => a.cpId)).size;
    const healthyStations = totalStations - stationsWithAlerts;
    
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;
    const warningAlerts = alerts.filter(a => a.severity === 'WARNING').length;
    const infoAlerts = alerts.filter(a => a.severity === 'INFO').length;
    
    return {
      totalStations,
      healthyStations,
      stationsWithAlerts,
      criticalAlerts,
      warningAlerts,
      infoAlerts,
      healthPercentage: totalStations ? Math.round((healthyStations / totalStations) * 100) : 100
    };
  }, [stations, alerts]);

  const filteredStations = stations.filter(s =>
    s.stationName?.toLowerCase().includes(search.toLowerCase()) ||
    s.ocppid?.toLowerCase().includes(search.toLowerCase())
  );

  const getSeverityColor = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'WARNING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'INFO': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const stationNameMap = useMemo(() => {
    const map = {};
    stations.forEach(station => {
      if (station.ocppid) {
        map[station.ocppid] = station.stationName || station.ocppid;
      }
    });
    return map;
  }, [stations]);

  const getStationName = (cpId) => {
    return stationNameMap[cpId] || cpId;
  };
  const getSelectedStationName = () => {
    if (!selectedCpId) return 'All Stations';
    const station = stations.find(s => s.ocppid === selectedCpId);
    return station ? station.stationName : selectedCpId;
  };

 
const handleInfoClick = (alert) => {
  navigate(`/edit-alert/${alert.cpId}`, { 
    state: { 
      alert,
      stationName: getStationName(alert.cpId),
      cpId: alert.cpId 
    } 
  });
};

  const getStatusBadge = (status) => {
    if (!status) return 'outline';
    
    const statusLower = status.toLowerCase();
    switch(statusLower) {
      case 'open': return 'destructive';
      case 'inprogress': 
      case 'in progress': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'outline';
    }
  };

  // Format status text
  const formatStatus = (status) => {
    if (!status) return 'Open';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Charger Health Management</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm ">Overall Health</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{stats.healthPercentage}%</p>
                </div>
                <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center ${
                  stats.healthPercentage > 90 ? 'bg-green-50' :
                  stats.healthPercentage > 70 ? 'bg-amber-100' : 'bg-red-100'
                }`}>
                  <Battery className={`h-5 w-5 md:h-6 md:w-6 ${
                    stats.healthPercentage > 90 ? 'text-green-500' :
                    stats.healthPercentage > 70 ? 'text-amber-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
              <div className="mt-3 md:mt-4">
                <div className="h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      stats.healthPercentage > 90 ? 'bg-green-500' :
                      stats.healthPercentage > 70 ? 'bg-amber-500' : 'bg-red-50'
                    }`}
                    style={{ width: `${stats.healthPercentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm">Healthy Stations</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{stats.healthyStations}</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                </div>
              </div>
              <p className="text-xs md:text-sm mt-1 md:mt-2">out of {stats.totalStations} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm ">Critical Alerts</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{stats.criticalAlerts}</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
                </div>
              </div>
              <p className="text-xs md:text-sm mt-1 md:mt-2">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm">Active Stations</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{stats.stationsWithAlerts}</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs md:text-sm mt-1 md:mt-2">with active alerts</p>
            </CardContent>
          </Card>
        </div>

        {/* Single Card for Alerts */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <AlertCircle className="h-5 w-5 md:h-6 md:w-6" />
                  Alerts Overview
                </CardTitle>
                <CardDescription className="text-sm">
                  {selectedCpId 
                    ? `Showing alerts for: ${getSelectedStationName()}`
                    : ''
                  }
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Station Dropdown with Search */}
                <div className="relative">
                  <button
                    onClick={() => setShowStationDropdown(!showStationDropdown)}
                    className="flex items-center justify-between w-full sm:w-64 px-4 py-2.5 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium truncate">
                        {selectedCpId ? getSelectedStationName() : 'All Stations'}
                      </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${
                      showStationDropdown ? 'rotate-180' : ''
                    }`} />
                  </button>
                  
                  {/* Dropdown Content */}
                  {showStationDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50">
                      <div className="p-3 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search station..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto">
                        <button
                          onClick={() => {
                            loadAllAlerts();
                            setShowStationDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 ${
                            !selectedCpId ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${
                              !selectedCpId ? 'bg-blue-500' : 'bg-gray-300'
                            }`} />
                            <span className="font-medium">All Stations</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {stations.length}
                          </Badge>
                        </button>
                        
                        {filteredStations.map(st => {
                          const stationAlerts = alerts.filter(a => a.cpId === st.ocppid);
                          const hasCritical = stationAlerts.some(a => a.severity === 'CRITICAL');
                          
                          return (
                            <button
                              key={st.id}
                              onClick={() => {
                                loadAlertsByCp(st.ocppid);
                                setShowStationDropdown(false);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 ${
                                selectedCpId === st.ocppid ? 'bg-blue-50' : ''
                              } ${hasCritical ? 'border-l-4 border-l-red-500' : ''}`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {hasCritical ? (
                                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                )}
                                <div className="text-left overflow-hidden">
                                  <div className="font-medium truncate text-sm">{st.stationName}</div>
                                  <div className="text-xs text-gray-500 truncate">{st.ocppid}</div>
                                </div>
                              </div>
                              {stationAlerts.length > 0 && (
                                <Badge 
                                  variant={hasCritical ? "destructive" : "secondary"}
                                  className="ml-2 flex-shrink-0 text-xs"
                                >
                                  {stationAlerts.length}
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Add Charger Health Button */}
                <AddChargerHealth onSuccess={handleAddChargerSuccess} />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loading />
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-700 mb-2">
                  {selectedCpId
                    ? `Charger ${selectedCpId} is Healthy!`
                    : 'All Systems Operational!'
                  }
                </h3>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto py-4 ">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Station Name</TableHead>
                        <TableHead>Charger ID</TableHead>
                        <TableHead>Alert Description</TableHead>
                        <TableHead>Recommended Action</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Seen</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alerts.map(a => (
                        <TableRow 
                          key={a.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            {getStationName(a.cpId)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {a.cpId}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{a.issueCode}</div>
                              {a.description && (
                                <div className="text-sm text-gray-500 mt-1">{a.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{a.suggestion?.action}</div>
                              {a.suggestion?.reason && (
                                <div className="text-sm text-gray-500 mt-1 flex items-start gap-1">
                                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  {a.suggestion.reason}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`${getSeverityColor(a.severity)} border`}
                              variant="outline"
                            >
                              {a.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadge(a.status)}>
                              {formatStatus(a.status || 'Open')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{a.lastSeen}</div>
                            <div className="text-xs text-gray-500">Most recent</div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleInfoClick(a)}
                              className="h-8 w-8 p-0"
                              
                            >
                              <CircleHelp className="h-4 w-4 text-blue-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Chargerhealth;