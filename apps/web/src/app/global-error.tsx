"use client";

/**
 * Last-resort error boundary that fires when even the root layout throws.
 *
 * This component renders its own `<html>` / `<body>` because Next can no
 * longer rely on the broken layout. Keep styling inline with no Tailwind so
 * this always renders even when the rest of the app's import graph fails.
 */
import { resolvePublicErrorDisplay } from "@/lib/errors/publicErrorMessage";

interface GlobalErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

/* Every hex literal below is mirrored from the official palette so this
   boundary stays brand-correct even when no CSS variables are loaded.
     #f6ede9 -> --color-canvas
     #281b21 -> --color-ink-900
     #7d1f48 -> --color-accent-deep / --color-accent-500
     #5d4852 -> --color-ink-600
     #705963 -> --color-ink-500
     #fff0f5 -> --color-accent-50 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
	const copy = resolvePublicErrorDisplay(error);

	return (
		<html lang="en">
			<body
				style={{
					margin: 0,
					fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif",
					background: "#f6ede9",
					color: "#281b21",
				}}
			>
				<main
					style={{
						minHeight: "100vh",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						padding: "2rem",
					}}
				>
					<div style={{ textAlign: "center", maxWidth: "32rem" }}>
						<p
							style={{
								fontSize: "0.7rem",
								letterSpacing: "0.25em",
								textTransform: "uppercase",
								color: "#7d1f48",
							}}
						>
							{copy.eyebrow}
						</p>
						<h1 style={{ marginTop: "0.5rem", fontSize: "2rem" }}>{copy.title}</h1>
						<p style={{ marginTop: "0.75rem", color: "#5d4852" }}>{copy.detail}</p>
						{error.digest ? (
							<p
								style={{
									marginTop: "0.75rem",
									fontSize: "0.75rem",
									color: "#705963",
								}}
							>
								Reference: <code>{error.digest}</code>
							</p>
						) : null}
						<button
							type="button"
							onClick={reset}
							style={{
								marginTop: "1.5rem",
								padding: "0.6rem 1.25rem",
								background: "#7d1f48",
								color: "#fff0f5",
								border: "none",
								borderRadius: "12px",
								fontWeight: 600,
								cursor: "pointer",
							}}
						>
							Retry
						</button>
					</div>
				</main>
			</body>
		</html>
	);
}
