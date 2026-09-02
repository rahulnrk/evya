import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchManufacturers,searchManufacturers } from '@/store/reducers/manufacturer/manufacturerSlice';
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AddManufacturer } from './dialog/AddManufacturer';
import { Info } from 'lucide-react';
import DeleteOtp from '@/users/DeleteOtp';
import Loading from '@/users/Loading';

const Manufacturers = () => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const[searchTerm,setSearchTerm]=useState('');
  const { toast } = useToast();
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  //for copilot
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false); 
    
  const { manufacturers, totalPages, currentPage, loading, error } = useSelector((state) => {

    const manufacturerState = state.manufacturer || {};
    return {
      manufacturers: manufacturerState.manufacturers || [],
      totalItems: manufacturerState.totalItems || 0,
      totalPages: manufacturerState.totalPages || 0,
      currentPage: manufacturerState.currentPage || 0,
      loading: manufacturerState.loading || false,
      error: manufacturerState.error || null
    };
  });

  useEffect(() => {
  const timerId = setTimeout(() => {
    setDebouncedSearchTerm(searchTerm);
  }, 500);

  return () => {
    clearTimeout(timerId);
  };
}, [searchTerm]);


//for copilot
 useEffect(() => {
    const handleOpenAddDialog = () => {
      console.log('🎯 Opening manufacturer dialog from Copilot');
      setIsAddDialogOpen(true);
    };

    window.addEventListener('openAddManufacturerDialog', handleOpenAddDialog);
    console.log('👂 Listening for openAddManufacturerDialog events');

    return () => {
      window.removeEventListener('openAddManufacturerDialog', handleOpenAddDialog);
    };
  }, []);

useEffect(() => {
  if (debouncedSearchTerm) {
    dispatch(searchManufacturers({ 
      search: debouncedSearchTerm, 
      page, 
      size: pageSize,
      searchField: ''
    }));
  } else {
    
    dispatch(fetchManufacturers({ page, pageSize }));
  }
}, [dispatch, page, pageSize, debouncedSearchTerm]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      setSelectedStationId(id);
      setIsDeleteDialogOpen(true);
      dispatch(fetchManufacturers({ page, pageSize }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete manufacturer: " + error.message,
        variant: "destructive",
      });
    }
  };
  const handleSearch = (e) => {
  setSearchTerm(e.target.value);
  setPage(0);
};

  const handleInfoClick = (e, id) => {
    e.stopPropagation();
    navigate(`/manufacturers/${id}`);
  };

  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Manufacturers</h1>
          {/* <AddManufacturer onSuccess={() => dispatch(fetchManufacturers({ page, pageSize }))} /> */}

           <AddManufacturer 
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={() => {
            setIsAddDialogOpen(false);
            dispatch(fetchManufacturers({ page, pageSize }));
          }} 
        />
        </div>
        <div className="mb-4 text-sm">
       <input
        type="text"
        placeholder="Search by name, country, or contact info..."
        value={searchTerm}
        onChange={handleSearch}
        className="border rounded-md p-2 w-full"
      />
      </div>
        <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
             {/* <TableHead>Manufacturer Id</TableHead> */}
              <TableHead>Manufacturer Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Mobile Number</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
         <TableBody>
          {loading ? ( 
            <TableRow >
              <TableCell colSpan={6} className="text-center py-4">
              <Loading />
              </TableCell>
            </TableRow>
          ):  manufacturers.length > 0 ? (
       manufacturers.map((manufacturer) => (
      <TableRow key={manufacturer.id || manufacturer.manufacturerName} className="hover:bg-gray-100">
        {/* <TableCell>{manufacturer.id || 'N/A'}</TableCell> */}
        <TableCell className="font-medium">{manufacturer.manufacturerName}</TableCell>
        <TableCell>{manufacturer.contactInfo}</TableCell>
        <TableCell>{manufacturer.mobileNumber || 'N/A'}</TableCell>
        <TableCell>{manufacturer.country || 'N/A'}</TableCell>
        <TableCell>
          <div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleInfoClick(e, manufacturer.id)}
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-4">
            {searchTerm ? 'No manufacturers match your search' : 'No manufacturers found'}
          </TableCell>
        </TableRow>
      )}
    </TableBody>
        </Table>
        </div>
          <div className="flex items-center justify-center gap-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          Previous
        </Button>

        {[...Array(totalPages)].map((_, index) => (
          <Button
            key={index}
            variant={index === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(index)}
          >
            {index + 1}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage + 1 === totalPages}
        >
          Next
        </Button>      
      </div> 
     {isDeleteDialogOpen && (
        <DeleteOtp
          userId={selectedStationId}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedStationId(null);
          }}
          onDeleted={handleDelete}
          role={"manufacturer"}
        />
      )}
    </div>
  );
};

export default Manufacturers;
// MANUFACTURER COMPONENT.................................