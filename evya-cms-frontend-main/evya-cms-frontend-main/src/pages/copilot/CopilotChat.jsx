import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { fetchEmployeesByDesignation } from '@/store/reducers/employee/employeeSlice';

const CopilotChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const customerSupportEmployees = useSelector(state => state.employee.employeesByDesignation?.["Customer Support"] || []);

  const teams = useSelector(state => state.chargerInstallation?.teams || []);
const teamsRef = useRef(teams);
useEffect(() => {
  teamsRef.current = teams;
}, [teams]);

  const getBaseURL = () => {
    // If running on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8800';
    }
    // If running on production/deployed server
    return 'https://server.evyaa.com';
  };

  const baseURL = getBaseURL();

  // Initial bot message
  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: "👋 Hello! I'm your Copilot assistant.\n\nHow can I help you?",
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

// CopilotChat.js
useEffect(() => {
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.style.marginRight = isOpen ? '420px' : '0px';
  }
  return () => {
    if (mainContent) {
      mainContent.style.marginRight = '0px';
    }
  };
}, [isOpen]);

const handleAction = (action, componentName, route) => {
  console.log(`Triggering action: ${action} for ${componentName}`);
  console.log(`Route: ${route}, Current path: ${location.pathname}`);
  
  let formattedName = componentName;
  if (componentName === 'Manufacturer') {
    formattedName = 'Manufacturer';
  } else if (componentName === 'WhiteLabel') {
    formattedName = 'Whitelabel';
  } else if (componentName === 'Charger') {
    formattedName = 'Charger';
  } else {
    formattedName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
  }
  
  const actionLower = action.toLowerCase();
  
  // ========== SPECIAL HANDLING FOR CHARGER (separate page) ==========
  if (actionLower.includes('add') && componentName === 'Charger') {
    const pathMatch = location.pathname.match(/\/manufacturers\/(\d+)/);
    if (pathMatch) {
      navigate(`/addcharger/${pathMatch[1]}`);
    } else {
      const toastEvent = new CustomEvent('showToast', {
        detail: { title: 'Select Manufacturer First', description: 'Please go to a Manufacturer details page first, then click Add Charger', variant: 'info' }
      });
      window.dispatchEvent(toastEvent);
      navigate('/manufacturers');
    }
    return;
  }

  // ========== EV USER ACTIONS ==========
  // Add EV User (dialog on list page)
  if (action === 'OPEN_ADD_EVUSER_DIALOG') {
    if (location.pathname !== '/evusers') {
      navigate('/evusers');
      setTimeout(() => window.dispatchEvent(new Event('openAddEVUserDialog')), 400);
    } else {
      window.dispatchEvent(new Event('openAddEVUserDialog'));
    }
    return;
  }

  // ========== RFID Management: open activate dialog ==========
if (action === 'OPEN_ACTIVATE_RFID_DIALOG') {
    if (location.pathname !== '/rfid') {
        navigate('/rfid');
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('openActivateRfidDialog'));
        }, 400);
    } else {
        window.dispatchEvent(new CustomEvent('openActivateRfidDialog'));
    }
    return;
}

  // Add Vehicle (requires being on EV User details page)
  if (action === 'OPEN_ADD_VEHICLE_DIALOG') {
    const pathMatch = location.pathname.match(/\/evusers\/(\d+)/);
    if (pathMatch) {
      window.dispatchEvent(new Event('openAddVehicleDialog'));
    } else {
      const toastEvent = new CustomEvent('showToast', {
        detail: { title: 'Select EV User First', description: 'Please go to an EV User details page first', variant: 'info' }
      });
      window.dispatchEvent(toastEvent);
      navigate('/evusers');
    }
    return;
  }

  if (action === 'SWITCH_TO_VEHICLES_TAB') {
    const pathMatch = location.pathname.match(/\/evusers\/(\d+)/);
    if (pathMatch) {
        window.dispatchEvent(new CustomEvent('switchTab', { detail: { tab: 'vehicles' } }));
    } else {
        const toastEvent = new CustomEvent('showToast', {
            detail: { title: 'Select EV User First', description: 'Please go to an EV User details page first.', variant: 'info' }
        });
        window.dispatchEvent(toastEvent);
        navigate('/evusers');
    }
    return;
}

  // Request RFID (requires being on EV User details page)
  if (action === 'OPEN_REQUEST_RFID_DIALOG') {
    const pathMatch = location.pathname.match(/\/evusers\/(\d+)/);
    if (pathMatch) {
      window.dispatchEvent(new Event('openRequestRfidDialog'));
    } else {
      const toastEvent = new CustomEvent('showToast', {
        detail: { title: 'Select EV User First', description: 'Please go to an EV User details page first', variant: 'info' }
      });
      window.dispatchEvent(toastEvent);
      navigate('/evusers');
    }
    return;
  }

  // Switch to Wallet tab (requires being on EV User details page)
  if (action === 'SWITCH_TO_WALLET_TAB') {
    const pathMatch = location.pathname.match(/\/evusers\/(\d+)/);
    if (pathMatch) {
      window.dispatchEvent(new CustomEvent('switchTab', { detail: { tab: 'wallet' } }));
    } else {
      const toastEvent = new CustomEvent('showToast', {
        detail: { title: 'Select EV User First', description: 'Please go to an EV User details page first', variant: 'info' }
      });
      window.dispatchEvent(toastEvent);
      navigate('/evusers');
    }
    return;
  }

  // Switch to Transactions tab
  if (action === 'SWITCH_TO_TRANSACTIONS_TAB') {
    const pathMatch = location.pathname.match(/\/evusers\/(\d+)/);
    if (pathMatch) {
      window.dispatchEvent(new CustomEvent('switchTab', { detail: { tab: 'transactions' } }));
    } else {
      const toastEvent = new CustomEvent('showToast', {
        detail: { title: 'Select EV User First', description: 'Please go to an EV User details page first', variant: 'info' }
      });
      window.dispatchEvent(toastEvent);
      navigate('/evusers');
    }
    return;
  }

  // Reports actions
