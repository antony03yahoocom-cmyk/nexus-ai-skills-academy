import { Link } from "react-router-dom";
import { Clock, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const courses = [
  { id: "1", title: "Complete AI & Machine Learning Bootcamp", category: "Artificial Intelligence", lessons: 48, students: 2340, rating: 4.9, image: "🤖" },
  { id: "2", title: "Full-Stack Web Development Masterclass", category: "Web Development", lessons: 62, students: 3120, rating: 4.8, image: "🌐" },
  { id: "3", title: "Data Analysis with Python & SQL", category: "Data Analysis", lessons: 36, students: 1890, rating: 4.7, image: "📊" },
  { id: "4", title: "UI/UX Design Fundamentals", category: "Graphic Design", lessons: 28, students: 1560, rating: 4.9, image: "🎨" },
  { id: "5", title: "Advanced Python Programming", category: "Programming", lessons: 42, students: 2780, rating: 4.8, image: "🐍" },
  { id: "6", title: "Deep Learning & Neural Networks", category: "Machine Learning", lessons: 38, students: 1420, rating: 4.9, image: "🧠" },
];

const CoursesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              All <span className="gradient-text">Courses</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Premium courses designed to take you from beginner to expert.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="glass-card overflow-hidden group hover:border-primary/30 transition-all duration-300"
              >
                <div className="h-40 bg-secondary flex items-center justify-center text-5xl">
                  {course.image}
                </div>
                <div className="p-6">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    {course.category}
                  </span>
                  <h3 className="font-semibold text-foreground mt-3 mb-3 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{course.lessons} lessons</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{course.students.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-primary text-primary" />{course.rating}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CoursesPage;
