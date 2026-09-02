import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {  useSelector, useDispatch } from 'react-redux';
import { fetchRequestedData} from '@/store/reducers/requests/RequestsSlice';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AxiosServices from '@/services/AxiosServices';
import { Input } from "@/components/ui/input";
import { DownloadIcon } from "@radix-ui/react-icons";
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

export default function FranchiseRequestsDetails({ franchiseObj, onBack, onSiteClick }) {
  if (!franchiseObj) return <p className="text-center py-8">No franchise selected</p>;

  const [activeTab, setActiveTab] = useState('basic');
  const [sitesData, setSitesData] = useState([]);
  const dispatch = useDispatch();
  const [variantMap, setVariantMap] = useState({});
  const [selectedSite, setSelectedSite] = useState(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [siteSearch, setSiteSearch] = useState("");

  const filteredSites = sitesData.filter(site => {
  const name =
    site.siteName ||
    site.sitename ||
    "";

  const address =
    site.locations?.[0]?.address ||
    site.address ||
    "";

  return (
    name.toLowerCase().includes(siteSearch.toLowerCase()) ||
    address.toLowerCase().includes(siteSearch.toLowerCase())
  );
});

  const { dbRequests, jsonRequests, status, error, verifyStatus } = useSelector(state => state.requests);
  const getAllData = () => {
  const dbData = dbRequests?.requests || [];
  const jsonData = jsonRequests?.requests || [];

  console.log("DB DATA:", dbData);
  console.log("JSON DATA:", jsonData);

  return [...dbData, ...jsonData];
};

  const [verifyFormData, setVerifyFormData] = useState({
    franchiseName: "GreenCharge EV Pvt Ltd",
    siteName: "",
    stationName: "",
    capacity: "",
    connectorType: "",
    serialNumber: "",
    portType: "",
    status: "",
  });

   const [sitePagination, setSitePagination] = useState({
    page: 1,
    pageSize: 10
  });
 const getPaginatedSites = (sites) => {
    const { page, pageSize } = sitePagination;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sites.slice(startIndex, endIndex);
  };

  const handleSitePageChange = (newPage) => {
    setSitePagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  useEffect(() => {
    setSitePagination(prev => ({
      ...prev,
      page: 1
    }));
  }, [siteSearch]);

  const SitePaginationControls = ({ currentPage, totalItems, pageSize, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startItem = ((currentPage - 1) * pageSize) + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
      <div className="flex justify-center mt-4 px-4 py-3 bg-white">
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-sm border-gray-300 hover:bg-gray-50"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          {/* Page Numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                className={`h-8 w-8 text-sm p-0 ${
                  currentPage === pageNum
                    ? 'bg-green-600 text-white hover:bg-green-700 border-green-600'
                    : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-sm border-gray-300 hover:bg-gray-50"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };


  // Get paginated results
  const paginatedSites = getPaginatedSites(filteredSites);

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
      siteId: selectedSite?.siteId,
      stationId: selectedStation?.stationId,
      portId: selectedStation?.portId,
      address: selectedSite?.locations?.[0]?.address,
      coordinates: {
        latitude: selectedSite?.locations?.[0]?.latitude,
        longitude: selectedSite?.locations?.[0]?.longitude
      }
    };

    await dispatch(verifyStation(stationData));

    setSelectedSite(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        stations: prev.stations.map(station => ({
          ...station,
          ports: station.ports.map(port => {
            if (port.portId === selectedStation.portId) {
              return { ...port, status: "Verified" };
            }
            return port;
          }),
        })),
      };
    });

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

const displayValue = (value) => {
  if (!value || value.toString().trim().toLowerCase() === "unknown") return "-";
  return value;
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
    franchiseName: franchiseObj.franchiseName,
    serialNumber: station["serial number"] || station.serialNumber || "",
    siteName: selectedSite.siteName,
    capacity: port.capacity,
    connectorType: port.connectorType,
    portType: port.portType,
    status: station.status || port.status,
  });
  setVerifyDialogOpen(true);
};

