const getUserActivationEmail = (activationToken: string) => `

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
        pointer-events: none;

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

      .welcome:hover {
        background-color: #f5f5f5;
        background-size: 0px;
        color: #303030;
      }

      .welcome h1 {
        margin: 0;
        font-size: 30px;
      }

      .welcome p {
        padding: 0 50px 0 50px;
        margin-bottom: 30px;
        color: white;
        font-size: 16px;
        text-align: center;
        transition: all ease-in-out 0.3s;
      }

      .welcome:hover p {
        color: #303030;
      }

      .activate-button {
        position: relative;
        background-color: #f5f5f5;
        font-family: inherit;
        border-radius: 15px;
        padding: 10px 20px;
        color: #303030;
        font-weight: 600;
        font-size: 16px;
        box-shadow: 0px 0px 20px 5px rgba(0, 0, 0, 0.25);

        border: none;

        transition: all ease-in-out 0.3s;
        pointer-events: all;
        overflow: hidden;
        text-decoration: none;
      }

      .activate-button::before {
        content: "ACTIVATE MY ACCOUNT";
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        z-index: 1;
        inset: 0;
        background: linear-gradient(90deg, #9747ff 0%, #ffa7f6 100%);
        opacity: 0;
        transition: all ease-in-out 0.3s;
      }
      .activate-button:hover::before {
        opacity: 1;
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
      .question {
        font-weight: 600;
        color: #424242;
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
        color: #c0392b;
      }

      .cancel-link {
        margin-top: 10px;
        color: #c0392b;
        font-weight: 600;
        text-decoration: underline;
      }

      .links {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
      }
      .links-section {
        margin-top: 15px;
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
      }

      .link {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <section class="logo">user-template</section>
      <section class="welcome">
        <h1>Welcome to the table!</h1>
        <p>You're almost ready to play. Activate your account below to shuffle up and start your first game of user-template.</p>
        <a href="http://localhost:4000/auth/register/${activationToken}" class="activate-button">ACTIVATE MY ACCOUNT</a>
      </section>
      <section class="docs">
        <h2>Learn the ropes</h2>
        <p>
          <span class="question">Not sure how a round of user-template works?</span><br />
          Chances are there is an article about it. Visit our documentation to get all the help you will need.
        </p>
        <p><span class="question">Still stuck?</span> <br />That's why we are here! Contact our support and we'll be happy to help you.</p>
        <p></p>
      </section>
      <section class="not-you">
        <h2>Wasn't you?</h2>
        <p>
          <span class="question">Didn't create this account?</span><br />
          If you didn't sign up for user-template, someone may have used your email by mistake. Cancel this registration and nothing will be created.
        </p>
        <a href="http://localhost:4000/auth/cancel/${activationToken}" class="cancel-link">Cancel this registration</a>
      </section>
      <section class="links">
        <h2>Relevant links</h2>
        <div class="links-section">
          <div class="link">
            <img src="" alt="" height="50" width="50" />
            <p>Documentation</p>
          </div>
          <div class="link">
            <img src="" alt="" height="50" width="50" />
            <p>Webpage</p>
          </div>
          <div class="link">
            <img src="" alt="" height="50" width="50" />
            <p>Help center</p>
          </div>
          <div class="link">
            <img src="" alt="" height="50" width="50" />
            <p>About us</p>
          </div>
        </div>
      </section>
    </div>
  </body>

`;

export default getUserActivationEmail;
