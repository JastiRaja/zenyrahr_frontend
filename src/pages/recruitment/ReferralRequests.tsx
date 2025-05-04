import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import { Mail, Phone, User, Building, Briefcase } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

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
  const { user, hasPermission } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/referrals`);
        setReferrals(response.data);
      } catch (err) {
        console.error("Error fetching referrals:", err);
        setError("Failed to load referral requests");
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Referral Requests</h1>
          <p className="mt-2 text-lg text-gray-600">
            View and manage employee referrals
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {referrals.map((referral) => (
          <div
            key={referral.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {referral.candidateName}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Referred by: {referral.referredEmployeeName}
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {referral.recruitment.status}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  {referral.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {referral.mobile}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-900">Job Details</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                    {referral.recruitment.jobTitle}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="h-4 w-4 mr-2 text-gray-400" />
                    {referral.recruitment.department}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    {referral.recruitment.experienceLevel}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-3">
                <button className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-900">
                  View Details
                </button>
                <button className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-900">
                  Schedule Interview
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 