import { useState, useMemo, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Startup Ops Stack — recommends an operations stack for early stage startups,
// tuned to the founder's real problem and budget. 47 tools across 9 layers.
// Shaped by working alongside founders at two early stage startups.
// Pricing verified July 2026, shown in GBP as approximate tiers.
// ---------------------------------------------------------------------------

const FONT_LINK_ID = "ops-stack-fonts-v3";
const PRICING_VERIFIED = "July 2026"; // update when you re-check the pricing pages

const QUESTIONS = [
  {
    id: "stage",
    label: "Stage",
    prompt: "Where is the company right now?",
    help: "This decides how much process you actually need. Too much too early is its own drag.",
    options: [
      { value: "idea", label: "Still figuring it out", sub: "Pre-product, validating the idea", tags: ["lean", "validate"] },
      { value: "mvp", label: "Building the first version", sub: "MVP in progress, pre-launch", tags: ["lean", "build"] },
      { value: "launched", label: "Launched with early users", sub: "Some traction, maybe some revenue", tags: ["grow", "measure"] },
      { value: "scaling", label: "Growing fast", sub: "Revenue climbing, starting to hire", tags: ["scale", "systemise"] },
    ],
  },
  {
    id: "team",
    label: "Team",
    prompt: "Who is actually doing the work?",
    help: "Team size decides whether you need coordination tools or just a shared doc and good habits.",
    options: [
      { value: "solo", label: "Just me", sub: "Solo or a co-founder", tags: ["lean", "async"] },
      { value: "small", label: "A tight team", sub: "3 to 8 people", tags: ["coordinate"] },
      { value: "growing", label: "A growing team", sub: "9 to 20 people", tags: ["coordinate", "systemise"] },
      { value: "established", label: "Getting sizeable", sub: "20+ people", tags: ["systemise", "scale"] },
    ],
  },
  {
    id: "problem",
    label: "The real problem",
    prompt: "What is genuinely keeping you up at night?",
    help: "Pick the one thing that, if it were fixed tomorrow, would unblock the most. The stack is built around this.",
    options: [
      { value: "customers", label: "I can't find enough customers", sub: "Growth and go to market", tags: ["gtm"] },
      { value: "building", label: "I'm not sure we're building the right thing", sub: "Product direction and feedback", tags: ["product"] },
      { value: "busywork", label: "I'm drowning in busywork", sub: "Admin and manual tasks eat the day", tags: ["ops", "busywork"] },
      { value: "cracks", label: "Things keep falling through the cracks", sub: "No system, stuff gets forgotten", tags: ["ops", "structured-need"] },
      { value: "support", label: "We can't keep up with customers", sub: "Support and inbound messages", tags: ["support"] },
      { value: "brand", label: "We look amateur next to competitors", sub: "Brand, design, and positioning", tags: ["design", "gtm"] },
      { value: "money", label: "Runway and fundraising", sub: "Cash, investors, finance", tags: ["finance"] },
      { value: "hiring", label: "Hiring is chaos", sub: "Finding and onboarding people", tags: ["people"] },
    ],
  },
  {
    id: "budget",
    label: "Budget",
    prompt: "What can you spend on tools each month?",
    help: "Early on, free tiers and startup credits cover far more than founders expect. This filters out overkill.",
    options: [
      { value: "zero", label: "Basically nothing", sub: "Free tiers and credits only", tags: ["free"] },
      { value: "lean", label: "A little", sub: "Under £150 a month", tags: ["lean-budget"] },
      { value: "funded", label: "We have some budget", sub: "£150 to £800 a month", tags: ["funded"] },
    ],
  },
  {
    id: "style",
    label: "Ways of working",
    prompt: "How does the team like to work?",
    help: "A stack the team resents is a stack nobody updates. This tunes the picks for fit.",
    options: [
      { value: "async", label: "Async and written", sub: "Docs over meetings", tags: ["async-pref"] },
      { value: "fast", label: "Fast and scrappy", sub: "Move first, tidy later", tags: ["scrappy"] },
      { value: "structured", label: "Structured", sub: "Clear process and owners", tags: ["structured"] },
    ],
  },
];

const LAYER_ORDER = [
  "Foundation", "Communication", "Growth", "Design",
  "Product", "Operations", "Customer Support", "Finance", "People",
];

// ---------------------------------------------------------------------------
// Catalogue: 47 tools across 9 layers. Prices are approximate GBP tiers,
// verified July 2026. Where a pairing was just hedging, the tool commits to one
// default and notes the alternative in the reasoning. Genuine "pick this when"
// pairs (Framer/Webflow, Zapier/Make, Plausible/GA4) stay as pairs.
// ---------------------------------------------------------------------------
const CATALOGUE = [
  // ===================== FOUNDATION =====================
  {
    layer: "Foundation", name: "Notion", role: "Company wiki, docs, light databases",
    price: "Free tier · paid from ~£10/user", url: "https://www.notion.com/pricing",
    when: () => true,
    reason: (a) => a.team === "solo"
      ? "One home for everything before you have the headcount to specialise. Free plan has no page limit for solo use."
      : "A single source of truth so context stops living only in people's heads. Ends the same question being asked five times.",
    vsObvious: "Over a pile of Google Docs, because databases and templates turn notes into reusable systems.",
    tip: "Notion for Startups: up to 6 months of Business + AI free for eligible new non-paying startups.",
  },
  {
    layer: "Foundation", name: "Google Workspace", role: "Email, docs, drive, calendar",
    price: "Free on Gmail · Business from ~£5/user", url: "https://workspace.google.com/pricing",
    when: () => true,
    reason: () => "The boring backbone everything else plugs into. Custom domain email also makes early outreach look legitimate.",
    vsObvious: "Microsoft 365 with Outlook is the alternative if your team already lives in the Microsoft ecosystem, otherwise Google Workspace is the lighter early default.",
    tip: "Free on an @gmail address. Add a domain only when you start selling.",
  },
  {
    layer: "Foundation", name: "Coda", role: "Docs that behave like apps",
    price: "Free tier · paid from ~£9/user", url: "https://coda.io/pricing",
    when: (t, a) => t.has("structured") || a.problem === "cracks",
    reason: () => "When your docs need buttons, logic, and live tables, Coda goes further than Notion. Good for structured teams building internal tools.",
    vsObvious: "Over Notion specifically when you want interactive docs, not just pretty ones.",
  },
  {
    layer: "Foundation", name: "1Password", role: "Shared password and secrets manager",
    price: "From ~£3.70/user", url: "https://1password.com/business-pricing",
    when: (t, a) => a.team !== "solo",
    reason: () => "The moment two people share a login, passwords in a spreadsheet become a security incident waiting to happen. Cheap insurance.",
  },

  // ===================== COMMUNICATION =====================
  {
    layer: "Communication", name: "Slack", role: "Team messaging and integrations",
    price: "Free tier is generous", url: "https://slack.com/pricing",
    when: (t, a) => a.team !== "solo",
    reason: (a) => a.style === "async"
      ? "Channels keep decisions searchable instead of buried in DMs. Set it quiet, keep the record."
      : "Fast coordination without another meeting. Free tier works early, but note it only keeps 90 days of message history and strains past ~20 people.",
    vsObvious: "Over WhatsApp for work, because search and channels mean context does not vanish up the scroll. Microsoft Teams is the alternative if you are already in the Microsoft ecosystem.",
  },
  {
    layer: "Communication", name: "Loom", role: "Screen recordings instead of meetings",
    price: "Free tier · paid from ~£13/mo", url: "https://www.loom.com/pricing",
    when: (t) => t.has("async-pref"),
    reason: () => "A two minute recording replaces a thirty minute call for anything you can show rather than discuss. Async teams live on this.",
  },
  {
    layer: "Communication", name: "Google Meet", role: "Video calls",
    price: "Free with Workspace", url: "https://workspace.google.com/products/meet",
    when: () => true,
    reason: () => "Free with Workspace and fine for most calls. No 40 minute cap to work around, and nothing extra to buy early on.",
    vsObvious: "Over Zoom early, because you are already paying for Workspace and Zoom's free-tier time limit will annoy you.",
  },
  {
    layer: "Communication", name: "Discord", role: "Community and user channels",
    price: "Free", url: "https://discord.com/pricing",
    when: (t, a) => t.has("gtm") && (a.stage === "idea" || a.stage === "mvp"),
    reason: () => "If your early users cluster in a community, Discord is where they already are. Free, and great for building in public.",
  },

  // ===================== GROWTH / GTM =====================
  {
    layer: "Growth", name: "HubSpot free CRM", role: "Track leads, deals, conversations",
    price: "Free for 2 users · paid from ~£15/user", url: "https://www.hubspot.com/pricing/crm",
    when: (t) => t.has("gtm"),
    reason: () => "Once you have more than a handful of prospects, memory stops scaling and deals go cold in the gaps. Free tier covers 2 seats and 1,000 contacts, which is plenty to start.",
    vsObvious: "Over a spreadsheet, because it reminds you to follow up. A sheet never nudges you.",
  },
  {
    layer: "Growth", name: "Attio", role: "Modern, flexible CRM",
    price: "Free for 3 users · paid from ~£23/user", url: "https://attio.com/pricing",
    when: (t, a) => t.has("gtm") && (t.has("funded") || t.has("lean-budget")),
    reason: () => "A CRM you shape around how you actually sell, rather than bending your process to fit. Founder favourite, and the free tier fits a small team.",
    vsObvious: "Over HubSpot when you want a data model that matches your business, not a rigid contacts-and-deals template.",
  },
  {
    layer: "Growth", name: "Apollo.io", role: "Find prospects and run outreach",
    price: "Free tier · paid from ~£35/mo", url: "https://www.apollo.io/pricing",
    when: (t) => t.has("gtm") && !t.has("free"),
    reason: () => "Build targeted lists and sequence outreach without enterprise sales-tool prices. Right-sized for founder-led sales.",
  },
  {
    layer: "Growth", name: "Instantly", role: "Cold email sequences",
    price: "From ~£35/mo", url: "https://instantly.ai/pricing",
    when: (t, a) => t.has("gtm") && t.has("funded"),
    reason: () => "When outbound becomes a real channel, Instantly keeps sequencing simple with flat pricing that suits a lean team. Lemlist is the pricier, more polished option once outbound is a dedicated function.",
    vsObvious: "Over Lemlist for an early team, because flat pricing beats per-seat when you are small and watching spend.",
  },
  {
    layer: "Growth", name: "Plausible or GA4", role: "Website and product analytics",
    price: "GA4 free · Plausible from ~£9/mo", url: "https://plausible.io/#pricing",
    when: (t) => t.has("gtm") || t.has("measure") || t.has("grow"),
    reason: () => "You cannot improve what you cannot see. GA4 if free is the priority, Plausible if you want simple and privacy-friendly.",
  },
  {
    layer: "Growth", name: "PostHog", role: "Product analytics and session insight",
    price: "Generous free tier", url: "https://posthog.com/pricing",
    when: (t, a) => (t.has("product") || t.has("grow")) && a.stage !== "idea",
    reason: () => "Shows what users actually do inside the product, not just how many arrived. The free tier is large enough to run on for a long time.",
    vsObvious: "Over GA4 for product depth, because GA4 tells you about traffic, PostHog tells you about behaviour.",
  },
  {
    layer: "Growth", name: "Buffer", role: "Schedule social, build in public",
    price: "Free tier · paid from ~£4/channel/mo", url: "https://buffer.com/pricing",
    when: (t, a) => t.has("gtm") && a.stage !== "scaling",
    reason: () => "Early distribution is often the founder posting consistently. Scheduling removes the daily friction so it actually happens. Note it is priced per channel, so costs rise with each account.",
  },

  // ===================== DESIGN =====================
  {
    layer: "Design", name: "Figma", role: "UI, product, and marketing design",
    price: "Free tier · full seat from ~£13/mo", url: "https://www.figma.com/pricing",
    when: () => true,
    reason: (a) => a.problem === "brand"
      ? "The industry standard for anything visual. Even non-designers can tidy up a deck or mockup here. Free tier covers early needs, the full editor seat is what you pay for once designing properly."
      : "One place for product mockups, quick graphics, and shared design files. Free tier is enough until you have a dedicated designer.",
  },
  {
    layer: "Design", name: "Canva", role: "Fast graphics without a designer",
    price: "Free tier · Pro from ~£13/mo", url: "https://www.canva.com/pricing",
    when: () => true,
    reason: () => "Social posts, one-pagers, and decks that look professional in minutes. This is what keeps a founder-run brand from looking homemade.",
    vsObvious: "Over Figma for quick marketing assets, because templates get you to done faster when you are not a designer.",
    tip: "Canva for Startups gives eligible early teams Pro features free.",
  },
  {
    layer: "Design", name: "Framer or Webflow", role: "Marketing site without a developer",
    price: "Free tier · paid from ~£10/mo", url: "https://www.framer.com/pricing",
    when: (t, a) => t.has("gtm") || t.has("design") || a.stage === "idea" || a.stage === "mvp",
    reason: () => "A credible landing page you can edit yourself, no engineer needed. Framer is faster to learn, Webflow gives more control.",
    vsObvious: "Over a custom-coded site early, because your time is better spent talking to users than maintaining a codebase.",
  },
  {
    layer: "Design", name: "Pitch", role: "Collaborative pitch and sales decks",
    price: "Free tier · paid from ~£16/mo", url: "https://pitch.com/pricing",
    when: (t) => t.has("design") || t.has("gtm") || t.has("finance"),
    reason: () => "Founders live in decks: investor, sales, hiring. Pitch makes them look designed without the PowerPoint fight, and the team can work in one live at once.",
    vsObvious: "Over PowerPoint or raw Google Slides, because the templates and live collaboration save real hours on the decks you rebuild constantly.",
  },
  {
    layer: "Design", name: "Brandmark or Looka", role: "Starter logo and brand basics",
    price: "One-off from ~£14", url: "https://looka.com/pricing",
    when: (t, a) => a.problem === "brand" && (a.stage === "idea" || a.stage === "mvp"),
    reason: () => "A clean starter identity for near nothing, so you look intentional before you can afford a designer. Replace it later when brand matters more.",
  },
  {
    layer: "Design", name: "Unsplash + Coolors", role: "Free imagery and colour palettes",
    price: "Free", url: "https://coolors.co",
    when: (t) => t.has("design") || t.has("gtm"),
    reason: () => "Good free photography and a palette generator cover most early visual needs. Small touches that make a scrappy brand feel deliberate.",
  },

  // ===================== PRODUCT =====================
  {
    layer: "Product", name: "Linear", role: "Issue tracking and product planning",
    price: "Free tier · paid from ~£8/user", url: "https://linear.app/pricing",
    when: (t, a) => t.has("product") || a.stage === "mvp" || a.stage === "scaling",
    reason: (a) => a.problem === "building"
      ? "Direction comes from a clear, reorderable queue, not more meetings. Fast enough that engineers actually keep it current."
      : "Keeps the roadmap visible so priorities stop drifting. Light enough not to slow a small team.",
    vsObvious: "Over Jira at this stage, because Jira's power is overhead you do not need until you are much bigger.",
  },
  {
    layer: "Product", name: "GitHub", role: "Code hosting and version control",
    price: "Free for small teams", url: "https://github.com/pricing",
    when: (t) => t.has("product") || t.has("build"),
    reason: () => "Where your code lives, reviews happen, and history is safe. Non-negotiable the moment more than one person writes code.",
  },
  {
    layer: "Product", name: "Vercel or Netlify", role: "Deploy the product and sites",
    price: "Free tier · paid from ~£14/mo", url: "https://vercel.com/pricing",
    when: (t, a) => t.has("build") || a.stage === "mvp" || a.stage === "launched",
    reason: () => "Push code and it is live, with previews for every change. Removes a whole category of deployment headache for small teams.",
  },
  {
    layer: "Product", name: "Tagged feedback database", role: "Capture and theme user feedback",
    price: "Free in Notion · Dovetail paid", url: "https://dovetail.com/pricing",
    when: (t) => t.has("product") || t.has("validate"),
    reason: (a) => a.budget === "zero"
      ? "A tagged Notion database does most of this for free. Structure feedback so patterns surface before you spend on a dedicated tool."
      : "Turns scattered comments into themes you can act on. Feedback you cannot search is feedback you quietly ignore.",
  },
  {
    layer: "Product", name: "Canny", role: "Public feedback and roadmap board",
    price: "Free tier · paid from ~£40/mo (annual)", url: "https://canny.io/pricing",
    when: (t, a) => t.has("product") && a.stage === "launched",
    reason: () => "Lets users post and vote on requests in the open, so you prioritise with evidence instead of guesses and gut feel.",
  },
  {
    layer: "Product", name: "Cal.com or Calendly", role: "Book user interviews easily",
    price: "Free tier works", url: "https://cal.com/pricing",
    when: (t) => t.has("validate") || t.has("product"),
    reason: () => "Talking to users is the highest-leverage early activity. Remove every gram of scheduling friction so more conversations happen.",
  },

  // ===================== OPERATIONS =====================
  {
    layer: "Operations", name: "Zapier or Make", role: "Automate handoffs between tools",
    price: "Free tier · paid from ~£7/mo (Make) or ~£25/mo (Zapier)", url: "https://zapier.com/pricing",
    when: (t) => t.has("ops") || t.has("systemise") || t.has("scale"),
    reason: () => "Every manual copy-paste between two tools is a task that will eventually be forgotten. Automate the handoffs first, the clever stuff never.",
    vsObvious: "Make is cheaper and more flexible for complex flows. Zapier is simpler if you just want it working today.",
  },
  {
    layer: "Operations", name: "Templated processes with owners", role: "Repeatable workflows, one name per step",
    price: "Free in Notion", url: "https://www.notion.com/pricing",
    when: (t, a) => t.has("ops") || t.has("structured-need") || a.style === "structured",
    reason: () => "Things fall through cracks because steps have no owner, not because you lack a tool. A name against each step fixes most of it.",
  },
  {
    layer: "Operations", name: "Tally", role: "Forms, surveys, and intake",
    price: "Free (generous) · Pro from ~£20/mo", url: "https://tally.so/pricing",
    when: (t) => t.has("ops") || t.has("busywork") || t.has("gtm") || t.has("people"),
    reason: (a) => a.budget === "zero"
      ? "Beautiful forms with a genuinely generous free tier, edited like a Notion doc. The zero-budget answer for lead capture, surveys, and applications."
      : "Fast, clean forms for lead capture, surveys, and applications, feeding straight into the rest of your stack.",
    vsObvious: "Over Typeform when budget is tight, because Tally's free tier is far more generous for the same job.",
  },
  {
    layer: "Operations", name: "AI assistant workflow", role: "Draft, summarise, clear repetitive admin",
    price: "Free to start", url: "https://claude.ai",
    when: (t) => t.has("ops") || t.has("busywork"),
    reason: () => "Most founder busywork is drafting, summarising, and reformatting. A few saved AI prompts for the repeat jobs claw back hours a week for near nothing.",
  },
  {
    layer: "Operations", name: "Airtable", role: "Relational database for ops",
    price: "Free tier · paid from ~£14/user", url: "https://www.airtable.com/pricing",
    when: (t, a) => (t.has("systemise") || t.has("scale")) && a.team !== "solo",
    reason: () => "When Notion databases start creaking under real operational volume, Airtable's relational structure and automations hold up better.",
    vsObvious: "Over a Notion database when the data is genuinely operational: inventory, pipelines, anything with thousands of rows.",
  },
  {
    layer: "Operations", name: "Miro or FigJam", role: "Workshops and strategy mapping",
    price: "Free tier · paid from ~£6/user", url: "https://miro.com/pricing",
    when: (t, a) => (t.has("structured-need") || t.has("structured")) && a.team !== "solo",
    reason: () => "When you need to map a process, run a planning session, or think visually as a team, a shared canvas beats a doc. FigJam is free if you are already in Figma.",
    vsObvious: "FigJam over Miro if you already use Figma, since it is included. Miro if you want the deeper workshop features.",
  },
  {
    layer: "Operations", name: "Simple OKR or goals doc", role: "Keep everyone pointed the same way",
    price: "Free", url: "https://www.notion.com/pricing",
    when: (t, a) => t.has("systemise") && (a.team === "growing" || a.team === "established"),
    reason: () => "As the team grows, a one-page set of quarterly goals with owners stops good people rowing in different directions. Start as a doc, not software.",
  },

  // ===================== CUSTOMER SUPPORT =====================
  {
    layer: "Customer Support", name: "Front", role: "Shared inbox for support@ and hello@",
    price: "Free trial · paid from ~£20/seat", url: "https://front.com/pricing",
    when: (t, a) => t.has("support") || (t.has("gtm") && a.stage === "launched"),
    reason: () => "Early support is a shared email address descending into chaos: replies missed, two people answering the same thing. A shared inbox gives every message an owner without a heavy help desk.",
    vsObvious: "Over forwarding support@ to a personal inbox, because that quietly drops customers and nobody knows who replied.",
  },
  {
    layer: "Customer Support", name: "Plain", role: "Lightweight, fast customer support",
    price: "No free tier · paid from ~£28/seat", url: "https://www.plain.com/pricing",
    when: (t, a) => t.has("support") && (t.has("product") || a.stage === "launched" || a.stage === "scaling"),
    reason: () => "Support tooling that feels like Linear: fast, clean, and built for product-led teams rather than call centres. A good first support tool for a technical early team.",
    vsObvious: "Over Intercom or Zendesk early, because it is lighter to run and better aligned with B2B SaaS workflows.",
  },

  // ===================== FINANCE =====================
  {
    layer: "Finance", name: "Runway model in Sheets", role: "Cash, runway, scenario planning",
    price: "Free", url: "https://workspace.google.com/products/sheets",
    when: (t) => t.has("finance"),
    reason: () => "Before any finance software, a clean sheet showing runway in months is what you and investors both need. Start here.",
    vsObvious: "Over finance software on day one, because a founder who knows their runway cold beats one with a pretty dashboard.",
  },
  {
    layer: "Finance", name: "Xero", role: "Bookkeeping and invoicing",
    price: "From ~£7/mo (Simple) or ~£16/mo (Ignite)", url: "https://www.xero.com/uk/pricing",
    when: (t, a) => t.has("finance") && (a.stage === "launched" || a.stage === "scaling" || t.has("funded")),
    reason: () => "Clean books now save a painful cleanup at your first raise or year end. Non-negotiable once real money is moving. Stronger in the UK than QuickBooks, which is the main alternative.",
    vsObvious: "Over QuickBooks for a UK company, because Xero's interface and local fit are cleaner. QuickBooks is the alternative if you prefer it.",
  },
  {
    layer: "Finance", name: "Stripe", role: "Take payments online",
    price: "~1.5% + 20p per UK card", url: "https://stripe.com/gb/pricing",
    when: (t, a) => t.has("finance") || a.stage === "launched" || a.stage === "scaling",
    reason: () => "The default way to charge customers, with the developer support to match. If you are collecting revenue, this is the safe starting point.",
  },
  {
    layer: "Finance", name: "Pleo", role: "Company cards and spend control",
    price: "Free trial · Starter from ~£9.50/mo · Essential £45/mo", url: "https://www.pleo.io/en/pricing",
    when: (t, a) => t.has("finance") && (a.team === "growing" || a.team === "established" || t.has("funded")),
    reason: () => "Once more than one person spends money, per-person cards with built-in limits and receipt capture beat chasing expense claims. Pleo is UK and EU native. Ramp is the US alternative.",
    vsObvious: "Over Ramp or Brex for a UK team, because Pleo is built for UK and EU, while Ramp and Brex are US-first.",
  },
  {
    layer: "Finance", name: "Cap table in Sheets or Carta", role: "Track equity and ownership",
    price: "Free (Sheets) · Carta paid", url: "https://carta.com/pricing",
    when: (t, a) => t.has("finance") && a.stage !== "idea",
    reason: () => "Know exactly who owns what before you raise. A clean sheet is fine early, move to Carta when the cap table gets complex.",
  },
  {
    layer: "Finance", name: "AI investor research workflow", role: "Source, qualify, and track investors",
    price: "Free to build", url: "https://claude.ai",
    when: (t, a) => t.has("finance") && a.stage !== "scaling",
    reason: () => "Fundraising prep is mostly structured research: who fits, how to reach them, what to say. An automated sourcing and qualification workflow cuts the manual effort sharply and keeps outreach organised.",
    tip: "This is the layer I built hands-on: automated investor sourcing, qualification, structured lead tracking, and tailored outreach to improve fundraising readiness.",
  },

  // ===================== PEOPLE =====================
  {
    layer: "People", name: "Simple candidate pipeline", role: "Track applicants by stage and owner",
    price: "Free in Notion · Ashby when funded", url: "https://www.notion.com/pricing",
    when: (t) => t.has("people"),
    reason: (a) => (a.team === "solo" || a.budget === "zero")
      ? "A pipeline board beats a spreadsheet and costs nothing. Every candidate has a stage and an owner, so nobody goes cold."
      : "Hiring falls apart in the handoffs. A real pipeline keeps candidates warm and the process consistent.",
    vsObvious: "Over an inbox and a spreadsheet, because a pipeline shows at a glance who is stuck and where.",
  },
  {
    layer: "People", name: "Ashby", role: "Applicant tracking for serious hiring",
    price: "Paid, for funded teams", url: "https://www.ashbyhq.com/pricing",
    when: (t) => t.has("people") && t.has("funded"),
    reason: () => "When hiring becomes a constant, a proper ATS with analytics beats a manual board. Worth it once you are hiring several roles at once.",
  },
  {
    layer: "People", name: "Tally or Typeform", role: "Application and intake forms",
    price: "Tally free · Typeform from ~£30/mo", url: "https://tally.so/pricing",
    when: (t) => t.has("people"),
    reason: () => "A clean application form that people actually finish, feeding straight into your pipeline. Tally covers it free, Typeform is the paid option if you want its polish.",
  },
  {
    layer: "People", name: "Deel", role: "Payroll and contractor management",
    price: "Contractors from ~£35 each/mo; EOR from ~£445/employee/mo", url: "https://www.deel.com/pricing",
    when: (t, a) => t.has("people") && (a.team === "growing" || a.team === "established"),
    reason: () => "Paying people correctly and on time is not where you want to improvise. Deel is strong for UK and international contractors, and has grown into a fuller HR platform with a Core HRIS from ~£4/employee and hiring tools layered on, so it scales as your team does. Gusto is the US-focused alternative.",
    vsObvious: "Over Gusto for a UK or international team, because Gusto is US-focused while Deel handles cross-border hiring cleanly.",
  },
  {
    layer: "People", name: "Onboarding checklist template", role: "Repeatable, productive first week",
    price: "Free", url: "https://www.notion.com/templates",
    when: (t) => t.has("people") || t.has("systemise"),
    reason: () => "The cheapest retention tool there is. A new hire useful in week one stays. Write it once, reuse it every time.",
  },
];

function buildStack(answers) {
  const tags = new Set();
  QUESTIONS.forEach((q) => {
    const opt = q.options.find((o) => o.value === answers[q.id]);
    if (opt) opt.tags.forEach((t) => tags.add(t));
  });
  const has = (x) => tags.has(x);
  const wrapped = { has };
  const picked = CATALOGUE.filter((tool) => tool.when(wrapped, answers));
  return LAYER_ORDER.map((layer) => ({
    layer, tools: picked.filter((t) => t.layer === layer),
  })).filter((l) => l.tools.length > 0);
}

function headline(answers) {
  const map = {
    customers: "Your stack is built to find and keep customers. Everything else stays deliberately light so it does not pull focus from growth.",
    building: "Your stack is built for tight feedback loops and clear direction. The goal is learning fast and building the right thing, with minimal overhead.",
    busywork: "Your stack is built to hand the busywork to systems. Automate the repetitive handoffs first, and free the founder's hours back up.",
    cracks: "Your stack is built to stop things falling through the cracks. The fix is owners and repeatable processes, not more tools.",
    support: "Your stack is built to keep up with customers without a heavy help desk. Give every message an owner and nothing slips.",
    brand: "Your stack is built to look as credible as you are. A sharp brand and site do a surprising amount of selling before you say a word.",
    money: "Your stack is built for financial clarity and fundraising readiness. Clean numbers and organised investor work come first.",
    hiring: "Your stack is built to make hiring repeatable. A clear pipeline and a real onboarding process do most of the heavy lifting.",
  };
  return map[answers.problem] || "";
}

function buildPlainText(answers, stack) {
  const lines = [];
  lines.push("STARTUP OPS STACK");
  lines.push("Built with Sanyukta Indani's Startup Ops Stack tool");
  lines.push("");
  const ctx = QUESTIONS.map((q) => {
    const o = q.options.find((x) => x.value === answers[q.id]);
    return `${q.label}: ${o ? o.label : ""}`;
  }).join("  |  ");
  lines.push(ctx);
  lines.push("");
  lines.push(headline(answers));
  lines.push("");
  stack.forEach((group) => {
    lines.push(`— ${group.layer.toUpperCase()} —`);
    group.tools.forEach((tool) => {
      lines.push(`• ${tool.name} (${tool.price})`);
      lines.push(`  ${tool.role}`);
      lines.push(`  ${tool.reason(answers)}`);
      if (tool.vsObvious) lines.push(`  Why this: ${tool.vsObvious}`);
      lines.push(`  ${tool.url}`);
    });
    lines.push("");
  });
  lines.push(`Pricing indicative in GBP, verified ${PRICING_VERIFIED}. Always check each tool's own site.`);
  return lines.join("\n");
}

const STEP_KEYS = QUESTIONS.map((q) => q.id);

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

function useCountUp(target, run, reduced) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) { setV(0); return; }
    if (reduced) { setV(target); return; }
    let raf = 0;
    const t0 = performance.now();
    const dur = 900;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, reduced]);
  return v;
}

