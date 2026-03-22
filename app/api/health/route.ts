/**
 * app/api/health/route.ts
 *
 * Health check endpoint for Railway (and any uptime/readiness probe).
 * Returns 200 OK when the server is running and ready to serve traffic.
 */

export const runtime = 'nodejs';

export async function GET() {
    return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
