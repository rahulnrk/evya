import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ReloadIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import AxiosServices from '@/services/AxiosServices';
import { useToast } from "@/components/ui/use-toast";
import Loading from '@/users/Loading';

export default function EditAlertPage() {
  const navigate = useNavigate();
  const { cpId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useSelector(state => state.authentication);

  const [alerts, setAlerts] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('open');
  const [selectedSeverity, setSelectedSeverity] = useState('INFO');

  // Load alerts data by cpId
  const fetchAlertsByCpId = async () => {
    try {
      setIsLoading(true);
      const response = await AxiosServices.getAlertsByCpId(cpId);
      setAlerts(response.data || []);
      
      if (response.data && response.data.length > 0) {
        const alert = response.data[0];
        setCurrentAlert(alert);
        setSelectedStatus(alert.status || 'open');
        setSelectedSeverity(alert.severity || 'INFO');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch alert details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.alert) {
      setCurrentAlert(location.state.alert);
      setAlerts([location.state.alert]);
      setSelectedStatus(location.state.alert.status || 'open');
      setSelectedSeverity(location.state.alert.severity || 'INFO');
      setIsLoading(false);
    } else {
      fetchAlertsByCpId();
    }
  }, [cpId, location.state]);

  const handleSave = async () => {
    setButtonLoading(true);
    try {
      const updatePromises = alerts.map(alert => 
        AxiosServices.updateAlert(alert.id, {
          ...alert,
          status: selectedStatus,
          severity: selectedSeverity,
          modifiedBy: user?.id,
          modifiedDate: new Date().toISOString()
        })
      );
      
      await Promise.all(updatePromises);
      
      toast({
        title: "Success",
        description: `Updated ${alerts.length} alert(s) successfully`,
      });
      navigate('/charger-health');
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update alerts",
        variant: "destructive",
      });
    } finally {
      setButtonLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return 'destructive';
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

  const getSeverityBadge = (severity) => {
    if (!severity) return 'outline';
    const severityLower = severity.toLowerCase();
    switch(severityLower) {
      case 'critical': return 'destructive';
      case 'warning': return 'warning';
      case 'high': return 'default';
      default: return 'outline';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Open';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const formatSeverity = (severity) => {
    if (!severity) return 'Info';
    return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleAlertSelect = (alert) => {
    setCurrentAlert(alert);
    setSelectedStatus(alert.status || 'open');
    setSelectedSeverity(alert.severity || 'INFO');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Loading/>
      </div>
    );
  }

  if (!currentAlert || alerts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="p-8 text-center rounded-lg border">
          <h2 className="text-xl font-semibold text-gray-800">No alerts found for this charger</h2>
          <Button 
            onClick={() => navigate('/charger-health')} 
            className="mt-4"
            variant="outline"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Charger Health
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
       <div className="mb-10 pb-6 border-b border-gray-200">
        <Button 
      variant="ghost" 
      size="m" 
      onClick={() => navigate(-1)} 
      className="hover:bg-gray-100 mt-1"
    >
      <ArrowLeftIcon className="h-10 w-4 mr-2" />
      Back
    </Button>
  <div className="flex items-start">
    
    <div className="flex-1">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
          Alert Details
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base text-gray-600">Charger ID:</span>
            <span className="text-base font-semibold text-gray-900">{cpId}</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-2">
            <span className="text-base text-gray-600">Station:</span>
            <span className="text-base font-semibold text-gray-900">
              {location.state?.stationName || cpId}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

          {alerts.length > 1 && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Select Alert</Label>
              <Select 
                value={currentAlert.id} 
                onValueChange={(value) => {
                  const alert = alerts.find(a => a.id === value);
                  if (alert) handleAlertSelect(alert);
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select an alert" />
                </SelectTrigger>
                <SelectContent>
                  {alerts.map((alert, index) => (
                    <SelectItem key={alert.id} value={alert.id}>
                      Alert {index + 1}: {alert.issueCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-8">
           {/* Charger Information Section */}
          <div className="bg-white-50 p-6 rounded-lg border">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Charger Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Station Name</Label>
                <Input 
                  value={location.state?.stationName || cpId} 
                  disabled 
                  className="bg-white"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Charger ID</Label>
                <Input 
                  value={cpId} 
                  disabled 
                  className="bg-white font-mono"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">First Detected</Label>
                <div className="p-3 bg-white rounded border text-sm">
                  {formatDate(currentAlert.firstDetected)}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Last Seen</Label>
                <div className="p-3 bg-white rounded border text-sm">
                  {formatDate(currentAlert.lastSeen)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Alert Status and Severity Section */}
          <div className="bg-white-50 p-6 rounded-lg border">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Alert Status & Severity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Status */}
              <div>
                <div className="mb-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Current Status</Label>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={getStatusBadge(currentAlert.status)} 
                      className="text-sm px-3 py-1.5"
                    >
                      {formatStatus(currentAlert.status)}
                    </Badge>
                    <span className="text-gray-400">→</span>
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Update Status</Label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="inprogress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Severity */}
              <div>
                <div className="mb-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Current Severity</Label>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={getSeverityBadge(currentAlert.severity)} 
                      className="text-sm px-3 py-1.5"
                    >
                      {formatSeverity(currentAlert.severity)}
                    </Badge>
                    <span className="text-gray-400">→</span>
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Update Severity</Label>
                      <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                          <SelectItem value="WARNING">Warning</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="INFO">Info</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

         

          {/* Alert Details Section */}
          <div className="bg-white-50 p-6 rounded-lg border">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Alert Details</h2>
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Issue Code</Label>
                <Input 
                  value={currentAlert.issueCode} 
                  readOnly 
                  className="bg-white font-mono"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Description</Label>
                <Textarea
                  className="min-h-[120px] bg-white"
                  value={currentAlert.description || 'No description available'}
                  readOnly
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Recommended Action</Label>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-800 text-base">
                    {currentAlert.suggestion?.action || 'No specific action recommended'}
                  </h4>
                  {currentAlert.suggestion?.reason && (
                    <p className="text-sm text-gray-700 mt-2">{currentAlert.suggestion.reason}</p>
                  )}
                  {!currentAlert.suggestion?.action && !currentAlert.suggestion?.reason && (
                    <p className="text-sm text-gray-600 mt-2">
                      Please check the charger manually or contact technical support for further assistance.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => navigate('/chargerhealth')}
              className="px-8 hover:bg-gray-100"
              size="lg"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={buttonLoading} 
              className="px-8 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {buttonLoading ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}