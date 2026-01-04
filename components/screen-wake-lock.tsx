import { useWakeLock } from "react-screen-wake-lock";
import { Button } from "@/components/ui/button";
import { Unlock, Lock } from "lucide-react";

export function ScreenWakeLock() {
  const { isSupported, released, request, release } = useWakeLock({
    onRequest: () => alert("Screen Wake Lock: requested!"),
    onError: () => alert("An error happened 💥"),
    onRelease: () => alert("Screen Wake Lock: released!"),
    reacquireOnPageVisible: true,
  });

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      onClick={() => (released === false ? release() : request())}
      variant="outline"
      size="sm"
    >
      {released === false ? (
        <Lock className="size-4" />
      ) : (
        <Unlock className="size-4" />
      )}
      Keep screen on
    </Button>
  );
}
