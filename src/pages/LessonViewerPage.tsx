import { useParams, Link } from "react-router-dom";
import { ArrowLeft, PlayCircle, FileText, CheckCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const lessonData = {
  id: "l1",
  title: "What is Artificial Intelligence?",
  type: "video",
  content: "This lesson introduces the fundamental concepts of artificial intelligence, exploring its definition, core principles, and how it differs from traditional programming approaches.",
  videoUrl: "",
  moduleLessons: [
    { id: "l1", title: "What is Artificial Intelligence?", type: "video", active: true },
    { id: "l2", title: "History and Evolution of AI", type: "video", active: false },
    { id: "l3", title: "AI Applications in Today's World", type: "pdf", active: false },
  ],
};

const LessonViewerPage = () => {
  const { lessonId } = useParams();

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Main content - 75% */}
      <div className="flex-1 lg:w-3/4">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Link to="/courses/1" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold truncate">{lessonData.title}</h1>
        </div>

        {/* Video area */}
        <div className="aspect-video bg-card flex items-center justify-center border-b border-border">
          <div className="text-center">
            <PlayCircle className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Video player will be integrated with Supabase Storage</p>
          </div>
        </div>

        {/* Lesson content */}
        <div className="p-6 max-w-3xl">
          <h2 className="text-2xl font-bold mb-4">{lessonData.title}</h2>
          <p className="text-muted-foreground leading-relaxed mb-8">{lessonData.content}</p>
          <div className="flex gap-3">
            <Button variant="hero">Mark as Complete</Button>
            <Button variant="hero-outline">Submit Assignment</Button>
          </div>
        </div>
      </div>

      {/* Sidebar - lesson list */}
      <div className="lg:w-80 border-l border-border bg-card/50">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Module Lessons</h3>
        </div>
        <div className="divide-y divide-border">
          {lessonData.moduleLessons.map((lesson) => (
            <Link
              key={lesson.id}
              to={`/lesson/${lesson.id}`}
              className={`flex items-center gap-3 p-4 text-sm transition-colors ${
                lesson.active ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-secondary/50"
              }`}
            >
              {lesson.type === "video" ? (
                <PlayCircle className={`w-4 h-4 shrink-0 ${lesson.active ? "text-primary" : "text-muted-foreground"}`} />
              ) : (
                <FileText className="w-4 h-4 text-accent shrink-0" />
              )}
              <span className={lesson.active ? "text-foreground font-medium" : "text-muted-foreground"}>
                {lesson.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LessonViewerPage;
