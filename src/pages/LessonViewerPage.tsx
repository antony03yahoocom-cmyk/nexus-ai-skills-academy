import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PlayCircle, FileText, CheckCircle, Lock, Image, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const LessonViewerPage = () => {
  const { lessonId } = useParams();
  const { user, profile, isAdmin, hasCourseAccess, canAccessLesson, trialActive, trialDaysLeft } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [submissionText, setSubmissionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: lesson } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => {
      const { data } = await supabase.from("lessons").select("*, modules(*, courses(*))").eq("id", lessonId!).single();
      return data;
    },
    enabled: !!lessonId,
  });

  const courseId = (lesson as any)?.modules?.course_id;
  const course = (lesson as any)?.modules?.courses;

  // All lessons in course (flat, ordered)
  const { data: allCourseLessons = [] } = useQuery({
    queryKey: ["all-course-lessons", courseId],
    queryFn: async () => {
      const { data: mods } = await supabase.from("modules").select("id").eq("course_id", courseId!).order("sort_order");
      if (!mods?.length) return [];
      const { data } = await supabase.from("lessons").select("*").in("module_id", mods.map((m: any) => m.id)).order("sort_order");
      return data ?? [];
    },
    enabled: !!courseId,
  });

  const { data: moduleLessons = [] } = useQuery({
    queryKey: ["module-lessons", lesson?.module_id],
    queryFn: async () => {
      const { data } = await supabase.from("lessons").select("*").eq("module_id", lesson!.module_id).order("sort_order");
      return data ?? [];
    },
    enabled: !!lesson?.module_id,
  });

  const { data: allCompletions = [] } = useQuery({
    queryKey: ["all-completions", user?.id, courseId],
    queryFn: async () => {
      const ids = allCourseLessons.map((l: any) => l.id);
      if (!ids.length) return [];
      const { data } = await supabase.from("lesson_completions").select("lesson_id").eq("user_id", user!.id).in("lesson_id", ids);
      return data?.map((c: any) => c.lesson_id) ?? [];
    },
    enabled: !!user && allCourseLessons.length > 0,
  });

  const currentCompletion = allCompletions.includes(lessonId!);

  const { data: assignments = [] } = useQuery({
    queryKey: ["lesson-assignments", lessonId],
    queryFn: async () => {
      const { data } = await supabase.from("assignments").select("*").eq("lesson_id", lessonId!);
      return data ?? [];
    },
    enabled: !!lessonId,
  });

  const markComplete = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lesson_completions").insert({ user_id: user!.id, lesson_id: lessonId! });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-completions"] });
      queryClient.invalidateQueries({ queryKey: ["completion"] });
      toast.success("Lesson marked as complete!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const submitAssignment = async (assignmentId: string) => {
    setSubmitting(true);
    const fileInput = document.getElementById("submission-file") as HTMLInputElement;
    let fileUrl: string | null = null;

    if (fileInput?.files?.[0]) {
      const file = fileInput.files[0];
      const path = `${user!.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("submissions").upload(path, file);
      if (error) { toast.error("Upload failed"); setSubmitting(false); return; }
      const { data } = supabase.storage.from("submissions").getPublicUrl(path);
      fileUrl = data.publicUrl;
    }

    const { error } = await supabase.from("submissions").insert({
      assignment_id: assignmentId,
      user_id: user!.id,
      text_submission: submissionText || null,
      file_url: fileUrl,
    });

    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success("Assignment submitted!"); setSubmissionText(""); }
  };

  // Determine access
  const globalIndex = useMemo(() => {
    return allCourseLessons.findIndex((l: any) => l.id === lessonId);
  }, [allCourseLessons, lessonId]);

  const hasAccess = useMemo(() => {
    if (!courseId || !user) return false;
    if (isAdmin) return true;
    // Check course-level access
    if (!hasCourseAccess(courseId)) return false;
    // Check lesson-level (trial limit)
    if (!canAccessLesson(courseId, globalIndex)) return false;
    // Sequential: previous lesson must be completed (or first lesson)
    if (globalIndex === 0) return true;
    const prevLessonId = allCourseLessons[globalIndex - 1]?.id;
    return allCompletions.includes(prevLessonId);
  }, [courseId, user, isAdmin, hasCourseAccess, canAccessLesson, globalIndex, allCourseLessons, allCompletions]);

  if (!lesson) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;

  if (!hasAccess && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Lesson Locked</h2>
          <p className="text-muted-foreground mb-4">
            {globalIndex > 0 && !allCompletions.includes(allCourseLessons[globalIndex - 1]?.id)
              ? "Complete the previous lesson first to unlock this one."
              : trialActive && globalIndex >= 7
              ? "This lesson is beyond the trial limit. Purchase the course for full access."
              : "Purchase this course or get Premium to access this lesson."}
          </p>
          <div className="flex flex-col gap-2">
            {courseId && (
              <Button variant="hero" asChild>
                <Link to={`/courses/${courseId}`}>Back to Course</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to="/subscribe">Get Premium</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Find next lesson
  const nextLesson = globalIndex >= 0 && globalIndex < allCourseLessons.length - 1
    ? allCourseLessons[globalIndex + 1]
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <div className="flex-1 lg:w-3/4">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Link to={courseId ? `/courses/${courseId}` : "/courses"} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold truncate">{lesson.title}</h1>
          {currentCompletion && <span className="text-xs text-success ml-auto">✓ Completed</span>}
        </div>

        {/* Content area */}
        {lesson.content_type === "video" && lesson.file_url ? (
          <div className="aspect-video bg-card">
            <video controls className="w-full h-full" src={lesson.file_url} />
          </div>
        ) : lesson.content_type === "pdf" && lesson.file_url ? (
          <div className="aspect-video bg-card">
            <iframe src={lesson.file_url} className="w-full h-full" title={lesson.title} />
          </div>
        ) : lesson.content_type === "image" && lesson.file_url ? (
          <div className="bg-card flex items-center justify-center p-6">
            <img src={lesson.file_url} alt={lesson.title} className="max-w-full max-h-[70vh] rounded-lg object-contain" />
          </div>
        ) : lesson.content_type === "url" && lesson.file_url ? (
          <div className="p-6">
            <a href={lesson.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline text-lg">
              <ExternalLink className="w-5 h-5" />
              Open External Resource
            </a>
            <iframe src={lesson.file_url} className="w-full h-[70vh] mt-4 rounded-lg border border-border" title={lesson.title} />
          </div>
        ) : lesson.content_type === "video" ? (
          <div className="aspect-video bg-card flex items-center justify-center">
            <div className="text-center"><PlayCircle className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" /><p className="text-muted-foreground">No video uploaded yet</p></div>
          </div>
        ) : null}

        <div className="p-6 max-w-3xl">
          {lesson.content_text && <p className="text-muted-foreground leading-relaxed mb-8 whitespace-pre-wrap">{lesson.content_text}</p>}

          <div className="flex gap-3 mb-8">
            {!currentCompletion && (
              <Button variant="hero" onClick={() => markComplete.mutate()}>Mark as Complete</Button>
            )}
            {currentCompletion && nextLesson && (
              <Button variant="hero" asChild>
                <Link to={`/lesson/${nextLesson.id}`}>Next Lesson →</Link>
              </Button>
            )}
          </div>

          {/* Assignments */}
          {assignments.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Assignments</h3>
              {assignments.map((a: any) => (
                <div key={a.id} className="glass-card p-4 space-y-3">
                  <h4 className="font-medium text-sm">{a.title}</h4>
                  {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                  <Textarea placeholder="Your answer..." value={submissionText} onChange={(e) => setSubmissionText(e.target.value)} className="bg-secondary border-border text-sm" />
                  <div className="space-y-1">
                    <Label className="text-xs">Attach file (optional)</Label>
                    <Input id="submission-file" type="file" className="bg-secondary border-border text-sm" />
                  </div>
                  <Button size="sm" variant="hero" onClick={() => submitAssignment(a.id)} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:w-80 border-l border-border bg-card/50">
        <div className="p-4 border-b border-border"><h3 className="font-semibold text-sm">Module Lessons</h3></div>
        <div className="divide-y divide-border">
          {moduleLessons.map((l: any) => {
            const idx = allCourseLessons.findIndex((al: any) => al.id === l.id);
            const completed = allCompletions.includes(l.id);
            const accessible = isAdmin || (
              hasCourseAccess(courseId) &&
              canAccessLesson(courseId, idx) &&
              (idx === 0 || allCompletions.includes(allCourseLessons[idx - 1]?.id))
            );

            return (
              <div
                key={l.id}
                className={`flex items-center gap-3 p-4 text-sm transition-colors ${
                  l.id === lessonId ? "bg-primary/10 border-l-2 border-l-primary" :
                  accessible ? "hover:bg-secondary/50 cursor-pointer" : "opacity-50"
                }`}
                onClick={() => accessible && navigate(`/lesson/${l.id}`)}
              >
                {completed ? (
                  <CheckCircle className="w-4 h-4 text-success shrink-0" />
                ) : accessible ? (
                  l.content_type === "video" ? <PlayCircle className={`w-4 h-4 shrink-0 ${l.id === lessonId ? "text-primary" : "text-muted-foreground"}`} />
                    : l.content_type === "pdf" ? <FileText className="w-4 h-4 text-accent shrink-0" />
                    : <CheckCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className={l.id === lessonId ? "text-foreground font-medium" : "text-muted-foreground"}>{l.title}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LessonViewerPage;
