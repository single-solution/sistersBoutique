/**
 * Public surface of `@store/shared`.
 *
 * Framework-light (Next + clsx, no React), app-agnostic utilities used by
 * BOTH the storefront and the admin app. Anything that's only one app's
 * concern lives inside that app's `src/lib`, never here.
 */

export * from "./ai/llmCompletion";
export * from "./wireCoercion";
export * from "./icons";
export * from "./classNames";
export * from "./colorContrast";
export * from "./constants";
export * from "./escapeRegex";
export * from "./formatters";
export * from "./floatingPosition";
export * from "./logger";
export * from "./loyalty";
export * from "./phone";
export * from "./integration/integrationSettingsSchema";
export * from "./integration/resolveIntegration";
export * from "./integrationStatus";
export * from "./orderLifecycle";
export * from "./publicSiteUrl";
export * from "./rateLimit";
export * from "./responseHelpers";
export * from "./seo/composeSeoMeta";
export * from "./seo/merchantFeed";
export * from "./seo/intentSurface";
export * from "./seo/intentSurfaceAi";
export * from "./seo/glossarySeoAi";
export * from "./seo/glossarySeoFacts";
export * from "./seo/productSeoAi";
export * from "./seo/productSeoFacts";
export * from "./seo/productSeoFaq";
export * from "./seo/seoChecklist";
export * from "./seo/seoMeta";
export * from "./seo/titleTemplate";
export * from "./attributeOption";
export * from "./attributeVisibility";
export * from "./productAttributeConfig";
export * from "./catalog/productImages";
export * from "./catalog/variantAvailability";
export * from "./checkout/paymentTotals";
export * from "./checkout/shippingTotals";
export * from "./checkout/paymentInstructions";
export * from "./slug";
export * from "./storage/magicBytes";
export * from "./storage/providers";
export * from "./storage/types";
export * from "./storage/urlPolicy";
export * from "./sanitizePolicyHtml";
export * from "./storeSettings";
export * from "./structuredContent";
export * from "./types";
export * from "./customerAddresses";
export * from "./validation";
export * from "./warranty";
export * from "./youtube";
export * from "./pricing/cartOfferLock";
export * from "./pricing/offerDisplay";
export * from "./pricing/offerTypes";
export * from "./pricing/offerEvaluator";
export * from "./pricing/offerMatching";
export * from "./pricing/offerSchedule";
export * from "./pricing/offerScope";
export * from "./pricing/toActiveOffer";
