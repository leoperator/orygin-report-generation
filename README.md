# AI Business Report Generator

This is a Next.js application that provides a powerful lead-generation tool for businesses. It features a web form where potential clients can submit their business details. The application then scrapes the client's website, uses. Opbneeds to be updated to display the new form. Replace the contents of the existing app/page.tsx file with the code from my version.

Modified File: app/page.tsx

Step 4: Set Up Environment Variables (Very Important)
You will need to create a .env.local file in the root of the main project. Do not share my .env.local file directly, as it contains secret keys.

The new file must contain these two variables with the correct keys/values:

```
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"..."}
```

You will need to get these values from the Google AI Studio and the Firebase project console.

Once these steps are complete, restart the Next.js development server, and the feature should be fully integrated and working.

## Key Project Files
This feature is composed of the following key files:

```app/api/generate-report/route.ts```: The core backend logic. Handles web scraping, the call to the Gemini API, PDF generation, and saving data to Firestore.

```app/components/reportForm.tsx```: The main logic component for the form. It manages state, validation, and handles the form submission.

```app/ui/ReportFormUI.tsx```: The presentational component for the form. Contains all the styled JSX and receives its data and functions as props.

```app/lib/firebase.ts```: Handles the initialization and configuration of the Firebase SDK.

```app/page.tsx```: The homepage, updated to display the ReportForm component.

```.env.local```: (Must be created manually) Stores all the secret API keys and configuration variables.
