import { useParams, Link, useNavigate } from "react-router-dom";
import { Clock, Users, PlayCircle, FileText, CheckCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const { user, hasAccess } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").eq("id", courseId!).single();
      return data;
    },
    enabled: !!courseId,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["course-modules", courseId],
    queryFn: async () => {
      const { data } = await supabase.from("modules").select("*").eq("course_id", courseId!).order("sort_order");
      return data ?? [];
    },
    enabled: !!courseId,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["course-lessons", courseId],
    queryFn: async () => {
      const moduleIds = modules.map((m: any) => m.id);
      if (moduleIds.length === 0) return [];
      const { data } = await supabase.from("lessons").select("*").in("module_id", moduleIds).order("sort_order");
      return data ?? [];
    },
    enabled: modules.length > 0,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", user?.id, courseId],
    queryFn: async () => {
      const { data } = await supabase.from("enrollments").select("*").eq("user_id", user!.id).eq("course_id", courseId!).maybeSingle();
      return data;
    },
    enabled: !!user && !!courseId,
  });

  const enroll = useMutation({
    mutationFn: async () => {
      if (!user) { navigate("/login"); return; }
      const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: courseId! });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment"] });
      toast.success("Enrolled successfully!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!course) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-12">
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">{course.category}</span>
            <h1 className="text-3xl md:text-5xl font-bold mt-4 mb-4">{course.title}</h1>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">{course.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{modules.length} modules · {lessons.length} lessons</span>
            </div>
            {user && !hasAccess && (
              <div className="glass-card p-4 mb-6 border-destructive/30 bg-destructive/5 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Your free trial has expired. Please subscribe to continue learning.</span>
                </div>
                <Button variant="hero" size="sm" asChild><Link to="/subscribe">Subscribe Now</Link></Button>
              </div>
            )}
            {enrollment ? (
              <Button variant="hero" size="lg" disabled={!hasAccess} asChild={hasAccess}>
                {hasAccess ? <Link to={lessons[0] ? `/lesson/${lessons[0].id}` : "#"}>Continue Learning</Link> : <>Continue Learning</>}
              </Button>
            ) : (
              <Button variant="hero" size="lg" onClick={() => enroll.mutate()} disabled={user ? !hasAccess : false}>
                {user ? "Enroll Now" : "Sign In to Enroll"}
              </Button>
            )}
          </div>

          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Course Curriculum</h2>
            <div className="space-y-4">
              {modules.map((mod: any) => {
                const modLessons = lessons.filter((l: any) => l.module_id === mod.id);
                return (
                  <div key={mod.id} className="glass-card overflow-hidden">
                    <div className="p-5 border-b border-border">
                      <h3 className="font-semibold">{mod.title}</h3>
                    </div>
                    <div className="divide-y divide-border">
                      {modLessons.map((lesson: any) => {
                        const canAccess = enrollment && hasAccess;
                        return (
                          <div key={lesson.id} className={`flex items-center gap-3 p-4 ${canAccess ? "hover:bg-secondary/50 cursor-pointer" : "opacity-60"}`}
                            onClick={() => canAccess && navigate(`/lesson/${lesson.id}`)}>
                            {lesson.content_type === "video" ? <PlayCircle className="w-5 h-5 text-primary shrink-0" />
                              : lesson.content_type === "pdf" ? <FileText className="w-5 h-5 text-accent shrink-0" />
                              : <CheckCircle className="w-5 h-5 text-success shrink-0" />}
                            <span className="flex-1 text-sm">{lesson.title}</span>
                            {!canAccess && <Lock className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CourseDetailPage;
