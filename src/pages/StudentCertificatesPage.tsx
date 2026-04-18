import { useAuth } from "@/contexts/AuthContext";
import DashboardTopNav from "@/components/dashboard/DashboardTopNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Award, Download, Loader2, Lock, CheckCircle } from "lucide-react";
import { useState } from "react";

const StudentCertificatesPage = () => {
  const { user } = useAuth();
  const [generating, setGenerating] = useState<string | null>(null);

  const { data: certificates = [], refetch } = useQuery({
    queryKey: ["my-certificates", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("certificates")
        .select("*, courses(title)")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["my-enrollments-certs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("enrollments")
        .select("*, courses(id, title)")
        .eq("user_id", user!.id)
        .order("enrolled_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  // For each enrolled course, get total lessons and completed lessons count
  const { data: lessonCounts = {} } = useQuery({
    queryKey: ["cert-lesson-counts", user?.id],
    queryFn: async () => {
      if (enrollments.length === 0) return {};
      const courseIds = enrollments.map((e: any) => e.course_id);

      // Get all modules for these courses
      const { data: modules } = await supabase
        .from("modules")
        .select("id, course_id")
        .in("course_id", courseIds);

      if (!modules?.length) return {};

      const moduleIds = modules.map((m: any) => m.id);

      // Get all lessons
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, module_id")
        .in("module_id", moduleIds);

      // Get user completions
      const { data: completions } = await supabase
        .from("lesson_completions")
        .select("lesson_id")
        .eq("user_id", user!.id);

      const completedSet = new Set(completions?.map((c: any) => c.lesson_id) ?? []);

      // Build map: course_id → { total, completed }
      const moduleMap: Record<string, string> = {};
      modules.forEach((m: any) => { moduleMap[m.id] = m.course_id; });

      const counts: Record<string, { total: number; completed: number }> = {};
      courseIds.forEach((id: string) => { counts[id] = { total: 0, completed: 0 }; });

      lessons?.forEach((l: any) => {
        const cId = moduleMap[l.module_id];
        if (cId && counts[cId]) {
          counts[cId].total++;
          if (completedSet.has(l.id)) counts[cId].completed++;
        }
      });

      return counts;
    },
    enabled: !!user && enrollments.length > 0,
  });

  const requestCertificate = async (courseId: string) => {
    setGenerating(courseId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-certificate", {
        body: { course_id: courseId },
      });

      if (error) {
        // Extract the real message from the edge function response
        let msg = "Failed to generate certificate";
        try {
          const parsed = typeof error.context === "string"
            ? JSON.parse(error.context)
            : error.context;
          msg = parsed?.error || parsed?.message || error.message || msg;
        } catch {
          msg = error.message || msg;
        }
        toast.error(msg);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success("🎓 Certificate generated successfully!");
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to generate certificate");
    } finally {
      setGenerating(null);
    }
  };

  const hasCert = (courseId: string) =>
    certificates.some((c: any) => c.course_id === courseId && c.status === "Issued");

  return (
    <div className="min-h-screen bg-background">
      <DashboardTopNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-1">My Certificates</h1>
        <p className="text-muted-foreground mb-8">
          Complete 100% of all lessons in a course to earn your certificate.
        </p>

        {/* ── Earned certificates ── */}
        {certificates.length > 0 && (
          <div className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Award className="w-5 h-5 text-success" /> Earned Certificates
            </h2>
            {certificates.map((cert: any) => (
              <div
                key={cert.id}
                className="glass-card p-5 flex items-center justify-between flex-wrap gap-4 border-success/20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{(cert as any).courses?.title ?? "Course"}</h3>
                    <p className="text-sm text-muted-foreground">
                      Issued: {new Date(cert.issued_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      ID: {cert.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className="bg-success/10 text-success border-success/20">
                    <CheckCircle className="w-3 h-3 mr-1" /> {cert.status}
                  </Badge>
                  {cert.certificate_link ? (
                    <Button size="sm" variant="outline" asChild>
                      <a href={cert.certificate_link} target="_blank" rel="noreferrer">
                        <Download className="w-4 h-4 mr-1" /> Download
                      </a>
                    </Button>
                  ) : (
                    <Badge className="bg-secondary text-muted-foreground text-xs">
                      No download link — contact admin
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Request certificate section ── */}
        <h2 className="text-xl font-bold mb-2">Request Certificate</h2>
        <p className="text-sm text-muted-foreground mb-5">
          You must complete all lessons to unlock the certificate for each course.
        </p>

        <div className="space-y-4">
          {enrollments.map((e: any) => {
            const already = hasCert(e.course_id);
            const counts = (lessonCounts as any)[e.course_id] ?? { total: 0, completed: 0 };
            // Use the live lesson count if available; fall back to enrollment.progress
            const prog = counts.total > 0
              ? Math.round((counts.completed / counts.total) * 100)
              : (e.progress ?? 0);
            const isComplete = counts.total > 0
              ? counts.completed >= counts.total
              : prog >= 100;
            const noLessons = counts.total === 0;

            return (
              <div key={e.id} className="glass-card p-5">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">
                      {(e as any).courses?.title ?? "Course"}
                    </h3>
                    {counts.total > 0 && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {counts.completed} of {counts.total} lessons completed
                      </p>
                    )}
                    <div className="flex items-center gap-2 max-w-xs">
                      <Progress value={prog} className="h-2 flex-1 bg-secondary" />
                      <span className={`text-xs font-semibold shrink-0 ${isComplete ? "text-success" : "text-muted-foreground"}`}>
                        {prog}%
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {already ? (
                      <Badge className="bg-success/10 text-success border-success/20">
                        <Award className="w-3 h-3 mr-1" /> Earned
                      </Badge>
                    ) : isComplete || noLessons ? (
                      <Button
                        size="sm"
                        variant="hero"
                        disabled={generating === e.course_id}
                        onClick={() => requestCertificate(e.course_id)}
                      >
                        {generating === e.course_id ? (
                          <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Generating...</>
                        ) : (
                          <><Award className="w-4 h-4 mr-1" /> Get Certificate</>
                        )}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="w-3.5 h-3.5" />
                        <span>{prog}% — complete all lessons first</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {enrollments.length === 0 && certificates.length === 0 && (
            <div className="glass-card p-10 text-center">
              <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-semibold text-muted-foreground mb-1">No courses yet</p>
              <p className="text-sm text-muted-foreground">
                Enroll in courses, complete all lessons, and earn your certificates.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentCertificatesPage;
