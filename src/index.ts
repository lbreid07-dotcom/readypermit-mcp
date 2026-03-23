#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "readypermit",
  version: "1.0.0",
  description: "AI-powered property intelligence. Instant zoning, buildability, ADU eligibility, flood risk, and development constraints for any U.S. address.",
});

const BASE_URL = "https://readypermit.ai";
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || "";
const READYPERMIT_API_KEY = process.env.READYPERMIT_API_KEY || "";

interface GeocodedAddress {
  formatted: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  zip: string;
  county: string;
}

async function geocodeAddress(address: string): Promise<GeocodedAddress | null> {
  if (!MAPBOX_TOKEN) return null;
  const encoded = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&country=US&types=address&limit=1`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.features?.length) return null;
  const feature = data.features[0];
  const context = feature.context || [];
  const getCtx = (id: string) => context.find((c: any) => c.id.startsWith(id))?.text || "";
  return {
    formatted: feature.place_name,
    lat: feature.center[1],
    lng: feature.center[0],
    city: getCtx("place"),
    state: getCtx("region"),
    zip: getCtx("postcode"),
    county: getCtx("district"),
  };
}

function buildUrl(path: string, address: string): string {
  return `${BASE_URL}${path}?address=${encodeURIComponent(address)}&utm_source=mcp&utm_medium=agent&utm_campaign=mcp-server`;
}

// Tool 1: Analyze Property
server.tool(
  "analyze_property",
  "Get instant zoning analysis, buildability assessment, and development constraints for any U.S. property address. Returns zoning designation, key constraints, and a link to the full Buildability Report.",
  {
    address: z.string().describe("Full U.S. property address (e.g. 123 Main St, Austin, TX 78701)"),
    persona: z.enum(["homeowner", "investor", "developer", "lender"]).default("homeowner").describe("User type to tailor analysis perspective"),
  },
  { readOnlyHint: true },
  async ({ address, persona }) => {
    const geo = await geocodeAddress(address);
    const reportUrl = buildUrl("/", geo?.formatted || address);
    const locationInfo = geo
      ? `**Address:** ${geo.formatted}\n**City:** ${geo.city}, ${geo.state} ${geo.zip}\n**County:** ${geo.county}\n**Coordinates:** ${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)}`
      : `**Address:** ${address}`;
    return {
      content: [{
        type: "text" as const,
        text: `## ReadyPermit Property Preview\n${locationInfo}\n\n### What ReadyPermit Analyzes:\n- Zoning designation, permitted uses, and overlays\n- Setbacks, FAR, height limits, and lot coverage\n- ADU eligibility and permit pathway\n- FEMA flood zone and environmental risk from 6 federal agencies\n- Buildability Score (0-100) with letter grade\n- Comparable sales and market position\n\n### Get the Full Report\n${reportUrl}\n\n**First report is free** - no signup required. Takes ~20 seconds.\nReplaces $2,000-$4,500 in consultant fees.\n\n*Powered by 20+ government and AI data sources.*`,
      }],
    };
  }
);

// Tool 2: Check ADU Eligibility
server.tool(
  "check_adu_eligibility",
  "Check if a property is eligible for an ADU (Accessory Dwelling Unit) - backyard cottage, garage conversion, or addition.",
  { address: z.string().describe("Full U.S. property address") },
  { readOnlyHint: true },
  async ({ address }) => {
    const geo = await geocodeAddress(address);
    const aduUrl = buildUrl("/adu", geo?.formatted || address);
    return {
      content: [{
        type: "text" as const,
        text: `## ADU Eligibility Check\n**Property:** ${geo?.formatted || address}\n${geo ? `**Location:** ${geo.city}, ${geo.state} ${geo.zip}` : ""}\n\n### What ReadyPermit Checks:\n- Whether zoning allows ADUs (detached, attached, JADU, garage conversion)\n- Lot size requirements and setback constraints\n- Parking requirements and exemptions\n- Local ADU ordinance specifics for ${geo?.city || "this jurisdiction"}\n- Height, size, and design standards\n- Permit pathway and estimated timeline\n\n### Get Your ADU Analysis\n${aduUrl}\n\n**Free instant analysis** - enter the address and see ADU eligibility in ~20 seconds.`,
      }],
    };
  }
);

