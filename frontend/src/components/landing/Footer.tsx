import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-top">
        <div className="footer-brand">
          <div className="footer-logo-box">
            <div className="logo-icon">✦</div>
            <div>
              <h3>PackPalz</h3>
              <p>
                Your gateway to unforgettable journeys with AI-powered planning
                and social travel inspiration.
              </p>
            </div>
          </div>

          <div className="footer-socials">
            <span>f</span>
            <span>ig</span>
            <span>x</span>
            <span>yt</span>
          </div>
        </div>

        <div className="footer-links">
          <h4>Quick Links</h4>
          <a href="#home">Home</a>
          <a href="#about">About Us</a>
          <a href="#how-it-works">How It Works</a>
          <Link href="/contact">Contact Us</Link>
        </div>

        <div className="footer-contact">
          <h4>Get in Touch</h4>
          <p>Northern Sri Lanka</p>
          <p>+94 77 123 4567</p>
          <p>packpalz@gmail.com</p>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© 2026 PackPalz. All rights reserved.</p>
        <div className="footer-bottom-links">
          <span>Privacy Policy</span>
          <span>Terms & Conditions</span>
        </div>
      </div>
    </footer>
  );
}