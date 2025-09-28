# Stock Price Alert

This project is a Google Apps Script-based stock price alert system. It monitors specified stock prices and sends notifications when they reach predefined thresholds.

## Features

*   Monitors multiple stock prices.
*   Sends alerts when target prices are met.
*   Configurable via a Google Spreadsheet.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/Stock-Price-Alert.git
    cd Stock-Price-Alert
    ```
2.  **Install clasp (if you haven't already):**
    ```bash
    npm install -g @google/clasp
    ```
3.  **Log in to clasp:**
    ```bash
    clasp login
    ```
4.  **Create a new Google Apps Script project or link to an existing one:**
    *   To create a new project:
        ```bash
        clasp create --type sheets --title "Stock Price Alert"
        ```
        (This will create a new Google Sheet and link the Apps Script project to it.)
    *   To link to an existing project (e.g., if you already have a spreadsheet set up):
        ```bash
        clasp clone <Script ID>
        ```
        (You can find the Script ID in the Apps Script editor URL: `script.google.com/d/<SCRIPT_ID>/edit`)
5.  **Push the code:**
    ```bash
    clasp push
    ```
    This will upload `investment_alarm.js` and `appsscript.json` to your Google Apps Script project.

## Configuration

Configuration is done through the linked Google Spreadsheet. You will need to set up columns for:

*   **Stock Symbol:** e.g., `AAPL`, `GOOGL`
*   **Target Price:** The price at which you want to be alerted.
*   **Current Price:** (Optional) This can be updated by the script.
*   **Alert Status:** To track if an alert has been sent.

Further details on specific column names and structure will be available in the `investment_alarm.js` file comments or within the script itself.

## Usage

Once the script is pushed and configured in the spreadsheet, you will need to set up a time-driven trigger in the Google Apps Script editor:

1.  Open your Google Apps Script project (from `script.google.com/d/<SCRIPT_ID>/edit`).
2.  Click on the **Triggers** icon (alarm clock).
3.  Click **Add Trigger**.
4.  Select `investment_alarm` as the function to run.
5.  Choose **Time-driven** as the event source.
6.  Select the desired frequency (e.g., `Every hour`, `Every 30 minutes`).
7.  Save the trigger.

The script will then run automatically at the specified intervals, check stock prices, and send alerts as configured.

## Customization

Refer to `investment_alarm.js` for details on how to customize alert messages, data sources, or add more advanced logic.