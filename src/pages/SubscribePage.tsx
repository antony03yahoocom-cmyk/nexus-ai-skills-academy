import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { Cpu, Check, CreditCard, Shield } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const SubscribePage = () => {
  const { profile, hasAccess, trialDaysLeft, user, session, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Handle payment verification callback
  useEffect(() => {
    const verify = searchParams.get("verify");
    const reference = searchParams.get("reference");
    if (verify && reference && session) {
      verifyPayment(reference);
    }
  }, [searchParams, session]);

  const verifyPayment = async (reference: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack", {
        body: { reference },
        headers: { "Content-Type": "application/json" },
      });

      // The function uses query params for action, but invoke doesn't support that easily
      // Let's use the body approach
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack?action=verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ reference }),
        }
      );
      const result = await resp.json();

      if (result.success) {
        toast.success("Payment verified! You now have full access.");
        await refreshProfile();
      } else {
        toast.error("Payment verification failed. Please contact support.");
      }
    } catch (e) {
      toast.error("Failed to verify payment.");
    }
    setLoading(false);
  };

  const handlePaystack = async (plan: "monthly" | "onetime") => {
    if (!user || !session) {
      toast.error("Please log in first");
      return;
    }
    setLoading(true);
    try {
      const amount = plan === "monthly" ? 150000 : 350000; // in kobo (KES cents)
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack?action=initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            amount,
            callback_url: `${window.location.origin}/subscribe?verify=true`,
          }),
        }
      );
      const data = await resp.json();

      if (data.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        toast.error(data.error || "Failed to initialize payment");
      }
    } catch (e) {
      toast.error("Payment initialization failed");
    }
    setLoading(false);
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Unlock <span className="gradient-text">Everything</span></h1>
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
                {["All courses & future updates", "Video, PDF & text lessons", "Assignments & certificates", "Community access", "Priority support"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button variant="hero" size="lg" className="w-full" onClick={handlePaystack} disabled={loading || !user}>
                <CreditCard className="w-4 h-4 mr-2" />
                {loading ? "Processing..." : user ? "Pay with Paystack" : "Log in to Subscribe"}
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
