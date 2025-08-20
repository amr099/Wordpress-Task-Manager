import Navigation from "@/components/Navigation";
import MemberDashboard from "@/components/MemberDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import { useAuthContext } from "@/components/AuthProvider";

export default function Dashboard() {
  const { isAdmin } = useAuthContext();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isAdmin ? <AdminDashboard /> : <MemberDashboard />}
      </div>
    </div>
  );
}
