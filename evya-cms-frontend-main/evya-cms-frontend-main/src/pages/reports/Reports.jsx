import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReloadIcon } from '@radix-ui/react-icons';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  fetchSites,
  fetchStations,
  fetchReportData,
  setFilters
} from '@/store/reducers/reports/reportsSlice';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Helper function to calculate default start date based on range
const getDefaultStartDate = (range) => {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (range) {
    case '7':
      startDate.setDate(endDate.getDate() - 6);
      break;
    case '30':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '180':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case '365':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 7); // Default to 7 days
  }
  
  return startDate.toISOString().split('T')[0];
};

const Reports = () => {
  const dispatch = useDispatch();
  const { 
    reportData, 
    sites, 
    stations, 
    loading, 
    error,
    filters 
  } = useSelector((state) => state.reports);
  
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!sites.length) dispatch(fetchSites());
    if (!stations.length) dispatch(fetchStations());
  }, [dispatch, sites.length, stations.length]);

  //for copilot
  // Listen for "Generate Report" from Copilot
useEffect(() => {
  const handleGenerate = () => {
    console.log('🎯 Generating report from Copilot');
    handleGenerateReport();
  };
  window.addEventListener('generateReport', handleGenerate);
  return () => window.removeEventListener('generateReport', handleGenerate);
}, []);

// Listen for "Download PDF"
useEffect(() => {
  const handlePDF = () => {
    console.log('🎯 Downloading PDF from Copilot');
    downloadPDF();
  };
  window.addEventListener('downloadPDF', handlePDF);
  return () => window.removeEventListener('downloadPDF', handlePDF);
}, []);

// Listen for "Download Excel"
useEffect(() => {
  const handleExcel = () => {
    console.log('🎯 Downloading Excel from Copilot');
    downloadExcel();
  };
  window.addEventListener('downloadExcel', handleExcel);
  return () => window.removeEventListener('downloadExcel', handleExcel);
}, []);

  // Transform data to proper format
  const transformedData = useMemo(() => {
    if (!reportData) return [];
    
    return reportData.map(item => {
      const startTimeArray = item.startTime || [];
      const endTimeArray = item.endTime || [];
      
      const startTime = startTimeArray.length >= 3 
        ? new Date(startTimeArray[0], startTimeArray[1] - 1, startTimeArray[2], startTimeArray[3] || 0, startTimeArray[4] || 0)
        : null;
      
      const endTime = endTimeArray.length >= 3 
        ? new Date(endTimeArray[0], endTimeArray[1] - 1, endTimeArray[2], endTimeArray[3] || 0, endTimeArray[4] || 0)
        : null;

      return {
        ...item,
        startTime,
        endTime,
        kwConsumption: Number(item.kwConsumption) || 0,
        energyDelivered: Number(item.energyDelivered) || 0,
        revenue: Number(item.revenue) || 0,
        siteName: item.siteName || 'N/A',
        stationName: item.stationName || 'N/A',
        location: item.location || 'N/A'
      };
    });
  }, [reportData]);

  const formatDateTime = (date) => {
    if (!date) return '-';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };
