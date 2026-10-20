// Built-in sample catalog: well-known titles with accurate metadata.
// Used by `npm run db:seed` so the app is fully demonstrable without a TMDB key.
// All facts below (titles, years, runtimes, genres, directors) are real-world data.
// posterPath values are TMDB CDN paths (https://image.tmdb.org/t/p). Each of the
// 21 paths below was verified: HTTP 200 + image/jpeg + visually matched to the
// correct title (checked 2026-10-09). Three titles have NO posterPath on purpose
// (The Grand Budapest Hotel, The Martian, Whiplash) — no correct, reachable
// poster was found for them, so the UI shows an honest local placeholder
// instead of a wrong image. See `npm run db:posters` to backfill posters into
// an existing database without touching users, watchlists, or ratings.

export interface SeedContent {
  tmdbId: number;
  type: 'movie' | 'tv';
  title: string;
  overview: string;
  releaseDate: string;
  runtime?: number;
  genres: { id: number; name: string }[];
  keywords: string[];
  cast: { id: number; name: string; character?: string; order?: number }[];
  crew: { id: number; name: string; job: string }[];
  popularity: number;
  voteAverage: number;
  voteCount: number;
  posterPath?: string;
  backdropPath?: string;
}

const G = (id: number, name: string) => ({ id, name });

