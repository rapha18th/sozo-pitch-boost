import { Twitter, Linkedin, Github, Mail } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    Product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "How It Works", href: "#how-it-works" },
      { name: "Demo", href: "#demo" }
    ],
    Company: [
      { name: "About", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" }
    ],
    Resources: [
      { name: "Help Center", href: "/help" },
      { name: "API Docs", href: "/docs" },
      { name: "Community", href: "/community" },
      { name: "Status", href: "/status" }
    ],
    Legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "GDPR", href: "/gdpr" }
    ]
  };

  const socialLinks = [
    { name: "Twitter", href: "#", icon: <Twitter className="h-5 w-5" /> },
    { name: "LinkedIn", href: "#", icon: <Linkedin className="h-5 w-5" /> },
    { name: "GitHub", href: "#", icon: <Github className="h-5 w-5" /> },
    { name: "Email", href: "#", icon: <Mail className="h-5 w-5" /> }
  ];

  return (
    <footer className="bg-deep-navy text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-6 gap-8">
          {/* Logo and description */}
          <div className="lg:col-span-2">
            <img 
              src="/lovable-uploads/6d93a223-52fd-45a0-9880-510d76c5c0f3.png" 
              alt="Sozo Pitch Helper" 
              className="h-10 w-auto mb-4 brightness-0 invert"
            />
            <p className="text-white/80 mb-6 leading-relaxed">
              Master your pitch with AI-powered practice sessions. 
              Build confidence for job interviews, investor pitches, 
              and academic defenses.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-white/60 hover:text-soft-sky transition-smooth"
                  aria-label={link.name}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-white mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-white/70 hover:text-white transition-smooth text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/60 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Sozo Pitch Helper. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <span className="text-white/60">
                Made with ❤️ for ambitious professionals
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;