//lavanya added
 const handleItemSelection = (value) => {
  if (value === "all") {
    dispatch(setFilters({
      selectedItem: filters.reportType === "sites" ? "All Sites" : "All Stations",
      selectedItemId: "all"
    }));
    return;
  }

  const selectedData =
    filters.reportType === "sites"
      ? sites.find((s) => s.id.toString() === value)
      : stations.find((s) => s.id.toString() === value);

  const displayName =
    filters.reportType === "sites"
      ? selectedData?.siteName
      : `${selectedData?.stationName} (${selectedData?.referNo})`;

  dispatch(
    setFilters({
      selectedItem: displayName,
      selectedItemId: parseInt(value),
    })
  );
};
  const handleDateRangeChange = (value) => {
    if (value === 'Custom') {
      handleFilterChange('dateRange', value);
    } else {
      const endDate = new Date();
      const startDate = new Date();
      
      // Calculate start date based on the selected range
      switch (value) {
        case '7':
          startDate.setDate(endDate.getDate() - 6);
          break;
        case '30':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '180':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '365':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7); // Default to 7 days
      }
      
      dispatch(setFilters({
        dateRange: value,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }));
    }
  };

  const handleGenerateReport = () => {
    if (filters.reportType && filters.selectedItemId) {
    //lavanya added
      // Always ensure we have startDate and endDate, even if not custom range
     const params = {
  ...filters,
  selectedItemId: filters.selectedItemId === "all" ? null : filters.selectedItemId,
  startDate: filters.startDate || getDefaultStartDate(filters.dateRange),
  endDate: filters.endDate || new Date().toISOString().split("T")[0],
};
      
      dispatch(fetchReportData(params));
    }
  };

  const calculateMetrics = () => {
    if (!transformedData.length) {
      return {
        totalTransactions: 0,
        totalRevenue: 0,
        totalEnergy: 0,
      };
    }
    
    return transformedData.reduce((acc, item) => ({
      totalTransactions: acc.totalTransactions + 1,
      totalRevenue: acc.totalRevenue + item.revenue,
      totalEnergy: acc.totalEnergy + item.energyDelivered
    }), { totalTransactions: 0, totalRevenue: 0, totalEnergy: 0 });
  };

  const columns = [
    { accessorKey: "siteName", header: "Site Name" },
    { accessorKey: "stationName", header: "Station Name" },
    { 
      accessorKey: "startTime", 
      header: "Start Time",
      cell: ({ row }) => formatDateTime(row.original.startTime)
    },
    { 
      accessorKey: "endTime", 
      header: "End Time",
      cell: ({ row }) => formatDateTime(row.original.endTime)
    },
    { 
      accessorKey: "kwConsumption", 
      header: "Consumption (kW)",
      cell: ({ row }) => row.original.kwConsumption.toFixed(2)
    },
    { 
      accessorKey: "energyDelivered", 
      header: "Energy (kWh)",
      cell: ({ row }) => row.original.energyDelivered.toFixed(2)
    },
    { 
      accessorKey: "revenue", 
      header: "Revenue (₹)",
      cell: ({ row }) => `₹${row.original.revenue.toFixed(2)}`
    },
    { accessorKey: "location", header: "Location" }
  ];

  const table = useReactTable({
    data: transformedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  const metrics = calculateMetrics();
  const filteredItems = (filters.reportType === 'sites' ? sites : stations)
    .filter(item => {
      const searchString = filters.reportType === 'sites' 
        ? item.siteName.toLowerCase()
        : `${item.stationName} ${item.referNo}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });

  const chartData = useMemo(() => {
    return transformedData.map(item => ({
      name: formatDateTime(item.startTime).split(',')[0],
      consumption: item.kwConsumption,
      energy: item.energyDelivered,
      revenue: item.revenue,
      startTime: item.startTime
    }));
  }, [transformedData]);

  const downloadExcel = () => {
    const summary = [
      ["Total Transactions", metrics.totalTransactions],
      ["Total Revenue", `₹${metrics.totalRevenue.toFixed(2)}`],
      ["Total Energy", `${metrics.totalEnergy.toFixed(2)} kWh`],
      [], // empty row
    ];

    const tableData = transformedData.map((d) => ({
      Site: d.siteName,
      Station: d.stationName,
      "Start Time": formatDateTime(d.startTime),
      "End Time": formatDateTime(d.endTime),
      "Consumption (kW)": d.kwConsumption.toFixed(2),
      "Energy (kWh)": d.energyDelivered.toFixed(2),
      "Revenue (₹)": d.revenue.toFixed(2),
      Location: d.location,
    }));

    const worksheet = XLSX.utils.json_to_sheet(tableData, { origin: -1 });
    XLSX.utils.sheet_add_aoa(worksheet, summary, { origin: "A1" });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, "report.xlsx");
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Report Summary", pageWidth / 2, 10, { align: "center" });

    const metricsY = 20;
    const lineSpacing = 8;

    doc.setFontSize(12);
    doc.setFont("helvetica","normal");
    doc.text(`Total Transactions: ${metrics.totalTransactions}`, 14, metricsY);
    // doc.text(`Total Revenue: ₹${metrics.totalRevenue.toFixed(2)}`, 14, metricsY + lineSpacing);
    doc.text(`Total Revenue: Rs.${metrics.totalRevenue.toFixed(2)}`, 14, metricsY + lineSpacing);
    doc.text(`Total Energy: ${metrics.totalEnergy.toFixed(2)} kWh`, 14, metricsY + 2 * lineSpacing);

    autoTable(doc, {
      startY: metricsY + 3 * lineSpacing + 6,
      head: [
        [
          "Site",
          "Station",
          "Start Time",
          "End Time",
          "Consumption (kW)",
          "Energy (kWh)",
          "Revenue (Rs)",
          "Location",
        ],
      ],
      body: transformedData.map((d) => [
        d.siteName,
        d.stationName,
        formatDateTime(d.startTime),
        formatDateTime(d.endTime),
        d.kwConsumption.toFixed(2),
        d.energyDelivered.toFixed(2),
        d.revenue.toFixed(2),
        d.location,
      ]),
    });

    doc.save("report.pdf");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Report & Stats</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium">Report Based On</label>
            <Select 
              value={filters.reportType}
              onValueChange={(value) => handleFilterChange('reportType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sites">Sites</SelectItem>
                <SelectItem value="stations">Stations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filters.reportType && (
            <div>
              <label className="text-sm font-medium">
                {filters.reportType === 'sites' ? 'Select Site' : 'Select Station'}
              </label>
              <Select
                value={filters.selectedItemId?.toString() || ""}
                onValueChange={handleItemSelection}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Choose ${filters.reportType === 'sites' ? 'site' : 'station'}`} />
                </SelectTrigger>
                <SelectContent>
                  <Input
                    placeholder={`Search ${filters.reportType === "sites" ? "sites" : "stations"}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                  <SelectItem value="all">
  {filters.reportType === "sites" ? "All Sites" : "All Stations"}
</SelectItem>
{/*lavanya added*/}
{filteredItems.map((item) => (
  <SelectItem key={item.id} value={item.id.toString()}>
    {filters.reportType === "sites"
      ? item.siteName
      : `${item.stationName}`}
  </SelectItem>
))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Date Range</label>
            <Select
              value={filters.dateRange}
              onValueChange={handleDateRangeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="180">Last 6 Months</SelectItem>
                <SelectItem value="365">Last Year</SelectItem>
                <SelectItem value="Custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filters.dateRange === "Custom" && (
          <div className="mt-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                className="w-full border rounded p-2"
                value={filters.startDate || ""}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                max={filters.endDate || undefined}
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                className="w-full border rounded p-2"
                value={filters.endDate || ""}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={filters.startDate || undefined}
              />
            </div>
          </div>
        )}
{/*lavanya added*/}
        <div className="flex justify-end mt-4 mb-6">
          
          <Button
            disabled={
  !filters.reportType ||
  (!filters.selectedItemId && filters.selectedItemId !== "all") ||
  (filters.dateRange === "Custom" && (!filters.startDate || !filters.endDate))
}
            onClick={handleGenerateReport}
          >
            {loading ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>
                Generating...
              </>
            ) : (
              'Generate Report'
            )}
          </Button>
        </div>

        {transformedData.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalTransactions}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{metrics.totalRevenue.toFixed(2)}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Energy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalEnergy.toFixed(2)} kWh</div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6">
  <CardHeader>
  <CardTitle>Energy Consumption</CardTitle>
  </CardHeader>
 <CardContent>
  <div className="h-[400px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={chartData} 
        margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
        barGap={8}
        barCategoryGap="15%"
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12, fill: '#64748b' }}
          axisLine={{ stroke: '#cbd5e1' }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#64748b' }}
          axisLine={{ stroke: '#cbd5e1' }}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          itemStyle={{ color: '#1e293b' }}
          />
        <Legend 
          wrapperStyle={{ 
            fontSize: 12,
            paddingTop: '20px'
          }} 
        />
        <Bar 
          dataKey="consumption" 
          name="Consumption (kW)" 
          fill="#818cf8" 
          radius={[4, 4, 0, 0]} 
          animationDuration={1500}
        />
        <Bar 
          dataKey="revenue" 
          name="Revenue (₹)" 
          fill="#4ade80" 
          radius={[4, 4, 0, 0]} 
          animationDuration={1500}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</CardContent>
</Card>

          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        {loading ? 'Loading data...' : 'No data available. Generate a report to view data.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>            
            <div className="flex items-center justify-between py-4">
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={downloadPDF}
                  disabled={transformedData.length === 0}
                >
                  Download PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={downloadExcel}
                  disabled={transformedData.length === 0}
                >
                  Download Excel
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
//reports component....