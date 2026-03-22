import { PlayCircle, FolderOpen, Award, Cpu } from "lucide-react";

const features = [
  { icon: PlayCircle, title: "Learn Anytime", description: "Video lessons, PDFs, and text content accessible 24/7 from any device.", color: "text-primary", bg: "bg-primary/10" },
  { icon: FolderOpen, title: "Real Projects", description: "Build portfolio-worthy projects with guidance and admin feedback.", color: "text-accent", bg: "bg-accent/10" },
  { icon: Award, title: "Certificates", description: "Earn verifiable certificates upon completing courses and assignments.", color: "text-success", bg: "bg-success/10" },
  { icon: Cpu, title: "AI-Powered Learning", description: "Structured, sequential learning paths designed for maximum retention.", color: "text-primary", bg: "bg-primary/10" },
];

const FeaturesSection = () => (
  <section className="py-24 relative">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Why <span className="gradient-text">NEXUS AI</span>?
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Everything you need to master in-demand skills.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {features.map((f) => (
          <div key={f.title} className="glass-card p-6 text-center hover:border-primary/30 transition-all duration-300 group">
            <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
              <f.icon className={`w-7 h-7 ${f.color}`} />
            </div>
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
