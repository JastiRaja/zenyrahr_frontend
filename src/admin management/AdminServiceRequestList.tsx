import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, Search, Eye } from "lucide-react";
import api from "../api/axios";

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
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!hasPermission("read", "service-tickets")) {
      navigate("/unauthorized");
      return;
    }

    const fetchServiceRequests = async () => {
      try {
        const response = await api.get(`/api/service-ticket`);

        // console.log("Service Requests:", response.data); // Debugging line
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
  const sortedServiceRequests = [...serviceRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const filteredServiceRequests = sortedServiceRequests.filter((request) => {
    const issue = request.title?.toLowerCase() || "";
    const description = request.description?.toLowerCase() || "";
    const employee = request.employee?.name?.toLowerCase() || "";
    const searchValue = searchTerm.toLowerCase();
    return (
      issue.includes(searchValue) ||
      description.includes(searchValue) ||
      employee.includes(searchValue) ||
      String(request.id).includes(searchValue)
    );
  });
  const highPriorityCount = filteredServiceRequests.filter(
    (request) => request.priority?.toLowerCase() === "high"
  ).length;
  const mediumPriorityCount = filteredServiceRequests.filter(
    (request) => request.priority?.toLowerCase() === "medium"
  ).length;
  const lowPriorityCount = filteredServiceRequests.filter(
    (request) => request.priority?.toLowerCase() === "low"
  ).length;
  const getPriorityClass = (priority: string) => {
    const normalized = priority?.toLowerCase();
    if (normalized === "high") return "bg-rose-50 text-rose-700";
    if (normalized === "medium") return "bg-amber-50 text-amber-700";
    if (normalized === "low") return "bg-emerald-50 text-emerald-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Service Requests</h1>
              <p className="mt-1 text-sm text-sky-50">
                Review and manage employee support requests.
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center rounded-md border border-white/70 bg-transparent px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Total Requests</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{filteredServiceRequests.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">High Priority</p>
            <p className="mt-1 text-xl font-bold text-rose-700">{highPriorityCount}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Medium Priority</p>
            <p className="mt-1 text-xl font-bold text-amber-700">{mediumPriorityCount}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Low Priority</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{lowPriorityCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by id, issue, employee, description..."
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </section>

      {loading ? (
        <div className="rounded-md border border-slate-300 bg-white py-10 text-center text-sm text-slate-500 shadow-sm">
          Loading service requests...
        </div>
      ) : error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  ID
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Issue
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Priority
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Employee
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created At
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredServiceRequests.map((request) => (
                <tr key={request.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                    {request.id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                    {request.title}
                  </td>
                  <td
                    className="max-w-xs overflow-hidden px-4 py-3 text-sm text-slate-700 text-ellipsis"
                    style={{ maxWidth: "200px", wordWrap: "break-word" }}
                  >
                    {request.description}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getPriorityClass(request.priority)}`}>
                      {request.priority}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                    {request.employee.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                    {new Date(request.createdAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                    <button
                      onClick={() =>
                        navigate(`/admin/service-request/${request.id}`)
                      }
                      className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredServiceRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                    No service requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </section>
      )}
    </div>
  );
}
