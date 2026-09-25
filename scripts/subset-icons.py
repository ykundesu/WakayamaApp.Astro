"""Optional asset maintenance: python -m pip install fonttools brotli; python scripts/subset-icons.py"""
import json
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
root=Path(__file__).resolve().parent.parent
font=TTFont(root/'assets/materialcommunityicons-source.ttf')
# The source font intentionally has loose xMin bounds. Subsetting tightens those
# bounds; preserve the outline's position relative to its advance width.
original_bearings = {name: (font['hmtx'][name][1], getattr(font['glyf'][name], 'xMin', 0)) for name in font.getGlyphOrder()}
options=subset.Options();options.flavor='woff2'
subsetter=subset.Subsetter(options=options)
subsetter.populate(unicodes=set(json.loads((root/'src/platform/icon-glyphs.json').read_text()).values()))
subsetter.subset(font)
for name in font.getGlyphOrder():
    glyph=font['glyf'][name]
    glyph.recalcBounds(font['glyf'])
    advance,_=font['hmtx'][name]
    bearing,old_min=original_bearings[name]
    font['hmtx'][name]=(advance,bearing+getattr(glyph,'xMin',0)-old_min)
font.flavor='woff2'
font.save(root/'src/platform/icons.woff2')
