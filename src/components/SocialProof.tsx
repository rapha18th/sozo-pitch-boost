import { Star, Users, Award, Clock } from "lucide-react";

const SocialProof = () => {
  const stats = [
    {
      icon: <Users className="h-6 w-6 text-soft-sky" />,
      number: "10,000+",
      label: "Active Users"
    },
    {
      icon: <Award className="h-6 w-6 text-soft-sky" />,
      number: "95%",
      label: "Success Rate"  
    },
    {
      icon: <Clock className="h-6 w-6 text-soft-sky" />,
      number: "50,000+",
      label: "Practice Sessions"
    },
    {
      icon: <Star className="h-6 w-6 text-soft-sky" />,
      number: "4.9/5",
      label: "User Rating"
    }
  ];

  const testimonials = [
    {
      quote: "Sozo helped me land my dream job at Google. The AI feedback was incredibly detailed and actionable.",
      author: "Sarah Chen", 
      role: "Software Engineer at Google",
      avatar: "SC"
    },
    {
      quote: "We raised our Series A after practicing with Sozo. The investor question preparation was game-changing.",
      author: "Marcus Rodriguez",
      role: "CEO, TechFlow",
      avatar: "MR"
    },
    {
      quote: "My thesis defense went flawlessly thanks to Sozo's academic preparation tools. Highly recommended!",
      author: "Dr. Emily Watson",
      role: "PhD Graduate, MIT",
      avatar: "EW"
    }
  ];

  return (
    <section className="py-20 bg-warm-grey">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-3">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-deep-navy mb-2">
                {stat.number}
              </div>
              <div className="text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-deep-navy mb-4">
            Trusted by Professionals Worldwide
          </h2>
          <p className="text-xl text-muted-foreground">
            See what our users are saying
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <blockquote className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>
              
              <div className="flex items-center">
                <div className="w-10 h-10 bg-soft-sky/20 rounded-full flex items-center justify-center text-deep-navy font-semibold text-sm mr-3">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-deep-navy">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;