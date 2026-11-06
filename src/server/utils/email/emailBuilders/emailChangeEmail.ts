import getBaseEmail from "./baseEmail";

const getEmailChangeEmail = (emailChangeToken: string) =>
  getBaseEmail(
    "Confirm your new email",
    `<p>Confirm this address to start using it on your account. If you didn't ask for this, you can ignore this email.</p>
        <a href="${process.env.FRONTEND_URL}/auth/confirmEmailChange/${emailChangeToken}" class="button">Confirm my new email</a>`,
  );

export default getEmailChangeEmail;