if (action === 'GENERATE_REPORT') {
    if (location.pathname !== '/reports') {
        navigate('/reports');
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('generateReport'));
        }, 400);
    } else {
        window.dispatchEvent(new CustomEvent('generateReport'));
    }
    return;
}
if (action === 'DOWNLOAD_REPORT_PDF') {
    if (location.pathname !== '/reports') {
        navigate('/reports');
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('downloadPDF'));
        }, 400);
    } else {
        window.dispatchEvent(new CustomEvent('downloadPDF'));
    }
    return;
}
if (action === 'DOWNLOAD_REPORT_EXCEL') {
    if (location.pathname !== '/reports') {
        navigate('/reports');
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('downloadExcel'));
        }, 400);
    } else {
        window.dispatchEvent(new CustomEvent('downloadExcel'));
    }
    return;
}

if (action === 'OPEN_ASSIGN_TASK_DIALOG') {
    const pathMatch = location.pathname.match(/\/charger-installation-team\/(\d+)/);
    
    if (pathMatch) {
        // Already on a member details page → open dialog
        window.dispatchEvent(new CustomEvent('openAssignTaskDialog'));
        return;
    }
    
    // Not on details page → get first team member
    const teamMembers = teamsRef.current;
    
    if (teamMembers && teamMembers.length > 0) {
        const firstMember = teamMembers[0];
        navigate(`/charger-installation-team/${firstMember.id}`, {
            state: { activeTab: 'tasks', assignNewTask: true }
        });
    } else {
        // No members exist yet → show toast and go to list
        navigate('/charger-installation-team');
        const toastEvent = new CustomEvent('showToast', {
            detail: {
                title: 'No Team Members',
                description: 'Please add a team member first, then try again.',
                variant: 'info'
            }
        });
        window.dispatchEvent(toastEvent);
    }
    return;
}


