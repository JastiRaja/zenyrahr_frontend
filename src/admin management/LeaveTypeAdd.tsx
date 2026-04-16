import { useState, useEffect } from "react";
import { Pencil, Plus, Trash, X, Check } from "lucide-react";
import CommonDialog from "../components/CommonDialog";
import api from "../api/axios";

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
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  // **Fetch Leave Types**
  const fetchLeaveTypes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/api/leave-types`);
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
      const response = await api.post(
        `/api/leave-types`,
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
      const response = await api.put(
        `/api/leave-types/${id}`,
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
    setLoading(true);
    setError("");
    try {
      await api.delete(`/api/leave-types/${id}`);
      setLeaveTypes(leaveTypes.filter((type) => type.id !== id));
    } catch (err) {
      console.error("❌ Error deleting leave type:", err);
      setError("Failed to delete leave type. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Manage Leave Types</h1>
          <p className="mt-1 text-sm text-sky-50">Add, update, and remove leave categories.</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white sm:grid-cols-3 sm:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Leave Types</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{leaveTypes.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Edit Mode</p>
            <p className="mt-1 text-xl font-bold text-sky-700">{editingId ? "On" : "Off"}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Loading</p>
            <p className="mt-1 text-xl font-bold text-indigo-700">{loading ? "Yes" : "No"}</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Add New Leave Type</h2>
        <div className="grid grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Leave Type Name"
            value={newLeaveType}
            onChange={(e) => setNewLeaveType(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            disabled={loading}
          />
          <input
            type="number"
            placeholder="Default Balance (Days)"
            value={defaultBalance}
            onChange={(e) => setDefaultBalance(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={addLeaveType}
            className="inline-flex items-center rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
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
      </section>

      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="flex justify-between border-b border-slate-200 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Existing Leave Types</h2>
        </div>

        <div className="divide-y divide-slate-200">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : leaveTypes.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No leave types available.</p>
          ) : (
            leaveTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-4"
              >
                {editingId === type.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editedLeaveType}
                      onChange={(e) => setEditedLeaveType(e.target.value)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                      disabled={loading}
                    />
                    <input
                      type="number"
                      value={editedDefaultBalance}
                      onChange={(e) =>
                        setEditedDefaultBalance(Number(e.target.value))
                      }
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
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
                  <div className="flex justify-between items-center w-full">
                    <h3 className="text-sm font-semibold text-slate-900">
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
                        onClick={() => setDeleteTargetId(type.id)}
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
      </section>

      <CommonDialog
        isOpen={deleteTargetId !== null}
        title="Delete Leave Type"
        message="Are you sure you want to delete this leave type?"
        tone="error"
        confirmText="Delete"
        onConfirm={() => {
          if (deleteTargetId !== null) {
            deleteLeaveType(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
