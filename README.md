# MassMailer 📨

> **Live app:** [MassMailer on GitHub Pages](https://marcelehmann.github.io/MassMailer/)

MassMailer is a lightweight micro‑app that lets you send personalised mail merges straight from any CSV file in under a minute. **No installation, no backend — everything runs 100 % in your browser.**

## Why MassMailer?

* **Zero setup:** open the URL and start mailing.
* **Privacy‑first:** your data never leaves the browser’s local storage (see *Privacy* below).
* **Make.com & Microsoft 365 integration:** use the ready‑made blueprint to automate delivery via Outlook or any other connector.

## Screenshots

![MassMailer main view](https://github.com/user-attachments/assets/9a01682d-9b3b-4713-9cf5-28c1952362b0)
![Settings dialog](https://github.com/user-attachments/assets/c294142b-eb38-44f8-acc9-9effb26fb232)
![Make.com blueprint](https://github.com/user-attachments/assets/c2bba019-c239-4253-a022-aee815d367c3)

## Get started in 3 steps

1. **Open the app** → [https://marcelehmann.github.io/MassMailer/](https://marcelehmann.github.io/MassMailer/)
2. **Upload your CSV** with the columns you want to use as placeholders.
3. **Compose & preview** your email, then press **Send** (or **Generate Preview**).

### Optional: Automate sending with Make.com

1. Download the blueprint:
   [https://github.com/MarceLehmann/MassMailer/blob/main/Make.com%20JSON/wf%20-%20MassMailer.blueprint.json](https://github.com/MarceLehmann/MassMailer/blob/main/Make.com%20JSON/wf%20-%20MassMailer.blueprint.json)
2. Import it into Make.com and connect your Microsoft 365 (Outlook) account.
3. Copy the webhook URL from Make.com and paste it into the *Settings* pane of MassMailer.

## Privacy

MassMailer is a pure front‑end application. All templates, CSV files and generated emails are stored **only** in your browser’s local storage and are never transmitted to any server. Clear your cache to remove all traces.

## Roadmap

* Rich‑text placeholder helper
* Support for multiple attachments
* Native SMTP option

## License

MIT © Marcel Lehmann