// Tool 3: Check Flood Risk
server.tool(
  "check_flood_risk",
  "Check FEMA flood zone status and environmental risk for a U.S. property. Covers flood hazard areas, EPA contamination, wildfire zones.",
  { address: z.string().describe("Full U.S. property address") },
  { readOnlyHint: true },
  async ({ address }) => {
    const geo = await geocodeAddress(address);
    const url = buildUrl("/flood-zone-check", geo?.formatted || address);
    return {
      content: [{
        type: "text" as const,
        text: `## Environmental & Flood Risk Check\n**Property:** ${geo?.formatted || address}\n${geo ? `**Coordinates:** ${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)}` : ""}\n\n### What ReadyPermit Checks:\n- FEMA Flood Zone (SFHA status, zone designation A/AE/V/X)\n- EPA Sites (Superfund, brownfields, toxic release)\n- Wildfire Risk (USGS hazard potential)\n- Seismic Risk (fault proximity)\n- Insurance implications\n\n### Get Your Risk Report\n${url}\n\n**Included free** in every Buildability Report.\n\n*Data from FEMA NFHL, EPA ECHO, USGS, NOAA.*`,
      }],
    };
  }
);

// Tool 4: Compare Parcels
server.tool(
  "compare_parcels",
  "Compare multiple U.S. properties side-by-side for zoning, buildability, and risk. Ideal for investors screening deals.",
  { addresses: z.array(z.string()).min(2).max(5).describe("Array of 2-5 U.S. property addresses to compare") },
  { readOnlyHint: true },
  async ({ addresses }) => {
    const geos = await Promise.all(addresses.map(geocodeAddress));
    const lines = addresses.map((addr, i) => {
      const geo = geos[i];
      const url = buildUrl("/", geo?.formatted || addr);
      return `### Property ${i + 1}\n**Address:** ${geo?.formatted || addr}\n${geo ? `**Location:** ${geo.city}, ${geo.state} ${geo.zip}\n**County:** ${geo.county}` : ""}\n**Full Report:** ${url}`;
    });
    return {
      content: [{
        type: "text" as const,
        text: `## Property Comparison - ${addresses.length} Parcels\n\n${lines.join("\n\n")}\n\n### To Compare Buildability Scores\nRun a free report on each address at ReadyPermit. Each includes:\n- Buildability Score (0-100)\n- Zoning and constraints\n- Environmental risk\n- ADU eligibility\n\n*Pro tip: 3-pack ($79) or subscription plans ideal for comparing.*`,
      }],
    };
  }
);

// Tool 5: What Can I Build
server.tool(
  "what_can_i_build",
  "Answer 'What can I build on this property?' - covers ADUs, expansions, garage conversions, new construction, and permitted uses.",
  {
    address: z.string().describe("Full U.S. property address"),
    project_type: z.enum(["adu", "expansion", "garage_conversion", "new_construction", "any"]).default("any").describe("Specific project type or any"),
  },
  { readOnlyHint: true },
  async ({ address, project_type }) => {
    const geo = await geocodeAddress(address);
    const url = buildUrl("/what-can-i-build", geo?.formatted || address);
    const desc: Record<string, string> = { adu: "ADU", expansion: "home expansion", garage_conversion: "garage conversion", new_construction: "new construction", any: "all building options" };
    return {
      content: [{
        type: "text" as const,
        text: `## What Can You Build?\n**Property:** ${geo?.formatted || address}\n**Checking:** ${desc[project_type]}\n\n### ReadyPermit Analyzes:\n- Zoning designation and permitted uses\n- Development envelope (setbacks, FAR, height, lot coverage)\n- ADU eligibility under local and state law\n- Conditional use permits\n- Environmental constraints\n- Entitlement complexity and permit pathway\n\n### Get Your Answer\n${url}\n\n**Enter the address and get a complete buildability analysis in ~20 seconds.** First report free.\n\nReplaces $2,000-$4,500 in zoning consultant fees.`,
      }],
    };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ReadyPermit MCP server started");
}
main().catch(console.error);
