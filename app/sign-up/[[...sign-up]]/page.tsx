import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <SignUp appearance={{ elements: { formButtonPrimary: 'bg-blue-600 hover:bg-blue-500', card: 'bg-zinc-900 border border-zinc-800' } }} />
    </div>
  );
}