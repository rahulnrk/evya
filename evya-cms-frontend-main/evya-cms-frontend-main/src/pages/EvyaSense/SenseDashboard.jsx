// import React, { useEffect, useMemo, useState } from "react";
// import axios from "axios";

// /* ---------------- API URLs ---------------- */

// const UPLOAD_URL = "http://localhost:8080/api/sense/ingest/upload";
// const FETCH_URL = "http://localhost:8080/api/sense/read";
// const ISSUES_URL = "http://localhost:8080/api/anomalies/active";

// /* ---------------- Stat Card ---------------- */

// function StatCard({ title, value, gradient }) {
//   return (
//     <div className={`${gradient} text-white rounded-2xl p-5 shadow-md`}>
//       <div className="text-sm opacity-90">{title}</div>
//       <div className="text-3xl font-bold mt-2">{value}</div>
//     </div>
//   );
// }

// /* ---------------- Issue Sidebar Card ---------------- */

// function IssueItem({ issue }) {
//   const severityColor =
//     issue.severity === "CRITICAL"
//       ? "text-red-400"
//       : issue.severity === "HIGH"
//       ? "text-orange-400"
//       : issue.severity === "MEDIUM"
//       ? "text-yellow-400"
//       : "text-blue-400";

//   return (
//     <div className="bg-slate-800 rounded-xl p-4 shadow hover:bg-slate-700 transition">
//       <div className="flex justify-between items-center mb-2">
//         <span className={`text-xs font-semibold ${severityColor}`}>
//           {issue.severity}
//         </span>
//         <span className="text-xs text-slate-400">
//           {issue.detectedAt}
//         </span>
//       </div>

//       <div className="text-sm font-semibold text-white">
//         {issue.anomalyType}
//       </div>

//       <div className="text-xs text-slate-400 mt-1">
//         Charger {issue.chargerId}
//       </div>

//       <button className="mt-3 text-xs bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-lg">
//         Resolve
//       </button>
//     </div>
//   );
// }

// /* ---------------- Main Component ---------------- */

// export default function SenseDashboard() {
//   const [file, setFile] = useState(null);
//   const [logs, setLogs] = useState([]);
//   const [issues, setIssues] = useState([]);
//   const [uploading, setUploading] = useState(false);
//   const [loading, setLoading] = useState(false);

//   /* -------- Fetch Logs -------- */

//   const fetchLogs = async () => {
//     try {
//       const res = await axios.get(FETCH_URL);
//       const data = Array.isArray(res.data)
//         ? res.data
//         : res.data?.data ?? [];
//       setLogs(data);
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   /* -------- Fetch Issues -------- */

//   const fetchIssues = async () => {
//     try {
//       const res = await axios.get(ISSUES_URL);
//       const data = Array.isArray(res.data)
//         ? res.data
//         : res.data?.data ?? [];
//       setIssues(data);
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   /* -------- Upload -------- */

//   const upload = async () => {
//     if (!file) return;
//     setUploading(true);

//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       await axios.post(UPLOAD_URL, formData);
//       fetchLogs();
//       fetchIssues();
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setUploading(false);
//     }
//   };

//   /* -------- Auto Refresh -------- */

//   useEffect(() => {
//     fetchLogs();
//     fetchIssues();

//     const interval = setInterval(() => {
//       fetchLogs();
//       fetchIssues();
//     }, 5000);

//     return () => clearInterval(interval);
//   }, []);

//   /* -------- Stats -------- */

//   const stats = useMemo(() => {
//     return {
//       critical: issues.filter(i => i.severity === "CRITICAL").length,
//       high: issues.filter(i => i.severity === "HIGH").length,
//       medium: issues.filter(i => i.severity === "MEDIUM").length,
//       warning: issues.filter(i => i.severity === "WARNING").length,
//       online: new Set(
//         logs.map(l => l?.socketContext?.chargerId)
//       ).size
//     };
//   }, [issues, logs]);

//   /* ---------------- UI ---------------- */

//   return (
//     <div className="min-h-screen ">
//       <div className="max-w-7xl mx-auto p-6">

//         {/* Header */}
//         <div className="flex justify-between items-center mb-6">
//           <div>
//             {/* <h1 className="text-3xl font-bold">
//               OCPP Log & Issues Viewer
//             </h1> */}
//             <p className="text-slate-500 text-sm">
//               Real-time OCPP Monitoring • Anomaly Detection • Charger Diagnostics
//             </p>
//           </div>

