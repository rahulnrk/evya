//package com.ewe.controller;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.web.bind.annotation.*;
//import javax.annotation.PostConstruct;          // <-- ADDED
//import java.net.URI;
//import java.net.http.HttpClient;
//import java.net.http.HttpRequest;
//import java.net.http.HttpResponse;
//import java.util.*;
//import java.util.stream.Collectors;
//
//import org.json.JSONArray;
//import org.json.JSONObject;
//
//import com.ewe.form.DataResponse;
//import com.ewe.pojo.Employee;
//import com.ewe.pojo.IssueReporting;
//import com.ewe.pojo.ManufacturerDetails;
//import com.ewe.pojo.RFID;
//import com.ewe.pojo.RFIDRequests;
//import com.ewe.pojo.Station;
//import com.ewe.pojo.TaskAssignment;
//import com.ewe.pojo.User;
//import com.ewe.service.EmployeeService;
//import com.ewe.service.ManufacturerService;
//import com.ewe.service.RFIDService;
//import com.ewe.service.SiteService;
//import com.ewe.service.StationService;
//import com.ewe.service.TaskService;
//import com.ewe.service.UserService;
//import com.fasterxml.jackson.databind.ObjectMapper;
//
//@RestController
//@RequestMapping("/ai")
//public class AiController {
//
//    private static final HttpClient client = HttpClient.newHttpClient();
//
//    private static final ObjectMapper MAPPER = new ObjectMapper();
//
//    @Value("${grok.api.key:}")
//    private String grokApiKey;
//    
//    @Value("${server.port:8800}")
//    private String serverPort;
//    
//    @Autowired
//    private UserService userService;
//    @Autowired
//    private SiteService siteService;
//    @Autowired
//    private StationService stationService;
//    @Autowired
//    private ManufacturerService manufacturerService;
//    @Autowired
//    private RFIDService rfidService;
//    @Autowired
//    private EmployeeService employeeService;
//
//    @Autowired
//    private TaskService taskService;
//
//    // ==================== COMPONENT CONFIGURATION ====================
//    
//    private static class ComponentFlow {
//        String name;
//        String listRoute;      
//        String addRoute;       
//        String editRoute;      
//        String viewRoute;      
//        String parent;         
//        List<String> aliases;
//        boolean isAddSeparatePage;
//        
//        ComponentFlow(String name, String listRoute, String addRoute, String editRoute, String viewRoute) {
//            this.name = name;
//            this.listRoute = listRoute;
//            this.addRoute = addRoute;
//            this.editRoute = editRoute;
//            this.viewRoute = viewRoute;
//            this.aliases = new ArrayList<>();
//            this.parent = null;
//            this.isAddSeparatePage = false;
//        }
//        
//        ComponentFlow withSeparateAddPage() {
//            this.isAddSeparatePage = true;
//            return this;
//        }
//        
//        ComponentFlow withAlias(String... aliases) {
//            for (String alias : aliases) {
//                this.aliases.add(alias);
//            }
//            return this;
//        }
//        
//        ComponentFlow withParent(String parent) {
//            this.parent = parent;
//            return this;
//        }
//    }
//    
//    // Registry of all components
//    private Map<String, ComponentFlow> componentFlows = new LinkedHashMap<>();
//    
//    // ==================== DEFINITION KNOWLEDGE BASE ====================
//    private Map<String, List<String>> definitionMap = new LinkedHashMap<>();
//
//    @PostConstruct
//    public void init() {
//        initializeComponents();
//        initializeDefinitions();
//        initializeHierarchy(); 
//    }
//    
//    private void initializeDefinitions() {
//        // Dashboard
//        definitionMap.put("dashboard", Arrays.asList(
//            "Stats and graphs of energy delivered",
//            "Revenue overview",
//            "Number of EV users per whitelabel",
//            "Total charging sessions",
//            "Port status distribution (Available, Charging, Inoperative, Reserved, Blocked, Planned, Removed, SuspendedEVSE, SuspendedEV)"
//        ));
//        // Requests
//        definitionMap.put("requests", Arrays.asList(
//            "Manage franchise requests from mobile app",
//            "Manage site requests from mobile app",
//            "Manage station requests from mobile app",
//            "Verify and approve those requests"
//        ));
//        // Reports
//        definitionMap.put("reports", Arrays.asList(
//            "View and generate reports of sites and stations",
//            "Filter reports by date",
//            "Download transaction reports (energy, revenue, consumption)"
//        ));
//        // Whitelabel
//        definitionMap.put("whitelabel", Arrays.asList(
//            "Rebranding a product or service",
//            "Removing original branding",
//            "Replacing with own branding",
//            "Reselling as own product",
//            "Customizing the interface"
//        ));
//        // Franchise Owner
//        definitionMap.put("franchise_owner", Arrays.asList(
//            "Business model",
//            "Licensed to operate",
//            "Under existing brand",
//            "Paying royalties",
//            "Following guidelines"
//        ));
//        // Site
//        definitionMap.put("site", Arrays.asList(
//            "Physical location",
//            "Contains related information (address, capacity, etc.)",
//            "Each site has multiple stations"
//        ));
//        // Station
//        definitionMap.put("station", Arrays.asList(
//            "Charging station where vehicles can charge",
//            "Contains ports"
//        ));
//        // Manufacturer
//        definitionMap.put("manufacturer", Arrays.asList(
//            "Entity producing goods (chargers)",
//            "Company creating products",
//            "Producer of merchandise",
//            "Each manufacturer can have multiple chargers"
//        ));
//        // EV User
//        definitionMap.put("evuser", Arrays.asList(
//            "Actual user of EV vehicle / driver",
//            "Can have vehicles, RFID, wallet, transactions"
//        ));
//        // RFID Management
//        definitionMap.put("rfid_management", Arrays.asList(
//            "Manages RFID requests raised by EV users",
//            "Approve requested RFID cards"
//        ));
//        // Customer Support
//        definitionMap.put("customer_support", Arrays.asList(
//            "Support team that solves assigned issues",
//            "Can raise issues",
//            "Can add notes to issues"
//        ));
//        // Charger Installation Team
//        definitionMap.put("charger_installation_team", Arrays.asList(
//            "Group of members to install chargers",
//            "Admin can assign tasks to team members",
//            "Notes for each task"
//        ));
//        // Fleet
//        definitionMap.put("fleet", Arrays.asList(
//            "Group of vehicles",
//            "Number of fleets available",
//            "Each fleet contains vehicles"
//        ));
//        // Issue Tracker
//        definitionMap.put("issue_tracker", Arrays.asList(
//            "Report an issue",
//            "Assign issue to customer support"
//        ));
//        // OCPP
//        definitionMap.put("ocpp", Arrays.asList(
//            "Open Charge Point Protocol",
//            "Communication between chargers and CMS (Central Management System)",
//            "Handle OCPP commands"
//        ));
//        // Referral Code
//        definitionMap.put("referral_code", Arrays.asList(
//            "Refer the app or website"
//        ));
//    }
//    
//    private static final Set<String> ALLOWED_DELETE_COMPONENTS = new HashSet<>(Arrays.asList(
//        "vehicle",        // Vehicle inside EV user
//        "rfidrequest",    // RFID Request inside EV user or RFID Management
//        "referral",       // Referral Code
//        "tasknote",        // Task Note in Charger Installation Team
//        "issuenote"        //issue note in customer support
//    ));
//
//    private boolean isDefinitionQuestion(String q) {
//        return q.matches(".*\\b(what is|what's|purpose of|definition of|define|explain|tell me about|describe|meaning of|role of| elaborate|role playing)\\b.*");
//    }
//    
//    private boolean isRfidRequestQuestion(String q) {
//        q = q.toLowerCase();
//        // If it's a delete or remove operation, it's NOT a "request" operation
//        if (q.contains("delete") || q.contains("remove")) return false;
//        
//        return q.matches(".*\\b(request|requests|req|obtain|acquire|apply for|ask for)\\b.*\\brfid\\b.*") &&
//               !q.matches(".*\\b(approve|activate|add|generate|create|issue|verify|confirm)\\b.*\\brfid\\b.*");
//    }
//
//    private boolean isRfidActivationQuestion(String q) {
//        q = q.toLowerCase();
//        return q.matches(".*\\b(approve|activate|add|generate|create|issue|verify|confirm|enable|authorize)\\b.*\\brfid\\b.*");
//    }
//    
// // ==================== RFID LIMIT & COST ====================
//
//    private boolean isRfidMaxLimitQuestion(String q) {
//        q = q.toLowerCase();
//        return q.matches(".*\\b(how many|max|maximum|limit|allowed|can|able to)\\b.*\\brfid\\b.*\\b(request|get|have)\\b.*") ||
//               q.matches(".*\\b(rfid limit|max rfid|rfid per user|rfid request limit)\\b.*");
//    }
//
//    private String buildRfidMaxLimitResponse() {
//        JSONObject response = new JSONObject();
//        JSONArray steps = new JSONArray();
//        steps.put("Each EV user can request a maximum of 5 RFID cards.");
//        response.put("type", "definition");
//        response.put("steps", steps);
//        return response.toString();
//    }
//
//    private boolean isRfidCostQuestion(String q) {
//        q = q.toLowerCase();
//        return q.matches(".*\\b(money|cost|price|charge|fee|amount|pay|payment)\\b.*\\brfid\\b.*") ||
//               q.matches(".*\\b(rfid (cost|price|fee))\\b.*");
//    }
//
//    private String buildRfidCostResponse() {
//        JSONObject response = new JSONObject();
//        JSONArray steps = new JSONArray();
//        steps.put("As per company norms, charges may vary for RFID request. Please check with your administrator for the exact fee.");
//        response.put("type", "definition");
//        response.put("steps", steps);
//        return response.toString();
//    }
//
////    //for whitelabel getAPI 
////    private String buildDataListResponse(ComponentFlow comp, String query) {
////        JSONObject response = new JSONObject();
////        try {
////            // Fetch whitelabels (no search for now, you can add later)
////            List<Map<String, Object>> whitelabels = userService.getAllWhiteLabels(null);
////            
////            JSONArray items = new JSONArray();
////            for (Map<String, Object> wl : whitelabels) {
////                JSONObject item = new JSONObject();
////                item.put("userId", wl.get("userId"));
////                item.put("fullname", wl.get("fullname"));
////                item.put("email", wl.get("email"));
////                item.put("mobileNumber", wl.get("mobilenumber"));
////                item.put("orgName", wl.get("orgName"));
////                item.put("orgId", wl.get("orgId"));
////                items.put(item);
////            }
////            
////            response.put("type", "data");
////            response.put("component", "whitelabel");
////            response.put("count", whitelabels.size());
////            response.put("items", items);
////            response.put("listRoute", comp.listRoute); // still provide navigation if needed
////        } catch (Exception e) {
////            response.put("type", "error");
////            response.put("message", "Failed to fetch whitelabels: " + e.getMessage());
////        }
////        return response.toString();
////    }
//
//    
//    //for whitelabel getAPI
//    private String buildDataListResponse(ComponentFlow comp, String query) {
//        try {
//            List<Map<String, Object>> whitelabels = userService.getAllWhiteLabels(null);
//            DataResponse<Map<String, Object>> response = new DataResponse<>();
//            response.setType("data");
//            response.setComponent("whitelabel");
//            response.setCount(whitelabels.size());
//            response.setItems(whitelabels);   
//            response.setListRoute(comp.listRoute);
//            return new ObjectMapper().writeValueAsString(response);
//        } catch (Exception e) {
//            return errorResponse(e.getMessage());
//        }
//    }
//    
//    private String errorResponse(String message) {
//        try {
//            Map<String, String> error = new HashMap<>();
//            error.put("type", "error");
//            error.put("message", message);
//            return new ObjectMapper().writeValueAsString(error);
//        } catch (Exception e) {
//            return "{\"type\":\"error\",\"message\":\"Unknown error\"}";
//        }
//    }
////	//for franchise owner getAPI
////    private String buildFranchiseDataListResponse(ComponentFlow comp, String query) {
////        JSONObject response = new JSONObject();
////        try {
////            List<Map<String, Object>> franchises = userService.getAllOwners(null, null);
////            JSONArray items = new JSONArray();
////            for (Map<String, Object> f : franchises) {
////                JSONObject item = new JSONObject();
////                item.put("userId", f.get("userId"));
////                item.put("fullname", f.get("fullname"));
////                item.put("email", f.get("email"));
////                item.put("mobileNumber", f.get("mobilenumber"));
////                item.put("username", f.get("username"));
////                item.put("ownerOrgName", f.get("owner_orgName"));
////                item.put("ownerOrgId", f.get("owner_orgId"));
////                item.put("wlOrgName", f.get("wl_orgName"));
////                item.put("wlOrgId", f.get("wl_orgId"));
////                items.put(item);
////            }
////            response.put("type", "data");
////            response.put("component", "franchise");
////            response.put("count", franchises.size());
////            response.put("items", items);
////            response.put("listRoute", comp.listRoute);
////        } catch (Exception e) {
////            response.put("type", "error");
////            response.put("message", "Failed to fetch franchises: " + e.getMessage());
////        }
////        return response.toString();
////    }
//    
//    //for franchise get API
//    private String buildFranchiseDataListResponse(ComponentFlow comp, String query) {
//        try {
//            List<Map<String, Object>> franchises = userService.getAllOwners(null, null);
//            DataResponse<Map<String, Object>> response = new DataResponse<>();
//            response.setType("data");
//            response.setComponent("franchise");
//            response.setCount(franchises.size());
//            response.setItems(franchises);
//            response.setListRoute(comp.listRoute);
//            return new ObjectMapper().writeValueAsString(response);
//        } catch (Exception e) {
//            return errorResponse(e.getMessage());
//        }
//    }
//    
////    //for evusers getAPI
////    private String buildEvUserDataListResponse(ComponentFlow comp, String query) {
////        JSONObject response = new JSONObject();
////        try {
////            List<User> evUsers = userService.getAllDrivers(null, null);
////            JSONArray items = new JSONArray();
////            for (User u : evUsers) {
////                JSONObject item = new JSONObject();
////                item.put("userId", u.getId());
////                item.put("fullname", u.getFullname());
////                item.put("email", u.getEmail());
////                item.put("mobileNumber", u.getMobileNumber());
////                item.put("username", u.getUsername());
////                item.put("enabled", u.isEnabled());
////                item.put("orgName", u.getOrgName() != null ? u.getOrgName() : "");
////                items.put(item);
////            }
////            response.put("type", "data");
////            response.put("component", "evuser");
////            response.put("count", evUsers.size());
////            response.put("items", items);
////            response.put("listRoute", comp.listRoute);
////        } catch (Exception e) {
////            response.put("type", "error");
////            response.put("message", "Failed to fetch EV users: " + e.getMessage());
////        }
////        return response.toString();
////    }
//    
//    
//    //for evusers get API
//private String buildEvUserDataListResponse(ComponentFlow comp, String query) {
//    try {
//        List<User> evUsers = userService.getAllDrivers(null, null);
//        
//        List<Map<String, Object>> items = evUsers.stream()
//            .map(u -> (Map<String, Object>) MAPPER.convertValue(u, Map.class))
//            .collect(Collectors.toList());
//
//        DataResponse<Map<String, Object>> response = new DataResponse<>();
//        response.setType("data");
//        response.setComponent("evuser");
//        response.setCount(items.size());
//        response.setItems(items);
//        response.setListRoute(comp.listRoute);
//        return MAPPER.writeValueAsString(response);
//    } catch (Exception e) {
//        return errorResponse("Failed to fetch EV users: " + e.getMessage());
//    }
//}
//
////for sites get API
//private String buildSitesDataListResponse(ComponentFlow comp, String query) {
//    try {
//        List<Map<String, Object>> sites = siteService.getAllSitesPaginated(null, null);
//        DataResponse<Map<String, Object>> response = new DataResponse<>();
//        response.setType("data");
//        response.setComponent("site");
//        response.setCount(sites.size());
//        response.setItems(sites);
//        response.setListRoute(comp.listRoute);
//        return MAPPER.writeValueAsString(response);
//    } catch (Exception e) {
//        return errorResponse("Failed to fetch sites: " + e.getMessage());
//    }
//}
//    
////for stations get API
//private String buildStationsDataListResponse(ComponentFlow comp, String query) {
//    try {
//        List<Station> stations = stationService.getAllStationsPaginated(null, null);
//        
//        List<Map<String, Object>> items = stations.stream()
//            .map(s -> (Map<String, Object>) MAPPER.convertValue(s, Map.class))
//            .collect(Collectors.toList());
//
//        DataResponse<Map<String, Object>> response = new DataResponse<>();
//        response.setType("data");
//        response.setComponent("station");
//        response.setCount(items.size());
//        response.setItems(items);
//        response.setListRoute(comp.listRoute); // "/stations"
//        
//        return MAPPER.writeValueAsString(response);
//    } catch (Exception e) {
//        return errorResponse("Failed to fetch stations: " + e.getMessage());
//    }
//}
//
////for manufacturers get API
//private String buildManufacturersDataListResponse(ComponentFlow comp, String searchQuery) {
//    try {
//        List<ManufacturerDetails> manufacturers = manufacturerService.getAllManufacturerPaginated(null);
//
//        List<Map<String, Object>> items = manufacturers.stream()
//            .map(m -> MAPPER.convertValue(m, Map.class))
//            .collect(Collectors.toList());
//
//        DataResponse<Map<String, Object>> response = new DataResponse<>();
//        response.setType("data");
//        response.setComponent("manufacturer");
//        response.setCount(items.size());
//        response.setItems(items);
//        response.setListRoute(comp.listRoute); // e.g. "/manufacturers"
//
//        return MAPPER.writeValueAsString(response);
//    } catch (Exception e) {
//        return errorResponse("Failed to fetch manufacturers: " + e.getMessage());
//    }
//}
//
////for RFID get api
//private String buildRfidDataListResponse(ComponentFlow comp, String userQuery) {
//    try {
//        boolean wantsIssued = false;
//        if (userQuery != null && !userQuery.trim().isEmpty()) {
//            String q = userQuery.toLowerCase();
//            wantsIssued = q.contains("issued") || q.contains("active") || q.contains("assigned");
//        }
//
//        if (wantsIssued) {
//            // Return issued (active) RFID cards
//            List<RFID> issuedCards = rfidService.getIssuedRfidList();
//            List<Map<String, Object>> items = issuedCards.stream()
//                .map(card -> MAPPER.convertValue(card, Map.class))
//                .collect(Collectors.toList());
//
//            DataResponse<Map<String, Object>> response = new DataResponse<>();
//            response.setType("data");
//            response.setComponent("rfid");
//            response.setSubComponent("issued");   // tells frontend to show issued table
//            response.setCount(items.size());
//            response.setItems(items);
//            response.setListRoute(comp.listRoute);
//            return MAPPER.writeValueAsString(response);
//        } else {
//            // Return pending RFID requests (default)
//            List<RFIDRequests> pendingRequests = rfidService.getRequestedRfidList(null, null);
//            List<Map<String, Object>> items = pendingRequests.stream()
//                .map(req -> MAPPER.convertValue(req, Map.class))
//                .collect(Collectors.toList());
//
//            DataResponse<Map<String, Object>> response = new DataResponse<>();
//            response.setType("data");
//            response.setComponent("rfid");
//            response.setSubComponent("pending");   // tells frontend to show pending table
//            response.setCount(items.size());
//            response.setItems(items);
//            response.setListRoute(comp.listRoute);
//            return MAPPER.writeValueAsString(response);
//        }
//    } catch (Exception e) {
//        return errorResponse("Failed to fetch RFID data: " + e.getMessage());
//    }
//}
//
////for employee get api
//private String buildEmployeeDataListResponse(ComponentFlow comp, String designation, String search) {
//    try {
//        List<Employee> employees = employeeService.getAllEmployeesFiltered(designation, search);
//        
//        List<Map<String, Object>> items = employees.stream()
//            .map(emp -> MAPPER.convertValue(emp, Map.class))
//            .collect(Collectors.toList());
//
//        DataResponse<Map<String, Object>> response = new DataResponse<>();
//        response.setType("data");
//        response.setComponent(comp.name.toLowerCase()); // "installationteam" or "customersupport"
//        response.setCount(items.size());
//        response.setItems(items);
//        response.setListRoute(comp.listRoute);
//        return MAPPER.writeValueAsString(response);
//    } catch (Exception e) {
//        return errorResponse("Failed to fetch " + designation + " employees: " + e.getMessage());
//    }
//}
////==================== TASKS FOR INSTALLATION TEAM ====================
//private String buildInstallationTeamTasksResponse(ComponentFlow comp, String search) {
// try {
//     // Fetch all installation team employees
//     List<Employee> teamMembers = employeeService.getAllEmployeesFiltered("Charger Installation Team", null);
//     if (teamMembers.isEmpty()) {
//         return errorResponse("No installation team members found.");
//     }
//     
//     // Collect task assignments for all these employees
//     List<TaskAssignment> allTasks = new ArrayList<>();
//     for (Employee emp : teamMembers) {
//         // Use getTasksByEmployee from TaskService
//         List<TaskAssignment> empTasks = taskService.getTasksByEmployee(emp.getId());
//         allTasks.addAll(empTasks);
//     }
//     
//     // Apply search filter if provided
//     if (search != null && !search.trim().isEmpty()) {
//         String lowerSearch = search.toLowerCase();
//         allTasks = allTasks.stream()
//             .filter(t -> (t.getTaskName() != null && t.getTaskName().toLowerCase().contains(lowerSearch)) ||
//                          (t.getDescription() != null && t.getDescription().toLowerCase().contains(lowerSearch)))
//             .collect(Collectors.toList());
//     }
//     
//     List<Map<String, Object>> items = allTasks.stream()
//         .map(task -> MAPPER.convertValue(task, Map.class))
//         .collect(Collectors.toList());
//     
//     DataResponse<Map<String, Object>> response = new DataResponse<>();
//     response.setType("data");
//     response.setComponent("task");
//     response.setSubComponent("installationteam");
//     response.setCount(items.size());
//     response.setItems(items);
//     response.setListRoute("/tasks");
//     return MAPPER.writeValueAsString(response);
// } catch (Exception e) {
//     return errorResponse("Failed to fetch installation tasks: " + e.getMessage());
// }
//}
//
////==================== ISSUES FOR CUSTOMER SUPPORT ====================
//private String buildCustomerSupportIssuesResponse(ComponentFlow comp, String search) {
// try {
//     List<Employee> supportMembers = employeeService.getAllEmployeesFiltered("Customer Support", null);
//     if (supportMembers.isEmpty()) {
//         return errorResponse("No customer support members found.");
//     }
//     
//     List<IssueReporting> allIssues = new ArrayList<>();
//     for (Employee emp : supportMembers) {
//         List<IssueReporting> issues = employeeService.getIssuesByEmployeeId(emp.getId());
//         allIssues.addAll(issues);
//     }
//     
//     if (search != null && !search.trim().isEmpty()) {
//         String lowerSearch = search.toLowerCase();
//         allIssues = allIssues.stream()
//             .filter(i -> (i.getIssue() != null && i.getIssue().toLowerCase().contains(lowerSearch)) ||
//                          (i.getTicketId() != null && i.getTicketId().toLowerCase().contains(lowerSearch)))
//             .collect(Collectors.toList());
//     }
//     
//     List<Map<String, Object>> items = allIssues.stream()
//         .map(issue -> MAPPER.convertValue(issue, Map.class))
//         .collect(Collectors.toList());
//     
//     DataResponse<Map<String, Object>> response = new DataResponse<>();
//     response.setType("data");
//     response.setComponent("issue");
//     response.setSubComponent("customersupport");
//     response.setCount(items.size());
//     response.setItems(items);
//     response.setListRoute("/issues");
//     return MAPPER.writeValueAsString(response);
// } catch (Exception e) {
//     return errorResponse("Failed to fetch support issues: " + e.getMessage());
// }
//}
// // ==================== STATUS CHANGE HANDLING (SIMPLIFIED DETECTION) ====================
//
//    private boolean isStatusChangeQuestion(String q) {
//        q = q.toLowerCase();
//        // Must contain "status" AND any of the component keywords
//        return q.contains("status") && (
//            q.contains("whitelabel") || q.contains("franchise") ||
//            q.contains("site") || q.contains("station") ||
//            q.contains("customer support") || q.contains("charger installation team")
//        );
//    }
//    private String extractComponentForStatus(String q) {
//        q = q.toLowerCase();
//        if (q.contains("whitelabel")) return "WhiteLabel";
//        if (q.contains("franchise")) return "Franchise";
//        if (q.contains("site")) return "Site";
//        if (q.contains("station")) return "Station";
//        if (q.contains("customer support")) return "Customer Support";
//        if (q.contains("charger installation team")) return "Charger Installation Team";
//        return null;
//    }
//
//private String extractNameForStatus(String q, String component) {
//    q = q.toLowerCase();
//    component = component.toLowerCase();
//    
//    // Simple: find the word immediately before the component name
//    // Example: "evya site" -> "evya"
//    String pattern = "\\b([a-zA-Z0-9]+)\\s+" + component + "\\b";
//    java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
//    java.util.regex.Matcher m = p.matcher(q);
//    if (m.find()) {
//        String candidate = m.group(1).trim();
//        // Ignore common stopwords (so "the site" doesn't extract "the")
//        if (!candidate.matches("(?i)(change|update|modify|status|the|this|that|my|your|a|an|to|for|of|i|want|how|can|do|is|are)")) {
//            return candidate;
//        }
//    }
//    return null;
//}
//
//    private String buildStatusChangeResponse(String component, String name) {
//        JSONObject response = new JSONObject();
//        JSONArray steps = new JSONArray();
//        
//        // Get list route for component
//        String listRoute = getListRouteForComponent(component);
//        
//        // Step 1: Navigate to list
//        JSONObject step1 = new JSONObject();
//        step1.put("text", "Go to " + component + " list");
//        step1.put("action", "NAVIGATE_TO_LIST");
//        steps.put(step1);
//        
//        // Step 2: Find the item (if name provided)
//        if (name != null && !name.isEmpty()) {
//            steps.put("In the list, search for \"" + name + "\" using the search/filter.");
//        } else {
//            steps.put("Find the specific " + component.toLowerCase() + " you want to change the status.");
//        }
//        
//        // Step 3: Click info icon
//        steps.put("Click the info (ℹ️) icon next to that " + component.toLowerCase() + " to open its details.");
//        
//        // Step 4: Change status via dropdown
//        steps.put("In the details page, locate the status dropdown, click it, and select the desired status (Active, Maintenance, Inactive, etc.).");
//        
//        response.put("type", "steps");
//        response.put("steps", steps);
//        response.put("route", listRoute);
//        response.put("componentName", component);
//        response.put("action", "CHANGE_STATUS");
//        if (name != null) {
//            response.put("itemName", name);
//        }
//        return response.toString();
//    }
//    
//    
//    private String extractComponentForDefinition(String q) {
//        q = q.toLowerCase();
//        
//        if (q.contains("requests") || q.contains("request")) return "requests";
//        if (q.contains("dashboard") || q.contains("overview")) return "dashboard";
//        if (q.contains("request") && (q.contains("franchise") || q.contains("site") || q.contains("station"))) return "requests";
//        if (q.contains("report")) return "reports";
//        if (q.contains("whitelabel") || q.contains("white label")) return "whitelabel";
//        if (q.contains("franchise owner") || (q.contains("franchise") && !q.contains("request"))) return "franchise_owner";
//        if (q.contains("site") && !q.contains("station")) return "site";
//        if (q.contains("station") || q.contains("charging station") || q.contains("charging point")) return "station";
//        if (q.contains("manufacturer")) return "manufacturer";
//        if (q.contains("ev user") || (q.contains("ev") && q.contains("user")) || q.contains("driver")) return "evuser";
//        if (q.contains("rfid")) return "rfid_management";
//        if (q.contains("customer support") || q.contains("support team")) return "customer_support";
//        if (q.contains("charger installation team") || q.contains("installation team")) return "charger_installation_team";
//        if (q.contains("fleet") && !q.contains("vehicle")) return "fleet";
//        if (q.contains("issue tracker") || q.contains("track issues")) return "issue_tracker";
//        if (q.contains("ocpp")) return "ocpp";
//        if (q.contains("referral code") || q.contains("referral")) return "referral_code";
//        if (q.contains("cpo")) return "franchise_owner";
//        
//        return null;
//    }
//
//private String buildRfidRequestResponse() {
//    JSONObject response = new JSONObject();
//    JSONArray steps = new JSONArray();
//
//    // Step 1: Navigate to EV Users list
//    JSONObject step1 = new JSONObject();
//    step1.put("text", "Go to EV Users list");
//    step1.put("action", "NAVIGATE_TO_LIST");
//    steps.put(step1);
//
//    // Step 2: Open details of the desired EV user
//    JSONObject step2 = new JSONObject();
//    step2.put("text", "Find the EV user and click the info (ℹ️) icon to open their details");
//    step2.put("action", "OPEN_EV_USER_DETAILS");
//    steps.put(step2);
//
//    // Step 3: Switch to RFID tab
//    JSONObject step3 = new JSONObject();
//    step3.put("text", "In the details page, switch to the 'RFID' tab");
//    step3.put("action", "SWITCH_TO_RFID_TAB");
//    steps.put(step3);
//
//    // Step 4: Click the Request RFID button (opens dialog)
//    JSONObject step4 = new JSONObject();
//    step4.put("text", "Click the 'Request RFID' button");
//    step4.put("action", "OPEN_REQUEST_RFID_DIALOG");
//    steps.put(step4);
//
//    // Step 5: Fill and submit
//    steps.put("Fill in the required details and click Submit");
//
//    response.put("type", "steps");
//    response.put("steps", steps);
//    response.put("route", "/evusers");
//    response.put("componentName", "RFID Request");
//    return response.toString();
//}
//private String buildRfidActivationResponse() {
//    JSONObject response = new JSONObject();
//    JSONArray steps = new JSONArray();
//
//    // Step 1: Navigate to RFID Management list (clickable)
//    JSONObject step1 = new JSONObject();
//    step1.put("text", "Go to RFID Management list");
//    step1.put("action", "NAVIGATE_TO_LIST");
//    steps.put(step1);
//
//    // Step 2: Plain text instruction (no button)
//    steps.put("Click the edit (✏️) icon next to a pending RFID request");
//
//    // Step 3: Plain text instruction
//    steps.put("Fill in the activation details and submit the form.");
//
//    response.put("type", "steps");
//    response.put("steps", steps);
//    response.put("route", "/rfid");
//    response.put("componentName", "RFID Activation");
//    return response.toString();
//}
//    
//private boolean isForgotUsernameQuery(String q) {
// q = q.toLowerCase();
// return q.matches(".*\\b(forgot|forget|lost|remember|don't know|can't recall|dont know)\\b.*\\b(username|user name|login id|userid|user id)\\b.*");
//}
//
//private String buildForgotUsernameResponse() {
//    JSONObject response = new JSONObject();
//    JSONArray steps = new JSONArray();
//    steps.put("While registering, your username was sent to your registered email address. Please check your email inbox (including spam folder).");
//    steps.put("If you still cannot find your username, please contact EVYA team support.");
//    response.put("type", "definition");   // Changed from "info" to "definition"
//    response.put("steps", steps);
//    return response.toString();
//}
//    private String buildDefinitionResponseFromMap(String componentKey) {
//        List<String> purposes = definitionMap.get(componentKey);
//        if (purposes == null) return null;
//        JSONObject response = new JSONObject();
//        JSONArray steps = new JSONArray();
//        for (String purpose : purposes) {
//            steps.put(purpose);
//        }
//        response.put("type", "definition");
//        response.put("steps", steps);
//        return response.toString();
//    }
//    
//    private void initializeComponents() {
//        componentFlows.put("reports", new ComponentFlow("Reports", 
//                "/reports", "/reports", "/reports/edit", "/reports/view")
//                .withAlias("report", "statistics", "stats"));
//        
//        componentFlows.put("whitelabel", new ComponentFlow("WhiteLabel", 
//                "/whitelabels", "/whitelabels/add", "/whitelabels/edit", "/whitelabels/view")
//                .withAlias("whitelabel"));
//        
//        componentFlows.put("franchise", new ComponentFlow("Franchise", 
//                "/franchiseOwners", "/franchiseOwners/add", "/franchiseOwners/edit", "/franchiseOwners/view")
//                .withAlias("franchise owner", "cpo"));
//        
//        componentFlows.put("site", new ComponentFlow("Site", 
//                "/sites", "/add-site", "/sites/edit", "/sites/view")
//                .withSeparateAddPage());
//        
//        componentFlows.put("station", new ComponentFlow("Station", 
//                "/stations", "/add-stations", "/stations/edit", "/stations/view")
//                .withAlias("charging station")
//                .withSeparateAddPage());
//        
//        componentFlows.put("manufacturer", new ComponentFlow("Manufacturer", 
//                "/manufacturers", "/manufacturers/add", "/manufacturers/edit", "/manufacturers/view")
//                .withAlias("manufacturer"));
//        
//        componentFlows.put("charger", new ComponentFlow("Charger", 
//                "/manufacturers", "/addcharger", "/chargers/edit", "/chargers/view")
//                .withParent("manufacturer")
//                .withSeparateAddPage()); 
//       
//        componentFlows.put("evuser", new ComponentFlow("EV User", 
//                "/evusers", "/evusers/add", "/evusers/edit", "/evusers/view")
//                .withAlias("driver", "ev user", "user"));
//
//        componentFlows.put("vehicle", new ComponentFlow("Vehicle", 
//                "/evusers", "/vehicles/add", "/vehicles/edit", "/vehicles/view")
//                .withParent("evuser")
//                .withAlias("car"));
//
//        componentFlows.put("rfid", new ComponentFlow("RFID", 
//                "/rfid", "/rfid/request", "/rfid/edit", "/rfid/view")
//                .withAlias("rfid management", "rfid request", "rfid requests", "rfidrequests"));
//        
//        componentFlows.put("rfidrequest", new ComponentFlow("RFID Request", 
//                "/evusers", "/rfid/request", "/rfid/edit", "/rfid/view")
//                .withParent("evuser")
//                .withAlias("request rfid", "rfid card"));
//
//        componentFlows.put("wallet", new ComponentFlow("Wallet", 
//                "/evusers", "/wallet", "/wallet/edit", "/wallet/view")
//                .withParent("evuser"));
//
//        componentFlows.put("transactions", new ComponentFlow("Transactions", 
//                "/evusers", "/transactions", "/transactions/edit", "/transactions/view")
//                .withParent("evuser"));
//        
//        componentFlows.put("fleet", new ComponentFlow("Fleet", 
//                "/fleetManagement", "/fleets/add", "/fleets/edit", "/fleets/view")
//                .withAlias("fleet"));
//        
//        componentFlows.put("fleetvehicle", new ComponentFlow("Fleet Vehicle", 
//                "/fleet/vehicles", "/fleet/vehicles/add", "/fleet/vehicles/edit", "/fleet/vehicles/view")
//                .withAlias("fleet vehicle", "vehicle")
//                .withParent("fleet"));
//        
//        componentFlows.put("customersupport", new ComponentFlow("Customer Support", 
//                "/customer-support", "/customer-support/add", "/customer-support/edit", "/customer-support/view")
//                .withAlias("customer support", "support"));
//        
//        componentFlows.put("issue", new ComponentFlow("Issue", 
//                "/issues", "/issues/add", "/issues/edit", "/issues/view")
//                .withAlias("issue tracker"));
//        
//        componentFlows.put("installationteam", new ComponentFlow("Charger Installation Team", 
//                "/charger-installation-team", "/charger-installation-team/add", "/charger-installation-team/edit", "/charger-installation-team/view")
//                .withAlias("installation team", "charger installation team", "chargerinstallationteam", "chargerinstallation", "installationteam"));
//        
//        componentFlows.put("task", new ComponentFlow("Task", 
//                "/tasks", "/tasks/add", "/tasks/edit", "/tasks/view"));
//        
//        componentFlows.put("driver", new ComponentFlow("Driver", 
//                "/drivers", "/drivers/add", "/drivers/edit", "/drivers/view")
//                .withAlias("driver management"));
//        
//        componentFlows.put("referral", new ComponentFlow("Referral Code", 
//                "/referrals", "/referrals/add", "/referrals/edit", "/referrals/view")
//                .withAlias("referral codes"));
//        
//        // Task (child of installationteam)
//        componentFlows.put("task", new ComponentFlow("Task", 
//                "/charger-installation-team", "/tasks/add", "/tasks/edit", "/tasks/view"));
//
//        // Issue (child of customersupport)
//        componentFlows.put("issue", new ComponentFlow("Issue", 
//                "/customer-support", "/issues/add", "/issues/edit", "/issues/view"));
//        
//        // Task Note (child of installationteam)
//        componentFlows.put("tasknote", new ComponentFlow("Task Note", 
//                "/charger-installation-team", "/notes/add", "/notes/edit", "/notes/view")
//                .withAlias("task note", "note for task"));
//
//        // Issue Note (child of customersupport)
//        componentFlows.put("issuenote", new ComponentFlow("Issue Note", 
//                "/customer-support", "/notes/add", "/notes/edit", "/notes/view")
//                .withAlias("issue note", "note for issue"));
//        
//        // Issue Tracker
//        componentFlows.put("issuetracker", new ComponentFlow("Issue Tracker", 
//                "/issues-tracker", "/issues-tracker/add", "/issues-tracker/edit", "/issues-tracker/view")
//                .withAlias("issues page", "issue list", "ticket", "all issues"));
//    }
//    
//    // ==================== HELPER METHODS ====================
//    
//    private String[] greetings = {
//        "👋 Hello! How can I help you?",
//        "Hi there! What can I do for you?",
//        "Hey! Need any help?",
//        "Good to see you! What would you like to do?",
//        "Hello 👋 Ask me anything about the system"
//    };
//    
//    private boolean isGreeting(String q) {
//        return q.matches(".*\\b(hi|hello|hey|hai|hii|good morning|good evening|good afternoon|how are you)\\b.*");
//    }
//    
//
//    private boolean isHierarchicalQuery(String q) {
//        q = q.toLowerCase();
//        if (!q.matches(".*\\b(how many|count of|number of)\\b.*")) return false;
//
//        // Find preposition (under, in, per, within, for)
//        String[] prepositions = {" under ", " in ", " per ", " within ", " for "};
//        String preposition = null;
//        int prepIndex = -1;
//        for (String p : prepositions) {
//            int idx = q.indexOf(p);
//            if (idx != -1) {
//                preposition = p.trim();
//                prepIndex = idx;
//                break;
//            }
//        }
//        if (preposition == null) return false;
//
//        // Extract child (text before preposition) and parent (text after preposition)
//        String before = q.substring(0, prepIndex).trim();
//        String after = q.substring(prepIndex + preposition.length()).trim();
//
//        // Identify child component (only franchise/site/station)
//        String child = null;
//        if (before.contains("franchise")) child = "franchise";
//        else if (before.contains("site")) child = "site";
//        else if (before.contains("station")) child = "station";
//        else return false;
//
//        // Identify parent component
//        String parent = null;
//        if (after.contains("whitelabel")) parent = "whitelabel";
//        else if (after.contains("franchise")) parent = "franchise";
//        else if (after.contains("site")) parent = "site";
//        else return false;
//
//        // Validate against allowed hierarchy
//        return allowedParent.getOrDefault(child, "").equals(parent);
//    }
//    
//    private Map<String, String> allowedParent = new HashMap<>();
//
//    private void initializeHierarchy() {
//        allowedParent.put("franchise", "whitelabel");
//        allowedParent.put("site", "franchise");
//        allowedParent.put("station", "site");
//    }
//
//    private boolean isLocationQuery(String q) {
//        q = q.toLowerCase();
//        if (!q.matches(".*\\b(sites?|stations?)\\b.*")) return false;
//        // Look for "in <city>" – simple pattern
//        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\bin\\s+([a-z][a-z ]+?)(?:\\?|\\.|$|\\s+\\b)");
//        java.util.regex.Matcher matcher = pattern.matcher(q);
//        return matcher.find();
//    }
//    
//    //payment methods 
//    private boolean isPaymentMethodsQuestion(String q) {
//        q = q.toLowerCase();
//        return q.matches(".*\\b(payment method[s]?|payment options|how to pay|payments? support|payment gateway[s]?|billing method[s]?|what payment methods|supported payment methods)\\b.*") ||
//               (q.contains("payment") && q.contains("method"));  // fallback for any "payment method" phrase
//    }
//    private String buildPaymentMethodsResponse() {
//        JSONObject response = new JSONObject();
//        JSONArray steps = new JSONArray();
//        steps.put("EVYA CMS does not directly handle payments or payment methods.");
//        steps.put("Payment processing (e.g., for charging sessions) is managed by external payment gateways integrated with the mobile app or station hardware.");
//        steps.put("The CMS focuses on managing stations, users, RFID, reports, and support – not financial transactions.");
//        response.put("type", "definition");
//        response.put("steps", steps);
//        return response.toString();
//    }
//
//    // ==================== PORT PRICE CHANGE ====================
//    private boolean isPortPriceChangeQuestion(String q) {
//        q = q.toLowerCase();
//        return q.matches(".*\\b(port price|billing amount|change (port|price)|update (port|price)|modify (port|billing)|set port price|edit port price)\\b.*");
//    }
//
//    private String buildPortPriceChangeResponse() {
//        JSONObject response = new JSONObject();
//        JSONArray steps = new JSONArray();
//
//        steps.put("Go to Stations list");
//        steps.put("Click on the station that contains the port you want to modify");
//        steps.put("Click the info (ℹ️) icon to open station details");
//        steps.put("Switch to the 'Ports' tab");
//        steps.put("Find the specific port (by ID or number)");
//        steps.put("Click the edit (✏️) icon next to that port");
//        steps.put("In the edit form, locate the 'Billing Amount' field and enter the new price");
//        steps.put("Click Save/Submit to apply the change");
//
//        response.put("type", "steps");
//        response.put("steps", steps);
//        response.put("route", "/stations");
//        response.put("componentName", "Port");
//        response.put("action", "CHANGE_PORT_PRICE");
//        return response.toString();
//    }
//    
//    private String extractParentName(String q, String parentType) {
//        // parentType: "whitelabel", "franchise", "site"
//        // Look for patterns like: "under X whitelabel", "in X franchise", etc.
//        String patternString = "\\b(under|in|for)\\s+([a-zA-Z0-9\\s]+?)\\s+" + parentType + "\\b";
//        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(patternString, java.util.regex.Pattern.CASE_INSENSITIVE);
//        java.util.regex.Matcher matcher = pattern.matcher(q);
//        if (matcher.find()) {
//            return matcher.group(2).trim();
//        }
//        // Alternative: "X whitelabel" without preposition
//        patternString = "\\b([a-zA-Z0-9\\s]+?)\\s+" + parentType + "\\b";
//        pattern = java.util.regex.Pattern.compile(patternString, java.util.regex.Pattern.CASE_INSENSITIVE);
//        matcher = pattern.matcher(q);
//        if (matcher.find()) {
//            String candidate = matcher.group(1).trim();
//            // Avoid common words like "how", "many", "the"
//            if (!candidate.matches("(?i)(how|many|count|number|the|a|an|all|these|those)")) {
//                return candidate;
//            }
//        }
//        return null;
//    }
//    
//private String buildHierarchicalResponse(String q) {
//    q = q.toLowerCase();
//    JSONObject response = new JSONObject();
//    JSONArray steps = new JSONArray();
//
//    // Reuse same parsing logic as isHierarchicalQuery
//    String[] prepositions = {" under ", " in ", " per ", " within ", " for "};
//    String preposition = null;
//    int prepIndex = -1;
//    for (String p : prepositions) {
//        int idx = q.indexOf(p);
//        if (idx != -1) {
//            preposition = p.trim();
//            prepIndex = idx;
//            break;
//        }
//    }
//    if (preposition == null) {
//        steps.put("Go to the relevant list and check the details page tabs.");
//        response.put("type", "steps");
//        response.put("steps", steps);
//        response.put("route", "/");
//        return response.toString();
//    }
//
//    String before = q.substring(0, prepIndex).trim();
//    String after = q.substring(prepIndex + preposition.length()).trim();
//
//    String child = null, parent = null;
//    if (before.contains("franchise")) child = "Franchise";
//    else if (before.contains("site")) child = "Site";
//    else if (before.contains("station")) child = "Station";
//    else {
//        steps.put("Could not identify the child component.");
//        response.put("type", "steps");
//        response.put("steps", steps);
//        response.put("route", "/");
//        return response.toString();
//    }
//
//    if (after.contains("whitelabel")) parent = "WhiteLabel";
//    else if (after.contains("franchise")) parent = "Franchise";
//    else if (after.contains("site")) parent = "Site";
//    else {
//        steps.put("Could not identify the parent component.");
//        response.put("type", "steps");
//        response.put("steps", steps);
//        response.put("route", "/");
//        return response.toString();
//    }
//
//    // Extract specific parent name if given (e.g., "ABC franchise")
//    String parentName = extractParentName(q, parent.toLowerCase());
//    String parentListRoute = getListRouteForComponent(parent);
//    String childTabName = child + "s";
//
//    JSONObject step1 = new JSONObject();
//    step1.put("text", "Go to " + parent + " list");
//    step1.put("action", "NAVIGATE_TO_LIST");
//    steps.put(step1);
//
//    if (parentName != null && !parentName.isEmpty()) {
//        steps.put("In the list, find and click on the \"" + parentName + "\" " + parent.toLowerCase() +
//                  ", then click the info (ℹ️) icon.");
//    } else {
//        steps.put("Find and click on the specific " + parent.toLowerCase() + " you are interested in, then click the info (ℹ️) icon.");
//    }
//
//    steps.put("Inside the details page, switch to the '" + childTabName + "' tab.");
//    steps.put("You will see the list (and count) of " + child.toLowerCase() + "s under that " + parent.toLowerCase() + ".");
//
//    response.put("type", "steps");
//    response.put("steps", steps);
//    response.put("route", parentListRoute);
//    response.put("componentName", child + " under " + parent);
//    return response.toString();
//}
//
//    // Helper to get list route from component name
//    private String getListRouteForComponent(String componentName) {
//        switch (componentName) {
//            case "WhiteLabel": return "/whitelabels";
//            case "Franchise": return "/franchiseOwners";
//            case "Site": return "/sites";
//            case "Station": return "/stations";
//            case "Customer Support": return "/customer-support";
//            case "Charger Installation Team": return "/charger-installation-team";
//            default: return "/";
//        }
//    }
//
//    private String getDetailsPathForComponent(String componentName) {
//        switch (componentName) {
//            case "WhiteLabel": return "/whitelabels/:id/:orgId/:orgName";
//            case "Franchise": return "/franchiseOwners/:id/:orgId/:orgName";
//            case "Site": return "/site/:id";
//            case "Station": return "/stations/:id";
//            default: return "";
//        }
//    }
//    
//    private String buildLocationResponse(String q) {
//        q = q.toLowerCase();
//        JSONObject response = new JSONObject();
//        JSONArray steps = new JSONArray();
//
//        // Extract component and city
//        String component = q.contains("sites") ? "Site" : "Station";
//        String city = extractCityFromQuery(q);
//
//        // Step 1: go to the list page
//        String listRoute = component.equals("Site") ? "/sites" : "/stations";
//        JSONObject step1 = new JSONObject();
//        step1.put("text", "Go to the " + component + "s list page");
//        step1.put("action", "NAVIGATE_TO_LIST");
//        steps.put(step1);
//
//        // Step 2: use the search/filter to find by city
//        JSONObject step2 = new JSONObject();
//        step2.put("text", "Use the search bar to filter by city: \"" + city + "\"");
//        step2.put("action", "FILTER_BY_CITY");
//        steps.put(step2);
//
//        steps.put("The table will show only " + component.toLowerCase() + "s in " + city + ".");
//
//        response.put("type", "steps");
//        response.put("steps", steps);
//        response.put("route", listRoute);
//        response.put("componentName", component);
//        return response.toString();
//    }
//
//    private String extractCityFromQuery(String q) {
//        // Simple extraction: look for "in <city>" pattern
//        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\b(in|at)\\s+([a-zA-Z]+)\\b");
//        java.util.regex.Matcher matcher = pattern.matcher(q);
//        if (matcher.find()) {
//            return matcher.group(2);
//        }
//        return "the specified city";
//    }
//    
//    private String getRandomGreeting() {
//        return greetings[(int) (Math.random() * greetings.length)];
//    }
//    
//    private String detectAction(String q) {
//        q = q.toLowerCase();
//        
//        // DELETE – highest priority
//        if (q.contains("delete") || q.contains("remove")) return "DELETE";
//        
//        // LIST – view, list, show, get, open, and "report" without add/create
//        if (q.contains("list") || q.contains("show") || q.contains("view") || 
//            q.contains("open") || q.contains("get")) return "LIST";
//        
//        // If "report" appears but no add/create keywords, treat as LIST (view/generate)
//        if (q.contains("report") && !(q.contains("add") || q.contains("create") || 
//                                      q.contains("new") || q.contains("request"))) {
//            return "LIST";
//        }
//        
//        // EDIT
//        if (q.contains("edit") || q.contains("update") || q.contains("modify")) return "EDIT";
//        
//        // ADD – create, add, new, request, assign, raise, approve, activate
//        if (q.contains("add") || q.contains("create") || q.contains("new") || 
//            q.contains("request") || q.contains("assign") || q.contains("raise") || 
//            q.contains("approve") || q.contains("activate")) return "ADD";
//        
//        return null;
//    }
//    private String detectComponent(String q) {
//        q = q.toLowerCase();
//        
////        if (q.contains("rfid request")) return "rfidrequest";
//        if (q.contains("issue note")) return "issuenote";
//        if (q.contains("task note")) return "tasknote";
//        if (q.contains("referral code")) return "referral";
//        if (q.contains("ev user")) return "evuser";
//        if (q.contains("fleet vehicle")) return "fleetvehicle";
//        if (q.contains("customer support")) return "customersupport";
//        if (q.contains("charger installation team")) return "installationteam";
//        
//        if (q.contains("ticket") || q.contains("raise issue") || q.contains("report issue") || 
//        	    q.contains("create issue") || q.contains("new issue")) {
//        	    return "issuetracker";
//        	}
//        
//        // Issue tracker
//        if (q.contains("issue tracker") || q.contains("issues page") || q.contains("all issues")) {
//            return "issuetracker";
//        }
//        
//        // Note types
//        if ((q.contains("task") || q.contains("assign")) && q.contains("note")) return "tasknote";
//        if ((q.contains("issue") || q.contains("report")) && q.contains("note")) return "issuenote";
//        
//        // Compound phrases
//        if (q.contains("team member") || (q.contains("installation") && q.contains("member"))) return "installationteam";
//        if (q.contains("assign task") || (q.contains("create task") && q.contains("team"))) return "task";
//        if (q.contains("report issue") || (q.contains("create issue") && q.contains("support"))) return "issue";
//        if (q.contains("add note") || q.contains("create note") || q.contains("comment on task") || q.contains("comment on issue")) return "note";
//        if (q.contains("fleet vehicle") || (q.contains("fleet") && q.contains("vehicle"))) return "fleetvehicle";
//        if (q.contains("customer support")) return "customersupport";
//        if (q.contains("ev user") || (q.contains("ev") && q.contains("user"))) return "evuser";
//
//        // Fallback generic note
//        if (q.contains("add note") || q.contains("create note") || q.contains("comment on task") || q.contains("comment on issue")) return "note";
//        
//        // Check all components and aliases
//        for (Map.Entry<String, ComponentFlow> entry : componentFlows.entrySet()) {
//            ComponentFlow comp = entry.getValue();
//            if (q.contains(comp.name.toLowerCase())) return entry.getKey();
//            for (String alias : comp.aliases) {
//                if (q.contains(alias.toLowerCase())) return entry.getKey();
//            }
//        }
//        return null;
//    }
//    
//    // ==================== RESPONSE BUILDERS ====================
//    
//    private String buildListResponse(ComponentFlow comp) {
//        JSONObject response = new JSONObject();
//        JSONArray steps = new JSONArray();
//
//        if (comp.name.equals("Wallet")) {
//            steps.put("Go to EV User details");
//            JSONObject step2 = new JSONObject();
//            step2.put("text", "Switch to Wallet tab");
//            step2.put("action", "SWITCH_TO_WALLET_TAB");
//            steps.put(step2);
//            response.put("type", "steps");
//            response.put("steps", steps);
//            response.put("route", "/evusers");
//            return response.toString();
//        }
//        if (comp.name.equals("Transactions")) {
//            steps.put("Go to EV User details");
//            JSONObject step2 = new JSONObject();
//            step2.put("text", "Switch to Transactions tab");
//            step2.put("action", "SWITCH_TO_TRANSACTIONS_TAB");
//            steps.put(step2);
//            response.put("type", "steps");
//            response.put("steps", steps);
//            response.put("route", "/evusers");
//            return response.toString();
//        }
//        
//        if (comp.name.equals("Reports")) {
//            steps.put("Go to Reports page");
//            JSONObject stepGen = new JSONObject();
//            stepGen.put("text", "Generate report");
//            stepGen.put("action", "GENERATE_REPORT");
//            steps.put(stepGen);
//            JSONObject stepPdf = new JSONObject();
//            stepPdf.put("text", "Download PDF");
//            stepPdf.put("action", "DOWNLOAD_REPORT_PDF");
//            steps.put(stepPdf);
//            JSONObject stepExcel = new JSONObject();
//            stepExcel.put("text", "Download Excel");
//            stepExcel.put("action", "DOWNLOAD_REPORT_EXCEL");
//            steps.put(stepExcel);
//            response.put("type", "steps");
//            response.put("steps", steps);
//            response.put("route", "/reports");
//            response.put("componentName", "Reports");
//            return response.toString();
//        }
//        
////        steps.put("Go to " + comp.name);
////        JSONObject step2 = new JSONObject();
////        step2.put("text", "You will get the list of " + comp.name + "s");
////        step2.put("action", "NAVIGATE_TO_LIST");
////        steps.put(step2);
////        response.put("type", "steps");
////        response.put("steps", steps);
////        response.put("route", comp.listRoute);
////        return response.toString();
//        // 🟢 Generic list – plain text steps, no clickable action
//        steps.put("Go to " + comp.name + " list");
//        steps.put("You will get the list of " + comp.name + "s");
//
//        response.put("type", "steps");
//        response.put("steps", steps);
//        response.put("route", comp.listRoute);
//        response.put("componentName", comp.name);
//        return response.toString();
//    }
//    
//    private String buildAddResponse(ComponentFlow comp) {
//        JSONObject response = new JSONObject();
//        JSONArray steps = new JSONArray();
//        
//        if (comp.name.equals("Issue Tracker")) {
//            steps.put("Go to Issues Tracker page");
//            JSONObject step2 = new JSONObject();
//            step2.put("text", "Click 'Report Issue' button");
//            step2.put("action", "OPEN_ADD_ISSUE_FROM_TRACKER");
//            steps.put(step2);
//            response.put("type", "steps");
//            response.put("steps", steps);
//            response.put("route", "/issues-tracker");
//            response.put("componentName", "Issue Tracker");
//            return response.toString();
//        }
//        
//        if (comp.name.equals("Task Note")) {
//            steps.put("Go to Charger Installation Team list");
//            JSONObject step2 = new JSONObject();
//            step2.put("text", "Click on a team member to view their details");
//            step2.put("action", "NAVIGATE_TO_LIST");
//            steps.put(step2);
//            JSONObject step3 = new JSONObject();
//            step3.put("text", "Switch to Tasks tab, click the info icon next to a task, then click 'Add Note'");
//            step3.put("action", "OPEN_TASK_NOTES_DIALOG");
//            steps.put(step3);
//            response.put("type", "steps");
//            response.put("steps", steps);
//            response.put("route", "/charger-installation-team");
//            response.put("componentName", "Task Note");
//            response.put("parentComponent", "Charger Installation Team");
//            response.put("parentRoute", "/charger-installation-team");
//            response.put("requiresParentSelection", false);
//            return response.toString();
//        }
//
//        if (comp.name.equals("Issue Note")) {
//            steps.put("Go to Customer Support list");
//            JSONObject step2 = new JSONObject();
//            step2.put("text", "Click on a support member to view their details");
//            step2.put("action", "NAVIGATE_TO_LIST");
//            steps.put(step2);
//            JSONObject step3 = new JSONObject();
//            step3.put("text", "Switch to Issues tab, click the info icon next to an issue, then click 'Add Note'");
//            step3.put("action", "OPEN_ISSUE_NOTES_DIALOG");
//            steps.put(step3);
//            response.put("type", "steps");
//            response.put("steps", steps);
//            response.put("route", "/customer-support");
//            response.put("componentName", "Issue Note");
//            response.put("parentComponent", "Customer Support");
//            response.put("parentRoute", "/customer-support");
//            response.put("requiresParentSelection", false);
//            return response.toString();
//        }
//        
//        if (comp.name.equals("Vehicle")) {
//            steps.put("Go to EV Users");
//            JSONObject step2 = new JSONObject();
//            step2.put("text", "Click on an EV User to view their details");
//            step2.put("action", "NAVIGATE_TO_LIST");
//            steps.put(step2);
//            JSONObject step3 = new JSONObject();
//            step3.put("text", "Switch to Vehicles tab");
//            step3.put("action", "SWITCH_TO_VEHICLES_TAB");
//            steps.put(step3);
//            JSONObject step4 = new JSONObject();
//            step4.put("text", "Click Add Vehicle button");
//            step4.put("action", "OPEN_ADD_VEHICLE_DIALOG");
//            steps.put(step4);
//            response.put("type", "steps");
//            response.put("steps", steps);
//            response.put("route", "/evusers");
//            response.put("componentName", "Vehicle");
//            return response.toString();
//        }
//        
//        if (comp.name.equals("Task")) {
//            steps.put("Go to Charger Installation Team list");
//            JSONObject step2 = new JSONObject();
//            step2.put("text", "Click on a team member to view their details");
//            step2.put("action", "NAVIGATE_TO_LIST");
//            steps.put(step2);
//            JSONObject step3 = new JSONObject();
//            step3.put("text", "Then click 'Assign New Task' button");
//            step3.put("action", "OPEN_ASSIGN_TASK_DIALOG");
//            steps.put(step3);
//            response.put("type", "steps");
//            response.put("steps", steps);
//            response.put("route", "/charger-installation-team");
//            response.put("componentName", "Task");
//            return response.toString();
//        }
//
//        if (comp.name.equals("Issue")) {
//            steps.put("Go to Customer Support list");
//            JSONObject step2 = new JSONObject();
//            step2.put("text", "Click on a support member to view their details");
//            step2.put("action", "NAVIGATE_TO_LIST");
//            steps.put(step2);
//            JSONObject step3 = new JSONObject();
//            step3.put("text", "Then click 'Report Issue' button");
//            step3.put("action", "OPEN_REPORT_ISSUE_DIALOG");
//            steps.put(step3);
//            response.put("type", "steps");
//            response.put("steps", steps);
//            response.put("route", "/customer-support");
//            response.put("componentName", "Issue");
//            return response.toString();
//        }
//
//        if (comp.name.equals("RFID Request")) {
//            steps.put("Go to EV Users");
//            JSONObject step2 = new JSONObject();
//            step2.put("text", "Request RFID for a user");
//            step2.put("action", "OPEN_REQUEST_RFID_DIALOG");
//            steps.put(step2);
//            response.put("type", "steps");
//            response.put("steps", steps);
//            response.put("route", "/evusers");
//            response.put("componentName", "RFID Request");
////            return response.toString();
//            return buildRfidRequestResponse();
//        }
//
//        if (comp.name.equals("RFID")) {
//            steps.put("Go to RFID Management");
//            JSONObject step2 = new JSONObject();
//            step2.put("text", "Activate RFID for a pending request");
//            step2.put("action", "OPEN_ACTIVATE_RFID_DIALOG");
//            steps.put(step2);
//            response.put("type", "steps");
//            response.put("steps", steps);
//            response.put("route", "/rfid");
//            response.put("componentName", "RFID");
//            return response.toString();
//        }
//        
//        
//        if (comp.isAddSeparatePage) {
//            // 1. Parent steps
//            if (comp.parent != null) {
//                ComponentFlow parentComp = componentFlows.get(comp.parent);
//                if (parentComp != null) {
//                    JSONObject stepParent = new JSONObject();
//                    stepParent.put("text", "Go to " + parentComp.name + " list");
//                    stepParent.put("action", "NAVIGATE_TO_LIST");
//                    steps.put(stepParent);
//
//                    JSONObject stepSelect = new JSONObject();
//                    stepSelect.put("text", "Click on a " + parentComp.name.toLowerCase() +
//                                   " to view its details / select it");
//                    stepSelect.put("action", "SELECT_" + parentComp.name.toUpperCase());
//                    steps.put(stepSelect);
//                }
//            }
//
//            // 2. Add page opened step
//            JSONObject step0 = new JSONObject();
//            step0.put("text", "The " + comp.name + " add page is now open on the left side of the screen.");
//            step0.put("action", "ADD_PAGE_OPENED");
//            steps.put(step0);
//
//            steps.put("Fill in the " + comp.name + " details");
//            steps.put("Click Submit to save");
//
//            // 3. Set route: parent list if parent exists, otherwise the add route itself
//            if (comp.parent != null) {
//                ComponentFlow parentComp = componentFlows.get(comp.parent);
//                if (parentComp != null) {
//                    response.put("route", parentComp.listRoute);   // e.g., "/manufacturers"
//                } else {
//                    response.put("route", comp.addRoute);
//                }
//            } else {
//                response.put("route", comp.addRoute);
//            }
//        }
//    else {
//            steps.put("Go to " + comp.name);
//            JSONObject step2 = new JSONObject();
//            step2.put("text", "Click Add " + comp.name);
//            step2.put("action", "OPEN_ADD_" + comp.name.toUpperCase().replace(" ", "_"));
//            steps.put(step2);
//            steps.put("Enter details");
//            steps.put("Click Submit");
//            response.put("route", comp.listRoute);
//            if (comp.parent != null) {
//                ComponentFlow parentComp = componentFlows.get(comp.parent);
//                if (parentComp != null) {
//                    response.put("parentComponent", parentComp.name);
//                    response.put("parentRoute", parentComp.listRoute);
//                    response.put("requiresParentSelection", true);
//                }
//            }
//        }
//        
//        response.put("type", "steps");
//        response.put("steps", steps);
//        response.put("componentName", comp.name);
//        return response.toString();
//    }
//    
//    private String buildEditResponse(ComponentFlow comp) {
//        JSONObject response = new JSONObject();
//        JSONArray steps = new JSONArray();
//        
//        JSONObject step1 = new JSONObject();
//        step1.put("text", "Go to " + comp.name);
//        step1.put("action", "NAVIGATE_TO_LIST");
//        steps.put(step1);
//        
//        JSONObject step2 = new JSONObject();
//        step2.put("text", "Find the " + comp.name.toLowerCase() + " you want to edit and click the Edit button");
//        step2.put("action", "OPEN_EDIT_" + comp.name.toUpperCase().replace(" ", "_"));
//        steps.put(step2);
//        
//        steps.put("Update the information in the form");
//        steps.put("Click the Submit button to save changes");
//        
//        response.put("type", "steps");
//        response.put("steps", steps);
//        response.put("route", comp.listRoute);
//        return response.toString();
//    }
//    
// private String buildDeleteResponse(ComponentFlow comp) {
//    JSONObject response = new JSONObject();
//    JSONArray steps = new JSONArray();
//
//    // Special handling for child components that are deleted from a parent's details page
//    switch (comp.name.toLowerCase()) {
//        case "vehicle":
//            steps.put("Go to EV Users list");
//            steps.put("Click on the EV user who owns the vehicle to open their details");
//            steps.put("Switch to the 'Vehicles' tab");
//            steps.put("Find the vehicle you want to delete and click its 'Delete' button");
//            steps.put("Confirm deletion");
//            response.put("route", "/evusers");
//            response.put("componentName", "Vehicle");
//            response.put("type", "steps");
//            response.put("steps", steps);
//            return response.toString();
//
//        case "rfid request":
//            steps.put("Go to EV Users list");
//            steps.put("Click on the EV user who requested the RFID card");
//            steps.put("Switch to the 'RFID' tab");
//            steps.put("In the 'RFID Requests' section, find the request and click 'Delete'");
//            steps.put("Confirm deletion");
//            response.put("route", "/evusers");
//            response.put("componentName", "RFID Request");
//            response.put("type", "steps");
//            response.put("steps", steps);
//            return response.toString();
//
//        case "task note":
//            steps.put("Go to Charger Installation Team list");
//            steps.put("Click on the team member who owns the task");
//            steps.put("Switch to the 'Assigned Tasks' tab");
//            steps.put("Click the info (ℹ️) icon next to the relevant task");
//            steps.put("In the task details, find the note you want to delete and click its delete icon");
//            steps.put("Confirm deletion");
//            response.put("route", "/charger-installation-team");
//            response.put("componentName", "Task Note");
//            response.put("type", "steps");
//            response.put("steps", steps);
//            return response.toString();
//            
//        case "issue note":
//            steps.put("Go to Customer Support list");
//            steps.put("Click on the support member who owns the issue");
//            steps.put("Switch to the 'Issues' tab");
//            steps.put("Click the info (ℹ️) icon next to the relevant issue");
//            steps.put("In the issue details, find the note you want to delete and click its delete icon");
//            steps.put("Confirm deletion");
//            response.put("route", "/customer-support");
//            response.put("componentName", "Issue Note");
//            response.put("type", "steps");
//            response.put("steps", steps);
//            return response.toString();
//    }
//
//    // Default generic delete flow for other components (if any are allowed)
//    steps.put("Go to " + comp.name);
//    steps.put("Find the " + comp.name.toLowerCase() + " you want to delete");
//    steps.put("Click Delete button");
//    steps.put("Confirm deletion");
//    response.put("type", "steps");
//    response.put("steps", steps);
//    response.put("route", comp.listRoute);
//    return response.toString();
//}
//    
// 
// 
// private boolean isReportForSiteOrStation(String q) {
//	    q = q.toLowerCase();
//	    // If the query explicitly asks for report on site/station
//	    if (q.contains("site") || q.contains("station")) {
//	        return true;
//	    }
//	    // If no component is mentioned, assume generic report (allow)
//	    boolean mentionsComponent = Arrays.stream(new String[]{"ev", "user", "rfid", "whitelabel", "franchise", "manufacturer", "fleet", "issue", "support", "team", "vehicle"})
//	            .anyMatch(q::contains);
//	    return !mentionsComponent;
//	}
// 
//    private String buildDefinitionResponse(String q) {
//        q = q.toLowerCase();
//        
//        if ((q.contains("what") || q.contains("explain")) && 
//            (q.contains("charger installation team") || q.contains("installation team"))) {
//            JSONObject response = new JSONObject();
//            JSONArray steps = new JSONArray();
//            steps.put("Charger Installation Team is a module used to manage installation teams");
//            steps.put("Each team contains multiple team members");
//            steps.put("Team members are responsible for installing charging stations at locations");
//            steps.put("Tasks can be assigned to team members");
//            steps.put("Each task can include notes for communication and updates");
//            response.put("type", "definition");
//            response.put("steps", steps);
//            return response.toString();
//        }
//        
//        if ((q.contains("what") || q.contains("explain")) && q.contains("rfid")) {
//            JSONObject response = new JSONObject();
//            JSONArray steps = new JSONArray();
//            steps.put("RFID stands for Radio Frequency Identification");
//            steps.put("It is a wireless technology used to identify users using RFID cards");
//            steps.put("Each RFID card is linked to an EV User");
//            steps.put("Users can tap RFID card on charger to start charging");
//            steps.put("System verifies RFID and allows charging session");
//            response.put("type", "definition");
//            response.put("steps", steps);
//            return response.toString();
//        }
//        
//        if (q.contains("what is evya") || q.contains("about evya")) {
//            JSONObject response = new JSONObject();
//            JSONArray steps = new JSONArray();
//            steps.put("EVYA is an Electric Vehicle Charging Management System");
//            steps.put("WhiteLabel is the top-level organization which contains Franchise Owners");
//            steps.put("Franchise manages franchise owners under a WhiteLabel");
//            steps.put("Site manages multiple Sites under each Franchise");
//            steps.put("Station manages charging stations under each Site");
//            steps.put("Manufacturer manages manufacturers and Chargers");
//            steps.put("EV Users module manages users with Vehicles, RFID, Wallet, and Transactions");
//            response.put("type", "definition");
//            response.put("steps", steps);
//            return response.toString();
//        }
//        return null;
//    }
//    
//    private String buildDashboardResponse(String q) {
//        q = q.toLowerCase();
//        if (q.contains("dashboard") || q.contains("overview")) {
//            JSONObject response = new JSONObject();
//            JSONArray steps = new JSONArray();
//            JSONObject step1 = new JSONObject();
//            step1.put("text", "Go to Dashboard");
//            step1.put("action", "NAVIGATE_TO_DASHBOARD");
//            steps.put(step1);
//            steps.put("View Total Charging Sessions for usage");
//            steps.put("Check Revenue for earnings");
//            steps.put("View Energy Usage for consumption");
//            steps.put("Check EV Users count");
//            response.put("type", "steps");
//            response.put("steps", steps);
//            response.put("route", "/");
//            return response.toString();
//        }
//        return null;
//    }
//    
//    // ==================== MAIN CONTROLLER ====================
//    
//  @PostMapping("/ask")
//public String askAI(@RequestBody String userQuestion) throws Exception {
//    String q = userQuestion.toLowerCase();
//    
//    // 1. Greetings
//    if (isGreeting(q)) {
//        return getRandomGreeting();
//        
//    }
//    
//    if (isForgotUsernameQuery(q)) {
//        return buildForgotUsernameResponse();
//    }
//    
//    // 2. Definition questions using curated map
//    if (isDefinitionQuestion(q)) {
//        String componentKey = extractComponentForDefinition(q);
//        if (componentKey != null) {
//            String defResponse = buildDefinitionResponseFromMap(componentKey);
//            if (defResponse != null) {
//                return defResponse;
//            }
//        }
//    }
//    
//    // 3. Dashboard
//    String dashboardResponse = buildDashboardResponse(q);
//    if (dashboardResponse != null) {
//        return dashboardResponse;
//    }
//    
// // ========== DIRECT OVERRIDES FOR AMBIGUOUS DELETE CASES ==========
// // Handle "delete rfid request" explicitly
// if (q.contains("delete") && q.contains("rfid request")) {
//     ComponentFlow comp = componentFlows.get("rfidrequest");
//     if (comp != null && ALLOWED_DELETE_COMPONENTS.contains("rfidrequest")) {
//         return buildDeleteResponse(comp);
//     }
// }
// // Handle "delete rfid" (without "request") – not allowed
// if (q.contains("delete") && q.contains("rfid") && !q.contains("request")) {
//     JSONObject response = new JSONObject();
//     JSONArray steps = new JSONArray();
//     steps.put("❌ Deletion of RFID is not allowed for security reasons.");
//     response.put("type", "definition");
//     response.put("steps", steps);
//     return response.toString();
// }
// 
////========== PAYMENT METHODS QUERY ==========
//if (isPaymentMethodsQuestion(q)) {
//  return buildPaymentMethodsResponse();
//}
//
////========== PORT PRICE CHANGE QUERY ==========
//if (isPortPriceChangeQuestion(q)) {
//  return buildPortPriceChangeResponse();
//}   
//    
//    // ========== 4. CRUD OPERATIONS (LIST, ADD, EDIT, DELETE) – MOVED EARLY ==========
//    String action = detectAction(q);
//    String componentKey = detectComponent(q);
//    
//    // Special handling for reports download (if action is null but contains download/pdf/excel)
//    if (componentKey != null && componentKey.equals("reports") && action == null) {
//        if (q.contains("download") || q.contains("pdf") || q.contains("excel")) {
//            action = "LIST";
//        }
//    }
//    
//    if (componentKey != null && action != null) {
//        ComponentFlow comp = componentFlows.get(componentKey);
//        if (comp != null) {
//            switch (action) {
////                case "LIST": return buildListResponse(comp);
//            case "LIST":
//                if (componentKey.equals("whitelabel")) {
//                    return buildDataListResponse(comp, q);
//                } else if (componentKey.equals("franchise")) {
//                    return buildFranchiseDataListResponse(comp, q);
//                } else if (componentKey.equals("evuser")) {
//                    return buildEvUserDataListResponse(comp, q);
//                } else if (componentKey.equals("site")) {
//                    return buildSitesDataListResponse(comp, q);
//                } else if (componentKey.equals("station")) {
//                return buildStationsDataListResponse(comp, q);
//                } else if (componentKey.equals("manufacturer")) {
//                return buildManufacturersDataListResponse(comp, null);
//                }
//                else if (componentKey.equals("rfid")) {
//                    return buildRfidDataListResponse(comp, q); 
//                }
//                else if (componentKey.equals("installationteam")) {
//                    return buildEmployeeDataListResponse(comp, "Charger Installation Team", null);
//                } 
//                else if (componentKey.equals("customersupport")) {
//                    return buildEmployeeDataListResponse(comp, "Customer Support", null);
//                } 
//                else if (componentKey.equals("task")) {
//                    return buildInstallationTeamTasksResponse(comp, q);
//                } 
//                else if (componentKey.equals("issue")) {
//                    return buildCustomerSupportIssuesResponse(comp, q);
//                }
//                return buildListResponse(comp);
//                case "ADD": return buildAddResponse(comp);
//                case "EDIT": return buildEditResponse(comp);
//                case "DELETE":
//                    if (ALLOWED_DELETE_COMPONENTS.contains(componentKey)) {
//                        return buildDeleteResponse(comp);
//                    } else {
//                        JSONObject response = new JSONObject();
//                        JSONArray steps = new JSONArray();
//                        steps.put("❌ Deletion of " + comp.name + " is not allowed for security reasons.");
//                        response.put("type", "definition");
//                        response.put("steps", steps);
//                        return response.toString();
//                    }
//            }
//        }
//    }
//    
//    // ========== END CRUD ==========
//    
//    // 5. RFID request / activation / limit / cost (only after CRUD)
//    if (isRfidRequestQuestion(q)) {
//        return buildRfidRequestResponse();
//    }
//    if (isRfidActivationQuestion(q)) {
//        return buildRfidActivationResponse();
//    }
//    if (isRfidMaxLimitQuestion(q)) {
//        return buildRfidMaxLimitResponse();
//    }
//    if (isRfidCostQuestion(q)) {
//        return buildRfidCostResponse();
//    }
//    
//    // 6. Old specific definitions (RFID, EVYA, etc.)
//    String definitionResponse = buildDefinitionResponse(q);
//    if (definitionResponse != null) {
//        return definitionResponse;
//    }
//    
//    // 7. Hierarchical count queries
//    if (isHierarchicalQuery(q)) {
//        return buildHierarchicalResponse(q);
//    }
//    
//    // 8. Location‑based queries (e.g., "sites in Hyderabad")
//    if (isLocationQuery(q)) {
//        return buildLocationResponse(q);
//    }
//    
//    // 9. Invalid hierarchical query detection
//    if (q.matches(".*\\b(how many|count of|number of)\\b.*") &&
//        (q.contains("franchise") || q.contains("site") || q.contains("station")) &&
//        (q.contains("under") || q.contains("in") || q.contains("per"))) {
//        return "Invalid hierarchy. The correct flow is: WhiteLabel → Franchise → Site → Station. " +
//               "You can only ask: 'how many franchises under a whitelabel', " +
//               "'how many sites under a franchise', or 'how many stations under a site'.";
//    }
//    
//    // 10. Status change queries
//    if (isStatusChangeQuestion(q)) {
//        String component = extractComponentForStatus(q);
//        if (component != null) {
//            String name = extractNameForStatus(q, component);
//            return buildStatusChangeResponse(component, name);
//        }
//    }
//    
//    // 11. Fallback to Grok AI
//    String systemPrompt = "You are an AI assistant for EVYA CMS. " +
//                          "Give ONLY numbered steps, NO explanation, NO extra text. " +
//                          "Keep it short and direct.";
//    
//    JSONObject requestJson = new JSONObject();
//    requestJson.put("model", "llama-3.3-70b-versatile");
//    requestJson.put("temperature", 0.1);
//    requestJson.put("max_tokens", 200);
//    
//    JSONArray messages = new JSONArray();
//    JSONObject systemMsg = new JSONObject();
//    systemMsg.put("role", "system");
//    systemMsg.put("content", systemPrompt);
//    JSONObject userMsg = new JSONObject();
//    userMsg.put("role", "user");
//    userMsg.put("content", userQuestion);
//    messages.put(systemMsg);
//    messages.put(userMsg);
//    requestJson.put("messages", messages);
//    
//    HttpRequest request = HttpRequest.newBuilder()
//            .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
//            .header("Content-Type", "application/json")
//            .header("Authorization", "Bearer " + grokApiKey)
//            .POST(HttpRequest.BodyPublishers.ofString(requestJson.toString()))
//            .build();
//    
//    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
//    JSONObject jsonResponse = new JSONObject(response.body());
//    
//    if (jsonResponse.has("choices")) {
//        return jsonResponse
//                .getJSONArray("choices")
//                .getJSONObject(0)
//                .getJSONObject("message")
//                .getString("content");
//    }
//    
//    return "Could you please rephrase your question?";
//}
//    
//    // ==================== ENDPOINT TO GET ALL ROUTES ====================
//    
//    @GetMapping("/routes")
//    public String getAllRoutes() {
//        JSONObject response = new JSONObject();
//        JSONObject routes = new JSONObject();
//        
//        for (Map.Entry<String, ComponentFlow> entry : componentFlows.entrySet()) {
//            ComponentFlow comp = entry.getValue();
//            JSONObject compRoutes = new JSONObject();
//            compRoutes.put("list", comp.listRoute);
//            compRoutes.put("add", comp.addRoute);
//            compRoutes.put("edit", comp.editRoute);
//            compRoutes.put("view", comp.viewRoute);
//            routes.put(comp.name.toLowerCase().replace(" ", "_"), compRoutes);
//        }
//        
//        response.put("baseURL", "http://localhost:8800"); 
//        response.put("routes", routes);
//        return response.toString();
//    }
//}
