import { Upload, MessageSquare, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  const steps = [
    {
      step: "01",
      icon: <Upload className="h-8 w-8 text-soft-sky" />,
      title: "Upload Your Materials",
      description: "Share your job description, pitch deck, or research abstract. Our AI analyzes the content to understand your specific context and requirements."
    },
    {
      step: "02", 
      icon: <MessageSquare className="h-8 w-8 text-soft-sky" />,
      title: "Practice with AI Panel",
      description: "Engage in realistic practice sessions with our intelligent AI panel. Experience dynamic questioning, real-time feedback, and adaptive difficulty."
    },
    {
      step: "03",
      icon: <BarChart3 className="h-8 w-8 text-soft-sky" />,
      title: "Get Analysis & Improve",
      description: "Receive detailed performance analytics, personalized improvement suggestions, and track your progress over multiple practice sessions."
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-deep-navy mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes with our simple three-step process. 
            No complex setup required.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col md:flex-row items-start mb-12 last:mb-0">
              {/* Step number and icon */}
              <div className="flex items-center mb-4 md:mb-0 md:mr-8">
                <div className="flex items-center justify-center w-16 h-16 bg-soft-sky/10 rounded-full mr-4 flex-shrink-0">
                  {step.icon}
                </div>
                <div className="text-4xl font-bold text-soft-sky/30 md:hidden">
                  {step.step}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <div className="hidden md:block text-4xl font-bold text-soft-sky/30 mr-6">
                    {step.step}
                  </div>
                  <h3 className="text-2xl font-bold text-deep-navy">
                    {step.title}
                  </h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block w-px h-20 bg-gray-200 ml-8 mt-8"></div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center px-6 py-3 bg-soft-sky/10 rounded-full text-deep-navy font-medium mb-6">
            <span className="w-2 h-2 bg-soft-sky rounded-full mr-3 animate-pulse"></span>
            Ready in under 2 minutes
          </div>
          <div>
            <Link to="/signup">
              <button className="bg-deep-navy hover:bg-deep-navy/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-smooth">
                Start Your First Practice Session
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;