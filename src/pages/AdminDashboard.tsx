import { BookOpen, Users, DollarSign, TrendingUp } from "lucide-react";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Total Courses", value: "12", icon: BookOpen, color: "text-primary" },
  { label: "Enrolled Students", value: "3,420", icon: Users, color: "text-accent" },
  { label: "Revenue", value: "$12,840", icon: DollarSign, color: "text-success" },
  { label: "Growth", value: "+18%", icon: TrendingUp, color: "text-primary" },
];

const recentStudents = [
  { name: "Sarah Chen", email: "sarah@example.com", course: "AI Bootcamp", status: "Paid" },
  { name: "Marcus Johnson", email: "marcus@example.com", course: "Web Dev", status: "Trial" },
  { name: "Aisha Patel", email: "aisha@example.com", course: "Data Analysis", status: "Paid" },
  { name: "David Kim", email: "david@example.com", course: "Python", status: "Expired" },
];

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your academy.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card p-5">
                <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Recent students */}
          <h2 className="text-xl font-bold mb-4">Recent Enrollments</h2>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Student</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Course</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentStudents.map((student) => (
                    <tr key={student.email} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{student.course}</td>
                      <td className="p-4">
                        <Badge
                          variant={student.status === "Paid" ? "default" : student.status === "Trial" ? "secondary" : "destructive"}
                          className={
                            student.status === "Paid"
                              ? "bg-success/10 text-success border-success/20"
                              : student.status === "Trial"
                              ? "bg-accent/10 text-accent border-accent/20"
                              : ""
                          }
                        >
                          {student.status}
                        </Badge>
                      </td>
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
