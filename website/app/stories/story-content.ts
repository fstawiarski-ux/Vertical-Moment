export type StoryFormat = "climbing" | "product" | "events";
export type StoryChapter = { id: string; title: string; mediaLabel: string; imageSrc: string; imageAlt: string; pill: string; note: string; direction: string };
export type StoryContent = {
  format: StoryFormat; label: string; titleLead: string; titleAccent: string; eyebrow: string; dek: string;
  statusLabel: string; statusTitle: string; statusNote: string; stageLabel: string; stageTitle: string; stageNote: string;
  detailEyebrow: string; detailTitle: string; detailNote: string; selectedFrames: number[];
  checklistTitle: string; checklist: string[]; coverImage: string; chapters: StoryChapter[];
};
const gallery = "/photography/gallery/";
// These already-published portfolio photographs are temporary samples. Replace the
// imageSrc and coverImage values when the final photo sets are ready.
export const storyContent: Record<StoryFormat, StoryContent> = {
  climbing: {
    format: "climbing", label: "Climbing", titleLead: "The ", titleAccent: "Ascent",
    eyebrow: "CLIMBING STORY / FORMAT PREVIEW",
    dek: "A climb told through approach, movement and the moments between. The final climb, location and sequence will be added with the selected photographs.",
    statusLabel: "CLIMBING STORY", statusTitle: "Story details to follow",
    statusNote: "This page shows the format. The climb and final image sequence are still being curated.",
    stageLabel: "CLIMBING / APPROACH AND MOVEMENT", stageTitle: "Keep the climb in view.",
    stageNote: "One photograph stays with you while the story moves through its chapters. On a phone, each frame follows its chapter.",
    detailEyebrow: "STORY FRAMES / IN SEQUENCE", detailTitle: "Let the stills hold.",
    detailNote: "The photo sequence and captions will be replaced after the final climb and images are selected.",
    selectedFrames: [0, 2, 3], checklistTitle: "One climb, told with care.",
    checklist: ["Choose the climb and confirm the sequence", "Select final stills and supporting footage", "Confirm location details and image permissions"],
    coverImage: gallery + "vm-6890-peilstein-main-face.webp",
    chapters: [
      { id: "approach", title: "Approach", mediaLabel: "Sample frame / the wall", imageSrc: gallery + "vm-6890-peilstein-main-face.webp", imageAlt: "Climber on a limestone wall at Peilstein.", pill: "Place", note: "The route starts before the first move.", direction: "Open with a frame that gives the wall and climber room to sit together." },
      { id: "read", title: "Read", mediaLabel: "Sample frame / reading the rock", imageSrc: gallery + "vm-6683-green-corner.webp", imageAlt: "Helenental limestone wall.", pill: "Read", note: "A line takes shape before the movement begins.", direction: "Let the first close frame hold long enough for the viewer to read the rock." },
      { id: "move", title: "Move", mediaLabel: "Sample frame / movement", imageSrc: gallery + "vm-6913-traverse-morning-light.webp", imageAlt: "Climber traversing in morning light.", pill: "Move", note: "A route is written between the holds.", direction: "Use the strongest approved action frame as the visual anchor for this chapter." },
      { id: "after", title: "After the move", mediaLabel: "Sample frame / the finish", imageSrc: gallery + "vm-6965-topping-out.webp", imageAlt: "Climber topping out on limestone.", pill: "Finish", note: "End with the moment that stays after the effort.", direction: "Close on the image that gives the chosen climb its ending." },
    ],
  },
  product: {
    format: "product", label: "Product", titleLead: "The ", titleAccent: "Kit",
    eyebrow: "PRODUCT STORY / FORMAT PREVIEW",
    dek: "A quiet product story moving from first impression to detail and use. The product, its facts and final photographs will be added after they are confirmed.",
    statusLabel: "PRODUCT STORY", statusTitle: "Product details to follow",
    statusNote: "This page shows the format; product identity and specifications have not been added.",
    stageLabel: "PRODUCT / FORM AND USE", stageTitle: "Keep the object in view.",
    stageNote: "One photograph stays in place while the story moves from form to handling and use.",
    detailEyebrow: "STORY FRAMES / FORM AND DETAIL", detailTitle: "Small choices, in focus.",
    detailNote: "Product-specific photographs and verified details will replace these sample frames later.",
    selectedFrames: [0, 2, 3], checklistTitle: "Let the real product lead.",
    checklist: ["Confirm the object and intended audience", "Verify descriptions and specifications", "Select product photographs and confirm permissions"],
    coverImage: gallery + "vm-6768-gear-on-the-ledge.webp",
    chapters: [
      { id: "first-look", title: "First look", mediaLabel: "Sample frame / first impression", imageSrc: gallery + "vm-6768-gear-on-the-ledge.webp", imageAlt: "Climbing gear resting on limestone beside a small wildflower.", pill: "Form", note: "Give the object a moment before the details.", direction: "Introduce the selected product without leading with unverified claims." },
      { id: "shape", title: "Shape", mediaLabel: "Sample frame / form", imageSrc: gallery + "vm-6683-green-corner.webp", imageAlt: "Helenental limestone wall.", pill: "Form", note: "Let shape and material make a first impression.", direction: "A considered composition gives the product a clear, uncluttered introduction." },
      { id: "detail", title: "The detail", mediaLabel: "Sample frame / detail", imageSrc: gallery + "vm-6913-traverse-morning-light.webp", imageAlt: "Climber traversing in morning light.", pill: "Detail", note: "Small choices can be worth a closer look.", direction: "A close frame can show one verified detail at a time." },
      { id: "use", title: "In use", mediaLabel: "Sample frame / use", imageSrc: gallery + "vm-6965-topping-out.webp", imageAlt: "Climber topping out on limestone.", pill: "Use", note: "End where the object meets an ordinary day outside.", direction: "Show the product in context without making performance claims." },
    ],
  },
  events: {
    format: "events", label: "Events", titleLead: "The ", titleAccent: "Session",
    eyebrow: "EVENT STORY / FORMAT PREVIEW",
    dek: "A compact story for a day outdoors: place, preparation, shared effort and the view at the end. Event details and final images will be added when confirmed.",
    statusLabel: "EVENT STORY", statusTitle: "Event details to follow",
    statusNote: "This page shows the format. It does not state a date, venue or participant details.",
    stageLabel: "EVENT / PLACE AND PEOPLE", stageTitle: "Let the day set the rhythm.",
    stageNote: "One photograph stays in view while the story moves through arrival, preparation and a moment worth remembering.",
    detailEyebrow: "STORY FRAMES / PLACE AND PEOPLE", detailTitle: "A day has its own rhythm.",
    detailNote: "Event-specific images, captions and details will replace these sample frames after curation.",
    selectedFrames: [0, 2, 3], checklistTitle: "Build around the real gathering.",
    checklist: ["Confirm the event brief, date and venue", "Choose story moments and final photographs", "Confirm participant and location permissions"],
    coverImage: gallery + "vm-6913-traverse-morning-light.webp",
    chapters: [
      { id: "place", title: "Place", mediaLabel: "Sample frame / place", imageSrc: gallery + "vm-6890-peilstein-main-face.webp", imageAlt: "Climber on a limestone wall at Peilstein.", pill: "Place", note: "Start with a sense of where the day unfolds.", direction: "A wide frame can introduce the setting before the gathering begins." },
      { id: "arrival", title: "Arrival", mediaLabel: "Sample frame / arrival", imageSrc: gallery + "vm-6683-green-corner.webp", imageAlt: "Helenental limestone wall.", pill: "Arrival", note: "Let the first moments establish the pace.", direction: "The final story can begin with a genuine arrival or preparation moment." },
      { id: "moment", title: "The moment", mediaLabel: "Sample frame / action", imageSrc: gallery + "vm-6913-traverse-morning-light.webp", imageAlt: "Climber traversing in morning light.", pill: "Moment", note: "Give the central moment room to land.", direction: "The strongest approved frame will anchor the event story here." },
      { id: "after", title: "After", mediaLabel: "Sample frame / closing", imageSrc: gallery + "vm-6965-topping-out.webp", imageAlt: "Climber topping out on limestone.", pill: "After", note: "End with what remains when the day settles.", direction: "A closing frame can bring people and place together once the event is confirmed." },
    ],
  },
};

