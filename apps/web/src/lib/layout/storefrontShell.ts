/**
 * Matches header inner container — mobile `px-3`, desktop `md:px-6 lg:px-8`.
 * Width caps at `--content-max`, which equals 1440px at <=1440 (reference is
 * untouched) and grows fluidly above 1440 so wide screens fill out.
 */
export const STOREFRONT_SHELL_CLASS = "mx-auto w-full max-w-[var(--content-max)] px-3 md:px-6 lg:px-8";
