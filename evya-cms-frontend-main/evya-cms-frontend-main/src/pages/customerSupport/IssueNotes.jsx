import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchEmployeesByDesignation } from "@/store/reducers/employee/employeeSlice";
import { addIssueNote } from "@/store/reducers/issues/issuesSlice";

export default function IssueNotes() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const issue = location.state?.issue;
  const user = useSelector((state) => state.authentication.user);
  const employees = useSelector((state) => state.employee.employees);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [issueId, setIssueId] = useState(issue?.id || "");
  const [saving, setSaving] = useState(false);
  const [createdByRole, setCreatedByRole] = useState(
    user?.roleId === 1 ? "ADMIN" : "EMPLOYEE"
  );

  useEffect(() => {
    dispatch(fetchEmployeesByDesignation("Customer Support"));
  }, [dispatch]);

const handleAddNote = async (e) => {
  e.preventDefault();

  if (!noteTitle || !noteDescription || !recipientId) {
    alert("Please fill all required fields!");
    return;
  }

  if (!taskId && !issueId) {
    alert("Please select either a Task or an Issue");
    return;
  }

  setSaving(true);
  try {
    const payload = {
      employeeId: user.id,
      recipientId: Number(recipientId),
      taskId: taskId ? Number(taskId) : null,
      issueId: issueId ? Number(issueId) : null,
      title: noteTitle,
      description: noteDescription,
      createdByRole: createdByRole.toUpperCase(),
    };

    await dispatch(addIssueNote(payload));

    // Reset form
    setNoteTitle("");
    setNoteDescription("");
    setRecipientId("");
    setTaskId("");
    setIssueId(issue?.id || "");

    console.log("Note added successfully");

    navigate(`/customer-support/issue-details/${issue.id}`, {
      state: {
        issue: issue,
        activeTab: "notes",
        from: "/customer-support/issue-notes",
      },
    });
  } catch (err) {
    console.error("Failed to add note:", err);
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="space-y-4">
        <Button
  variant="outline"
  className="flex items-center gap-2 mb-4"
  onClick={() => {
    if (issue?.id) {
      navigate(`/customer-support/issue-details/${issue.id}`, {
        state: {
          issue: issue,
          activeTab: "notes",
          from: "/customer-support/issue-notes",
        },
      });
    } else {
      navigate("/customer-support/issue-list");
    }
  }}
>
  Back
</Button>
      <form
        onSubmit={handleAddNote}
        className="space-y-3 pt-4 "
      >
        <input
          type="text"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          placeholder="Note title"
          className="w-full rounded border px-3 py-2"
          required
        />
        <textarea
          value={noteDescription}
          onChange={(e) => setNoteDescription(e.target.value)}
          placeholder="Note description"
          className="w-full rounded border px-3 py-2"
          rows={3}
          required
        />
        <select
          value={recipientId || ""}
          onChange={(e) => setRecipientId(e.target.value)}
          className="w-full rounded border px-3 py-2"
          required
        >
          <option value="">Select recipient</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.username}
            </option>
          ))}
        </select>
        <select
          value={createdByRole}
          onChange={(e) => setCreatedByRole(e.target.value)}
          className="w-full rounded border px-3 py-2"
          required
        >
          <option value="ADMIN">ADMIN</option>
          <option value="EMPLOYEE">EMPLOYEE</option>
        </select>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Add"}
        </Button>
      </form>
    </div>
  );
}