if (action === 'OPEN_REPORT_ISSUE_DIALOG') {
    const pathMatch = location.pathname.match(/\/customer-support\/(\d+)/);
    if (pathMatch) {
        // Already on details page → open dialog
        window.dispatchEvent(new CustomEvent('openReportIssueDialog'));
        return;
    }
    
    // Not on details page → get first customer support member
    const fetchMembers = async () => {
        let members = customerSupportEmployees;
        if (members.length === 0) {
            // Fetch if not already loaded
            const result = await dispatch(fetchEmployeesByDesignation("Customer Support")).unwrap();
            members = result;
        }
        
        if (members && members.length > 0) {
            const firstMember = members[0];
            // Navigate to details page with flag to open issue dialog
            navigate(`/customer-support/${firstMember.id}`, {
                state: { openReportCard: true, activeTab: "issues" }
            });
        } else {
            // No members exist → show toast and go to list
            const toastEvent = new CustomEvent('showToast', {
                detail: {
                    title: 'No Support Members',
                    description: 'Please add a customer support member first.',
                    variant: 'info'
                }
            });
            window.dispatchEvent(toastEvent);
            navigate('/customer-support');
        }
    };
    fetchMembers();
    return;
}
if (action === 'SWITCH_TO_TASKS_TAB') {
    // If on a team member details page, switch to tasks tab
    if (location.pathname.includes('/charger-installation-team/')) {
        window.dispatchEvent(new CustomEvent('switchTab', { detail: { tab: 'tasks' } }));
    } else if (location.pathname.includes('/customer-support/')) {
        window.dispatchEvent(new CustomEvent('switchTab', { detail: { tab: 'issues' } }));
    } else {
        const toastEvent = new CustomEvent('showToast', {
            detail: { title: 'Navigate First', description: 'Please go to an employee details page first.', variant: 'info' }
        });
        window.dispatchEvent(toastEvent);
    }
    return;
}

//for issue tracker
if (action === 'OPEN_ADD_ISSUE_FROM_TRACKER') {
  if (location.pathname !== '/issues-tracker') {
    navigate('/issues-tracker');
    setTimeout(() => {
      window.dispatchEvent(new Event('openAddIssueFromTracker'));
    }, 400);
  } else {
    window.dispatchEvent(new Event('openAddIssueFromTracker'));
  }
  return;
}

if (action === 'SHOW_TOAST_INSTRUCTION') {
    const toastEvent = new CustomEvent('showToast', {
        detail: {
            title: 'How to add a note',
            description: 'Click the info icon next to a task/issue, then click "Add Note" button.',
            variant: 'info'
        }
    });
    window.dispatchEvent(toastEvent);
    return;
}

// ========== TASK NOTES (auto-navigate to first team member and open notes) ==========
if (action === 'OPEN_TASK_NOTES_DIALOG') {
    const pathMatch = location.pathname.match(/\/charger-installation-team\/(\d+)/);
    if (pathMatch) {
        // Already on a member details page → open notes for the first task? 
        // Better to just show a toast or switch to tasks tab.
        window.dispatchEvent(new CustomEvent('switchTab', { detail: { tab: 'tasks' } }));
        window.dispatchEvent(new CustomEvent('openAddTaskNote'));
        return;
    }

    // Fetch team members (use Redux state or fetch)
    const fetchTeamMembers = async () => {
        let members = teamsRef.current;
        if (members.length === 0) {
            await dispatch(fetchTeams({ page: 0, size: 10, search: '' }));
            members = teamsRef.current;
        }
        if (members && members.length > 0) {
            const firstMember = members[0];
            navigate(`/charger-installation-team/${firstMember.id}`, {
                state: { activeTab: 'tasks', openAddTaskNote: true }
            });
        } else {
            window.dispatchEvent(new CustomEvent('showToast', {
                detail: { title: 'No Team Members', description: 'Please add a team member first.', variant: 'info' }
            }));
            navigate('/charger-installation-team');
        }
    };
    fetchTeamMembers();
    return;
}

