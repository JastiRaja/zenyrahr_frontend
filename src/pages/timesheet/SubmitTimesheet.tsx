import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Trash2, Save } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext"; // ✅ Get logged-in user
import CommonDialog from "../../components/CommonDialog";
import api from "../../api/axios";

export default function SubmitTimesheet() {
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ Get logged-in user
  const location = useLocation();

  // ✅ Check if editing an existing entry
  const editingEntry = location.state?.entry || null;

  interface Project {
    id: number;
    projectName: string;
  }

  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState([
    {
      id: editingEntry?.id || null,
      date: editingEntry?.date || "",
      hoursWorked: editingEntry?.hoursWorked || "",
      taskDescription: editingEntry?.taskDescription || "",
      comments: editingEntry?.comments || "",
      projectId: editingEntry?.project?.id || "",
      status: editingEntry?.status || "PENDING",
    },
  ]);
  const [messageDialog, setMessageDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    tone: "success" | "error";
    redirectOnClose: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    tone: "success",
    redirectOnClose: false,
  });

  // ✅ Fetch Projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get(`/api/projects`);
        setProjects(response.data);
      } catch (error) {
        console.error("❌ Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  // ✅ Handle Field Changes Properly
  const handleEntryChange = (
    index: number,
    field: keyof (typeof entries)[0],
    value: string
  ) => {
    setEntries((prevEntries) =>
      prevEntries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  // ✅ Add New Entry Row
  const addEntry = () => {
    setEntries((prevEntries) => [
      ...prevEntries,
      {
        id: null,
        code: generateUniqueCode(),
        date: "",
        hoursWorked: "",
        taskDescription: "",
        comments: "",
        projectId: "",
        status: "PENDING",
      },
    ]);
  };

  // ✅ Remove Entry
  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  // ✅ Generate a unique code for each timesheet entry
  const generateUniqueCode = () => {
    return `TM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  // ✅ Submit Timesheet (Create or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.id) {
        setMessageDialog({
          isOpen: true,
          title: "Submission Failed",
          message: "Error: User not found. Please log in.",
          tone: "error",
          redirectOnClose: false,
        });
        return;
      }

      const payload = entries.map((entry) => ({
        code: generateUniqueCode(),
        date: entry.date,
        hoursWorked: entry.hoursWorked,
        description: entry.taskDescription,
        requiredComments: entry.comments,
        employeeId: user.id,
        project: { id: parseInt(entry.projectId, 10) },
        status: entry.status,
      }));

      // console.log("Submitting payload:", JSON.stringify(payload, null, 2));

      if (editingEntry?.id) {
        await api.put(
          `/api/timesheet/${editingEntry.id}`,
          payload[0]
        );
      } else {
        for (const timesheet of payload) {
          await api.post(`/api/timesheet`, timesheet);
        }
      }

      setMessageDialog({
        isOpen: true,
        title: editingEntry?.id ? "Timesheet Updated" : "Timesheet Submitted",
        message: editingEntry?.id
          ? "Timesheet updated successfully!"
          : "Timesheet submitted successfully!",
        tone: "success",
        redirectOnClose: true,
      });
    } catch (error) {
      console.error("❌ Error submitting timesheet:", error);
      setMessageDialog({
        isOpen: true,
        title: "Submission Failed",
        message: "Failed to submit timesheet",
        tone: "error",
        redirectOnClose: false,
      });
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">
            {editingEntry?.id ? "Edit Timesheet" : "Submit Timesheet"}
          </h1>
          <p className="mt-1 text-sm text-sky-50">
            Add your daily work entries with project hours and task notes.
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Entry Rows</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{entries.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Projects Loaded</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{projects.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Mode</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {editingEntry?.id ? "Edit" : "Create"}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Status</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {editingEntry?.status || "PENDING"}
            </p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4">
        {entries.map((entry, index) => (
          <div
            key={entry.code || index}
            className="rounded-md border border-slate-300 bg-white p-4 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Date
                </label>
                <input
                  type="date"
                  value={entry.date}
                  onChange={(e) =>
                    handleEntryChange(index, "date", e.target.value)
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Project
                </label>
                <select
                  value={entry.projectId}
                  onChange={(e) =>
                    handleEntryChange(index, "projectId", e.target.value)
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Hours Worked
                </label>
                <input
                  type="number"
                  value={entry.hoursWorked}
                  onChange={(e) =>
                    handleEntryChange(index, "hoursWorked", e.target.value)
                  }
                  placeholder="Enter hours worked"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Task Description
                </label>
                <textarea
                  value={entry.taskDescription}
                  onChange={(e) =>
                    handleEntryChange(index, "taskDescription", e.target.value)
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  rows={3}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Comments
                </label>
                <textarea
                  value={entry.comments}
                  onChange={(e) =>
                    handleEntryChange(index, "comments", e.target.value)
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  rows={2}
                />
              </div>
            </div>

            {entries.length > 1 && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="inline-flex items-center rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  <Trash2 className="inline-block mr-1" /> Remove
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={addEntry}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Plus className="inline-block mr-1" /> Add Entry
          </button>
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
          >
            <Save className="inline-block mr-1" />{" "}
            {editingEntry?.id ? "Update Timesheet" : "Submit Timesheet"}
          </button>
        </div>
      </form>

      <CommonDialog
        isOpen={messageDialog.isOpen}
        title={messageDialog.title}
        message={messageDialog.message}
        tone={messageDialog.tone}
        confirmText="OK"
        hideCancel
        onClose={() => {
          const shouldRedirect = messageDialog.redirectOnClose;
          setMessageDialog({
            isOpen: false,
            title: "",
            message: "",
            tone: "success",
            redirectOnClose: false,
          });
          if (shouldRedirect) navigate("/timesheet");
        }}
      />
    </div>
  );
}
