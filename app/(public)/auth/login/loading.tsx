import { Loader2 } from "lucide-react";

export default function Loading() {
  // Você pode adicionar qualquer UI aqui, incluindo um Skeleton.
  // Por enquanto, um spinner simples resolverá o problema da build.
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );
}
