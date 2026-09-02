import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useSelector, useDispatch } from 'react-redux';
import { fetchRequestedData, verifyStation } from '@/store/reducers/requests/RequestsSlice';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AxiosServices from '@/services/AxiosServices';
import { ReloadIcon, DownloadIcon } from "@radix-ui/react-icons";
import { VerifyStationDialog } from './VerifyStationDialog';
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { DropdownMenu,
         DropdownMenuContent,
         DropdownMenuItem,
         DropdownMenuTrigger,
         DropdownMenuSub,
         DropdownMenuSubContent,
         DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';

export default function SiteRequestsDetails({ siteObj, onBack }) {
  if (!siteObj) return <p className="text-center py-8">No site selected</p>;

  const [activeTab, setActiveTab] = useState('basic');
  const [stationsData, setStationsData] = useState([]);
  const dispatch = useDispatch();
  const [variantMap, setVariantMap] = useState({});
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const { dbRequests, jsonRequests, status, error, verifyStatus } = useSelector(state => state.requests);

  const [verifyFormData, setVerifyFormData] = useState({
    franchiseName: "",
    siteName: "",
    stationName: "",
    capacity: "",
    connectorType: "",
    serialNumber: "",
    portType: "",
    status: "",
  });

  const getAllData = () => {
  const dbData = Array.isArray(dbRequests?.requests)
    ? dbRequests.requests
    : [];

  const jsonData = Array.isArray(jsonRequests)
    ? jsonRequests
    : [];

  return [...dbData, ...jsonData].map(item => ({
    ...item,
    category: (item.category || "").toLowerCase(),
    siteName: item.siteName || item.sitename
  }));
};

  const cleanName = (name) => {
  if (!name) return "-";
  const val = name.trim().toLowerCase();
  return val === "unknown" || val === "-" ? "-" : name;
  };

  const displayName = (name) => {
  const trimmed = (name || "").trim();
  if (!trimmed || trimmed === "-" ) {
    return "Unknown Site";
  }
  return trimmed;
};

  const handleVerifyFormChange = (e) => {
    const { name, value } = e.target;
    setVerifyFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerifySelectChange = (name, value) => {
    setVerifyFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const stationData = {
        franchiseName: verifyFormData.franchiseName,
        siteName: verifyFormData.siteName,
        stationName: verifyFormData.stationName,
        capacity: verifyFormData.capacity,
        serialNumber: verifyFormData.serialNumber,
        connectorType: verifyFormData.connectorType,
        portType: verifyFormData.portType,
        siteId: siteObj?.siteId,
        stationId: selectedStation?.stationId,
        portId: selectedStation?.portId,
        address: siteObj?.address,
        coordinates: {
          latitude: siteObj?.latitude,
          longitude: siteObj?.longitude
        }
      };

      await dispatch(verifyStation(stationData));

      // Update local state instantly
      setStationsData(prev => 
        prev.map(station => ({
          ...station,
          ports: station.ports.map(port => {
            if (port.portId === selectedStation.portId) {
              return { ...port, status: "Verified" };
            }
            return port;
          }),
        }))
      );

      setVariantMap(prev => ({
        ...prev,
        [`${selectedStation.stationId}_${selectedStation.portId}`]: 'default'
      }));

      setVerifyDialogOpen(false);
      setSelectedStation(null);

      toast({
        title: "Success",
        description: "Station verified successfully!",
      });
    } catch (error) {
      console.error('Verification failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify station",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusVariant = async (status, portType) => {
    try {
      const response = await AxiosServices.getStations({ size: 100 });
      const stations = response?.data || response?.list || response?.stations || [];
      
      if (!Array.isArray(stations)) {
        console.error("Unexpected stations format:", stations);
        return 'secondary';
      }

      stations.forEach(station => console.log("Station OCPP ID:", station.ocppid, `OCPP_${portType}`));

      const matchedStation = stations.find((station) => {
        console.log("Checking station:", station.ocppid);
        return station.ocppid === `OCPP_${portType}`;
      });

      console.log("Matched Station:", matchedStation);

      if (matchedStation) {
        status = 'Approved';
      }

      switch (status?.toLowerCase()) {
        case 'active': return 'default';
        case 'pending': return 'secondary';
        case 'approved': return 'default';
        case 'rejected': return 'destructive';
        case 'maintenance': return 'outline';
        default: return 'secondary';
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      return 'secondary';
    }
  };

  const getDateFromSerial = (serialNumber) => {
    if (!serialNumber) return "-";
    const parts = serialNumber.split(/[\/\s]+/);
    const datePart = parts.find(p => /\d{5,}/.test(p)); 
    if (!datePart) return "-";

    let day, month, year;
    year = datePart.slice(-4);
    const dmPart = datePart.slice(0, datePart.length - 4);

    if (dmPart.length === 2) { 
      day = dmPart.slice(0,1).padStart(2,'0');
      month = dmPart.slice(1,2).padStart(2,'0');
    } else if (dmPart.length === 3) {
      const d2 = parseInt(dmPart.slice(0,2));
      const m2 = parseInt(dmPart.slice(2));
      if (d2 <= 31 && m2 <= 12) {
        day = dmPart.slice(0,2).padStart(2,'0');
        month = dmPart.slice(2).padStart(2,'0');
      } else {
        day = dmPart.slice(0,1).padStart(2,'0');
        month = dmPart.slice(1).padStart(2,'0');
      }
    } else if (dmPart.length === 4) {
      day = dmPart.slice(0,2).padStart(2,'0');
      month = dmPart.slice(2).padStart(2,'0');
    } else if (dmPart.length === 1) {
      day = '0' + dmPart;
      month = '01';
    } else {
      return "-";
    }

    return `${day}/${month}/${year}`;
  };

const handleVerifyClick = (station, port) => {
    setSelectedStation({ 
      ...station, 
      portId: port.portId,
      siteName: siteObj.siteName,
      franchiseName: siteObj.franchiseName,
      serialNumber: station["serial number"] || station.serialNumber || "", 
      capacity: port.capacity,
      connectorType: port.connectorType,
      portType: port.portType,
      status: station.status || port.status
    });
    setVerifyDialogOpen(true);
  };

  useEffect(() => {
    const loadVariants = async () => {
      const variants = {};
      for (const station of stationsData || []) {
        for (const port of station.ports || []) {
          const variant = await getStatusVariant(station.status, station["serial number"]);
          variants[`${station.stationId}_${port.portId}`] = variant;
        }
      }
      setVariantMap(variants);
    };

    loadVariants();
  }, [stationsData]);

  useEffect(() => {
    dispatch(fetchRequestedData());
  }, [dispatch]);

useEffect(() => {
  if (!siteObj) return;

  const allData = getAllData();

  const stations = allData.filter(item =>
    item.category === "station" &&
    (
      item.siteName === siteObj.siteName ||
      item.siteId === siteObj.id ||
      item.id === siteObj.id
    )
  );

  // Convert flat station rows into UI-friendly structure
  const formattedStations = stations.map(st => ({
    stationId: st.id,
    stationName: st.stationName,
    status: st.status || "Pending",
    ports: [
      {
        portId: st.id,
        capacity: st.chargerCapacity || "-",
        connectorType: st.connectorType || "-",
        portType: st.portType || "-",
        status: st.status || "Pending"
      }
    ],
    serialNumber: st.serialNumber || st["serial number"]
  }));

  setStationsData(formattedStations);

}, [siteObj, dbRequests, jsonRequests]);


  // Download Functions
  const downloadPDF = (data, filename) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: Times New Roman, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 40px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${filename}</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          ${data}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    toast({
      title: "PDF Download",
      description: "PDF is being generated...",
    });
  };

  const downloadExcel = (data, filename) => {
    const csvContent = "data:text/csv;charset=utf-8," + data;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Excel Download",
      description: "File downloaded successfully!",
    });
  };

  const handleDownloadCurrentSite = (site, format) => {
  if (!site) return;

  const safe = text => `"${String(text || "-").replace(/"/g, '""')}"`;
  const franchiseName = siteObj?.franchiseName || "-";
  const serialNumber = stationsData?.[0]?.["serial number"] || stationsData?.[0]?.serialNumber || "-";
  const date = serialNumber !== "-" ? getDateFromSerial(serialNumber) : "-";

  // PDF content
  let pdfContent = `
    <div class="section">
      <h1>Site Details</h1>
      <p><strong>Serial Number:</strong> ${serialNumber}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Franchise Name:</strong> ${franchiseName}</p>
      <p><strong>Site Name:</strong> ${site.siteName}</p>
      <p><strong>Address:</strong> ${site.address || site.locations?.[0]?.address || "-"}</p>
      <p><strong>Latitude:</strong> ${site.latitude || site.locations?.[0]?.latitude || "-"}</p>
      <p><strong>Longitude:</strong> ${site.longitude || site.locations?.[0]?.longitude || "-"}</p>
      <h2>Stations</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <th>Serial Number</th>
          <th>Date</th>
          <th>Station Name</th>
          <th>Capacity</th>
          <th>Connector Type</th>
          <th>Port Type</th>
          <th>Status</th>
        </tr>
  `;

  // Excel content
  let excelData = [
    "Site Details",   
    `Serial Number,${serialNumber}`,
    `Date,${date}`,
     `Franchise Name,${safe(franchiseName)}`,
    `Site Name,${safe(site.siteName)}`,
    `Address,${safe(site.address || site.locations?.[0]?.address)}`,
    `Latitude,${safe(site.latitude || site.locations?.[0]?.latitude)}`,
    `Longitude,${safe(site.longitude || site.locations?.[0]?.longitude)}`,
    "",
    "Stations",
    "Serial Number,Date,Station Name,Capacity,Connector Type,Port Type,Status"
  ];

  (stationsData || []).forEach(station => {
    (station.ports || []).forEach(port => {
      const sNumber = station["serial number"] || station.serialNumber || "-";
      const sDate = sNumber !== "-" ? getDateFromSerial(sNumber) : "-";
      const status = port.status || station.status || "-";

      pdfContent += `
        <tr>
          <td>${sNumber}</td>
          <td>${sDate}</td>
          <td>${station.stationName}</td>
          <td>${port.capacity || "-"}</td>
          <td>${port.connectorType || "-"}</td>
          <td>${port.portType || "-"}</td>
          <td>${status}</td>
        </tr>
      `;
      // Excel row
      excelData.push(`${sNumber},${sDate},${station.stationName},${port.capacity || "-"},${port.connectorType || "-"},${port.portType || "-"},${status}`);
    });
  });

  pdfContent += `</table></div>`;
  const filename = `${site.siteName}_Details`;

  if (format === "pdf") {
    downloadPDF(pdfContent, filename);
  } else {
    downloadExcel(excelData.join("\n"), filename);
  }
};

  const handleDownloadAllStations = (format) => {
    if (!stationsData.length) return;
    const pdfContent = `
      <div class="section">
        <h2>Stations</h2>
        <table>
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Date</th>
              <th>Station Name</th>
              <th>Capacity</th>
              <th>Connector Type</th>
              <th>Port Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${stationsData.flatMap(station => 
              (station.ports || []).map(port => `
                <tr>
                  <td>${station["serial number"] || station.serialNumber || "-"}</td>
                  <td>${getDateFromSerial(station["serial number"] || station.serialNumber)}</td>
                  <td>${cleanName(station.stationName) || "-"}</td>
                  <td>${port.capacity || "-"}</td>
                  <td>${port.connectorType || "-"}</td>
                  <td>${port.portType || "-"}</td>
                  <td>${station.status || port.status || "-"}</td>
                </tr>
              `).join('')
            ).join('')}
          </tbody>
        </table>
      </div>
    `;

    const excelData = [
      "Serial Number,Date,Station Name,Capacity,Connector Type,Port Type,Status",
      ...stationsData.flatMap(station => 
        (station.ports || []).map(port => 
          `"${station["serial number"] || station.serialNumber || "-"}","${getDateFromSerial(station["serial number"] || station.serialNumber)}","${station.stationName || "-"}","${port.capacity || "-"}","${port.connectorType || "-"}","${port.portType || "-"}","${station.status || port.status || "-"}"`
        )
      )
    ].join('\n');
    const filename = `${displayName(siteObj.siteName)} All_Stations`;
    if (format === 'pdf') {
      downloadPDF(pdfContent, filename);
    } else {
      downloadExcel(excelData, filename);
    }
  };

  const handleDownloadStation = (station, port, format) => {
    const serialNumber = station["serial number"] || station.serialNumber || "-";
    const date = getDateFromSerial(serialNumber);

    const pdfContent = `
      <div class="section">
        <h2>Station Details</h2>
        <p><strong>Serial Number:</strong> ${serialNumber}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Site Name:</strong> ${siteObj.siteName}</p>
        <p><strong>Station Name:</strong> ${station.stationName || "-"}</p>
        <p><strong>Capacity:</strong> ${port?.capacity || "-"}</p>
        <p><strong>Connector Type:</strong> ${port?.connectorType || "-"}</p>
        <p><strong>Port Type:</strong> ${port?.portType || "-"}</p>
        <p><strong>Status:</strong> ${station.status || port?.status || "-"}</p>
      </div>
    `;

    const excelData = [
      "Station Details",
      `Serial Number,${serialNumber}`,
      `Date,${date}`,
      `Site Name,${siteObj.siteName}`,
      `Station Name,${station.stationName || "-"}`,
      `Capacity,${port?.capacity || "-"}`,
      `Connector Type,${port?.connectorType || "-"}`,
      `Port Type,${port?.portType || "-"}`,
      `Status,${station.status || port?.status || "-"}`
    ].join('\n');

    const filename = `${station.stationName || "Station"}_Details`;

    if (format === "pdf") {
      downloadPDF(pdfContent, filename);
    } else {
      downloadExcel(excelData, filename);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
<h1 className="text-2xl font-bold">
  {displayName(siteObj.siteName)}
</h1>
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic Details</TabsTrigger>
          <TabsTrigger value="stations">Stations</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Site Information</h2>
           <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-40 bg-white border rounded-md shadow-lg p-1"
                >
                   <DropdownMenuItem
                  onSelect={() => handleDownloadCurrentSite(siteObj, "pdf")}
                  className="px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
                  >
                    PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => handleDownloadCurrentSite(siteObj, "excel")}
                    className="px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
                  >
                    Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>

          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8">
                <div>
                  <label className="text-md font-medium text-gray-500">Serial Number</label>
                  <p className="text-base">{siteObj.serialNumber || "-"}</p>
                </div>
                <div>
                  <label className="text-md font-medium text-gray-500">Franchise Name</label>
                  <p className="text-base">{siteObj.franchiseName || "-"}</p>
                </div>
                <div>
                  <label className="text-md font-medium text-gray-500">Site Name</label>
                  <p className="text-base">{siteObj.siteName || "-"}</p>
                </div>                
                <div>
                  <label className="text-md font-medium text-gray-500">Address</label>
                  <p className="text-base">{siteObj.address || "-"}</p>
                </div>
                <div>
                  <label className="text-md font-medium text-gray-500">Coordinates</label>
                  <p className="text-base">
                    {siteObj.latitude && siteObj.longitude 
                      ? `${siteObj.latitude}, ${siteObj.longitude}`
                      : "-"
                    }
                  </p>
                </div>                
                <div>
                  <label className="text-md font-medium text-gray-500">Date</label>
                  <p className="text-base">{getDateFromSerial(siteObj.serialNumber)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stations Tab */}
        <TabsContent value="stations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Stations</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-30 bg-white border rounded-md shadow-lg p-1 max-h-64">
                {/* All Stations download */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded">
                    All Stations
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-20 bg-white border rounded-md shadow-lg p-1" alignOffset={-5}>
                    <DropdownMenuItem
                      onSelect={() => handleDownloadCurrentSite(siteObj,"pdf")}
                      className="px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
                    >
                      PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleDownloadCurrentSite(siteObj,"excel")}
                      className="px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
                    >
                      Excel
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100">
                    <TableHead className="text-[10px]">Serial Number</TableHead>
                    <TableHead className="text-[10px]">Date</TableHead>
                    <TableHead className="text-[10px]">Station Name</TableHead>
                    <TableHead className="text-[10px]">Capacity</TableHead>
                    <TableHead className="text-[10px]">Connector Type</TableHead>
                    <TableHead className="text-[10px]">Port Type</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                    <TableHead className="text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
<TableBody>
  {stationsData && stationsData.length > 0 ? (
    stationsData.flatMap(station =>
      (station.ports || []).map(port => (
        <TableRow key={`${station.stationId}_${port.portId}`}>
          <TableCell className="text-[10px]">{station["serial number"] || station.serialNumber || "-"}</TableCell>
          <TableCell className="text-[10px]">{getDateFromSerial(station["serial number"] || station.serialNumber)}</TableCell>
          <TableCell className="text-[10px]">{cleanName(station.stationName)}</TableCell>
          <TableCell className="text-[10px]">{port.capacity || "-"}</TableCell>
          <TableCell className="text-[10px]">{port.connectorType || "-"}</TableCell>
          <TableCell className="text-[10px]">{port.portType || "-"}</TableCell>
          <TableCell className="text-[10px]">
            {(() => {
              const key = `${station.stationId}_${port.portId}`;
              const variant = variantMap[key] || 'secondary';
              const displayStatus = variant === 'default' ? 'Approved' : (station.status || port.status || 'Pending');
              return (
                <Badge variant={variant}>
                  {displayStatus}
                </Badge>
              );
            })()}
          </TableCell>
          <TableCell>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleVerifyClick(station, port)}
              disabled={
                variantMap[`${station.stationId}_${port.portId}`] === 'default' ||
                (station.status || port.status) === "Approved"
              }
            >
              {variantMap[`${station.stationId}_${port.portId}`] === 'default' ||
              (station.status || port.status) === "Approved"
                ? "Approved"
                : "Verify"}
            </Button>
          </TableCell>
        </TableRow>
      ))
    )
  ) : (
    <TableRow>
      <TableCell colSpan={8} className="text-center text-gray-500 py-6">
        No stations found for this site
      </TableCell>
    </TableRow>
  )}
</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <VerifyStationDialog
  open={verifyDialogOpen}
  onOpenChange={setVerifyDialogOpen}
  selectedStation={selectedStation}
  selectedSite={siteObj}
  franchiseObj={{ 
    franchiseName: siteObj.franchiseName,
    email: "",
    phoneNumber: ""
  }}
  onVerifySuccess={(station) => {
    // Update local stations data
    setStationsData(prev => 
      prev.map(s => ({
        ...s,
        ports: s.ports.map(port => {
          if (port.portId === station.portId) {
            return { ...port, status: "Approved" };
          }
          return port;
        }),
      }))
    );

    // Update variantMap
    setVariantMap(prev => ({
      ...prev,
      [`${station.stationId}_${station.portId}`]: 'default'
    }));

    setSelectedStation(null);
    
    // Refresh data
    dispatch(fetchRequestedData());
  }}
/>
    </div>
  );
}