import { useState } from "react";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Edit, ChevronDown, ChevronRight, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["AI", "Graphic Design", "Data Analysis", "Programming", "Web Development", "Machine Learning"];

const AdminCoursesPage = () => {
  const queryClient = useQueryClient();
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState({ title: "", description: "", category: "AI", is_published: false, price: 0 });
  const [moduleForm, setModuleForm] = useState({ title: "", course_id: "" });
  const [showModuleForm, setShowModuleForm] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: "", content_type: "video" as string, content_text: "", content_url: "", module_id: "" });
  const [showLessonForm, setShowLessonForm] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const { data: courses = [] } = useQuery({
    queryKey: ["admin-courses-full"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["admin-modules"],
    queryFn: async () => {
      const { data } = await supabase.from("modules").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["admin-lessons"],
    queryFn: async () => {
      const { data } = await supabase.from("lessons").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["admin-assignments"],
    queryFn: async () => {
      const { data } = await supabase.from("assignments").select("*");
      return data ?? [];
    },
  });

  const createCourse = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("courses").insert({ ...courseForm, price: courseForm.price || 0 });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses-full"] });
      toast.success("Course created!");
      setShowCourseForm(false);
      setCourseForm({ title: "", description: "", category: "AI", is_published: false, price: 0 });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateCourse = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("courses").update({ ...courseForm, price: courseForm.price || 0 }).eq("id", editingCourse.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses-full"] });
      toast.success("Course updated!");
      setEditingCourse(null);
      setCourseForm({ title: "", description: "", category: "AI", is_published: false, price: 0 });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses-full"] });
      toast.success("Course deleted!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createModule = useMutation({
    mutationFn: async () => {
      const courseModules = modules.filter((m: any) => m.course_id === moduleForm.course_id);
      const { error } = await supabase.from("modules").insert({ ...moduleForm, sort_order: courseModules.length });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-modules"] });
      toast.success("Module created!");
      setShowModuleForm(null);
      setModuleForm({ title: "", course_id: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-modules"] });
      queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
      toast.success("Module deleted!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createLesson = useMutation({
    mutationFn: async (fileUrl?: string) => {
      const moduleLessons = lessons.filter((l: any) => l.module_id === lessonForm.module_id);
      const finalUrl = fileUrl || lessonForm.content_url || null;
      const { error } = await supabase.from("lessons").insert({
        title: lessonForm.title,
        content_type: lessonForm.content_type,
        content_text: lessonForm.content_text || null,
        file_url: finalUrl,
        module_id: lessonForm.module_id,
        sort_order: moduleLessons.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
      toast.success("Lesson created!");
      setShowLessonForm(null);
      setLessonForm({ title: "", content_type: "video", content_text: "", content_url: "", module_id: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
      toast.success("Lesson deleted!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true);
    const path = `lessons/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("course-content").upload(path, file);
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploadingFile(false);
      return null;
    }
    const { data } = supabase.storage.from("course-content").getPublicUrl(path);
    setUploadingFile(false);
    return data.publicUrl;
  };

  const handleCreateLesson = async () => {
    const fileInput = document.getElementById("lesson-file") as HTMLInputElement;
    let fileUrl: string | undefined;
    if (fileInput?.files?.[0]) {
      const url = await handleFileUpload(fileInput.files[0]);
      if (url) fileUrl = url;
      else return;
    }
    createLesson.mutate(fileUrl);
  };

  const startEditCourse = (course: any) => {
    setEditingCourse(course);
    setCourseForm({ title: course.title, description: course.description || "", category: course.category, is_published: course.is_published, price: course.price || 0 });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Manage Courses</h1>
              <p className="text-muted-foreground">Create and manage course content.</p>
            </div>
            <Button variant="hero" onClick={() => { setShowCourseForm(true); setEditingCourse(null); setCourseForm({ title: "", description: "", category: "AI", is_published: false, price: 0 }); }}>
              <Plus className="w-4 h-4 mr-1" /> New Course
            </Button>
          </div>

          {/* Course Form */}
          {(showCourseForm || editingCourse) && (
            <div className="glass-card p-6 mb-8">
              <h3 className="font-semibold mb-4">{editingCourse ? "Edit Course" : "New Course"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={courseForm.category} onValueChange={(v) => setCourseForm({ ...courseForm, category: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Price (KES)</Label>
                  <Input type="number" min="0" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: parseInt(e.target.value) || 0 })} className="bg-secondary border-border" placeholder="e.g. 1500" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="published" checked={courseForm.is_published} onChange={(e) => setCourseForm({ ...courseForm, is_published: e.target.checked })} />
                  <Label htmlFor="published">Published</Label>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="hero" onClick={() => editingCourse ? updateCourse.mutate() : createCourse.mutate()}>
                  {editingCourse ? "Update" : "Create"}
                </Button>
                <Button variant="ghost" onClick={() => { setShowCourseForm(false); setEditingCourse(null); }}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Course List */}
          <div className="space-y-4">
            {courses.map((course: any) => {
              const courseModules = modules.filter((m: any) => m.course_id === course.id);
              const isExpanded = expandedCourse === course.id;

              return (
                <div key={course.id} className="glass-card overflow-hidden">
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedCourse(isExpanded ? null : course.id)}>
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <div>
                        <h3 className="font-semibold">{course.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                          <Badge className={course.is_published ? "bg-success/10 text-success border-success/20" : "bg-secondary text-muted-foreground"}>
                            {course.is_published ? "Published" : "Draft"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">KES {(course.price || 0).toLocaleString()}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => startEditCourse(course)}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteCourse.mutate(course.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-3">
                      {/* Modules */}
                      {courseModules.map((mod: any) => {
                        const modLessons = lessons.filter((l: any) => l.module_id === mod.id);
                        const isModExpanded = expandedModule === mod.id;

                        return (
                          <div key={mod.id} className="bg-secondary/50 rounded-lg overflow-hidden">
                            <div className="p-3 flex items-center justify-between cursor-pointer" onClick={() => setExpandedModule(isModExpanded ? null : mod.id)}>
                              <div className="flex items-center gap-2">
                                {isModExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                <span className="text-sm font-medium">{mod.title}</span>
                                <span className="text-xs text-muted-foreground">({modLessons.length} lessons)</span>
                              </div>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); deleteModule.mutate(mod.id); }}>
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>

                            {isModExpanded && (
                              <div className="px-3 pb-3 space-y-2">
                                {modLessons.map((lesson: any) => (
                                  <div key={lesson.id} className="flex items-center justify-between bg-background/50 rounded p-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">{lesson.content_type}</Badge>
                                      <span className="text-sm">{lesson.title}</span>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteLesson.mutate(lesson.id)}>
                                      <Trash2 className="w-3 h-3 text-destructive" />
                                    </Button>
                                  </div>
                                ))}

                                {/* Add Lesson */}
                                {showLessonForm === mod.id ? (
                                  <div className="bg-background/50 rounded p-3 space-y-3">
                                    <Input placeholder="Lesson title" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value, module_id: mod.id })} className="bg-secondary border-border text-sm" />
                                    <Select value={lessonForm.content_type} onValueChange={(v) => setLessonForm({ ...lessonForm, content_type: v })}>
                                      <SelectTrigger className="bg-secondary border-border text-sm"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="video">Video</SelectItem>
                                        <SelectItem value="pdf">PDF</SelectItem>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="image">Image</SelectItem>
                                        <SelectItem value="url">External URL</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {lessonForm.content_type === "text" && (
                                      <Textarea placeholder="Lesson content" value={lessonForm.content_text} onChange={(e) => setLessonForm({ ...lessonForm, content_text: e.target.value })} className="bg-secondary border-border text-sm" />
                                    )}
                                    {lessonForm.content_type === "url" && (
                                      <Input placeholder="https://example.com/resource" value={lessonForm.content_url} onChange={(e) => setLessonForm({ ...lessonForm, content_url: e.target.value })} className="bg-secondary border-border text-sm" />
                                    )}
                                    {(lessonForm.content_type === "video" || lessonForm.content_type === "pdf" || lessonForm.content_type === "image") && (
                                      <div className="space-y-1">
                                        <Label className="text-xs">Upload {lessonForm.content_type === "video" ? "Video" : lessonForm.content_type === "pdf" ? "PDF" : "Image"}</Label>
                                        <Input id="lesson-file" type="file" accept={lessonForm.content_type === "video" ? "video/*" : lessonForm.content_type === "pdf" ? ".pdf" : "image/*"} className="bg-secondary border-border text-sm" />
                                      </div>
                                    )}
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="hero" onClick={handleCreateLesson} disabled={uploadingFile || !lessonForm.title}>
                                        {uploadingFile ? "Uploading..." : "Add Lesson"}
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => setShowLessonForm(null)}>Cancel</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setShowLessonForm(mod.id); setLessonForm({ ...lessonForm, module_id: mod.id }); }}>
                                    <Plus className="w-3 h-3 mr-1" /> Add Lesson
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add Module */}
                      {showModuleForm === course.id ? (
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Input placeholder="Module title" value={moduleForm.title} onChange={(e) => setModuleForm({ title: e.target.value, course_id: course.id })} className="bg-secondary border-border text-sm" />
                          </div>
                          <Button size="sm" variant="hero" onClick={() => createModule.mutate()} disabled={!moduleForm.title}>Add</Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowModuleForm(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setShowModuleForm(course.id); setModuleForm({ title: "", course_id: course.id }); }}>
                          <Plus className="w-3 h-3 mr-1" /> Add Module
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminCoursesPage;
