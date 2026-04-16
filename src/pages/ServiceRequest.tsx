import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";

export default function ServiceRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "",
    attachments: [] as File[],
  });
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      console.error("User ID is missing.");
      setMessage("User ID is missing.");
      return;
    }

    const formPayload = new FormData();

    // Construct JSON string for serviceTicket
    const serviceTicket = JSON.stringify({
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      employee: { id: user.id },
    });

    // Append JSON string as a single field
    formPayload.append("serviceticket", serviceTicket);

    // Append files
    formData.attachments.forEach((file) => {
      formPayload.append("files", file);
    });

    try {
      const response = await api.post(`/api/service-ticket`, formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("Service request submitted successfully.");
      navigate("/self-service");
    } catch (error) {
      console.error(
        "Error submitting service request:",
        (error as any)?.response?.data || (error as any)?.message || error
      );
      setMessage("Error submitting service request. Please try again later.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (files) {
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...Array.from(files)],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 rounded-lg ">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Request</h1>
          <p className="mt-2 text-lg text-gray-600">
            Submit a new service request
          </p>
        </div>
        <button
          onClick={() => navigate("/self-service")}
          className="btn-secondary px-4 py-2 text-sm"
        >
          Back
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes("successfully")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg space-y-4"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Issue
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Priority
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            required
          >
            <option value="" disabled>
              Select priority
            </option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Attachments (optional)
          </label>
          <input
            type="file"
            name="attachments"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            multiple
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/self-service")}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary px-4 py-2 text-sm">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
