import Sidebar from "@/components/home/Sidebar";
import "@/styles/home.scss";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="app-shell">
      <Sidebar />
      <section className="app-shell__content">{children}</section>
    </main>
  );
}