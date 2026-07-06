import { useState, useMemo, useEffect } from "react";

// ---------------------------------------------------------------------------
// Startup Ops Stack — recommends an operations stack for early stage startups,
// tuned to the founder's real problem and budget. 50 tools across 9 layers.
// Shaped by working alongside founders at two early stage startups.
// Pricing verified July 2026, shown in GBP as approximate tiers.
// ---------------------------------------------------------------------------

const FONT_LINK_ID = "ops-stack-fonts";
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

// ---------------------------------------------------------------------------
// Catalogue: 50 tools across 9 layers. Prices are approximate GBP tiers,
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
      : "Fast coordination without another meeting. Free tier is generous, but it starts to strain once teams grow past ~20 people.",
    vsObvious: "Over WhatsApp for work, because search and channels mean context does not vanish up the scroll.",
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
    price: "Free for 2 users · paid from ~£18/user", url: "https://www.hubspot.com/pricing/crm",
    when: (t) => t.has("gtm"),
    reason: () => "Once you have more than a handful of prospects, memory stops scaling and deals go cold in the gaps. Free tier covers early stage fully.",
    vsObvious: "Over a spreadsheet, because it reminds you to follow up. A sheet never nudges you.",
  },
  {
    layer: "Growth", name: "Attio", role: "Modern, flexible CRM",
    price: "Free for 3 users · paid from ~£29/user", url: "https://attio.com/pricing",
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
    price: "Free tier · full seat from ~£18/mo", url: "https://www.figma.com/pricing",
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
    when: (t, a) => t.has("design") || t.has("gtm") || t.has("finance"),
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
    when: (t, a) => t.has("design") || t.has("gtm"),
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
    price: "Free tier · paid from ~£70/mo", url: "https://canny.io/pricing",
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
    when: (t, a) => t.has("ops") || t.has("busywork") || t.has("gtm") || t.has("people"),
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
    price: "Free tier · paid from ~£5/user", url: "https://miro.com/pricing",
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
    price: "Free trial · paid from ~£25/seat", url: "https://front.com/pricing",
    when: (t, a) => t.has("support") || (t.has("gtm") && a.stage === "launched"),
    reason: () => "Early support is a shared email address descending into chaos: replies missed, two people answering the same thing. A shared inbox gives every message an owner without a heavy help desk.",
    vsObvious: "Over forwarding support@ to a personal inbox, because that quietly drops customers and nobody knows who replied.",
  },
  {
    layer: "Customer Support", name: "Plain", role: "Lightweight, fast customer support",
    price: "No free tier · paid from ~£25/seat", url: "https://www.plain.com/pricing",
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
    when: (t, a) => t.has("people") && t.has("funded"),
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
  const LAYER_ORDER = [
    "Foundation", "Communication", "Growth", "Design",
    "Product", "Operations", "Customer Support", "Finance", "People",
  ];
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

export default function App() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [reduced, setReduced] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!document.getElementById(FONT_LINK_ID)) {
      const l = document.createElement("link");
      l.id = FONT_LINK_ID;
      l.rel = "stylesheet";
      l.href =
        "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap";
      document.head.appendChild(l);
    }
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const done = step >= QUESTIONS.length;
  const stack = useMemo(() => (done ? buildStack(answers) : []), [done, answers]);
  const answeredLayers = useMemo(() => {
    const partial = {};
    STEP_KEYS.forEach((k, i) => { if (i <= step) partial[k] = answers[k]; });
    if (Object.keys(partial).length === 0) return [];
    return buildStack(partial);
  }, [answers, step]);
  const totalPicks = useMemo(() => stack.reduce((n, g) => n + g.tools.length, 0), [stack]);

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
    ink: "#0A0A0D", inkSoft: "#1C1C22", panel: "#141417", panelLine: "#26262C",
    amber: "#FD366E", sage: "#3ECF8E", text: "#F1F1F4", muted: "#93939D",
    onInk: "#F1F1F4", onInkMuted: "#8B8B95", bodyText: "#C9C9D1",
  };
  const layerColor = (layer) => ({
    Foundation: C.sage, Communication: "#5B9DFF", Growth: C.amber, Design: "#FF9F5B",
    Product: "#B98CFF", Operations: "#42D6D0", "Customer Support": "#FFD166",
    Finance: "#A3E635", People: "#FF6FA5",
  }[layer] || C.amber);

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(1100px 600px at 12% -10%, rgba(253,54,110,0.20), transparent 60%), radial-gradient(900px 520px at 92% 4%, rgba(91,157,255,0.14), transparent 55%), ${C.ink}`,
      color: C.onInk,
      fontFamily: "'Inter', system-ui, sans-serif", display: "flex",
      justifyContent: "center", padding: "clamp(16px, 4vw, 48px)", boxSizing: "border-box",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        .os-btn:focus-visible { outline: 2px solid ${C.amber}; outline-offset: 3px; }
        a.os-link:focus-visible { outline: 2px solid ${C.amber}; outline-offset: 2px; }
        @keyframes riseIn { from { opacity: 0; transform: translateY(10px);} to {opacity:1; transform:none;} }
        @keyframes layerSlide { from { opacity: 0; transform: translateX(-8px);} to {opacity:1; transform:none;} }
        .rise { animation: riseIn .45s cubic-bezier(.2,.7,.2,1) both; }
        .layer-in { animation: layerSlide .4s cubic-bezier(.2,.7,.2,1) both; }
        @media (prefers-reduced-motion: reduce){ .rise,.layer-in{animation:none;} }
        .opt:hover { border-color: ${C.amber} !important; transform: translateY(-2px); background: rgba(253,54,110,0.06) !important; }
        .opt { transition: transform .15s ease, border-color .15s ease, background .15s ease; }
        .tool-link { color: ${C.muted}; text-decoration: none; border-bottom: 1px dotted ${C.muted}; }
        .tool-link:hover { color: ${C.amber}; border-bottom-color: ${C.amber}; }
        .os-btn-primary:hover { filter: brightness(1.08); }
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-panel { break-inside: avoid; }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 1120 }}>
        <div style={{
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
          gap: 16, flexWrap: "wrap", marginBottom: "clamp(20px, 4vw, 40px)",
        }}>
          <div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
              fontSize: "clamp(20px, 3vw, 26px)", letterSpacing: "-0.02em",
            }}>Startup Ops Stack</div>
            <div style={{ color: C.onInkMuted, fontSize: 13, marginTop: 4 }}>
              For early stage founders. Five questions, then a lean stack built around your real problem and your budget.
            </div>
          </div>
          <div style={{
            fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
            color: C.onInkMuted, border: `1px solid ${C.inkSoft}`, padding: "6px 10px", borderRadius: 999,
          }}>by Sanyukta Indani</div>
        </div>

        {step >= 0 && !done && (
          <div className="no-print" style={{ display: "flex", gap: 6, marginBottom: 28 }}>
            {QUESTIONS.map((q, i) => (
              <div key={q.id} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= step ? C.amber : C.inkSoft, transition: "background .3s ease",
              }} />
            ))}
          </div>
        )}

        <div style={{
          display: "grid",
          gridTemplateColumns: done ? "1fr" : "minmax(0, 1.15fr) minmax(0, 0.85fr)",
          gap: "clamp(20px, 3vw, 40px)", alignItems: "start",
        }}>
          <div>
            {step === -1 && (
              <div className="rise">
                <h1 style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(30px, 5vw, 52px)",
                  lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 20px", fontWeight: 700,
                }}>Build the stack for where you are,<br />not where you might be.</h1>
                <p style={{
                  color: C.onInkMuted, fontSize: "clamp(15px, 2vw, 18px)", lineHeight: 1.6,
                  maxWidth: 560, margin: "0 0 28px",
                }}>
                  Tell it your stage, your team, and the one thing actually slowing you down.
                  It recommends a lean stack built around that problem, sized to your budget,
                  with the reasoning for every pick and where the free option is good enough.
                </p>
                <button className="os-btn os-btn-primary" onClick={() => setStep(0)} style={{
                  background: `linear-gradient(135deg, ${C.amber}, #FF6B9D)`, color: "#fff", border: "none", borderRadius: 999,
                  padding: "14px 26px", fontSize: 15, fontWeight: 600,
                  fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(253,54,110,0.35)",
                }}>Build my stack →</button>
                <p style={{ color: C.onInkMuted, fontSize: 12.5, marginTop: 24, maxWidth: 520, lineHeight: 1.5 }}>
                  Shaped by working alongside founders at two early stage startups, where the
                  right lightweight system usually beat the expensive one nobody kept up.
                </p>
              </div>
            )}

            {step >= 0 && !done && (
              <div className="rise" key={step}>
                <div style={{
                  fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase",
                  color: C.amber, fontWeight: 600, marginBottom: 14,
                }}>
                  {String(step + 1).padStart(2, "0")} / {String(QUESTIONS.length).padStart(2, "0")} · {QUESTIONS[step].label}
                </div>
                <h2 style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(24px, 3.4vw, 34px)",
                  lineHeight: 1.15, letterSpacing: "-0.02em", margin: "0 0 10px", fontWeight: 600,
                }}>{QUESTIONS[step].prompt}</h2>
                <p style={{ color: C.onInkMuted, fontSize: 14, lineHeight: 1.5, margin: "0 0 24px", maxWidth: 480 }}>
                  {QUESTIONS[step].help}
                </p>
                <div style={{ display: "grid", gap: 10 }}>
                  {QUESTIONS[step].options.map((o) => {
                    const active = answers[QUESTIONS[step].id] === o.value;
                    return (
                      <button key={o.value} className="os-btn opt"
                        onClick={() => choose(QUESTIONS[step].id, o.value)}
                        style={{
                          textAlign: "left", background: active ? "rgba(253,54,110,0.08)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${active ? C.amber : C.inkSoft}`, borderRadius: 14,
                          padding: "16px 18px", color: C.onInk, cursor: "pointer",
                          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                        }}>
                        <span>
                          <span style={{ fontWeight: 600, fontSize: 15.5 }}>{o.label}</span>
                          <span style={{ display: "block", color: C.onInkMuted, fontSize: 13, marginTop: 2 }}>{o.sub}</span>
                        </span>
                        <span style={{ color: C.onInkMuted, fontSize: 18 }}>→</span>
                      </button>
                    );
                  })}
                </div>
                {step > 0 && (
                  <button className="os-btn" onClick={() => setStep((s) => s - 1)} style={{
                    marginTop: 20, background: "none", border: "none", color: C.onInkMuted,
                    fontSize: 13, cursor: "pointer", padding: 0,
                  }}>← Back</button>
                )}
              </div>
            )}

            {done && (
              <div className="rise">
                <div style={{
                  fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase",
                  color: C.amber, fontWeight: 600, marginBottom: 12,
                }}>Your recommended stack · {totalPicks} tools across {stack.length} layers</div>
                <h2 style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(22px, 3vw, 30px)",
                  lineHeight: 1.2, letterSpacing: "-0.02em", margin: "0 0 14px", fontWeight: 600, maxWidth: 720,
                }}>{headline(answers)}</h2>

                <div className="no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
                  <button className="os-btn os-btn-primary" onClick={copyStack} style={{
                    background: copied ? C.sage : `linear-gradient(135deg, ${C.amber}, #FF6B9D)`,
                    color: "#fff", border: "none", borderRadius: 999,
                    padding: "10px 20px", fontSize: 13.5, fontWeight: 600,
                    fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer", transition: "background .2s ease",
                    boxShadow: copied ? "none" : "0 6px 18px rgba(253,54,110,0.3)",
                  }}>{copied ? "Copied ✓" : "Copy stack"}</button>
                  <button className="os-btn" onClick={() => window.print()} style={{
                    background: "rgba(255,255,255,0.03)", color: C.onInk, border: `1px solid ${C.inkSoft}`, borderRadius: 999,
                    padding: "10px 20px", fontSize: 13.5, fontWeight: 600,
                    fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer",
                  }}>Save as PDF</button>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
                  {QUESTIONS.map((q) => {
                    const opt = q.options.find((o) => o.value === answers[q.id]);
                    return (
                      <span key={q.id} style={{
                        fontSize: 12, color: C.onInkMuted, border: `1px solid ${C.inkSoft}`,
                        borderRadius: 999, padding: "5px 11px",
                      }}>{q.label}: <span style={{ color: C.onInk }}>{opt?.label}</span></span>
                    );
                  })}
                </div>

                <div style={{ display: "grid", gap: 14 }}>
                  {stack.map((group, gi) => (
                    <div key={group.layer} className="layer-in print-panel" style={{
                      animationDelay: reduced ? "0s" : `${gi * 0.05}s`, background: C.panel,
                      color: C.text, borderRadius: 20, padding: "18px 20px", border: `1px solid ${C.panelLine}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: 7, background: `${layerColor(group.layer)}26`,
                          border: `1px solid ${layerColor(group.layer)}55`, display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: layerColor(group.layer) }} />
                        </span>
                        <span style={{
                          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                          fontSize: 15, letterSpacing: "-0.01em",
                        }}>{group.layer}</span>
                        <span style={{ color: C.muted, fontSize: 12 }}>
                          {group.tools.length} {group.tools.length === 1 ? "pick" : "picks"}
                        </span>
                      </div>
                      <div style={{ display: "grid", gap: 12 }}>
                        {group.tools.map((tool) => (
                          <div key={tool.name} style={{
                            padding: "14px 16px", borderRadius: 14,
                            background: `${layerColor(group.layer)}0D`,
                            borderLeft: `3px solid ${layerColor(group.layer)}55`,
                          }}>
                            <div style={{
                              display: "flex", justifyContent: "space-between",
                              alignItems: "baseline", gap: 12, flexWrap: "wrap",
                            }}>
                              <a className="os-link tool-link" href={tool.url} target="_blank" rel="noopener noreferrer"
                                style={{ fontWeight: 600, fontSize: 16 }}>{tool.name}</a>
                              <span style={{ color: C.muted, fontSize: 12.5 }}>{tool.price}</span>
                            </div>
                            <div style={{ color: C.muted, fontSize: 13, fontWeight: 500, marginTop: 2 }}>{tool.role}</div>
                            <div style={{ color: C.bodyText, fontSize: 13.5, lineHeight: 1.5, marginTop: 6 }}>
                              {tool.reason(answers)}
                            </div>
                            {tool.vsObvious && (
                              <div style={{
                                color: C.muted, fontSize: 12.5, lineHeight: 1.5, marginTop: 6, fontStyle: "italic",
                              }}>Why this: {tool.vsObvious}</div>
                            )}
                            {tool.tip && (
                              <div style={{
                                marginTop: 8, fontSize: 12.5, lineHeight: 1.45, color: C.bodyText,
                                background: `${layerColor(group.layer)}1A`, borderRadius: 8, padding: "8px 10px",
                              }}><span style={{ fontWeight: 600 }}>Tip · </span>{tool.tip}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="no-print" style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button className="os-btn os-btn-primary" onClick={restart} style={{
                    background: `linear-gradient(135deg, ${C.amber}, #FF6B9D)`, color: "#fff", border: "none", borderRadius: 999,
                    padding: "12px 22px", fontSize: 14, fontWeight: 600,
                    fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer",
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
                  marginTop: 22, paddingTop: 16, borderTop: `1px solid ${C.inkSoft}`,
                  color: C.onInkMuted, fontSize: 12, lineHeight: 1.5,
                }}>
                  Pricing is indicative, shown in GBP as approximate tiers, verified {PRICING_VERIFIED}. SaaS pricing changes often,
                  so treat these as a guide and confirm current numbers on each tool's own site (every tool name links to its pricing page).
                </div>
              </div>
            )}
          </div>

          {!done && (
            <div className="no-print" style={{
              position: "sticky", top: 24, background: "rgba(255,255,255,0.02)", borderRadius: 20,
              padding: 20, border: `1px solid ${C.inkSoft}`, minHeight: 320,
            }}>
              <div style={{
                fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
                color: C.onInkMuted, marginBottom: 16,
              }}>Your stack, assembling</div>
              {answeredLayers.length === 0 && (
                <div style={{
                  color: C.onInkMuted, fontSize: 13.5, lineHeight: 1.6, padding: "40px 4px", textAlign: "center",
                }}>
                  As you answer, the recommended layers stack up here. The more specific your problem, the sharper the picks.
                </div>
              )}
              <div style={{ display: "grid", gap: 8 }}>
                {answeredLayers.map((group, i) => (
                  <div key={group.layer} className="layer-in" style={{
                    animationDelay: reduced ? "0s" : `${i * 0.05}s`, background: "rgba(255,255,255,0.03)",
                    borderRadius: 10, padding: "12px 14px", borderLeft: `3px solid ${layerColor(group.layer)}`,
                  }}>
                    <div style={{
                      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13.5, marginBottom: 6,
                    }}>{group.layer}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {group.tools.map((t) => (
                        <span key={t.name} style={{
                          fontSize: 12, color: C.onInkMuted, background: "rgba(255,255,255,0.04)",
                          borderRadius: 6, padding: "3px 8px",
                        }}>{t.name}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
