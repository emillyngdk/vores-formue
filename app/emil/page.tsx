import type { Metadata } from "next";
import { PersonView } from "@/components/person/PersonView";

export const metadata: Metadata = { title: "Emil · Kistebunden" };

export default function Page() {
  return (
    <main>
      <PersonView who="emil" />
    </main>
  );
}
