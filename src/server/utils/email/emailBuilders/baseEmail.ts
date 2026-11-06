// Shared shell for the simpler emails, same look as the others.
const getBaseEmail = (title: string, content: string) => `

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

      .card {
        max-width: 480px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 18px;
        overflow: hidden;
      }

      .header {
        padding: 28px 30px;
        background-color: #1f5f44;
        color: #ffffff;
        text-align: center;
      }

      .header h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
      }

      .body {
        padding: 28px 30px;
        text-align: center;
      }

      .body p {
        margin: 0 0 20px;
        color: #5c5a52;
        font-size: 15px;
        line-height: 1.6;
      }

      .button {
        display: inline-block;
        padding: 14px 28px;
        border-radius: 12px;
        background-color: #1f5f44;
        color: #ffffff;
        font-weight: 600;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <h1>${title}</h1>
      </div>
      <div class="body">
        ${content}
      </div>
    </div>
  </body>

`;

export default getBaseEmail;
