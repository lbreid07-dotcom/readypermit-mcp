# ReadyPermit MCP Server

> AI-powered property zoning, buildability, and ADU eligibility analysis for any U.S. address.

This MCP server connects AI assistants (Claude, ChatGPT, Cursor, VS Code, Windsurf) to [ReadyPermit](https://readypermit.ai) — instant property intelligence powered by 20+ government data sources.

## Tools

| Tool | Description |
|------|-------------|
| `analyze_property` | Full zoning & buildability analysis for any U.S. address |
| `check_adu_eligibility` | ADU (accessory dwelling unit) eligibility check |
| `check_flood_risk` | FEMA flood zone & environmental risk assessment |
| `compare_parcels` | Side-by-side comparison of 2-5 properties |
| `what_can_i_build` | Answer "what can I build here?" for any property |

## Quick Setup

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "readypermit": {
      "command": "npx",
      "args": ["-y", "readypermit-mcp"],
      "env": {
        "MAPBOX_TOKEN": "your-mapbox-token"
      }
    }
  }
}
```

### Cursor

Settings > Features > MCP > Add Server:
- Name: `readypermit`
- Command: `npx -y readypermit-mcp`

### ChatGPT Desktop

Settings > MCP Servers > Add Server > enter `npx -y readypermit-mcp`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MAPBOX_TOKEN` | Recommended | Mapbox API token for geocoding |
| `READYPERMIT_API_KEY` | Optional | ReadyPermit API key for full report data (coming soon) |

## What It Does

When an AI assistant user asks about property zoning, ADUs, flood risk, or buildability, the MCP tools:

1. Geocode the address via Mapbox
2. Return a structured property preview with key data points
3. Generate a deep link to the full ReadyPermit Buildability Report
4. The user gets their first report free — no signup required

## Example Prompts

- "Can I build an ADU at 742 Evergreen Terrace, Springfield, IL?"
- "What's the zoning for 123 Main St, Austin, TX?"
- "Is my property in a flood zone? 456 Oak Ave, Miami, FL"
- "Compare these 3 investment properties for buildability"
- "What can I build on my lot at 789 Pine St, Denver, CO?"

## About ReadyPermit

ReadyPermit replaces $2,000-$4,500 in zoning consultant fees with an instant Buildability Report:

- Buildability Score (0-100, letter-graded)
- Zoning analysis (FAR, setbacks, height limits, permitted uses)
- ADU eligibility and permit pathway
- Environmental risk (FEMA, EPA, wildfire, seismic)
- Comparable sales and market position

Covers all 50 U.S. states, 3,100+ counties. Data from 20+ government sources.

## License

MIT

## Links

- [ReadyPermit](https://readypermit.ai)
- [Report an Issue](https://github.com/lbreid07-dotcom/readypermit-mcp/issues)
- Built by [Galax Studios](https://galaxstudios.com)
