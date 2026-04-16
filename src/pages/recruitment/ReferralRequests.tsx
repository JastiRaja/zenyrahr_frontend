import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Mail, Phone, User, Building, Briefcase, Search, RefreshCw, Users } from "lucide-react";
import api from "../../api/axios";

interface Recruitment {
  id: number;
  jobTitle: string;
  department: string;
  employmentType: string;
  salaryRange: string;
  location: string;
  experienceLevel: string;
  jobDescription: string;
  benefits: string;
  status: string;
  requirements: string;
}

interface Referral {
  id: number;
  candidateName: string;
  email: string;
  mobile: string;
  referredEmployeeId: string;
  referredEmployeeName: string;
  recruitment: Recruitment;
  employeeDepartment: string;
}

export default function ReferralRequests() {
  const { hasPermission } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/referrals`);
      setReferrals(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching referrals:", err);
      setError("Failed to load referral requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const filteredReferrals = referrals.filter((referral) => {
    const matchesSearch =
      referral.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.referredEmployeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.recruitment.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All Statuses" ||
      referral.recruitment.status === statusFilter;
    const matchesDepartment =
      departmentFilter === "All Departments" ||
      referral.recruitment.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const uniqueStatuses = [
    "All Statuses",
    ...new Set(referrals.map((item) => item.recruitment.status)),
  ];
  const uniqueDepartments = [
    "All Departments",
    ...new Set(referrals.map((item) => item.recruitment.department)),
  ];
  const totalReferrals = referrals.length;
  const uniqueReferrers = new Set(referrals.map((item) => item.referredEmployeeId)).size;
  const openRoles = referrals.filter((item) => item.recruitment.status === "OPEN").length;
  const interviewReady = referrals.filter((item) => item.recruitment.status === "IN_PROGRESS").length;
  const canManageRecruitment = hasPermission("read", "employees");
  const getStatusClass = (status: string) => {
    if (status === "OPEN") return "bg-emerald-50 text-emerald-700";
    if (status === "CLOSED") return "bg-rose-50 text-rose-700";
    if (status === "IN_PROGRESS") return "bg-amber-50 text-amber-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Referral Requests</h1>
              <p className="mt-1 text-sm text-sky-50">
                View and manage employee referrals for open positions.
              </p>
            </div>
            <button
              onClick={fetchReferrals}
              className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Total Referrals</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalReferrals}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Open Roles</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{openRoles}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Interview Ready</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{interviewReady}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Unique Referrers</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{uniqueReferrers}</p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="relative lg:col-span-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate, email, referrer, or job..."
                className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              {uniqueDepartments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex h-52 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-700 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm text-rose-700">{error}</p>
            <button
              onClick={fetchReferrals}
              className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Try Again
            </button>
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="py-14 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900">
              No referral requests found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting filters to see matching referrals.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredReferrals.map((referral) => (
              <div
                key={referral.id}
                className="rounded-md border border-slate-200 bg-white p-4 transition hover:shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {referral.candidateName}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Referred by: {referral.referredEmployeeName}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                      referral.recruitment.status
                    )}`}
                  >
                    {referral.recruitment.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm text-slate-600">
                  <div className="flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-slate-400" />
                    {referral.email}
                  </div>
                  <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-slate-400" />
                    {referral.mobile}
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-200 pt-3">
                  <h4 className="text-xs font-semibold uppercase text-slate-500">Job Details</h4>
                  <div className="mt-2 space-y-1.5 text-sm text-slate-600">
                    <div className="flex items-center">
                      <Briefcase className="mr-2 h-4 w-4 text-slate-400" />
                      {referral.recruitment.jobTitle}
                    </div>
                    <div className="flex items-center">
                      <Building className="mr-2 h-4 w-4 text-slate-400" />
                      {referral.recruitment.department}
                    </div>
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-slate-400" />
                      {referral.recruitment.experienceLevel}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  <button className="text-sm font-semibold text-sky-700 hover:text-sky-900">
                    View Details
                  </button>
                  {canManageRecruitment && (
                    <button className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">
                      Schedule Interview
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
} 