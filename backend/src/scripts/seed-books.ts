const books = [
  {"title":"The Emerald Crown","author":"Brandon Sanderson","genre":"Fantasy","synopsis":"A kingdom seeks a magical crown hidden beneath ancient ruins."},
  {"title":"Whispers of Eldoria","author":"Brandon Sanderson","genre":"Fantasy","synopsis":"A young mage uncovers forbidden spells that could reshape the realm."},
  {"title":"The Last Dragon Pact","author":"Brandon Sanderson","genre":"Fantasy","synopsis":"An unlikely alliance between humans and dragons faces betrayal."},
  {"title":"Ashes of the White Tower","author":"Brandon Sanderson","genre":"Fantasy","synopsis":"A fallen order of guardians must reclaim their sacred tower."},

  {"title":"Moonlit Kingdom","author":"Robin Hobb","genre":"Fantasy","synopsis":"A forgotten princess returns to reclaim her enchanted homeland."},
  {"title":"The Silent Forest","author":"Robin Hobb","genre":"Fantasy","synopsis":"Ancient spirits awaken within a forest that remembers every oath."},
  {"title":"Crown of Frost","author":"Robin Hobb","genre":"Fantasy","synopsis":"A cursed monarch searches for redemption in the frozen north."},
  {"title":"The Hidden Throne","author":"Robin Hobb","genre":"Fantasy","synopsis":"Political intrigue and old magic collide in a divided empire."},

  {"title":"The Crystal River","author":"Patrick Rothfuss","genre":"Fantasy","synopsis":"A wandering storyteller discovers a river that reveals destiny."},
  {"title":"Echoes of the Phoenix","author":"Patrick Rothfuss","genre":"Fantasy","synopsis":"A legendary bird may hold the secret to immortality."},
  {"title":"The Forgotten Mage","author":"Patrick Rothfuss","genre":"Fantasy","synopsis":"A retired wizard is forced back into a war he tried to escape."},
  {"title":"Stormbound Oath","author":"Patrick Rothfuss","genre":"Fantasy","synopsis":"A sacred oath binds two rivals during an endless storm."},

  {"title":"The Golden Labyrinth","author":"Ursula K. Le Guin","genre":"Fantasy","synopsis":"Explorers enter a maze that changes with every memory."},
  {"title":"Song of the Seven Stars","author":"Ursula K. Le Guin","genre":"Fantasy","synopsis":"A celestial prophecy brings strangers together across kingdoms."},
  {"title":"The Hollow Citadel","author":"Ursula K. Le Guin","genre":"Fantasy","synopsis":"An abandoned fortress hides a power older than history."},
  {"title":"Veil of the Ancients","author":"Ursula K. Le Guin","genre":"Fantasy","synopsis":"A forgotten civilization begins to return through magical portals."},
  
  {"title":"The Red House","author":"Stephen King","genre":"Horror","synopsis":"A family moves into a house that remembers every previous owner."},
  {"title":"Midnight Harvest","author":"Stephen King","genre":"Horror","synopsis":"A small town celebrates a festival that demands a sacrifice."},
  {"title":"The Empty Well","author":"Stephen King","genre":"Horror","synopsis":"Children begin disappearing near an abandoned well."},
  {"title":"The Last Broadcast","author":"Stephen King","genre":"Horror","synopsis":"A radio station starts receiving messages from the dead."},

  {"title":"Black Cathedral","author":"Shirley Jackson","genre":"Horror","synopsis":"A decaying cathedral awakens during a solar eclipse."},
  {"title":"The Whispering Door","author":"Shirley Jackson","genre":"Horror","synopsis":"A mysterious door appears in the hallway every midnight."},
  {"title":"The Hollow Children","author":"Shirley Jackson","genre":"Horror","synopsis":"Children return from the woods strangely unchanged."},
  {"title":"Ashes in the Attic","author":"Shirley Jackson","genre":"Horror","synopsis":"An attic contains the ashes of people who never existed."},

  {"title":"The Bone Garden","author":"Clive Barker","genre":"Horror","synopsis":"A hidden garden grows flowers from human bones."},
  {"title":"Crimson Sleep","author":"Clive Barker","genre":"Horror","synopsis":"Nightmares begin manifesting in the waking world."},
  {"title":"The Forgotten Basement","author":"Clive Barker","genre":"Horror","synopsis":"A basement expands deeper each time someone enters."},
  {"title":"The Pale Choir","author":"Clive Barker","genre":"Horror","synopsis":"Voices from an abandoned church lure travelers into darkness."},

  {"title":"Orbit Zero","author":"Isaac Asimov","genre":"Science Fiction","synopsis":"A stranded station orbits a dying star."},
  {"title":"The Quantum Gate","author":"Isaac Asimov","genre":"Science Fiction","synopsis":"Scientists discover a gateway that bends causality."},
  {"title":"Colony Nine","author":"Isaac Asimov","genre":"Science Fiction","synopsis":"A remote colony begins evolving beyond humanity."},
  {"title":"The Last Algorithm","author":"Isaac Asimov","genre":"Science Fiction","synopsis":"An AI predicts the collapse of civilization."},

  {"title":"Solar Drift","author":"Arthur C. Clarke","genre":"Science Fiction","synopsis":"A generation ship loses contact with Earth."},
  {"title":"Beyond Europa","author":"Arthur C. Clarke","genre":"Science Fiction","synopsis":"Explorers uncover an ocean civilization beneath Europa."},
  {"title":"The Silent Signal","author":"Arthur C. Clarke","genre":"Science Fiction","synopsis":"A signal from deep space contains impossible mathematics."},

  {"title":"Red Horizon","author":"Ursula K. Le Guin","genre":"Science Fiction","synopsis":"A Martian settlement struggles with political independence."},
  {"title":"The Glass Planet","author":"Ursula K. Le Guin","genre":"Science Fiction","synopsis":"A planet made of crystalline oceans hides intelligent life."},
  {"title":"Echo Station","author":"Ursula K. Le Guin","genre":"Science Fiction","synopsis":"Time echoes trap a crew between parallel futures."},

  {"title":"The Silent Witness","author":"Agatha Christie","genre":"Thriller","synopsis":"A witness disappears before a crucial trial."},
  {"title":"Shadows of Vienna","author":"Agatha Christie","genre":"Thriller","synopsis":"An international conspiracy unfolds across European capitals."},
  {"title":"The Final Cipher","author":"Agatha Christie","genre":"Thriller","synopsis":"A cryptographer races to stop a global attack."},

  {"title":"Dark Protocol","author":"Gillian Flynn","genre":"Thriller","synopsis":"A cybersecurity breach exposes dangerous government secrets."},
  {"title":"The Broken Alibi","author":"Gillian Flynn","genre":"Thriller","synopsis":"A detective uncovers inconsistencies in a perfect alibi."},
  {"title":"Night Pursuit","author":"Gillian Flynn","genre":"Thriller","synopsis":"A journalist is hunted after discovering a hidden network."},

  {"title":"The Fifth Suspect","author":"Tana French","genre":"Thriller","synopsis":"Every suspect has a reason to lie."},
  {"title":"Cold Evidence","author":"Tana French","genre":"Thriller","synopsis":"Old evidence resurfaces and reopens a closed investigation."},

  {"title":"Summer in Florence","author":"Nicholas Sparks","genre":"Romance","synopsis":"Two strangers meet during a summer abroad."},
  {"title":"Letters to Autumn","author":"Nicholas Sparks","genre":"Romance","synopsis":"A box of old letters changes the course of a life."},
  {"title":"The Lake House Promise","author":"Nicholas Sparks","genre":"Romance","synopsis":"A promise made years ago brings two people together again."},

  {"title":"Winter Hearts","author":"Jojo Moyes","genre":"Romance","synopsis":"A chance encounter during winter changes two lives forever."},
  {"title":"The Last Dance","author":"Jojo Moyes","genre":"Romance","synopsis":"A dance instructor helps a widower learn to love again."},
  {"title":"Before the Sunrise","author":"Jojo Moyes","genre":"Romance","synopsis":"A train journey leads to an unexpected romance."}
]

async function seedBooks() {
  for (const book of books) {
    const response = await fetch("http://localhost:3000/api/books", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(book),
    });

    if (response.ok) {
      console.log(`Created: ${book.title}`);
    } else {
      const error = await response.text();
      console.error(`Failed: ${book.title}`, error);
    }
  }

  console.log("Seeding completed.");
}

seedBooks();