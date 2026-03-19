import { Brain, Palette, BarChart3, Code, Globe, Cpu } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  { name: "Artificial Intelligence", icon: Brain, count: 12, color: "text-primary" },
  { name: "Graphic Design", icon: Palette, count: 8, color: "text-accent" },
  { name: "Data Analysis", icon: BarChart3, count: 10, color: "text-success" },
  { name: "Programming", icon: Code, count: 15, color: "text-primary" },
  { name: "Web Development", icon: Globe, count: 11, color: "text-accent" },
  { name: "Machine Learning", icon: Cpu, count: 9, color: "text-success" },
];

const CategoriesSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Explore <span className="gradient-text">Categories</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Dive into cutting-edge disciplines curated by industry experts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to="/courses"
              className="glass-card p-6 group hover:border-primary/30 transition-all duration-300 hover:glow-primary"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-secondary">
                  <cat.icon className={`w-6 h-6 ${cat.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{cat.count} courses</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
