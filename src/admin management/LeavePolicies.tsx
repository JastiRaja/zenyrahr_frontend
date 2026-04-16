import { useState, useEffect } from "react";
import { Pencil, Save } from "lucide-react";
import api from "../api/axios";

interface LeavePolicy {
  id: number;
  name: string;
  description: string;
  accrual: string;
  maxCarryForward: number;
  approvalRequired: boolean;
}

const LeavePolicies = () => {
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicy[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [updatedPolicy, setUpdatedPolicy] = useState<Partial<LeavePolicy>>({});

  useEffect(() => {
    fetchLeavePolicies();
  }, []);

  // Fetch Leave Policies from API
  const fetchLeavePolicies = async () => {
    try {
      const response = await api.get(`/api/leave-policies`);

      setLeavePolicies(response.data);
    } catch (err) {
      console.error("Error fetching leave policies:", err);
    }
  };

  // Handle Edit
  const handleEdit = (policy: LeavePolicy) => {
    setEditingId(policy.id);
    setUpdatedPolicy(policy);
  };

  // Handle Save
  const handleSave = async (id: number) => {
    try {
      await api.put(
        `/api/leave-policies/${id}`,
        updatedPolicy
      );

      setEditingId(null);
      fetchLeavePolicies();
    } catch (err) {
      console.error("Error updating policy:", err);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h2 className="text-3xl font-bold tracking-tight">Company Leave Policies</h2>
          <p className="mt-1 text-sm text-sky-50">Manage and update leave policy configuration.</p>
        </div>
        <div className="grid grid-cols-1 divide-y divide-slate-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Policies</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{leavePolicies.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Approval Required</p>
            <p className="mt-1 text-xl font-bold text-amber-700">
              {leavePolicies.filter((policy) => policy.approvalRequired).length}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">No Approval</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">
              {leavePolicies.filter((policy) => !policy.approvalRequired).length}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        {leavePolicies.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">No leave policies available.</p>
        ) : (
          leavePolicies.map((policy) => (
            <div
              key={policy.id}
              className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-4"
            >
              {editingId === policy.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={updatedPolicy.name || ""}
                    onChange={(e) =>
                      setUpdatedPolicy({
                        ...updatedPolicy,
                        name: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  />
                  <textarea
                    value={updatedPolicy.description || ""}
                    onChange={(e) =>
                      setUpdatedPolicy({
                        ...updatedPolicy,
                        description: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={updatedPolicy.maxCarryForward || ""}
                      onChange={(e) =>
                        setUpdatedPolicy({
                          ...updatedPolicy,
                          maxCarryForward: Number(e.target.value),
                        })
                      }
                      className="w-1/2 rounded-md border border-slate-300 p-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                      placeholder="Max Carry Forward"
                    />
                    <select
                      value={updatedPolicy.approvalRequired ? "true" : "false"}
                      onChange={(e) =>
                        setUpdatedPolicy({
                          ...updatedPolicy,
                          approvalRequired: e.target.value === "true",
                        })
                      }
                      className="w-1/2 rounded-md border border-slate-300 p-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                    >
                      <option value="true">Approval Required</option>
                      <option value="false">No Approval Required</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleSave(policy.id)}
                    className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <Save className="inline-block w-4 h-4 mr-2" /> Save
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{policy.name}</h3>
                  <p className="text-sm text-slate-600">{policy.description}</p>
                  <p className="text-sm text-slate-500">
                    <strong>Accrual:</strong> {policy.accrual} |{" "}
                    <strong>Max Carry Forward:</strong> {policy.maxCarryForward}{" "}
                    days
                  </p>
                  <p className="text-sm text-slate-500">
                    <strong>Approval:</strong>{" "}
                    {policy.approvalRequired ? "Required" : "Not Required"}
                  </p>
                  <button
                    onClick={() => handleEdit(policy)}
                    className="mt-2 inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-slate-50"
                  >
                    <Pencil className="inline-block w-4 h-4 mr-2" /> Edit
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default LeavePolicies;
