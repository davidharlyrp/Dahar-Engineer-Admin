import os
import re

files = [
    'ProductPayment.tsx',
    'PromotionalEmail.tsx',
    'RevitFiles.tsx',
    'SecondBrain.tsx',
    'ServerMonitor.tsx',
    'TerraSim.tsx'
]

base_dir = r'e:\Website\Dahar Engineer Admin\src\pages'

def replace_classes(text):
    # Remove all dark: prefix
    text = re.sub(r'dark:[a-zA-Z0-9\-/\:]+', '', text)
    
    # Replace slate backgrounds based on hover or normal
    text = re.sub(r'hover:bg-slate-[0-9]+(/[0-9]+)?', 'hover:bg-white/5', text)
    text = re.sub(r'bg-slate-[0-9]+(/[0-9]+)?', 'bg-white/5', text)
    
    # Replace slate borders
    text = re.sub(r'hover:border-slate-[0-9]+(/[0-9]+)?', 'hover:border-white/10', text)
    text = re.sub(r'focus:border-slate-[0-9]+(/[0-9]+)?', 'focus:border-white/10', text)
    text = re.sub(r'border-[a-z]-slate-[0-9]+(/[0-9]+)?', 'border-white/5', text)
    text = re.sub(r'border-slate-[0-9]+(/[0-9]+)?', 'border-white/5', text)
    
    # Replace slate text
    text = re.sub(r'hover:text-slate-[0-9]+(/[0-9]+)?', 'hover:text-white', text)
    text = re.sub(r'focus:text-slate-[0-9]+(/[0-9]+)?', 'focus:text-white', text)
    
    # Needs sequence down to avoid missing
    text = re.sub(r'text-slate-900', 'text-white', text)
    text = re.sub(r'text-slate-800', 'text-white/90', text)
    text = re.sub(r'text-slate-700', 'text-white/80', text)
    text = re.sub(r'text-slate-600', 'text-white/60', text)
    text = re.sub(r'text-slate-500', 'text-white/40', text)
    text = re.sub(r'text-slate-[0-9]+', 'text-white/40', text)
    
    # Replace focus rings
    text = re.sub(r'focus:ring-slate-[0-9]+(/[0-9]+)?', 'focus:ring-army-500', text)
    text = re.sub(r'ring-slate-[0-9]+(/[0-9]+)?', 'ring-white/10', text)
    
    # Replace divides
    text = re.sub(r'divide-slate-[0-9]+(/[0-9]+)?', 'divide-white/5', text)
    
    # Cleanup any double spaces resulting from removing dark:
    text = re.sub(r' +', ' ', text)
    text = text.replace(' "', '"').replace('" ', '"')
    
    return text

for file_name in files:
    file_path = os.path.join(base_dir, file_name)
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
        
        # Apply the more generic replacement
        code = replace_classes(code)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(code)
        print(f'Cleaned {file_name}')
