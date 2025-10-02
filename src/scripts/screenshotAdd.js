async function captureAndRecognize(traits) {
  // 1. Trigger screenshot from the main process
  const imagePath = await window.horseAPI.takeScreenshot();
  if (!imagePath) {
    return null;
  }

  // 2. Use Tesseract.js to recognize text
  const {
    data: { text },
  } = await Tesseract.recognize(
    imagePath,
    "eng",
    { logger: (m) => console.log(m) } // for debugging
  );

  // 3. Parse the text to extract traits
  const horseTraits = parseTraits(text, traits);

  return horseTraits;
}

function parseTraits(text, traits) {
  const lines = text.split("\n");
  const foundTraits = {};
  // First letter is the horse name
  const name = lines[0];

  // Colors are the next part, from top left to bottom right
  // COAT TOP
  // COAT BOTTOM
  // HAIR (row end)
  // HOOF
  // NOSE
  // SOCK (row end)
  // PAINT
  // PATTERN
  // KERATIN (row end)

  // The bottom part is the rest of the horse traits
  const allTraits = [
    ...traits.eyes,
    ...traits.paint,
    ...traits.patterm,
    ...traits.cosmetics,
    ...traits.mane,
    ...traits.tail,
  ].map((trait) => trait.name.toLowerCase());

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    for (const trait of allTraits) {
      if (lowerLine.includes(trait)) {
        foundTraits[trait] = true;
      }
    }
  }

  return foundTraits;
}

export { captureAndRecognize };
