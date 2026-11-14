import type { Metadata } from "next";
import { PersonView } from "@/components/person/PersonView";

export const metadata: Metadata = { title: "Frederikke · Lyng Mandal Kapital" };

export default function Page() {
  return (
    <main>
      <PersonView who="frederikke" />
    </main>
  );
}
