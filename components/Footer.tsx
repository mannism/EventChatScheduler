/**
 * Footer.tsx
 *
 * Server component — no "use client", no browser APIs.
 * Matches the labs.dianaismail.me footer: copyright left, portfolio link right.
 *
 * Border uses the same --border-subtle token values as labs:
 *   light → rgba(0,0,0,0.08)   (black/[0.08])
 *   dark  → rgba(255,255,255,0.08) (white/[0.08])
 *
 * Accent hover maps labs' --accent-blue to this app's cyan:
 *   light → cyan-600  dark → cyan-400
 */


export function Footer() {
    return (
        <footer className="mt-20 py-10 border-t border-black/[0.08] dark:border-white/[0.08]">
            <div className="container mx-auto px-4 flex justify-end font-mono text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} Diana Ismail. All rights reserved.</p>
            </div>
        </footer>
    )
}
