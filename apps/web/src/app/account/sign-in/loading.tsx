import { Skeleton, SkeletonScreen } from "@/components/ui/Skeleton";
import { STOREFRONT_SHELL_CLASS } from "@/lib/layout/storefrontShell";

/** Sign-in placeholder — centered hero + credentials card, matches live layout. */
export default function SignInLoading() {
	return (
		<SkeletonScreen label="Loading sign in" className={`storefront-page-center ${STOREFRONT_SHELL_CLASS} w-full`}>
			<div className="w-full max-w-md">
				<div className="flex flex-col items-center text-center">
					<Skeleton shape="text" className="h-3 w-40" />
					<Skeleton shape="text" className="mt-4 h-11 w-64 max-w-full" />
					<Skeleton shape="text" className="mt-4 h-4 w-full max-w-xs" />
				</div>

				<div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-ink-100)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] md:mt-8 md:p-6">
					<div className="space-y-4">
						<div className="space-y-1.5">
							<Skeleton shape="text" className="h-3 w-20" />
							<Skeleton shape="pill" className="h-11 w-full" />
						</div>
						<div className="space-y-1.5">
							<Skeleton shape="text" className="h-3 w-24" />
							<Skeleton shape="pill" className="h-11 w-full" />
						</div>
						<Skeleton shape="pill" className="h-11 w-full" />
					</div>
				</div>

				<div className="mt-4 flex flex-col items-center gap-2">
					<Skeleton shape="text" className="h-3 w-48" />
					<Skeleton shape="text" className="h-3 w-40" />
				</div>
			</div>
		</SkeletonScreen>
	);
}
