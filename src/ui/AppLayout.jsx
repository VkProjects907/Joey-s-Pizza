import Header from "./Header";
import SiteFooter from "./SiteFooter";

function AppLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col bg-stone-50">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-0">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}

export default AppLayout;
