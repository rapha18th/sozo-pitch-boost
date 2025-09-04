import Header from "@/components/Header";
import Hero from "@/components/Hero";
import UseCases from "@/components/UseCases";
import HowItWorks from "@/components/HowItWorks";
import SocialProof from "@/components/SocialProof";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <UseCases />
        <HowItWorks />
        <SocialProof />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
