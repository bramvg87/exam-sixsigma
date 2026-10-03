"""Replace literal \\uXXXX escapes in Markdown content files by the real characters.
Usage: python scripts/unescape_md.py content/file.md [...]"""
import re, sys
BS = chr(92)
pat = re.compile(re.escape(BS) + 'u([0-9a-fA-F]{4})')
for p in sys.argv[1:]:
    s = open(p, encoding='utf8').read()
    n = len(pat.findall(s))
    s = pat.sub(lambda m: chr(int(m.group(1), 16)), s)
    open(p, 'w', encoding='utf8').write(s)
    print(p, 'replaced', n)
