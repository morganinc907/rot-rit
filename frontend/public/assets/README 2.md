# Ritual Assets

Place ritual media files here for the demon summoning overlay:

## Audio Files:
- `ritual-summon.mp3` - Sound effect played when demons are summoned
- `ritual-ambient.mp3` - Background ambient sounds (optional)

## Image Files:
- `ritual-glyph.png` - Ritual pentagram/glyph symbol
- `demon-sigil.png` - Demon summoning sigil

## Notes:
- Audio files should be optimized for web (compressed, reasonable size)
- Images should be PNG with transparency for best overlay effects
- The component includes fallback CSS symbols if assets are missing

## Current Status:
- Using CSS-generated symbols (⛧ for glyph, 🔥👹 for sigil)
- Audio playback will gracefully fail if file not found
- Ready to replace with custom assets when available