// ========== ISSUE NOTES (auto-navigate to first support member and open notes) ==========
if (action === 'OPEN_ISSUE_NOTES_DIALOG') {
    const pathMatch = location.pathname.match(/\/customer-support\/(\d+)/);
    if (pathMatch) {
        window.dispatchEvent(new CustomEvent('switchTab', { detail: { tab: 'issues' } }));
        window.dispatchEvent(new CustomEvent('openAddIssueNote'));
        return;
    }

    const fetchSupportMembers = async () => {
        let members = customerSupportEmployees;
        if (members.length === 0) {
            await dispatch(fetchEmployeesByDesignation("Customer Support"));
            members = useSelector(state => state.employee.employeesByDesignation?.["Customer Support"] || []);
        }
        if (members && members.length > 0) {
            const firstMember = members[0];
            navigate(`/customer-support/${firstMember.id}`, {
                state: { activeTab: 'issues', openAddIssueNote: true }
            });
        } else {
            window.dispatchEvent(new CustomEvent('showToast', {
                detail: { title: 'No Support Members', description: 'Please add a customer support member first.', variant: 'info' }
            }));
            navigate('/customer-support');
        }
    };
    fetchSupportMembers();
    return;
}

  // ========== GENERIC ADD / EDIT / LIST / DELETE FOR OTHER COMPONENTS ==========
  if (actionLower.includes('add')) {
    // Generic add for components that are not separately handled
// Remove spaces from formattedName for a valid event name
const safeName = formattedName.replace(/\s/g, '');
const eventName = `openAdd${safeName}Dialog`;

if (location.pathname !== route) {
  navigate(route);
  setTimeout(() => {
    console.log(`Dispatching event: ${eventName}`);
    window.dispatchEvent(new Event(eventName));
  }, 400);
} else {
  console.log(`Already on page, dispatching: ${eventName}`);
  window.dispatchEvent(new Event(eventName));
}
  } 
  else if (actionLower.includes('edit')) {
    if (location.pathname !== route) {
      navigate(route);
      setTimeout(() => {
        const toastEvent = new CustomEvent('showToast', {
          detail: { title: `Edit ${formattedName}`, description: `Click the Edit button on the ${componentName.toLowerCase()} you want to modify`, variant: 'info' }
        });
        window.dispatchEvent(toastEvent);
      }, 300);
    } else {
      const toastEvent = new CustomEvent('showToast', {
        detail: { title: `Edit ${formattedName}`, description: `Click the Edit button on the ${componentName.toLowerCase()} you want to modify`, variant: 'info' }
      });
      window.dispatchEvent(toastEvent);
    }
  }
  else if (actionLower.includes('list') || actionLower.includes('navigate')) {
    if (route) navigate(route);
  }
  else if (actionLower.includes('delete')) {
    if (route) {
      navigate(route);
      setTimeout(() => {
        window.dispatchEvent(new Event(`openDelete${formattedName}Dialog`));
      }, 400);
    }
  }
};

  // 🔥 Generic function to open any add form
  const openAddForm = (componentName, route) => {
    if (location.pathname !== route) {
      navigate(route);
      setTimeout(() => {
        window.dispatchEvent(new Event(`openAdd${componentName}Dialog`));
      }, 400);
    } else {
      window.dispatchEvent(new Event(`openAdd${componentName}Dialog`));
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const question = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await axios.post(
        `${baseURL}/ai/ask`,
        question,
        {
          headers: { "Content-Type": "text/plain" }
        }
      );

      const raw = res.data;
      let parsedNav = null;

      try {
        if (typeof raw === "string" && raw.startsWith("{")) {
          parsedNav = JSON.parse(raw);
        } else if (typeof raw === "object") {
          parsedNav = raw;
        }
      } catch (e) {
        parsedNav = null;
      }

      // In the sendMessage function, when auto-navigating:
if (parsedNav && parsedNav.type === "steps") {
  const botMsg = {
    id: Date.now(),
    sender: 'bot',
    type: 'steps',
    steps: parsedNav.steps,
    route: parsedNav.route,
    componentName: parsedNav.componentName,
    parentComponent: parsedNav.parentComponent,
    parentRoute: parsedNav.parentRoute,
    requiresParentSelection: parsedNav.requiresParentSelection,
    timestamp: new Date()
  };

  setMessages(prev => [...prev, botMsg]);

  // Auto-navigate to the page if route provided
  if (parsedNav.route) {
    // Special handling for charger - don't auto-navigate without ID
    if (parsedNav.componentName !== 'Charger') {
      navigate(parsedNav.route);
    } else {
      // For charger, try to get manufacturer ID from current URL
      const pathMatch = location.pathname.match(/\/manufacturers\/(\d+)/);
      if (pathMatch) {
        navigate(`/addcharger/${pathMatch[1]}`);
      }
      // Otherwise, user will click the button which will handle it
    }
  }
}
      else if (parsedNav && parsedNav.type === "definition") {
        // Handle definition responses
        const botMsg = {
          id: Date.now(),
          sender: 'bot',
          type: 'definition',
          steps: parsedNav.steps,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
      }else if (parsedNav && parsedNav.type === "data") {
      const botMsg = {
          id: Date.now(),
          sender: 'bot',
          type: 'data',
          component: parsedNav.component,
          subComponent: parsedNav.subComponent, 
          count: parsedNav.count,
          items: parsedNav.items,
          listRoute: parsedNav.listRoute,
          timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
  }
      else {
  // Plain text response
  const botMsg = {
    id: Date.now(),
    text: raw,
    sender: 'bot',
    timestamp: new Date()
  };
  setMessages(prev => [...prev, botMsg]);

  // 🔥 Detect report‑related keywords and trigger events
  const lowerText = raw.toLowerCase();
  
  // Give time for any navigation from previous steps to complete
  setTimeout(() => {
    if (lowerText.includes('generate report')) {
      console.log('🎯 Auto‑triggering Generate Report');
      window.dispatchEvent(new CustomEvent('generateReport'));
    }
    if (lowerText.includes('download pdf')) {
      console.log('🎯 Auto‑triggering Download PDF');
      window.dispatchEvent(new CustomEvent('downloadPDF'));
    }
    if (lowerText.includes('download excel')) {
      console.log('🎯 Auto‑triggering Download Excel');
      window.dispatchEvent(new CustomEvent('downloadExcel'));
    }
  }, 500);
}

      if (!isOpen) setUnreadCount(prev => prev + 1);

    } catch (err) {
      console.error('API Error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          text: "❌ Server Error. Please try again.",
          sender: 'bot'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

const renderStep = (step, index, totalSteps, route, componentName, requiresParentSelection, parentComponent, parentRoute) => {
  

  
  // Handle string steps
  if (typeof step === "string") {
    // Special handling for Charger component (separate page requiring manufacturer ID)
    if (componentName === 'Charger' && index === 0) {
      const pathMatch = location.pathname.match(/\/manufacturers\/(\d+)/);
      
      if (pathMatch) {
        // User is on a manufacturer details page → provide direct link to add charger
        const manufacturerId = pathMatch[1];
        return (
          <p key={index}>
            {index + 1}. {step}{" "}
            <button
              onClick={() => navigate(`/addcharger/${manufacturerId}`)}
              className="text-blue-600 underline cursor-pointer hover:text-blue-800 ml-1"
            >
              👉 Click here to add
            </button>
          </p>
        );
      } else if (location.pathname === '/manufacturers') {
        // User is on the manufacturers list page → instruct to select a manufacturer
        return (
          <p key={index}>
            {index + 1}. {step}{" "}
            <span className="text-amber-600 text-sm">
              (Please click on a manufacturer first to go to its details page)
            </span>
          </p>
        );
      } else {
        // User is somewhere else → navigate to manufacturers list
        return (
          <p key={index}>
            {index + 1}. {step}{" "}
            <button
              onClick={() => navigate('/manufacturers')}
              className="text-blue-600 underline cursor-pointer hover:text-blue-800 ml-1"
            >
              👉 Go to Manufacturers first
            </button>
          </p>
        );
      }
    }
    
    // Default rendering for any other string step
    return (
      <p key={index}>
        {index + 1}. {step}
      </p>
    );
  }

  // Handle object steps with an action property (for dialog‑based components)
  if (typeof step === "object" && step.action) {
    const action = step.action;
    const text = step.text;
    
    // Extract component name from action if not already provided
    let extractedComponent = componentName;
    if (!extractedComponent && action) {
      const match = action.match(/OPEN_ADD_(.+)|OPEN_EDIT_(.+)|DELETE_(.+)/);
      if (match) {
        extractedComponent = (match[1] || match[2] || match[3])?.replace(/_/g, ' ');
      }
    }
    
    return (
      <p key={index}>
        {index + 1}. {text}{" "}
        
        {/* Show parent selection info if needed */}
        {requiresParentSelection && parentComponent && index === 0 && (
          <span className="text-amber-600 text-xs block mt-1">
            ℹ️ First select a {parentComponent} from the list
          </span>
        )}
        
        {/* Action button that calls handleAction */}
        <button
          onClick={() => {
            if (requiresParentSelection && parentComponent) {
              if (parentRoute) {
                navigate(parentRoute);
                alert(`Please select a ${parentComponent} first, then add ${extractedComponent}`);
              }
            } else {
              const compName = componentName || extractedComponent || "Whitelabel";
              handleAction(action, compName, route);
            }
          }}
          className="text-blue-600 underline cursor-pointer hover:text-blue-800 ml-1"
        >
          👉 Click here
        </button>
      </p>
    );
  }
  
  return null;
};

const renderDataMessage = (msg) => {
  // Whitelabel
  if (msg.component === 'whitelabel') {
    return (
      <div>
        <p className="font-medium mb-2">📋 Found {msg.count} Whitelabel(s):</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-1">Name</th>
                <th className="border p-1">Email</th>
                <th className="border p-1">Mobile</th>
                <th className="border p-1">Org Name</th>
               </tr>
            </thead>
            <tbody>
              {msg.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border p-1">{item.fullname}</td>
                  <td className="border p-1">{item.email}</td>
                  <td className="border p-1">{item.mobileNumber}</td>
                  <td className="border p-1">{item.orgName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {msg.listRoute && (
          <button
            onClick={() => navigate(msg.listRoute)}
            className="mt-2 text-xs text-blue-600 underline"
          >
            ➕ Go to full Whitelabel list page
          </button>
        )}
      </div>
    );
  }

  // Franchise
  if (msg.component === 'franchise') {
    return (
      <div>
        <p className="font-medium mb-2">📋 Found {msg.count} Franchise Owner(s):</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-1">Name</th>
                <th className="border p-1">Email</th>
                <th className="border p-1">Mobile</th>
                <th className="border p-1">Username</th>
                <th className="border p-1">Owner Org</th>
                <th className="border p-1">WhiteLabel</th>
              </tr>
            </thead>
            <tbody>
              {msg.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border p-1">{item.fullname}</td>
                  <td className="border p-1">{item.email}</td>
                  <td className="border p-1">{item.mobileNumber}</td>
                  <td className="border p-1">{item.username}</td>
                  <td className="border p-1">{item.ownerOrgName}</td>
                  <td className="border p-1">{item.wlOrgName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {msg.listRoute && (
          <button
            onClick={() => navigate(msg.listRoute)}
            className="mt-2 text-xs text-blue-600 underline"
          >
            ➕ Go to full Franchise list page
          </button>
        )}
      </div>
    );
  }

  // EV User
  if (msg.component === 'evuser') {
    return (
      <div>
        <p className="font-medium mb-2">📋 Found {msg.count} EV User(s):</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-1">Name</th>
                <th className="border p-1">Email</th>
                <th className="border p-1">Mobile</th>
                <th className="border p-1">Username</th>
                <th className="border p-1">Org Name</th>
                <th className="border p-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {msg.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border p-1">{item.fullname}</td>
                  <td className="border p-1">{item.email}</td>
                  <td className="border p-1">{item.mobileNumber}</td>
                  <td className="border p-1">{item.username}</td>
                  <td className="border p-1">{item.orgName}</td>
                  <td className="border p-1">{item.enabled ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {msg.listRoute && (
          <button
            onClick={() => navigate(msg.listRoute)}
            className="mt-2 text-xs text-blue-600 underline"
          >
            ➕ Go to full EV User list page
          </button>
        )}
      </div>
    );
  }

  if (msg.component === 'site') {
  return (
    <div>
      <p className="font-medium mb-2">📋 Found {msg.count} Site(s):</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-1">Site Name</th>
              <th className="border p-1">Owner Org</th>
              <th className="border p-1">WhiteLabel Org</th>
            </tr>
          </thead>
          <tbody>
            {msg.items.map((item, idx) => (
              <tr key={idx}>
                <td className="border p-1">{item.sitename}</td>
                <td className="border p-1">{item.owner_orgName || '-'}</td>
                <td className="border p-1">{item.white_lable_orgName || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {msg.listRoute && (
        <button onClick={() => navigate(msg.listRoute)} className="mt-2 text-xs text-blue-600 underline">
          ➕ Go to full Sites list page
        </button>
      )}
    </div>
  );
}

if (msg.component === 'station') {
    return (
        <div>
            <p className="font-medium mb-2">⚡ Found {msg.count} Station(s):</p>
            <div className="overflow-x-auto">
                <table className="min-w-full text-xs border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-1">Station Name</th>
                            <th className="border p-1">Status</th>
                            <th className="border p-1">Model</th>
                            <th className="border p-1">Serial No</th>
                            <th className="border p-1">Current Type</th>
                            <th className="border p-1">Power (kW)</th>
                            <th className="border p-1">Ports</th>
                          </tr>
                    </thead>
                    <tbody>
                        {msg.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="border p-1">{item.stationName}</td>
                                <td className="border p-1">{item.stationStatus}</td>
                                <td className="border p-1">{item.model}</td>
                                <td className="border p-1">{item.serialNo}</td>
                                <td className="border p-1">{item.current_type}</td>
                                <td className="border p-1">{item.max_output_power_kW}</td>
                                <td className="border p-1">{item.number_of_ports}</td>
                              </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {msg.listRoute && (
                <button onClick={() => navigate(msg.listRoute)} className="mt-2 text-xs text-blue-600 underline">
                    ➕ Go to full Stations list page
                </button>
            )}
        </div>
    );
}

if (msg.component === 'manufacturer') {
    return (
        <div>
            <p className="font-medium mb-2">🏭 Found {msg.count} Manufacturer(s):</p>
            <div className="overflow-x-auto">
                <table className="min-w-full text-xs border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-1">ID</th>
                            <th className="border p-1">Manufacturer Name</th>
                            <th className="border p-1">Country</th>
                            <th className="border p-1">Contact Info</th>
                            <th className="border p-1">Mobile Number</th>
                            <th className="border p-1"># Chargers</th>
                        </tr>
                    </thead>
                    <tbody>
                        {msg.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="border p-1">{item.id}</td>
                                <td className="border p-1">{item.manufacturerName}</td>
                                <td className="border p-1">{item.country}</td>
                                <td className="border p-1">{item.contactInfo}</td>
                                <td className="border p-1">{item.mobileNumber}</td>
                                <td className="border p-1">
                                    {item.chargingStation ? item.chargingStation.length : 0}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {msg.listRoute && (
                <button
                    onClick={() => navigate(msg.listRoute)}
                    className="mt-2 text-xs text-blue-600 underline"
                >
                    ➕ Go to full Manufacturers list page
                </button>
            )}
        </div>
    );
}

if (msg.component === 'rfid') {
  if (msg.subComponent === 'pending') {
    // ---------- PENDING RFID REQUESTS TABLE ----------
    return (
      <div>
        <p className="font-medium mb-2">🆔 Found {msg.count} Pending RFID Request(s):</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-1">Order ID</th>
                <th className="border p-1">User ID</th>
                <th className="border p-1">Name</th>
                <th className="border p-1">Email</th>
                <th className="border p-1">Mobile</th>
                <th className="border p-1">RFID Count</th>
                <th className="border p-1">Status</th>
                <th className="border p-1">Action</th>
              </tr>
            </thead>
            <tbody>
              {msg.items.map((req, idx) => (
                <tr key={idx}>
                  <td className="border p-1">{req.orderId || '—'}</td>
                  <td className="border p-1">{req.userId}</td>
                  <td className="border p-1">{req.firstName} {req.lastName}</td>
                  <td className="border p-1">{req.email}</td>
                  <td className="border p-1">{req.mobile}</td>
                  <td className="border p-1">{req.rfidCount}</td>
                  <td className="border p-1">{req.status}</td>
                  <td className="border p-1">
                    <button
                      onClick={() => console.log('Activate', req.id)}
                      className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs"
                    >
                      Activate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {msg.listRoute && (
          <button
            onClick={() => navigate(msg.listRoute)}
            className="mt-2 text-xs text-blue-600 underline"
          >
            ➕ Go to full RFID Management page
          </button>
        )}
      </div>
    );
  } 
  else if (msg.subComponent === 'issued') {
    // ---------- ISSUED RFID CARDS TABLE ----------
    return (
      <div>
        <p className="font-medium mb-2">💳 Found {msg.count} Issued RFID Card(s):</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-1">RFID Hex / ID</th>
                <th className="border p-1">User ID</th>
                <th className="border p-1">Phone</th>
                <th className="border p-1">Expiry Date</th>
                <th className="border p-1">Status</th>
                <th className="border p-1">Action</th>
              </tr>
            </thead>
            <tbody>
              {msg.items.map((card, idx) => (
                <tr key={idx}>
                  <td className="border p-1">{card.rfidHex || card.rfId || '—'}</td>
                  <td className="border p-1">{card.userId}</td>
                  <td className="border p-1">{card.phone}</td>
                  <td className="border p-1">
                    {card.expiryDate ? new Date(card.expiryDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="border p-1">
                    <span className={`px-1 rounded ${card.status === 'Active' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                      {card.status || 'Inactive'}
                    </span>
                  </td>
                  <td className="border p-1">
                    <button
                      onClick={() => console.log('Toggle status', card.rfId)}
                      className="bg-yellow-500 text-white px-2 py-0.5 rounded text-xs"
                    >
                      Toggle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {msg.listRoute && (
          <button
            onClick={() => navigate(msg.listRoute)}
            className="mt-2 text-xs text-blue-600 underline"
          >
            ➕ Go to full RFID Management page
          </button>
        )}
      </div>
    );
  }
  // fallback (should not happen)
  return <div>No RFID data available.</div>;
}
  // Fallback for unknown component types
  return null;
};

  return (
    <>
      {/* Floating Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative bg-purple-100 hover:bg-purple-200 rounded-full"
        onClick={() => {
          setIsOpen(!isOpen);
          setUnreadCount(0);
        }}
      >
        <Bot className="h-5 w-5 text-purple-700" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Sidebar */}
      {isOpen && (
        <div className="fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col border-l">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 bg-purple-600 text-white">
                <AvatarFallback>🤖</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">Copilot Assistant</h3>
                <p className="text-xs text-gray-500">AI-powered help</p>
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`mb-4 flex ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">

                    {/* Steps with actions */}
                    {msg.type === 'steps' && msg.steps && (
                      <div className="space-y-2">
                        {msg.steps.map((step, idx) => 
                          renderStep(
                            step, 
                            idx, 
                            msg.steps.length, 
                            msg.route, 
                            msg.componentName,
                            msg.requiresParentSelection,
                            msg.parentComponent,
                            msg.parentRoute
                          )
                        )}
                      </div>
                    )}

                    {/* Definition response */}
                    {msg.type === 'definition' && msg.steps && (
                      <div className="space-y-1">
                        {msg.steps.map((step, idx) => (
                          <p key={idx}>• {step}</p>
                        ))}
                      </div>
                    )}

                    {/* Data response (actual API data) */}
                    {msg.type === 'data' && renderDataMessage(msg)}

                    {/* Plain text response */}
                    {!msg.type && msg.text && (
                      <div>{msg.text}</div>
                    )}

                  </div>
                  
                  {/* Timestamp */}
                  {msg.timestamp && (
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-white border shadow-sm rounded-lg p-3">
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <div className="animate-pulse">🤖</div>
                    Typing...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything... (e.g., 'how to add franchise')"
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button 
                onClick={sendMessage} 
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-gray-400 mt-2 text-center">
              Try: "add whitelabel", "show franchises", "edit site", "delete station"
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CopilotChat;

//copilot component before get API...