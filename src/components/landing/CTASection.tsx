import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="glass-card p-12 md:p-16 text-center relative overflow-hidden max-w-4xl mx-auto">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/20 blur-[100px] rounded-full" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Ready to Level Up?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              Start your 30-day free trial today. Access all courses, projects, and community features.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/signup">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
