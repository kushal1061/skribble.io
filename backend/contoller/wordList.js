const WORDS = [
    // Animals
    "cat", "dog", "elephant", "giraffe", "penguin", "dolphin", "kangaroo", "tiger",
    "parrot", "crocodile", "hamster", "octopus", "butterfly", "peacock", "cheetah",
    // Food & Drink
    "pizza", "burger", "sushi", "taco", "donut", "watermelon", "strawberry", "popcorn",
    "sandwich", "pancake", "chocolate", "noodles", "broccoli", "pineapple", "avocado",
    // Objects
    "umbrella", "telescope", "backpack", "guitar", "bicycle", "keyboard", "lantern",
    "compass", "telescope", "trophy", "magnet", "parachute", "microscope", "fireworks",
    // Places
    "lighthouse", "volcano", "pyramid", "igloo", "castle", "waterfall", "island",
    "library", "stadium", "submarine", "spaceship", "treehouse", "skyscraper",
    // Actions
    "swimming", "dancing", "cooking", "climbing", "painting", "flying", "sleeping",
    "juggling", "surfing", "skateboarding", "gardening", "fishing", "skiing",
    // Nature
    "rainbow", "tornado", "snowflake", "thunder", "cactus", "mushroom", "coral",
    "glacier", "canyon", "meteor", "eclipse", "aurora", "quicksand",
    // Misc
    "robot", "ninja", "pirate", "wizard", "superhero", "astronaut", "detective",
    "balloon", "magician", "dragon", "unicorn", "zombie", "ghost", "mermaid",
    "knight", "cowboy", "alien", "vampire", "scarecrow", "snowman",
];

/**
 * Returns `count` unique random words from the word list.
 */
function getRandomWords(count = 3) {
    const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

module.exports = { WORDS, getRandomWords };
