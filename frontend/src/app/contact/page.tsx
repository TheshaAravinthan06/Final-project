import Link from "next/link";

export default function ContactPage() {
  return (
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
              <p><strong>Email:</strong> hello@tripai.com</p>
              <p><strong>Phone:</strong> +94 77 000 0000</p>
              <p><strong>Location:</strong> Sri Lanka</p>
            </div>
          </div>

          <div className="contact-page-right">
            <input type="text" placeholder="Your name" />
            <input type="email" placeholder="Your email" />
            <input type="text" placeholder="Subject" />
            <textarea rows={6} placeholder="Your message"></textarea>
            <button>Send Message</button>
          </div>
        </div>
      </div>
    </main>
  );
}