import { useState, useEffect } from "react";
import axios from "axios";
import { Pencil, Save, Plus, Trash, X, Check } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

interface LeaveType {
  id: number;
  name: string;
  defaultBalance: number;
}

export default function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [newLeaveType, setNewLeaveType] = useState<string>("");
  const [defaultBalance, setDefaultBalance] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Edit Mode
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedLeaveType, setEditedLeaveType] = useState<string>("");
  const [editedDefaultBalance, setEditedDefaultBalance] = useState<number>(0);

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  // **Fetch Leave Types**
  const fetchLeaveTypes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API_BASE_URL}/api/leave-types`);
      setLeaveTypes(response.data);
    } catch (err) {
      console.error("❌ Error fetching leave types:", err);
      setError("Failed to load leave types. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // **Add Leave Type**
  const addLeaveType = async () => {
    if (!newLeaveType.trim() || defaultBalance <= 0) {
      setError("Please enter a valid leave type name and default balance.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/leave-types`,
        { name: newLeaveType, defaultBalance },
        { headers: { "Content-Type": "application/json" } }
      );

      setLeaveTypes([...leaveTypes, response.data]);
      setNewLeaveType("");
      setDefaultBalance(0);
    } catch (err) {
      console.error("❌ Error adding leave type:", err);
      setError("Failed to add leave type. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // **Enable Edit Mode**
  const startEditing = (type: LeaveType) => {
    setEditingId(type.id);
    setEditedLeaveType(type.name);
    setEditedDefaultBalance(type.defaultBalance);
  };

  // **Save Edited Leave Type**
  const saveEditedLeaveType = async (id: number) => {
    if (!editedLeaveType.trim() || editedDefaultBalance <= 0) {
      setError("Please enter a valid leave type name and default balance.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/leave-types/${id}`,
        { name: editedLeaveType, defaultBalance: editedDefaultBalance },
        { headers: { "Content-Type": "application/json" } }
      );

      setLeaveTypes(
        leaveTypes.map((type) => (type.id === id ? response.data : type))
      );

      setEditingId(null);
    } catch (err) {
      console.error("❌ Error updating leave type:", err);
      setError("Failed to update leave type. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // **Delete Leave Type**
  const deleteLeaveType = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this leave type?"))
      return;

    setLoading(true);
    setError("");
    try {
      await axios.delete(`${API_BASE_URL}/api/leave-types/${id}`);
      setLeaveTypes(leaveTypes.filter((type) => type.id !== id));
    } catch (err) {
      console.error("❌ Error deleting leave type:", err);
      setError("Failed to delete leave type. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Manage Leave Types
      </h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Add Leave Type Form */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Add New Leave Type</h2>
        <div className="grid grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Leave Type Name"
            value={newLeaveType}
            onChange={(e) => setNewLeaveType(e.target.value)}
            className="input-search"
            disabled={loading}
          />
          <input
            type="number"
            placeholder="Default Balance (Days)"
            value={defaultBalance}
            onChange={(e) => setDefaultBalance(Number(e.target.value))}
            className="input-search"
            disabled={loading}
          />
          <button
            onClick={addLeaveType}
            className="btn-primary flex items-center"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" /> Add Leave Type
              </>
            )}
          </button>
        </div>
      </div>

      {/* Leave Types List */}
      <div className="card bg-white shadow-md rounded-lg">
        <div className="p-4 border-b border-gray-200 flex justify-between">
          <h2 className="text-lg font-semibold">Existing Leave Types</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : leaveTypes.length === 0 ? (
            <p className="p-6 text-gray-500">No leave types available.</p>
          ) : (
            leaveTypes.map((type) => (
              <div
                key={type.id}
                className="p-6 flex justify-between items-center"
              >
                {editingId === type.id ? (
                  // **Edit Mode**
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editedLeaveType}
                      onChange={(e) => setEditedLeaveType(e.target.value)}
                      className="input-search"
                      disabled={loading}
                    />
                    <input
                      type="number"
                      value={editedDefaultBalance}
                      onChange={(e) =>
                        setEditedDefaultBalance(Number(e.target.value))
                      }
                      className="input-search"
                      disabled={loading}
                    />
                    <button
                      onClick={() => saveEditedLeaveType(type.id)}
                      className="p-2 rounded-full shadow-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      disabled={loading}
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 rounded-full shadow-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      disabled={loading}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  // **Normal Display Mode**
                  <div className="flex justify-between items-center w-full">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {type.name} - {type.defaultBalance} days
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(type)}
                        className="p-2 rounded-full shadow-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        disabled={loading}
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => deleteLeaveType(type.id)}
                        className="p-2 rounded-full shadow-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        disabled={loading}
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
