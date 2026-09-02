import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, ChevronDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchEmployeeById } from "@/store/reducers/employee/employeeSlice";
import { updateIssueStatus, fetchIssueNotes, addIssueNote, updateIssueNote } from "@/store/reducers/issues/issuesSlice";

export function CustomerSupportTaskDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const issue = location.state?.issue;
  const [activeTab, setActiveTab] = useState("info");
  const [status, setStatus] = useState(issue?.status || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const from = location.state?.from || "/dashboard";

  const user = useSelector((state) => state.authentication.user);
  const employees = useSelector((state) => state.employee.employees);
  const issueNotes = useSelector((state) => state.issues.issueNotes || []);

  // Add Note states
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [saving, setSaving] = useState(false);

  // Add new state variables at the top
const [editingNoteId, setEditingNoteId] = useState(null);
const [editingTitle, setEditingTitle] = useState("");
const [editingDescription, setEditingDescription] = useState("");

// Add a handler for starting the edit
const handleEditNote = (note) => {
  setEditingNoteId(note.id);
  setEditingTitle(note.title);
  setEditingDescription(note.description);
  setIsAddingNote(true); // Reuse the form
};

// Modify handleAddNote to handle edit
const handleSaveNote = async (e) => {
  e.preventDefault();

  if (!editingTitle || !editingDescription) {
    alert("Please fill all required fields!");
    return;
  }

  setSaving(true);

  try {
    const payload = {
      title: editingTitle,
      description: editingDescription,
    };

    if (editingNoteId) {
      // ✅ Correct way to dispatch updateNote
      await dispatch(updateIssueNote(editingNoteId, payload));
    } else {
      await dispatch(addIssueNote({
        employeeId: user.id,
        recipientId: user.id,
        issueId: issue.id,
        title: editingTitle,
        description: editingDescription,
        createdByRole: "EMPLOYEE"
      }));
    }

    await dispatch(fetchIssueNotes(issue.id));

    // Reset form
    setIsAddingNote(false);
    setEditingNoteId(null);
    setEditingTitle("");
    setEditingDescription("");
  } catch (err) {
    console.error("Failed to save note:", err);
    alert("Error saving note. Check console for details.");
  } finally {
    setSaving(false);
  }
};


  useEffect(() => {
    if (issue?.employeeId) {
      dispatch(fetchEmployeeById(issue.employeeId));
    }
     if (issue?.id) {
      dispatch(fetchIssueNotes(issue.id));
    }
  }, [dispatch, issue]);

  if (!issue) return <p>Issue not found</p>;

  const handleAddNote = async (e) => {
  e.preventDefault();
  if (!noteTitle || !noteDescription) {
    alert("Please fill all required fields!");
    return;
  }
  setSaving(true);
  try {
const payload = {
  employeeId: user.id,   // logged-in employee who is creating the note
  recipientId: user.id,  // same employee as recipient
  issueId: issue.id,
  title: noteTitle,
  description: noteDescription,
  createdByRole: "EMPLOYEE"
};

    await dispatch(addIssueNote(payload));
    await dispatch(fetchIssueNotes(issue.id));
    setIsAddingNote(false);
    setNoteTitle("");
    setNoteDescription("");
  } catch (err) {
    console.error("Failed to add note:", err);
  } finally {
    setSaving(false);
  }
};

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString();
  };

  const getPriorityBadge = (priority) => {
  if (!priority) 
    return <span className="px-3 py-1 text-sm bg-gray-100 text-gray-800 ">N/A</span>;
  const p = priority.toLowerCase();
  switch (p) {
    case "high":
      return <span className="bg-orange-100 text-orange-800 rounded-full px-3 py-1 text-sm">High</span>;
    case "medium":
      return <span className="bg-yellow-100 text-yellow-800 rounded-full px-2 py-1 text-sm">Medium</span>;
    case "low":
      return <span className="bg-green-100 text-green-800 rounded-full px-2 py-1">Low</span>;
    default:
      return <span className="bg-gray-100 text-gray-800 rounded-full px-2 py-1">{priority}</span>;
  }
};

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Issue Details</h1>
        <Button
        variant="outline"
        className="ml-auto flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium :bg-gray-100hover"
        onClick={() => navigate(from)} // <-- navigate back to origin
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back
      </Button>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info" className="text-black font-medium">
            Issue Info
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-black font-medium">
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Issue Info Tab */}
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Issue Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Ticket Id</h3>
                    <p className="text-sm">{issue.ticketId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Type</h3>
                    <p className="text-sm">{issue.type}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Category</h3>
                    <p className="text-sm">{issue.category ? issue.category : '-'} </p>
                  </div>
                  <div className="relative">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                    <button
                      className={`flex items-center px-2 py-1 rounded-full transition ${
                        status === "resolved"
                          ? "bg-green-100 text-green-800 border border-green-500 cursor-not-allowed"
                          : status === "open"
                          ? "bg-red-100 text-red-800 border border-red-500"
                          : "bg-yellow-100 text-yellow-800 border border-yellow-500"
                      }`}
                      onClick={() => status !== "resolved" && setDropdownOpen((prev) => !prev)}
                      disabled={status === "resolved"} // ✅ disables click
                    >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    {status !== "resolved" && <ChevronDown className="ml-2 h-4 w-4" />}
                  </button>

                  {dropdownOpen && status !== "resolved" && (
                    <div className="absolute mt-2 w-40 bg-white shadow-lg rounded-md z-10 p-2 border border-gray-200">
                      {["open", "inprogress", "resolved"].map((option) => (
                        <button
                          key={option}
                          className={`w-full text-left px-3 py-1 mb-1 rounded-full transition ${
                            option === "open"
                              ? "bg-red-100 text-red-800 border border-red-500"
                              : option === "resolved"
                              ? "bg-green-100 text-green-800 border border-green-500"
                              : "bg-yellow-100 text-yellow-800 border border-yellow-500"
                          }`}
                          onClick={() => {
                            if (status === "resolved") return; // ✅ prevent changing
                            setStatus(option);
                            dispatch(updateIssueStatus(issue.id, option));
                            setDropdownOpen(false);
                          }}
                        >
                          {option.charAt(0).toUpperCase() + option.slice(1)}
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
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="text-sm">{issue.email ? issue.email : '-'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                    {getPriorityBadge(issue.priority)}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Org Id</h3>
                    <p className="text-sm">{issue.orgId ? issue.orgId :'-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-4 space-y-4">

       {/* Add Note Form */}
{/* Add/Edit Note Form */}
{isAddingNote && (
  <Card>
    <CardHeader>
      <CardTitle>{editingNoteId ? "Edit Note" : "Add Note"}</CardTitle>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleSaveNote} className="space-y-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={editingNoteId ? editingTitle : noteTitle}
            onChange={(e) =>
              editingNoteId ? setEditingTitle(e.target.value) : setNoteTitle(e.target.value)
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={editingNoteId ? editingDescription : noteDescription}
            onChange={(e) =>
              editingNoteId ? setEditingDescription(e.target.value) : setNoteDescription(e.target.value)
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            rows={4}
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Employee ID</label>
          <input
            type="text"
            value={user.id} // logged-in employee ID
            className="w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-100"
            disabled
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingNoteId ? "Save Changes" : "Add Note"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsAddingNote(false);
              setEditingNoteId(null);
              setEditingTitle("");
              setEditingDescription("");
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
)}

{/* Notes List */}
{!isAddingNote && (
  <Card>
    <CardHeader>
      <CardTitle>Notes List</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {issueNotes.length === 0 ? (
        <p className="text-gray-500">No notes available.</p>
      ) : (
        issueNotes.map((note) => (
          <div
            key={note.id}
            className="border p-3 rounded-md hover:bg-gray-50 flex justify-between items-start"
          >
            <div>
              <h3 className="font-medium">Title: {note.title}</h3>
              <p>Description: {note.description}</p>
              <p className="text-xs text-gray-500">
                By {note.createdByRole || "Unknown"} -{" "}
                <span className="text-xs text-gray-500">
              {new Date(
                note.createdDate[0],
                note.createdDate[1] - 1,
                note.createdDate[2],
                note.createdDate[3],
                note.createdDate[4]
              ).toLocaleString()}
            </span>
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => handleEditNote(note)}>
              Edit
            </Button>
          </div>
        ))
      )}
    </CardContent>
    <div className="p-3">
      <Button
        onClick={() => {
          setIsAddingNote(true);
          setEditingNoteId(null);
          setEditingTitle("");
          setEditingDescription("");
        }}
      >
        Add New Note
      </Button>
    </div>
  </Card>
)}


        </TabsContent>
      </Tabs>
    </div>
  );
}
