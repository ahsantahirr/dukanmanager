interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-2xl border-2 border-primary border-t-transparent" />
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
          <img src="/logo.svg" alt="" className="h-7 w-7" />
        </div>
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
