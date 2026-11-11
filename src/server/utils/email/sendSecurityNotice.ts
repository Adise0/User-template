import sendEmail from ".";
import getSecurityNoticeEmail from "./emailBuilders/securityNoticeEmail";
import { logEmailRequestError } from "../respondEmailRequestAccepted";

// Tells the account owner something sensitive happened. The action already went through by the
// time this runs, so it never waits for the email, and a failed notice is only logged.
const sendSecurityNotice = (to: string, title: string, message: string) => {
  sendEmail({
    html: getSecurityNoticeEmail(title, message),
    internalEmailName: "Security notice email",
    subject: title,
    to,
  }).catch((error) => logEmailRequestError("security notice", error));
};

export default sendSecurityNotice;
