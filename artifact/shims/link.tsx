import type { AnchorHTMLAttributes, ReactNode } from "react";
import { setPendingScenario } from "../route-state";

const toHash = (path: string) => (path === "/" || path === "" ? "overblik" : path.replace(/^\//, ""));

/** Erstatter next/link: hver side er en visning med sit eget #navn */
export default function Link({ href, children, onClick, ...rest }: { href: string; children?: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const [path, query] = href.split("?");
  return (
    <a
      {...rest}
      href={`#${toHash(path)}`}
      onClick={(e) => {
        if (query !== undefined) setPendingScenario(query);
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
