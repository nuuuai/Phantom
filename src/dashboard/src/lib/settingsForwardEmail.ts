/** Re-export shared validation (API `PATCH /user/me` uses the same rules). */
export {
  FORWARD_EMAIL_RE,
  isValidForwardEmailInput,
} from "@phantom/shared";
