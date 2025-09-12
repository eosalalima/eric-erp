import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <header className="row-start-1">
        <h1 className="text-2xl font-semibold">Sign in to your account</h1>
      </header>
      <main className="row-start-2 flex justify-center">
        <SignIn />
      </main>
      <footer className="row-start-3 text-sm text-center">
        <p>© 2024 Eric ERP</p>
      </footer>
    </div>
  );
}
