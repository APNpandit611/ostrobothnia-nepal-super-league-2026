import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetAdminMe } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { data, isLoading, isError } = useGetAdminMe({
    query: { retry: false, staleTime: 30_000 } as never
  });

  useEffect(() => {
    if (!isLoading && isError) {
      setLocation("/admin");
    }
  }, [isLoading, isError, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data?.isAdmin) {
    return null;
  }

  return <>{children}</>;
}
