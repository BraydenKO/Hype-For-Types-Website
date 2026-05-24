
import re

file_path = r'C:\Users\brayk\OneDrive\Documents\CMU-Classes\HFT\Hype-For-Types-Website\notes\pages\example.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove <nav> entirely
content = re.sub(r'<nav.*?>.*?</nav>', '', content, flags=re.DOTALL)

# 2. Remove #chapter-sidebar and #chapter-actions more cleanly
# They were already mostly removed but left some empty divs.
# Let's target the IDs directly if they still exist.
content = re.sub(r'<div id="chapter-actions".*?</div>\s*</div>\s*</div>\s*</div>\s*</div>\s*</div>', '', content, flags=re.DOTALL)
content = re.sub(r'<div id="chapter-sidebar".*?</div>\s*</div>\s*</div>\s*</div>\s*</div>', '', content, flags=re.DOTALL)

# 3. Remove all block-options divs - more robust regex
content = re.sub(r'<div class="block-options.*?</span>\s*</div>', '', content, flags=re.DOTALL)

# 4. Remove all Expand/Collapse buttons/icons and other UI noise
content = re.sub(r'<i class="fa-solid fa-angle-down.*?</i>', '', content)
content = re.sub(r'<i class="fa-solid fa-angle-up.*?</i>', '', content)
content = re.sub(r'<div class="fixed-top".*?</div>\s*</div>\s*</div>', '', content, flags=re.DOTALL)

# 5. Remove unnecessary scripts
content = re.sub(r'<script src="https://code.jquery.com/.*?/script>', '', content)
content = re.sub(r'<script src="https://cdn.jsdelivr.net/npm/bootstrap.*?/script>', '', content)
content = re.sub(r'<script src="https://unpkg.com/htmx.org.*?/script>', '', content)
content = re.sub(r'<script src="/static/js/main.js"></script>', '', content)
content = re.sub(r'<script src="/static/js/comments.js"></script>', '', content)
content = re.sub(r'<script src="/static/js/block_filtering.js"></script>', '', content)
content = re.sub(r'<script src="/static/js/chapter.js"></script>', '', content)
content = re.sub(r'<script>\s*var DISCUSSIONS_NAVBAR_FILTER_UNVIEWED.*?</script>', '', content, flags=re.DOTALL)
content = re.sub(r'<script>\s*const URL_DISCUSSION_LOAD.*?</script>', '', content, flags=re.DOTALL)
content = re.sub(r'<script>\s*var blocks_width = 0;.*?</script>', '', content, flags=re.DOTALL)

# 6. Update CSS links in head
# Add base.css if not already there (it might be there from previous run)
if 'base.css' not in content:
    content = content.replace('<link rel="stylesheet" href="../general.css">', '<link rel="stylesheet" href="../../base.css">')
else:
    # Ensure it's correct path
    content = re.sub(r'<link rel="stylesheet" href=".*?base.css">', '<link rel="stylesheet" href="../../base.css">', content)

# 7. Simplify page structure
content = content.replace('col-xl-12 col-xxl-11 offset-xxl-1', '')
content = content.replace('offset-xxl-1', '')
content = content.replace('container-fluid', '')
content = content.replace('row', '')
content = content.replace('col-chapter-main offset-chapter-main', '')
content = content.replace('col-12', '')
content = content.replace('pe-0', '')
content = content.replace('ps-0', '')
content = content.replace('pt-10', '')

# Remove Bootstrap display classes
content = re.sub(r'\s*d-(none|sm-none|md-none|lg-none|xl-none|xxl-inline|flex|block|inline-block)\s*', ' ', content)

# Cleanup empty class attributes and extra whitespace
content = content.replace('class=""', '')
content = content.replace('class=" "', '')
content = re.sub(r'\s+>', '>', content)
content = re.sub(r'\n\s*\n', '\n\n', content)

# Remove hx- attributes (htmx)
content = re.sub(r'hx-\w+=".*?"', '', content)
# Remove onclick, data-block, etc.
content = re.sub(r'data-block-\w+=".*?"', '', content)
content = re.sub(r'onclick=".*?"', '', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
