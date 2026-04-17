import { useAuth } from "@/contexts/AuthContext";
import DashboardTopNav from "@/components/dashboard/DashboardTopNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Award, Download, Loader2, Lock } from "lucide-react";
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
        .eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const requestCertificate = async (courseId: string) => {
    setGenerating(courseId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-certificate", {
        body: { course_id: courseId },
      });

      if (error) {
        // ✅ FIX: Try to extract the real error message from the edge function response
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
          Complete all lessons in a course to earn your certificate.
        </p>

        {/* Earned certificates */}
        {certificates.length > 0 && (
          <div className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">Earned Certificates</h2>
            {certificates.map((cert: any) => (
              <div key={cert.id} className="glass-card p-5 flex items-center justify-between flex-wrap gap-4 border-success/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
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
                <div className="flex items-center gap-3">
                  <Badge className="bg-success/10 text-success border-success/20">{cert.status}</Badge>
                  {cert.certificate_link ? (
                    <Button size="sm" variant="outline" asChild>
                      <a href={cert.certificate_link} target="_blank" rel="noreferrer">
                        <Download className="w-4 h-4 mr-1" /> Download
                      </a>
                    </Button>
                  ) : (
                    <Badge className="bg-secondary text-muted-foreground text-xs">Processing…</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Request certificate section */}
        <h2 className="text-xl font-bold mb-2">Request Certificate</h2>
        <p className="text-sm text-muted-foreground mb-5">
          You must complete 100% of all lessons to request a certificate.
        </p>
        <div className="space-y-4">
          {enrollments.map((e: any) => {
            const already = hasCert(e.course_id);
            const prog = e.progress ?? 0;
            const isComplete = prog >= 100;

            return (
              <div key={e.id} className="glass-card p-5">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">
                      {(e as any).courses?.title ?? "Course"}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Progress value={prog} className="h-2 flex-1 bg-secondary max-w-xs" />
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
                    ) : isComplete ? (
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
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="w-3 h-3" /> Complete all lessons first
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
                Enroll in courses and complete all lessons to earn certificates.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentCertificatesPage;
