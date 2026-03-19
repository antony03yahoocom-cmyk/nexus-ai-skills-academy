import { BookOpen, Users, DollarSign, TrendingUp } from "lucide-react";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const { data: courses = [] } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*");
      return data ?? [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*");
      return data ?? [];
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["admin-enrollments"],
    queryFn: async () => {
      const { data } = await supabase.from("enrollments").select("*, courses(title), profiles:user_id(full_name, subscription_status)");
      return data ?? [];
    },
  });

  const paidCount = profiles.filter((p: any) => p.subscription_status === "paid").length;

  const stats = [
    { label: "Total Courses", value: String(courses.length), icon: BookOpen, color: "text-primary" },
    { label: "Total Students", value: String(profiles.length), icon: Users, color: "text-accent" },
    { label: "Paid Users", value: String(paidCount), icon: DollarSign, color: "text-success" },
    { label: "Enrollments", value: String(enrollments.length), icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-muted-foreground mb-8">Manage your academy.</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card p-5">
                <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold mb-4">Recent Students</h2>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Name</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {profiles.slice(0, 10).map((p: any) => (
                    <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4 text-sm font-medium">{p.full_name || "—"}</td>
                      <td className="p-4">
                        <Badge className={p.subscription_status === "paid" ? "bg-success/10 text-success border-success/20" : "bg-accent/10 text-accent border-accent/20"}>
                          {p.subscription_status === "paid" ? "Paid" : "Free Trial"}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
