"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AuthModal from "@/components/landing/AuthModal";

export default function ContactPage() {
  const [modalType, setModalType] = useState<"login" | "register" | null>(null);

  return (
    <>
      <div className={`landing-page-shell ${modalType ? "modal-open" : ""}`}>
        <Navbar
          onOpenLogin={() => setModalType("login")}
          onOpenRegister={() => setModalType("register")}
        />

        <main className="contact-page">
          <div className="container">
            <div className="contact-page-top">
              <Link href="/" className="back-home-btn">
                ← Back to Home
              </Link>
            </div>

            <div className="contact-page-box">
              <div className="contact-page-left">
                <h1>Contact Us</h1>
                <p>
                  We would love to hear from you. Reach out for questions,
                  partnerships, feedback, or travel-related support.
                </p>

                <div className="contact-info-list">
                  <p><strong>Email:</strong> hello@packpalz.com</p>
                  <p><strong>Phone:</strong> +94 77 000 0000</p>
                  <p><strong>Location:</strong> Sri Lanka</p>
                </div>
              </div>

              <div className="contact-page-right">
                <input type="text" placeholder="Your name" />
                <input type="email" placeholder="Your email" />
                <input type="text" placeholder="Subject" />
                <textarea rows={6} placeholder="Your message" />
                <button>Send Message</button>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      <AuthModal
        type={modalType}
        onClose={() => setModalType(null)}
        onSwitch={(type: "login" | "register") => setModalType(type)}
      />
    </>
  );
}