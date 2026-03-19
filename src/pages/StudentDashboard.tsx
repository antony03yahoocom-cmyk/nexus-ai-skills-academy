import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { BookOpen, Clock, Trophy, TrendingUp, Bell, Lock } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const StudentDashboard = () => {
  const { user, profile, hasAccess, trialDaysLeft } = useAuth();

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("enrollments")
        .select("*, courses(*)")
        .eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: completions = [] } = useQuery({
    queryKey: ["completions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lesson_completions")
        .select("*")
        .eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!user,
  });

  const stats = [
    { label: "Enrolled Courses", value: String(enrollments.length), icon: BookOpen, color: "text-primary" },
    { label: "Lessons Completed", value: String(completions.length), icon: Trophy, color: "text-accent" },
    { label: "Trial Days Left", value: profile?.subscription_status === "paid" ? "∞" : String(trialDaysLeft), icon: Clock, color: "text-success" },
    { label: "Announcements", value: String(announcements.length), icon: Bell, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-1">Welcome back, {profile?.full_name || "Student"}! 👋</h1>
            <p className="text-muted-foreground">Continue where you left off.</p>
          </div>

          {/* Trial / subscription banner */}
          {profile?.subscription_status === "paid" ? (
            <div className="glass-card p-4 mb-8 border-success/30 bg-success/5 flex items-center gap-4">
              <span className="text-sm font-medium text-success">✓ Premium Access Active</span>
            </div>
          ) : hasAccess ? (
            <div className="glass-card p-4 mb-8 border-accent/30 bg-accent/5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <span className="text-sm font-medium text-accent">Free Trial Active</span>
                <p className="text-xs text-muted-foreground">{trialDaysLeft} days remaining</p>
              </div>
              <Button variant="hero" size="sm" asChild>
                <Link to="/subscribe">Subscribe Now</Link>
              </Button>
            </div>
          ) : (
            <div className="glass-card p-4 mb-8 border-destructive/30 bg-destructive/5 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Trial Expired — Subscribe to continue</span>
              </div>
              <Button variant="hero" size="sm" asChild>
                <Link to="/subscribe">Subscribe Now</Link>
              </Button>
            </div>
          )}

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

          {/* Enrolled Courses */}
          <h2 className="text-xl font-bold mb-4">My Courses</h2>
          {enrollments.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet.</p>
              <Button variant="hero" asChild><Link to="/courses">Browse Courses</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrollments.map((enrollment: any) => (
                <Link key={enrollment.id} to={`/courses/${enrollment.course_id}`} className="glass-card overflow-hidden group hover:border-primary/30 transition-all">
                  <div className="h-28 bg-secondary flex items-center justify-center text-4xl">📚</div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-3 group-hover:text-primary transition-colors">
                      {enrollment.courses?.title ?? "Course"}
                    </h3>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: `${enrollment.progress}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{enrollment.progress}% complete</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Announcements */}
          {announcements.length > 0 && (
            <>
              <h2 className="text-xl font-bold mb-4 mt-8">Announcements</h2>
              <div className="space-y-3">
                {announcements.map((a: any) => (
                  <div key={a.id} className="glass-card p-4">
                    <h3 className="font-semibold text-sm">{a.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{a.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
