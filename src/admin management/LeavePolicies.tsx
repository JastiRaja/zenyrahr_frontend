import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pencil, Save } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

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
      const response = await axios.get(`${API_BASE_URL}/api/leave-policies`);

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
      await axios.put(
        `${API_BASE_URL}/api/leave-policies/${id}`,
        updatedPolicy
      );

      setEditingId(null);
      fetchLeavePolicies();
    } catch (err) {
      console.error("Error updating policy:", err);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800">
        Company Leave Policies
      </h2>
      <p className="mt-2 text-gray-600">
        Manage and update company leave policies.
      </p>

      <div className="mt-6">
        {leavePolicies.length === 0 ? (
          <p className="text-gray-500">No leave policies available.</p>
        ) : (
          leavePolicies.map((policy) => (
            <div
              key={policy.id}
              className="p-4 border rounded-md mb-4 bg-gray-50"
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
                    className="border p-2 w-full rounded"
                  />
                  <textarea
                    value={updatedPolicy.description || ""}
                    onChange={(e) =>
                      setUpdatedPolicy({
                        ...updatedPolicy,
                        description: e.target.value,
                      })
                    }
                    className="border p-2 w-full rounded"
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
                      className="border p-2 rounded w-1/2"
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
                      className="border p-2 rounded w-1/2"
                    >
                      <option value="true">Approval Required</option>
                      <option value="false">No Approval Required</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleSave(policy.id)}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                  >
                    <Save className="inline-block w-4 h-4 mr-2" /> Save
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold">{policy.name}</h3>
                  <p className="text-gray-600">{policy.description}</p>
                  <p className="text-gray-500">
                    <strong>Accrual:</strong> {policy.accrual} |{" "}
                    <strong>Max Carry Forward:</strong> {policy.maxCarryForward}{" "}
                    days
                  </p>
                  <p className="text-gray-500">
                    <strong>Approval:</strong>{" "}
                    {policy.approvalRequired ? "Required" : "Not Required"}
                  </p>
                  <button
                    onClick={() => handleEdit(policy)}
                    className="text-blue-500 hover:underline"
                  >
                    <Pencil className="inline-block w-4 h-4 mr-2" /> Edit
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeavePolicies;
