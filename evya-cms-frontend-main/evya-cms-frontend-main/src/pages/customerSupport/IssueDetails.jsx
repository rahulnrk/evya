import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployeesByDesignation } from "@/store/reducers/employee/employeeSlice";
import { updateIssueStatus, updateIssuePriority, addIssueNote, fetchIssueNotes, updateIssueNote } from "@/store/reducers/issues/issuesSlice";
import { SelectTrigger, SelectValue } from "@radix-ui/react-select";

export default function IssueDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const issue = location.state?.issue;
  const issueNotes = useSelector((state) => state.issues.issueNotes || []);
  const from = location.state?.from || "/customer-support/issue-list";

  const [activeTab, setActiveTab] = useState("info");
  const [status, setStatus] = useState(issue?.status || "Open");
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [priority, setPriority] = useState(issue?.priority || "N/A");
  const [priorityDropdown, setPriorityDropdown] = useState(false);
  const [employeeId] = useState(issue?.employeeId || location.state?.customer?.id || "");

  const user = useSelector((state) => state.authentication.user);
  const employees = useSelector((state) => state.employee.employees);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [taskId, setTaskId] = useState("");

  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const handleEditClick = (note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditDescription(note.description);
  };

  const [issueId, setIssueId] = useState(issue?.id || "");
  const [saving, setSaving] = useState(false);
  const [createdByRole, setCreatedByRole] = useState( user?.roleId === 1 ? "ADMIN" : "EMPLOYEE" );

  if (!issue) return <p>No issue data found!</p>;

  const formatDate = (dateStr) => (dateStr ? new Date(dateStr).toLocaleDateString() : "N/A");

  const statusOptions = ["open", "inprogress", "resolved",];
  const priorityOptions = ["High", "Medium", "Low"];

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    setStatusDropdown(false);
    try {
      await dispatch(updateIssueStatus( issue.id, newStatus ));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePriorityChange = async (newPriority) => {
  setPriority(newPriority);
  setPriorityDropdown(false);
  try {
    await dispatch(updateIssuePriority(issue.id, newPriority));
  } catch (err) {
    console.error(err);
  }
};

  useEffect(() => {
    dispatch(fetchEmployeesByDesignation("Customer Support"));
  }, [dispatch]);

  useEffect(() => {
  if (issue?.id) {
    dispatch(fetchIssueNotes(issue.id));
  }
}, [dispatch, issue]);

const handleAddNote = async (e) => {
  e.preventDefault();

  if (!noteTitle || !noteDescription || !recipientId) {
    alert("Please fill all required fields!");
    return;
  }

  setSaving(true);
  try {
    const payload = {
      employeeId: employeeId,
      recipientId: Number(recipientId),
      taskId: taskId ? Number(taskId) : null,
      issueId: issueId ? Number(issueId) : null,
      title: noteTitle,
      description: noteDescription,
      createdByRole: createdByRole.toUpperCase(),
    };

    console.log("Sending payload:", payload);

    await dispatch(addIssueNote(payload));
    await dispatch(fetchIssueNotes(issue.id));

    setIsAddingNote(false);
    setNoteTitle("");
    setNoteDescription("");
    setRecipientId("");
    setTaskId("");
    setIssueId(issue?.id || "");

    console.log("Note added successfully");
  } catch (err) {
    console.error("Failed to add note:", err);
  } finally {
    setSaving(false);
  }
};

const handleSaveEdit = async (noteId) => {
  if (!editTitle || !editDescription) {
    alert("Please fill all fields!");
    return;
  }
  setEditSaving(true);
  try {
    await dispatch(updateIssueNote(noteId, {
      title: editTitle,
      description: editDescription,
      issueId: issue.id,
    }));
    await dispatch(fetchIssueNotes(issue.id));
    setEditingNoteId(null);
  } catch (err) {
    console.error("Failed to update note:", err);
  } finally {
    setEditSaving(false);
  }
};

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Issue Details</h1>
        <Button
        variant="outline"
        className="ml-auto flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-100"
        onClick={() =>
        navigate(`/customer-support/${location.state?.customer?.id}`, {
            state: {
            customer: location.state?.customer,
            activeTab: "issues",
            },
        })
        } >
        <ArrowLeftIcon className="h-4 w-4" /> Back
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info" className="text-black font-medium">Issue Info</TabsTrigger>
          <TabsTrigger value="notes" className="text-black font-medium">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Issue Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Ticket ID</h3>
                    <p className="text-sm">{issue.ticketId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Title</h3>
                    <p className="text-sm">{issue.issue}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="text-sm">{issue.comment || "N/A"}</p>
                  </div>
                  <div className="relative">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                    <button
                      className={`flex items-center px-2 py-1 rounded-full border transition ${
                        status === "resolved"
                          ? "bg-green-100 text-green-800 cursor-not-allowed border-green-500"
                          : status === "open"
                          ? "bg-red-100 text-red-800 border-red-500"
                          : "bg-yellow-100 text-yellow-800 border-yellow-500"
                      }`}
                      onClick={() => status !== "resolved" && setStatusDropdown((prev) => !prev)}
                      disabled={status === "resolved"}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                      {status !== "resolved" && <ChevronDown className="ml-2 h-4 w-4" />}
                    </button>
                    {statusDropdown && status !== "resolved" && (
                      <div className="absolute mt-2 w-40 bg-white shadow-lg rounded-md z-10 p-2 border border-gray-200">
                        {statusOptions.map((opt) => (
                          <button
                            key={opt}
                            className={`w-full text-left px-3 py-1 mb-1 rounded-full transition ${
                              opt === "open"
                                ? "bg-red-100 text-red-800 border border-red-500"
                                : opt === "resolved"
                                ? "bg-green-100 text-green-800 border border-green-500"
                                : "bg-yellow-100 text-yellow-800 border border-yellow-500"
                            }`}
                            onClick={() => handleStatusChange(opt)}
                          >
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                <button
                    className={`flex items-center px-2 py-1 rounded-full border transition ${
                    priority.toLowerCase() === "high"
                        ? "bg-orange-100 text-orange-800 border-orange-500"
                        : priority.toLowerCase() === "medium"
                        ? "bg-yellow-100 text-yellow-800 border-yellow-500"
                        : priority.toLowerCase() === "low"
                        ? "bg-green-100 text-green-800 border-green-500"
                        : "bg-gray-100 text-gray-800 border-gray-300"
                    }`}
                    onClick={() => setPriorityDropdown((prev) => !prev)}
                >
                    {priority}
                    {priority !== "N/A" && <ChevronDown className="ml-2 h-4 w-4" />}
                </button>
                {priorityDropdown && (
                    <div className="absolute mt-2 w-40 bg-white shadow-lg rounded-md z-10 p-2 border border-gray-200">
                    {priorityOptions.map((opt) => (
                        <button
                        key={opt}
                        className={`w-full text-left px-3 py-1 mb-1 rounded-full transition ${
                            opt === "High"
                            ? "bg-orange-100 text-orange-800 border border-orange-500"
                            : opt === "Medium"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-500"
                            : "bg-green-100 text-green-800 border border-green-500"
                        }`}
                        onClick={() => handlePriorityChange(opt)}
                        >
                        {opt}
                        </button>
                    ))}
                    </div>
                )}
                </div>
                  </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created Date</h3>
                    <p className="text-sm">{formatDate(issue.createdDate)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                    <p className="text-sm">{formatDate(issue.dueDate)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Category</h3>
                    <p className="text-sm">{issue.category || "-"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notes" className="mt-4 space-y-4">
          {!isAddingNote && (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
              onClick={() => setIsAddingNote(true)}
            >
              Add Note
            </Button>
          )}
          {isAddingNote && (
          <Card className="shadow-md border border-gray-100 rounded-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Add Note</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddNote} className="space-y-4">
                {/* Title */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Enter note title"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-700"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={noteDescription}
                    onChange={(e) => setNoteDescription(e.target.value)}
                    placeholder="Enter note description"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-700"
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Recipient</label>
                    <select
                      value={recipientId || ""}
                      onChange={(e) => setRecipientId(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-700"
                      required
                    >
                      <option value="">Select Recipient</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                    <input
                      type="text"
                      value={employeeId}
                      readOnly
                      className="w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-100 cursor-not-allowed"
                    />
                  </div>  
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Created By Role</label>
                    <select
                      value={createdByRole}
                      onChange={(e) => setCreatedByRole(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-700"
                      required
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="EMPLOYEE">EMPLOYEE</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingNote(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
                    > {saving ? "Saving..." : "Submit"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            )}
            {!isAddingNote && (
              <Card className="shadow-md border border-gray-100 rounded-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Notes List</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                {issueNotes.length === 0 ? (
            <p className="text-gray-500">No notes available.</p>
          ) : (
            issueNotes.map((note) => (
              <div
                key={note.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition relative"
              >
              {editingNoteId === note.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleSaveEdit(note.id)} disabled={editSaving}>
                      {editSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingNoteId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={() => handleEditClick(note)}
            >
              Edit
            </Button>
            <div>
              <h3 className="font-medium text-gray-900">Title: {note.title}</h3>
                        <p className="text-gray-700 mb-2">Description: {note.description}</p>
                        <p className="text-xs text-gray-500">
              By {note.createdByRole || "Unknown"}
            </p>
            <span className="text-xs text-gray-500">
              {new Date(
                note.createdDate[0],
                note.createdDate[1] - 1,
                note.createdDate[2],
                note.createdDate[3],
                note.createdDate[4]
              ).toLocaleString()}
            </span>
          </div>          
         </>
        )}
       </div>
      ))
     )}
      </CardContent>
    </Card>
   )}
</TabsContent>
</Tabs>
</div>
);
}