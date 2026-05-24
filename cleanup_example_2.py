
import re

with open(r'C:\Users\brayk\OneDrive\Documents\CMU-Classes\HFT\Hype-For-Types-Website\notes\pages\example2.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract content of chapter-atoms
start_marker = '<div id="chapter-atoms" class="row">'
end_marker = '</main>'
start_index = content.find(start_marker)
if start_index != -1:
    start_index += len(start_marker)
    end_index = content.find(end_marker, start_index)
    if end_index != -1:
        last_div_index = content.rfind('</div>', start_index, end_index)
        atoms_content = content[start_index:last_div_index]
        
        # 1. Remove block-options
        # This regex looks for block-options and stops before the next atom div or block closing.
        # We use a non-greedy match and lookahead for the atom div.
        atoms_content = re.sub(r'<div\s+class="block-options.*?</div>(?=\s*<div\s+class="atom)', '', atoms_content, flags=re.DOTALL)
        # Also handle cases where there might not be an atom div (though unlikely)
        atoms_content = re.sub(r'<div\s+class="block-options.*?</div>(?=\s*</div>\s*</div>)', '', atoms_content, flags=re.DOTALL)
        
        # 2. Restore solution toggles and ensure they are collapsed
        atoms_content = re.sub(r'(class="block [^"]*block-solution[^"]*)', r'\1 block-collapsed', atoms_content)
        atoms_content = atoms_content.replace('block-expanded', '')
        atoms_content = re.sub(r'<span class="atom-name">Solution</span>', 
                               r'<a class="no-decoration" role="button" onclick="toggleBlock(this)"><span class="atom-name">Solution</span></a>', 
                               atoms_content)
        
        # 3. Remove grid offsets
        atoms_content = re.sub(r'col-xl-\d+ col-xxl-\d+ offset-xxl-\d+', '', atoms_content)
        
        # 4. Remove other dynamic attributes
        atoms_content = re.sub(r'hx-(get|target|vals|trigger|post|put|delete|swap)="[^"]*"', '', atoms_content)
        atoms_content = re.sub(r'data-bs-toggle="[^"]*"', '', atoms_content)
        atoms_content = re.sub(r'data-bs-placement="[^"]*"', '', atoms_content)
        atoms_content = re.sub(r'data-bs-title="[^"]*"', '', atoms_content)

        template = """<!DOCTYPE html>
<html lang="en" translate="no">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Induction Review | CS251 Spring 2025</title>
    <link rel="icon" type="image/png" href="../../favicon.png" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/contrib/auto-render.min.js"></script>
    <script>
    document.addEventListener("DOMContentLoaded", function() {
        renderMathInElement(document.body, {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "\\(", right: "\\)", display: false},
                {left: "\\[", right: "\\]", display: true},
            ],
            ignoredClasses: ["ignore-math"]
        });
    });
    </script> 
    <link rel="stylesheet" href="../../base.css">
    <link rel="stylesheet" href="../chapter.css">
    <link rel="stylesheet" href="../atom.css">
    <script src="../notes.js"></script>
</head>
<body>
    <nav style="margin-bottom: 20px;">
        <a href="../../index.html" style="text-decoration: none;">&larr; Home</a> | 
        <a href="../index.html" style="text-decoration: none;">Course Notes Index</a>
    </nav>
    <h1>Induction Review</h1>
    <p><strong>MODULE 1:</strong> Introduction</p>
    <hr>
    <main>
        <div id="chapter-atoms">
{content}
        </div>
    </main>
</body>
</html>"""
        with open(r'C:\Users\brayk\OneDrive\Documents\CMU-Classes\HFT\Hype-For-Types-Website\notes\pages\example2_cleaned.html', 'w', encoding='utf-8') as f:
            f.write(template.replace('{content}', atoms_content))
        print("Success")
    else:
        print("Failed to find end marker")
else:
    print("Failed to find start marker")
