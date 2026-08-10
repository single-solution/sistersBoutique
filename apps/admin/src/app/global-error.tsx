"use client";

interface GlobalErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function AdminGlobalError({ error, reset }: GlobalErrorProps) {
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
								color: "#b91c1c",
							}}
						>
							Critical error
						</p>
						<h1 style={{ marginTop: "0.5rem", fontSize: "2rem" }}>The admin app failed to load.</h1>
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
								borderRadius: "9999px",
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
