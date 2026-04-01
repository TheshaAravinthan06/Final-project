import Link from "next/link";

type NavbarProps = {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
};

export default function Navbar({
  onOpenLogin,
  onOpenRegister,
}: NavbarProps) {
  return (
    <header className="navbar-wrap">
      <div className="container navbar">
        <div className="logo-area">
          <div className="logo-icon">✦</div>
          <div>
            <h2 className="logo-title">PackPalz</h2>
            <p className="logo-sub">Travel with meaning</p>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#about">About Us</a>
          <Link href="/contact">Contact Us</Link>

          <button className="nav-text-btn" onClick={onOpenLogin}>
            Login
          </button>

          <button className="nav-main-btn" onClick={onOpenRegister}>
            Let&apos;s Plan
          </button>
        </nav>
      </div>
    </header>
  );
}