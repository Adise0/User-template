import getBaseEmail, { paragraph } from "./baseEmail";

// Tells the owner something sensitive happened on their account. Only ever called with fixed text
// from the code, never with anything a user typed.
const getSecurityNoticeEmail = (title: string, message: string) =>
  getBaseEmail(title, paragraph(message));

export default getSecurityNoticeEmail;
