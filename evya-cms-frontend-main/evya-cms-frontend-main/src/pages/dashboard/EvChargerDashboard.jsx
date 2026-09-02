import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';
import { fetchWhiteLabels, fetchFranchises, fetchDashboardStats, fetchRevenueGraph, fetchSessionGraph, fetchStationStats, fetchPortStats, setDateRange } from '@/store/reducers/dashboard/dashboardSlice';
import Loading from '@/users/Loading';
import { fetchRequestedData, fetchRequestedDataDb } from "@/store/reducers/requests/RequestsSlice";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const getDefaultStartDate = (range) => {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (range) {
    case 'daily':
      startDate.setDate(endDate.getDate() - 6);
      break;
    case 'weekly':
      startDate.setDate(endDate.getDate() - 29);
      break;
    case 'monthly':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case 'yearly':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 6);
  }
  
  return startDate.toISOString().split('T')[0];
};

const CustomizedLegend = ({ payload }) => {
  return (
    <div className="flex flex-col gap-2">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-sm">
            {entry.value}: {entry.payload.value || 0}
          </span>
        </div>
      ))}
    </div>
  );
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="middle"
      className="text-xs"
    >
      {value}
    </text>
  );
};

export function EVChargerDashboard() {
  const dispatch = useDispatch();
  const { whiteLabels, franchises, owners, stats, status, revenueGraph, sessionGraph, stationStats, portStats, dateRange } = useSelector(state => state.dashboard);
  const { user } = useSelector(state => state.authentication);
  const [selectedOrgId, setSelectedOrgId] = useState("");

  const effectiveOrgId = selectedOrgId && selectedOrgId !== "admin" 
  ? selectedOrgId 
  : user?.orgId?.toString();

  const selectedWhitelabel = whiteLabels?.find(wl => wl.id === parseInt(selectedOrgId));
  const selectedFranchise = owners?.find(f => f.id === parseInt(selectedOrgId));
  const orgName = selectedWhitelabel?.orgName || selectedFranchise?.orgName;

  const jsonRequests = useSelector(state => state.requests.jsonRequests);
  const dbRequests = useSelector(state => state.requests.dbRequests.requests || []);
 

  const [pendingStats, setPendingStats] = useState({
    pendingRequests: 0,
    pendingFranchises: 0,
    pendingSites: 0,
    pendingStations: 0
  });

  console.log("WhiteLabels:", whiteLabels);
  console.log("Franchises:", franchises);
  console.log("Selected Org ID:", selectedOrgId);
  
  const [selectedRange, setSelectedRange] = useState("daily");
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [localDates, setLocalDates] = useState({
    startDate: dateRange.startDate || '',
    endDate: dateRange.endDate || ''
  });

  const handleDateRangeSelection = (value) => {
    setSelectedRange(value);
    
    if (value === "custom") {
      setIsCustomRange(true);
      setLocalDates({ startDate: '', endDate: '' });
      return;
    }

    setIsCustomRange(false);
    const end = new Date();
    let start = new Date();

    switch (value) {
      case'all':
      break;
      case 'daily':
        start.setDate(end.getDate() - 6);
        break;
      case 'weekly':
        start.setDate(end.getDate() - 29);
        break;
      case 'monthly':
        start.setMonth(end.getMonth() - 6);
        break;
      case 'yearly':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        break;
    }

    const formatted = {
       startDate: value === 'all' ? null : start.toISOString().split('T')[0],
    endDate: value === 'all' ? null : end.toISOString().split('T')[0]
    };

    setLocalDates(formatted);
    dispatch(setDateRange(formatted));
    fetchData(formatted);
  };

  const fetchData = (dateRange) => {
     const params = {
    orgId: selectedOrgId,
    ...(dateRange.startDate && { startDate: dateRange.startDate }),
    ...(dateRange.endDate && { endDate: dateRange.endDate })
  };
    dispatch(fetchDashboardStats(effectiveOrgId));
    dispatch(fetchRevenueGraph(effectiveOrgId));
    dispatch(fetchSessionGraph(effectiveOrgId));
    dispatch(fetchStationStats(effectiveOrgId));
    dispatch(fetchPortStats(effectiveOrgId));

  };

  useEffect(() => {
    dispatch(fetchWhiteLabels());
      dispatch(fetchFranchises());

  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchRequestedData());
    dispatch(fetchRequestedDataDb({ page: 0, size: 1000 }));
  }, [dispatch]); 

useEffect(() => {
  if ((!dbRequests || dbRequests.length === 0) && (!jsonRequests || jsonRequests.length === 0)) return;
const dbCounts = { FRANCHISE: 0, SITE: 0, STATION: 0 };
const uniqueFranchiseNames = new Set();
const uniqueSiteNames = new Set();

(dbRequests || []).forEach(item => {
  const category = item.category?.toUpperCase();
  
  if (category === "FRANCHISE") {
    const fName = item.franchiseName?.trim()?.toUpperCase();
    if (fName) uniqueFranchiseNames.add(fName);
  } else if (category === "SITE") {
    const sName = item.siteName?.trim()?.toUpperCase();
    if (sName) uniqueSiteNames.add(sName);
  } else if (category === "STATION") {
    dbCounts.STATION++;
  }
});

dbCounts.FRANCHISE = uniqueFranchiseNames.size;
dbCounts.SITE = uniqueSiteNames.size;
const dbTotal = dbCounts.STATION;

  const uniqueMainFranchises = new Set();
  let jsonSiteCount = 0;
  let jsonStationCount = 0;

  (jsonRequests || []).forEach(siteObj => {
    const name = siteObj.managerName?.trim()?.toUpperCase() || "";

    if (name.startsWith("HPCL")) uniqueMainFranchises.add("HPCL");
    else if (name.startsWith("BPCL")) uniqueMainFranchises.add("BPCL");
    else if (name.startsWith("IOCL")) uniqueMainFranchises.add("IOCL");
    else if (name.startsWith("PRIVATE CPD")) uniqueMainFranchises.add("PRIVATE CPD");

    if (siteObj.siteName) jsonSiteCount++;

    if (Array.isArray(siteObj.stations) && siteObj.stations.length > 0) {
      jsonStationCount += siteObj.stations.length;
    } else {
      jsonStationCount++;
    }
  });

  const jsonCounts = {
    franchise: uniqueMainFranchises.size,
    site: jsonSiteCount,
    station: jsonStationCount,
    total: jsonStationCount,
  };

  setPendingStats({
    pendingFranchises: dbCounts.FRANCHISE + jsonCounts.franchise,
    pendingSites: dbCounts.SITE + jsonCounts.site,
    pendingStations: dbCounts.STATION + jsonCounts.station,
    pendingRequests: dbTotal + jsonCounts.total,
  });
}, [dbRequests, jsonRequests]);

