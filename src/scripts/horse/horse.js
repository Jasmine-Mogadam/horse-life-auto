// Horse class for readability and easier trait management
export default class Horse {
  constructor({ name, size, gender, traits = {}, bodyColors = {} }) {
    this.name = name;
    this.size = size;
    this.gender = gender;
    // Accept both array and object for traits
    if (Array.isArray(traits)) {
      // Convert array to object with all false
      this.traits = Object.fromEntries(traits.map((t) => [t, false]));
    } else {
      this.traits = { ...traits };
    }
    this.bodyColors = { ...bodyColors };
  }

  setTrait(trait, value) {
    this.traits[trait] = value;
  }

  getTrait(trait) {
    return !!this.traits[trait];
  }

  setBodyColor(part, color) {
    this.bodyColors[part] = color;
  }

  getBodyColor(part) {
    return this.bodyColors[part] || null;
  }

  static fromObject(obj) {
    return new Horse(obj);
  }
}
