import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateIssue } from '@/store/reducers/issues/issuesSlice';
import { ReloadIcon, ArrowLeftIcon, PlusIcon, TrashIcon, Pencil1Icon } from "@radix-ui/react-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AxiosServices from '@/services/AxiosServices';
import { useToast } from "@/components/ui/use-toast";
import Loading from '@/users/Loading';
import { fetchEmployeesByDesignation } from '@/store/reducers/employee/employeeSlice';

export default function EditIssuePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useSelector(state => state.authentication);

  const [issue, setIssue] = useState();
  const [isLoading, setIsLoading] = useState(!location.state?.issue);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(issue?.status || 'open');
  //added sukanya
  const [selectedPriority, setSelectedPriority] = useState(issue?.priority || 'medium');
  const [assignedTo, setAssignedTo] = useState(issue?.assignedTo || '');
  const [comment, setComment] = useState(issue?.comment || '');

  // Notes state
  const [notes, setNotes] = useState(issue?.notes || []);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editedNoteText, setEditedNoteText] = useState('');
  const [editedNoteTitle, setEditedNoteTitle] = useState('');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [assignedToId, setAssignedToId] = useState(issue?.assignedTo || null);
  const [activeTab, setActiveTab] = useState("details");

  const { employees: allEmployees, loading: employeesLoading } = useSelector(state => state.employee);
  const customerSupport = allEmployees.filter(
  emp => emp.designation?.toLowerCase().includes('customer support')
);

  // Load issue data if not passed via location state
 const fetchIssueById = async () => {
  try {
    setIsLoading(true);
    const response = await AxiosServices.getIssueById(id);
    console.log(response);
    setIssue(response.data);
    setSelectedStatus(response.data.status);
    setAssignedToId(response.data.employeeId || '');
    setComment(response.data.comment || '');
    setNotes(response.data.notes || []);
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to fetch issue details",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};
useEffect(() => {
  fetchIssueById();
}, [id]);

useEffect(() => {
dispatch(fetchEmployeesByDesignation('Customer Support'));
}, [dispatch]);

// Removed issue from dependencies to prevent infinite loop

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading/>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800">Issue not found</h2>
          <Button 
            onClick={() => navigate('/issues-tracker')} 
            className="mt-4"
            variant="outline"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Issues
          </Button>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {

     if (!assignedToId) {
    toast({
      title: "Validation Error",
      description: "Please select Assigned To",
      variant: "destructive",
    });
    return;
  }

    const updatedIssue = { 
      ...issue, 
      status: selectedStatus,
      priority: selectedPriority,
      employeeId: assignedToId,
      comment,
      notes
    };
    setButtonLoading(true);
    try {
      await dispatch(updateIssue(updatedIssue, issue.id));
      toast({
        title: "Success",
        description: "Issue updated successfully",
      });
      navigate('/issues-tracker');
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update issue",
        variant: "destructive",
      });
    } finally {
      setButtonLoading(false);
    }
  };

const getPriorityBadgeClass = (priority) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 border border-red-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
    case 'low':
      return 'bg-green-100 text-green-700 border border-green-300';
    default:
      return '';
  }
};

  // Notes CRUD operations
  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      setIsLoadingNotes(true);
      const noteData = {
        title: `Note ${notes.length + 1}`,
        notes: newNote,
        createdBy: user?.id
      };

      const response = await AxiosServices.addNoteToTicket(issue.id, noteData);
      setNotes(prev => [...prev, response.data]);
      setNewNote('');
      setActiveTab("notes"); 
      toast({
        title: "Success",
        description: "Note added successfully",
      });
      fetchIssueById()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add note",
        variant: "destructive",
      });
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const startEditingNote = (note) => {
    setEditingNoteId(note.id);
    setEditedNoteText(note.notes);
    setEditedNoteTitle(note.title);
  };

const updateNote = async () => {
  if (!editedNoteText.trim() || !editedNoteTitle.trim()) return;

  try {
    setIsLoadingNotes(true);

    const updatedNote = {
      title: editedNoteTitle,
      notes: editedNoteText,
      lastModifiedBy: "ADMIN"
    };

    await AxiosServices.updateIssueNote(issue.id, editingNoteId, updatedNote);

    toast({
      title: "Success",
      description: "Note updated successfully",
    });

    fetchIssueById();
    cancelEditing();

  } catch (error) {
    toast({
      title: "Error",
      description: error.message || "Failed to update note",
      variant: "destructive",
    });
  } finally {
    setIsLoadingNotes(false);
  }
};

