import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Trash2, Save } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext"; // ✅ Get logged-in user

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

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

  // ✅ Fetch Projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/projects`);
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
        alert("Error: User not found. Please log in.");
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
        await axios.put(
          `${API_BASE_URL}/api/timesheet/${editingEntry.id}`,
          payload[0]
        );
      } else {
        for (const timesheet of payload) {
          await axios.post(`${API_BASE_URL}/api/timesheet`, timesheet);
        }
      }

      alert(
        editingEntry?.id
          ? "Timesheet updated successfully!"
          : "Timesheet submitted successfully!"
      );
      navigate("/timesheet");
    } catch (error) {
      console.error("❌ Error submitting timesheet:", error);
      alert("Failed to submit timesheet");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900">
        {editingEntry?.id ? "Edit Timesheet" : "Submit Timesheet"}
      </h1>
      <form onSubmit={handleSubmit}>
        {entries.map((entry, index) => (
          <div key={entry.code || index} className="flex flex-col gap-4 border-b border-gray-200 pb-4">
            <div className="grid grid-cols-2 gap-4">
              {/* ✅ Date Input */}
              <div>
                <label>Date</label>
                <input
                  type="date"
                  value={entry.date}
                  onChange={(e) =>
                    handleEntryChange(index, "date", e.target.value)
                  }
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>

              {/* ✅ Project Selection */}
              <div>
                <label>Project</label>
                <select
                  value={entry.projectId}
                  onChange={(e) =>
                    handleEntryChange(index, "projectId", e.target.value)
                  }
                  className="w-full border rounded-md p-2"
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

              {/* ✅ Hours Worked (Fixed Input Lag) */}
              <div>
                <label>Hours Worked</label>
                <input
                  type="number"
                  value={entry.hoursWorked}
                  onChange={(e) =>
                    handleEntryChange(index, "hoursWorked", e.target.value)
                  }
                  placeholder="Enter hours worked"
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>

              {/* ✅ Task Description (Fixed Input Lag) */}
              <div className="col-span-2">
                <label>Task Description</label>
                <textarea
                  value={entry.taskDescription}
                  onChange={(e) =>
                    handleEntryChange(index, "taskDescription", e.target.value)
                  }
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>

              {/* ✅ Comments (Fixed Input Lag) */}
              <div className="col-span-2">
                <label>Comments</label>
                <textarea
                  value={entry.comments}
                  onChange={(e) =>
                    handleEntryChange(index, "comments", e.target.value)
                  }
                  className="w-full border rounded-md p-2"
                />
              </div>
            </div>

            {/* ✅ Remove Entry Button */}
            {entries.length > 1 && (
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="bg-red-500 text-white px-4 py-2 rounded-md"
                >
                  <Trash2 className="inline-block mr-1" /> Remove
                </button>
              </div>
            )}
          </div>
        ))}

        {/* ✅ Add & Submit Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={addEntry}
            className="bg-green-500 text-white px-4 py-2 rounded-md"
          >
            <Plus className="inline-block mr-1" /> Add Entry
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            <Save className="inline-block mr-1" />{" "}
            {editingEntry?.id ? "Update Timesheet" : "Submit Timesheet"}
          </button>
        </div>
      </form>
    </div>
  );
}