//           <div className="flex items-center gap-6 text-sm">
//             <div className="flex items-center gap-2 text-green-600 font-semibold">
//               <span className="w-2 h-2 bg-green-500 rounded-full"></span>
//               System Connected
//             </div>
//             <div className="bg-slate-900 text-white px-4 py-1 rounded-xl">
//               Active Issues {issues.length}
//             </div>
//           </div>
//         </div>

        

//         {/* Main Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


//           {/* LEFT SIDE */}
//           <div className="lg:col-span-2 space-y-6">
// {/* Stat Cards */}
//         <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
//           <StatCard
//             title="Critical Issues"
//             value={stats.critical}
//             gradient="bg-gradient-to-r from-red-600 to-red-400"
//           />
//           <StatCard
//             title="High Issues"
//             value={stats.high}
//             gradient="bg-gradient-to-r from-orange-500 to-orange-400"
//           />
//           <StatCard
//             title="Medium Issues"
//             value={stats.medium}
//             gradient="bg-gradient-to-r from-yellow-500 to-amber-400"
//           />
//           <StatCard
//             title="Warning Issues"
//             value={stats.warning}
//             gradient="bg-gradient-to-r from-blue-600 to-blue-400"
//           />
//           <StatCard
//             title="Online Chargers"
//             value={stats.online}
//             gradient="bg-gradient-to-r from-emerald-600 to-emerald-400"
//           />
//         </div>
//             {/* Upload Section */}
//             {/* <div className="bg-white rounded-2xl border p-6 shadow-sm">
//               <div className="flex gap-4 items-center">
//                 <input
//                   type="file"
//                   onChange={e => setFile(e.target.files[0])}
//                 />
//                 <button
//                   onClick={upload}
//                   className="bg-slate-900 text-white px-6 py-2 rounded-xl"
//                 >
//                   {uploading ? "Uploading..." : "Upload"}
//                 </button>
//                 <button
//                   onClick={fetchLogs}
//                   className="border px-6 py-2 rounded-xl"
//                 >
//                   Refresh Logs
//                 </button>
//               </div>
//             </div> */}

//            {/* Logs Table */}
// <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
//   <div className="overflow-x-auto">
//     <table className="w-full text-sm">
//       <thead className="bg-slate-100 text-slate-600">
//         <tr>
//           <th className="p-3 text-left">S.No</th>
          
//           <th className="text-left">Action</th>
          
//           <th className="text-left">Payload</th>
//         </tr>
//       </thead>

//       <tbody>
//         {logs.map((log, index) => (
//           <tr key={index} className="border-t align-top hover:bg-slate-50">
            
//             {/* S.No */}
//             <td className="p-3 font-medium">
//               {index + 1}
//             </td>

            
//             {/* Action */}
//             <td className="p-3 font-semibold">
//               {log.action}
//             </td>

//             {/* Payload FULL JSON */}
//             <td className="p-3">
//               <pre className="bg-slate-900 text-green-400 text-xs p-3 rounded-xl max-h-60 overflow-auto whitespace-pre-wrap break-words">
// <th ></th>
//  {/* Time */}
//             <td className="p-3 whitespace-nowrap">
//               {log.logTime}
//             </td>

           
          
//            {/* Charger ID */}
//             <td className="p-3 whitespace-nowrap">
//               {log?.socketContext?.chargerId || "-"}
//             </td>

           
//           <th className="text-left">Message Type</th>
          
//             {/* Message Type */}
//             <td className="p-3">
//               {log.messageType}
//             </td>
//                 {JSON.stringify(log.payload, null, 2)}
//               </pre>
//             </td>

//           </tr>
//         ))}
//       </tbody>
//     </table>
//   </div>
// </div>

//           </div>

//           {/* RIGHT SIDE */}
//           <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg">

//             <div className="flex justify-between items-center mb-4">
//               <h2 className="font-semibold">Detected Issues</h2>
//               <span className="text-xs bg-slate-700 px-3 py-1 rounded-lg">
//                 {issues.length}
//               </span>
//             </div>

//             <div className="space-y-3  overflow-y-auto">
//               {issues.map(issue => (
//                 <IssueItem key={issue.id} issue={issue} />
//               ))}
//             </div>

//           </div>

//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line
} from "recharts";

