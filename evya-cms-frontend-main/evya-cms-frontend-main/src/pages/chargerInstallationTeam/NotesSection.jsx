import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Loading from "@/users/Loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  InfoIcon, 
  Trash2, 
  Edit, 
 
} from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import {
  fetchTaskNotes,
  addTaskNote,
  updateTaskNote,
  deleteTaskNote,
  fetchAllEmployees, 
} from "@/store/reducers/chargerInstallation/ChargerInstallationSlice";

const NotesSection = ({ taskId, currentUser, employeeId, isTechnicianPortal = false, onBack }) => {
  const dispatch = useDispatch();

  const {
    taskNotes,
    taskNotesLoading,
    taskNotesError,
    allEmployees,
    teams,
    allEmployeesLoading = false,
  } = useSelector((state) => state.chargerInstallation);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [newNote, setNewNote] = useState({
    title: "",
    description: "",
    employeeId: employeeId || currentUser?.id || "",
    recipientId: 1,
    createdByRole: currentUser?.role || "ADMIN",
    taskId: taskId,
  });

  useEffect(() => {
    dispatch(fetchAllEmployees());
  }, [dispatch]);

  useEffect(() => {
    if (taskId) {
      dispatch(fetchTaskNotes(taskId));
    }
  }, [taskId, dispatch]);

  useEffect(() => {
    if (isAddingNote) {
      setNewNote({
        title: "",
        description: "",
        employeeId: employeeId || currentUser?.id || "",
        recipientId: 1,
        createdByRole: currentUser?.role || "ADMIN",
        taskId: taskId,
      });
    }
  }, [isAddingNote, taskId, employeeId, currentUser]);

const formatDate = (arr) => {
  if (!arr || !Array.isArray(arr) || arr.length < 6) return "Date not available";

  const [year, month, day, hour, minute, second] = arr;

  const date = new Date(year, month - 1, day, hour, minute, second);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};


  const handleAddNote = async () => {
    if (!newNote.description.trim()) {
      toast({ title: "Error", description: "Please enter a note description", variant: "destructive" });
      return;
    }

    const noteData = {
      ...newNote,
      description: newNote.description.trim(),
      employeeId: employeeId || recipientId,
      taskId: taskId,
      ...(newNote.recipientId !== "none" && { recipientId: parseInt(newNote.recipientId) }),
    };

    try {
      await dispatch(addTaskNote(noteData)).unwrap();
      toast({ title: "Success", description: "Note added successfully" });
      setIsAddingNote(false);
      dispatch(fetchTaskNotes(taskId));
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to add note", variant: "destructive" });
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote?.description?.trim()) {
      toast({ title: "Error", description: "Please enter a note description", variant: "destructive" });
      return;
    }

    try {
      const updateData = {
        ...editingNote,
        description: editingNote.description.trim(),
        ...(editingNote.recipientId && editingNote.recipientId !== "none" && { recipientId: parseInt(editingNote.recipientId) }),
      };

      await dispatch(updateTaskNote({ noteId: editingNote.id, noteData: updateData })).unwrap();
      toast({ title: "Success", description: "Note updated successfully" });
      setEditingNote(null);
      dispatch(fetchTaskNotes(taskId));
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to update note", variant: "destructive" });
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await dispatch(deleteTaskNote(noteId)).unwrap();
      toast({ title: "Success", description: "Note deleted successfully" });
      dispatch(fetchTaskNotes(taskId));
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to delete note", variant: "destructive" });
    }
  };

  const cancelAddNote = () => setIsAddingNote(false);
  return (
    <div className="space-y-6 ">
     <div className="flex justify-end gap-1">
  <Button
    variant="outline"
    onClick={onBack}
    className="flex items-center gap-2"
  >
    ← Back
  </Button>

  {!isTechnicianPortal && !isAddingNote && (
    <Button onClick={() => setIsAddingNote(true)}>
      Add Note
    </Button>
  )}
</div>

      

      {/* Add Note Form */}
      {isAddingNote && (
        <div className="space-y-4 border p-4 rounded-lg bg-white">
          <h4 className="font-medium text-lg">Add New Note</h4>
          {/* Recipient Dropdown */}
          <div>
            <Label htmlFor="recipient">Recipient</Label>
            <Select
              value={newNote.recipientId}
              onValueChange={(value) => setNewNote(prev => ({ ...prev, recipientId: value }))}
            >
              <SelectTrigger id="recipient">
                <SelectValue placeholder="Select recipient (optional)" />
              </SelectTrigger>
              <SelectContent>
                {allEmployeesLoading ? (
                  <SelectItem value="loading" disabled>Loading employees...</SelectItem>
                ) : (
                  teams.map(emp => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.username} ({emp.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Created By Role Dropdown */}
           <div>
              <Label>Created By Role</Label>
              <Input
                value="Admin"
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
          

          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newNote.title}
              onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter note title"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={newNote.description}
              onChange={(e) => setNewNote(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter note description"
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={cancelAddNote}>Cancel</Button>
            <Button onClick={handleAddNote} disabled={!newNote.description.trim()}>Save Note</Button>
          </div>
        </div>
      )}

      {/* Edit Note Form */}
      {editingNote && (
        <div className="space-y-4 border p-4 rounded-lg bg-lite-50">
          <h4 className="font-medium text-lg">Edit Note</h4>

          <div>
            <Label>Recipient</Label>
            <Select
              value={editingNote.recipientId || "none"}
              onValueChange={(value) => setEditingNote(prev => ({ ...prev, recipientId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Admin</SelectItem>
                {allEmployees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.username} ({emp.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Created By Role</Label>
            <Select
              value={editingNote.createdByRole}
              onValueChange={(value) => setEditingNote(prev => ({ ...prev, createdByRole: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title & Description */}
          <div>
            <Label>Title</Label>
            <Input value={editingNote.title} onChange={(e) => setEditingNote(prev => ({ ...prev, title: e.target.value }))} placeholder="Enter note title" />
          </div>
          <div>
            <Label>Description *</Label>
            <Textarea value={editingNote.description} onChange={(e) => setEditingNote(prev => ({ ...prev, description: e.target.value }))} rows={4} placeholder="Enter note description" />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setEditingNote(null)}>Cancel</Button>
            <Button onClick={handleUpdateNote} disabled={!editingNote.description?.trim()}>Update Note</Button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {taskNotesLoading && (
          <div className="text-center py-4">
            <Loading />
          </div>
        )}
        {taskNotes?.map(note => (
          <div key={note.id} className="p-4 border rounded-lg bg-card">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                {note.title && <p className="font-medium text-lg mb-1">{note.title}</p>}
               <p className="text-sm text-muted-foreground mb-2">
                   By: {note.createdByRole} | 
                   {note.recipientId && `To: Employee #${note.recipientId} |`} 
                   On: {formatDate(note.createdDate)} 
                 </p>
                <p className="text-base whitespace-pre-wrap">{note.description}</p>
              </div>
              {!isTechnicianPortal && (
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="outline" onClick={() => setEditingNote({ ...note })}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteNote(note.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotesSection;

//NOTES.