import { Briefcase, TrendingUp, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const UseCases = () => {
  const cases = [
    {
      icon: <Briefcase className="h-12 w-12 text-soft-sky" />,
      title: "Job Interviews",
      subtitle: "Career Professionals",
      description: "Practice behavioral questions, technical interviews, and salary negotiations. Get instant feedback on your responses, body language, and communication style.",
      features: [
        "Industry-specific question banks",
        "Real-time response analysis", 
        "Confidence building exercises",
        "Interview timeline preparation"
      ]
    },
    {
      icon: <TrendingUp className="h-12 w-12 text-soft-sky" />,
      title: "Investor Pitches", 
      subtitle: "Startup Founders",
      description: "Perfect your pitch deck presentation, anticipate investor questions, and practice handling objections. Build the confidence to secure funding.",
      features: [
        "Pitch deck optimization tips",
        "Investor psychology insights",
        "Financial projections practice",
        "Demo day preparation"
      ]
    },
    {
      icon: <GraduationCap className="h-12 w-12 text-soft-sky" />,
      title: "Academic Defenses",
      subtitle: "Students & Researchers", 
      description: "Prepare for thesis defenses, dissertation presentations, and academic conferences. Master complex topic explanations and handle challenging questions.",
      features: [
        "Research presentation structure",
        "Committee question simulation",
        "Technical communication skills",
        "Stress management techniques"
      ]
    }
  ];

  return (
    <section id="features" className="py-20 bg-warm-grey">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-deep-navy mb-4">
            One Platform, Three Powerful Use Cases
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Whether you're advancing your career, building a startup, or pursuing academic excellence, 
            Sozo Pitch Helper adapts to your specific needs and goals.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {cases.map((useCase, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-smooth">
              <div className="mb-6">
                {useCase.icon}
              </div>
              
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-deep-navy mb-2">{useCase.title}</h3>
                <p className="text-soft-sky font-medium">{useCase.subtitle}</p>
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                {useCase.description}
              </p>

              <ul className="space-y-2 mb-8">
                {useCase.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-soft-sky rounded-full mr-3 flex-shrink-0"></div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                variant="outline" 
                className="w-full border-soft-sky text-soft-sky hover:bg-soft-sky hover:text-deep-navy transition-smooth"
              >
                Explore {useCase.title}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;