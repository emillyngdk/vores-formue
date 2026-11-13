/** Danske talformater: 3.511.015 kr. · 6,41 mio. kr. · 4,77 % */
const int = new Intl.NumberFormat("da-DK", { maximumFractionDigits: 0 });

export const kr = (n: number) => `${int.format(Math.round(n))} kr.`;

export const signedKr = (n: number) => `${n < 0 ? "−" : "+"}${int.format(Math.abs(Math.round(n)))} kr.`;

export const mio = (n: number, decimals = 2) =>
  `${(n / 1e6).toLocaleString("da-DK", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} mio. kr.`;

export const pct = (n: number, decimals = 2) =>
  `${(n * 100).toLocaleString("da-DK", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} %`;

/** 7,00 mio. (uden kr.), til knapper og små felter */
export const mioTal = (n: number, decimals = 2) =>
  `${(n / 1e6).toLocaleString("da-DK", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} mio.`;

export const tal = (n: number) => int.format(Math.round(n));
