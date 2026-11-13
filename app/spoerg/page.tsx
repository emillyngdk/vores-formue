import type { Metadata } from "next";
import { Chat } from "@/components/ask/Chat";

export const metadata: Metadata = { title: "Spørg Claude · Vores Formue" };

export default function Page() {
  return (
    <main>
      <Chat />
    </main>
  );
}
