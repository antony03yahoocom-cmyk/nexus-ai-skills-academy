import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardTopNav from "@/components/dashboard/DashboardTopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, FolderOpen, Upload } from "lucide-react";

const StudentProjectsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", course_id: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ["my-projects", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*, courses(title)").eq("student_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses-list"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, title").eq("is_published", true);
      return data ?? [];
    },
  });

  const submitProject = useMutation({
    mutationFn: async () => {
      setUploading(true);
      const fileUrls: string[] = [];
      for (const file of files) {
        const path = `${user!.id}/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from("project-files").upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from("project-files").getPublicUrl(path);
        if (data?.publicUrl) fileUrls.push(data.publicUrl);
      }
      const { error } = await supabase.from("projects").insert({
        student_id: user!.id, course_id: form.course_id, title: form.title,
        description: form.description, project_files: fileUrls, status: "Submitted" as any,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["my-projects"] }); toast.success("Project submitted!"); setShowForm(false); setForm({ title: "", description: "", course_id: "" }); setFiles([]); setUploading(false); },
    onError: (e: any) => { toast.error(e.message); setUploading(false); },
  });

  const statusColor = (s: string) => {
    if (s === "Approved") return "bg-success/10 text-success border-success/20";
    if (s === "Submitted") return "bg-accent/10 text-accent border-accent/20";
    if (s === "Rejected") return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-secondary text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardTopNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Projects</h1>
            <p className="text-muted-foreground">Submit and track your course projects.</p>
          </div>
          <Button variant="hero" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> New Project</Button>
        </div>

        {showForm && (
          <div className="glass-card p-6 mb-8">
            <h3 className="font-semibold mb-4">Submit New Project</h3>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-secondary border-border" /></div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{courses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" /></div>
              <div className="space-y-2">
                <Label>Upload Files</Label>
                <Input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className="bg-secondary border-border" />
                {files.length > 0 && <p className="text-xs text-muted-foreground">{files.length} file(s) selected</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="hero" onClick={() => submitProject.mutate()} disabled={uploading || !form.title || !form.course_id}>{uploading ? "Uploading..." : "Submit Project"}</Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No projects yet. Submit your first project!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((p: any) => (
              <div key={p.id} className="glass-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{(p as any).courses?.title ?? "Course"}</p>
                    {p.description && <p className="text-sm text-muted-foreground mt-2">{p.description}</p>}
                    {p.admin_feedback && (
                      <div className="mt-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                        <p className="text-xs font-medium text-accent">Admin Feedback</p>
                        <p className="text-sm mt-1">{p.admin_feedback}</p>
                      </div>
                    )}
                    {p.project_files && (p.project_files as string[]).length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {(p.project_files as string[]).map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            <Upload className="w-3 h-3" /> File {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <Badge className={statusColor(p.status)}>{p.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-3">{new Date(p.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentProjectsPage;
