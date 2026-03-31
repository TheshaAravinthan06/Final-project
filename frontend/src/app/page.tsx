"use client";

import { useState } from "react";
import Navbar from "../components/landing/Navbar";
import HeroSection from "../components/landing/HeroSection";
import AboutSection from "../components/landing/AboutSection";
import HowItWorks from "../components/landing/HowItWorks";
import PopularDestinations from "../components/landing/PopularDestinations";
import Footer from "../components/landing/Footer";
import AuthModal from "../components/landing/AuthModal";
import FloatingAI from "../components/landing/FloatingAI";


export default function HomePage() {
  const [modalType, setModalType] = useState<"login" | "register" | null>(null);

  return (
    <>
      <div className={`landing-page-shell ${modalType ? "modal-open" : ""}`}>
        <Navbar
          onOpenLogin={() => setModalType("login")}
          onOpenRegister={() => setModalType("register")}
        />

        <HeroSection onOpenRegister={() => setModalType("register")} />
        <AboutSection />
        <HowItWorks onOpenLogin={() => setModalType("login")} />
        <PopularDestinations onOpenLogin={() => setModalType("login")} />
        <Footer />
        <FloatingAI onOpenLogin={() => setModalType("login")} />
      </div>

      <AuthModal
        type={modalType}
        onClose={() => setModalType(null)}
        onSwitch={(type: "login" | "register") => setModalType(type)}
      />
    </>
  );
}