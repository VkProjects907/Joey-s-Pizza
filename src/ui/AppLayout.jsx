import Header from "./Header";
import CartOverview from "../features/cart/CartOverview";

function AppLayout({ children }) {
  return (
    <div className="grid h-screen grid-rows-[auto_1fr_auto]">
      <Header />

      <div className="overflow-scroll">
        <main className="mx-auto max-w-3xl">{children}</main>
      </div>

      <CartOverview />
    </div>
  );
}

export default AppLayout;
