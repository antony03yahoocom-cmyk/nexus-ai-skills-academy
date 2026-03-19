import { useParams, Link } from "react-router-dom";
import { Clock, Users, Star, PlayCircle, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const courseData = {
  id: "1",
  title: "Complete AI & Machine Learning Bootcamp",
  description: "Master artificial intelligence and machine learning from the ground up. This comprehensive bootcamp covers everything from Python basics to advanced neural networks, with hands-on projects and real-world applications.",
  category: "Artificial Intelligence",
  lessons: 48,
  students: 2340,
  rating: 4.9,
  modules: [
    {
      title: "Module 1: Introduction to AI",
      lessons: [
        { id: "l1", title: "What is Artificial Intelligence?", type: "video", duration: "12 min" },
        { id: "l2", title: "History and Evolution of AI", type: "video", duration: "18 min" },
        { id: "l3", title: "AI Applications in Today's World", type: "pdf", duration: "10 min" },
      ],
    },
    {
      title: "Module 2: Python for AI",
      lessons: [
        { id: "l4", title: "Python Fundamentals", type: "video", duration: "25 min" },
        { id: "l5", title: "NumPy & Pandas Crash Course", type: "video", duration: "30 min" },
        { id: "l6", title: "Data Visualization with Matplotlib", type: "video", duration: "22 min" },
      ],
    },
    {
      title: "Module 3: Machine Learning Basics",
      lessons: [
        { id: "l7", title: "Supervised vs Unsupervised Learning", type: "video", duration: "20 min" },
        { id: "l8", title: "Linear Regression Deep Dive", type: "video", duration: "28 min" },
        { id: "l9", title: "Assignment: Build Your First ML Model", type: "text", duration: "45 min" },
      ],
    },
  ],
};

const CourseDetailPage = () => {
  const { courseId } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-12">
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              {courseData.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-bold mt-4 mb-4">{courseData.title}</h1>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">{courseData.description}</p>
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{courseData.lessons} lessons</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{courseData.students.toLocaleString()} students</span>
              <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-primary text-primary" />{courseData.rating}</span>
            </div>
            <Button variant="hero" size="lg">Enroll Now — Free Trial</Button>
          </div>

          {/* Modules */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Course Curriculum</h2>
            <div className="space-y-4">
              {courseData.modules.map((module, idx) => (
                <div key={idx} className="glass-card overflow-hidden">
                  <div className="p-5 border-b border-border">
                    <h3 className="font-semibold">{module.title}</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {module.lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        to={`/lesson/${lesson.id}`}
                        className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
                      >
                        {lesson.type === "video" ? (
                          <PlayCircle className="w-5 h-5 text-primary shrink-0" />
                        ) : lesson.type === "pdf" ? (
                          <FileText className="w-5 h-5 text-accent shrink-0" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-success shrink-0" />
                        )}
                        <span className="flex-1 text-sm">{lesson.title}</span>
                        <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CourseDetailPage;
