import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import AxiosServices from '@/services/AxiosServices';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from 'react-redux';
import { InfoIcon } from 'lucide-react';
import { createRequest, fetchRequestedData, fetchRequestedDataDb } from '@/store/reducers/requests/RequestsSlice';
import FranchiseRequestsDetails from "./FranchiseRequestsDetails"; 
import { useToast } from "@/components/ui/use-toast";
import SiteRequestsDetails from './SiteRequestsDetails';
import { VerifyStationDialog } from './VerifyStationDialog';
import { Badge } from '@/components/ui/badge';
import Loading from '@/users/Loading';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

import { DownloadIcon } from "lucide-react";

export default function RequestsTabsStatic() {
  const { toast } = useToast();
  const dispatch = useDispatch();

  const BRAND_NAMES = ["HPCL", "BPCL", "IOCL", "Private"];
  
  const [activeTab, setActiveTab] = useState("franchise");
  const [viewMode, setViewMode] = useState("table"); 
  const [requestType, setRequestType] = useState("franchise");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState(null);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [currentView, setCurrentView] = useState("main"); // "main", "franchiseDetails", "siteDetails"
  const [ search, setSearch] = useState("");
  const [combinedRequests, setCombinedRequests] = useState([]);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [finalDeduplicated, setFinalDeduplicated] = useState([]);
  const [variantMap, setVariantMap] = useState({});
  const [loading, setLoading] = useState(true);
  const status = useSelector((state) => state.requests.status);
  const jsonRequests = useSelector(state => state.requests.jsonRequests);
  const dbRequests = useSelector(state => state.requests.dbRequests);

const { requestsData} = useSelector((state) => state.requests);

  const dbRequestsList = useSelector(state => state.requests.dbRequests.requests) || [];
  const jsonRequestsList = useSelector(state => state.requests.jsonRequests) || [];

  const allRequests = [...jsonRequestsList, ...dbRequestsList];

  //for franchiseRequests tab pagination

  // Add this with your other pagination states
// for franchise pagination
const [franchisePagination, setFranchisePagination] = useState({
  page: 1,
  pageSize: 10
});

const getPaginatedFranchises = (franchises) => {
  const { page, pageSize } = franchisePagination;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return franchises.slice(startIndex, endIndex);
};

const handleFranchisePageChange = (newPage) => {
  setFranchisePagination(prev => ({
    ...prev,
    page: newPage
  }));
};
// Add this with your other pagination controls
const FranchisePaginationControls = ({ currentPage, totalItems, pageSize, onPageChange }) => {
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
useEffect(() => {
  // Reset all pagination to page 1 when search changes
  setFranchisePagination(prev => ({
    ...prev,
    page: 1
  }));
  setSitePagination(prev => ({
    ...prev,
    page: 1
  }));
  setStationPagination(prev => ({
    ...prev,
    page: 1
  }));
}, [search]);

  //for site pagination
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

useEffect(() => {
  setSitePagination(prev => ({
    ...prev,
    page: 1
  }));
}, [search]);

//for station pagination
const [stationPagination, setStationPagination] = useState({
  page: 1,
  pageSize: 10
});

const getPaginatedStations = (stations) => {
  const { page, pageSize } = stationPagination;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return stations.slice(startIndex, endIndex);
};

const handleStationPageChange = (newPage) => {
  setStationPagination(prev => ({
    ...prev,
    page: newPage
  }));
};

const StationPaginationControls = ({ currentPage, totalItems, pageSize, onPageChange }) => {
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
useEffect(() => {
  // Reset both site and station pagination to page 1 when search changes
  setSitePagination(prev => ({
    ...prev,
    page: 1
  }));
  setStationPagination(prev => ({
    ...prev,
    page: 1
  }));
}, [search]);


  const [formData, setFormData] = useState({
    franchiseName: "",
    siteName: "",
    stationName: "",
    address: "",
    latitude: "",
    longitude: "",
    capacity: "",
    phoneNumber: "",
    email: "",
  });

  useEffect(() => {
    if (requestType === "franchise") {
      setFormData({
        franchiseName: "",
        siteName: "",
        stationName: "",
        address: "",
        latitude: "",
        longitude: "",
        capacity: "",
        phoneNumber: "",
        email: "",
      });
    } else if (requestType === "site") {
      setFormData({
        franchiseName: "GreenCharge EV Pvt Ltd",
        siteName: "",
        stationName: "",
        address: "",
        latitude: "",
        longitude: "",
        capacity: "",
        phoneNumber: "",
        email: "",
      });
    } else if (requestType === "station") {
      setFormData({
        franchiseName: "GreenCharge EV Pvt Ltd",
        siteName: "Hyderabad Central Site",
        stationName: "",
        address: "",
        latitude: "",
        longitude: "",
        capacity: "",
        phoneNumber: "",
        email: "",
      });
    }
  }, [requestType]);



const handleInfoClick = (item) => {
  console.log("Info clicked:", item);

  const BRAND_NAMES = ["HPCL", "BPCL", "IOCL", "Private"];
  const base = BRAND_NAMES.find(b =>
    item.franchiseName?.toUpperCase().includes(b)
  ) || item.franchiseName?.split(" ")[0]?.toUpperCase();

  if (item.category === "franchise") {
    // Normalize to ensure non-null, consistent object
    const normalizedFranchise = {
      id: item.id || Math.random(),
      category: "franchise",
      baseBrand: base,
      baseName: base,
      franchiseName: item.franchiseName?.split(",")[0]?.trim() || item.franchiseName, // 👉 short name only
      email: item.email || "-",
      phoneNumber: item.phoneNumber || "-",
      address: item.address || "-",
      source: item.source || "json",
    };

    console.log("Selected Franchise Object:", normalizedFranchise);
    setSelectedFranchise(normalizedFranchise);
    setCurrentView("franchiseDetails");
  } 
  else if (item.category === "site") {
    setSelectedSite(item);
    setCurrentView(activeTab === "site" ? "siteMainDetails" : "siteDetails");
  } 
  else if (item.category === "station") {
    setSelectedSite(item);
    setCurrentView("stationDetails");
  }
};

  const handleBackToMain = () => {
    setCurrentView("main");
    setSelectedFranchiseId(null);
    setSelectedSite(null);
  };

  const handleSiteClick = (site) => {
    setSelectedSite(site);
    setCurrentView("siteDetails");
  };

  const handleBackToFranchise = () => {
    setCurrentView("franchiseDetails");
    setSelectedSite(null);
  };

useEffect(() => {
  setSearch("");
}, [activeTab]);

const flattenStationsData = (data, source = "json") => {
  let flatSites = [];
  let flatStations = [];

  data.forEach(franchise => {
    const franchiseName = franchise.managerName || franchise.franchiseName || "Unknown Franchise";
    const locations = franchise.locations || [];
    const firstLocation = locations[0] || {};
    const firstStation = (franchise.stations || [])[0] || {};
    const port = firstStation.ports?.[0] || {};

    // Sites
    flatSites.push({
      id: franchise.siteId || franchise.id || Math.random(),
      category: "site",
      franchiseName,
      serialNumber: port.serialNumber || firstStation["serial number"] || "-", // ← add serialNumber
      siteName: franchise.siteName || franchise.sitename || "",
      address: firstLocation.address || franchise.address || "",
      latitude: firstLocation.latitude || franchise.latitude || "",
      longitude: firstLocation.longitude || franchise.longitude || "",
      source
    });

    // Stations
    (franchise.stations || []).forEach(station => {
      const port = station.ports?.[0] || {};
      flatStations.push({
        id: station.stationId || Math.random(),
        category: "station",
        franchiseName,
        siteName: franchise.siteName || franchise.sitename || "",
        stationName: station.stationName || "",
        capacity: port.capacity || franchise.chargerCapacity || "",
        connectorType: port.connectorType || "",
        serialNumber: station["serial number"] || port.serialNumber || "",
        portType: port.portType || "",
        address: firstLocation.address || franchise.address || "",
        latitude: firstLocation.latitude || franchise.latitude || "",
        longitude: firstLocation.longitude || franchise.longitude || "",
        source
      });
    });
  });

  return { flatSites, flatStations };
};

useEffect(() => {
  const fetchInitialData = async () => {
    setLoading(true); // show full-page loader only once
    await dispatch(fetchRequestedData({ search: "" }));
    await dispatch(fetchRequestedDataDb({ search: "" }));
    setLoading(false); // hide after first fetch
  };
  fetchInitialData();
}, [dispatch]);

console.log(" JSON Requests from Redux:", jsonRequests);
console.log(" DB Requests from Redux:", dbRequests);

const uniqueFranchises = combinedRequests
  .filter(r => r.category === "franchise")
  .reduce((acc, curr) => {
    const baseName = BRAND_NAMES.find(b =>
      curr.franchiseName.toUpperCase().includes(b)
    ) || curr.franchiseName.split(" ")[0].toUpperCase();

    if (!acc.some(f => f.baseName === baseName)) {
      acc.push({ ...curr, baseName }); // keep representative object
    }
    return acc;
  }, []);

const handleVerifyClick = (station) => {
  console.log("Station data for verification in Stations tab:", station);
  
  const portData = {
    portId: station.portId || `port_${station.stationId || station.id}`,
    capacity: station.capacity,
    connectorType: station.connectorType,
    portType: station.portType,
    status: station.portStatus || station.status
  };

  setSelectedStation({
    ...station,
    portId: portData.portId,
    stationId: station.stationId || station.id,
    siteId: station.siteId,
    
    franchiseName: station.franchiseName,
    siteName: station.siteName,
    stationName: station.stationName,
    serialNumber: station.serialNumber || "",
    
    capacity: portData.capacity,
    connectorType: portData.connectorType,
    portType: portData.portType,
    status: portData.status,
    
    address: station.address,
    latitude: station.latitude,
    longitude: station.longitude,
    
    email: station.email || "",
    mobileNumber: station.phoneNumber || station.mobileNumber || ""
  });
  
  setVerifyDialogOpen(true);
};

const getStatusVariant = async (status, portType) => {
  try {
    const response = await AxiosServices.getStations({ size: 100 });
    const stations = response?.data || response?.list || response?.stations || [];
    
    const matchedStation = stations.find((station) => 
      station.ocppid === `OCPP_${portType}`
    );

    if (matchedStation) {
      status = 'Approved';
    }
    
    switch (status?.toLowerCase()) {
      case 'active': 
      case 'verified': 
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'maintenance': return 'outline';
      default: return 'secondary';
    }
  } catch (error) {
    console.error('Error fetching stations:', error);
    return 'secondary';
  }
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

useEffect(() => {
  if (search.trim() === "") return;
  dispatch(fetchRequestedData({ search }));
  dispatch(fetchRequestedDataDb({ search }));
}, [dispatch, search]);

useEffect(() => {
  if (verifyDialogOpen === false && selectedStation) {
    dispatch(fetchRequestedData({search}));
    dispatch(fetchRequestedDataDb({ search }));
    setSelectedStation(null);
  }
}, [verifyDialogOpen, selectedStation, dispatch, search]);

const getDateFromSerial = (serialNumber) => {
  if (!serialNumber) return "-";

  const cleanSerial = serialNumber.replace(/\s+/g, "");
  const parts = cleanSerial.split(/[\/]+/);

  const datePart = parts.find(p => /\d{5,}/.test(p));
  if (!datePart) return "-";

  const match = datePart.match(/(\d{8})/);
  if (match) {
    const dateStr = match[1];
    const day = dateStr.slice(0, 2);
    const month = dateStr.slice(2, 4);
    const year = dateStr.slice(4);
    return `${day}/${month}/${year}`;
  }

  // If not 8 digits, fallback to your previous logic
  let day, month, year;
  year = datePart.slice(-4);
  const dmPart = datePart.slice(0, datePart.length - 4);

  if (dmPart.length === 2) {
    day = dmPart.slice(0, 1).padStart(2, "0");
    month = dmPart.slice(1, 2).padStart(2, "0");
  } else if (dmPart.length === 3) {
    const d2 = parseInt(dmPart.slice(0, 2));
    const m2 = parseInt(dmPart.slice(2));
    if (d2 <= 31 && m2 <= 12) {
      day = dmPart.slice(0, 2).padStart(2, "0");
      month = dmPart.slice(2).padStart(2, "0");
    } else {
      day = dmPart.slice(0, 1).padStart(2, "0");
      month = dmPart.slice(1).padStart(2, "0");
    }
  } else if (dmPart.length === 4) {
    day = dmPart.slice(0, 2).padStart(2, "0");
    month = dmPart.slice(2, 4).padStart(2, "0");
  } else if (dmPart.length === 1) {
    day = "0" + dmPart;
    month = "01";
  } else {
    return "-";
  }

  return `${day}/${month}/${year}`;
};

const filteredFranchises = uniqueFranchises.filter(f =>
  !search ||
  f.franchiseName?.toLowerCase().includes(search.toLowerCase()) ||
  (f.serialNumber && f.serialNumber.toLowerCase().includes(search.toLowerCase()))
);

const filteredRequests = combinedRequests.filter(item => {
  if (!search || search.trim() === "") return true;

  const s = search.toLowerCase();

  return (
    (item.franchiseName && item.franchiseName.toLowerCase().includes(s)) ||
    (item.siteName && item.siteName.toLowerCase().includes(s)) ||
    (item.stationName && item.stationName.toLowerCase().includes(s)) ||
    (item.serialNumber && item.serialNumber.toLowerCase().includes(s)) ||
    (item.address && item.address.toLowerCase().includes(s))
  );
});

const filteredStations = combinedRequests.filter(
  r => r.category === "station" &&
       (
         !search ||
         r.franchiseName?.toLowerCase().includes(search.toLowerCase()) ||
         r.siteName?.toLowerCase().includes(search.toLowerCase()) ||
         r.stationName?.toLowerCase().includes(search.toLowerCase()) ||
         r.serialNumber?.toLowerCase().includes(search.toLowerCase())
       )
);

useEffect(() => {
  if (!dbRequests && !jsonRequests) return;

  const normalizedDbFranchise = [];
  const seenFranchises = new Set();
  
  (dbRequests?.requests || []).forEach(r => {
    const franchiseName = r.franchiseName || r.managerName || "Unknown Franchise";
    const key = `${franchiseName}-${r.id || r.application_number}`;
    
    // Only add if not already seen
    if (!seenFranchises.has(key)) {
      seenFranchises.add(key);
      
      normalizedDbFranchise.push({
        id: r.id || Math.random(),
        category: "franchise",
        serialNumber: r.application_number || r.serialNumber || "-",
        franchiseName: franchiseName,
        siteName: r.siteName || r.sitename || "",
        stationName: r.stationName || "",
        address: r.address || r.locations?.[0]?.address || "",
        latitude: r.latitude || r.locations?.[0]?.latitude || "",
        longitude: r.longitude || r.locations?.[0]?.longitude || "",
        capacity: r.chargerCapacity || r.capacity || "-",
        phoneNumber: r.phoneNumber || r.managerPhone || "",
        email: r.email || r.managerEmail || "",
        source: "db",
      });
    }
  });

  // Process Sites - WITH DEDUPLICATION
  const siteDbData = [];
  const seenSites = new Set();
  
  (dbRequests?.requests || []).forEach((r, index) => {
    const siteKey = `${r.siteName || r.sitename}-${r.latitude}-${r.longitude}`;
    
    // Only add if not already seen
    if (!seenSites.has(siteKey)) {
      seenSites.add(siteKey);
      
      siteDbData.push({
        id: `site-${index}`,
        category: "site",
        franchiseName: r.managerName || r.franchiseName || "Unknown Franchise",
        siteName: r.siteName || r.sitename || "",
        address: r.address || r.locations?.[0]?.address || "",
        latitude: r.locations?.[0]?.latitude || "",
        longitude: r.locations?.[0]?.longitude || "",
        serialNumber: r.stations?.[0]?.ports?.[0]?.serialNumber || "-",
        source: "db",
      });
    }
  });

  // Process Stations - WITH DEDUPLICATION
  const stationDbData = [];
  const seenStations = new Set();
  
  (dbRequests?.requests || []).forEach((r, index) => {
    (r.stations || []).forEach((station, sIndex) => {
      const port = station.ports?.[0] || {};
      const stationKey = port.serialNumber || `${station.stationName}-${index}-${sIndex}`;
      
      // Only add if not already seen
      if (!seenStations.has(stationKey)) {
        seenStations.add(stationKey);
        
        stationDbData.push({
          id: stationKey,
          category: "station",
          franchiseName: r.managerName || r.franchiseName || "Unknown Franchise",
          siteName: r.siteName || r.sitename || "",
          stationName: station.stationName || "",
          serialNumber: port.serialNumber || "-",
          capacity: port.capacity || "",
          connectorType: port.connectorType || "",
          portType: port.portType || "",
          address: r.locations?.[0]?.address || "",
          latitude: r.locations?.[0]?.latitude || "",
          longitude: r.locations?.[0]?.longitude || "",
          status: "Pending",
          source: "db",
        });
      }
    });
  });

  const normalizedJsonFranchise = [];
  const seenJsonFranchises = new Set();
  
  (jsonRequests || []).forEach(r => {
    const franchiseName = r.managerName || "Unknown Franchise";
    const key = `${franchiseName}-${r.siteId || Math.random()}`;
    
    if (!seenJsonFranchises.has(key)) {
      seenJsonFranchises.add(key);
      
      normalizedJsonFranchise.push({
        id: r.siteId || Math.random(),
        category: "franchise",
        serialNumber: r.application_number || "-",
        franchiseName: franchiseName,
        siteName: r.siteName || "",
        stationName: r.stations?.[0]?.stationName || "",
        address: r.locations?.[0]?.address || "",
        latitude: r.locations?.[0]?.latitude || "",
        longitude: r.locations?.[0]?.longitude || "",
        capacity: r.stations?.[0]?.ports?.[0]?.capacity || "",
        phoneNumber: r.managerPhone || "",
        email: r.managerEmail || "",
        source: "json",
      });
    }
  });

  // Merge all data
  const merged = [
    ...normalizedDbFranchise,
    ...normalizedJsonFranchise,
    ...siteDbData,
    ...stationDbData
  ];

  const finalMap = new Map();

  const finalDeduplicated = Array.from(finalMap.values());

  const cleanMergedData = finalDeduplicated.map(item => {
    const cleaned = {};
    Object.entries(item).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim().toLowerCase() === "unknown") {
        cleaned[key] = "-";
      } else {
        cleaned[key] = value;
      }
    });
    return cleaned;
  });
  
  setCombinedRequests(cleanMergedData);
  const stationData = merged
  .filter(r => r.category === "station");
}, [dbRequests, jsonRequests]);

// to display "-" instead of "unknown in downloaded file data "
const formatValue = (value) => {
  if (value == null || value === "") return "-";
  if (typeof value === "string" && value.trim().toLowerCase() === "unknown") return "-";
  return value;
};

useEffect(() => {
  const merged = getAllData();

  const finalMap = new Map();

  merged.forEach(item => {
    let key;

    if (item.category === "station") {
      key = `station-${item.franchiseName}-${item.siteName}-${item.stationName}-${item.id}`;
    } 
    else if (item.category === "site") {
      key = `site-${item.siteName}-${item.latitude}-${item.longitude}`;
    } 
    else if (item.category === "franchise") {
      key = `franchise-${item.franchiseName}`;
    }

    if (key && !finalMap.has(key)) {
      finalMap.set(key, item);
    }
  });

  const deduped = Array.from(finalMap.values());

  setFinalDeduplicated(deduped);
  setCombinedRequests(deduped);

}, [dbRequests, jsonRequests]);

const getTableColumns = (tabType) => {
  switch (tabType) {
    case "franchise":
      return [
        { key: "franchiseName", label: "Franchise Name" },
        { key: "address", label: "Address"},
        { key: "email", label: "Email" },
        { key: "phoneNumber", label: "Phone Number" },
        {key: "actions", label: "Actions" }
      ];
    case "site":
      return [
        { key: "serialNumber", label: "Serial Number" },
        { key: "date", label: "Date" },
        { key: "franchiseName", label: "Franchise Name" },
        { key: "siteName", label: "Site Name" },
        { key: "address", label: "Address" },
        { key: "latitude", label: "Latitude" },
        { key: "longitude", label: "Longitude" },
        {key: "actions", label: "Actions" }

      ];
    case "station":
      return [
        { key: "serialNumber", label: "Serial Number" },
        { key: "date", label: "Date" },
         { key: "franchiseName", label: "Franchise Name" },
        { key: "siteName", label: "Site Name" },
        { key: "stationName", label: "Station Name" },
        { key: "capacity", label: "Capacity" },
        { key: "connectorType", label: "Connector Type" },
        { key: "portType", label: "Port Type" },
        {key: "status", label: "Status"},
        {key: "actions", label: "Actions" }
      ];
    default:
      return [];
  }
};

const getAllFranchises = () => {
    const allData = getAllData();
    const franchises = {};
    
    allData.forEach(item => {
      const franchiseName = item.managerName || 'Unknown Franchise';
      if (!franchises[franchiseName]) {
        franchises[franchiseName] = {
          franchiseName,
          email: item.managerEmail || "-",
          phoneNumber: item.managerPhone || "-",
          address: item.locations?.[0]?.address || "-",
        };
      }
    });
    
    return Object.values(franchises);
};

const getAllSites = () => {
  return combinedRequests.filter(r => r.category === "site");
};

const getAllStations = () => {
  return combinedRequests.filter(r => r.category === "station");
};

const getAllData = () => {
  const dbData = (dbRequests?.requests || []).map(d => ({
    ...d,
    managerName: d.franchiseName,
    siteName: d.siteName || d.sitename,
    category: d.category?.toLowerCase(),
  }));

  const jsonData = Array.isArray(jsonRequests)
    ? jsonRequests.map(j => ({
        ...j,
        category: j.category?.toLowerCase() || "station",
      }))
    : [];

  return [...dbData, ...jsonData];
};

const stationRequests = getAllData().filter(
  r => r.category === "station"
);

console.log("✅ StationRequestssssss:", stationRequests);

const getFranchiseData = (franchiseName) => {
    const allData = getAllData();
    const franchiseData = allData.filter(f =>
  f.franchiseName === franchiseName || 
  f.managerName === franchiseName
);

    // Extract stations data
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
        email: franchiseData[0]?.managerEmail || "-",
        phoneNumber: franchiseData[0]?.managerPhone || "-",
        address: franchiseData[0]?.locations?.[0]?.address || "-"
      },
      sites: franchiseData,
      stations: stationsData
    };
};

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

