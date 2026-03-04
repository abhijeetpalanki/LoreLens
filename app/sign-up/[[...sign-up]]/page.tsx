import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary:
              "bg-indigo-600 hover:bg-indigo-700 text-sm normal-case",
            card: "bg-neutral-900 border border-neutral-800 shadow-xl",
            headerTitle: "text-neutral-100",
            headerSubtitle: "text-neutral-400",
            socialButtonsBlockButton:
              "border-neutral-800 hover:bg-neutral-800 text-neutral-300",
            dividerLine: "bg-neutral-800",
            dividerText: "text-neutral-500",
            formFieldLabel: "text-neutral-300",
            formFieldInput:
              "bg-neutral-950 border-neutral-800 text-neutral-100 focus:ring-indigo-500",
            footerActionText: "text-neutral-400",
            footerActionLink: "text-indigo-400 hover:text-indigo-300",
          },
        }}
      />
    </div>
  );
}
