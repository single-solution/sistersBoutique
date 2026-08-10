import { Skeleton, SkeletonScreen } from "@/components/ui/Skeleton";
import { STOREFRONT_SHELL_CLASS } from "@/lib/layout/storefrontShell";

const CONTACT_FIELD_COUNT = 3;
const ADDRESS_CARD_COUNT = 2;

/** Profile placeholder — back link, header, contact card, saved addresses. */
export default function ProfileLoading() {
	return (
		<SkeletonScreen label="Loading profile" className={`${STOREFRONT_SHELL_CLASS} pb-24 pt-4 md:pb-16 md:pt-10`}>
			<Skeleton shape="text" className="h-3 w-28" />

			<div className="mt-2 space-y-2">
				<Skeleton shape="text" className="h-3 w-16" />
				<Skeleton shape="text" className="h-8 w-48 md:h-9" />
				<Skeleton shape="text" className="h-3 w-72 max-w-full" />
			</div>

			<div className="mt-5 rounded-[var(--radius-2xl)] border border-[var(--color-ink-100)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] md:mt-6 md:p-5">
				<Skeleton shape="text" className="h-3 w-20" />
				<div className="mt-3 grid gap-3 md:grid-cols-2">
					{Array.from({ length: CONTACT_FIELD_COUNT }).map((_, index) => (
						<div key={index} className="space-y-1.5">
							<Skeleton shape="text" className="h-3 w-24" />
							<Skeleton shape="pill" className="h-11 w-full" />
						</div>
					))}
				</div>
				<div className="mt-4 flex items-center justify-between gap-3">
					<Skeleton shape="text" className="h-3 w-48 max-w-[60%]" />
					<Skeleton shape="pill" className="h-9 w-32" />
				</div>
			</div>

			<div className="mt-5 flex items-end justify-between md:mt-6">
				<Skeleton shape="text" className="h-3 w-32" />
				<Skeleton shape="pill" className="h-9 w-28" />
			</div>

			<div className="mt-3 space-y-3">
				{Array.from({ length: ADDRESS_CARD_COUNT }).map((_, index) => (
					<div key={index} className="rounded-[var(--radius-2xl)] border border-[var(--color-ink-100)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] md:p-5">
						<div className="flex items-start gap-3">
							<Skeleton shape="block" className="size-8 shrink-0" />
							<div className="min-w-0 flex-1 space-y-2">
								<Skeleton shape="text" className="h-4 w-40" />
								<Skeleton shape="text" className="h-3 w-full max-w-xs" />
								<Skeleton shape="text" className="h-3 w-2/3 max-w-[14rem]" />
							</div>
						</div>
						<div className="mt-3 flex flex-wrap items-center gap-2">
							<Skeleton shape="pill" className="h-8 w-24" />
							<Skeleton shape="pill" className="h-8 w-20" />
						</div>
					</div>
				))}
			</div>
		</SkeletonScreen>
	);
}
