import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Cpu, Check, CreditCard, Shield } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const SubscribePage = () => {
  const { profile, hasAccess, trialDaysLeft } = useAuth();

  const handlePaystack = () => {
    // Paystack integration will be added via edge function
    // For now show a placeholder
    window.open("https://paystack.com", "_blank");
  };

  if (profile?.subscription_status === "paid") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <div className="glass-card p-12 text-center max-w-md">
            <Check className="w-16 h-16 text-success mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">You're Subscribed!</h1>
            <p className="text-muted-foreground mb-6">You have full access to all courses.</p>
            <Button variant="hero" asChild><Link to="/dashboard">Go to Dashboard</Link></Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Unlock <span className="gradient-text">Everything</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {hasAccess ? `Your trial has ${trialDaysLeft} days left.` : "Your trial has expired."} Subscribe for unlimited access.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="glass-card p-8 text-center glow-primary">
              <h2 className="text-2xl font-bold mb-2">Premium Access</h2>
              <div className="text-4xl font-bold gradient-text mb-2">₦15,000</div>
              <p className="text-sm text-muted-foreground mb-6">One-time payment · Lifetime access</p>

              <ul className="text-left space-y-3 mb-8">
                {[
                  "All courses & future updates",
                  "Video, PDF & text lessons",
                  "Assignments & certificates",
                  "Community access",
                  "Priority support",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button variant="hero" size="lg" className="w-full" onClick={handlePaystack}>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay with Paystack
              </Button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                Secured by Paystack
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SubscribePage;
