// Stands in for nodemailer in every test (see moduleNameMapper in jest.config.js).

interface SentEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const mailbox = {
  sent: [] as SentEmail[],
  attempts: 0,
  failuresLeft: 0, // How many of the next sends fail.
  failureCode: undefined as number | undefined,
  delayInMs: 0,
};

export const resetMailbox = () => {
  mailbox.sent = [];
  mailbox.attempts = 0;
  mailbox.failuresLeft = 0;
  mailbox.failureCode = undefined;
  mailbox.delayInMs = 0;
};

const sendMail = async (email: SentEmail) => {
  mailbox.attempts += 1;

  if (mailbox.delayInMs) {
    await new Promise((resolve) => {
      setTimeout(resolve, mailbox.delayInMs);
    });
  }

  if (mailbox.failuresLeft > 0) {
    mailbox.failuresLeft -= 1;
    throw Object.assign(new Error("SMTP down"), { responseCode: mailbox.failureCode });
  }

  mailbox.sent.push(email);
};

export default { createTransport: () => ({ sendMail }) };
