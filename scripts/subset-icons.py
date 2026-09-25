"""Optional asset maintenance: python -m pip install fonttools brotli; python scripts/subset-icons.py"""
import json
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
root=Path(__file__).resolve().parent.parent
font=TTFont(root/'assets/materialcommunityicons-source.ttf')
options=subset.Options();options.flavor='woff2'
subsetter=subset.Subsetter(options=options)
subsetter.populate(unicodes=set(json.loads((root/'src/platform/icon-glyphs.json').read_text()).values()))
subsetter.subset(font);font.flavor='woff2'
font.save(root/'public/fonts/icons.woff2')
