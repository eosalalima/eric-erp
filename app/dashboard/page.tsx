import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div className="p-8">
      <h1 className="text-2xl">Hello, {user?.firstName ?? "User"}!</h1>
    </div>
  );
}
