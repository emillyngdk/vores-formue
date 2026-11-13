import type { Metadata } from "next";
import { Lab } from "@/components/lab/Lab";

export const metadata: Metadata = { title: "Scenarie-lab · Kistebunden" };

export default function Page() {
  return (
    <main>
      <Lab />
    </main>
  );
}
