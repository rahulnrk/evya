import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchProfiles } from '@/store/reducers/profile/profilesSlice';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddProfileDialog from './AddProfile';
import { ProfilesTable } from './ProfilesTable';
import { UserProfileDialog } from './UserProfile';
import { useDebouncedCallback } from 'use-debounce';

export default function Profiles() {
  const dispatch = useDispatch();
  const { type = 'driver' } = useParams(); // Default to driver if not provided
  const { list, status, error, totalElements } = useSelector((state) => state.profiles);
  const [activeTab, setActiveTab] = useState(type === 'dealerAdmin' ? 'whitelabel' : type);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const profileTypeMapping = {
    "whitelabel": "White Labels",
    "driver": "EV Users"
  };

  // Function to handle tab changes
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setGlobalFilter('');
    // Reset pagination and fetch profiles for the new tab
    dispatch(fetchProfiles(newTab, {
      page: 0,
      size: 10,
      sortBy: 'id',
      orderBy: 'desc',
      filter: null
    }));
  };

  const debouncedSearch = useDebouncedCallback((value) => {
    dispatch(fetchProfiles(activeTab, {
      page: 0,
      size: 10,
      sortBy: 'id',
      orderBy: 'desc',
      filter: value || null
    }));
  }, 500);

  useEffect(() => {
    // Initial load of profiles
    dispatch(fetchProfiles(activeTab, {
      page: 0,
      size: 10,
      sortBy: 'id',
      orderBy: 'desc',
      filter: null
    }));
  }, [dispatch, activeTab]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setGlobalFilter(value);
    debouncedSearch(value);
  };

  const handleRowClick = useCallback((user) => {
    setSelectedUser(user);
    setIsProfileDialogOpen(true);
  }, []);

  const handleProfileDialogClose = useCallback(() => {
    setIsProfileDialogOpen(false);
    setSelectedUser(null);
    // Refresh the profiles list after dialog closes
    dispatch(fetchProfiles(activeTab, {
      page: 0,
      size: 10,
      sortBy: 'id',
      orderBy: 'desc',
      filter: globalFilter || null
    }));
  }, [dispatch, activeTab, globalFilter]);

  // Process data according to the active tab
  const processData = (data, activeTab) => {
    if (!data) return [];
    
    // For driver tab, extract from sites array if available
    if (activeTab === 'driver' && data.sites) {
      return data.sites;
    }
    
    // Return data as is
    return data;
  };

  if (status === 'loading' && !list.length) {
    return <div className="container mx-auto p-4 flex justify-center">Loading...</div>;
  }

  if (status === 'failed') {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="driver">EV Users</TabsTrigger>
            <TabsTrigger value="whitelabel">White Labels</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <AddProfileDialog profileType={activeTab} />
          </div>
        </div>
        
        <div className="mb-4">
          <Input
            placeholder="Search By Name, Phone, Email, RFID"
            value={globalFilter}
            onChange={handleSearchChange}
          />
        </div>
        
        <TabsContent value="driver">
          <h1 className="text-2xl font-bold mb-4">EV Users</h1>
          <ProfilesTable
            data={processData(list, 'driver')}
            globalFilter={globalFilter}
            totalElements={totalElements}
            onRowClick={handleRowClick}
            type="driver"
          />
        </TabsContent>
        
        <TabsContent value="whitelabel">
          <h1 className="text-2xl font-bold mb-4">White Labels</h1>
          <ProfilesTable
            data={list}
            globalFilter={globalFilter}
            totalElements={totalElements}
            onRowClick={handleRowClick}
            type="whitelabel"
          />
        </TabsContent>
      </Tabs>
      
      {selectedUser && (
        <UserProfileDialog
          open={isProfileDialogOpen}
          onOpenChange={handleProfileDialogClose}
          userId={selectedUser.id}
        />
      )}
    </div>
  );
}