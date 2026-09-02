import React, { useEffect, useState } from "react";
import axios from "axios";

// ---- CHANGE THESE URLS ----
const UPLOAD_URL = "http://localhost:8080/api/sense/ingest/upload"; // POST multipart/form-data
const FETCH_URL = "http://localhost:8080/api/sense/read"; // GET logs
const ISSUES_URL = "http://localhost:8080/api/anomalies/active"; // GET issues
const CHARGER_ISSUES_BASE_URL = "http://localhost:8080/api/anomalies";

function JsonBlock({ data }) {
  if (!data) return <div className="text-slate-400 italic">No data</div>;
  return (
    <pre className="whitespace-pre-wrap break-words text-sm bg-slate-900/70 text-slate-100 p-3 rounded-xl overflow-auto max-h-64">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function SocketContext({ ctx }) {
  if (!ctx) return null;
  const rows = [
    ["Charger ID", ctx.chargerId],
    ["Client ID", ctx.clientId],
    ["Client IP", ctx.clientIp],
    ["Connected At", ctx.connectedAt],
    ["Session ID", ctx.sessionId],
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {rows.map(([k, v]) => (
        <div key={k} className="bg-slate-50 rounded-2xl p-3 border">
          <div className="text-xs text-slate-500">{k}</div>
          <div className="font-medium text-slate-900 break-all">{v ?? "—"}</div>
        </div>
      ))}
    </div>
  );
}

function LogCard({ item, index }) {
  const [openPayload, setOpenPayload] = useState(true);
  const [openSocket, setOpenSocket] = useState(false);

  const badgeColor =
    item.eventType === "WEBSOCKET"
      ? "bg-emerald-100 text-emerald-700"
      : item.eventType === "OCPP_REQUEST"
      ? "bg-amber-100 text-amber-700"
      : "bg-indigo-100 text-indigo-700";

  return (
    <div className="rounded-3xl border bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-semibold">
            {index + 1}
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">{item.action}</div>
            <div className="text-xs text-slate-500">{item.logTime}</div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
          {item.eventType}
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-2xl p-3 border">
            <div className="text-xs text-slate-500">Message ID</div>
            <div className="font-medium text-slate-900 break-all">{item.messageId ?? "—"}</div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 border">
            <div className="text-xs text-slate-500">Message Type</div>
            <div className="font-medium text-slate-900">{item.messageType ?? "—"}</div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 border">
            <div className="text-xs text-slate-500">Action</div>
            <div className="font-medium text-slate-900">{item.action}</div>
          </div>
        </div>

        <div className="rounded-2xl border">
          <button
            onClick={() => setOpenPayload((s) => !s)}
            className="w-full text-left px-4 py-3 font-medium text-slate-900 flex items-center justify-between"
          >
            <span>Payload</span>
            <span className="text-slate-500 text-sm">{openPayload ? "Hide" : "Show"}</span>
          </button>
          {openPayload && (
            <div className="px-4 pb-4">
              <JsonBlock data={item.payload} />
            </div>
          )}
        </div>

        <div className="rounded-2xl border">
          <button
            onClick={() => setOpenSocket((s) => !s)}
            className="w-full text-left px-4 py-3 font-medium text-slate-900 flex items-center justify-between"
          >
            <span>Socket Context</span>
            <span className="text-slate-500 text-sm">{openSocket ? "Hide" : "Show"}</span>
          </button>
          {openSocket && (
            <div className="px-4 pb-4">
              <SocketContext ctx={item.socketContext} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueCard({ item, index }) {
  const sevColor =
    item.severity === "HIGH"
      ? "bg-red-100 text-red-700"
      : item.severity === "WARNING"
      ? "bg-amber-100 text-amber-700"
      : "bg-indigo-100 text-indigo-700";

  const statusColor =
    item.status === "ACTIVE" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700";

  return (
    <div className="rounded-3xl border bg-white shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-semibold">
            {index + 1}
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">{item.anomalyType}</div>
            <div className="text-xs text-slate-500">Detected: {item.detectedAt}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${sevColor}`}>{item.severity}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>{item.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-slate-50 rounded-2xl p-3 border">
          <div className="text-xs text-slate-500">Charger ID</div>
          <div className="font-medium text-slate-900">{item.chargerId}</div>
        </div>
         <div className="bg-slate-50 rounded-2xl p-3 border">
          <div className="text-xs text-slate-500">Issue ID</div>
          <div className="font-medium text-slate-900">{item.id}</div>
        </div>
         
         <div className="bg-slate-50 rounded-2xl p-3 border">
          <div className="text-xs text-slate-500">Occurrence Count</div>
          <div className="font-medium text-slate-900">{item.occurrenceCount}</div>
        </div>  
      </div>
      <div className="bg-slate-50 rounded-2xl p-3 border mt-3">
        <div className="text-xs text-slate-500">Anomaly Type</div>
          <div className="font-medium text-slate-900">{item.anomalyType}</div>
      
          <div className="text-xs text-slate-500">Root Cause</div>
          <div className="font-medium text-slate-900">{item.rootCause}</div>

        </div>
    </div>
  );
}

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [issues, setIssues] = useState([]);
  const [chargerIssues, setChargerIssues] = useState([]);
  const [activeTab, setActiveTab] = useState("logs"); // 'logs' | 'issues' | 'charger'
  const [chargerId, setChargerId] = useState(""); // State for charger ID input

  const onFileChange = (e) => {
    setFile(e.target.files?.[0] ?? null);
    setError("");
  };

  const upload = async () => {
    if (!file) {
      setError("Please choose a file first.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(UPLOAD_URL, formData, { timeout: 120000 });
      if (res.status === 200) {
        setTimeout(fetchLogs, 8000);
      } else {
        setError(`Upload failed with status ${res.status}`);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    setError("");
    try {
      const res = await axios.get(FETCH_URL, { timeout: 60000 });
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setLogs(data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchIssues = async () => {
    setLoadingIssues(true);
    setError("");
    try {
      const res = await axios.get(ISSUES_URL, { timeout: 60000 });
      console.log('issues res ', res);
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setIssues(data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load issues");
    } finally {
      setLoadingIssues(false);
    }
  };

  const fetchChargerIssues = async () => {
    if (!chargerId) {
      setError("Please enter a charger ID");
      return;
    }
    
    setLoadingIssues(true);
    setError("");
    try {
      const res = await axios.get(`${CHARGER_ISSUES_BASE_URL}/${chargerId}`, { timeout: 60000 });
      console.log('charger issues res ', res);
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setChargerIssues(data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load charger issues");
    } finally {
      setLoadingIssues(false);
    }
  };

  useEffect(() => {
    if (activeTab === "issues" && issues.length === 0) {
      fetchIssues();
    }
  }, [activeTab, issues.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 rounded-2xl">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900">OCPP Log & Issues Viewer</h1>
          <p className="text-slate-600 mt-2">Upload logs, review parsed events, and inspect detected anomalies.</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-5 py-2 rounded-2xl font-medium border ${activeTab === "logs" ? "bg-slate-900 text-white" : "bg-white"}`}
          >
            Logs
          </button>
          {/* <button
            onClick={() => setActiveTab("issues")}
            className={`px-5 py-2 rounded-2xl font-medium border ${activeTab === "issues" ? "bg-slate-900 text-white" : "bg-white"}`}
          >
            Active Issues
          </button> */}
          <button
            onClick={() => setActiveTab("charger")}
            className={`px-5 py-2 rounded-2xl font-medium border ${activeTab === "charger" ? "bg-slate-900 text-white" : "bg-white"}`}
          >
            Issues Detected
          </button>
        </div>

        {/* Upload Card (only for logs tab) */}
        {activeTab === "logs" && (
          <div className="bg-white rounded-3xl border shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="flex-1">
                <div className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50">
                  <div className="text-slate-700 font-medium">Choose file (JSON / TXT)</div>
                  <div className="text-xs text-slate-500 mt-1">Max size depends on server</div>
                  <input type="file" className="hidden" onChange={onFileChange} />
                  {file && (
                    <div className="mt-3 text-sm text-slate-900 font-semibold break-all">{file.name}</div>
                  )}
                </div>
              </label>
              <div className="flex gap-3">
                <button
                  onClick={upload}
                  disabled={uploading}
                  className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-medium disabled:opacity-60"
                >
                  {uploading ? "Uploading…" : "Upload"}
                </button>
                <button
                  onClick={fetchLogs}
                  disabled={loadingLogs}
                  className="px-6 py-3 rounded-2xl border font-medium"
                >
                  {loadingLogs ? "Loading…" : "Refresh Logs"}
                </button>
              </div>
            </div>
            {error && <div className="mt-4 text-red-600 text-sm">{error}</div>}
          </div>
        )}

        {/* Logs */}
        {activeTab === "logs" && (
          <div className="grid grid-cols-1 gap-6">
           {logs.length === 0 && !loadingLogs ? (
  <div className="text-slate-500">
    No logs yet. Upload a file to see events.
  </div>
) : (
  <div className="text-slate-900 text-2xl font-bold">
    Converted Raw Logs.
  </div>
)}
            
            {logs.map((item, i) => (
              <LogCard key={i} item={item} index={i} />
            ))}
          </div>
        )}

        {/* Issues */}
        {activeTab === "issues" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={fetchIssues}
                disabled={loadingIssues}
                className="px-5 py-2 rounded-2xl border font-medium"
              >
                {loadingIssues ? "Loading…" : "Refresh Issues"}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {issues.length === 0 && !loadingIssues && (
                <div className="text-slate-500">No active issues.</div>
              )}
              {issues.map((item, i) => (
                <IssueCard key={item.id ?? i} item={item} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Charger Issues */}
        {activeTab === "charger" && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border shadow-sm p-6 mb-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Charger ID
                  </label>
                  <input
                    type="text"
                    value={chargerId}
                    onChange={(e) => setChargerId(e.target.value)}
                    placeholder="Enter charger ID"
                    className="w-full px-4 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <button
                  onClick={fetchChargerIssues}
                  disabled={loadingIssues}
                  className="px-6 py-2 rounded-2xl bg-slate-900 text-white font-medium disabled:opacity-60"
                >
                  {loadingIssues ? "Loading…" : "Get Charger Issues"}
                </button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={fetchChargerIssues}
                disabled={loadingIssues}
                className="px-5 py-2 rounded-2xl border font-medium"
              >
                {loadingIssues ? "Loading…" : "Refresh"}
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {chargerIssues.length === 0 && !loadingIssues && (
                <div className="text-slate-500">No issues found for this charger.</div>
              )}
              {chargerIssues.map((item, i) => (
                <IssueCard key={item.id ?? i} item={item} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}