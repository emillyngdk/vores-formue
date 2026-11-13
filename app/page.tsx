import { DeepDive } from "@/components/home/DeepDive";
import { GrowthSources } from "@/components/home/GrowthSources";
import { Hero } from "@/components/home/Hero";
import { MoneyFlow } from "@/components/home/MoneyFlow";
import { Outro } from "@/components/home/Outro";
import { Peers } from "@/components/home/Peers";
import { Turning2028 } from "@/components/home/Turning2028";
import { YearByYear } from "@/components/home/YearByYear";
import { WhatIfBar } from "@/components/whatif/WhatIfBar";

export default function Home() {
  return (
    <main>
      <WhatIfBar />
      <Hero />
      <div className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6">
        <MoneyFlow />
        <YearByYear />
        <Turning2028 />
        <GrowthSources />
        <DeepDive />
        <Peers />
        <Outro />
      </div>
    </main>
  );
}
