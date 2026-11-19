import AuthForm from "../../features/user/AuthForm";

export const metadata = { title: "Create account | Joey's Pizza" };

export default function SignupPage() {
  return (
    <section className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <p className="text-sm text-stone-600">Your password is stored as a bcrypt hash. You can still order as a guest without creating an account.</p>
      <AuthForm mode="register" />
    </section>
  );
}
