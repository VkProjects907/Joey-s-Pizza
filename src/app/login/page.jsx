import AuthForm from "../../features/user/AuthForm";

export const metadata = { title: "Sign in | Joey's Pizza" };

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-sm text-stone-600">Sign in to see orders placed while you are signed in. Guest ordering remains available.</p>
      <AuthForm mode="login" />
    </section>
  );
}
