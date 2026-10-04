# Deckhand

**More deck. Less desk.**

Deckhand is a Startup Weekend prototype for independent fishermen's collectives in Alaska. A collective wants its members to earn more by selling direct, but nobody on the boat has time to build a website or write marketing copy. Deckhand does that part:

1. **The collective builds its site.** Enter a few facts about the catch. Deckhand writes the page, adds the home port's local line (Juneau gets "Sold out the road and beyond") and shows what the catch is worth sold direct compared with the dock price.
2. **Buyers order from the collective's own site.**
3. **Each buyer follows their fish.** An animated tracker goes from "still swimming" to "caught", "off to processing", "getting packed" and "shipped", where the carrier's tracking number takes over.

## Run it

You need Node 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173. The API runs on http://localhost:3001 and the dev server forwards `/api` to it.

To run it as one server, the way you would for a demo on someone else's laptop:

```bash
npm run build
npm start
```

Then open http://localhost:3001.

Run the tests with `npm test`.

### Orders database (MongoDB)

Orders placed on the sample store (`/example`) show up on the dashboard's My orders page. They are stored in an `orders` collection when `MONGODB_URI` is set:

```bash
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net" npm run dev
```

`MONGODB_DB` picks the database name and defaults to `deckhand`. Without `MONGODB_URI`, orders are kept in memory and clear on restart. On Railway, add `MONGODB_URI` under the service's Variables.

## The three pages

| Address | Who it's for | What it does |
| --- | --- | --- |
| `/` | The collective | Builder form, live preview, "what this catch is worth", and a post to share once the site is created |
| `/s/<collective-name>` | Buyers | The collective's site: headline, catch, price, local line, and Buy |
| `/order/<id>` | A buyer | The animated tracker, plus a demo strip for moving the order along |

A sample site and order are created every time the server starts, so these always work:

- http://localhost:5173/s/sample-harbor-collective
- http://localhost:5173/order/demo

## A two-minute demo

1. On `/`, change the home port and watch the local line change. Point at the worth card.
2. Press **Create our site**, then open the link.
3. Buy a few pounds. You land on the tracker at "Still swimming".
4. Open the same tracker address on a phone. Press **Next** on the laptop and the phone follows within a few seconds.
5. At the last step, pick a carrier and type a tracking number to show the hand-off to real tracking.
6. Go back to the site and buy everything that's left to show **Sold out**.

## What is real and what is not

This is a prototype. It is small on purpose.

- **No payments.** Buy records an order and nothing else. There are no card fields.
- **No accounts.** Anyone can create or overwrite a site by using its name, and anyone with an order address can press the demo controls.
- **Nothing is saved.** Sites and orders live in memory and disappear when the server restarts.
- **Tracking is typed in.** At "Shipped" the page links to the carrier's own tracking page for the number entered. With no number it shows a placeholder and says so. Nothing is looked up from a carrier.
- **Stages are moved by hand.** A real version would let the fisherman move an order along from the boat.
- **The copy is templates,** not AI. The same input always gives the same words.
- **The sample numbers are placeholders,** not market prices. The boat and collective in the sample are made up.

## Where things are

```
server/
  index.js     Express routes
  ports.js     Home ports, their local lines, carriers, sample data
  kit.js       Writes the site headline, the share post and the worth numbers
  store.js     Sites, orders and the five tracking stages (in memory)
  *.test.js    Tests for kit.js and store.js
client/
  src/pages/        BuilderPage, StorePage, OrderPage
  src/components/   FishMark (logo), SiteSign, WorthCard, Journey (the animation)
  src/style.css     All styling
  public/           Logo, icon and the stencil font
```

## The local lines

The lines in `server/ports.js` were drafted by the team, not by people from each town. Every port is marked `checkedByLocal: false`, and the builder shows a reminder until that is changed. Have someone who fishes out of that port check a line before it is used for real. Take particular care with Kotzebue, where the fishery is largely Iñupiaq-owned.

To add a port, add an entry to `ports` with its slogan split into parts and one part marked `accent: true`.

## Credits

The stencil lettering is [Saira Stencil One](https://fonts.google.com/specimen/Saira+Stencil+One), used under the SIL Open Font License (see `client/public/fonts/OFL.txt`).
