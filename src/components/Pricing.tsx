import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "3 practice sessions per month",
        "Basic AI feedback",
        "Standard question bank",
        "Email support"
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Pro",
      price: "$29",
      period: "per month",
      description: "For serious professionals",
      features: [
        "Unlimited practice sessions",
        "Advanced AI feedback & analytics",
        "Custom question banks",
        "Priority support",
        "Performance tracking",
        "Export reports"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Team",
      price: "$199",
      period: "per month",
      description: "For organizations and groups",
      features: [
        "Everything in Pro",
        "Up to 50 team members",
        "Team performance dashboard",
        "Custom branding",
        "Dedicated account manager",
        "SSO integration"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-deep-navy mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include core features 
            with no hidden fees or long-term commitments.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative rounded-xl border-2 p-8 ${
                plan.popular 
                  ? 'border-soft-sky bg-soft-sky/5 scale-105' 
                  : 'border-gray-200 bg-white'
              } transition-smooth hover:shadow-lg`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-soft-sky text-deep-navy px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-deep-navy mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-deep-navy">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    /{plan.period}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <Check className="h-5 w-5 text-soft-sky mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className={`w-full font-semibold ${
                  plan.popular
                    ? 'bg-soft-sky hover:bg-soft-sky/90 text-deep-navy'
                    : 'bg-deep-navy hover:bg-deep-navy/90 text-white'
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center">
              <Check className="h-4 w-4 text-soft-sky mr-2" />
              Cancel anytime
            </span>
            <span className="flex items-center">
              <Check className="h-4 w-4 text-soft-sky mr-2" />
              Money-back guarantee
            </span>
            <span className="flex items-center">
              <Check className="h-4 w-4 text-soft-sky mr-2" />
              Enterprise options available
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;