// generator.js — Random NPC and Item generator for the DM.
//
// Architecture:
//   - Built-in tables (T) are substantial fallbacks.
//   - generator/npc-tables.json is fetched at startup and merged in (arrays appended
//     when _merge:true, replaced when _merge:false). Drop a file there to extend tables.
//   - The NPC form lets you seed any field; blank = random.
//   - Generated entities live in localStorage and inject into window.ENTITIES.
//
// Timing note: window.App and window.CAMPAIGN are set asynchronously by data.js
// (after a fetch). All init that touches them is deferred to the 'entities:ready' event.

(function () {
  // Resolved lazily on first entities:ready
  let GEN_KEY  = null;
  let _genList = [];
  let _genById = new Map();

  // ── Storage ──────────────────────────────────────────────────────────────────
  function loadAll()    { try { return JSON.parse(localStorage.getItem(GEN_KEY)) || []; } catch { return []; } }
  function persistAll() { try { localStorage.setItem(GEN_KEY, JSON.stringify(_genList)); } catch (e) { console.warn('[generator] save failed:', e); } }

  // ── entities:ready — init once, sync on subsequent fires ─────────────────────
  document.addEventListener('entities:ready', function () {
    if (!GEN_KEY) {
      // First fire: window.CAMPAIGN and window.App are now available.
      GEN_KEY  = (window.CAMPAIGN?.id || 'campaign') + '.generated.v1';
      _genList = loadAll();
      _genById = new Map(_genList.map((e) => [e.id, e]));

      // Patch window.App.byId to include generated entities as a fallback.
      if (!window.App._genPatched) {
        const _orig = window.App.byId.bind(window.App);
        window.App.byId = (id) => _orig(id) || _genById.get(id);
        window.App._genPatched = true;
      }
    }
    // On every fire: ensure saved entities are in window.ENTITIES.
    for (const e of _genList)
      if (!window.ENTITIES.find((x) => x.id === e.id)) window.ENTITIES.push(e);
  });

  // ── Built-in tables ──────────────────────────────────────────────────────────
  const T = {

    // ─── Names ─────────────────────────────────────────────────────────────────
    names: {
      human_male: [
        'Aldric','Aran','Bastian','Beren','Bran','Brodyn','Cael','Cade','Calder','Camran',
        'Carver','Cedric','Cole','Conal','Corran','Corvin','Daven','Davin','Declan','Devlin',
        'Dirk','Dorian','Doran','Dunstan','Edgar','Edric','Edwin','Elliot','Emlen','Emric',
        'Erwan','Ethan','Farl','Fennick','Galen','Gareth','Godwin','Griffin','Hadley','Hale',
        'Harwick','Idris','Imric','Jareth','Joran','Kenrick','Lewin','Locke','Lorcan','Luther',
        'Marek','Marius','Marsh','Merric','Nevyn','Nikos','Odan','Orin','Ormand','Owen',
        'Peran','Perry','Quinn','Radwick','Rael','Remy','Roran','Rylan','Selwyn','Severin',
        'Silas','Sorren','Stellan','Taran','Taven','Theron','Tobias','Tomas','Ulric','Ulrik',
        'Vance','Warin','Weston','Wilder','Wystan','Yorick','Zane','Aldous','Anselm','Corland',
        'Daxton','Dorwyn','Edwyn','Elemar','Enton','Feron','Gervin','Harlan','Helmut','Ivan',
        'Jacoby','Kendal','Lavin','Morvan','Nallen','Oswald','Pexton','Renwick','Solan','Taric',
      ],
      human_female: [
        'Adela','Aelys','Agatha','Alcina','Alena','Alys','Amara','Amira','Anwen','Ariel',
        'Asha','Aveline','Beatrix','Brenna','Briar','Bronwyn','Caela','Caryn','Celia','Cerys',
        'Chara','Corin','Dagna','Dara','Dela','Delia','Dena','Deva','Edlyn','Elara',
        'Elise','Elspeth','Emara','Embry','Enid','Eryn','Evaine','Faye','Fenella','Fenna',
        'Fiona','Freya','Gaia','Genna','Genvra','Gilda','Glenna','Gwynna','Hael','Hana',
        'Helga','Ida','Ilara','Irene','Iris','Jana','Jessa','Katrin','Kessa','Kira',
        'Lana','Laris','Lena','Lianna','Lira','Lucia','Lysa','Maren','Marra','Meda',
        'Mira','Moira','Myla','Nalia','Nara','Neria','Nessa','Noa','Nola','Nora',
        'Ondine','Petra','Phoebe','Rhea','Rhiannon','Rowena','Rynn','Sable','Sarra','Sera',
        'Silvia','Sorin','Sylva','Tara','Thessa','Tia','Veda','Vera','Vila','Wren',
        'Yara','Zara','Zeva','Aldis','Ambra','Cressida','Dorith','Elowen','Falyn','Gailen',
        'Harla','Ilvara','Jeryn','Kestral','Lorin','Maeve','Orwyn','Perith','Roslin','Thalia',
      ],
      human_surname: [
        'Aldenmoor','Aldwick','Ambergrove','Ashford','Ashvale','Ashwick','Barrowfield','Blackmere',
        'Blackthorn','Bloodwell','Blount','Briarcroft','Bridgewater','Brinewall','Brockdale',
        'Bronzehall','Caldwell','Carver','Castlemore','Coldwater','Coldwell','Coppergold',
        'Crestfall','Crosswick','Darkwater','Daverwick','Dawnmere','Driscoll','Driftwood',
        'Dunmore','Duskmore','Duskwood','Easthaven','Edgewood','Embervale','Evenwood','Fallgate',
        'Feldwick','Fenwick','Fernmere','Firebrand','Flintwick','Forgewell','Foxhollow',
        'Frostmere','Galvane','Glenholt','Goldember','Goldenwood','Greyfield','Greymere',
        'Greymantle','Grimholt','Grimwick','Hadleigh','Harwick','Hartwick','Heathmore',
        'Highhollow','Hollowmere','Holt','Holwood','Inkwell','Ironforge','Ironvale','Ironwood',
        'Kettlewick','Larkmere','Larkspur','Lorne','Lovell','Maddock','Mansbridge','Mayfair',
        'Mercer','Millfield','Millholt','Moorgate','Mosswick','Myrdal','Netherton','Nighthollow',
        'Northwall','Oakhurst','Oldfield','Ordain','Pale','Palegrove','Pebbleford','Pennwick',
        'Prentiss','Quickthorn','Ravensmere','Ravenwood','Redwick','Riversong','Rockhollow',
        'Rosefield','Saltbrook','Sandwick','Silverfield','Silverthorn','Slade','Slate',
        'Starwick','Stone','Stonehaven','Stonehollow','Stonewall','Stormgate','Swiftbrook',
        'Thadwick','Thorn','Thornwick','Torwick','Umbra','Underhill','Underwood','Vale',
        'Vermeer','Wakefield','Walcott','Westergate','Weston','Whittock','Whitwood','Wildermere',
        'Windemere','Windhollow','Wolfdale','Wychwood','Yarrow','Zale',
      ],

      elf_male: [
        'Adran','Aelar','Ahvain','Aramil','Arannis','Aust','Beiro','Berrian','Caeldrim','Carric',
        'Enialis','Erdan','Erevan','Galinndan','Hadarai','Himo','Immeral','Ivellios','Laucian',
        'Mindartis','Paelias','Peren','Quarion','Riardon','Rolen','Soveliss','Thamior','Thavorir',
        'Calindra','Elador','Filarion','Galadin','Ilanis','Jorath','Kaladrel','Laesuryn',
        'Maerion','Naerith','Oslin','Pharamis','Raldindel','Saerindel','Tavoris','Valrindel',
        'Xandindel','Zaerindel','Aelindra','Aerindel','Alarith','Aldaron','Caelion','Caranthir',
        'Celebreth','Daelindra','Daerion','Elarinya','Elarith','Elerosse','Elethil','Elouin',
        'Faerindel','Gaelryn','Gaerith','Haldir','Halamir','Laerith','Lirindel','Maelryn',
      ],
      elf_female: [
        'Adrie','Althaea','Anastrianna','Andraste','Antinua','Bethrynna','Birel','Caelynn',
        'Dara','Drusilia','Enna','Felosial','Ielenia','Irann','Keyleth','Leshanna','Lia',
        'Mialee','Naivara','Quelenna','Quillathe','Sariel','Shanairra','Shava','Silaqui',
        'Theirastra','Vadania','Valanthe','Valna','Xanaphia','Aelindra','Calindra','Daerith',
        'Eladrielle','Faelindra','Galindra','Harith','Ilindra','Jalindra','Kaelindra','Liandrel',
        'Maelindra','Naelindra','Oraindra','Pelindra','Qaelindra','Raelindra','Saelindra',
        'Taelindra','Vaelindra','Arathiel','Ardeth','Arien','Arwen','Cariel','Elaith','Elara',
        'Elindra','Galindra','Gwendel','Liriel','Lothindra','Melindra','Miriel','Rindriel',
      ],
      elf_surname: [
        'Amakiir','Amastacia','Brightwood','Dawnbringer','Galanodel','Goldenleaf','Highwood',
        'Holimion','Liadon','Meliamne','Moonwhisper','Nailo','Nightbreeze','Silverwind',
        'Siannodel','Starweaver','Sunleaf','Sylvaranth','Tiarith','Thunderwind','Wisdomweave',
        'Windrunner','Xiloscient','Thornweave','Riverdawn','Moonshadow','Leafwhisper',
      ],

      dwarf_male: [
        'Adrik','Alberich','Baern','Barendd','Brottor','Bruenor','Dain','Darrak','Delg',
        'Eberk','Einkil','Fargrim','Flint','Gardain','Harbek','Kildrak','Morgran','Oin',
        'Oskar','Rangrim','Reidoth','Rurik','Taklinn','Thoradin','Thorin','Tordek','Traubon',
        'Travok','Ulfgar','Veit','Vondal','Borin','Cromdar','Daval','Dolgrin','Duren',
        'Durgin','Egrim','Faldir','Farrath','Garic','Ghaltin','Gondar','Gordin','Grumbar',
        'Grundin','Harthar','Heldin','Holgur','Ingil','Jordin','Keldrin','Koldir','Korg',
      ],
      dwarf_female: [
        'Amber','Artin','Audhild','Bardryn','Dagnal','Diesa','Eldeth','Falkrunn','Finellen',
        'Gunnloda','Gurdis','Helja','Hlin','Kathra','Kristryd','Ilde','Liftrasa','Mardred',
        'Riswynn','Sannl','Torbera','Torgga','Vistra','Brimra','Deldra','Durris','Edra',
        'Fegra','Galda','Helgar','Hildreth','Ilgra','Jodra','Kelda','Koldreth','Lendra',
        'Meldra','Mordra','Neldra','Ordra','Perdreth','Rildra','Seldra','Torvara','Uldra',
      ],
      dwarf_surname: [
        'Balderk','Battlehammer','Boulderhoulder','Brawnvein','Crownforger','Deepaxe',
        'Drakeblight','Fireforge','Flinthammer','Foamtankard','Graymantle','Hammerstone',
        'Hardcheese','Ironfoot','Loderr','Oreslaser','Quarryfist','Rockseeker','Silvertongue',
        'Slateback','Smokehammer','Steamshield','Steeljaw','Stoneboar','Stonefoot','Torunn',
        'Thunderhelm','Ungart','Firehand','Ironbeard','Goldvein','Copperkettle',
      ],

      halfling: [
        'Alton','Ander','Cade','Corrin','Eldon','Errich','Finnan','Garret','Lazam','Lyle',
        'Merric','Milo','Osborn','Perrin','Reed','Roscoe','Wellby','Amaryllis','Andry',
        'Blossom','Bree','Callie','Daisy','Eida','Euphemia','Lavinia','Lidda','Merla',
        'Nedda','Paela','Portia','Seraphina','Shaena','Trym','Vani','Wren','Donnie',
        'Eddie','Ellie','Fildo','Garnet','Jinny','Kith','Lottie','Maevey','Nell','Peri',
        'Rafe','Sandy','Sigil','Tamsin','Cobb','Dinle','Fulward','Gilly','Hobb','Ilsa',
      ],
      halfling_surname: [
        'Brushgather','Goodbarrel','Greenbottle','Highhill','Hilltopple','Leagallow',
        'Noakes','Overhill','Smallburrow','Tealeaf','Thistlewool','Thorngage','Underbough',
        'Underwood','Warmwater','Whispering','Longbottom','Twofoot','Bracegirdle','Took',
        'Baggins','Proudfoot','Gamgee','Brandybuck','Hornblower','Whitfoot','Greenhill',
      ],

      gnome: [
        'Alston','Alvyn','Boddynock','Brocc','Burgell','Dimble','Ellywick','Erky','Fonkin',
        'Frug','Gerbo','Gimble','Glim','Jebeddo','Kellen','Namfoodle','Orryn','Roondar',
        'Seebo','Sindri','Warryn','Zook','Bimpnottin','Breena','Caramip','Carlin','Donella',
        'Duvamil','Ella','Ellyjobell','Loopmottin','Lorilla','Mardnab','Nissa','Nyx',
        'Oda','Orla','Roywyn','Shamil','Tana','Waywocket','Zanna','Pip','Fitz','Nim',
      ],
      gnome_surname: [
        'Beren','Bockris','Daergel','Folkor','Garrick','Nackle','Murnig','Ningel',
        'Raulnor','Scheppen','Turen','Fixadal','Fapplestamp','Sprootwiddle','Timbers',
      ],

      halforc: [
        'Dench','Feng','Gell','Henk','Holg','Imsh','Keth','Krusk','Mhurren','Ront',
        'Shump','Thokk','Baggi','Emen','Engong','Kansif','Myev','Neega','Ovak','Ownka',
        'Shautha','Sutha','Vola','Volen','Yevelda','Arha','Brug','Dacr','Drura','Gnar',
        'Harsk','Hogg','Imorr','Jorn','Karg','Kragg','Lurash','Morg','Norgg','Prash',
        'Rhor','Rugg','Sharg','Tharsh','Ulgroth','Varg','Vorn','Worg','Xarg','Yurk',
      ],

      tiefling: [
        'Art','Carrion','Chant','Creed','Despair','Excellence','Fear','Glory','Hope',
        'Ideal','Music','Nowhere','Open','Poetry','Quest','Random','Reverence','Sorrow',
        'Temerity','Torment','Weary','Zeal','Akta','Aym','Azza','Beleth','Bryseis',
        'Criella','Damaia','Ea','Gadreel','Ianua','Kallista','Lerissa','Makaria','Nemeia',
        'Orianna','Phelaia','Rieta','Takanal','Yael','Barakas','Damakos','Ekemon','Iados',
        'Kairon','Leucis','Melech','Mordai','Morthos','Pelaios','Skamos','Therai','Vex',
        'Ash','Brand','Cinder','Dusk','Ember','Flare','Grim','Hex','Ink','Jinx',
      ],

      dragonborn_male: [
        'Arjhan','Balasar','Bharash','Donaar','Ghesh','Heskan','Kriv','Medrash','Mehen',
        'Nadarr','Pandjed','Patrin','Rhogar','Shamash','Shedinn','Tarhun','Torinn',
        'Daraan','Ferenk','Ghaesh','Ivaranx','Jheran','Karajh','Lareth','Merrath',
        'Naarak','Oraan','Preeth','Quarath','Rivaan','Sivaarak','Thurath','Viraan',
      ],
      dragonborn_female: [
        'Akra','Biri','Daar','Farideh','Harann','Havilar','Jheri','Kava','Korinn',
        'Mishann','Nala','Perra','Raiann','Sora','Surina','Thava','Uadjit',
        'Birinn','Daavett','Farindel','Haraveth','Iriask','Jhirenn','Karath','Laveth',
        'Miresh','Naariveth','Oresk','Pireth','Quireth','Raveth','Sorath','Thiveth',
      ],
      dragonborn_surname: [
        'Clethtinthiallor','Daardendrian','Delmirev','Drachedandion','Fenkenkabradon',
        'Kepeshkmolik','Kerrhylon','Kimbatuul','Myastan','Nemmonis','Norixius','Shestendeliath',
        'Turnuroth','Verthisathurgiesh','Yarjerit','Prexijandilin','Ophinshtalajiir',
      ],
    },

    // ─── Races ─────────────────────────────────────────────────────────────────
    races: [
      {v:'Human',        nameKey:'human',       w:22},
      {v:'High Elf',     nameKey:'elf',         w:9},
      {v:'Wood Elf',     nameKey:'elf',         w:7},
      {v:'Drow',         nameKey:'elf',         w:3},
      {v:'Hill Dwarf',   nameKey:'dwarf',       w:7},
      {v:'Mountain Dwarf',nameKey:'dwarf',      w:4},
      {v:'Lightfoot Halfling',nameKey:'halfling',w:6},
      {v:'Stout Halfling',nameKey:'halfling',   w:4},
      {v:'Half-Elf',     nameKey:'human',       w:9},
      {v:'Rock Gnome',   nameKey:'gnome',       w:4},
      {v:'Forest Gnome', nameKey:'gnome',       w:3},
      {v:'Tiefling',     nameKey:'tiefling',    w:6},
      {v:'Half-Orc',     nameKey:'halforc',     w:5},
      {v:'Dragonborn',   nameKey:'dragonborn',  w:4},
      {v:'Aasimar',      nameKey:'human',       w:3},
      {v:'Tabaxi',       nameKey:'tiefling',    w:2},
      {v:'Kenku',        nameKey:'generic',     w:1},
      {v:'Goblin',       nameKey:'generic',     w:1},
      {v:'Firbolg',      nameKey:'generic',     w:1},
    ],

    // ─── Genders ───────────────────────────────────────────────────────────────
    genders: [
      {v:'Male',   pronouns:['he','him','his'],  w:50},
      {v:'Female', pronouns:['she','her','her'], w:50},
    ],

    // ─── Alignments ────────────────────────────────────────────────────────────
    alignments: [
      {v:'Lawful Good',    w:8},
      {v:'Neutral Good',   w:14},
      {v:'Chaotic Good',   w:10},
      {v:'Lawful Neutral', w:10},
      {v:'True Neutral',   w:16},
      {v:'Chaotic Neutral',w:10},
      {v:'Lawful Evil',    w:6},
      {v:'Neutral Evil',   w:10},
      {v:'Chaotic Evil',   w:6},
    ],

    // ─── Occupations ───────────────────────────────────────────────────────────
    occupations: {
      'Artisan':      ['Blacksmith','Carpenter','Mason','Cobbler','Tailor','Jeweler','Potter',
                       'Glassblower','Leatherworker','Weaver','Brewer','Baker','Woodcarver',
                       'Tinker','Ropemaker','Candlemaker','Dyer','Cooper'],
      'Criminal':     ['Pickpocket','Fence','Smuggler','Extortionist','Con Artist','Forger',
                       'Hired Blade','Street Tough','Spy','Kidnapper','Loan Shark','Safecracker',
                       'Fraudster','Infiltrator'],
      'Entertainment':['Bard','Acrobat','Actor','Professional Gambler','Jester','Storyteller',
                       'Dancer','Puppeteer','Singer','Street Performer','Fight Promoter',
                       'Pit Fighter','Traveling Circus Performer'],
      'Military':     ['City Guard','Soldier','Mercenary','Sellsword','Bounty Hunter',
                       'Town Constable','Knight-Errant','Retired General','Militia Captain',
                       'Armory Keeper','Bodyguard','War Veteran','Deserter in Hiding'],
      'Merchant':     ['General Goods Dealer','Spice Trader','Arms Dealer','Moneylender',
                       'Traveling Merchant','Black Market Dealer','Exotic Goods Importer',
                       'Pawnbroker','Book Dealer','Alchemical Supplier','Harbor Broker',
                       'Antiquities Dealer','Tax Collector'],
      'Religious':    ['Acolyte','Priest','Monk','Inquisitor','Shrine Keeper','Pilgrim',
                       'Healer','Temple Guard','Doomsayer','Relic Hunter','Holy Warrior',
                       'Excommunicated Cleric','Street Preacher'],
      'Scholar':      ['Scribe','Librarian','Historian','Sage','Alchemist','Archivist',
                       'Cartographer','Linguist','Astronomer','Natural Philosopher',
                       'Translator','Genealogist','Cryptographer','Spell Theorist'],
      'Service':      ['Innkeeper','Barkeep','Servant','Cook','Stablehand','Messenger',
                       'Courier','Porter','Dock Worker','Launderer','Rat Catcher',
                       'Street Sweeper','Undertaker','Midwife'],
      'Wilderness':   ['Hunter','Trapper','Forester','Ranger','Herbalist','Scout',
                       'Wilderness Guide','Fisher','Farmer','Beekeeper','Shepherd',
                       'Hedge Witch','Mountain Guide'],
      'Magic':        ['Apprentice Wizard','Hedge Mage','Fortune Teller','Enchanter',
                       'Diviner','Artificer','Runecaster','Ward Setter','Potion Maker',
                       'Scroll Scribe','Failed Wizard','Warlock in Denial'],
      'Noble':        ['Younger Heir','Dispossessed Heir','Minor Lord','Courtier',
                       'Diplomat','Political Exile','Disgraced Knight','Royal Spy'],
      'Laborer':      ['Miner','Quarry Worker','Ditch Digger','Lumberjack','Farmhand',
                       'Dockhand','Gravedigger','Stonemason\'s Laborer','Road Builder'],
    },

    // ─── Occupation weights (by category name → relative likelihood) ───────────
    // Higher = more common. Unlisted categories get weight 3.
    occupationWeights: {
      'Service':       20,
      'Laborer':       18,
      'Artisan':       16,
      'Wilderness':    12,
      'Merchant':      12,
      'Military':       8,
      'Entertainment':  7,
      'Religious':      6,
      'Criminal':       5,
      'Scholar':        4,
      'Maritime':       4,
      'Magic':          3,
      'Underworld':     2,
      'Arcane':         2,
      'Noble':          1,
    },

    // ─── Age ranges ────────────────────────────────────────────────────────────
    ageRanges: [
      {v:'Young Adult', w:15},
      {v:'Adult',       w:35},
      {v:'Middle-Aged', w:28},
      {v:'Old',         w:16},
      {v:'Elderly',     w:6},
    ],

    // ─── Appearance ────────────────────────────────────────────────────────────
    builds: [
      'slender','stocky','lanky','compact','broad-shouldered','slight','wiry','heavyset',
      'lean and angular','barrel-chested','rangy','thick-necked','spare','powerful','gaunt',
      'soft-featured','athletic','hunched','square-jawed','long-limbed',
    ],

    features: [
      'a pale scar running from jaw to ear','mismatched eyes','elaborate tattoos on both forearms',
      'impractically styled hair that never moves','remarkably good posture','rarely blinks',
      'perpetual ink stains on both hands','a ring on the wrong finger they never explain',
      'a nervous habit of adjusting the same buckle','always holding something — a coin or stone',
      'a half-healed cut above one eyebrow','a missing fingertip on their left hand',
      'a network of old burn scars on their forearm','one ear slightly higher than the other',
      'deeply calloused hands inconsistent with their stated profession',
      'teeth that have been repaired, expensively','a faint, permanent squint','a crooked nose, broken at least once',
      'an old brand mark, usually kept covered','eyes that catch light strangely',
      'a stiff left knee that they try to disguise','a habit of rubbing the same spot on their wrist',
      'a very faint accent that surfaces under stress','two different boot heels',
      'a woven bracelet they never remove','a small vial worn on a cord around their neck',
      'unusual tooth filing — filed to points','a patch over one eye with no explanation given',
      'fingernails that are meticulously maintained despite everything else','a slight tremor in their left hand',
      'an old wound that pulls at their expression when they smile','ears that betray mixed heritage',
      'grey at the temples far too young','a jaw that clenches when they\'re thinking',
      'a faded blue mark on the back of their neck that looks deliberate','a habit of touching their collarbone',
      'a ring of callus around one wrist, consistent with old manacles','unusually long fingers',
      'a subtle chemical smell that soap doesn\'t entirely remove','a tiny religious symbol tattooed inside one wrist',
    ],

    eyeColors: [
      'deep brown, almost black','warm brown','light brown with gold flecks','amber, like old honey',
      'hazel — shifts between green and brown','pale hazel','clear grey','steel grey',
      'dark grey, almost stone','pale blue, almost silver','bright blue','deep blue',
      'blue with a faint starburst of gold around the iris','pale green, striking',
      'deep green','grey-green','dark green with flecks of brown',
      'striking violet (perhaps magic, perhaps birth)','mismatched — one brown, one grey',
      'unusually pale for their complexion','ringed in dark at the edge of the iris',
      'red-rimmed — from chronic illness, drink, or grief','very dark, deeply set',
      'catlike — slightly elongated pupils','clouded in one eye',
    ],

    hairStyles: [
      'close-cropped and neat','shaved close on the sides, longer on top','cropped short, practical',
      'a rough self-cut that got slightly out of hand','completely shaved',
      'long and loose, usually in the way','long and tied back in a leather cord',
      'a single heavy braid down the back','two braids, one shorter than the other',
      'elaborately braided, incongruously so','a tight military knot at the back of the neck',
      'pulled severely back from the face','a mess of dark curls kept under loose control',
      'thick and unkempt, rarely dealt with','wild, sticking out at odd angles',
      'thinning and uncombed, what\'s left left alone','silver-white well before its time',
      'streaked heavily with grey','dyed — not its natural color, and not recently retouched',
      'oiled and combed back with some care','worn under a hood or hat, rarely seen uncovered',
      'shaved on one side with the rest hanging over','shot through with a single white streak',
      'twisted into several locs','locs worked with beads or cord',
    ],

    // ─── Personality ───────────────────────────────────────────────────────────
    traits: [
      'Never looks anyone in the eye, but misses nothing.',
      'Always speaks in a slightly-too-loud voice, as if addressing a crowd.',
      'Has a habit of finishing other people\'s sentences — usually correctly.',
      'Touches every doorframe before passing through.',
      'Compulsively straightens things that are slightly crooked.',
      'Refers to themselves in the third person when stressed.',
      'Carries a notebook and writes in it constantly.',
      'Can\'t help offering unsolicited tactical assessments of their surroundings.',
      'Always knows how many exits a room has.',
      'Keeps a running tally of favors owed in both directions.',
      'Makes very precise, very confident predictions that are often wrong.',
      'Whistles under their breath when nervous.',
      'Hums an unrecognizable tune while doing anything tedious.',
      'Gives everything a name, including objects they\'ve just picked up.',
      'Reframes every setback as part of a larger plan.',
      'Can\'t let a misquote stand uncorrected.',
      'Always orders the same thing, everywhere they go.',
      'Carries too many keys and refuses to explain what they all open.',
      'Takes unnecessarily dramatic pauses before saying ordinary things.',
      'Memorizes the prices of everything they encounter.',
      'Speaks in complete, grammatically formal sentences even in casual conversation.',
      'Quietly collects small rocks from every new place they visit.',
      'Starts stories in the middle and expects listeners to catch up.',
      'Sincerely believes they are a decent liar. They are not.',
      'Offers food to people who appear stressed, regardless of context.',
      'Always sits where they can see the door.',
      'Cannot resist repeating rumors they\'ve just heard.',
      'Has a habit of narrating their own actions under their breath.',
      'Changes their accent slightly depending on who they\'re talking to.',
      'Tells vastly exaggerated stories about their youth, completely straight-faced.',
      'Refers to all prices as outrageous, even reasonable ones.',
      'Somehow always appears to be in a slight hurry.',
      'Picks up accents from people they\'ve spent more than five minutes with.',
      'Is never surprised — or at least, would never admit it.',
      'Consistently underestimates distances when giving directions.',
      'Has a deep, unreasoning distrust of birds.',
      'Extremely protective of a completely ordinary-seeming object.',
      'Becomes significantly more competent under pressure.',
      'Absolutely convinced they are bad luck. Evidence against this does not help.',
      'Has a firm handshake regardless of the physical mismatch with the other person.',
      'Insists on paying their share precisely. Not more, not less.',
      'Prone to extended, philosophical tangents from mundane conversations.',
      'Has a genuinely excellent memory for faces but terrible memory for names.',
      'Compares everything unfavorably to somewhere else they\'ve been.',
      'Has never met a stranger, only a future contact.',
      'Always speaks well of the dead, even ones they didn\'t like.',
      'Deeply superstitious in very specific, inconsistent ways.',
      'Makes friends with animals almost immediately.',
      'Cannot pass a game of chance without at least watching.',
      'Has an opinion about everything, including things they know nothing about.',
      'Consistently arrives slightly late and is always slightly surprised by this.',
      'Brings more provisions than any reasonable person would need.',
      'Fundamentally skeptical of anything free. There is always a cost.',
      'Perpetually planning a trip they will never take.',
      'Claims to have a cousin who does exactly whatever thing was just mentioned.',
      'Always appears faintly amused by whatever\'s happening.',
      'Punctuates speech with long silences that they expect others to fill.',
      'Inexplicably well-informed about the personal lives of powerful people.',
      'Announces their intentions clearly and then does something different.',
      'Maintains steady eye contact for slightly too long when listening.',
      'Has a very strong preference for specific numbers. Won\'t explain it.',
      'Always apologizes before disagreeing, then disagrees firmly.',
      'Refers to every group by a nickname only they use.',
      'Cannot help noticing when someone is lying, and their expression shows it.',
      'Keeps a very old letter in their pocket. Has read it many times.',
      'Never admits to not knowing something — just gives a very confident wrong answer.',
      'Treats every task as if they personally invented the correct way to do it.',
      'Has a specific phrase they use to end every conversation.',
      'Remembers birthdays. Always. For people they\'ve met twice.',
      'Aggressively helpful to strangers in a way that makes the strangers uncomfortable.',
      'Compulsively counts things — steps, ceiling beams, coins in a purse.',
      'Has extremely strong opinions about how knots should be tied.',
      'Reads out loud when alone. Doesn\'t realize they\'re still doing it when others arrive.',
      'Cannot make small talk. Will skip immediately to something personal and sincere.',
      'Has a distinctive smell they seem unaware of (woodsmoke, herbs, machine oil, old paper).',
      'Always knows what phase the moon is in and will mention it.',
      'Refuses to use profanity but invents elaborate substitutes.',
      'Extremely comfortable with silence. Will wait out any awkward pause with apparent serenity.',
      'Has extremely specific ideas about what order things should be done in.',
      'Uses humor as a deflection mechanism and everyone who knows them is aware of it.',
      'Will always tell you if you have something in your teeth.',
    ],

    ideals: [
      'Freedom — No one tells me where to go or what to do. That\'s the whole point.',
      'Loyalty — The people I commit to, I don\'t leave behind. Period.',
      'Knowledge — Everything is more interesting when you understand it.',
      'Power — Enough of it, and no one can take anything from you again.',
      'Protection — Someone has to look out for those who can\'t do it themselves.',
      'Order — Most problems come from people not following the rules that exist for good reason.',
      'Profit — I\'m not ashamed. Money is freedom, and freedom matters.',
      'Justice — The powerful should answer for what they do to the powerless.',
      'Survival — Abstract principles are luxuries. Getting through is what counts.',
      'Redemption — I have done things I\'m not proud of. I intend to balance the account.',
      'Community — Where I come from, you help each other. That\'s just how it works.',
      'Legacy — Something of me should remain. Something worth leaving.',
      'Truth — I would rather know a terrible thing than believe a comfortable lie.',
      'Craft — Whatever I do, I want to do it well. Properly. All the way.',
      'Independence — I built what I have. No one handed it to me, and no one owns it.',
      'Change — The way things are is not the way things have to be.',
      'Tradition — What worked for the people before us probably still works.',
      'Honor — My word is a real thing. I treat it accordingly.',
      'Ambition — I know where I\'m going. Everything is a step toward it.',
      'Peace — I have seen enough conflict. I want to make things quieter, not louder.',
      'Curiosity — There are still things I haven\'t seen yet. That seems like a reason to keep going.',
      'Mercy — Most people are doing the best they can. I try to remember that.',
      'Caution — Acting too fast is how you end up with more problems than you started with.',
      'Revenge — I haven\'t forgotten. I\'m just patient.',
      'Pleasure — Life is short. I intend to enjoy the parts I can.',
      'Beauty — The world is still worth making things for.',
      'Humility — I have been wrong before. Probably more recently than I remember.',
      'Responsibility — Someone has to be the one who shows up. Might as well be me.',
      'Fairness — I want the same rules to apply to everyone. Including me.',
      'Tenacity — It hasn\'t broken me yet. That means something.',
      'Trust — You can\'t do anything worth doing alone. Might as well figure out who to believe.',
      'Innovation — The thing that worked last time won\'t necessarily work this time.',
      'Integrity — I want to be able to look back at what I\'ve done and still recognize myself.',
      'Connection — The relationships I have matter more than the places I\'ve been or the things I\'ve done.',
      'Adaptation — I don\'t get attached to how things are. They change. So do I.',
    ],

    bonds: [
      'Sends money home to an aging parent without fail, every month.',
      'Has sworn an oath to a god they no longer fully believe in.',
      'Owes a life debt to someone who would be embarrassed to know they\'re still counting.',
      'Quietly desperate to find a sibling who disappeared years ago.',
      'Deeply loyal to a mentor who turned out to be morally complicated.',
      'Protecting the reputation of someone who can no longer protect it themselves.',
      'Wants to buy back land that was taken from their family.',
      'Had a partner who died on a job gone wrong. Has never fully stopped looking into it.',
      'Searching for a specific person — for very different reasons than they\'ve told anyone.',
      'Owes a significant debt to someone they\'d rather not owe anything to.',
      'The last surviving member of something — a family, a unit, a crew.',
      'Inexplicably loyal to a city that gave them little in return.',
      'Devoted to a younger sibling who looks up to them more than they deserve.',
      'Made a promise to a dying person and hasn\'t been able to keep it yet.',
      'Genuinely loves their work in a way that surprises most people.',
      'Has a friend they would do almost anything for — and the friend knows it.',
      'Protecting a secret someone else trusted them with.',
      'Mentoring someone younger, perhaps because no one did the same for them.',
      'Extremely protective of one specific place — not necessarily their home.',
      'Quietly building toward something — doesn\'t talk about it, but every decision points the same direction.',
      'Has an old friend who fell on very different terms with the world. Keeps in touch anyway.',
      'Has a rival they respect far more than any ally.',
      'Was raised to believe something very specific. Still does, at inconvenient moments.',
      'Has a symbol, token, or memento they\'d rather lose themselves than lose.',
      'Loyal to an institution that they know is imperfect.',
      'Has never quite gotten over a home they had to leave.',
      'Dedicated to a cause larger than themselves, even when that\'s uncomfortable.',
      'Has one person in the world whose opinion actually matters to them.',
      'Takes on work they aren\'t paid for when it benefits people they care about.',
      'Keeps a record of everyone who has helped them, intending to pay it back someday.',
    ],

    flaws: [
      'Cannot resist showing off in front of an audience.',
      'Pathologically bad at keeping secrets.',
      'Freezes completely around real authority figures.',
      'Has a gambling problem they\'ve rationalized into a system.',
      'Consistently overestimates their own abilities — usually by exactly enough to cause a problem.',
      'Cannot say no to a dare, regardless of stakes.',
      'Holds grudges for an unreasonable length of time.',
      'Terrible at asking for help until it\'s far too late.',
      'Makes major decisions entirely on impulse.',
      'Convinced they are one good idea away from solving everything.',
      'Has a very short fuse around a specific kind of person.',
      'Drinks more than is helpful in stressful situations.',
      'Talks when they should be quiet in almost every situation that matters.',
      'Cannot walk past an injustice without getting involved, even when this makes things worse.',
      'Lies reflexively, even when the truth would serve them better.',
      'Deeply distrustful of people who are kind without obvious reason.',
      'Has an ego that gets in the way of doing things correctly.',
      'Catastrophizes. Every setback is the beginning of total collapse.',
      'Avoids conflict to such a degree that real problems go unaddressed.',
      'Has a weakness for a specific thing — food, finery, flattery — that makes them easy to manipulate.',
      'Carries so much guilt about a past decision that they make it worse by overcorrecting.',
      'Makes promises they intend to keep but structurally cannot.',
      'Has a self-destructive response to success — sabotages things when they go too well.',
      'Refuses to admit ignorance. Gives confident wrong answers instead.',
      'Cannot stop picking at problems that have already been resolved.',
      'Dramatically underestimates how other people perceive their behavior.',
      'Has a pride that makes accepting help feel like defeat.',
      'Keeps score in ways the other person doesn\'t know about, then acts on those scores.',
      'Has a habit that other people find off-putting and they are genuinely unaware of.',
      'Pushes people away when they get close, then resents being alone.',
    ],

    // ─── Speech patterns ───────────────────────────────────────────────────────
    speech: [
      'Formal, precise diction — never contractions, every sentence complete.',
      'Short sentences. Pauses often. Makes people wait for the point.',
      'Tells long stories around the thing they actually mean.',
      'Asks questions instead of making statements.',
      'Speaks quietly and expects people to lean in.',
      'Speaks quickly, with tangents, circles back eventually.',
      'Uses a specific regional idiom no one else in the room understands.',
      'Repeats the last thing the other person said before responding.',
      'Very dry. Indistinguishable from sincere until you know them.',
      'Talks to everyone as though they are slightly hard of hearing.',
      'Uses profanity casually and doesn\'t notice other people\'s reactions to it.',
      'Completes every explanation with "You understand." Whether or not you do.',
      'Narrates what they\'re doing as they\'re doing it.',
      'Heavily accented — from somewhere far from here.',
      'Addresses people by title and surname until told otherwise, then forgets.',
      'Talks over people when excited. Doesn\'t realize it.',
      'Almost whispers when making important points.',
      'Speaks in anecdotes — everything is illustrated with a story.',
      'Uses understatement consistently. Describes disasters as "unfortunate."',
      'Laughs between sentences, even in serious conversations.',
      'Gets more articulate when angry, not less.',
      'Uses "we" when they mean "I."',
      'Ends almost every statement with a slight upward inflection.',
      'Speaks plainly and directly. No decoration. Sometimes it lands wrong.',
      'Extremely formal with strangers, very loose with people they trust.',
      'Pauses before answering even simple questions. Never seems flustered — just unhurried.',
      'Never says "I don\'t know" — says "that\'s an interesting question" instead.',
      'Pepper every third sentence with a specific verbal tic they seem unaware of.',
      'Speaks in lists. Three things. Always exactly three.',
      'Extremely precise about details others would round off.',
      'Speaks confidently about things they are clearly making up.',
      'Heavy use of military vocabulary regardless of context.',
      'Never uses a person\'s name. Calls everyone "friend" or "colleague."',
      'Has a calming cadence that makes even bad news sound manageable.',
      'Interrupts their own sentences to correct themselves.',
      'Speaks as though they\'re being quoted and are aware of it.',
    ],

    // ─── Hooks ────────────────────────────────────────────────────────────────
    hooks: [
      'Needs someone to retrieve something from a place they can\'t safely go themselves.',
      'Witnessed something they haven\'t reported — and won\'t, without persuasion.',
      'Has overheard conversations they definitely shouldn\'t have.',
      'Looking for a discreet buyer for something they shouldn\'t possess.',
      'Owes a debt they cannot repay and is getting desperate.',
      'Claims to have a lead on something valuable — but won\'t say where they heard it.',
      'Knows a passage or route that isn\'t on any map.',
      'Wants revenge on someone but can\'t act directly.',
      'Has information about something dangerous happening nearby — and is afraid to say so.',
      'Looking for discreet allies for a venture they\'d rather not explain in full.',
      'Carrying something that isn\'t theirs and is afraid to give it back.',
      'Has pieced together something they weren\'t supposed to know, and isn\'t sure who to trust.',
      'Is being followed and doesn\'t know why.',
      'Needs someone to impersonate them for a meeting they can\'t attend.',
      'Sitting on a secret that has become dangerous to know.',
      'Has access to a place the party needs to get into.',
      'Knows something about a nearby organization that its members don\'t want publicized.',
      'Has been hired to watch someone — and is now having second thoughts.',
      'Is being blackmailed, and the leverage is in a location they can\'t safely access.',
      'Needs something authenticated, and the real authenticators are compromised.',
      'Claims to have been somewhere no one believes they could have been.',
      'Is quietly putting together a list of people who wronged them, long ago.',
      'Has a skill or resource the party needs but won\'t give it away without something in return.',
      'Looking for someone, using a description that could fit almost anyone.',
      'Has recently come into possession of a document that has made their life complicated.',
      'Wants to hire someone but is embarrassed by what the job actually involves.',
      'Is protecting a piece of information — won\'t say from whom, or why it\'s valuable.',
      'Has been warned to stay away from a location they were already planning to investigate.',
      'Needs a message delivered to someone difficult to reach, through channels that don\'t ask questions.',
      'Knows where a wanted person is hiding and hasn\'t decided what to do about it yet.',
      'Recently escaped from somewhere and hasn\'t told anyone yet.',
      'Has a contact who wants to meet someone with the party\'s specific set of skills.',
      'Is assembling something — parts, people, resources — for a purpose they\'re keeping vague.',
      'Has an offer they\'ve been sitting on because they don\'t trust the person who made it.',
      'Knows the party\'s destination better than they\'ve let on.',
    ],

    // ─── Secrets (DM-only) ────────────────────────────────────────────────────
    secrets: [
      'Not who they say they are. The real identity is either dead or dangerous.',
      'Responsible for something that went wrong years ago. Has never admitted it.',
      'Working for a second party whose interests conflict with their stated loyalties.',
      'Has been lying about their background since they arrived here.',
      'Knows the location of something valuable that they haven\'t disclosed.',
      'Is not entirely what they appear — in terms of race, alignment, or nature.',
      'Has a family member in a dangerous position. The connection is a liability.',
      'Was present at an incident that is still being actively investigated.',
      'Owes loyalty to a faction the party would find problematic.',
      'Carrying a communication they haven\'t delivered — and now can\'t.',
      'Has killed someone. The circumstances are complicated.',
      'Running from a sentence that was probably deserved.',
      'Knows the party\'s contact is not trustworthy. Hasn\'t said so.',
      'Has already sold information about the party to someone else.',
      'Is dying. Has perhaps a season left, and is trying to settle things.',
      'Was present at the founding of something that has since gone badly wrong.',
      'Is under a curse or compulsion they haven\'t disclosed.',
      'Has a history with the main villain that they haven\'t mentioned.',
      'The item they\'re selling is stolen. The original owner is looking for it.',
      'Is much more powerful than they\'ve let on. There\'s a reason they\'re hiding it.',
      'Has information that would resolve a major plot thread — but won\'t share it freely.',
      'Deeply in debt to a criminal organization that owns pieces of their life.',
      'Has a second job that the people who know them here would find alarming.',
      'Is in contact with someone the party is actively looking for.',
      'Was given something for safekeeping that the giver didn\'t survive to reclaim.',
      'Has committed a crime that hasn\'t been discovered yet — and the time to discover it is approaching.',
      'Knows a back way into a strongly guarded location from their time working there.',
      'Has a relationship with a faction the party has reason to distrust.',
      'Is two identities: one the party knows, one they don\'t. Both are real.',
      'Has a curse, disease, or condition they are managing and not disclosing.',
      'Was involved in something the party is currently investigating — on the other side.',
      'Has been given orders they disagree with and are slowly deciding whether to follow.',
      'Is being watched by someone they can\'t identify. Has noticed this. Hasn\'t acted yet.',
      'Has already tried and failed at the thing the party is about to attempt.',
      'Knows more about the party\'s patron than the party does.',
      'Has a blood debt — someone who must die by their hand before they can move on.',
      'Was responsible for an event that caused significant harm. No one knows.',
      'Is being used as an unwitting courier for something in their possessions they don\'t know about.',
    ],

    // ── Item tables (unchanged in structure, slightly expanded) ───────────────
    itemRarities: [
      {v:'Common',w:40},{v:'Uncommon',w:35},{v:'Rare',w:20},{v:'Very Rare',w:5},
    ],
    itemAdj: [
      'Battle-Worn','Reclaimed','Experimental','Weathered','Reinforced','Compact','Antique',
      'Field-Modified','Confiscated','Battered','Pristine','Oversized','Salvaged','Ancient',
      'Inscribed','Scorched','Blood-Stained','Well-Balanced','Gilded','Notched','Lacquered',
    ],
    itemTypes: [
      // Weapons
      {n:'Longsword',k:'Weapon'},{n:'Shortsword',k:'Weapon'},{n:'Dagger',k:'Weapon'},
      {n:'Handaxe',k:'Weapon'},{n:'Battleaxe',k:'Weapon'},{n:'War Pick',k:'Weapon'},
      {n:'Quarterstaff',k:'Weapon'},{n:'Shortbow',k:'Weapon'},{n:'Longbow',k:'Weapon'},
      {n:'Hand Crossbow',k:'Weapon'},{n:'Light Crossbow',k:'Weapon'},
      {n:'Spear',k:'Weapon'},{n:'Rapier',k:'Weapon'},{n:'Flail',k:'Weapon'},
      {n:'Mace',k:'Weapon'},{n:'Scimitar',k:'Weapon'},{n:'Trident',k:'Weapon'},
      {n:'Whip',k:'Weapon'},{n:'Greataxe',k:'Weapon'},{n:'Greatsword',k:'Weapon'},
      // Armor
      {n:'Shield',k:'Armor'},{n:'Buckler',k:'Armor'},{n:'Leather Armor',k:'Armor'},
      {n:'Studded Leather',k:'Armor'},{n:'Chain Shirt',k:'Armor'},
      {n:'Chainmail',k:'Armor'},{n:'Breastplate',k:'Armor'},{n:'Half-Plate',k:'Armor'},
      {n:'Helm',k:'Armor'},{n:'Gauntlets',k:'Armor'},{n:'Greaves',k:'Armor'},
      // Accessories
      {n:'Cloak',k:'Accessory'},{n:'Ring',k:'Accessory'},{n:'Amulet',k:'Accessory'},
      {n:'Pendant',k:'Accessory'},{n:'Brooch',k:'Accessory'},{n:'Bracelet',k:'Accessory'},
      {n:'Boots',k:'Accessory'},{n:'Gloves',k:'Accessory'},{n:'Belt',k:'Accessory'},
      {n:'Circlet',k:'Accessory'},{n:'Earring',k:'Accessory'},{n:'Eyepatch',k:'Accessory'},
      // Magical implements
      {n:'Wand',k:'Implement'},{n:'Rod',k:'Implement'},{n:'Staff',k:'Implement'},
      {n:'Orb',k:'Implement'},{n:'Crystal',k:'Implement'},{n:'Arcane Focus',k:'Implement'},
      {n:'Holy Symbol',k:'Implement'},{n:'Druidic Focus',k:'Implement'},
      // Miscellaneous
      {n:'Lantern',k:'Miscellaneous'},{n:'Flask',k:'Miscellaneous'},
      {n:'Tome',k:'Miscellaneous'},{n:'Grimoire',k:'Miscellaneous'},
      {n:'Compass',k:'Miscellaneous'},{n:'Spyglass',k:'Miscellaneous'},
      {n:'Pouch',k:'Miscellaneous'},{n:'Satchel',k:'Miscellaneous'},
      {n:'Hourglass',k:'Miscellaneous'},{n:'Locket',k:'Miscellaneous'},
      {n:'Quill and Inkwell',k:'Miscellaneous'},{n:'Puzzle Box',k:'Miscellaneous'},
    ],
    itemProps: {
      'Common': [
        'Glows faintly on command — 5 ft radius, no heat.',
        'Always warm to the touch, even in freezing environments.',
        'Emits a faint chime when within 30 ft of a currently locked door.',
        'Cleans itself of mundane dirt and stains once per day.',
        'The owner always knows which direction is north.',
        'Never gets wet, regardless of exposure.',
        'Makes no sound whatsoever when set down on any surface.',
        'Floats just above the surface if placed on still water.',
        'Faintly hums a tune when carried — the tune changes slightly each day.',
        'The bearer always knows what time it is, to the minute.',
      ],
      'Uncommon': [
        'Grants +1 to attack and damage rolls (weapon) or +1 AC (armor/shield).',
        'The bearer can cast Feather Fall on themselves once per day.',
        'Once per short rest, add +1d4 to a failed saving throw after seeing the result.',
        'While attuned, the bearer requires only 4 hours of sleep to gain long rest benefits.',
        'Can be used to cast Detect Magic once per day as a ritual.',
        'Grants advantage on Perception checks in dim light or darkness.',
        'When the bearer drops to 0 HP, emits a blinding 10 ft flash (Dex DC 13). Recharges at dawn.',
        'The bearer may communicate telepathically with one willing creature within 30 ft. Simple concepts only.',
        'While held, the bearer can understand (not speak) any language they hear.',
        'Once per short rest, the bearer may take the Dash action as a bonus action.',
      ],
      'Rare': [
        'Grants +2 to attack and damage rolls (weapon) or +2 AC (armor/shield).',
        'Grants a flying speed of 30 ft for 1 minute, once per day.',
        'While attuned, the bearer is immune to the frightened condition.',
        'Once per long rest, automatically succeed on one death saving throw (counts as a 20).',
        'The bearer can cast Misty Step once per short rest.',
        'Adds 1d6 force damage to all attacks (weapon) or grants resistance to one damage type (armor).',
        'While worn or held, the bearer cannot be surprised.',
        'Once per day, cast Dispel Magic at 3rd level without a spell slot.',
        'Grants darkvision 60 ft, or extends existing darkvision by 60 ft.',
        'The bearer can cast Invisibility on themselves once per day (concentration).',
      ],
      'Very Rare': [
        'Grants +3 to attack and damage rolls (weapon) or +3 AC (armor/shield).',
        'Has 3 charges. Expend 1 to cast Counterspell as a reaction. Regains 1d3 charges at dawn.',
        'The attuned bearer cannot be located by scrying spells or divination magic.',
        'Once per long rest, cast Plane Shift targeting only the bearer.',
        'Grants one additional attunement slot (maximum 4 total).',
        'While attuned, the bearer regains 1d4 HP at the start of each of their turns if they have at least 1 HP.',
      ],
    },
    sources: [
      'Looted from a defeated enemy','Found in an abandoned ruin','Purchased from a traveling merchant',
      'Left behind by a previous adventurer','Personal item, previous owner unknown',
      'Won in a game of chance','Reward for a completed job','Inherited from someone who didn\'t survive',
      'Payment for a debt','Found at the bottom of a pack that isn\'t theirs',
    ],
    prices: {
      'Common':'50–100 gp','Uncommon':'150–300 gp',
      'Rare':'500+ gp or not for sale','Very Rare':'Not for sale (found only)',
    },
  };

  // ── External table loading ───────────────────────────────────────────────────
  // Fetches generator/npc-tables.json relative to the app root.
  // Array fields are appended when _merge:true (default), replaced when _merge:false.
  function mergeExt(ext) {
    const doMerge = ext._merge !== false;
    function mergeVal(target, key, val) {
      if (key.startsWith('_')) return;          // skip comment/meta keys at any depth
      if (Array.isArray(val)) {
        target[key] = (doMerge && Array.isArray(target[key])) ? target[key].concat(val) : val;
      } else if (val && typeof val === 'object') {
        if (!target[key] || typeof target[key] !== 'object') target[key] = {};
        for (const k2 of Object.keys(val)) mergeVal(target[key], k2, val[k2]);
      } else {
        target[key] = val;
      }
    }
    for (const k of Object.keys(ext)) mergeVal(T, k, ext[k]);
  }
  fetch('generator/npc-tables.json')
    .then((r) => r.ok ? r.json() : null)
    .then((d) => { if (d) mergeExt(d); })
    .catch(() => {});

  // ── Utility ──────────────────────────────────────────────────────────────────
  function roll(arr)  { return arr[Math.floor(Math.random() * arr.length)]; }
  function rollW(tbl) {
    const total = tbl.reduce((s, e) => s + e.w, 0);
    let r = Math.floor(Math.random() * total);
    for (const e of tbl) { r -= e.w; if (r < 0) return e; }
    return tbl[tbl.length - 1];
  }

  // Pick N distinct items from arr
  function rollN(arr, n) {
    const copy = [...arr];
    const out  = [];
    for (let i = 0; i < Math.min(n, copy.length); i++) {
      const idx = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  }

  function rollName(nameKey, gender) {
    const gMap = {
      'human':      gender === 'Female' ? T.names.human_female    : T.names.human_male,
      'elf':        gender === 'Female' ? T.names.elf_female       : T.names.elf_male,
      'dwarf':      gender === 'Female' ? T.names.dwarf_female     : T.names.dwarf_male,
      'halfling':   T.names.halfling,
      'halforc':    T.names.halforc,
      'gnome':      T.names.gnome,
      'tiefling':   T.names.tiefling,
      'dragonborn': gender === 'Female' ? T.names.dragonborn_female: T.names.dragonborn_male,
      'generic':    T.names.human_male.concat(T.names.human_female),
    };
    const sMap = {
      'human':      T.names.human_surname,
      'elf':        T.names.elf_surname,
      'dwarf':      T.names.dwarf_surname,
      'halfling':   T.names.halfling_surname,
      'gnome':      T.names.gnome_surname,
      'dragonborn': T.names.dragonborn_surname,
    };
    const firstPool = gMap[nameKey] || gMap.generic;
    const lastPool  = sMap[nameKey] || T.names.human_surname;
    return roll(firstPool) + ' ' + roll(lastPool);
  }

  function rollOccupation() {
    const cats  = Object.keys(T.occupations);
    const wtbl  = cats.map((c) => ({ v: c, w: T.occupationWeights[c] || 3 }));
    const cat   = rollW(wtbl).v;
    return { category: cat, role: roll(T.occupations[cat]) };
  }

  // ── NPC Generator ────────────────────────────────────────────────────────────
  function generateNPC(seeds = {}) {
    const genderEntry = seeds.gender
      ? (T.genders.find((g) => g.v === seeds.gender) || rollW(T.genders))
      : rollW(T.genders);
    const gender    = genderEntry.v;
    const pronouns  = genderEntry.pronouns;

    const raceEntry = seeds.race
      ? (T.races.find((r) => r.v === seeds.race) || rollW(T.races))
      : rollW(T.races);
    const race      = raceEntry.v;
    const nameKey   = raceEntry.nameKey || 'generic';

    const alignment = seeds.alignment || rollW(T.alignments).v;
    const occ       = seeds.occupation
      ? (typeof seeds.occupation === 'string'
          ? { category: seeds.occupation, role: seeds.occupation }
          : seeds.occupation)
      : rollOccupation();
    const name      = seeds.name && seeds.name.trim()
      ? seeds.name.trim()
      : rollName(nameKey, gender);

    const age     = rollW(T.ageRanges).v;
    const build   = roll(T.builds);
    const feature = roll(T.features);
    const eyes    = roll(T.eyeColors);
    const hair    = roll(T.hairStyles);
    const voice   = roll(T.speech);
    const [trait1, trait2] = rollN(T.traits, 2);
    const ideal   = roll(T.ideals);
    const bond    = roll(T.bonds);
    const flaw    = roll(T.flaws);
    const hook    = roll(T.hooks);
    const secret  = Math.random() < 0.25 ? roll(T.secrets) : null;

    const id = 'gen_npc_' + Date.now() + '_' + Math.floor(Math.random() * 9999);

    const He = pronouns[0].charAt(0).toUpperCase() + pronouns[0].slice(1);

    const content = `<article class="entity npc">
  <dl class="facts">
    <dt>Race</dt>       <dd>${race}</dd>
    <dt>Gender</dt>     <dd>${gender}</dd>
    <dt>Age</dt>        <dd>${age}</dd>
    <dt>Alignment</dt>  <dd>${alignment}</dd>
    <dt>Occupation</dt> <dd>${occ.role}${occ.category !== occ.role ? ' <span class="tag">' + occ.category + '</span>' : ''}</dd>
  </dl>

  <h4>Appearance</h4>
  <p>${build.charAt(0).toUpperCase() + build.slice(1)} build, with ${feature}. ${He} has ${hair} hair and ${eyes} eyes.</p>

  <h4>Voice</h4>
  <p>${voice}</p>

  <h4>Personality</h4>
  <dl class="facts">
    <dt>Trait</dt> <dd>${trait1}</dd>
    <dt>Trait</dt> <dd>${trait2}</dd>
    <dt>Ideal</dt> <dd>${ideal}</dd>
    <dt>Bond</dt>  <dd>${bond}</dd>
    <dt>Flaw</dt>  <dd>${flaw}</dd>
  </dl>

  <h4>Hook</h4>
  <p>${hook}</p>

  <div class="dm-only">
    ${secret ? `<h4>Secret (DM Only)</h4><p>${secret}</p>` : ''}
    <h4>DM Notes</h4>
    <p><em>Add stats, allegiances, or additional notes here.</em></p>
  </div>
</article>`;

    return {
      id, name, type: 'npc', category: 'Generated',
      visibility: 'dm-only', contentType: 'inline', content,
      tags: ['generated'], _generated: true,
      _meta: { race, gender, alignment, occupation: occ.role },
    };
  }

  // ── Item Generator ────────────────────────────────────────────────────────────
  function generateItem() {
    const rarity = rollW(T.itemRarities).v;
    const adj    = roll(T.itemAdj);
    const type   = roll(T.itemTypes);
    const prop   = roll(T.itemProps[rarity]);
    const source = roll(T.sources);
    const name   = adj + ' ' + type.n;
    const id     = 'gen_item_' + Date.now() + '_' + Math.floor(Math.random() * 9999);

    const content = `<article class="entity item">
  <dl class="facts">
    <dt>Type</dt>          <dd>${type.k}</dd>
    <dt>Rarity</dt>        <dd>${rarity}</dd>
    <dt>Approx. Value</dt> <dd>${T.prices[rarity]}</dd>
    <dt>Provenance</dt>    <dd>${source}</dd>
  </dl>

  <h4>Property</h4>
  <p>${prop}</p>

  <div class="dm-only">
    <h4>DM Notes</h4>
    <p><em>Add attunement requirements, charges, lore, or current owner here.</em></p>
  </div>
</article>`;

    return {
      id, name, type: 'item', category: 'Generated',
      visibility: 'dm-only', contentType: 'inline', content,
      tags: ['generated', rarity.toLowerCase().replace(' ', '-')], _generated: true,
    };
  }

  // ── Quick NPC ────────────────────────────────────────────────────────────────
  // Stripped-down townsfolk generator: name + race/gender/occupation + one
  // appearance note + one personality trait. Returns a saveable entity object
  // with a `_quick` summary bag for the compact card display.
  function generateQuickNPC() {
    const genderEntry = rollW(T.genders);
    const gender      = genderEntry.v;
    const pronouns    = genderEntry.pronouns;
    const raceEntry   = rollW(T.races);
    const race        = raceEntry.v;
    const nameKey     = raceEntry.nameKey || 'generic';
    const name        = rollName(nameKey, gender);
    const occ         = rollOccupation();
    const build       = roll(T.builds);
    const feature     = roll(T.features);
    const trait       = roll(T.traits);
    const id          = 'gen_npc_' + Date.now() + '_' + Math.floor(Math.random() * 9999);

    const He         = pronouns[0].charAt(0).toUpperCase() + pronouns[0].slice(1);
    const appearance = `${build.charAt(0).toUpperCase() + build.slice(1)} build, with ${feature}.`;
    const headline   = `${gender} ${race}, ${occ.role}`;
    const occLabel   = occ.role + (occ.category !== occ.role ? ` <span class="tag">${occ.category}</span>` : '');

    const content = `<article class="entity npc">
  <dl class="facts">
    <dt>Race</dt>       <dd>${race}</dd>
    <dt>Gender</dt>     <dd>${gender}</dd>
    <dt>Occupation</dt> <dd>${occLabel}</dd>
  </dl>
  <h4>Appearance</h4>
  <p>${appearance}</p>
  <h4>Personality</h4>
  <p>${trait}</p>
</article>`;

    return {
      id, name, type: 'npc', category: 'Generated',
      visibility: 'dm-only', contentType: 'inline', content,
      tags: ['generated', 'quick'], _generated: true,
      _meta: { race, gender, occupation: occ.role },
      _quick: { headline, appearance, trait },
    };
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  function addEntity(entity) {
    _genList.push(entity);
    _genById.set(entity.id, entity);
    persistAll();
    if (!window.ENTITIES.find((x) => x.id === entity.id)) window.ENTITIES.push(entity);
    document.dispatchEvent(new CustomEvent('entities:ready'));
  }

  function removeEntity(id) {
    _genList = _genList.filter((e) => e.id !== id);
    _genById.delete(id);
    persistAll();
    const idx = window.ENTITIES.findIndex((e) => e.id === id);
    if (idx !== -1) window.ENTITIES.splice(idx, 1);
    document.dispatchEvent(new CustomEvent('entities:ready'));
  }

  function exportJSON(entity) {
    const { _generated, _meta, ...data } = entity;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = entity.id + '.json'; a.click();
    URL.revokeObjectURL(url);
  }

  // ── UI ───────────────────────────────────────────────────────────────────────
  let overlay, previewEl, saveBtn, exportBtn, rollBtn;
  let activeTab = 'npc';
  let _current  = null;

  function buildOccupationOptions() {
    return Object.entries(T.occupations)
      .map(([cat, roles]) =>
        `<optgroup label="${cat}">${roles.map((r) => `<option value="${r}">${r}</option>`).join('')}</optgroup>`)
      .join('');
  }

  function buildRaceOptions() {
    return T.races.map((r) => `<option value="${r.v}">${r.v}</option>`).join('');
  }

  function buildAlignmentOptions() {
    return T.alignments.map((a) => `<option value="${a.v}">${a.v}</option>`).join('');
  }

  function buildUI() {
    overlay = document.createElement('div');
    overlay.id = 'generator-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div id="generator-panel">
        <header id="generator-header">
          <h2>Generator</h2>
          <button id="generator-close" type="button" aria-label="Close">&times;</button>
        </header>

        <div id="generator-tabs">
          <button class="gen-tab gen-tab-active" data-type="npc">NPC</button>
          <button class="gen-tab" data-type="item">Item</button>
        </div>

        <div id="generator-body">

          <!-- NPC seed form -->
          <div id="gen-npc-form">
            <p class="gen-form-hint">Fill any field to lock it — leave blank for random.</p>
            <div class="gen-form-row gen-form-full">
              <label class="gen-form-label">Name</label>
              <input id="gen-seed-name" class="gen-form-input" type="text" placeholder="Leave blank for random" autocomplete="off">
            </div>
            <div class="gen-form-grid">
              <div class="gen-form-row">
                <label class="gen-form-label">Race</label>
                <select id="gen-seed-race" class="gen-form-select">
                  <option value="">— Random —</option>
                  ${buildRaceOptions()}
                </select>
              </div>
              <div class="gen-form-row">
                <label class="gen-form-label">Gender</label>
                <select id="gen-seed-gender" class="gen-form-select">
                  <option value="">— Random —</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Non-binary</option>
                </select>
              </div>
              <div class="gen-form-row">
                <label class="gen-form-label">Alignment</label>
                <select id="gen-seed-alignment" class="gen-form-select">
                  <option value="">— Random —</option>
                  ${buildAlignmentOptions()}
                </select>
              </div>
              <div class="gen-form-row">
                <label class="gen-form-label">Occupation</label>
                <select id="gen-seed-occupation" class="gen-form-select">
                  <option value="">— Random —</option>
                  ${buildOccupationOptions()}
                </select>
              </div>
            </div>
          </div>

          <div id="gen-roll-area">
            <button id="gen-roll-btn" type="button">&#9860; Generate</button>
            <div id="gen-preview"><p class="modal-status">Hit Generate to create an NPC.</p></div>
            <div id="gen-action-row">
              <button id="gen-save-btn" type="button" disabled>Add to Index</button>
              <button id="gen-export-btn" type="button" disabled>Export JSON</button>
            </div>
          </div>

          <div id="generator-saved-area">
            <p class="gen-saved-title">Saved Entities</p>
            <ul id="gen-saved-list"></ul>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    previewEl = overlay.querySelector('#gen-preview');
    saveBtn   = overlay.querySelector('#gen-save-btn');
    exportBtn = overlay.querySelector('#gen-export-btn');
    rollBtn   = overlay.querySelector('#gen-roll-btn');

    overlay.querySelector('#generator-close').addEventListener('click', closePanel);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closePanel(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) closePanel(); });

    overlay.querySelectorAll('.gen-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.type;
        overlay.querySelectorAll('.gen-tab').forEach((b) => b.classList.remove('gen-tab-active'));
        btn.classList.add('gen-tab-active');
        _current = null;
        previewEl.innerHTML = `<p class="modal-status">Hit Generate to create ${activeTab === 'npc' ? 'an NPC' : 'an item'}.</p>`;
        saveBtn.disabled = true;
        exportBtn.disabled = true;
        const form = overlay.querySelector('#gen-npc-form');
        if (form) form.hidden = (activeTab !== 'npc');
      });
    });

    rollBtn.addEventListener('click', () => {
      const seeds = activeTab === 'npc' ? readSeeds() : {};
      _current = activeTab === 'npc' ? generateNPC(seeds) : generateItem();
      renderPreview(_current);
      saveBtn.disabled = false;
      exportBtn.disabled = false;
    });

    saveBtn.addEventListener('click', () => {
      if (!_current) return;
      addEntity(_current);
      renderSavedList();
      previewEl.innerHTML = '<p class="modal-status">Saved. Generate again for another.</p>';
      _current = null;
      saveBtn.disabled = true;
      exportBtn.disabled = true;
    });

    exportBtn.addEventListener('click', () => { if (_current) exportJSON(_current); });

    renderSavedList();
  }

  function readSeeds() {
    return {
      name:      overlay.querySelector('#gen-seed-name')?.value.trim() || null,
      race:      overlay.querySelector('#gen-seed-race')?.value || null,
      gender:    overlay.querySelector('#gen-seed-gender')?.value || null,
      alignment: overlay.querySelector('#gen-seed-alignment')?.value || null,
      occupation: (() => {
        const val = overlay.querySelector('#gen-seed-occupation')?.value;
        if (!val) return null;
        // Find the category from the optgroup label
        const opt = overlay.querySelector(`#gen-seed-occupation option[value="${val}"]`);
        const cat = opt?.closest('optgroup')?.label || val;
        return { category: cat, role: val };
      })(),
    };
  }

  function renderPreview(entity) {
    previewEl.innerHTML = `
      <div class="gen-preview-card">
        <div class="gen-preview-name">
          <span class="gen-type-pill">${entity.type.toUpperCase()}</span>
          <strong>${entity.name}</strong>
          ${entity._meta ? `<span class="gen-meta">${entity._meta.race} · ${entity._meta.alignment}</span>` : ''}
        </div>
        <div class="gen-preview-body">${entity.content}</div>
      </div>`;
  }

  function renderSavedList() {
    if (!overlay) return;
    const ul = overlay.querySelector('#gen-saved-list');
    if (!ul) return;
    ul.innerHTML = '';
    if (!_genList.length) {
      ul.innerHTML = '<li class="gen-empty">No saved entities yet.</li>';
      return;
    }
    for (const e of [..._genList].reverse()) {
      const li = document.createElement('li');
      li.className = 'gen-saved-item';
      const typeSpan = document.createElement('span');
      typeSpan.className = 'gen-saved-type';
      typeSpan.textContent = e.type;
      const nameBtn = document.createElement('button');
      nameBtn.className = 'gen-saved-name';
      nameBtn.textContent = e.name;
      nameBtn.addEventListener('click', () => window.openLocationModal(e));
      const delBtn = document.createElement('button');
      delBtn.className = 'gen-delete-btn';
      delBtn.setAttribute('aria-label', 'Delete ' + e.name);
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => { removeEntity(e.id); renderSavedList(); });
      li.append(typeSpan, nameBtn, delBtn);
      ul.appendChild(li);
    }
  }

  function openPanel() {
    if (!overlay) buildUI();
    else renderSavedList();
    overlay.hidden = false;
  }
  function closePanel() { if (overlay) overlay.hidden = true; }

  // ── Quick NPC panel ───────────────────────────────────────────────────────────
  let quickPanel   = null;
  let _quickCurrent = null;

  function renderQuick(entity) {
    _quickCurrent = entity;
    quickPanel.querySelector('.qnpc-name').textContent       = entity.name;
    quickPanel.querySelector('.qnpc-headline').textContent   = entity._quick.headline;
    quickPanel.querySelector('.qnpc-appearance').textContent = entity._quick.appearance;
    quickPanel.querySelector('.qnpc-trait').textContent      = '“' + entity._quick.trait + '”';
    const saveBtn = quickPanel.querySelector('.qnpc-save-btn');
    saveBtn.textContent = 'Save';
    saveBtn.disabled    = false;
  }

  function buildQuickPanel() {
    quickPanel = document.createElement('div');
    quickPanel.id = 'quick-npc-panel';
    quickPanel.hidden = true;
    quickPanel.innerHTML = `
      <div class="qnpc-name-row">
        <strong class="qnpc-name"></strong>
        <button type="button" class="qnpc-close" aria-label="Close">&times;</button>
      </div>
      <div class="qnpc-headline"></div>
      <div class="qnpc-appearance"></div>
      <p class="qnpc-trait"></p>
      <div class="qnpc-actions">
        <button type="button" class="qnpc-reroll-btn">Re-roll</button>
        <button type="button" class="qnpc-save-btn">Save</button>
      </div>`;

    const wrap = document.getElementById('quick-npc-wrap');
    (wrap || document.body).appendChild(quickPanel);

    quickPanel.querySelector('.qnpc-close').addEventListener('click', () => {
      quickPanel.hidden = true;
    });
    quickPanel.querySelector('.qnpc-reroll-btn').addEventListener('click', () => {
      renderQuick(generateQuickNPC());
    });
    quickPanel.querySelector('.qnpc-save-btn').addEventListener('click', () => {
      if (!_quickCurrent) return;
      addEntity(_quickCurrent);
      const btn = quickPanel.querySelector('.qnpc-save-btn');
      btn.textContent = 'Saved!';
      btn.disabled    = true;
    });
  }

  function openQuickPanel() {
    if (!quickPanel) buildQuickPanel();
    if (quickPanel.hidden) {
      renderQuick(generateQuickNPC());
      quickPanel.hidden = false;
    } else {
      quickPanel.hidden = true;
    }
  }

  window.Generator = { open: openPanel, close: closePanel, quick: openQuickPanel };

  // Test hook — exposes pure logic functions for tools/tests.html.
  // Not used in production; safe to leave in place.
  window._genTest = { generateNPC, generateItem, rollOccupation, mergeExt, roll, rollW, T };

  function wire() {
    const btn = document.getElementById('generator-btn');
    if (btn) btn.addEventListener('click', openPanel);

    const qBtn = document.getElementById('quick-npc-btn');
    if (qBtn) qBtn.addEventListener('click', (e) => { e.stopPropagation(); openQuickPanel(); });

    document.addEventListener('click', (e) => {
      if (quickPanel && !quickPanel.hidden) {
        const wrap = document.getElementById('quick-npc-wrap');
        if (wrap && !wrap.contains(e.target)) quickPanel.hidden = true;
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && quickPanel && !quickPanel.hidden) quickPanel.hidden = true;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
