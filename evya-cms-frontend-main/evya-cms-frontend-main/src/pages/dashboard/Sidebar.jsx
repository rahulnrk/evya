import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardList, FileUpIcon, Logs, LogsIcon } from "lucide-react";
import { FaAddressBook, FaFileUpload } from 'react-icons/fa';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DashboardIcon,
  PersonIcon,
  TargetIcon,
  LightningBoltIcon,
  PlayIcon,
  ReaderIcon,
  CardStackIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  GearIcon,
  Share2Icon,
} from "@radix-ui/react-icons";
import logoUrl from '@/assets/logo.svg';
import { CompanyName } from '@/config';
import { BsHeartPulse } from "react-icons/bs";
import { HeadsetIcon, Truck } from 'lucide-react';

const MenuItem = ({ icon: Icon, label, href, subItems }) => {
  const location = useLocation();
  const isActive = href === '/'
    ? location.pathname === '/'
    : href && location.pathname.startsWith(href);
  const isSubItemActive = subItems?.some(subItem =>
    subItem.href === '/'
      ? location.pathname === '/'
      : subItem.href && location.pathname.startsWith(subItem.href)
  );
  const [isOpen, setIsOpen] = useState(isSubItemActive);

  if (subItems) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className={`w-full justify-between ${(isSubItemActive || isActive) ? 'bg-slate-200 font-bold' : ''}`}>
            <span className="flex items-center">
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </span>
            {isOpen ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6 space-y-1">
          {subItems.map((subItem, index) => {
            const isSubActive = subItem.href === '/'
              ? location.pathname === '/'
              : subItem.href && location.pathname.startsWith(subItem.href);
            return (
              <Button
                key={index}
                variant="ghost"
                className={`w-full justify-start ${isSubActive ? 'bg-slate-200 font-bold' : ''}`}
                asChild
              >
                <Link to={subItem.href}>{subItem.label}</Link>
              </Button>
            );
          })}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Button
      variant="ghost"
      className={`w-full justify-start ${isActive ? 'bg-slate-200 font-bold' : ''}`}
      asChild
    >
      <Link to={href}>
        <Icon className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
};

const Sidebar = () => {
  const { user } = useSelector(state => state.authentication);
  const roleId = Number(user?.roleId);

  // Define menu items for each role
  const menuItemsByRole = {
     1: [ // Admin role
      { icon: DashboardIcon, label: 'Dashboard', href: '/' },
      { icon: ClipboardList, label: "Requests", href: '/FranchiseRequests' },
      { icon: ReaderIcon, label: 'Reports', href: '/reports' },
      { icon: PersonIcon, label: 'WhiteLabel', href: '/whitelabels' },
      { icon: PersonIcon, label: 'Franchise Owners', href: '/franchiseOwners' },
      { icon: TargetIcon, label: 'Sites', href: '/sites'},
      { icon: LightningBoltIcon, label: 'Stations', href: '/stations' },
      { icon: GearIcon, label: 'Manufacturers', href: '/manufacturers' },
      { icon: PersonIcon, label: 'EV Users', href: '/evusers' },
      { icon: CardStackIcon, label: 'RFID Management', href: '/rfid' }, 
      { icon : HeadsetIcon, label: 'Customer Support', href: '/customer-support'},
      { icon: PersonIcon, label:'Charger Installation Team ', href: '/charger-installation-team'},
      { icon: Truck, label: 'Fleet', href: '/fleetManagement'},
      { icon: ExclamationTriangleIcon, label: 'Issues Tracker', href: '/issues-tracker' },
      { icon: PlayIcon, label: 'OCPP', href: '/ocpp' },
      { icon: CardStackIcon, label: 'Evya Sense', href: '/evyasense' },
      { icon: FileUpIcon, label: 'File Upload', href: '/senseupload' },
      // { icon: BsHeartPulse, label: "Charger Health", href: '/chargerhealth' },
      { icon: Share2Icon, label: 'Referral Codes', href: '/referral-codes' },    
      { icon: CardStackIcon, label: 'Loadmanagement', href: '/loading' },      
    ],
    3: [ // Whitelabel role
      { icon: DashboardIcon, label: 'Dashboard', href: '/' },
      // { icon: ReaderIcon, label: "Requests", href: '/FranchiseRequests'},
      { icon: ReaderIcon, label: 'Reports', href: '/reports' },
      { icon: PersonIcon, label: 'Franchise Owners', href: '/franchiseOwners' },
      { icon: TargetIcon, label: 'Sites', href: '/sites' },
      { icon: LightningBoltIcon, label: 'Stations', href: '/stations' },
      { icon: GearIcon, label: 'Manufacturers', href: '/manufacturers' },   
      { icon: PersonIcon, label: 'EV Users', href: '/evusers' },
      { icon: CardStackIcon, label: 'RFID Management', href: '/rfid' },
      { icon: HeadsetIcon, label: 'Customer Support', href: '/customer-support' },
      { icon: ExclamationTriangleIcon, label: 'Issues Tracker', href: '/issues-tracker' },
      { icon: Share2Icon, label: 'Referral Codes', href: '/referral-codes' },
      { icon: PlayIcon, label: 'OCPP', href: '/ocpp' },     
      { icon: CardStackIcon, label: 'Load Management', href: '/loading' },
      // { icon: BsHeartPulse, label: "Charger Health", href: '/chargerhealth' },
    ],
    4: [ // Franchise Owner role
      { icon: DashboardIcon, label: 'Dashboard', href: '/' },
      { icon: ReaderIcon, label: 'Reports', href: '/reports' },
      { icon: TargetIcon, label: 'Sites', href: '/sites' },
      { icon: LightningBoltIcon, label: 'Stations', href: '/stations' },
      { icon: ExclamationTriangleIcon, label: 'Issues Tracker', href: '/issues-tracker' },
      { icon: CardStackIcon, label: 'Load Management', href: '/loading' },
      // { icon: BsHeartPulse, label: "Charger Health", href: '/chargerhealth' },
    ],
     6: (() => {
  const designation = user?.designation?.toLowerCase();
  if (!designation) return [];
  
  if (designation.includes("customer care")) {
    return [
      { icon: HeadsetIcon, label: 'Customer care', href: '/customer-support' }
    ];
  }

  if (designation.includes("customer")) {
    return [
      { icon: DashboardIcon, label: 'Dashboard', href: '/customer-support/tasks' },
      { icon: PersonIcon, label: 'Solved Issues', href: '/customer-support/solved' }
    ];
  }

  if(designation.includes("charger installer")){
        return [
          { icon: DashboardIcon, label: 'Dashboard', href: '/technician-dashboard'},
          { icon: PersonIcon, label: 'Completed Tasks', href: '/technician/tasks/completed-tasks'},
        ]
      }

  return []; 
})(),

    default: [ 
      { icon: DashboardIcon, label: 'Dashboard', href: '/' }
    ]
  };

  // Get menu items based on role
  const menuItems = menuItemsByRole[roleId] || menuItemsByRole.default;

  return (
    <div className="w-64 h-screen bg-slate-50 border-r">
      <div className="p-4 flex items-center space-x-2 border-b">
        <img src={logoUrl} alt="EV Charge Logo" className="w-10 h-10" />
        <h2 className="text-xl font-bold">{CompanyName}</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <nav className="space-y-1 p-2">
          {menuItems.map((item, index) => (
            <MenuItem key={index} {...item} />
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;