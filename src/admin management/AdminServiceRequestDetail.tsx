import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  AlertCircle,
  Paperclip,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

interface ServiceRequest {
  id: number;
  title: string;
  description: string;
  priority: string;
  employee: { id: number; name: string };
  createdAt: string;
  documentUrls: string[];
}

export default function AdminServiceRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPermission("read", "service-tickets")) {
      navigate("/unauthorized");
      return;
    }

    const fetchServiceRequest = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/service-ticket/${id}`
        );
        setServiceRequest(response.data);
      } catch (error) {
        console.error("Error fetching service request:", error);
        setError("Failed to load service request.");
      } finally {
        setLoading(false);
      }
    };

    fetchServiceRequest();
  }, [hasPermission, navigate, id]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/admin/service-requests")}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Requests
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Service Request Details
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            Loading service request...
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
          {error}
        </div>
      ) : (
        serviceRequest && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Header Section */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Request #{serviceRequest.id}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                    serviceRequest.priority
                  )}`}
                >
                  {serviceRequest.priority}
                </span>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 space-y-6">
              {/* Issue Section */}
              <div className="space-y-2">
                <div className="flex items-center text-gray-500">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Issue</span>
                </div>
                <p className="text-gray-900 pl-7">{serviceRequest.title}</p>
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <div className="flex items-center text-gray-500">
                  <FileText className="h-5 w-5 mr-2" />
                  <span className="font-medium">Description</span>
                </div>
                <p className="text-gray-900 pl-7 whitespace-pre-wrap">
                  {serviceRequest.description}
                </p>
              </div>

              {/* Employee Section */}
              <div className="space-y-2">
                <div className="flex items-center text-gray-500">
                  <User className="h-5 w-5 mr-2" />
                  <span className="font-medium">Employee</span>
                </div>
                <p className="text-gray-900 pl-7">
                  {serviceRequest.employee.name}
                </p>
              </div>

              {/* Created At Section */}
              <div className="space-y-2">
                <div className="flex items-center text-gray-500">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span className="font-medium">Created At</span>
                </div>
                <p className="text-gray-900 pl-7">
                  {new Date(serviceRequest.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Attachments Section */}
              <div className="space-y-2">
                <div className="flex items-center text-gray-500">
                  <Paperclip className="h-5 w-5 mr-2" />
                  <span className="font-medium">Attachments</span>
                </div>
                <div className="pl-7">
                  {serviceRequest.documentUrls &&
                  serviceRequest.documentUrls.length > 0 ? (
                    <ul className="space-y-2">
                      {serviceRequest.documentUrls.map((url, index) => (
                        <li key={index}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex items-center text-indigo-600 hover:text-indigo-900"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {url.split("/").pop()}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No attachments available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
