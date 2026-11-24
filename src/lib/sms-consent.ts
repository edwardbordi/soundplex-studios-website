import { LEGAL_ENTITY } from "./site-config";

/**
 * The text-message consent wording (A2P), shown next to the checkbox wherever someone gives a
 * mobile number for texts (the Ask widget's "Text George" and booking). The short form carriers
 * accept: who's texting, what for, frequency, rates, STOP and HELP, with the Privacy Policy and
 * Terms as links (Ed, 2026-11-24: the long version didn't fit the Ask panel).
 * TODO (George): confirm SoundPlex's legal business name for LEGAL_ENTITY in site-config.
 */
export const SMS_CONSENT_LEAD = `I agree to receive texts from ${LEGAL_ENTITY}, including replies and appointment reminders. Msg frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help.`;

/** Exactly what's shown (the links written out), saved on the HighLevel contact as proof. */
export const SMS_CONSENT_TEXT = `${SMS_CONSENT_LEAD} Privacy Policy (soundplexstudios.com/privacy) · Terms (soundplexstudios.com/terms)`;
