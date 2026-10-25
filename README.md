# Eventify -- AI-Powered Event Planner

Eventify is a web-based event planning application that helps users
organize events with AI-assisted recommendations and planning tools.
Users can enter event details, explore venue and catering
recommendations, generate event plans, review potential risks, optimize
budgets, and create invitation templates.

## Features

-   **User authentication:** Register and log in securely.
-   **Venue recommendations:** Find venue options based on event
    requirements.
-   **Caterer recommendations:** Explore catering options for the
    planned event.
-   **AI event planning:** Generate a personalized event plan using
    Google Gemini.
-   **Risk analysis:** Generate an AI-assisted overview of potential
    event risks.
-   **Budget optimization:** Get an AI-generated budget plan.
-   **Invitation generator:** Create formal, casual, and email-style
    invitation content.
-   **Invitation PDF:** Print or save an invitation as a PDF.
-   **Saved events:** Save event plans for later reference.

## Technology Stack

-   **Backend:** Node.js, Express.js
-   **Frontend:** HTML, CSS, JavaScript
-   **Database:** SQLite with `better-sqlite3`
-   **AI integration:** Google Gemini API (`@google/generative-ai`)
-   **Authentication:** JSON Web Tokens (JWT), `bcryptjs`

## Prerequisites

Install the following before running the project:

-   Node.js and npm
-   A Google Gemini API key

## Installation and Setup

1.  Clone the repository:

    ``` bash
    git clone https://github.com/OmkarMete/Eventify.git
    ```

2.  Open the project directory:

    ``` bash
    cd Eventify
    ```

3.  Install dependencies:

    ``` bash
    npm install
    ```

4.  Create a `.env` file in the project root (the same directory as
    `package.json`).

5.  Add the following environment variables to `.env`:

    ``` env
    PORT=5000
    JWT_SECRET=replace_with_a_secure_random_secret
    JWT_EXPIRES_IN=7d
    GEMINI_API_KEY=replace_with_your_gemini_api_key
    ```

6.  Replace the placeholder values with your own secrets and API key. Do
    not share these values publicly.

7.  If the project includes a database seed script and you want to load
    its sample data, run:

    ``` bash
    npm run seed
    ```

## Run the Application

Start the server:

``` bash
npm start
```

For development (if `nodemon` is installed):

``` bash
npm run dev
```

Then open:

``` text
http://localhost:5000
```

The health-check endpoint is:

``` text
http://localhost:5000/health
```

## Environment Variables

  Variable           Purpose
  ------------------ -----------------------------------------------
  `PORT`             Port used by the Express server
  `JWT_SECRET`       Secret used to sign JSON Web Tokens
  `JWT_EXPIRES_IN`   Token expiration duration (for example, `7d`)
  `GEMINI_API_KEY`   API key used for Google Gemini integration

## Security Notes

-   **Never commit `.env` to GitHub.** Keep it listed in `.gitignore`.
-   Do not put real API keys, passwords, or JWT secrets in source code,
    screenshots, or public documentation.
-   The `.env` file must be created separately on each developer's
    machine.
-   If a secret is accidentally published, revoke or rotate it
    immediately.

## Project Structure

The project is organized around the Express server, database, and static
frontend. Key locations include:

``` text
Eventify/
├── database/       # Database setup and seed script
├── public/         # Frontend HTML, CSS, and JavaScript
├── Services/       # Application services, including Gemini integration
├── .env            # Local environment variables (not committed)
├── .gitignore
├── package.json
└── server.js       # Express application entry point
```

Some folders or files may differ depending on the current project
version.

## API Overview

The application exposes API routes under `/api`. The main route groups
include:

-   `/api/auth` -- authentication
-   `/api/events` -- event planning and recommendations
-   `/api/ai` -- AI-powered planning, risk analysis, invitation, and
    budget features
-   `/api/saved-events` -- saved event plans

## Contributing

1.  Fork the repository.
2.  Create a feature branch.
3.  Make and test your changes.
4.  Submit a pull request with a clear description.

## License

No license has been specified for this repository. All rights remain
with the respective copyright holders unless a license is added.
