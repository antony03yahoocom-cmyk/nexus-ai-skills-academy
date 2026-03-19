import { BookOpen, Clock, Trophy, TrendingUp } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Link } from "react-router-dom";

const enrolledCourses = [
  { id: "1", title: "Complete AI & Machine Learning Bootcamp", progress: 45, lessons: 48, image: "🤖" },
  { id: "2", title: "Full-Stack Web Development Masterclass", progress: 20, lessons: 62, image: "🌐" },
  { id: "5", title: "Advanced Python Programming", progress: 72, lessons: 42, image: "🐍" },
];

const stats = [
  { label: "Enrolled Courses", value: "3", icon: BookOpen, color: "text-primary" },
  { label: "Hours Learned", value: "24", icon: Clock, color: "text-accent" },
  { label: "Completed", value: "1", icon: Trophy, color: "text-success" },
  { label: "Streak", value: "7 days", icon: TrendingUp, color: "text-primary" },
];

const StudentDashboard = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-1">Welcome back! 👋</h1>
            <p className="text-muted-foreground">Continue where you left off.</p>
          </div>

          {/* Trial banner */}
          <div className="glass-card p-4 mb-8 border-success/30 bg-success/5 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-sm font-medium text-success">Free Trial Active</span>
              <p className="text-xs text-muted-foreground">23 days remaining · Unlock all courses</p>
            </div>
            <Link to="/dashboard/settings" className="text-sm text-primary hover:underline">Manage subscription →</Link>
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

          {/* Courses */}
          <h2 className="text-xl font-bold mb-4">My Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.map((course) => (
              <Link key={course.id} to={`/courses/${course.id}`} className="glass-card overflow-hidden group hover:border-primary/30 transition-all">
                <div className="h-28 bg-secondary flex items-center justify-center text-4xl">
                  {course.image}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-3 group-hover:text-primary transition-colors">{course.title}</h3>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{course.progress}% complete</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
