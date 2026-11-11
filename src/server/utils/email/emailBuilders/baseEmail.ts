import { appName } from "../../../../data/serverConfig/server-config";

// The one layout every email uses: a title and a white card on a light grey page. Styles are
// inline and the layout is a single table on purpose, it's what renders the same in Gmail, Outlook
// and Apple Mail (many clients drop <style> blocks, web fonts, flexbox and gradients). Change the
// colors here to rebrand every email at once.
//
// Everything put in an email comes from the code (tokens, codes, fixed text), never from what a
// user typed, so nothing here is escaped.

const colors = {
  page: "#f4f4f5",
  card: "#ffffff",
  text: "#27272a",
  muted: "#71717a",
  accent: "#18181b",
  border: "#e4e4e7",
};

const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const paragraph = (text: string) =>
  `<p style="margin: 0 0 16px; color: ${colors.text}; font-size: 15px; line-height: 1.6;">${text}</p>`;

export const smallText = (text: string) =>
  `<p style="margin: 0 0 12px; color: ${colors.muted}; font-size: 13px; line-height: 1.5;">${text}</p>`;

// The main action, with the address written out under it for clients that block buttons.
export const button = (href: string, label: string) => `
  <p style="margin: 24px 0;">
    <a href="${href}" style="display: inline-block; padding: 12px 24px; border-radius: 6px; background-color: ${colors.accent}; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none;">${label}</a>
  </p>
  ${smallText(`Button not working? Paste this address into your browser:<br /><a href="${href}" style="color: ${colors.muted}; word-break: break-all;">${href}</a>`)}`;

// A one-time code, big enough to read and copy. The class is what the tests look for.
export const code = (value: string) =>
  `<p style="margin: 24px 0; color: ${colors.text}; font-family: Menlo, Consolas, monospace; font-size: 28px; font-weight: 700; letter-spacing: 6px;" class="otp-code">${value}</p>`;

// The "wasn't you?" part, under a line, for emails that someone else may have triggered.
export const notYou = (text: string, href: string, label: string) => `
  <hr style="margin: 24px 0; border: none; border-top: 1px solid ${colors.border};" />
  ${paragraph(`<strong>Wasn't you?</strong> ${text}`)}
  <p style="margin: 0 0 16px;"><a href="${href}" style="color: ${colors.accent}; font-size: 14px;">${label}</a></p>`;

// DEBUG: a link straight to the API, for testing without a frontend. Remove every use of it before
// going live (see SECURITY_SETTINGS.md): email scanners open links, and these act on a plain GET.
export const debugLink = (href: string) =>
  smallText(
    `Debug, no frontend yet: <a href="${href}" style="color: ${colors.muted};">hit the API directly</a>`,
  );

const getBaseEmail = (title: string, content: string) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${colors.page}; font-family: ${font};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.page};">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px;">
            <tr>
              <td style="padding: 0 0 16px; color: ${colors.muted}; font-family: ${font}; font-size: 14px; font-weight: 600;">${appName}</td>
            </tr>
            <tr>
              <td style="padding: 32px; border-radius: 8px; background-color: ${colors.card}; font-family: ${font};">
                <h1 style="margin: 0 0 16px; color: ${colors.text}; font-size: 20px; font-weight: 700;">${title}</h1>
                ${content}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export default getBaseEmail;