import {
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
// ---------------- COLOR HELPERS ----------------
const statusColor = (status) => {
  switch (status) {
    case "Online":
      return "bg-green-100 text-green-700";
    case "Offline":
      return "bg-red-100 text-red-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
};

const severityColor = (sev) => {
  switch (sev) {
    case "Critical":
      return "bg-red-500";
    case "Major":
      return "bg-orange-500";
    case "Minor":
      return "bg-yellow-500";
    default:
      return "bg-blue-500";
  }
};

// ---------------- STATIC CHARGER DATA ----------------
const CHARGERS = [
  {
    id: "EVY-102",
    cmsId: "CMS-7781",
    vendor: "EVRE",
    status: "Online",
    issues: [
      { type: "Transaction Starts but never stops", severity: "Critical", time: "10:47 AM" },
      { type: "Energy jumps/unrealistic KWH deltas", severity: "High", time: "10:44 AM" }
    ]
  },
  {
    id: "EVY-205",
    cmsId: "CMS-9912",
    vendor: "Tellus Power",
    status: "Warning",
    issues: [
      { type: "Heartbeat missing", severity: "High", time: "10:45 AM" }
    ]
  },
  {
    id: "EVY-045",
    cmsId: "CMS-6644",
    vendor: "Thunder Plus",
    status: "Online",
    issues: [
      { type: "MeterValues flood or missing MeterValues", severity: "Critical", time: "11:03 AM" },
      { type: "Repeated BootNotification", severity: "High", time: "11:02 AM" },
      { type: "Heartbeat missing", severity: "Medium", time: "11:01 AM" },
      { type: "Energy jumps/unrealistic KWH deltas", severity: "Medium", time: "11:00 AM" }
    ]
  },
  {
    id: "EVY-089",
    cmsId: "CMS-2223",
    vendor: "EVRE",
    status: "Offline",
    issues: [
      { type: "Stop Transaction received, but billing is not closed", severity: "High", time: "10:41 AM" }
    ]
  },
  {
    id: "EVY-190",
    cmsId: "CMS-3001",
    vendor: "Tellus Power",
    status: "Warning",
    issues: [
      { type: "RemoteStart accepted, but no charging starts", severity: "Critical", time: "11:12 AM" }
    ]
  },
  {
    id: "EVY-009",
    cmsId: "CMS-3002",
    vendor: "Thunder Plus",
    status: "Online",
    issues: [
      { type: "MeterValues flood or missing MeterValues", severity: "Critical", time: "11:07 AM" },
      { type: "Heartbeat missing", severity: "High", time: "11:06 AM" },
      { type: "Repeated BootNotification", severity: "Medium", time: "11:05 AM" },
      { type: "Energy jumps/unrealistic KWH deltas", severity: "Medium", time: "11:04 AM" }
    ]
  },
  {
    id: "EVY-093",
    cmsId: "CMS-3004",
    vendor: "EVRE",
    status: "Online",
    issues: [
      { type: "Energy jumps/unrealistic KWH deltas", severity: "High", time: "11:09 AM" }
    ]
  }
];
// -------- SENSE LAYER MATRIX DATA --------

const SENSE_MATRIX = {
  revenueLoss: [
    { name: "CMS", value: 12000 },
    { name: "CP", value: 18500 },
    { name: "OCPP", value: 24000 }
  ],
  energyLoss: [
    { name: "CMS", value: 320 },
    { name: "CP", value: 450 },
    { name: "OCPP", value: 610 }
  ],
  issues: [
    { name: "CMS", value: 162 },
    { name: "CP", value: 129 },
    { name: "OCPP", value: 78 }
  ],
  successRate: [
    { name: "Charger", value: 92 },
    { name: "CMS", value: 88 },
    { name: "CP", value: 81 }
  ]
};

const PIE_COLORS = ["#3b82f6", "#f97316", "#ef4444"];

const StatCard = ({ title, value, color }) => (
  <div className={`rounded-2xl p-5 text-white shadow ${color}`}>
    <div className="text-sm opacity-90">{title}</div>
    <div className="text-3xl font-bold mt-1">{value}</div>
  </div>
);
    const PieCard = ({ title, data }) => (
  <div className="bg-white rounded-xl shadow border p-4"> {/* reduced padding */}
    <h3 className="text-md font-semibold mb-2">{title}</h3>

    <ResponsiveContainer width="100%" height={180}> {/* reduced height */}
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          outerRadius={40}   // ⭐ reduced from 90 → 60
          innerRadius={15}   // ⭐ optional (makes donut style & smaller look)
          label
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>

        <Tooltip />
        
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export default function EVChargerDashboard() {
  const [selectedCharger, setSelectedCharger] = useState(CHARGERS[0]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">OCPP Log & Issues Viewer</h1>
        <p className="text-slate-500 text-sm">Real-time OCPP Monitoring • Anomaly Detection • Charger Diagnostics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard title="Critical Issues" value="43" color="bg-red-500" />
        <StatCard title="Major Issues" value="68" color="bg-orange-500" />
        <StatCard title="Minor Issues" value="79" color="bg-yellow-500" />
        <StatCard title="Warnings" value="178" color="bg-blue-500" />
        <StatCard title="Online Chargers" value="684" color="bg-emerald-500" />
      </div>

     

      {/* ---------------- MONITORING SECTION ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 min-h-350 gap-6">

        {/* LEFT TABLE */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow border min-h-[250px] overflow-hidden">
          <div className="p-4 border-b font-semibold text-lg">Chargers</div>

          <div className="overflow-x-auto ">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="p-3 text-left">S.No</th>
                  <th className="text-left">Charger ID</th>
                  <th className="text-left">CMS ID</th>
                  <th className="text-left">Vendor</th>
                  {/* <th className="text-left">Status</th> */}
                  <th className="text-left">Issue Type</th>
                </tr>
              </thead>

              <tbody>
                {CHARGERS.map((charger, index) => {
                  const latestIssue = charger.issues[0];
                  return (
                    <tr
                      key={charger.id}
                      onClick={() => setSelectedCharger(charger)}
                      className={`cursor-pointer border-t hover:bg-blue-50 transition ${
                        selectedCharger?.id === charger.id ? "bg-blue-100" : ""
                      }`}
                    >
                      <td className="p-3 font-medium">{index + 1}</td>
                      <td className="font-semibold text-blue-700">{charger.id}</td>
                      <td>{charger.cmsId}</td>
                      <td>{charger.vendor}</td>
                      {/* <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(charger.status)}`}>
                          {charger.status}
                        </span>
                      </td> */}
                      <td className="text-xs font-semibold">
                        {latestIssue ? latestIssue.type : "No Issues"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg min-h-[250px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Detected Issues</h2>
            <span className="text-sm text-slate-300">{selectedCharger?.id}</span>
          </div>

          {selectedCharger?.issues.length === 0 ? (
            <div className="text-slate-400 text-sm">No issues for this charger.</div>
          ) : (
            <div className="space-y-3">
              {selectedCharger.issues.map((issue, idx) => (
                <div key={idx} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${severityColor(issue.severity)}`} />
                      <span className="text-sm font-semibold">{issue.severity}</span>
                    </div>
                    <span className="text-xs text-slate-400">{issue.time}</span>
                  </div>

                  <div className="text-sm font-medium mb-3 break-words">{issue.type}</div>

                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-lg">
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

       {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        {/* Charger Status Bar Chart */}
        <div className="bg-white rounded-2xl shadow border p-6">
          <h3 className="text-lg font-semibold mb-4">Charger Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={[
                { name: "Critical Issues", value: 43 },
                { name: "Major Issues", value: 68},
                { name: "Minor Issues", value: 79 },
                { name: "Warnings", value: 178 }
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Issues Trend Line Chart */}
        <div className="bg-white rounded-2xl shadow border p-6">
          <h3 className="text-lg font-semibold mb-4">Anomaly Trend (Last 6 Hours)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={[
                { time: "10AM", issues: 22 },
                { time: "11AM", issues: 15 },
                { time: "12PM", issues: 3 },
                { time: "1PM", issues: 17 },
                { time: "2PM", issues: 34 },
                { time: "3PM", issues: 6 }
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="issues" stroke="#ef4444" strokeWidth={3} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
 {/* ---------------- SENSE LAYER IMPACT MATRIX ---------------- */}

<div className="mt-12">
  <h2 className="text-2xl font-bold mb-6">
    Sense Layer Impact Matrix (CMS vs CP vs OCPP)
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

    <PieCard
      title="Revenue Loss Today"
      data={SENSE_MATRIX.revenueLoss}
    />

    <PieCard
      title="Energy Loss (kWh)"
      data={SENSE_MATRIX.energyLoss}
    />

    <PieCard
      title="Issues Distribution"
      data={SENSE_MATRIX.issues}
    />

    <PieCard
      title="Success Rate (%)"
      data={SENSE_MATRIX.successRate}
    />
<Legend />
  </div>
</div>
    </div>
  );
}