useEffect(() => {
  if (effectiveOrgId) {
    const initialDateRange = {
      startDate: getDefaultStartDate(selectedRange),
      endDate: new Date().toISOString().split('T')[0]
    };
    dispatch(setDateRange(initialDateRange));
    fetchData(initialDateRange);
  }
}, [dispatch, effectiveOrgId]);

  const handleWhitelabelChange = (orgId) => {
  setSelectedOrgId(orgId); 
  setSelectedRange ("daily");
};

  if (status === 'loading') {
    return <div><Loading/></div>;
  }
  const portStatusData = portStats?.length
    ? portStats.map((item) => ({
        name: item.status,
        value: item.count,
      }))
    : [];

  const stationStatusData = stationStats?.length
    ? stationStats.map((item) => ({
        name: item.status,
        value: item.count,
      }))
    : [];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{orgName} Dashboard</h1>
        <div className="flex gap-2">
          <Select value={selectedRange} onValueChange={handleDateRangeSelection}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="all">All Days</SelectItem>
              <SelectItem value="daily">Last 7 Days</SelectItem>
              <SelectItem value="weekly">Last 30 Days</SelectItem>
              <SelectItem value="monthly">Last 6 Months</SelectItem>
              <SelectItem value="yearly">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {user?.orgId == 1 && (
            <Select onValueChange={handleWhitelabelChange} value={selectedOrgId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select Whitelabel" />
              </SelectTrigger>
              <SelectContent>
                {whiteLabels.map((wl) => (
                  <SelectItem key={wl.id} value={wl.id.toString()}>
                    {wl.orgName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      {isCustomRange && (
        <div className="flex items-end justify-end gap-4 mt-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={localDates.startDate}
              onChange={(e) => {
                const newStartDate = e.target.value;
                setLocalDates(prev => ({
                  ...prev,
                  startDate: newStartDate,
                  endDate: (prev.endDate && newStartDate > prev.endDate) ? '' : prev.endDate
                }));
              }}
              max={localDates.endDate || undefined}
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={localDates.endDate}
              onChange={(e) => {
                const newEndDate = e.target.value;
                setLocalDates(prev => ({
                  ...prev,
                  endDate: newEndDate,
                  startDate: (prev.startDate && newEndDate < prev.startDate) ? '' : prev.startDate
                }));
              }}
              min={localDates.startDate || undefined}
              className="border rounded px-2 py-1"
            />
          </div>
          <div className="flex items-end">
            <button
              className={`bg-green-600 text-white px-4 py-2 rounded ${
                (!localDates.startDate || !localDates.endDate) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => {
                if (localDates.startDate && localDates.endDate) {
                  dispatch(setDateRange(localDates));
                  fetchData(localDates);
                }
              }}
              disabled={!localDates.startDate || !localDates.endDate}
            >
              Apply
            </button>
          </div>
        </div>
      )}
<div
  className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${
    Number(user?.roleId) === 4 ? "lg:grid-cols-4" : "lg:grid-cols-4"
  } gap-4 mb-6 `}
>   <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Total Charging Sessions</CardTitle>
      </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.totalRevenue?.toFixed(2) || ''}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalKWH?.toFixed(2) || ''} kWh</div>
          </CardContent>
        </Card> 
          {/* <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{pendingStats.pendingRequests}</div>
        <p className="text-sm text-muted-foreground mt-1">
          Franchise: {pendingStats.pendingFranchises}, Site: {pendingStats.pendingSites}, Station: {pendingStats.pendingStations}
        </p>
      </CardContent>
    </Card> */}
          {(Number(user?.roleId) !== 4) ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">EV Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold">{stats?.totalEVUsers || '0'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ):null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Charging Sessions Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sessionGraph}>
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" name="Sessions" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue and Energy Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueGraph}>
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue (₹)" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="energy" name="Energy (kWh)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Station Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-8">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stationStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={<CustomLabel />}
                  >
                    {stationStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 flex items-center">
              <CustomizedLegend
                payload={stationStatusData.map((entry, index) => ({
                  value: entry.name,
                  color: COLORS[index % COLORS.length],
                  payload: entry,
                }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Port Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-8">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={portStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={<CustomLabel />}
                  >
                    {portStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 flex items-center">
              <CustomizedLegend
                payload={portStatusData.map((entry, index) => ({
                  value: entry.name,
                  color: COLORS[index % COLORS.length],
                  payload: entry,
                }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default EVChargerDashboard;