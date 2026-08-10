/**
 * Validate a size-chart reference sent from an editor. Callers must have an
 * active DB connection. Returns the id to persist (or `null` to clear the
 * reference) or a validation error string.
 */
import { isValidId } from "@store/shared";
import { SizeChart } from "@store/db";

export type SizeChartReferenceResult = { value: string | null } | { error: string };

export async function resolveSizeChartReference(input: unknown): Promise<SizeChartReferenceResult> {
	if (input === null || input === "") {
		return { value: null };
	}
	if (typeof input === "string" && isValidId(input)) {
		const exists = await SizeChart.exists({ _id: input });
		if (!exists) {
			return { error: "Selected size chart does not exist." };
		}
		return { value: input };
	}
	return { error: "Invalid size chart." };
}
