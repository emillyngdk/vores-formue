import { MotionConfig } from "motion/react";
import { ScenarioProvider } from "@/lib/scenario";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ScenarioProvider>{children}</ScenarioProvider>
    </MotionConfig>
  );
}
