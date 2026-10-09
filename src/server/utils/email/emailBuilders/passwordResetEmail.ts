const getPasswordResetEmail = (resetPasswordToken: string) => `

  <head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <style>
      body {
        margin: 0;
        padding: 32px 16px;
        background-color: #f3f1ec;
        font-family: "Poppins", sans-serif;
      }

      .page {
        width: 100%;
        display: flex;
        justify-content: center;
      }

      .card {
        width: 100%;
        max-width: 480px;
        background-color: #ffffff;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0px 10px 30px rgba(20, 40, 30, 0.12);
      }

      .header {
        padding: 36px 30px 32px;
        text-align: center;
        background: linear-gradient(135deg, #0f3d2e 0%, #1f5f44 100%);
        color: #ffffff;
      }

      .suits {
        font-size: 20px;
        letter-spacing: 10px;
        color: #d4af37;
        margin-bottom: 10px;
      }

      .logo {
        font-weight: 700;
        font-size: 15px;
        letter-spacing: 3px;
        text-transform: uppercase;
        color: #cfe8db;
        margin-bottom: 18px;
      }

      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
      }

      .body {
        padding: 32px 30px 8px;
      }

      .body p {
        margin: 0 0 24px;
        color: #5c5a52;
        font-size: 15px;
        line-height: 1.6;
        text-align: center;
      }

      .cta-wrapper {
        text-align: center;
        margin-bottom: 8px;
      }

      .reset-button {
        display: inline-block;
        background-color: #d4af37;
        color: #163a2a !important;
        font-family: inherit;
        font-weight: 700;
        font-size: 15px;
        text-decoration: none;
        padding: 14px 32px;
        border-radius: 999px;
        box-shadow: 0px 8px 20px rgba(212, 175, 55, 0.35);
      }

      .fallback-link {
        margin-top: 18px;
        font-size: 12px;
        color: #a8a397;
        text-align: center;
        word-break: break-all;
      }

      .fallback-link a {
        color: #1f5f44;
      }

      .divider {
        height: 1px;
        background-color: #ece9e1;
        margin: 28px 30px;
      }

      h2 {
        font-size: 14px;
        font-weight: 700;
        color: #1f5f44;
        margin: 0 0 10px;
      }

      .not-you {
        padding: 0 30px 24px;
        text-align: center;
      }

      .not-you p {
        margin: 0 0 14px;
        color: #8a857a;
        font-size: 13px;
        line-height: 1.5;
        text-align: center;
      }

      .cancel-link {
        color: #c0392b;
        font-weight: 600;
        font-size: 13px;
        text-decoration: underline;
      }

      .debug-note {
        margin: 0 30px 28px;
        padding: 12px 14px;
        border: 1px dashed #c9c4b6;
        border-radius: 10px;
        text-align: center;
      }

      .debug-note p {
        margin: 0 0 8px;
        color: #a8a397;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        text-align: center;
      }

      .debug-link {
        display: inline-block;
        font-size: 12px;
        font-weight: 600;
        color: #5c5a52;
        text-decoration: none;
        border-bottom: 1px dashed #a8a397;
      }

      .footer {
        padding: 10px 30px 30px;
        text-align: center;
        font-size: 12px;
        color: #b4af9f;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="card">
        <div class="header">
          <div class="suits">&spades; &hearts; &diams; &clubs;</div>
          <div class="logo">user-template</div>
          <h1>Reset your password</h1>
        </div>
        <div class="body">
          <p>We got a request to reset the password for your account. Pick a new one below to get back to the table.</p>
          <div class="cta-wrapper">
            <a href="${process.env.FRONTEND_URL}/auth/resetPassword/${resetPasswordToken}" class="reset-button">Reset my password</a>
          </div>
          <p class="fallback-link">
            Button not working? Paste this link into your browser:<br />
            <a href="${process.env.FRONTEND_URL}/auth/resetPassword/${resetPasswordToken}">${process.env.FRONTEND_URL}/auth/resetPassword/${resetPasswordToken}</a>
          </p>
        </div>
        <div class="divider"></div>
        <div class="not-you">
          <h2>Wasn't you?</h2>
          <p>Someone may be trying to get into your account. Cancel this request below and the reset link will stop working. Your current password stays the same.</p>
          <a href="${process.env.FRONTEND_URL}/auth/cancelPasswordReset/${resetPasswordToken}" class="cancel-link">Cancel this password reset</a>
        </div>
        <div class="debug-note">
          <p>Debug - no frontend yet</p>
          <a href="${process.env.BACKEND_URL}/auth/cancelPasswordReset/${resetPasswordToken}" class="debug-link">Hit the API directly</a>
        </div>
        <div class="footer">This link expires shortly and can only be used once.</div>
      </div>
    </div>
  </body>

`;

export default getPasswordResetEmail;
