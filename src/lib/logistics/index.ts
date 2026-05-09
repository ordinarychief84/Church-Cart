import { env } from "@/lib/env";
import { mockProvider } from "./mock";
import type { LogisticsProvider } from "./types";

export function getLogisticsProvider(): LogisticsProvider {
  switch (env.LOGISTICS_PROVIDER) {
    case "mock":
      return mockProvider;
    // Future:
    // case "shipbubble": return shipbubbleProvider;
    // case "gig":        return gigProvider;
    // case "kwik":       return kwikProvider;
    default:
      return mockProvider;
  }
}

export type * from "./types";