const getStationsForSite = (site) => {
  const allData = getAllData();

  const stationRows = allData.filter(item =>
    item.category?.toLowerCase() === "station" &&
    item.sitename === site.sitename &&
    item.franchiseName === site.franchiseName
  );

  const stationMap = new Map();

  stationRows.forEach(row => {
    if (!stationMap.has(row.id)) {
      stationMap.set(row.id, {
        stationId: row.id,
        stationName: row.stationName,
        status: row.status || "Pending",
        ports: []
      });
    }
    stationMap.get(row.id).ports.push({
      portId: row.portId || `${row.id}_${row.portType}`,
      capacity: row.capacity,
      connectorType: row.connectorType,
      portType: row.portType,
      status: row.status || "Pending"
    });
  });
  const stations = Array.from(stationMap.values());
  return stations;
};

const handleSiteClick = (site) => {
  const stations = getStationsForSite(site);

  setSelectedSite({
    ...site,
    stations,
  });

  setActiveTab("stations");
};

  useEffect(() => {
  const loadVariants = async () => {
     if (!selectedSite || !selectedSite.stations) {
      setVariantMap({});
      return;
    }

    const variants = {};
    for (const station of selectedSite.stations || []) {
      for (const port of station.ports || []) {
        const variant = await getStatusVariant(station.status, station["serial number"]);
        variants[`${station.stationId}_${port.portId}`] = variant;
      }
    }
    setVariantMap(variants);
  };

  loadVariants();
}, [selectedSite]);

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

  const getFranchiseData = (franchiseName) => {
    const allData = getAllData();
    const franchiseData = allData.filter(item =>
  item.category?.toLowerCase() === "site" &&
  item.franchiseName === franchiseName
);


    const stationsData = franchiseData.flatMap(site => 
      (site.stations || []).flatMap(station => 
        (station.ports || []).map(port => ({
          franchiseName: franchiseName,
          serialNumber: station["serial number"] || station.serialNumber || "-",
          siteName: site.siteName || "-",
          stationName: station.stationName || "-",
          capacity: port.capacity || "-",
          connectorType: port.connectorType || "-",
          portType: port.portType || "-",
          status: station.status || port.status || "-"
        })) || []
      ) || []
    );

    return {
      franchiseInfo: {
        franchiseName,
        email: franchiseData[0]?.managerEmail || "",
        phoneNumber: franchiseData[0]?.managerPhone || "",
        address: franchiseData[0]?.locations?.[0]?.address || ""
      },
      sites: franchiseData,
      stations: stationsData
    };
  };

const handleDownloadCurrentFranchiseSites = (format) => {
    if (!franchiseObj || sitesData.length ===0) return;
    // const franchiseData = getFranchiseData(franchiseObj.franchiseName);
    const pdfContent = `
      <div class="section">
        <h2>${franchiseObj.franchiseName} - Sites</h2>
        <table>
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Date</th>
              <th>Site Name</th>
              <th>Address</th>
              <th>Latitude</th>
              <th>Longitude</th>
            </tr>
          </thead>
          <tbody>
            ${sitesData.map(site => `
              <tr>
                <td>${site.stations?.[0]?.["serial number"] || site.stations?.[0]?.ports?.[0]?.serialNumber || "-"}</td>
                <td>${getDateFromSerial(site.stations?.[0]?.["serial number"] || site.stations?.[0]?.ports?.[0]?.serialNumber)}</td>
                <td>${displayValue(site.siteName) || "-"}</td>
                <td>${site.locations?.[0]?.address || site.address || "-"}</td>
                <td>${site.locations?.[0]?.latitude || site.latitude ||  "-"}</td>
                <td>${site.locations?.[0]?.longitude || site.longitude || "-"}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    const excelData = [
      "Site Name,Address,Latitude,Longitude",
      ...sitesData.map(site => 
        `"${site.siteName || "-"}","${site.locations?.[0]?.address || "-"}","${site.locations?.[0]?.latitude || site.latitude || "-"}","${site.locations?.[0]?.longitude || "-"}"`
      )
    ].join('\n');

    const filename = `${franchiseObj.franchiseName}_Sites`;

    if (format === 'pdf') {
      downloadPDF(pdfContent, filename);
    } else {
      downloadExcel(excelData, filename);
    }
};

