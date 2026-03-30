For Translators
This directory contains the localization files for the site.
## Files and structure
- `de/LC_MESSAGES/grapheneos.po`
- `es/LC_MESSAGES/grapheneos.po`
- `fr/LC_MESSAGES/grapheneos.po`
- `ru/LC_MESSAGES/grapheneos.po`
  Each `.po` file contains extracted translatable strings from the source templates.
  Important fields:
- `msgid`: original source string in English
- `msgstr`: translated string
- `msgid_plural` / `msgstr[n]`: plural forms
- `#: ...`: source file and line reference
- `#, fuzzy`: translation needs review
## Untranslated content report
Use the helper script in this folder to find untranslated strings grouped by language and source file.
Basic usage:
```powershell
python locale\report_untranslated.py
```
Report for one language:
```powershell
python locale\report_untranslated.py --language ru
python locale\report_untranslated.py --language de
```
Show example untranslated entries:
```powershell
python locale\report_untranslated.py --language ru --show-entries --max-entries 5
```
Get machine-readable output:
```powershell
python locale\report_untranslated.py --json
```
What the report means:
- `untranslated entries`: total number of entries with empty `msgstr`
- each file line shows how many untranslated entries come from that source file
- with `--show-entries`, the script prints example `msgid` values for each file
  Plural entries are also checked. If at least one plural translation is empty, that entry is treated as untranslated.
## How to translate
1. Open the target `.po` file for your language.
2. Find entries using the source references from the report.
3. Fill in empty `msgstr`.
4. If an entry is marked `#, fuzzy`, review it carefully and remove `fuzzy` only when the translation is correct.
   Example:
```po
#: static/install/web.html:35
msgid "Connecting to device..."
msgstr "Подключение к устройству..."
```
## Translator comments in source files
Some source templates contain comments starting with `Translators:`. These comments provide context for ambiguous strings, placeholders, product names, link labels, and UI wording.
Examples of guidance:
- keep `GrapheneOS` untranslated
- keep placeholders like `{zip}`, `{message}`, `{product}`, `{action}`, `{item}` unchanged
- understand whether a short label is a button, page title, or navigation item
  These comments are meant to reduce mistakes for short or ambiguous strings.
## Recommended workflow
1. Run the untranslated report for your language.
2. Start with files that have the largest untranslated count.
3. Use source references to inspect the original template if context is unclear.
4. Check for `Translators:` comments in the source files.
5. Fill in `msgstr` and review `fuzzy` entries.
6. Re-run the report to confirm progress.
## Notes
- Keep HTML tags intact when they appear in strings.
- Keep placeholders unchanged.
- Preserve product names and technical names when appropriate.
- Do not translate URLs, email addresses, codenames, or command examples unless there is a clear reason.