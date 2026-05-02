(function () {
  "use strict";

  const now = new Date();
  const iso = (daysAgo, hour) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, 18, 0, 0);
    return d.toISOString();
  };

  window.TerminalForumSeed = {
    boards: [
      {
        slug: "station",
        title: "Station",
        description: "Site notices, rules, changelogs, and public coordination for the forum itself.",
        threadIds: [1, 2, 3, 4, 5]
      }
    ],
    tags: [
      {
        slug: "design",
        title: "Design",
        description: "Interfaces, reading rhythm, text UI, and visual direction.",
        owner: "erik",
        updatedAt: iso(0, 8)
      },
      {
        slug: "homelab",
        title: "Homelab",
        description: "Small servers, Linux installs, storage, and always-on machines.",
        owner: "nullfan",
        updatedAt: iso(1, 8)
      },
      {
        slug: "javascript",
        title: "JavaScript",
        description: "Browser code, command parsers, UI state, and local-first prototypes.",
        owner: "byteghost",
        updatedAt: iso(2, 8)
      },
      {
        slug: "books",
        title: "Books",
        description: "Short computing history reads and systems culture notes.",
        owner: "archivist",
        updatedAt: iso(4, 8)
      },
      {
        slug: "weird-web",
        title: "Weird Web",
        description: "Text sites, personal protocols, BBS energy, and experimental pages.",
        owner: "erik",
        updatedAt: iso(5, 8)
      }
    ],
    threads: [
      {
        id: 1,
        boardSlug: "station",
        title: "What should a text-only forum feel like?",
        author: "erik",
        createdAt: iso(0, 12),
        status: "open",
        tags: ["design", "terminal"],
        postIds: [101, 102]
      },
      {
        id: 2,
        boardSlug: "station",
        title: "Turning an old laptop into a quiet server",
        author: "nullfan",
        createdAt: iso(1, 21),
        status: "open",
        tags: ["homelab", "linux"],
        postIds: [201, 202]
      },
      {
        id: 3,
        boardSlug: "station",
        title: "Command parser architecture for a web shell UI",
        author: "byteghost",
        createdAt: iso(2, 15),
        status: "open",
        tags: ["javascript", "ui"],
        postIds: [301]
      },
      {
        id: 4,
        boardSlug: "station",
        title: "Small books about computing history",
        author: "archivist",
        createdAt: iso(4, 9),
        status: "open",
        tags: ["books"],
        postIds: [401]
      },
      {
        id: 5,
        boardSlug: "station",
        title: "A website that pretends to be one text object",
        author: "erik",
        createdAt: iso(5, 22),
        status: "open",
        tags: ["weird-web", "bbs", "aesthetic"],
        postIds: [501, 502]
      }
    ],
    posts: [
      {
        id: 101,
        threadId: 1,
        author: "erik",
        createdAt: iso(0, 12),
        updatedAt: null,
        body: "I want a forum that feels like a console, but not in a cheap green-on-black way. It should be serious enough to read for a long time."
      },
      {
        id: 102,
        threadId: 1,
        author: "byteghost",
        createdAt: iso(0, 13),
        updatedAt: null,
        body: "The hard part is not the look. It is making commands discoverable. Every page needs to tell the user the next useful command."
      },
      {
        id: 201,
        threadId: 2,
        author: "nullfan",
        createdAt: iso(1, 21),
        updatedAt: null,
        body: "I have a spare laptop. I want it to run a tiny forum, maybe a bot, and a few static pages. What should I install first?"
      },
      {
        id: 202,
        threadId: 2,
        author: "erik",
        createdAt: iso(1, 22),
        updatedAt: null,
        body: "Start with a minimal Linux server install, SSH, firewall, Tailscale if you need private access, then deploy one small web service. Do not make it complicated too early."
      },
      {
        id: 301,
        threadId: 3,
        author: "byteghost",
        createdAt: iso(2, 15),
        updatedAt: null,
        body: "A parser should return an intent object, not directly mutate the page. Example: { type: 'open_tag', slug: 'javascript' }. Then the app can decide how to render or navigate."
      },
      {
        id: 401,
        threadId: 4,
        author: "archivist",
        createdAt: iso(4, 9),
        updatedAt: null,
        body: "Looking for books that are small enough to read on the train but not empty beginner stuff. Computing history, company stories, systems culture."
      },
      {
        id: 501,
        threadId: 5,
        author: "erik",
        createdAt: iso(5, 22),
        updatedAt: null,
        body: "What if the whole website is made from text, like the browser is just a terminal pane? Not fake Linux. More like a forum designed as a document you can operate."
      },
      {
        id: 502,
        threadId: 5,
        author: "nullfan",
        createdAt: iso(5, 23),
        updatedAt: null,
        body: "That can work if the text has rhythm. Borders, paths, commands, short metadata lines. It needs discipline."
      }
    ],
    users: []
  };
})();
