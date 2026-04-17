import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Calendar, ArrowLeft } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";

type AssignedProject = {
  id: number;
  projectName: string;
  description?: string;
  startDate?: string;
  deadline?: string;
  status: string;
};

export default function MyProjects() {
  const { user, hasPermission } = useAuth();
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canSubmitTimesheet = hasPermission("submit", "timesheet");

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const response = await api.get<AssignedProject[]>(`/auth/employees/${user.id}/projects`);
        const rows = Array.isArray(response.data) ? response.data : [];
        setProjects(rows);
        setError(null);
      } catch {
        setError("Could not load your assigned projects. Try again later.");
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user?.id]);

  const active = projects.filter((p) => String(p.status || "").toUpperCase() === "ACTIVE");
  const completed = projects.filter((p) => String(p.status || "").toUpperCase() === "COMPLETED");

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-2 pb-8">
      <div>
        <Link
          to="/timesheet"
          className="mb-2 inline-flex items-center text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to My Timesheet
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <FolderKanban className="h-7 w-7 text-sky-600" aria-hidden />
          My projects
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Projects HR has assigned to you for time tracking and reporting.
        </p>
      </div>

      {loading && (
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
          Loading projects…
        </p>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
          You are not assigned to any projects yet. Ask HR or your manager to add you in{" "}
          <span className="font-semibold text-slate-800">Project Management</span>.
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-800">Active</h2>
              <ul className="space-y-3">
                {active.map((project) => (
                  <li
                    key={project.id}
                    className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm"
                  >
                    <ProjectCard project={project} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {completed.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Completed</h2>
              <ul className="space-y-3">
                {completed.map((project) => (
                  <li
                    key={project.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-90"
                  >
                    <ProjectCard project={project} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {!loading && projects.length > 0 && canSubmitTimesheet && (
        <p className="text-center text-sm text-slate-500">
          <Link to="/timesheet/submit" className="font-semibold text-sky-700 hover:text-sky-900">
            Submit time
          </Link>{" "}
          against these projects.
        </p>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: AssignedProject }) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{project.projectName}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            String(project.status).toUpperCase() === "ACTIVE"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {project.status}
        </span>
      </div>
      {project.description ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{project.description}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        {project.startDate && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            Start {project.startDate}
          </span>
        )}
        {project.deadline && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            Deadline {project.deadline}
          </span>
        )}
      </div>
    </div>
  );
}
