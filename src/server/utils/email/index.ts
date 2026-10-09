
import nodemailer from "nodemailer";
import debug from "debug";
import chalk from "chalk";
import EmailData from "./types";

const debugToConsole = debug("user-template:mailService");

const config = {
  host: "smtppro.zoho.eu",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
};

const from = process.env.EMAIL_ALIAS ?? process.env.EMAIL;

const transporter = nodemailer.createTransport(config);

const sendEmail = (emailData: EmailData): Promise<void> =>
  new Promise((resolve, reject) => {
    const emailToSend = { from, ...emailData };

    transporter.sendMail(emailToSend, (error) => {
      if (error) {
        reject(error);
        debugToConsole(
          chalk.redBright(
            `Error while sending ${emailData.internalEmailName} email to ${emailToSend.to}: \n`
          ),
          chalk.whiteBright(error.message)
        );
        return;
      }
      resolve();
    });
  });

export default sendEmail;
