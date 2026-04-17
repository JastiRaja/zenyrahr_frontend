import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, FileText, Trash2, MapPin, Briefcase } from "react-feather";
import { Plane } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext"; // Import the useAuth hook
import api from "../../api/axios";
import LoadingButton from "../../components/LoadingButton";

export default function NewTripRequest() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // Use the useAuth hook to get the user and authentication status
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    destination: "",
    purpose: "",
    startDate: "",
    endDate: "",
    budget: "",
    description: "",
    transportation: "",
    accommodation: "",
    documents: [] as File[], // Track multiple files
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const uploadedFiles = Array.from(e.target.files); // Convert FileList to Array
      setFormData((prevState) => ({
        ...prevState,
        documents: [...prevState.documents, ...uploadedFiles], // Add new files to existing ones
      }));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFormData((prevState) => ({
      ...prevState,
      documents: prevState.documents.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!isAuthenticated || !user) {
      return;
    }

    try {
      setIsSubmitting(true);
      const formDataToSend = new FormData();

      const travelRequestPayload = {
        destination: formData.destination,
        purpose: formData.purpose,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: parseFloat(formData.budget),
        description: formData.description,
        transportation: formData.transportation,
        accommodation: formData.accommodation,
        employee: { id: user.id },
        status: "PENDING",
        firstLevelApprovalStatus: "PENDING",
        secondLevelApprovalStatus: "PENDING"
      };

      // Create a Blob with the correct MIME type
      const jsonBlob = new Blob([JSON.stringify(travelRequestPayload)], {
        type: 'application/json'
      });
      formDataToSend.append("travelRequest", jsonBlob);

      // Only append files if they exist
      if (formData.documents && formData.documents.length > 0) {
        formData.documents.forEach((file) => {
          formDataToSend.append("files", file);
        });
      }

      // Append the allowed category for backend
      formDataToSend.append('category', 'travel_requests');

      await api.post("/api/travel-requests", formDataToSend);

      navigate("/travel");
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      destination: "",
      purpose: "",
      startDate: "",
      endDate: "",
      budget: "",
      description: "",
      transportation: "",
      accommodation: "",
      documents: [],
    });
    navigate("/travel");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">New Trip Request</h1>
          <p className="mt-1 text-sm text-sky-50">
            Submit a new business travel request.
          </p>
        </div>
        <div className="grid grid-cols-1 divide-y divide-slate-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Destination</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formData.destination || "Not selected"}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Estimated Budget</p>
            <p className="mt-1 text-lg font-semibold text-sky-700">
              ₹{formData.budget || "0"}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Documents</p>
            <p className="mt-1 text-lg font-semibold text-indigo-700">
              {formData.documents.length}
            </p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Trip Information */}
        <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Trip Details
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Destination */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Destination <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="City, Country"
                  required
                />
              </div>
            </div>

            {/* Purpose of Travel */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Purpose of Travel <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  type="text"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="e.g., Client Meeting, Conference"
                  required
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Transportation */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Transportation <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Plane className="h-5 w-5 text-purple-400" />
                </div>
                <select
                  name="transportation"
                  value={formData.transportation}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  required
                >
                  <option value="">Select Transportation</option>
                  <option value="flight">Flight</option>
                  <option value="train">Train</option>
                  <option value="car">Car</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Estimated Budget */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Estimated Budget <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="h-5 w-5 text-purple-400">₹</span>
                </div>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="Enter amount"
                  required
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Additional Details
              </label>
              <div className="mt-1">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="Any additional information about your trip..."
                />
              </div>
            </div>

            {/* Supporting Documents */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Supporting Documents (Optional)
              </label>
              <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-sky-200 px-6 pb-6 pt-5 transition-colors duration-300 hover:border-sky-300">
                <div className="space-y-1 text-center">
                    <FileText className="mx-auto h-12 w-12 text-sky-400" />
                  <div className="flex text-sm text-slate-600">
                    <label className="relative cursor-pointer rounded-md bg-white font-medium text-sky-700 hover:text-sky-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2">
                      <span>Upload files</span>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="sr-only"
                        multiple
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-500">PDF, DOC up to 10MB</p>
                </div>
              </div>
            </div>

            {/* Files List with Remove Button */}
            {formData.documents.length > 0 && (
              <div className="sm:col-span-2">
                <h4 className="text-sm font-medium text-slate-700">
                  Uploaded Files
                </h4>
                <ul className="mt-2 space-y-2 text-sm text-slate-700">
                  {formData.documents.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-slate-100 px-4 py-2 rounded-xl"
                    >
                      <span className="truncate text-sm">{file.name}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-slate-500">
                          ({(file.size / 1024).toFixed(2)} KB)
                        </span>
                        {/* Remove File Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-rose-600 hover:text-rose-800"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <LoadingButton
            type="submit"
            loading={isSubmitting}
            loadingText="Submitting..."
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Submit Request
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
