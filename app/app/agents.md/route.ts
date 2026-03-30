import {AGENT_GUIDE_MARKDOWN} from "@/lib/agent-guide";

export function GET() {
  return new Response(AGENT_GUIDE_MARKDOWN, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
