import { handleApi } from "@/lib/integrations/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ resource: string }> }) {
  return handleApi(req, (await params).resource);
}
