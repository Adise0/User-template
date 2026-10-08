const getOtpEmail = (otp: string, otpRevokeToken: string) => `

  <head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
    <style>
      body {
        background-color: #f5f5f5;
      }
      .container {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: "Poppins", sans-serif;
        text-align: center;
      }

      .logo {
        font-weight: 600;
        font-size: 23px;
        color: #424242;
        margin: 20px;
      }

      .welcome {
        position: relative;

        width: 100%;

        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 30px;
        padding-bottom: 40px;
        color: white;

        transition: all ease-in-out 0.3s;
      }

      .welcome::before {
        content: "";
        z-index: -1;
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, #9747ff 0%, #ffa7f6 100%);
        opacity: 1;
        transition: all ease-in-out 0.3s;
      }

      .welcome h1 {
        margin: 0;
        font-size: 30px;
      }

      .welcome p {
        padding: 0 50px 0 50px;
        margin-bottom: 10px;
        color: white;
        font-size: 16px;
        text-align: center;
        transition: all ease-in-out 0.3s;
      }

      .otp-code {
        position: relative;
        background-color: #f5f5f5;
        font-family: inherit;
        border-radius: 15px;
        padding: 15px 30px;
        color: #303030;
        font-weight: 700;
        font-size: 32px;
        letter-spacing: 8px;
        box-shadow: 0px 0px 20px 5px rgba(0, 0, 0, 0.25);
      }

      h2 {
        font-size: 18px;
        font-weight: 600;
        color: #9747ff;
      }

      p {
        color: #676767;
        font-size: 14px;
        text-align: left;
      }
      .docs {
        padding: 30px;
        padding-bottom: 0;
      }

      .not-you {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 30px;
        background-color: #ffeeee;
      }

      .not-you .question {
        font-weight: 600;
        color: #c0392b;
      }

      .revoke-link {
        margin-top: 10px;
        color: #c0392b;
        font-weight: 600;
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <section class="logo">user-template</section>
      <section class="welcome">
        <h1>Your one-time password</h1>
        <p>Use the code below to sit back down at the table. It can only be used once and will expire shortly.</p>
        <div class="otp-code">${otp}</div>
      </section>
      <section class="not-you">
        <h2>Wasn't you?</h2>
        <p>
          <span class="question">Didn't request this code?</span><br />
          Someone may be trying to get into your account. Revoke this code so it can no longer be used.
        </p>
        <a href="http://localhost:4000/otp/revoke/${otpRevokeToken}" class="revoke-link">Revoke this code</a>
      </section>
    </div>
  </body>

`;

export default getOtpEmail;
