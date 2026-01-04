import { useWakeLock } from "react-screen-wake-lock";
import { Button } from "@/components/ui/button";
import { Unlock, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ScreenWakeLock() {
  const { toast } = useToast();

  const { isSupported, released, request, release } = useWakeLock({
    onRequest: () =>
      toast({ description: "Screen will stay on while cooking" }),
    onError: () =>
      toast({
        variant: "destructive",
        description: "Couldn't enable wake lock",
      }),
    onRelease: () => {}, // Silent release, no notification needed
    reacquireOnPageVisible: true,
  });
  if (!isSupported) {
    return null;
  }

  const isActive = released === false;

  return (
    <Button
      onClick={() => (released === false ? release() : request())}
      variant="outline"
      size="sm"
      aria-pressed={isActive}
    >
      {isActive ? <Lock className="size-4" /> : <Unlock className="size-4" />}
      {isActive ? "Screen on" : "Keep screen on"}
    </Button>
  );
}
