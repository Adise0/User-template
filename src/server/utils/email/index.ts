import nodemailer from "nodemailer";
import debug from "debug";
import chalk from "chalk";
import EmailData from "./types";

const debugToConsole = debug("podrida:mailService");

const config = {
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
};

const from = process.env.EMAIL;

const transporter = nodemailer.createTransport(config);

const sendEmail = (emailData: EmailData): Promise<void> =>
  new Promise((resolve, reject) => {
    const emailToSend = { from, ...emailData };

    transporter.sendMail(emailToSend, (error) => {
      if (error) {
        reject();
        debugToConsole(
          chalk.redBright(
            `Error while sending ${emailData.internalEmailName} email to ${emailToSend.to}`
          )
        );
        return;
      }
      resolve();
    });
  });

export default sendEmail;
