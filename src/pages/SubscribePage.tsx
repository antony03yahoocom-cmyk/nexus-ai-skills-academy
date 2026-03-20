import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { Check, CreditCard, Shield, Star, Zap, Crown } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "1,000",
    amount: 100000,
    period: "per month",
    icon: Zap,
    features: [
      "All published courses",
      "Video & text lessons",
      "Mobile-friendly access",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: "2,500",
    amount: 250000,
    period: "per month",
    icon: Star,
    badge: "POPULAR",
    features: [
      "Everything in Basic",
      "PDF & image resources",
      "Assignments & feedback",
      "Priority support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "5,000",
    amount: 500000,
    period: "one-time",
    icon: Crown,
    badge: "BEST VALUE",
    features: [
      "Everything in Standard",
      "Lifetime access",
      "All future courses",
      "Certificates",
      "Community access",
    ],
  },
];

const SubscribePage = () => {
  const { profile, hasAccess, trialDaysLeft, user, session, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

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
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack?action=verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
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

  const handlePaystack = async (plan: typeof plans[number]) => {
    if (!user || !session) {
      toast.error("Please log in first");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack?action=initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            amount: plan.amount,
            plan: plan.id,
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
            <Button variant="hero" asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
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
              {hasAccess
                ? `Your trial has ${trialDaysLeft} days left.`
                : "Your trial has expired."}{" "}
              Subscribe for unlimited access.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Pay via <strong>M-Pesa</strong> (Send Money) — fast &amp; secure
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`glass-card p-6 sm:p-8 text-center flex flex-col relative ${
                    plan.badge ? "glow-primary" : ""
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <Icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
                  <div className="text-3xl sm:text-4xl font-bold gradient-text mb-1">
                    KES {plan.price}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.period}</p>

                  <ul className="text-left space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.badge ? "hero" : "outline"}
                    size="lg"
                    className="w-full"
                    onClick={() => handlePaystack(plan)}
                    disabled={loading || !user}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {loading
                      ? "Processing..."
                      : user
                      ? `Pay KES ${plan.price}`
                      : "Log in to Subscribe"}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2 mt-8 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            Secured by Paystack · M-Pesa (Send Money to +254 718 131 239)
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SubscribePage;