function IsoStack({ items, size = 200, gap = 20, tilt = true, reduced, showDim = false }) {
  const rigRef = useRef(null);
  function onMove(e) {
    if (!tilt || reduced || !rigRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    rigRef.current.style.transform = `rotateX(${57 + dy * -9}deg) rotateZ(${-45 + dx * 11}deg)`;
  }
  function onLeave() {
    if (rigRef.current) rigRef.current.style.transform = "rotateX(57deg) rotateZ(-45deg)";
  }
  const stackDepth = items.length * gap;
  return (
    <div onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 26, width: "100%" }}>
      <div className={reduced ? "" : "iso-float"} style={{
        width: size * 1.5, height: size * 0.95 + stackDepth + 50,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        perspective: 1400, paddingBottom: 20,
      }}>
        <div ref={rigRef} className="iso-rig" style={{
          width: size, height: size, transformStyle: "preserve-3d",
          transform: "rotateX(57deg) rotateZ(-45deg)", transition: "transform .45s ease",
          marginBottom: size * 0.18,
        }}>
          {items.map((name, i) => (
            <div key={name} className="iso-plate"
              style={{ "--z": `${i * gap}px`, animationDelay: reduced ? "0s" : `${0.1 + i * 0.09}s` }}>
              <span className="iso-tag">{name}</span>
            </div>
          ))}
        </div>
      </div>
      {showDim && (
        <div className="dim" aria-hidden style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="dim-line" style={{ height: Math.max(90, stackDepth + 40) }} />
          <span className="dim-label">{items.length} layers</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [reduced, setReduced] = useState(false);
  const [copied, setCopied] = useState(false);
  const spotRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById(FONT_LINK_ID)) {
      const l = document.createElement("link");
      l.id = FONT_LINK_ID;
      l.rel = "stylesheet";
      l.href =
        "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap";
      document.head.appendChild(l);
    }
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Cursor spotlight
  useEffect(() => {
    const el = spotRef.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e) => {
      const x = e.clientX, y = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => {
        el.style.background = `radial-gradient(560px circle at ${x}px ${y}px, rgba(253,54,110,0.05), transparent 65%)`;
        raf = 0;
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); if (raf) cancelAnimationFrame(raf); };
  }, []);

  const done = step >= QUESTIONS.length;

  // Keyboard: 1–9 selects an option, Backspace/Escape goes back
  useEffect(() => {
    function onKey(e) {
      if (step < 0 || done) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key >= "1" && e.key <= "9") {
        const idx = Number(e.key) - 1;
        const opts = QUESTIONS[step].options;
        if (idx < opts.length) choose(QUESTIONS[step].id, opts[idx].value);
      } else if ((e.key === "Backspace" || e.key === "Escape") && step > 0) {
        e.preventDefault();
        setStep((s) => s - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const stack = useMemo(() => (done ? buildStack(answers) : []), [done, answers]);
  const answeredLayers = useMemo(() => {
    const partial = {};
    STEP_KEYS.forEach((k, i) => { if (i <= step) partial[k] = answers[k]; });
    if (Object.keys(partial).length === 0) return [];
    return buildStack(partial);
  }, [answers, step]);
  const totalPicks = useMemo(() => stack.reduce((n, g) => n + g.tools.length, 0), [stack]);
  const shownPicks = useCountUp(totalPicks, done, reduced);

  function choose(qid, value) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
    setTimeout(() => setStep((s) => s + 1), reduced ? 0 : 180);
  }
  function restart() { setAnswers({}); setStep(-1); setCopied(false); }

  async function copyStack() {
    const text = buildPlainText(answers, stack);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch {}
      document.body.removeChild(ta);
    }
  }

  const C = {
    ink: "#0A0B0E", inkSoft: "#1E1F26", panel: "#131419", panelLine: "#26272E",
    pink: "#FD366E", onInk: "#F1F1F4", onInkMuted: "#8B8B95", bodyText: "#C9C9D1",
    muted: "#93939D",
  };
  const mono = "'JetBrains Mono', ui-monospace, monospace";
  const grotesk = "'Space Grotesk', sans-serif";

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(1000px 540px at 14% -8%, rgba(253,54,110,0.14), transparent 60%), radial-gradient(820px 480px at 90% 0%, rgba(91,157,255,0.07), transparent 55%), ${C.ink}`,
      color: C.onInk,
      fontFamily: "'Inter', system-ui, sans-serif", display: "flex",
      justifyContent: "center", padding: "clamp(16px, 4vw, 48px)", boxSizing: "border-box",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: ${C.pink}; color: #fff; }
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: ${C.ink}; }
        ::-webkit-scrollbar-thumb { background: #2A2B33; border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.pink}; }
        .os-btn:focus-visible { outline: 2px solid ${C.pink}; outline-offset: 3px; }
        a.os-link:focus-visible { outline: 2px solid ${C.pink}; outline-offset: 2px; }

        .bg-grid { position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 120% 90% at 50% 0%, black 25%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 120% 90% at 50% 0%, black 25%, transparent 80%);
        }
        .bg-spot { position: fixed; inset: 0; pointer-events: none; z-index: 0; }

        @keyframes riseIn { from { opacity: 0; transform: translateY(12px);} to {opacity:1; transform:none;} }
        @keyframes layerSlide { from { opacity: 0; transform: translateX(-8px);} to {opacity:1; transform:none;} }
        @keyframes wordUp { from { opacity: 0; transform: translateY(14px);} to {opacity:1; transform:none;} }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes pulseDot { 0%,100% { box-shadow: 0 0 0 0 rgba(253,54,110,.45);} 60% { box-shadow: 0 0 0 7px rgba(253,54,110,0);} }
        @keyframes isoFloat { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-10px);} }
        @keyframes plateIn { from { opacity: 0; transform: translateZ(calc(var(--z) + 130px)); } to { opacity: 1; transform: translateZ(var(--z)); } }
        @keyframes sheen { 0%, 55% { left: -60%; } 100% { left: 140%; } }

        .rise { animation: riseIn .5s cubic-bezier(.2,.7,.2,1) both; }
        .layer-in { animation: layerSlide .4s cubic-bezier(.2,.7,.2,1) both; }
        .reveal-word { display: inline-block; animation: wordUp .5s cubic-bezier(.2,.7,.2,1) backwards; }
        .blink { animation: blink 1.1s steps(2) infinite; }
        .iso-float { animation: isoFloat 7s ease-in-out infinite; }

        .iso-plate { position: absolute; inset: 0; border-radius: 18%;
          transform: translateZ(var(--z));
          background: linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.015));
          border: 1px solid rgba(255,255,255,.13);
          box-shadow: 0 24px 48px rgba(0,0,0,.45);
          animation: plateIn .8s cubic-bezier(.22,.9,.24,1.12) backwards;
          transition: transform .3s ease, border-color .3s ease, background .3s ease;
        }
        .iso-plate:hover { transform: translateZ(calc(var(--z) + 16px)); border-color: rgba(253,54,110,.65); background: linear-gradient(135deg, rgba(253,54,110,.12), rgba(255,255,255,.02)); }
        .iso-plate:last-child { border-color: rgba(253,54,110,.45); box-shadow: 0 24px 48px rgba(0,0,0,.45), 0 0 44px rgba(253,54,110,.14); }
        .iso-tag { position: absolute; top: 50%; left: 50%;
          transform: translate(-50%,-50%) rotateZ(45deg) rotateX(-57deg);
          font-family: ${mono}; font-size: 10px; font-weight: 500; letter-spacing: .16em;
          text-transform: uppercase; color: rgba(241,241,244,.9); white-space: nowrap;
          opacity: 0; transition: opacity .25s ease; pointer-events: none;
        }
        .iso-plate:hover .iso-tag { opacity: 1; }

        .dim-line { width: 1px; background: rgba(255,255,255,.22); position: relative; display: inline-block; }
        .dim-line::before, .dim-line::after { content: ""; position: absolute; left: -4px; width: 9px; height: 1px; background: rgba(255,255,255,.22); }
        .dim-line::before { top: 0; } .dim-line::after { bottom: 0; }
        .dim-label { writing-mode: vertical-rl; font-family: ${mono}; font-size: 10px; letter-spacing: .22em; text-transform: uppercase; color: ${C.onInkMuted}; }

        @media (prefers-reduced-motion: reduce){
          .rise,.layer-in,.reveal-word,.blink,.iso-float,.iso-plate,.os-btn-primary::after { animation: none !important; }
        }

        .opt { position: relative; transition: transform .16s ease, border-color .16s ease, background .16s ease; }
        .opt::before, .opt::after { content: ""; position: absolute; width: 15px; height: 15px; opacity: 0; transition: opacity .18s ease; pointer-events: none; }
        .opt::before { top: -1px; left: -1px; border-top: 2px solid ${C.pink}; border-left: 2px solid ${C.pink}; border-top-left-radius: 13px; }
        .opt::after { bottom: -1px; right: -1px; border-bottom: 2px solid ${C.pink}; border-right: 2px solid ${C.pink}; border-bottom-right-radius: 13px; }
        .opt:hover { border-color: rgba(253,54,110,.55) !important; transform: translateX(6px); background: rgba(253,54,110,0.05) !important; }
        .opt:hover::before, .opt:hover::after { opacity: 1; }
        .opt:hover .opt-arrow { transform: translateX(4px); color: ${C.pink}; }
        .opt-arrow { transition: transform .16s ease, color .16s ease; }
        .opt:hover .opt-num { color: ${C.pink}; }

        .tool-link { color: ${C.onInk}; text-decoration: none; border-bottom: 1px dotted ${C.muted}; }
        .tool-link:hover { color: ${C.pink}; border-bottom-color: ${C.pink}; }

        .os-btn-primary { position: relative; overflow: hidden; }
        .os-btn-primary:hover { filter: brightness(1.08); }
        .os-btn-primary::after { content: ""; position: absolute; top: 0; left: -60%; width: 45%; height: 100%;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,.35), transparent);
          transform: skewX(-18deg); animation: sheen 4s ease-in-out infinite; }

        .results-iso { display: block; }
        @media (max-width: 960px) { .results-iso { display: none; } }

        @media print {
          body { background: #fff !important; }
          .no-print, .bg-grid, .bg-spot { display: none !important; }
          .print-panel { break-inside: avoid; background: #fff !important; border-color: #ddd !important; }
          .print-panel * { color: #111 !important; border-color: #ccc !important; background: transparent !important; }
        }
      `}</style>

      <div aria-hidden className="bg-grid" />
      <div aria-hidden ref={spotRef} className="bg-spot" />

      <div style={{
        width: "100%", maxWidth: 1120, display: "flex", flexDirection: "column",
        minHeight: "calc(100vh - clamp(32px, 8vw, 96px))", position: "relative", zIndex: 1,
      }}>
        {/* ============ HEADER ============ */}
        <div style={{
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
          gap: 16, flexWrap: "wrap",
        }}>
          <div>
            <div style={{
              fontFamily: grotesk, fontWeight: 700,
              fontSize: "clamp(20px, 3vw, 26px)", letterSpacing: "-0.02em",
            }}>Startup Ops Stack</div>
            <div style={{ color: C.onInkMuted, fontSize: 13, marginTop: 4 }}>
              For early-stage founders
            </div>
          </div>
          <div style={{
            fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
            color: C.onInkMuted, border: `1px solid ${C.inkSoft}`, padding: "6px 10px", borderRadius: 999,
          }}>by Sanyukta Indani</div>
        </div>

        {/* ============ SYSTEM TICKER ============ */}
        <div className="no-print" style={{
          marginTop: 14, marginBottom: "clamp(18px, 3.5vw, 36px)",
          borderTop: `1px solid ${C.inkSoft}`, paddingTop: 10,
          fontFamily: mono, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase",
          color: C.onInkMuted, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
        }}>
          <span style={{ color: C.pink }}>●</span>
          <span>{CATALOGUE.length} tools</span>
          <span style={{ opacity: .4 }}>/</span>
          <span>{LAYER_ORDER.length} layers</span>
          <span style={{ opacity: .4 }}>/</span>
          <span>gbp</span>
          <span style={{ opacity: .4 }}>/</span>
          <span>pricing verified {PRICING_VERIFIED}</span>
          <span className="blink" style={{ color: C.pink }}>▍</span>
        </div>

        {/* ============ PROGRESS STATIONS ============ */}
        {step >= 0 && !done && (
          <div className="no-print" style={{ display: "flex", alignItems: "center", marginBottom: 34, maxWidth: 560 }}>
            {QUESTIONS.map((q, i) => (
              <div key={q.id} style={{ display: "flex", alignItems: "center", flex: i < QUESTIONS.length - 1 ? 1 : "none" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: mono, fontSize: 10, fontWeight: 700,
                  background: i < step ? C.pink : "transparent",
                  color: i < step ? "#fff" : i === step ? C.pink : C.onInkMuted,
                  border: `1px solid ${i <= step ? C.pink : C.inkSoft}`,
                  animation: i === step && !reduced ? "pulseDot 2s ease-out infinite" : "none",
                  transition: "background .3s ease, color .3s ease, border-color .3s ease",
                }}>{i + 1}</div>
                {i < QUESTIONS.length - 1 && (
                  <div style={{ flex: 1, height: 1, background: i < step ? C.pink : C.inkSoft, transition: "background .3s ease" }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ============ MAIN ============ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: done ? "1fr" : "minmax(0, 1.1fr) minmax(0, 0.9fr)",
          gap: "clamp(20px, 3vw, 44px)", alignItems: done ? "start" : "center",
        }}>
          <div>
            {/* ---------- LANDING ---------- */}
            {step === -1 && (
              <div className="rise">
                <div style={{
                  fontFamily: mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase",
                  color: C.pink, marginBottom: 18,
                }}>Answer 5 → assemble 1</div>
                <h1 style={{
                  fontFamily: grotesk, fontSize: "clamp(40px, 6.5vw, 74px)",
                  lineHeight: 1.02, letterSpacing: "-0.03em", margin: "0 0 22px", fontWeight: 700,
                }}>Five questions.<br />One tailored software <span style={{ color: C.pink }}>stack</span>.</h1>
                <p style={{
                  color: C.onInkMuted, fontSize: "clamp(15px, 2vw, 18px)", lineHeight: 1.6,
                  maxWidth: 560, margin: "0 0 30px",
                }}>
                  Built around your stage, your biggest bottleneck, and your budget.
                </p>
                <button className="os-btn os-btn-primary" onClick={() => setStep(0)} style={{
                  background: `linear-gradient(135deg, ${C.pink}, #FF6B9D)`, color: "#fff", border: "none", borderRadius: 999,
                  padding: "15px 28px", fontSize: 15, fontWeight: 600,
                  fontFamily: grotesk, cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(253,54,110,0.35)",
                }}>Build my stack →</button>
                <p style={{ color: C.onInkMuted, fontSize: 12.5, marginTop: 26, maxWidth: 520, lineHeight: 1.5 }}>
                  Every recommendation includes why it fits and when the free version is enough.
                </p>
              </div>
            )}

            {/* ---------- QUESTIONS ---------- */}
            {step >= 0 && !done && (
              <div className="rise" key={step}>
                <div style={{
                  fontFamily: mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase",
                  color: C.pink, fontWeight: 500, marginBottom: 14,
                }}>
                  Q{String(step + 1).padStart(2, "0")} — {QUESTIONS[step].label}
                </div>
                <h2 style={{
                  fontFamily: grotesk, fontSize: "clamp(26px, 3.6vw, 38px)",
                  lineHeight: 1.12, letterSpacing: "-0.02em", margin: "0 0 10px", fontWeight: 600,
                }}>{QUESTIONS[step].prompt}</h2>
                <p style={{ color: C.onInkMuted, fontSize: 14, lineHeight: 1.5, margin: "0 0 24px", maxWidth: 480 }}>
                  {QUESTIONS[step].help}
                </p>
                <div style={{ display: "grid", gap: 10 }}>
                  {QUESTIONS[step].options.map((o, oi) => {
                    const active = answers[QUESTIONS[step].id] === o.value;
                    return (
                      <button key={o.value} className="os-btn opt"
                        onClick={() => choose(QUESTIONS[step].id, o.value)}
                        style={{
                          textAlign: "left", background: active ? "rgba(253,54,110,0.08)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${active ? C.pink : C.inkSoft}`, borderRadius: 14,
                          padding: "15px 18px", color: C.onInk, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 16,
                        }}>
                        <span className="opt-num" style={{
                          fontFamily: mono, fontSize: 12, color: C.onInkMuted, flexShrink: 0,
                          width: 22, transition: "color .16s ease",
                        }}>{String(oi + 1).padStart(2, "0")}</span>
                        <span style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: 15.5 }}>{o.label}</span>
                          <span style={{ display: "block", color: C.onInkMuted, fontSize: 13, marginTop: 2 }}>{o.sub}</span>
                        </span>
                        <span className="opt-arrow" style={{ color: C.onInkMuted, fontSize: 18 }}>→</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{
                  marginTop: 20, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                }}>
                  {step > 0 && (
                    <button className="os-btn" onClick={() => setStep((s) => s - 1)} style={{
                      background: "none", border: "none", color: C.onInkMuted,
                      fontSize: 13, cursor: "pointer", padding: 0,
                    }}>← Back</button>
                  )}
                  <span style={{
                    fontFamily: mono, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                    color: "rgba(139,139,149,0.6)",
                  }}>Keys 1–{QUESTIONS[step].options.length} to choose{step > 0 ? " · backspace to go back" : ""}</span>
                </div>
              </div>
            )}

            {/* ---------- RESULTS ---------- */}
            {done && (
              <div className="rise">
                <div style={{ display: "flex", gap: 24, alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase",
                      color: C.pink, fontWeight: 500, marginBottom: 12,
                    }}>Configuration complete <span className="blink">▍</span></div>
                    <div style={{
                      fontFamily: mono, fontSize: 13, color: C.onInkMuted, marginBottom: 14,
                    }}>
                      <span style={{ color: C.onInk, fontWeight: 700, fontSize: 15 }}>{shownPicks}</span> tools
                      <span style={{ opacity: .4 }}> / </span>
                      <span style={{ color: C.onInk, fontWeight: 700, fontSize: 15 }}>{stack.length}</span> layers
                    </div>
                    <h2 style={{
                      fontFamily: grotesk, fontSize: "clamp(24px, 3.2vw, 34px)",
                      lineHeight: 1.18, letterSpacing: "-0.02em", margin: "0 0 18px", fontWeight: 600, maxWidth: 720,
                    }}>
                      {headline(answers).split(" ").map((w, i) => (
                        <span key={i} className="reveal-word" style={{ animationDelay: reduced ? "0s" : `${i * 0.03}s` }}>{w}&nbsp;</span>
                      ))}
                    </h2>
                  </div>
                  <div className="results-iso no-print" style={{ width: 220, flexShrink: 0 }}>
                    <IsoStack items={stack.map((g) => g.layer)} size={110} gap={13} reduced={reduced} />
                  </div>
                </div>

                <div className="no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
                  <button className="os-btn os-btn-primary" onClick={copyStack} style={{
                    background: copied ? "#3ECF8E" : `linear-gradient(135deg, ${C.pink}, #FF6B9D)`,
                    color: "#fff", border: "none", borderRadius: 999,
                    padding: "10px 20px", fontSize: 13.5, fontWeight: 600,
                    fontFamily: grotesk, cursor: "pointer", transition: "background .2s ease",
                    boxShadow: copied ? "none" : "0 6px 18px rgba(253,54,110,0.3)",
                  }}>{copied ? "Copied ✓" : "Copy stack"}</button>
                  <button className="os-btn" onClick={() => window.print()} style={{
                    background: "rgba(255,255,255,0.03)", color: C.onInk, border: `1px solid ${C.inkSoft}`, borderRadius: 999,
                    padding: "10px 20px", fontSize: 13.5, fontWeight: 600,
                    fontFamily: grotesk, cursor: "pointer",
                  }}>Save as PDF</button>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 30 }}>
                  {QUESTIONS.map((q) => {
                    const opt = q.options.find((o) => o.value === answers[q.id]);
                    return (
                      <span key={q.id} style={{
                        fontSize: 12, color: C.onInkMuted, border: `1px solid ${C.inkSoft}`,
                        borderRadius: 999, padding: "5px 12px",
                      }}>
                        <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>{q.label}</span>
                        {" "}<span style={{ color: C.onInk }}>{opt?.label}</span>
                      </span>
                    );
                  })}
                </div>

                <div style={{ display: "grid", gap: 16 }}>
                  {stack.map((group, gi) => (
                    <div key={group.layer} className="layer-in print-panel" style={{
                      animationDelay: reduced ? "0s" : `${gi * 0.05}s`, background: C.panel,
                      borderRadius: 20, padding: "20px 22px", border: `1px solid ${C.panelLine}`,
                      display: "grid", gridTemplateColumns: "minmax(52px, 64px) 1fr", gap: 18,
                    }}>
                      <div aria-hidden style={{
                        fontFamily: mono, fontWeight: 700, fontSize: "clamp(30px, 4vw, 44px)",
                        color: "rgba(255,255,255,0.08)", lineHeight: 1, paddingTop: 2, userSelect: "none",
                      }}>{String(gi + 1).padStart(2, "0")}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                          <span style={{
                            fontFamily: grotesk, fontWeight: 600,
                            fontSize: 16, letterSpacing: "-0.01em",
                          }}>{group.layer}</span>
                          <span style={{ fontFamily: mono, color: C.muted, fontSize: 11, letterSpacing: "0.08em" }}>
                            {group.tools.length} {group.tools.length === 1 ? "pick" : "picks"}
                          </span>
                        </div>
                        <div style={{ display: "grid", gap: 0 }}>
                          {group.tools.map((tool, ti) => (
                            <div key={tool.name} style={{
                              padding: "14px 0",
                              borderTop: ti > 0 ? `1px solid ${C.panelLine}` : "none",
                            }}>
                              <div style={{
                                display: "flex", justifyContent: "space-between",
                                alignItems: "baseline", gap: 12, flexWrap: "wrap",
                              }}>
                                <a className="os-link tool-link" href={tool.url} target="_blank" rel="noopener noreferrer"
                                  style={{ fontWeight: 600, fontSize: 15.5 }}>{tool.name}</a>
                                <span style={{ fontFamily: mono, color: C.muted, fontSize: 11.5 }}>{tool.price}</span>
                              </div>
                              <div style={{ color: C.muted, fontSize: 12.5, fontWeight: 500, marginTop: 3 }}>{tool.role}</div>
                              <div style={{ color: C.bodyText, fontSize: 13.5, lineHeight: 1.55, marginTop: 7 }}>
                                {tool.reason(answers)}
                              </div>
                              {tool.vsObvious && (
                                <div style={{
                                  color: C.muted, fontSize: 12.5, lineHeight: 1.5, marginTop: 6, fontStyle: "italic",
                                }}>Why this: {tool.vsObvious}</div>
                              )}
                              {tool.tip && (
                                <div style={{
                                  marginTop: 9, fontSize: 12.5, lineHeight: 1.5, color: C.bodyText,
                                  borderLeft: `2px solid ${C.pink}`, paddingLeft: 12,
                                }}><span style={{ fontWeight: 600, color: C.onInk }}>Tip · </span>{tool.tip}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="no-print" style={{ marginTop: 26, display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <button className="os-btn os-btn-primary" onClick={restart} style={{
                    background: `linear-gradient(135deg, ${C.pink}, #FF6B9D)`, color: "#fff", border: "none", borderRadius: 999,
                    padding: "12px 22px", fontSize: 14, fontWeight: 600,
                    fontFamily: grotesk, cursor: "pointer",
                    boxShadow: "0 8px 20px rgba(253,54,110,0.3)",
                  }}>Start over</button>
                  <div style={{
                    color: C.onInkMuted, fontSize: 13, alignSelf: "center", maxWidth: 460, lineHeight: 1.5,
                  }}>
                    Rule of thumb: stand up the top two layers first, get them working, then add
                    the rest. A stack you actually maintain beats a perfect one you abandon.
                  </div>
                </div>

                <div style={{
                  marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.inkSoft}`,
                  color: C.onInkMuted, fontSize: 12, lineHeight: 1.5,
                }}>
                  Pricing is indicative, shown in GBP as approximate tiers, verified {PRICING_VERIFIED}. SaaS pricing changes often,
                  so treat these as a guide and confirm current numbers on each tool's own site (every tool name links to its pricing page).
                </div>
              </div>
            )}
          </div>

          {/* ---------- RIGHT PANEL ---------- */}
          {!done && (
            <div className="no-print">
              {step === -1 ? (
                <div>
                  <IsoStack items={LAYER_ORDER} size={190} gap={19} reduced={reduced} showDim />
                  <div style={{
                    textAlign: "center", marginTop: 6,
                    fontFamily: mono, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase",
                    color: C.onInkMuted,
                  }}>The {LAYER_ORDER.length} layers — hover to explore</div>
                </div>
              ) : (
                <div style={{
                  position: "sticky", top: 24, background: "rgba(255,255,255,0.02)", borderRadius: 20,
                  padding: 20, border: `1px solid ${C.inkSoft}`, minHeight: 320,
                }}>
                  <div style={{
                    fontFamily: mono, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase",
                    color: C.onInkMuted, marginBottom: 8,
                  }}>Your stack, assembling</div>
                  {answeredLayers.length === 0 ? (
                    <div style={{
                      color: C.onInkMuted, fontSize: 13.5, lineHeight: 1.6, padding: "40px 4px", textAlign: "center",
                    }}>
                      As you answer, the recommended layers stack up here. The more specific your problem, the sharper the picks.
                    </div>
                  ) : (
                    <>
                      <IsoStack items={answeredLayers.map((g) => g.layer)} size={120} gap={13} reduced={reduced} tilt={false} />
                      <div style={{ display: "grid", gap: 6, marginTop: 4 }}>
                        {answeredLayers.map((group, i) => (
                          <div key={group.layer} className="layer-in" style={{
                            animationDelay: reduced ? "0s" : `${i * 0.04}s`,
                            display: "flex", alignItems: "baseline", gap: 10,
                            padding: "8px 10px", borderRadius: 8,
                            background: "rgba(255,255,255,0.025)",
                          }}>
                            <span style={{ fontFamily: mono, fontSize: 10, color: C.onInkMuted, flexShrink: 0 }}>
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 13 }}>{group.layer}</span>
                            <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10.5, color: C.onInkMuted, flexShrink: 0 }}>
                              {group.tools.length} {group.tools.length === 1 ? "pick" : "picks"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        </div>

        {/* ============ FOOTER (landing only) ============ */}
        {step === -1 && (
          <div className="no-print" style={{
            marginTop: 32, paddingTop: 22, borderTop: `1px solid ${C.inkSoft}`,
            display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 20, flexWrap: "wrap",
          }}>
            <div style={{ color: C.onInkMuted, fontSize: 12.5, lineHeight: 1.6, maxWidth: 640 }}>
              Shaped by working alongside founders at two early stage startups, where the
              right lightweight system usually beat the expensive one nobody kept up.
            </div>
            <div style={{
              fontFamily: mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "rgba(139,139,149,0.55)", flexShrink: 0,
            }}>UK-first picks · no affiliations</div>
          </div>
        )}
      </div>
    </div>
  );
}
