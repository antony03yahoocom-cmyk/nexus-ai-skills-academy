import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { BookOpen, Clock, Trophy, Bell, Lock, CreditCard, Crown } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const StudentDashboard = () => {
  const { user, profile, trialActive, trialDaysLeft, purchases, hasCourseAccess } = useAuth();

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

  const isPremium = profile?.is_premium;

  const stats = [
    { label: "Enrolled Courses", value: String(enrollments.length), icon: BookOpen, color: "text-primary" },
    { label: "Lessons Completed", value: String(completions.length), icon: Trophy, color: "text-accent" },
    {
      label: isPremium ? "Premium Access" : "Trial Days Left",
      value: isPremium ? "∞" : String(trialDaysLeft),
      icon: isPremium ? Crown : Clock,
      color: isPremium ? "text-primary" : "text-success",
    },
    { label: "Courses Purchased", value: String(purchases.length), icon: CreditCard, color: "text-success" },
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

          {/* Subscription banner */}
          {isPremium ? (
            <div className="glass-card p-4 mb-8 border-success/30 bg-success/5 flex items-center gap-4">
              <Crown className="w-5 h-5 text-success" />
              <span className="text-sm font-medium text-success">Premium Access Active — All courses unlocked</span>
            </div>
          ) : trialActive ? (
            <div className="glass-card p-4 mb-8 border-accent/30 bg-accent/5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <span className="text-sm font-medium text-accent">Free Trial Active</span>
                <p className="text-xs text-muted-foreground">{trialDaysLeft} days remaining · 1 course · First 7 lessons</p>
              </div>
              <Button variant="hero" size="sm" asChild>
                <Link to="/subscribe">Get Premium</Link>
              </Button>
            </div>
          ) : (
            <div className="glass-card p-4 mb-8 border-destructive/30 bg-destructive/5 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Trial Expired — Purchase courses or get Premium</span>
              </div>
              <Button variant="hero" size="sm" asChild>
                <Link to="/subscribe">Get Premium</Link>
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
              {enrollments.map((enrollment: any) => {
                const cId = enrollment.course_id;
                const hasAccess = hasCourseAccess(cId);
                const coursePurchased = purchases.some((p) => p.course_id === cId);

                return (
                  <div key={enrollment.id} className="glass-card overflow-hidden group hover:border-primary/30 transition-all">
                    <Link to={`/courses/${cId}`}>
                      <div className="h-28 bg-secondary flex items-center justify-center text-4xl relative">
                        📚
                        {!hasAccess && (
                          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors flex-1">
                            {enrollment.courses?.title ?? "Course"}
                          </h3>
                          {coursePurchased && <span className="text-xs text-success font-medium">Paid</span>}
                          {isPremium && <Crown className="w-3 h-3 text-primary" />}
                          {!hasAccess && trialActive && profile?.trial_course_id !== cId && (
                            <span className="text-xs text-muted-foreground">No access</span>
                          )}
                        </div>
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: `${enrollment.progress}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{enrollment.progress}% complete</p>
                        {enrollment.courses?.price > 0 && !hasAccess && (
                          <p className="text-xs text-primary font-medium mt-1">KES {enrollment.courses.price.toLocaleString()}</p>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
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
