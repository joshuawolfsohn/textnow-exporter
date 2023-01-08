Purpose: To help export text messages from TextNow into a format that can be restored to the Android SMS log.

Instructions:
1) Login to and open TextNow web client
2) Use TextNowExporter.js script (credits to mmcev106) to download each TextNow conversation thread as a separate JSON file
3) Place the Convert-JSON-Conversations-to-XML-Backups.ps1 Powershell script in the same directory as the TextNow conversation JSON files
4) Run the script to generate a series of XML files
5) Download and use the Android app "SMS Backup & Restore" by SyncTech Pty Ltd (from Google Play Store) to restore the XML files to your Android device.

Notes:
- Follow these instructions at your own discretion. I am not responsible for any data loss incurred.
- MMS messages with media will not be restored with this script.
- SMS timestamps may not be accurate.