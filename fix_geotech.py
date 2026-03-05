import re

file_path = r'e:\Website\Dahar Engineer Admin\src\pages\GeotechVisualizer.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Remove all dark: prefix
text = re.sub(r'dark:[a-zA-Z0-9\-/\:]+', '', text)

# Replace remaining slate text
text = re.sub(r'slate-900', 'text-white', text)
text = re.sub(r'text-slate-100', 'text-white', text)
text = re.sub(r'divide-slate-[0-9]+(/[0-9]+)?', 'divide-white/5', text)

# Cleanup double spaces safely
text = re.sub(r' +', ' ', text)
text = text.replace(' "', '"').replace('" ', '"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Fixed GeotechVisualizer.tsx")