const handleDownloadCurrentSite = (site, format) => {
  if (!site) return;

  const franchiseName = franchiseObj?.franchiseName || "-";
  const serialNumber = site.stations && site.stations.length > 0
    ? site.stations[0]["serial number"] || site.stations[0].serialNumber
    : "-";
  const date = serialNumber !== "-" ? getDateFromSerial(serialNumber) : "-";

  let pdfContent = `
    <div class="section">
      <h2>Site Details - ${site.siteName}</h2>
      <p><strong>Serial Number:</strong> ${serialNumber}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Franchise Name:</strong> ${franchiseName}</p>
      <p><strong>Site Name:</strong> ${site.siteName}</p>
      <p><strong>Address:</strong> ${site.locations?.[0]?.address || "-"}</p>
      <p><strong>Latitude:</strong> ${site.locations?.[0]?.latitude || "-"}</p>
      <p><strong>Longitude:</strong> ${site.locations?.[0]?.longitude || "-"}</p>
      <h3>Stations</h3>
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
  let excelData = [
    "Site Details",   
    `Serial Number,${serialNumber}`,
    `Date,${date}`,
     `Franchise Name,${franchiseName}`,
    `Site Name,${site.siteName}`,
    `Address,${site.locations?.[0]?.address || "-"}`,
    `Latitude,${site.locations?.[0]?.latitude || "-"}`,
    `Longitude,${site.locations?.[0]?.longitude || "-"}`,
    "",
    "Stations",
    "Serial Number,Date,Station Name,Capacity,Connector Type,Port Type,Status"
  ];

  site.stations?.forEach(station => {
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

 const handleDownloadCurrentFranchise = (franchise, format) => {

  if (!franchise) return; 
  const franchiseData = getFranchiseData(franchise.franchiseName);
  if (!franchiseData) return;

  const pdfContent = `
    <div class="section">
      <h2>Franchise Information</h2>
      <p><strong>Franchise Name:</strong> ${franchiseData.franchiseInfo.franchiseName}</p>
      <p><strong>Email:</strong> ${franchiseData.franchiseInfo.email}</p>
      <p><strong>Phone:</strong> ${franchiseData.franchiseInfo.phoneNumber}</p>
    </div>
    <div class="section">
      <h2>Sites</h2>
      <table>
        <thead>
          <tr>
            <th>Serial Number </th>
            <th>Date</th>
            <th>Site Name</th>
            <th>Address</th>
            <th>Latitude</th>
            <th>Longitude</th>
          </tr>
        </thead>
        <tbody>
          ${franchiseData.sites.map(site => `
            <tr>
              <td>${site.stations?.[0]?.["serial number"] || site.stations?.[0]?.ports?.[0]?.serialNumber || "-"}</td>
              <td>${getDateFromSerial(site.stations?.[0]?.["serial number"] || site.stations?.[0]?.ports?.[0]?.serialNumber)}</td>
              <td>${displayValue(site.siteName) || "-"}</td>
              <td>${site.locations?.[0]?.address || "-"}</td>
              <td>${site.locations?.[0]?.latitude || "-"}</td>
              <td>${site.locations?.[0]?.longitude || "-"}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="section">
      <h2>Stations</h2>
      <table>
        <thead>
          <tr>
            <th>Serial Number</th>
            <th>Site Name</th>
            <th>Station Name</th>
            <th>Capacity</th>
            <th>Connector Type</th>
            <th>Port Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${franchiseData.stations.map(station => `
            <tr>
              <td>${station.serialNumber}</td>
              <td>${displayValue(station.siteName)}</td>
              <td>${displayValue(station.stationName)}</td>
              <td>${station.capacity}</td>
              <td>${station.connectorType}</td>
              <td>${station.portType}</td>
              <td>${station.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  const excelData = [
    "Franchise Information",
    `Franchise Name,${franchiseData.franchiseInfo.franchiseName}`,
    `Email,${franchiseData.franchiseInfo.email}`,
    `Phone,${franchiseData.franchiseInfo.phoneNumber}`,
    "",
 "Sites",
  "Serial Number,Date,Site Name,Address,Latitude,Longitude",
  ...franchiseData.sites.map(site => {
    const serial = site.stations?.[0]?.["serial number"] || site.stations?.[0]?.ports?.[0]?.serialNumber || "-";
    const date = getDateFromSerial(serial);
    return `"${serial}","${date}","${site.siteName || "-"}","${site.locations?.[0]?.address || "-"}","${site.locations?.[0]?.latitude || "-"}","${site.locations?.[0]?.longitude || "-"}"`;
  }),
  "",
  "Stations",
  "Serial Number,Date,Site Name,Station Name,Capacity,Connector Type,Port Type,Status",
  ...franchiseData.stations.map(station => 
    `"${station.serialNumber}","${getDateFromSerial(station.serialNumber)}","${station.siteName}","${station.stationName}","${station.capacity}","${station.connectorType}","${station.portType}","${station.status}"`
  )
].join("\n");

  const filename = `${franchiseData.franchiseInfo.franchiseName}_Full_Report`;

  if (format === 'pdf') {
    downloadPDF(pdfContent, filename);
  } else {
    downloadExcel(excelData, filename);
  }
};

  useEffect(() => {
    dispatch(fetchRequestedData());
  }, [dispatch]);

 useEffect(() => {
  if (!franchiseObj || !dbRequests?.requests?.length) return;
  const allRequests = dbRequests.requests;
  const franchiseSites = allRequests.filter(item => item.category?.toLowerCase() === "site" && item.franchiseName === franchiseObj.franchiseName );
  console.log( "Franchise:", franchiseObj.franchiseName, "Sites Found:", franchiseSites.length, franchiseSites );
  const uniqueSitesMap = new Map();
  franchiseSites.forEach(site => { 
    const key = [ site.sitename || site.siteName, site.address, site.latitude, site.longitude ].join("_");
    if (!uniqueSitesMap.has(key)) { uniqueSitesMap.set(key, { ...site, siteName: site.siteName || site.sitename });
  }
 });
 setSitesData(Array.from(uniqueSitesMap.values())); }, [franchiseObj, dbRequests]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{franchiseObj.franchiseName}</h1>
        <div className="flex items-center gap-2 mb-2">
          {!selectedSite && (
            <Button variant="outline" onClick={onBack}>
              ← Back
            </Button>
          )}
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {!selectedSite && (
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Details</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="basic" className="space-y-4">
        <div className="flex items-center justify-between">
        <h4 className="text-xl font-bold">Franchise Information</h4>
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
        onSelect={() => handleDownloadCurrentFranchise(franchiseObj, "pdf")}
        className="px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
        >
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => handleDownloadCurrentFranchise(franchiseObj, "excel")}
          className="px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
        >
          Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
   </div>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-md font-medium text-gray-500">Franchise Name</label>
                  <p className="text-base">{franchiseObj.franchiseName || "-"}</p>
                </div>
                <div>
                  <label className="text-md font-medium text-gray-500">Email</label>
                  <p className="text-base">{franchiseObj.email || ""}</p>
                </div>
                <div>
                  <label className="text-md font-medium text-gray-500">Phone Number</label>
                  <p className="text-base">{franchiseObj.phoneNumber || "-"}</p>
                </div>
                <div>
                  <label className="text-md font-medium text-gray-500">Address</label>
                  <p className="text-base">-</p>
                </div>
                 <div>
                  <label className="text-md font-medium text-gray-500">Point of Contact</label>
                  <p className="text-base">-</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sites" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Sites</h2>            
            <DropdownMenu>
                
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-30 bg-white border rounded-md shadow-lg p-1 max-h-64"
            >
                {/* All Sites download */}
                <DropdownMenuSub>
                <DropdownMenuSubTrigger className="px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded">
                    All Sites
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                    className="w-40 bg-white border rounded-md shadow-lg p-1"
                    alignOffset={-5}
                >
                    <DropdownMenuItem
                    onSelect={() => handleDownloadCurrentFranchiseSites("pdf")}
                    className="p-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
                    >
                    PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                    onSelect={() => handleDownloadCurrentFranchiseSites("excel")}
                    className="p-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
                    >
                    Excel
                    </DropdownMenuItem>
                </DropdownMenuSubContent>
                </DropdownMenuSub>
               </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Input
            placeholder="Search sites..."
            value={siteSearch}
            onChange={(e) => setSiteSearch(e.target.value)}
            className="w-full"
          />
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-slate-100">
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Franchise Name</TableHead>
                    <TableHead>Site Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Latitude</TableHead>
                    <TableHead>Longitude</TableHead>
                  </TableRow>
                </TableHeader>
               <TableBody>
                {paginatedSites.length > 0 ? (
                    paginatedSites.map(site => (
                    <TableRow key={site.siteId || site.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleSiteClick(site)}>
                        <TableCell>
                        {site.stations && site.stations.length > 0 
                            ? site.stations[0]["serial number"] || site.stations[0].serialNumber || "-" 
                            : site.serialNumber || "-"
                        }
                        </TableCell>
                        <TableCell>
                        {site.stations && site.stations.length > 0 
                            ? getDateFromSerial(site.stations[0]["serial number"] || site.stations[0].serialNumber)
                            : getDateFromSerial(site.serialNumber)
                        }
                        </TableCell>
                        <TableCell>{franchiseObj?.franchiseName || "-"}</TableCell>
                        <TableCell>{displayValue(site.siteName || site.sitename)}</TableCell>
                        <TableCell>{site.locations?.[0]?.address || site.address || "-"}</TableCell>
                        <TableCell>{site.locations?.[0]?.latitude || site.latitude || "-"}</TableCell>
                        <TableCell>{site.locations?.[0]?.longitude || site.longitude || "-"}</TableCell>
                    </TableRow>    
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                        No sites found for this franchise
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
              </Table>
           </div>
           </div>
          {/* ✅ Add Pagination Controls here */}
            <SitePaginationControls
              currentPage={sitePagination.page}
              totalItems={filteredSites.length}
              pageSize={sitePagination.pageSize}
              onPageChange={handleSitePageChange}
            />
        </TabsContent>

        {/* Stations Tab */}
        <TabsContent value="stations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Stations</h2>
            <div className="flex gap-2">
             <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm">
      <DownloadIcon className="mr-2 h-4 w-4" />
      Download
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-64 bg-white border rounded-md shadow-lg p-1 max-h-64 ">
    {/* Individual stations */}
    {selectedSite?.stations?.length > 0 ? (
        selectedSite.stations.map((station) => (
        <DropdownMenuSub key={station.stationId}>
            <DropdownMenuSubTrigger className="px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded">
                {station.stationName}
            </DropdownMenuSubTrigger>
       <DropdownMenuSubContent className="w-40 bg-white border rounded-md shadow-lg p-1">
         <DropdownMenuItem
           onClick={() => handleDownloadCurrentSite(selectedSite,  "pdf")}
           className="px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
         > 
           PDF
         </DropdownMenuItem>
         <DropdownMenuItem
          onClick={() => handleDownloadCurrentSite(selectedSite,"excel")}
          className="px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
        >
          Excel
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  ))
) : (
  <p className="px-3 py-2 text-gray-500">No stations available</p>
)}

  </DropdownMenuContent>
</DropdownMenu>
              <Button
                variant="outline"
                onClick={() => {
                  setActiveTab("sites");
                  setSelectedSite(null);
                }}
              >
                ← Back
              </Button>
            </div>
          </div>

          {selectedSite ? (
            <Card>
              <CardHeader className="px-4">
                <CardTitle>{selectedSite.siteName}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100">
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Site Name</TableHead>
                      <TableHead>Station Name</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Connector Type</TableHead>
                      <TableHead>Port Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
               <TableBody>
                {selectedSite?.stations?.length > 0 ? (
    selectedSite.stations.flatMap(station =>
      (station.ports || []).map(port => (
        <TableRow key={station.stationId + port.portId}>
          <TableCell>{station["serial number"] || station.serialNumber || "-"}</TableCell>
          <TableCell>{getDateFromSerial(station["serial number"] || station.serialNumber)}</TableCell>
          <TableCell>{displayValue(selectedSite.siteName)}</TableCell>
          <TableCell>{displayValue(station.stationName)}</TableCell>
          <TableCell>{port.capacity || "-"}</TableCell>
          <TableCell>{port.connectorType || "-"}</TableCell>
          <TableCell>{port.portType || "-"}</TableCell>
          <TableCell>
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
      <TableCell colSpan={9} className="text-center text-gray-500 py-4">
        No stations found for this site
      </TableCell>
    </TableRow>
  )}
</TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-center text-gray-500">Select a site to view stations</p>
          )}
        </TabsContent>
      </Tabs>
      <VerifyStationDialog
  open={verifyDialogOpen}
  onOpenChange={setVerifyDialogOpen}
  selectedStation={selectedStation}
  selectedSite={selectedSite}
  franchiseObj={franchiseObj}
  onVerifySuccess={(station) => {
    // Update local state for the current site
    setSelectedSite(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        stations: prev.stations.map(s => ({
          ...s,
          ports: s.ports.map(port => {
            if (port.portId === station.portId) {
              return { ...port, status: "Approved" };
            }
            return port;
          }),
        })),
      };
    });

    // Update variantMap
    setVariantMap(prev => ({
      ...prev,
      [`${station.stationId}_${station.portId}`]: 'default'
    }));

    setSelectedStation(null);
    dispatch(fetchRequestedData());
  }}
/>
    </div>
  );
}