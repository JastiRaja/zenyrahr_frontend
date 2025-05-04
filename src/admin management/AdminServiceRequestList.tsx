import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

interface ServiceRequest {
  id: number;
  title: string;
  description: string;
  priority: string;
  employee: { id: number; name: string };
  createdAt: string;
}

export default function AdminServiceRequestList() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPermission("read", "service-tickets")) {
      navigate("/unauthorized");
      return;
    }

    const fetchServiceRequests = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/service-ticket`, {
          headers: {
            "Access-Control-Allow-Origin": "http://localhost:5173",
          },
        });

        console.log("Service Requests:", response.data); // Debugging line
        setServiceRequests(response.data);
      } catch (error) {
        console.error("Error fetching service requests:", error);
        setError("Failed to load service requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchServiceRequests();
  }, [hasPermission, navigate]);

  // Sort service requests by createdAt in descending order
  const sortedServiceRequests = serviceRequests.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
        <button
          onClick={() => navigate("/admin")}
          className="btn-secondary px-4 py-2 text-sm"
        >
          Back
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">
          Loading service requests...
        </div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedServiceRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.title}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis"
                    style={{ maxWidth: "200px", wordWrap: "break-word" }}
                  >
                    {request.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.priority}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.employee.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(request.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() =>
                        navigate(`/admin/service-request/${request.id}`)
                      }
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
