import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LeaveSummary from "./LeaveSummary"; // ✅ Import Leave Summary
import api from "../../api/axios";
import LoadingButton from "../../components/LoadingButton";

interface LeaveType {
  id: number;
  name: string;
}

export default function RequestLeave() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    proofs: [] as File[], // Stores selected files
  });

  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const response = await api.get(`/api/leave-types`);
        setLeaveTypes(response.data);
      } catch (err) {
        console.error("❌ Error fetching leave types:", err);
      }
    };

    fetchLeaveTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!user?.id) {
      console.error("❌ Employee ID is missing.");
      setMessage("User ID is missing.");
      return;
    }

    const formDataPayload = new FormData();

    // ✅ Construct JSON for leave request
    const leaveRequest = JSON.stringify({
      employee: { id: user.id },
      leaveType: { id: formData.leaveType },
      startDate: formData.startDate,
      endDate: formData.endDate,
      comments: formData.reason,
    });

    formDataPayload.append("leaveRequest", leaveRequest); // ✅ Attach JSON as a key

    // ✅ Append files to the form data
    formData.proofs.forEach((file) => {
      formDataPayload.append("files", file);
    });

    // ✅ Debugging: Log FormData before sending
    for (const [key, value] of formDataPayload.entries()) {
      // console.log(`${key}:`, value);
    }

    try {
      setIsSubmitting(true);
      // ✅ Submit leave request with file uploads
      const response = await api.post(
        `/api/leave-requests`,
        formDataPayload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // console.log("✅ Leave request submitted:", response.data);
      setMessage("Leave request submitted successfully.");
      navigate("/leave"); // Redirect on success
    } catch (error) {
      console.error(
        "❌ Error submitting leave request:",
        (error as any)?.response?.data || (error as any)?.message || error
      );
      setMessage("Error submitting leave request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;

    if (files) {
      setFormData((prev) => ({
        ...prev,
        proofs: Array.from(files), // Replace existing proofs with new selection
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Request Leave</h1>
              <p className="mt-1 text-sm text-sky-50">
                Submit your leave request with date range and supporting documents.
              </p>
            </div>
            <button
              onClick={() => navigate("/leave")}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
            >
              Back
            </button>
          </div>
        </div>
      </section>

      <LeaveSummary />

      {message && (
        <div
          className={`rounded-md border p-4 text-sm ${
            message.includes("successfully")
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-md border border-slate-300 bg-white p-4 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
            Leave Type
          </label>
          <select
            name="leaveType"
            value={formData.leaveType}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            required
          >
            <option value="">Select Leave Type</option>
            {leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
            Reason
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            placeholder="Enter reason..."
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
            Attachments (optional)
          </label>
          <input
            type="file"
            name="proofs"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            multiple
          />
          {formData.proofs.length > 0 && (
            <ul className="mt-2 text-sm text-gray-600">
              {formData.proofs.map((file, index) => (
                <li key={index} className="truncate">
                  {file.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/leave")}
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
            Submit
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