export const SEED_CONTENT: SeedContent[] = [
  {
    tmdbId: 157336,
    type: 'movie',
    title: 'Interstellar',
    posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    overview:
      "With Earth becoming uninhabitable, a team of explorers travels through a wormhole in space in an attempt to ensure humanity's survival.",
    releaseDate: '2014-11-07',
    runtime: 169,
    genres: [G(12, 'Adventure'), G(18, 'Drama'), G(878, 'Science Fiction')],
    keywords: ['space', 'wormhole', 'time dilation', 'father daughter', 'survival'],
    cast: [
      { id: 1, name: 'Matthew McConaughey', character: 'Cooper', order: 0 },
      { id: 2, name: 'Anne Hathaway', character: 'Brand', order: 1 },
    ],
    crew: [{ id: 3, name: 'Christopher Nolan', job: 'Director' }],
    popularity: 95,
    voteAverage: 8.7,
    voteCount: 32000,
  },
  {
    tmdbId: 27205,
    type: 'movie',
    title: 'Inception',
    posterPath: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    overview:
      "A skilled thief who steals secrets from deep within the subconscious is offered a chance to have his criminal history erased by planting an idea into a target's mind.",
    releaseDate: '2010-07-16',
    runtime: 148,
    genres: [G(28, 'Action'), G(878, 'Science Fiction'), G(12, 'Adventure')],
    keywords: ['dreams', 'heist', 'subconscious', 'limbo'],
    cast: [
      { id: 4, name: 'Leonardo DiCaprio', character: 'Cobb', order: 0 },
      { id: 5, name: 'Joseph Gordon-Levitt', character: 'Arthur', order: 1 },
    ],
    crew: [{ id: 3, name: 'Christopher Nolan', job: 'Director' }],
    popularity: 90,
    voteAverage: 8.4,
    voteCount: 35000,
  },
  {
    tmdbId: 155,
    type: 'movie',
    title: 'The Dark Knight',
    posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    overview:
      'Batman raises the stakes in his war on crime, but the Joker — a criminal mastermind — plunges Gotham into anarchy.',
    releaseDate: '2008-07-18',
    runtime: 152,
    genres: [G(18, 'Drama'), G(28, 'Action'), G(80, 'Crime')],
    keywords: ['superhero', 'joker', 'gotham', 'vigilante', 'chaos'],
    cast: [
      { id: 6, name: 'Christian Bale', character: 'Bruce Wayne', order: 0 },
      { id: 7, name: 'Heath Ledger', character: 'Joker', order: 1 },
    ],
    crew: [{ id: 3, name: 'Christopher Nolan', job: 'Director' }],
    popularity: 98,
    voteAverage: 9.0,
    voteCount: 31000,
  },
  {
    tmdbId: 496243,
    type: 'movie',
    title: 'Parasite',
    posterPath: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    overview:
      'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
    releaseDate: '2019-05-30',
    runtime: 132,
    genres: [G(35, 'Comedy'), G(53, 'Thriller'), G(18, 'Drama')],
    keywords: ['class divide', 'family', 'satire', 'basement'],
    cast: [{ id: 8, name: 'Song Kang-ho', character: 'Kim Ki-taek', order: 0 }],
    crew: [{ id: 9, name: 'Bong Joon Ho', job: 'Director' }],
    popularity: 85,
    voteAverage: 8.5,
    voteCount: 17000,
  },
  {
    tmdbId: 13,
    type: 'movie',
    title: 'Forrest Gump',
    posterPath: '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
    overview:
      'A man with a low IQ accomplishes great things in his life and is present during significant historic events, far exceeding what anyone imagined he could do.',
    releaseDate: '1994-07-06',
    runtime: 142,
    genres: [G(35, 'Comedy'), G(18, 'Drama'), G(10749, 'Romance')],
    keywords: ['life story', 'running', 'vietnam', 'chocolate'],
    cast: [{ id: 10, name: 'Tom Hanks', character: 'Forrest Gump', order: 0 }],
    crew: [{ id: 11, name: 'Robert Zemeckis', job: 'Director' }],
    popularity: 80,
    voteAverage: 8.8,
    voteCount: 26000,
  },
  {
    tmdbId: 680,
    type: 'movie',
    title: 'Pulp Fiction',
    posterPath: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    overview:
      "The lives of two mob hitmen, a boxer, a gangster's wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    releaseDate: '1994-10-14',
    runtime: 154,
    genres: [G(53, 'Thriller'), G(80, 'Crime')],
    keywords: ['nonlinear', 'hitmen', 'briefcase', 'diner'],
    cast: [
      { id: 12, name: 'John Travolta', character: 'Vincent Vega', order: 0 },
      { id: 13, name: 'Samuel L. Jackson', character: 'Jules', order: 1 },
    ],
    crew: [{ id: 14, name: 'Quentin Tarantino', job: 'Director' }],
    popularity: 78,
    voteAverage: 8.9,
    voteCount: 27000,
  },
  {
    tmdbId: 769,
    type: 'movie',
    title: 'GoodFellas',
    posterPath: '/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg',
    overview:
      'The true story of Henry Hill, who grows up idolizing the mob and works his way up through the ranks.',
    releaseDate: '1990-09-19',
    runtime: 145,
    genres: [G(18, 'Drama'), G(80, 'Crime')],
    keywords: ['mafia', 'gangster', 'true story'],
    cast: [
      { id: 15, name: 'Robert De Niro', character: 'Jimmy Conway', order: 0 },
      { id: 16, name: 'Joe Pesci', character: 'Tommy', order: 1 },
    ],
    crew: [{ id: 17, name: 'Martin Scorsese', job: 'Director' }],
    popularity: 60,
    voteAverage: 8.7,
    voteCount: 12000,
  },
  {
    tmdbId: 278,
    type: 'movie',
    title: 'The Shawshank Redemption',
    posterPath: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
    overview:
      "Imprisoned for a crime he didn't commit, banker Andy Dufresne forms an unlikely friendship and discovers hope in the most hopeless of places.",
    releaseDate: '1994-09-23',
    runtime: 142,
    genres: [G(18, 'Drama'), G(80, 'Crime')],
    keywords: ['prison', 'hope', 'friendship', 'escape'],
    cast: [
      { id: 18, name: 'Tim Robbins', character: 'Andy Dufresne', order: 0 },
      { id: 19, name: 'Morgan Freeman', character: 'Red', order: 1 },
    ],
    crew: [{ id: 20, name: 'Frank Darabont', job: 'Director' }],
    popularity: 82,
    voteAverage: 9.3,
    voteCount: 27000,
  },
  {
    tmdbId: 238,
    type: 'movie',
    title: 'The Godfather',
    posterPath: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    overview:
      'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant youngest son.',
    releaseDate: '1972-03-24',
    runtime: 175,
    genres: [G(18, 'Drama'), G(80, 'Crime')],
    keywords: ['mafia', 'family empire', 'classic'],
    cast: [
      { id: 21, name: 'Marlon Brando', character: 'Vito Corleone', order: 0 },
      { id: 22, name: 'Al Pacino', character: 'Michael Corleone', order: 1 },
    ],
    crew: [{ id: 23, name: 'Francis Ford Coppola', job: 'Director' }],
    popularity: 75,
    voteAverage: 9.2,
    voteCount: 20000,
  },
  {
    tmdbId: custom(1),
    type: 'movie',
    title: 'Spirited Away',
    posterPath: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    overview:
      'A young girl wanders into a world ruled by gods, witches and spirits, where humans are changed into beasts.',
    releaseDate: '2001-07-20',
    runtime: 125,
    genres: [G(16, 'Animation'), G(12, 'Adventure'), G(14, 'Fantasy')],
    keywords: ['spirits', 'bathhouse', 'coming of age', 'anime'],
    cast: [{ id: 24, name: 'Rumi Hiiragi', character: 'Chihiro', order: 0 }],
    crew: [{ id: 25, name: 'Hayao Miyazaki', job: 'Director' }],
    popularity: 70,
    voteAverage: 8.6,
    voteCount: 16000,
  },
  {
    tmdbId: custom(2),
    type: 'movie',
    title: 'The Grand Budapest Hotel',
    overview:
      'A legendary concierge and his trusted protégé become entangled in the theft of a priceless painting and a battle for an enormous fortune.',
    releaseDate: '2014-03-28',
    runtime: 99,
    genres: [G(35, 'Comedy'), G(18, 'Drama')],
    keywords: ['hotel', 'whimsical', 'caper', 'europe'],
    cast: [{ id: 26, name: 'Ralph Fiennes', character: 'M. Gustave', order: 0 }],
    crew: [{ id: 27, name: 'Wes Anderson', job: 'Director' }],
    popularity: 55,
    voteAverage: 8.0,
    voteCount: 14000,
  },
  {
    tmdbId: custom(3),
    type: 'movie',
    title: 'Mad Max: Fury Road',
    posterPath: '/hA2ple9q4qnwxp3hKVNhroipsir.jpg',
    overview:
      "In a post-apocalyptic wasteland, a drifter and a fearless commander flee a tyrant who controls the land's water.",
    releaseDate: '2015-05-15',
    runtime: 120,
    genres: [G(28, 'Action'), G(12, 'Adventure'), G(878, 'Science Fiction')],
    keywords: ['wasteland', 'chase', 'furiosa', 'practical effects'],
    cast: [
      { id: 28, name: 'Tom Hardy', character: 'Max', order: 0 },
      { id: 29, name: 'Charlize Theron', character: 'Furiosa', order: 1 },
    ],
    crew: [{ id: 30, name: 'George Miller', job: 'Director' }],
    popularity: 65,
    voteAverage: 8.1,
    voteCount: 21000,
  },
  {
    tmdbId: custom(4),
    type: 'movie',
    title: 'La La Land',
    posterPath: '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
    overview:
      'An aspiring actress and a dedicated jazz musician chase their dreams in Los Angeles while falling in love.',
    releaseDate: '2016-12-09',
    runtime: 128,
    genres: [G(35, 'Comedy'), G(18, 'Drama'), G(10749, 'Romance')],
    keywords: ['jazz', 'musical', 'los angeles', 'dreams'],
    cast: [
      { id: 31, name: 'Ryan Gosling', character: 'Seb', order: 0 },
      { id: 32, name: 'Emma Stone', character: 'Mia', order: 1 },
    ],
    crew: [{ id: 33, name: 'Damien Chazelle', job: 'Director' }],
    popularity: 58,
    voteAverage: 7.9,
    voteCount: 16000,
  },
  {
    tmdbId: custom(5),
    type: 'movie',
    title: 'Get Out',
    posterPath: '/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg',
    overview:
      "A young Black man visits his white girlfriend's family estate, where simmering unease about their reception turns into a nightmare.",
    releaseDate: '2017-02-24',
    runtime: 104,
    genres: [G(27, 'Horror'), G(9648, 'Mystery'), G(53, 'Thriller')],
    keywords: ['social thriller', 'hypnosis', 'suburbia'],
    cast: [{ id: 34, name: 'Daniel Kaluuya', character: 'Chris', order: 0 }],
    crew: [{ id: 35, name: 'Jordan Peele', job: 'Director' }],
    popularity: 62,
    voteAverage: 7.7,
    voteCount: 15000,
  },
  {
    tmdbId: custom(6),
    type: 'movie',
    title: 'Coco',
    posterPath: '/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg',
    overview:
      'Aspiring musician Miguel enters the Land of the Dead to find his great-great-grandfather, a legendary singer.',
    releaseDate: '2017-11-22',
    runtime: 105,
    genres: [G(16, 'Animation'), G(12, 'Adventure'), G(10751, 'Family')],
    keywords: ['music', 'family', 'day of the dead', 'pixar'],
    cast: [{ id: 36, name: 'Anthony Gonzalez', character: 'Miguel', order: 0 }],
    crew: [{ id: 37, name: 'Lee Unkrich', job: 'Director' }],
    popularity: 60,
    voteAverage: 8.2,
    voteCount: 19000,
  },
  {
    tmdbId: custom(7),
    type: 'movie',
    title: 'Dune',
    posterPath: '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
    overview:
      'Paul Atreides, a gifted young man, must travel to the most dangerous planet in the universe to ensure the future of his family and his people.',
    releaseDate: '2021-10-22',
    runtime: 155,
    genres: [G(12, 'Adventure'), G(18, 'Drama'), G(878, 'Science Fiction')],
    keywords: ['desert', 'spice', 'prophecy', 'arrakis'],
    cast: [{ id: 38, name: 'Timothée Chalamet', character: 'Paul', order: 0 }],
    crew: [{ id: 39, name: 'Denis Villeneuve', job: 'Director' }],
    popularity: 88,
    voteAverage: 8.0,
    voteCount: 12000,
  },
  {
    tmdbId: custom(8),
    type: 'movie',
    title: 'Everything Everywhere All at Once',
    posterPath: '/rKvCys0fMIIi1X9rmJBxTPLAtoU.jpg',
    overview:
      'An exhausted laundromat owner is swept into a multiverse adventure to save existence itself.',
    releaseDate: '2022-03-25',
    runtime: 139,
    genres: [G(28, 'Action'), G(12, 'Adventure'), G(878, 'Science Fiction')],
    keywords: ['multiverse', 'family', 'absurdist', 'martial arts'],
    cast: [{ id: 40, name: 'Michelle Yeoh', character: 'Evelyn', order: 0 }],
    crew: [{ id: 41, name: 'Daniel Kwan', job: 'Director' }],
    popularity: 72,
    voteAverage: 7.8,
    voteCount: 13000,
  },
  {
    tmdbId: custom(9),
    type: 'movie',
    title: 'The Martian',
    overview:
      'Stranded on Mars and presumed dead, astronaut Mark Watney must use his ingenuity to survive and signal Earth.',
    releaseDate: '2015-10-02',
    runtime: 144,
    genres: [G(12, 'Adventure'), G(18, 'Drama'), G(878, 'Science Fiction')],
    keywords: ['mars', 'survival', 'space', 'botany', 'nasa'],
    cast: [{ id: 42, name: 'Matt Damon', character: 'Mark Watney', order: 0 }],
    crew: [{ id: 43, name: 'Ridley Scott', job: 'Director' }],
    popularity: 66,
    voteAverage: 8.0,
    voteCount: 22000,
  },
  {
    tmdbId: custom(10),
    type: 'movie',
    title: 'Whiplash',
    overview:
      "A promising young drummer enrolls at a cut-throat music conservatory where his mentor will stop at nothing to realize a student's potential.",
    releaseDate: '2014-10-10',
    runtime: 106,
    genres: [G(18, 'Drama'), G(10402, 'Music')],
    keywords: ['jazz', 'drums', 'obsession', 'mentor'],
    cast: [
      { id: 44, name: 'Miles Teller', character: 'Andrew', order: 0 },
      { id: 45, name: 'J.K. Simmons', character: 'Fletcher', order: 1 },
    ],
    crew: [{ id: 33, name: 'Damien Chazelle', job: 'Director' }],
    popularity: 57,
    voteAverage: 8.5,
    voteCount: 15000,
  },
  {
    tmdbId: 1399,
    type: 'tv',
    title: 'Game of Thrones',
    posterPath: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
    overview:
      'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.',
    releaseDate: '2011-04-17',
    genres: [G(10765, 'Sci-Fi & Fantasy'), G(18, 'Drama'), G(10759, 'Action & Adventure')],
    keywords: ['dragons', 'throne', 'westeros', 'politics'],
    cast: [{ id: 46, name: 'Emilia Clarke', character: 'Daenerys', order: 0 }],
    crew: [{ id: 47, name: 'David Benioff', job: 'Creator' }],
    popularity: 99,
    voteAverage: 8.4,
    voteCount: 23000,
  },
  {
    tmdbId: 1396,
    type: 'tv',
    title: 'Breaking Bad',
    posterPath: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    overview:
      "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing methamphetamine to secure his family's future.",
    releaseDate: '2008-01-20',
    genres: [G(18, 'Drama'), G(80, 'Crime')],
    keywords: ['meth', 'descent', 'albuquerque', 'heisenberg'],
    cast: [{ id: 48, name: 'Bryan Cranston', character: 'Walter White', order: 0 }],
    crew: [{ id: 49, name: 'Vince Gilligan', job: 'Creator' }],
    popularity: 97,
    voteAverage: 9.5,
    voteCount: 14000,
  },
  {
    tmdbId: 66732,
    type: 'tv',
    title: 'Stranger Things',
    posterPath: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    overview:
      'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    releaseDate: '2016-07-15',
    genres: [G(18, 'Drama'), G(10765, 'Sci-Fi & Fantasy'), G(9648, 'Mystery')],
    keywords: ['upside down', 'kids', '80s', 'hawkins'],
    cast: [{ id: 50, name: 'Millie Bobby Brown', character: 'Eleven', order: 0 }],
    crew: [{ id: 51, name: 'The Duffer Brothers', job: 'Creator' }],
    popularity: 96,
    voteAverage: 8.6,
    voteCount: 18000,
  },
  {
    tmdbId: custom(11),
    type: 'tv',
    title: 'The Office',
    posterPath: '/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg',
    overview:
      'A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium.',
    releaseDate: '2005-03-24',
    genres: [G(35, 'Comedy')],
    keywords: ['mockumentary', 'workplace', 'scranton', 'sitcom'],
    cast: [{ id: 52, name: 'Steve Carell', character: 'Michael Scott', order: 0 }],
    crew: [{ id: 53, name: 'Greg Daniels', job: 'Creator' }],
    popularity: 85,
    voteAverage: 9.0,
    voteCount: 11000,
  },
  {
    tmdbId: custom(12),
    type: 'tv',
    title: 'Dark',
    posterPath: '/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg',
    overview:
      'A missing child sets four families on a frantic hunt for answers, unearthing a time-travel mystery spanning three generations.',
    releaseDate: '2017-12-01',
    genres: [G(80, 'Crime'), G(18, 'Drama'), G(9648, 'Mystery')],
    keywords: ['time travel', 'german', 'winden', 'paradox'],
    cast: [{ id: 54, name: 'Louis Hofmann', character: 'Jonas', order: 0 }],
    crew: [{ id: 55, name: 'Baran bo Odar', job: 'Creator' }],
    popularity: 70,
    voteAverage: 8.7,
    voteCount: 9000,
  },
];

// Placeholder TMDB ids for titles whose real ids are not pinned here.
// They are unique within the seed set and never collide with ingested data
// because real ingestion upserts on (tmdbId, type) and seed runs first only on empty DB.
function custom(n: number): number {
  return 9000000 + n;
}
