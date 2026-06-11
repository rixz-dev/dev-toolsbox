// Dummy endpoint if needed for future extension. The modal is purely client-side.
export async function GET() {
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
