import type { ClassKey } from './constants';

export interface BackgroundPersonalityTable {
  slug: string;
  personalityTraits: readonly string[];
  ideals: readonly string[];
  bonds: readonly string[];
  flaws: readonly string[];
}

export interface ClassRoleplayGuide {
  classKey: ClassKey;
  suggestedTraits: readonly string[];
  suggestedIdeals: readonly string[];
  suggestedBonds: readonly string[];
  suggestedFlaws: readonly string[];
}

/**
 * Canonical SW5e Player's Handbook Chapter 4 (Backgrounds) Personality Tables
 * for all 20 core backgrounds.
 */
export const BACKGROUND_PERSONALITY_MAP: Record<string, BackgroundPersonalityTable> = {
  agent: {
    slug: 'agent',
    personalityTraits: [
      'I always have a plan for what to do when things go wrong.',
      'I am always calm, no matter what the situation. I never raise my voice or let my emotions control me.',
      'I am slow to trust. Those who seem the fairest often have the most to hide.',
      'I pay attention to every exit, camera, and listening device in any room I enter.',
      'I keep my true allegiance hidden behind three layers of convincing cover stories.',
      'I prefer subtle manipulation and quiet leverage over loud blaster firefights.',
    ],
    ideals: [
      'Duty. My mission and the safety of my faction come before my own life. (Lawful)',
      'Greater Good. Espionage is dirty work, but it keeps millions of citizens safe. (Good)',
      'Secrecy. Information is the deadliest weapon in the galaxy; I never share it freely. (Neutral)',
      'Independence. I serve the contract, not the politicians who sign it. (Chaotic)',
      'Control. Chaos is dangerous; order must be maintained from the shadows. (Lawful)',
      'Survival. Burned agents don’t live long unless they put themselves first. (Any)',
    ],
    bonds: [
      'I owe my life to the handler who pulled me out of an imperial black site.',
      'A fellow operative vanished on Coruscant; I will uncover what happened to them.',
      'My encrypted datapad holds proof of high-level treason that I must deliver.',
      'I protect an innocent civilian family who unknowingly sheltered me during a sting.',
      'I am fiercely loyal to the intelligence cell that trained me.',
      'An enemy counter-agent outsmarted me once; I will settle the score.',
    ],
    flaws: [
      'I suspect betrayal even from my closest allies.',
      'I have trouble turning off my cover persona and admitting who I really am.',
      'If a secret exists, I cannot resist trying to slice or steal it.',
      'I prioritize the mission objective over the immediate feelings of my companions.',
      'I leave no witnesses—even when mercy would be wiser.',
      'Someone out there knows my real name and holds it over my head.',
    ],
  },
  'bounty-hunter': {
    slug: 'bounty-hunter',
    personalityTraits: [
      'I don’t talk much; a blaster bolt says everything that needs saying.',
      'I study my surroundings and targets patiently before making a single move.',
      'I never take off my helmet or drop my guard around strangers.',
      'I have a dry, gallows sense of humor about the dangers of the Outer Rim.',
      'I keep meticulous maintenance on my weapons, armor, and tracking fob.',
      'I honor every contract to the letter—dead or alive means exactly what it says.',
    ],
    ideals: [
      'Code of the Guild. A hunter without honor is just a common thug. (Lawful)',
      'Credits. Nothing personal—you’re just worth more in carbonite. (Neutral)',
      'Justice. I only take bounties on slavers, pirates, and war criminals. (Good)',
      'Freedom. No master, no flag, just the open hyperlanes and my ship. (Chaotic)',
      'Predator. The galaxy belongs to the strong and the patient. (Evil)',
      'Professionalism. Once I take a puck, the hunt doesn’t stop until it’s closed. (Any)',
    ],
    bonds: [
      'My ship is my home, my fortress, and the only thing I truly trust.',
      'I am hunting the syndicate boss who wiped out my former squad.',
      'A portion of every bounty I collect goes to support a hidden orphanage on my homeworld.',
      'I owe a life debt to a mechanic who rebuilt my gear when I was left for dead.',
      'I wear the armor or weapon of a fallen mentor.',
      'I keep a list of every target that ever slipped through my fingers.',
    ],
    flaws: [
      'I see people as marks, obstacles, or payouts rather than friends.',
      'Once my pride is wounded by an escaped target, I obsess over the rematch.',
      'I refuse to back down from a fight, even when heavily outnumbered.',
      'I have a weakness for high-stakes Sabacc and often lose my payout at the cantina.',
      'I struggle to trust anyone who isn’t bound by a formal contract.',
      'I am wanted in three systems for collateral damage during an old job.',
    ],
  },
  criminal: {
    slug: 'criminal',
    personalityTraits: [
      'I always have an escape route mapped out before I sit down.',
      'I am incredibly slow to trust, and I watch hands rather than faces.',
      'I speak in underworld slang and casually drop references to syndicates.',
      'I pocket small, shiny trinkets without even realizing I’m doing it.',
      'I stay cool under pressure; panic gets you caught by sector security.',
      'I judge people by how useful they are in a tight spot, not by their title.',
    ],
    ideals: [
      'Honor. I never steal from my own crew or rat out a partner. (Lawful)',
      'Freedom. Chains are meant to be broken, and security locks are meant to be sliced. (Chaotic)',
      'Charity. I steal from the bloated Core World elites to feed the lower levels. (Good)',
      'Greed. Credits talk; everything else is background noise. (Evil)',
      'People. My crew is my family, and I’d burn a precinct for them. (Neutral)',
      'Redemption. I’m trying to buy my way out of the underworld for good. (Good)',
    ],
    bonds: [
      'I’m trying to pay off a massive debt to a ruthless Hutt kajidic.',
      'My old partner took the fall for our last heist; I’m going to break them out.',
      'Something precious was stolen from me, and I’ll tear the underworld apart to get it back.',
      'I send credits back to my family on Nar Shaddaa every month.',
      'I owe everything to the fence who gave me a second chance as a street rat.',
      'I carry a lucky coin or holo from a life I left behind.',
    ],
    flaws: [
      'When I see something valuable, I can’t think about anything else until it’s mine.',
      'If there’s a choice between doing it the easy way and the honest way, I pick easy.',
      'I’ll turn tail and run if a job goes completely sideways and nobody’s looking.',
      'An innocent person is serving time in Kessel for a crime I committed.',
      'I have a distinctive scar or bounty mark that sector security recognizes.',
      'I can’t resist taunting arrogant authorities.',
    ],
  },
  entertainer: {
    slug: 'entertainer',
    personalityTraits: [
      'I know a story, song, or cantina joke relevant to almost every situation.',
      'I love being the center of attention and turn every entrance into a performance.',
      'I am a hopeless romantic, always searching for my next grand adventure.',
      'Nobody stays angry at me for long; I can defuse any tension with charm.',
      'I change my mood—and my outfit—as quickly as a Corellian sunset.',
      'I mimic accents and mannerisms effortlessly.',
    ],
    ideals: [
      'Beauty. Art and music keep hope alive even in the darkest galaxy. (Good)',
      'Tradition. The old songs of my people must never be forgotten. (Lawful)',
      'Creativity. The galaxy is in desperate need of new ideas and bold expression. (Chaotic)',
      'Fame. I want my name lit up in holo-marquees across the Core Worlds. (Any)',
      'People. Seeing a smile on a tired spacer’s face is worth more than credits. (Good)',
      'Honesty. Art should reflect the truth, no matter how uncomfortable it makes tyrants. (Any)',
    ],
    bonds: [
      'My instrument or holo-rig is my most prized possession.',
      'Someone stole my signature composition and passed it off as their own.',
      'I would do anything for the members of my old touring troupe.',
      'I perform in secret to pass coded messages for a resistance movement.',
      'I fell in love with a noble or officer whose family forbade us from meeting.',
      'I want to become famous enough to find my long-lost sibling.',
    ],
    flaws: [
      'I’ll do anything to win fame and renown, even take reckless risks.',
      'I’m a sucker for a pretty face or a flattering compliment.',
      'A scandal prevents me from ever returning to my homeworld.',
      'I once satirized a powerful Moff or crime lord who still wants my head.',
      'I have trouble keeping secrets—everything becomes material for my next story.',
      'I spend credits on luxuries as fast as I earn them.',
    ],
  },
  'force-adept': {
    slug: 'force-adept',
    personalityTraits: [
      'I speak in quiet riddles and parables drawn from ancient Force traditions.',
      'I feel the emotional currents of a room before anyone says a word.',
      'I spend an hour every day in silent meditation, regardless of the danger.',
      'I treat all living things—even beasts and droids—with reverence.',
      'I am unbothered by material wealth and give excess credits away.',
      'I seem slightly detached from ordinary politics and mundane disputes.',
    ],
    ideals: [
      'Harmony. All life is bound together by the Force; balance must be preserved. (Neutral)',
      'Compassion. The Force calls us to heal the broken and defend the weak. (Good)',
      'Knowledge. Understanding the mysteries of the Force is the highest calling. (Any)',
      'Self-Mastery. One must conquer fear and anger within before facing the galaxy. (Lawful)',
      'Freedom. The Force flows freely and should never be chained by rigid orders. (Chaotic)',
      'Power. Strength in the Force is meant to shape destiny. (Evil)',
    ],
    bonds: [
      'I carry a sacred kyber shard or relic from my destroyed enclave.',
      'My master taught me everything I know, and I must fulfill their final wish.',
      'I protect a hidden Force-sensitive child from inquisitors and hunters.',
      'I seek a lost holocron rumored to lie in the Unknown Regions.',
      'My homeworld’s mystic order was scattered; I search for other survivors.',
      'I felt a vision of a looming galactic catastrophe that only I can help avert.',
    ],
    flaws: [
      'I am dogmatically convinced my Force tradition’s view is the only truth.',
      'I struggle with dark visions that tempt me toward anger or despair.',
      'I trust too easily in fate or "the will of the Force" instead of practical planning.',
      'I overlook immediate physical threats while lost in spiritual contemplation.',
      'I hide my Force sensitivity out of deep, paralyzing fear of discovery.',
      'I hold an unspoken grudge against the Jedi or Sith for past failures.',
    ],
  },
  gambler: {
    slug: 'gambler',
    personalityTraits: [
      'I treat every conflict like a hand of Sabacc—watch the tells, control the pot.',
      'I flip a lucky chance cube whenever I have a hard decision to make.',
      'I always flash a confident grin, even when holding a losing hand.',
      'I can calculate odds in my head faster than a protocol droid.',
      'I love high-stakes wagers and get bored when things are too safe.',
      'I remember every face, every debt, and every cheat I’ve ever met.',
    ],
    ideals: [
      'Luck. Fortune favors the bold; you only lose if you’re afraid to bet. (Chaotic)',
      'Fair Play. A rigged game ruins the thrill; play straight or don’t play. (Lawful)',
      'Prosperity. Credits buy freedom, ships, and a ticket out of the gutter. (Neutral)',
      'Generosity. What’s the point of winning big if you can’t buy the whole cantina a round? (Good)',
      'Ambition. I don’t just want to beat the house—I want to own the casino. (Evil)',
      'Thrill. Life without risk isn’t worth living. (Chaotic)',
    ],
    bonds: [
      'I lost my family’s freighter in a rigged Sabacc game; I’m going to win it back.',
      'I owe a dangerous syndicate boss 50,000 credits, and the clock is ticking.',
      'My Sabacc deck belonged to a legendary scoundrel who taught me everything.',
      'I’m trying to win enough to buy my friend’s freedom from indentured servitude.',
      'I always share half my big winnings with a cantina keeper who saved me once.',
      'A rival gambler framed me for cheating; I’ll clear my name.',
    ],
    flaws: [
      'I can never turn down a wager, no matter how terrible the odds.',
      'I bluff even when telling the truth would be much safer.',
      'I’m banned from half the casinos on Canto Bight and Bespin.',
      'I struggle to save money; if credits are in my pocket, they’re meant to be bet.',
      'When I lose badly, my temper flares and I suspect everyone of cheating.',
      'I’ve left broken hearts and unpaid tabs across six sectors.',
    ],
  },
  investigator: {
    slug: 'investigator',
    personalityTraits: [
      'I notice tiny inconsistencies in stories, uniforms, and holo-logs immediately.',
      'I carry a battered datapad and jot down clues about everyone I meet.',
      'I ask blunt, uncomfortable questions until the truth comes out.',
      'I don’t believe in coincidences—only patterns I haven’t connected yet.',
      'I drink far too much caf to stay sharp on long stakeouts.',
      'I keep my emotions locked down while working a scene.',
    ],
    ideals: [
      'Truth. No matter how powerful the culprit, the truth deserves to be exposed. (Lawful)',
      'Justice. The law should protect the powerless, not serve corrupt officials. (Good)',
      'Curiosity. Every unsolved mystery is a splinter in my mind. (Neutral)',
      'Order. Without rules and accountability, civilization collapses into anarchy. (Lawful)',
      'Vigilance. Evil thrives when good people look the other way. (Good)',
      'Pragmatism. Sometimes you bend procedure to catch a monster. (Chaotic)',
    ],
    bonds: [
      'I’m still haunted by an unsolved murder case that cost me my badge.',
      'My former partner was killed investigating a conspiracy that goes to the Senate.',
      'I protect a key witness whose testimony could bring down a crime cartel.',
      'I owe my life to a street informant who feeds me intel.',
      'I’m searching for a missing relative who vanished on the Corellian Run.',
      'My precinct mentor taught me never to compromise my integrity.',
    ],
    flaws: [
      'I obsess over clues to the point of neglecting sleep, food, and my own safety.',
      'I assume everyone has a hidden motive until proven innocent.',
      'My bluntness makes enemies of powerful politicians and officers.',
      'I struggle to let go of a case even when it’s clearly a trap.',
      'I’ve bent the law to extract confessions in the past, and it haunts me.',
      'I have a hard time relaxing; every social gathering feels like an interrogation.',
    ],
  },
  jedi: {
    slug: 'jedi',
    personalityTraits: [
      'I speak with calm serenity, even with a lightsaber ignited.',
      'I seek peaceful negotiation first, drawing my weapon only as a last resort.',
      'I quote teachings from the Jedi Code to center myself and others.',
      'I listen patiently to everyone’s perspective before passing judgment.',
      'I live simply, finding no need for luxury or status symbols.',
      'I carry myself with quiet dignity and compassion.',
    ],
    ideals: [
      'The Jedi Code. There is no emotion, there is peace; I serve the Light Side. (Lawful Good)',
      'Protection. My lightsaber exists to shield the innocent from tyranny. (Good)',
      'Wisdom. Knowledge and patience solve what violence only worsens. (Neutral Good)',
      'Compassion. Even those lost to the dark side deserve a chance at redemption. (Good)',
      'Duty. I am a guardian of peace and justice in the galaxy. (Lawful)',
      'Balance. I strive to keep my own pride and fear in check. (Any)',
    ],
    bonds: [
      'My Jedi Master disappeared during a mission; I will find them or honor their legacy.',
      'I crafted my lightsaber from a kyber crystal that called to me in the caves of Ilum.',
      'I am sworn to protect a Padawan or civilian under my care.',
      'I feel a deep connection to the Jedi Temple or an ancient enclave.',
      'A former friend fell to the dark side; I hope to bring them back.',
      'I guard ancient Jedi texts from falling into Sith or syndicate hands.',
    ],
    flaws: [
      'My attachment to my companions conflicts with Jedi detachment.',
      'I can be overly idealistic and underestimate how ruthless enemies truly are.',
      'I struggle with a lingering spark of anger or pride in combat.',
      'I hesitate to strike first, sometimes giving foes a dangerous opening.',
      'I carry deep guilt over a failure during my Padawan trials.',
      'I find it hard to understand the cynical motivations of scoundrels and mercenaries.',
    ],
  },
  mandalorian: {
    slug: 'mandalorian',
    personalityTraits: [
      'I treat my beskar armor and weapons as sacred extensions of my clan.',
      'I speak directly and despise hollow flattery or cowardice.',
      'I respect strength, skill, and loyalty above birthright or wealth.',
      'I never break my word once given; a Mandalorian’s promise is iron.',
      'I carefully clean and repair my gear after every single skirmish.',
      'I size up the strongest warrior in every room the moment I walk in.',
    ],
    ideals: [
      'The Resol’nare. Education, armor, self-defense, clan, language, and Mand’alor—this is the Way. (Lawful)',
      'Honor. Victory without honor is worthless; face strong foes head-on. (Any)',
      'Family. Clan is more than blood—it is who stands beside you in battle. (Good)',
      'Independence. Mandalorians bow to no outsider Empire or Senate. (Chaotic)',
      'Strength. Conflict forges us into something unbreakable. (Neutral)',
      'Vengeance. Any attack on my clan must be answered tenfold. (Any)',
    ],
    bonds: [
      'My beskar armor was passed down through three generations of my clan.',
      'My covert or clan was scattered; I search the galaxy to reunite our survivors.',
      'I swore an oath to protect a foundling until they come of age.',
      'I seek a worthy rival who defeated me in single combat.',
      'I carry the signet of a fallen sibling-in-arms.',
      'I will reclaim a sacred Mandalorian relic stolen by an imperial warlord.',
    ],
    flaws: [
      'I am fiercely stubborn and refuse to retreat even when tactically wise.',
      'I hold deep prejudice against Jedi, Sith, or ancient enemies of Mandalore.',
      'My pride makes it nearly impossible for me to accept charity or help.',
      'I pick fights with anyone who disrespects Mandalorian culture.',
      'I prioritize clan honor over local laws and diplomatic niceties.',
      'I struggle to express gentler emotions outside of battle camaraderie.',
    ],
  },
  mercenary: {
    slug: 'mercenary',
    personalityTraits: [
      'I’ve seen enough blaster fire that nothing rattles me anymore.',
      'I evaluate every job by two metrics: hazard pay and exit strategy.',
      'I tell exaggerated war stories over drinks to pass the time.',
      'I’m gruff and pragmatic, but fiercely protective of whoever’s paying on time.',
      'I sleep lightly with a weapon within arm’s reach.',
      'I respect competence in combat regardless of species or faction.',
    ],
    ideals: [
      'Contract. If I take your credits, you get my blaster until the job is done. (Lawful)',
      'Survival. Dead heroes don’t spend credits; live to fight another day. (Neutral)',
      'Brotherhood. Never leave a squadmate behind on the battlefield. (Good)',
      'Wealth. War is a business, and business is always booming. (Evil)',
      'Autonomy. I fight for myself, not for flags or ideals. (Chaotic)',
      'Fairness. I don’t take jobs that target unarmed civilians. (Good)',
    ],
    bonds: [
      'My old mercenary company was betrayed by our employer; I hunt the survivors.',
      'I send half my pay to support the widow and children of my fallen commander.',
      'I’m saving up enough credits to buy a quiet homestead and retire.',
      'My trusty heavy blaster or vibroweapon has saved my life a dozen times.',
      'I owe a debt to a field medic who patched me up on Mimban.',
      'I carry the dog tags of every squadmate I’ve lost.',
    ],
    flaws: [
      'I solve almost every problem with overwhelming firepower.',
      'I struggle to trust idealistic politicians or Force users.',
      'I drink too much to quiet the memories of old campaigns.',
      'If the credits stop flowing, my loyalty gets shaky fast.',
      'I have a bad habit of underestimating non-combatants.',
      'I am wanted for desertion by a planetary military.',
    ],
  },
  noble: {
    slug: 'noble',
    personalityTraits: [
      'My eloquent flattery makes people feel important while I steer the conversation.',
      'The common folk love me for my charm and calculated generosity.',
      'No one could doubt by looking at my regal bearing that I am above the rabble.',
      'I take great pains to always look my best and follow Core World fashions.',
      'I don’t like to get my hands dirty; that’s what retainers and droids are for.',
      'Despite my noble birth, I treat brave companions as true equals.',
    ],
    ideals: [
      'Respect. Respect is due to me because of my station, but all beings deserve dignity. (Good)',
      'Responsibility. It is my duty to protect and uplift the citizens beneath me. (Lawful Good)',
      'Independence. I must prove I can carve my own legend without my family’s name. (Chaotic)',
      'Power. If I can attain more political leverage, no one can touch my house. (Evil)',
      'Family. Blood runs thicker than hyperspace fuel. (Any)',
      'Noble Obligation. Privilege demands courage when crisis strikes. (Good)',
    ],
    bonds: [
      'I will face any challenge to win the approval of my estranged family.',
      'My house’s alliance with another noble family must be preserved at all costs.',
      'Nothing is more important than the safety of my homeworld’s people.',
      'I am in love with the heir of a rival house.',
      'My family’s estate and fortune were seized by a corrupt Moff; I will reclaim them.',
      'The commoners of my domain look to me as their champion.',
    ],
    flaws: [
      'I secretly believe that everyone else is slightly beneath me.',
      'I hide a truly scandalous family secret that could ruin my house forever.',
      'I too often hear veiled insults and threats in every casual remark.',
      'I have an insatiable desire for expensive Core World luxuries.',
      'In fact, the galaxy DOES revolve around me.',
      'By my words and actions, I often bring shame to my family without realizing it.',
    ],
  },
  nomad: {
    slug: 'nomad',
    personalityTraits: [
      'I’m driven by wanderlust that keeps me from staying on any planet for long.',
      'I watch over my friends as if they were a pack of vulnerable bantha calves.',
      'I feel far more comfortable in wild canyons or open desert than in Coruscant towers.',
      'I am blunt and honest; nature has no patience for polite lies.',
      'I collect small stones, seeds, or trophies from every world I visit.',
      'I sleep under the stars whenever possible rather than inside cramped quarters.',
    ],
    ideals: [
      'Change. Life is like the hyperlanes—always moving, never stagnant. (Chaotic)',
      'Greater Good. Every traveler must help others survive the harsh frontier. (Good)',
      'Honor. If I dishonor myself, I dishonor my entire tribe. (Lawful)',
      'Nature. The living ecosystems of the galaxy are more sacred than cities. (Neutral)',
      'Self-Reliance. Weaklings perish in the wastes; learn to survive on your own. (Any)',
      'Glory. I must earn renown worthy of a tribal saga. (Any)',
    ],
    bonds: [
      'My family, clan, or tribe is the most important thing in my life, even far away.',
      'An injury to the unspoiled wilderness of my homeworld is an injury to me.',
      'I will bring terrible wrath upon the corporation that poisoned my homeland.',
      'I am the last survivor of my nomadic people; it is up to me to keep our stories alive.',
      'I suffer awful visions of a coming disaster and travel to warn others.',
      'It is my duty to provide for and guide lost travelers.',
    ],
    flaws: [
      'I am too enamored of strong cantina spirits and exotic spices.',
      'There’s no room for caution in a life lived to the fullest.',
      'I remember every insult I’ve received and nurse silent resentment.',
      'I am slow to trust members of Core World species and societies.',
      'Violence is my instinctive answer to most challenges.',
      'Don’t expect me to save those who can’t save themselves.',
    ],
  },
  outlaw: {
    slug: 'outlaw',
    personalityTraits: [
      'I keep a low profile in civilized ports, hat pulled down and blaster loose.',
      'I laugh in the face of sector patrols and bounty notices.',
      'I’m quick with a smirk and quicker on the draw.',
      'I have a soft spot for strays, underdogs, and fellow outcasts.',
      'I’m restless when staying in one place longer than a few days.',
      'I never sit with my back to a cantina door.',
    ],
    ideals: [
      'Freedom. No tyrant or Republic bureaucrat gets to tell me how to live. (Chaotic)',
      'Fairness. I rob from corrupt governors and share with frontier towns. (Good)',
      'Notoriety. I want my name whispered in fear across the Outer Rim. (Evil)',
      'Loyalty. Once you ride with my posse, I’ve got your back forever. (Lawful)',
      'Survival. Stay fast, stay armed, stay ahead of the law. (Neutral)',
      'Redemption. Even an outlaw can do the right thing when it counts. (Good)',
    ],
    bonds: [
      'My gang was ambushed and wiped out; I’m hunting the traitor who sold us out.',
      'A price on my head keeps me from returning to the person I love.',
      'I owe my freedom to a frontier town that hid me from imperial troopers.',
      'My modified blaster pistol belonged to a legendary gunslinger.',
      'I’m trying to rescue my sibling from an imperial labor camp.',
      'I keep a hidden stash of credits buried on a remote moon.',
    ],
    flaws: [
      'I have a hair-trigger temper when someone tries to push me around.',
      'My face is on wanted holo-posters in half the Mid Rim.',
      'I can’t resist a big score, even when it’s clearly a setup.',
      'I hold grudges for years and never forgive a double-cross.',
      'I’m recklessly overconfident in my quick-draw.',
      'I distrust anyone wearing an official uniform.',
    ],
  },
  pirate: {
    slug: 'pirate',
    personalityTraits: [
      'My friends know they can rely on me, no matter what storms we fly into.',
      'I work hard in space so I can party harder at every shadowport.',
      'I enjoy sailing into new starports and making friends over strong Corellian rum.',
      'I stretch the truth for the sake of a good spacer’s tall tale.',
      'To me, a tavern brawl is a nice way to get to know a new planet.',
      'I never pass up a friendly wager or a chance to commandeer loot.',
    ],
    ideals: [
      'Respect. The thing that keeps a ship together is mutual respect between captain and crew. (Good)',
      'Fairness. We all do the work, so we all share the plunder equally. (Lawful)',
      'Freedom. The hyperlanes belong to everyone—no one owns the stars! (Chaotic)',
      'Mastery. I’m a predator, and the other ships in the lane are my prey. (Evil)',
      'People. I’m committed to my crewmates, not to distant ideals. (Neutral)',
      'Aspiration. Someday I’ll captain my own flagship and fleet. (Any)',
    ],
    bonds: [
      'I’m loyal to my captain first, everything else second.',
      'The ship is most important—crewmates and captains come and go.',
      'I’ll always remember my first starship.',
      'In a shadowport town, I have a paramour whose eyes nearly stole me from the stars.',
      'I was cheated out of my fair share of the plunder, and I want to claim my due.',
      'Ruthless raiders murdered my crew and plundered our ship; I will have revenge.',
    ],
    flaws: [
      'I follow orders, even if I think they’re wrong, as long as the captain says so.',
      'I’ll say anything to avoid having to do extra chores or maintenance.',
      'Once someone questions my courage, I never back down no matter how dangerous.',
      'Once I start drinking Corellian ale, it’s very hard for me to stop.',
      'I can’t help but pocket loose credits and shiny trinkets I come across.',
      'My pride will probably lead to my destruction.',
    ],
  },
  scientist: {
    slug: 'scientist',
    personalityTraits: [
      'I use polysyllabic technical jargon that conveys the impression of great erudition.',
      'I’ve scanned or read every data-slate in my field, and I love sharing what I know.',
      'I’m used to helping out those who aren’t as smart as I am, patiently explaining basics.',
      'There’s nothing I like more than a baffling scientific anomaly.',
      'I am horribly, horribly awkward in informal social situations.',
      'I’m convinced that people are always trying to steal my research notes.',
    ],
    ideals: [
      'Knowledge. The path to progress and enlightenment is through empirical discovery. (Neutral)',
      'Beauty. What is beautiful in nature points us toward universal mathematical truth. (Good)',
      'Logic. Emotions must not cloud our analytical thinking. (Lawful)',
      'No Limits. Nothing should fetter the infinite possibility of scientific inquiry. (Chaotic)',
      'Power. Knowledge is the ultimate weapon for dominating the galaxy. (Evil)',
      'Self-Improvement. The goal of a life of study is the betterment of all species. (Good)',
    ],
    bonds: [
      'It is my duty to protect my students or lab assistants.',
      'I possess an encrypted research core containing secrets too dangerous for wrong hands.',
      'I’ve been searching my whole life for the answer to a singular cosmic question.',
      'I sold my soul—or compromised my ethics—for research funding; I must undo the damage.',
      'My life’s work is a series of holo-tomes on a specific sector of astrophysics or biology.',
      'I work to preserve a university or archive from war and censorship.',
    ],
    flaws: [
      'I am easily distracted by the promise of rare data or exotic specimens.',
      'Most people scream and run when they see a rancor or rakghoul; I stop to take notes.',
      'Unlocking an ancient mystery is worth the price of a civilization.',
      'I overlook obvious solutions in favor of overly complicated ones.',
      'I speak without really thinking through my words, invariably insulting people.',
      'I can’t keep a secret to save my life—especially if someone is wrong about science.',
    ],
  },
  scoundrel: {
    slug: 'scoundrel',
    personalityTraits: [
      'I have a charming smile and a plausible lie ready for every customs officer.',
      'I talk fast and improvise brilliantly when everything goes sideways.',
      'I collect useful favors and black-market contacts in every port.',
      'I prefer style, wit, and misdirection over brute force.',
      'I claim to know famous heroes and crime bosses—sometimes it’s even true.',
      'I check every lock, pocket, and hidden compartment out of sheer habit.',
    ],
    ideals: [
      'Freedom. Nobody owns me, and nobody pins me down. (Chaotic)',
      'Heart. Underneath the swagger, I’ll always help someone in real trouble. (Good)',
      'Fortune. Every crisis is just an opportunity waiting to be monetized. (Neutral)',
      'Loyalty. Credits come and go, but true friends are priceless. (Good)',
      'Ambition. Why settle for petty scores when you can con an Empire? (Any)',
      'Wit. Outsmarting a heavily armed fool is the finest art in the galaxy. (Chaotic)',
    ],
    bonds: [
      'I’m running from a powerful syndicate boss whose prized possession I "borrowed."',
      'I owe my life to a co-pilot or partner who always pulls me out of the fire.',
      'I’m trying to buy back the deed to my family’s homestead or freighter.',
      'Someone out there has my real identity on record and could ruin me.',
      'I look out for a younger street kid who reminds me of myself.',
      'I’ll never abandon the ship that carried me through a dozen Kessel Runs.',
    ],
    flaws: [
      'I can’t resist exaggerating my exploits or making promises I can’t keep.',
      'I’m a hopeless flirt and often get tangled in romantic complications.',
      'I take unnecessary risks just to prove I’m the smartest person in the room.',
      'When pressure mounts, my first instinct is to talk or slip away rather than fight.',
      'I have at least three angry ex-associates looking for me.',
      'I’m terrible with long-term budgets and always broke by mid-month.',
    ],
  },
  sith: {
    slug: 'sith',
    personalityTraits: [
      'I radiate cold, controlled menace; weak-willed people step aside without knowing why.',
      'I believe passion and conflict are the only true engines of strength.',
      'I speak softly, precisely, and rarely repeat myself.',
      'I constantly test the strength and resolve of both allies and enemies.',
      'I view mercy as a calculated tactic, never a reflex.',
      'I carry myself like royalty born to command.',
    ],
    ideals: [
      'The Sith Code. Peace is a lie, there is only passion; through victory my chains are broken. (Evil)',
      'Dominion. Order requires a strong, ruthless hand at the helm. (Lawful Evil)',
      'Power. Strength in the Force is the sole measure of worth. (Any)',
      'Liberation. I cast off the chains of masters, codes, and traditions alike. (Chaotic)',
      'Legacy. My name will be carved into history for a thousand generations. (Any)',
      'Redemption. I was raised in darkness, yet I question whether another path exists. (Neutral/Good)',
    ],
    bonds: [
      'I serve—or plot to surpass—a powerful Sith Lord or dark side mentor.',
      'I seek an ancient Sith holocron buried in the tombs of Korriban.',
      'My bloodline carries the legacy of ancient Sith Purebloods or fallen Jedi.',
      'I swore vengeance against the rival who scarred me during my academy trials.',
      'I secretly protect someone dear to me, hiding that weakness from my peers.',
      'My crimson lightsaber crystal was bled through personal trial and agony.',
    ],
    flaws: [
      'My arrogance blinds me to threats from "inferior" opponents.',
      'My anger can flare out of control, clouding my tactical judgment.',
      'I expect betrayal everywhere and often strike first without proof.',
      'I despise compromise and refuse to apologize even when clearly wrong.',
      'I am haunted by the dark side’s whispers, pushing me toward cruelty.',
      'My obsession with power alienates the very allies I need.',
    ],
  },
  smuggler: {
    slug: 'smuggler',
    personalityTraits: [
      'I’m proud of my ship’s quirks and defend its speed against any slander.',
      'I know every hidden hyperlane, asteroid shadow, and customs bribe rate.',
      'I never ask what’s inside the sealed cargo crates—plausible deniability is best.',
      'I’m cool-headed in an asteroid field and only panic when the hyperdrive stalls.',
      'I keep spare parts, hidden blasters, and fake transponders tucked everywhere.',
      'I talk to my ship like it’s a living partner.',
    ],
    ideals: [
      'Freedom. Open space and no imperial checkpoints—that’s the life. (Chaotic)',
      'Reliability. If I say I’ll deliver the cargo, it arrives on time, no matter what. (Lawful)',
      'Compassion. I started by running spice, now I smuggle refugees and medicine. (Good)',
      'Profit. Everything has a price, and risky cargo pays triple. (Neutral)',
      'Loyalty. My crew and ship come before any client. (Good)',
      'Daring. Making the Kessel Run in record parsecs is what legends are made of. (Chaotic)',
    ],
    bonds: [
      'My starship is my life; I’d fly through a star before letting anyone seize it.',
      'I dumped a syndicate’s spice cargo to escape an imperial patrol; now I owe them.',
      'My co-pilot saved my life years ago, and we’ve flown together ever since.',
      'I run supplies secretly for a rebellion cell on an occupied world.',
      'I’m searching for the legendary lost cargo of a vanished smuggler king.',
      'I keep a holographic photo of the home I can’t return to.',
    ],
    flaws: [
      'I get defensive and reckless if anyone insults my ship or piloting.',
      'I’ll take dangerous, shady jobs whenever my fuel and repair bills pile up.',
      'I shoot first when cornered by bounty hunters or customs inspectors.',
      'I have a terrible habit of cutting corners on non-essential ship repairs.',
      'I’m wanted by at least two planetary port authorities.',
      'I struggle to commit to causes larger than my own crew.',
    ],
  },
  soldier: {
    slug: 'soldier',
    personalityTraits: [
      'I’m always polite and respectful, using military titles out of habit.',
      'I’m haunted by memories of war; I can’t get the images of battle out of my mind.',
      'I’ve lost too many friends, and I’m slow to make new ones.',
      'I’m full of inspiring and cautionary tales from every military experience I’ve had.',
      'I can stare down a rancor without flinching.',
      'I enjoy being strong and like breaking things.',
    ],
    ideals: [
      'Greater Good. Our lot is to lay down our lives in defense of others. (Good)',
      'Responsibility. I do what I must and obey just authority. (Lawful)',
      'Independence. When people follow orders blindly, they embrace tyranny. (Chaotic)',
      'Might. In life as in war, the stronger force wins. (Evil)',
      'Live and Let Live. Ideals aren’t worth killing over or going to war for. (Neutral)',
      'Nation. My planet, sector, or faction is all that matters. (Any)',
    ],
    bonds: [
      'I would still lay down my life for the people I served with.',
      'Someone saved my life on the battlefield; to this day, I’ll never leave a friend behind.',
      'My honor is my life.',
      'I’ll never forget the crushing defeat my company suffered or the enemies who dealt it.',
      'Those who fight beside me are those worth dying for.',
      'I fight for those who cannot fight for themselves.',
    ],
    flaws: [
      'The monstrous enemy we faced in battle still leaves me quivering with fear.',
      'I have little respect for anyone who is not a proven warrior.',
      'I made a terrible mistake in battle that cost many lives—and I keep it secret.',
      'My hatred of my enemies is blind and unreasoning.',
      'I obey the law, even if the law causes misery.',
      'I’d rather eat my armor than admit when I’m wrong.',
    ],
  },
  spacer: {
    slug: 'spacer',
    personalityTraits: [
      'I feel more at home in zero-G and cramped engine rooms than on solid ground.',
      'I diagnose broken droids and hyperdrives by listening to the hum of the hull.',
      'I know at least one cantina on every major space station in the Mid Rim.',
      'I’m superstitious about space anomalies, ghost ships, and bad hyperdrive jumps.',
      'I carry a multitool and grease rag everywhere I go.',
      'I measure distances in parsecs and travel days rather than miles.',
    ],
    ideals: [
      'Exploration. There’s always another uncharted system beyond the next jump. (Chaotic)',
      'Camaraderie. Out in the black, your crew is all that stands between you and vacuum. (Good)',
      'Precision. A sloppy weld or bad nav-calc kills everyone aboard. (Lawful)',
      'Profit. Trade routes are the lifeblood of the galaxy. (Neutral)',
      'Independence. On my ship, I’m my own master. (Chaotic)',
      'Stewardship. Leave every station and hyperspace beacon better than you found it. (Good)',
    ],
    bonds: [
      'I grew up aboard a massive generational colony or cargo hauler.',
      'I’m trying to chart a safe hyperlane back to a lost frontier world.',
      'My astro-droid has been my co-pilot and best friend for ten years.',
      'I owe my life to a salvage crew that rescued me from a drifting escape pod.',
      'I carry the nav-computer core of my destroyed family vessel.',
      'I have friends in every docking bay across the Rim.',
    ],
    flaws: [
      'Planetary gravity and wide open skies actually make me slightly nervous.',
      'I get deeply irritated when passengers touch ship controls without permission.',
      'I tend to treat fragile diplomacy with the bluntness of a hydrospanner.',
      'I’m prone to hoarding scrap parts and "useful junk" in my quarters.',
      'I’ve left unpaid docking fees in half a dozen starports.',
      'I get stubborn when someone questions my astrogation calculations.',
    ],
  },
};