const handleDownloadAllStations = (format) => {
  const stations = getAllStations();
  if (!stations.length) return;

  // Group stations by franchise only
  const grouped = {};
  stations.forEach(station => {
    const franchise = station.franchiseName || "-";
    if (!grouped[franchise]) grouped[franchise] = [];
    grouped[franchise].push(station);
  });

  // --- PDF content ---
  let pdfContent = `<div class="section"><h2>All Stations</h2>`;
  for (const franchise in grouped) {
    const stationList = grouped[franchise];

    pdfContent += `
      <div style="margin-top:20px;">
        <h3><strong>Franchise Name:</strong> ${franchise}</h3>
        <table border="1" style="border-collapse:collapse;width:100%;">
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Date</th>
              <th>Site Name</th>
              <th>Station Name</th>
              <th>Capacity</th>
              <th>Connector Type</th>
              <th>Port Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${stationList.map(station => `
              <tr>
                <td>${station.serialNumber || "-"}</td>
                <td>${getDateFromSerial(station.serialNumber)}</td>
                <td>${station.siteName || "-"}</td>
                <td>${station.stationName || "-"}</td>
                <td>${station.capacity || "-"}</td>
                <td>${station.connectorType || "-"}</td>
                <td>${station.portType || "-"}</td>
                <td>${station.status || "-"}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  pdfContent += `</div>`;

  let excelData = "";
  for (const franchise in grouped) {
    const stationList = grouped[franchise];

    excelData += `Franchise Name: ${franchise}\n`;
    excelData += "Serial Number,Date,Site Name,Station Name,Capacity,Connector Type,Port Type,Status\n";
    stationList.forEach(station => {
      excelData += `"${station.serialNumber || "-"}","${getDateFromSerial(station.serialNumber)}","${station.siteName || "-"}","${station.stationName || "-"}","${station.capacity || "-"}","${station.connectorType || "-"}","${station.portType || "-"}","${station.status || "-"}"\n`;
    });
    excelData += "\n"; // blank line between franchises
  }

  const filename = "All_Stations_Report";
  if (format === "pdf") downloadPDF(pdfContent, filename);
  else downloadExcel(excelData, filename);
};

const handleDownloadAllSites = (format) => {
  const sites = getAllSites();
  if (!sites.length) return;

  const pdfContent = `
    <div class="section">
      <h2>All Sites</h2>
      <table>
        <thead>
          <tr>
            <th>Serial Number</th>
            <th>Date</th>
            <th>Franchise Name</th>
            <th>Site Name</th>
            <th>Address</th>
            <th>Latitude</th>
            <th>Longitude</th>
          </tr>
        </thead>
        <tbody>
          ${sites.map(site => `
            <tr>
              <td>${site.serialNumber || "-"}</td>
              <td>${getDateFromSerial(site.serialNumber)}</td>
              <td>${site.franchiseName || "-"}</td>
              <td>${site.siteName || "-"}</td>
              <td>${site.address || "-"}</td>
              <td>${site.latitude || "-"}</td>
              <td>${site.longitude || "-"}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  const excelData = [
    "Serial Number,Franchise Name,Site Name,Address,Latitude,Longitude",
    ...sites.map(site => 
      `"${site.serialNumber || "-"}","${site.franchiseName || "-"}","${site.siteName || "-"}","${site.address || "-"}","${site.latitude || "-"}","${site.longitude || "-"}"`
    )
  ].join("\n");

  const filename = "All_Sites_Report";

  if (format === "pdf") downloadPDF(pdfContent, filename);
  else downloadExcel(excelData, filename);
};

const handleDownloadAllFranchises = (format) => {

    const allFranchises = getAllFranchises();
    let pdfContent = '<div class="section"><h2>All Franchises Summary</h2>';
    let excelData = ["All Franchises Summary", "Franchise Name,Email,Phone Number,Address"];

    allFranchises.forEach(franchise => {
      pdfContent += `
        <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd;">
          <h3>${franchise.franchiseName}</h3>
          <p><strong>Email:</strong> ${franchise.email}</p>
          <p><strong>Phone:</strong> ${franchise.phoneNumber}</p>
        </div>
      `;
      excelData.push(`"${franchise.franchiseName}","${franchise.email}","${franchise.phoneNumber}","${franchise.address}"`);
    });

    pdfContent += '</div>';

    allFranchises.forEach(franchise => {
      const franchiseData = getFranchiseData(franchise.franchiseName);
      
      pdfContent += `
        <div class="section">
          <h2>${franchise.franchiseName} - Detailed Report</h2>
          <h3>Sites</h3>
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
              ${franchiseData.sites.map(site => `
                <tr>
                  <td>${site.stations?.[0]?.["serial number"] || site.stations?.[0]?.ports?.[0]?.serialNumber || "-"}</td>
                  <td>${getDateFromSerial(site.stations?.[0]?.["serial number"] || site.stations?.[0]?.ports?.[0]?.serialNumber)}</td>
                  <td>${formatValue(site.siteName) || "-"}</td>
                  <td>${site.locations?.[0]?.address || "-"}</td>
                  <td>${site.locations?.[0]?.latitude || "-"}</td>
                  <td>${site.locations?.[0]?.longitude || "-"}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h3>Stations</h3>
          <table>
            <thead>
              <tr>
                <th>Serial Number</th>
                <th>Date</th>
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
                  <td>${getDateFromSerial(station.serialNumber)}</td>
                  <td>${formatValue(station.siteName)}</td>
                  <td>${formatValue(station.stationName)}</td>
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

      excelData.push("", `${franchise.franchiseName} - Sites`, "Site Name,Address,Latitude,Longitude");
      franchiseData.sites.forEach(site => {
        excelData.push(`"${site.siteName || "-"}","${site.locations?.[0]?.address || "-"}","${site.locations?.[0]?.latitude || "-"}","${site.locations?.[0]?.longitude || "-"}"`);
      });

      excelData.push("", `${franchise.franchiseName} - Stations`, "Site Name,Station Name,Serial Number,Capacity,Connector Type,Port Type,Status");
      franchiseData.stations.forEach(station => {
        excelData.push(`"${station.siteName}","${station.stationName}","${station.serialNumber}","${station.capacity}","${station.connectorType}","${station.portType}","${station.status}"`);
      });
    });

    const filename = "All_Franchises_Complete_Report";

    if (format === 'pdf') {
      downloadPDF(pdfContent, filename);
    } else {
      downloadExcel(excelData.join('\n'), filename);
    }
};

const renderTable = (data, tabType) => {
  const columns = getTableColumns(tabType);
  return (
    <div className= "space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100">
              {columns.map((column) => (
                <TableHead key={column.key} className={tabType === "franchise" ? "text-sm" : "text-[10px]"}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
           <TableBody>
            {data.length > 0 ? (
              data.map((item) => (
                <TableRow key={`${item.source}-${item.id}-${Math.random()}`} className="hover:bg-slate-50">
                  {columns.map((column) => (
                    <TableCell key={column.key} className={`
                    ${tabType === "franchise" ? "text-sm" : "text-[10px]"} 
                    ${column.key === "latitude" ? "pr-0" : ""}
                    ${column.key === "longitude" ? "pl-0.5" : ""}
                  `} >                    
{column.key === "franchiseName"
  ? BRAND_NAMES.find(b => item.franchiseName.toUpperCase().includes(b)) || item.franchiseName
  : column.key === "date"
  ? getDateFromSerial(item.serialNumber) 
  : column.key === "status" && tabType === "station"
  ? (() => {
      const key = `${item.stationId || item.id}_${item.portId || 'default'}`;
      const variant = variantMap[key] || 'secondary';
      const displayStatus = item.status || 'Pending';
      return (
        <Badge variant={variant}>
          {displayStatus}
        </Badge>
      );
    })()
  : column.key === "actions" && tabType === "station" 
    ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleVerifyClick(item)}
          disabled={variantMap[`${item.stationId || item.id}_${item.portId || 'default'}`] === 'default' || item.status === "Approved"}
        >
          {variantMap[`${item.stationId || item.id}_${item.portId || 'default'}`] === 'default' || item.status === "Approved" 
            ? "Approved" 
            : "Verify"}
        </Button>
      )
  : column.key === "actions" && tabType !== "station"
    ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleInfoClick(item)}
        >
          <InfoIcon className="h-4 w-4" />
        </Button>
      )
  : item[column.key] || "-"}
                    </TableCell>
                  ))}
                
                </TableRow>
              ))
            ) : (
              <TableRow>
  <TableCell
    colSpan={columns.length}
    className="text-center py-8 text-muted-foreground"
  >
    No requests found
  </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

if (loading) {
  return (
    <div className="flex items-center justify-center h-[80vh]">
      <Loading />
    </div>
  );
}

if (currentView === "franchiseDetails") {
  return (
    <div className="container mx-auto p-4">
      <FranchiseRequestsDetails 
        franchiseObj={selectedFranchise} 
        onBack={handleBackToMain}       // ← just hides details
        onSiteClick={handleSiteClick}
      />
    </div>
  );
}
if (currentView === "siteDetails") {
  return (
    <div className="container mx-auto p-4">
      <SiteStationDetails 
        siteId={selectedSite.id}
        siteName={selectedSite.siteName}
        onBack={handleBackToFranchise}  // ← hides site details
      />
    </div>
  );
}

console.log("combinedRequests to download:", combinedRequests);

// view for main site details
if (currentView === "siteMainDetails") {
  return (
    <div className="container mx-auto p-4">
      <SiteRequestsDetails 
        siteObj={selectedSite}
        onBack={handleBackToMain} 
      />
    </div>
  );
}

return (
  <div className="container mx-auto p-4">
    {viewMode === "table" && currentView === "main" ? (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="franchise">Franchise Requests</TabsTrigger>
          <TabsTrigger value="site">Site Requests</TabsTrigger>
          <TabsTrigger value="station">Station Requests</TabsTrigger>
        </TabsList>

        <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">
          {activeTab === "franchise" && "Franchise Requests"}
          {activeTab === "site" && "Site Requests"}
          {activeTab === "station" && "Station Requests"}
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
        align="end" className="w-30 bg-white border rounded-md shadow-lg p-1 max-h-64">
        {activeTab === "franchise" && (
      <>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="p-2 text-sm cursor-pointer hover:bg-gray-100 rounded">
            All Franchises
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            className="w-20 bg-white border rounded-md shadow-lg p-1"
            alignOffset={-5}
          >
            <DropdownMenuItem
              onSelect={() => handleDownloadAllFranchises("pdf")}
              className="p-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
            >
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => handleDownloadAllFranchises("excel")}
              className="p-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
            >
              Excel
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </>
    )}
    {activeTab === "site" && (
      <>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded">
            All Sites
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            className="w-20 bg-white border rounded-md shadow-lg p-1"
            alignOffset={-5}
          >
            <DropdownMenuItem
              onSelect={() => handleDownloadAllSites("pdf")}
              className="p-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
            >
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => handleDownloadAllSites("excel")}
              className="p-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
            >
              Excel
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        </>
    )}
    {activeTab === "station" && (
      <>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded">
            All Stations
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            className="w-20 bg-white border rounded-md shadow-lg p-1"
            alignOffset={-5}
          >
            <DropdownMenuItem
              onSelect={() => handleDownloadAllStations("pdf")}
              className="px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
            >
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => handleDownloadAllStations("excel")}
              className="px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
            >
              Excel
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </>
    )}
  </DropdownMenuContent>
        </DropdownMenu>
</div>
<div className="flex gap-4 items-center mb-4">
            <Input
          placeholder="Search requests..."
            value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
          </div>

<TabsContent value="franchise">
  {renderTable(
    getPaginatedFranchises(filteredFranchises), 
    "franchise"
  )}
  <FranchisePaginationControls
    currentPage={franchisePagination.page}
    totalItems={filteredFranchises.length}
    pageSize={franchisePagination.pageSize}
    onPageChange={handleFranchisePageChange}
  />
</TabsContent>

<TabsContent value="site">
  {renderTable(
    getPaginatedSites(
      filteredRequests.filter(r => r.category === "site")
    ), 
    "site"
  )}
  <SitePaginationControls
    currentPage={sitePagination.page}
    totalItems={filteredRequests.filter(r => r.category === "site").length}
    pageSize={sitePagination.pageSize}
    onPageChange={handleSitePageChange}
  />
</TabsContent>
<TabsContent value="station">
  {renderTable(
    getPaginatedStations(filteredStations),
    "station"
  )}
  <StationPaginationControls
    currentPage={stationPagination.page}
    totalItems={filteredStations.length}
    pageSize={stationPagination.pageSize}
    onPageChange={handleStationPageChange}
  />
</TabsContent>

      </Tabs>
    ) : (
      renderForm()
    )}

<VerifyStationDialog
  open={verifyDialogOpen}
  onOpenChange={setVerifyDialogOpen}
  selectedStation={selectedStation}
  selectedSite={selectedSite}
  franchiseObj={{
    franchiseName: selectedStation?.franchiseName || "",
    email: selectedStation?.email || "",
    phoneNumber: selectedStation?.mobileNumber || selectedStation?.phoneNumber || ""
  }}
  onVerifySuccess={(verifiedStation) => {
    setStationRequests((prev) =>
      prev.map((s) =>
        s.stationId === verifiedStation.stationId
          ? { ...s, status: "Approved" }
          : s
      )
    );

    toast({
      title: "Verified!",
      description: `${verifiedStation.stationName} approved successfully.`,
    });
  }}
/>

  </div>
);
}