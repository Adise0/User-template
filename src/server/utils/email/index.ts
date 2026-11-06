import nodemailer from "nodemailer";
import {
  emailMaxAttempts,
  emailRetryDelayInSeconds,
  emailTimeoutInSeconds,
} from "../../../data/serverConfig/server-config";
import logger from "../logger";
import EmailData from "./types";

const emailTimeoutInMs = emailTimeoutInSeconds * 1000;

const config = {
  host: "smtppro.zoho.eu",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
  connectionTimeout: emailTimeoutInMs,
  greetingTimeout: emailTimeoutInMs,
  socketTimeout: emailTimeoutInMs,
};

const from = process.env.EMAIL_ALIAS ?? process.env.EMAIL;

const transporter = nodemailer.createTransport(config);

const wait = (milliseconds: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

// A 5xx SMTP answer is a permanent rejection (eg. the address doesn't exist), retrying won't help.
const isPermanentFailure = (error: unknown) => {
  const { responseCode } = error as { responseCode?: number };
  return responseCode !== undefined && responseCode >= 500;
};

// Retries in memory on purpose. Every email carries a code or a link, so a queue stored in the
// database would keep working credentials at rest, which is what hashing the tokens prevents. If
// the process dies mid-retry the email is lost, and the user just asks for it again.
const sendEmail = async (emailData: EmailData, attempt = 1): Promise<void> => {
  const { internalEmailName, ...email } = emailData;

  try {
    await transporter.sendMail({ from, ...email });
  } catch (error) {
    const isLastAttempt = attempt >= emailMaxAttempts;

    logger.warn({ err: error, attempt, internalEmailName }, "Failed to send email");

    if (isLastAttempt || isPermanentFailure(error)) {
      throw error;
    }

    await wait(emailRetryDelayInSeconds * attempt * 1000);
    await sendEmail(emailData, attempt + 1);
  }
};

export default sendEmail;