export const CLASS_ROLEPLAY_GUIDES: Record<ClassKey, ClassRoleplayGuide> = {
  berserker: {
    classKey: 'berserker',
    suggestedTraits: [
      'When battle begins, I channel raw fury and instinct rather than overthinking.',
      'I value physical prowess, honesty, and standing your ground.',
    ],
    suggestedIdeals: [
      'Unchained Fury. Rage is a tool—master it, or be consumed by it.',
    ],
    suggestedBonds: [
      'I carry scars from the trial that awakened my primal battle instincts.',
    ],
    suggestedFlaws: [
      'Once my blood is up, it’s hard to stop swinging when enemies surrender.',
    ],
  },
  consular: {
    classKey: 'consular',
    suggestedTraits: [
      'I rely on deep Force meditation and insight before taking action.',
      'I prefer diplomacy and Force mastery over brute physical combat.',
    ],
    suggestedIdeals: [
      'Enlightenment. Understanding the Force is the key to healing the galaxy.',
    ],
    suggestedBonds: [
      'I safeguard ancient Force teachings and seek wisdom in every world.',
    ],
    suggestedFlaws: [
      'I can become overly absorbed in Force theory while ignoring immediate danger.',
    ],
  },
  engineer: {
    classKey: 'engineer',
    suggestedTraits: [
      'I view every locked door, droid, or weapon as a puzzle waiting to be improved.',
      'I constantly tinker with my wristpad and prototype modifications.',
    ],
    suggestedIdeals: [
      'Ingenuity. Technology can solve almost any problem with the right schematic.',
    ],
    suggestedBonds: [
      'My custom-built gear or droid companion is my proudest creation.',
    ],
    suggestedFlaws: [
      'I get so excited by exotic tech that I ignore obvious traps.',
    ],
  },
  fighter: {
    classKey: 'fighter',
    suggestedTraits: [
      'I train relentlessly with blasters and blades to stay sharp in any firefight.',
      'I read the tactical terrain of a battlefield within seconds.',
    ],
    suggestedIdeals: [
      'Discipline. Superior tactics and steady nerves win wars.',
    ],
    suggestedBonds: [
      'I honor the training of my academy or veteran squad.',
    ],
    suggestedFlaws: [
      'I judge others too harshly if they lack combat discipline.',
    ],
  },
  guardian: {
    classKey: 'guardian',
    suggestedTraits: [
      'I step to the front line willingly so my allies stay out of harm’s way.',
      'I blend martial discipline with focused Force abilities.',
    ],
    suggestedIdeals: [
      'Shield of the Innocent. Strength is given to protect those who cannot fight.',
    ],
    suggestedBonds: [
      'My lightsaber or weapon represents an oath I swore to defend the weak.',
    ],
    suggestedFlaws: [
      'I take too much personal blame whenever an ally gets hurt.',
    ],
  },
  monk: {
    classKey: 'monk',
    suggestedTraits: [
      'I move with effortless grace and keep my mind centered in chaos.',
      'I need no heavy armor or flashy gadgets—my body and focus are enough.',
    ],
    suggestedIdeals: [
      'Perfection of Self. Mastery over mind and body brings inner peace.',
    ],
    suggestedBonds: [
      'I carry forward the martial traditions of my secluded monastery or order.',
    ],
    suggestedFlaws: [
      'I can seem aloof or overly detached from everyday concerns.',
    ],
  },
  operative: {
    classKey: 'operative',
    suggestedTraits: [
      'I strike from shadows and never fight fair when an ambush works better.',
      'I keep three backup plans and a hidden blade at all times.',
    ],
    suggestedIdeals: [
      'Precision. One well-placed strike ends a fight before it begins.',
    ],
    suggestedBonds: [
      'I owe my survival to the shadows and the allies who watch my back.',
    ],
    suggestedFlaws: [
      'I struggle to trust anyone completely—even people who saved my life.',
    ],
  },
  scholar: {
    classKey: 'scholar',
    suggestedTraits: [
      'I analyze enemies’ weak points and coordinate my allies’ maneuvers.',
      'Knowledge and strategy always triumph over reckless force.',
    ],
    suggestedIdeals: [
      'Discovery. Every battle and ruin holds lessons worth recording.',
    ],
    suggestedBonds: [
      'I carry a field journal documenting cultures, tactics, and lost history.',
    ],
    suggestedFlaws: [
      'I sometimes over-analyze instead of acting decisively in emergencies.',
    ],
  },
  scout: {
    classKey: 'scout',
    suggestedTraits: [
      'I track targets across uncharted worlds and spot ambushes miles away.',
      'I blend wilderness survival with clever tech gadgets.',
    ],
    suggestedIdeals: [
      'Preparedness. Know the terrain, know your quarry, and strike first.',
    ],
    suggestedBonds: [
      'I protect the frontier trails and travelers who rely on my guidance.',
    ],
    suggestedFlaws: [
      'I prefer working alone and chafe in crowded Core World cities.',
    ],
  },
  sentinel: {
    classKey: 'sentinel',
    suggestedTraits: [
      'I balance Force intuition with street-smart skills and agility.',
      'I adapt smoothly whether the mission calls for stealth, diplomacy, or combat.',
    ],
    suggestedIdeals: [
      'Balance. Neither pure ivory-tower mysticism nor brute force alone is enough.',
    ],
    suggestedBonds: [
      'I bridge the gap between the Force and the everyday citizens of the galaxy.',
    ],
    suggestedFlaws: [
      'Trying to be good at everything sometimes leaves me stretched too thin.',
    ],
  },
};

export function getBackgroundPersonality(slugOrId: string): BackgroundPersonalityTable {
  const clean = slugOrId.replace(/^sw5e:core:background:/, '').toLowerCase();
  return BACKGROUND_PERSONALITY_MAP[clean] ?? BACKGROUND_PERSONALITY_MAP.jedi!;
}

export function getClassRoleplayGuide(classKey: ClassKey): ClassRoleplayGuide {
  return CLASS_ROLEPLAY_GUIDES[classKey] ?? CLASS_ROLEPLAY_GUIDES.guardian;
}
