import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="auth-shell">
      <div className="w-full max-w-md rounded-3xl border border-white bg-white/90 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <ShieldOff className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          Access Denied
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          You don't have permission to access this page
        </p>
        <div className="mt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary inline-flex items-center"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}