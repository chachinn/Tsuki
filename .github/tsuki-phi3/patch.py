from pathlib import Path

app = Path('app.js')
text = app.read_text()
text = text.replace('tsuki-cache-v1-pre-anticipatory-care-8', 'tsuki-cache-v1-pre-personal-health-9')
needle = 'const RELEASE_NOTES = [\n'
note = '  { icon: "🌙", title: "Personal Health Intelligence 3.0", text: "Tsuki now connects your health timeline across Cycle, irregular rhythms, Pregnancy and Postpartum with user-correctable insights, fertility-sign context, recovery milestones, baby baseline and a universal concern pathway." },\n'
if note not in text:
    text = text.replace(needle, needle + note, 1)
app.write_text(text)

index = Path('index.html')
text = index.read_text()
needle = '<script src="./anticipatory-care-intelligence.js"></script>\n'
line = '<script src="./personal-health-intelligence.js"></script>\n'
if line not in text:
    text = text.replace(needle, needle + line, 1)
index.write_text(text)

sw = Path('service-worker.js')
text = sw.read_text().replace('tsuki-cache-v1-pre-anticipatory-care-8', 'tsuki-cache-v1-pre-personal-health-9')
needle = '  "./anticipatory-care-intelligence.js",\n'
line = '  "./personal-health-intelligence.js",\n'
# both APP_SHELL and UPDATE_FIRST contain the anchor
if text.count(line) < 2:
    text = text.replace(needle, needle + line)
sw.write_text(text)