const deleteNote = async (noteId) => {
  try {
    setIsLoadingNotes(true);

    await AxiosServices.deleteIssueNote(issue.id, noteId);

    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));

    toast({
      title: "Success",
      description: "Note deleted successfully",
    });

    fetchIssueById();

  } catch (error) {
    toast({
      title: "Error",
      description: error.message || "Failed to delete note",
      variant: "destructive",
    });
  } finally {
    setIsLoadingNotes(false);
  }
};

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditedNoteText('');
    setEditedNoteTitle('');
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'open': return 'destructive';
      case 'inprogress': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'outline';
    }
  };

  const formatStatus = (status) => {
    return status.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/issues-tracker')} className="mr-2">
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Issue</h1>
        <Badge variant="secondary" className="ml-4">{issue.ticketId}</Badge>
      </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Issue Details</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Issue Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Status</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="inprogress">Inprogress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="me-1">Current Status</Label>
                    <Badge variant={getStatusBadge(issue.status)} className="mt-1">
                      {formatStatus(issue.status)}
                    </Badge>
                  </div>
                  <div>
                  <Label>Priority</Label>
                  <Select
                    value={selectedPriority}
                    onValueChange={setSelectedPriority}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                <Label className="me-1">Current Priority</Label>
              <Badge
                className={`mt-1 capitalize ${getPriorityBadgeClass(issue.priority)}`}
              >
                {issue.priority}
              </Badge>
              </div>
                  <div>
                    <Label>Assigned To</Label>
                    <Select
                      value={assignedToId?.toString() || ""}
                      onValueChange={(value) => setAssignedToId(Number(value))}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {customerSupport.map(emp => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.username} ({emp.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Category</Label>
                    <Input value={issue.category} disabled />
                  </div>
                  <div>
                    <Label>Created Date</Label>
                    <Input value={formatDate(issue.createdDate)} disabled />
                  </div>
                  <div>
                    <Label>Contact Email</Label>
                    <Input value={issue.email} disabled />
                  </div>
                  <div>
                    <Label>Mobile Number</Label>
                    <Input value={issue.mobileNumber} disabled />
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={issue.issue} readOnly />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    className="min-h-[100px]"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    readOnly
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <Button variant="outline" className="w-32" onClick={() => navigate('/issues-tracker')}>Cancel</Button>
                <Button onClick={handleSave} disabled={buttonLoading} className="w-32">
                  {buttonLoading ? (
                    <>
                      <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Issue Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a new note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    disabled={isLoadingNotes}
                  />
                  <Button 
                    onClick={addNote} 
                    disabled={!newNote.trim() || isLoadingNotes}
                  >
                    {isLoadingNotes ? (
                      <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      // <PlusIcon className="mr-2 h-4 w-4" />
                      null
                    )}
                    Submit Note
                  </Button>
                </div>

                      {isLoadingNotes && (!notes || notes.length === 0) ? (
          <div className="flex justify-center py-8">
            <ReloadIcon className="h-6 w-6 animate-spin" />
          </div>
        ) : Array.isArray(notes) && notes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Modified Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notes.map((note) => note && note.id ?(
                        <TableRow key={note.id}>
                          <TableCell>
                            {editingNoteId === note.id ? (
                              <Input
                                value={editedNoteTitle}
                                onChange={(e) => setEditedNoteTitle(e.target.value)}
                                disabled={isLoadingNotes}
                              />
                            ) : (
                              note.title
                            )}
                          </TableCell>
                          <TableCell>
                            {editingNoteId === note.id ? (
                              <Textarea
                                value={editedNoteText}
                                onChange={(e) => setEditedNoteText(e.target.value)}
                                disabled={isLoadingNotes}
                              />
                            ) : (
                              note.notes
                            )}
                          </TableCell>
                          <TableCell>{formatDate(note.modifiedDate)}</TableCell>
                          <TableCell>
                            {editingNoteId === note.id ? (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={updateNote}
                                  variant="outline"
                                  disabled={isLoadingNotes || !editedNoteText.trim() || !editedNoteTitle.trim()}
                                >
                                  {isLoadingNotes ? (
                                    <ReloadIcon className="h-4 w-4 animate-spin" />
                                  ) : 'Save'}
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={cancelEditing}
                                  variant="outline"
                                  disabled={isLoadingNotes}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => startEditingNote(note)}
                                  disabled={isLoadingNotes}
                                >
                                  <Pencil1Icon className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => deleteNote(note.id)}
                                  disabled={isLoadingNotes}
                                >
                                  <TrashIcon className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ):null)}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No notes added yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}