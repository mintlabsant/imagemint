import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ToolSearch from "./components/ToolSearch";

import HeroSection from "./sections/HeroSection";
import UploadAreaSection from "./sections/UploadAreaSection";
import PopularToolsSection from "./sections/PopularToolsSection";
import WhyImageMintSection from "./sections/WhyImageMintSection";
import HowItWorksSection from "./sections/HowItWorksSection";
import PrivacyPromiseSection from "./sections/PrivacyPromiseSection";

function App() {
  return (
    <>
      <Navbar />

      <main>
        <HeroSection />

        <UploadAreaSection />

        <ToolSearch />

        <PopularToolsSection />

        <WhyImageMintSection />

        <HowItWorksSection />

        <PrivacyPromiseSection />
      </main>

      <Footer />
    </>
  );
}

export default App;