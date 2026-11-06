import getBaseEmail from "./baseEmail";

// Only ever called with fixed text from the code, never with anything a user typed.
const getSecurityNoticeEmail = (title: string, message: string) =>
  getBaseEmail(title, `<p>${message}</p>`);

export default getSecurityNoticeEmail;
