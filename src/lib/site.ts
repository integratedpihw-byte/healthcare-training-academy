/** Public contact and legal identity, configured per environment (never secrets). */
export const supportEmail = () => process.env.SUPPORT_EMAIL?.trim() || null;
export const legalEntity = () => process.env.LEGAL_ENTITY_NAME?.trim() || "Complete Healthcare Training Academy";
