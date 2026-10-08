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

      .login-button {
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

      .login-button::before {
        content: "LOG IN TO YOUR SUPERUSER";
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
      .login-button:hover::before {
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

      .feedback {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 30px;
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
      <section class="logo">My Menu</section>
      <section class="welcome">
        <h1>Welcome to My Menu</h1>
        <p>You're all set. Now you can create beautifully-designed, healty menus for all your centers.</p>
        <a href="http://localhost:3000/auth/register/${activationToken}" class="login-button">LOG IN TO YOUR SUPERUSER</a>
      </section>
      <section class="docs">
        <h2>Learn to use My Menu like a pro</h2>
        <p>
          <span class="question">Do you have any doubts on how to use a feaute of My Menu?</span><br />
          Chances are there is an article about it. Visit out Docummentation to get all the help you will need.
        </p>
        <p><span class="question">The documentation was not enought to solve your issue?</span> <br />That's why we are here! Contact out top-tier support and we'll be happy to help you</p>
        <p></p>
      </section>
      <section class="feedback">
        <h2>Your feedback is appreciated!</h2>
        <p>
          <span class="question">The documentation was not enought to solve your issue?</span> <br />
          Share it with us! We know a program can never be complete, there is allways room for improvement.
        </p>
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
