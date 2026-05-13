import Logo from '../Logo';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 dark:bg-black">
      <div className="w-full max-w-2xl">
        {/* Progress bar could go here */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="text-xl font-bold tracking-tight dark:text-white">Topper101</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
