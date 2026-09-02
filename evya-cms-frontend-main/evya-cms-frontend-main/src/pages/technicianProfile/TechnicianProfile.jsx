import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployeeById } from "../../store/reducers/employee/employeeSlice";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const TechnicianProfile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.authentication?.user);
  const { employee, loading, error } = useSelector(
    (state) => state.employee || {}
  );

  const [isEditing, setIsEditing] = useState(false);
  const [tech, setTech] = useState(null);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchEmployeeById(user.id));
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (employee) {
      setTech(employee);
    }
  }, [employee]);

  if (loading) return <p>Loading employee details...</p>;
if (error) {
  const errorMessage = typeof error === "string" ? error : error.message || "Something went wrong";
  return <p className="text-red-500">Error: {errorMessage}</p>;
}
  if (!employee) return <p>No employee found</p>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTech({ ...tech, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Updated Employee:", tech);
    setIsEditing(false);
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Employee Profile</h2>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        ) : null}
      </div>

      {/* VIEW MODE */}
      {!isEditing ? (
        <>
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Username</Label>
              <p>{tech?.username}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p>{tech?.email}</p>
            </div>
            <div>
              <Label>Designation</Label>
              <p>{tech?.designation}</p>
            </div>
            <div>
              <Label>Location</Label>
              <p>{tech?.location || "N/A"}</p>
            </div>
            <div>
              <Label>Mobile Number</Label>
              <p>{tech?.mobileNumber}</p>
            </div>
            <div>
              <Label>Status</Label>
              <p>{tech?.active ? "Active" : "Inactive"}</p>
            </div>
          </div>
        </>
      ) : (
        /* EDIT MODE */
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-lg font-semibold mb-4">
            Edit Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium">Username</label>
              <input
                type="text"
                name="username"
                value={tech?.username || ""}
                onChange={handleChange}
                className="w-full mt-1 border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={tech?.email || ""}
                onChange={handleChange}
                className="w-full mt-1 border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Designation</label>
              <input
                type="text"
                name="designation"
                value={tech?.designation || ""}
                onChange={handleChange}
                className="w-full mt-1 border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Location</label>
              <input
                type="text"
                name="location"
                value={tech?.location || ""}
                onChange={handleChange}
                className="w-full mt-1 border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Mobile Number</label>
              <input
                type="text"
                name="mobileNumber"
                value={tech?.mobileNumber || ""}
                onChange={handleChange}
                className="w-full mt-1 border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select
                name="active"
                value={tech?.active ? "true" : "false"}
                onChange={(e) =>
                  setTech({ ...tech, active: e.target.value === "true" })
                }
                className="w-full mt-1 border rounded-lg p-2"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-lg border border-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      )}
    </Card>
  );
};

export default TechnicianProfile;

