import type { Metadata } from "next";
import { Chat } from "@/components/ask/Chat";

export const metadata: Metadata = { title: "Spørg Claude · Lyng Mandal Kapital" };

export default function Page() {
  return (
    <main>
      <Chat />
    </main>
  );
}
