import { Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PricingSection = () => (
  <section className="py-24 relative">
    <div className="absolute inset-0 mesh-gradient opacity-30" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Simple <span className="gradient-text">Pricing</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Pay per course or unlock everything with Premium.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Per Course */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold mb-2">Per Course</h3>
          <p className="text-muted-foreground text-sm mb-4">Buy the courses you need</p>
          <div className="text-3xl font-bold mb-6">From KES 1,200</div>
          <ul className="space-y-3 mb-8">
            {["Full course access", "All lessons & assignments", "Course certificate", "Lifetime access"].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-success shrink-0" />{f}</li>
            ))}
          </ul>
          <Button variant="hero-outline" className="w-full" asChild><Link to="/courses">Browse Courses</Link></Button>
        </div>

        {/* Premium */}
        <div className="glass-card p-8 border-primary/30 glow-primary relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">BEST VALUE</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold">Premium Plan</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">Access everything</p>
          <div className="text-3xl font-bold gradient-text mb-1">KES 5,000</div>
          <p className="text-xs text-muted-foreground mb-6">one-time · lifetime access</p>
          <ul className="space-y-3 mb-8">
            {["All courses (current + future)", "All lessons unlocked", "Certificates & mentorship", "Priority support"].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-success shrink-0" />{f}</li>
            ))}
          </ul>
          <Button variant="hero" className="w-full" asChild><Link to="/subscribe">Get Premium</Link></Button>
        </div>
      </div>
    </div>
  </section>
);

export default PricingSection;
