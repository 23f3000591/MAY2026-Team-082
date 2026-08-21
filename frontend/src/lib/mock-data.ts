export const mentors = [
  {
    id: "maya-chen",
    name: "Maya Chen",
    role: "Photography & Storytelling",
    experience: "8 years",
    rating: 4.9,
    reviews: 218,
    location: "Brooklyn, NY",
    price: "$42/session",
    bio: "I guide creators through portfolio strategy, visual storytelling, and on-camera confidence.",
    skills: [
      { name: "Photography", level: "Expert", years: 8, description: "Composition, lighting, and editorial direction for brand storytelling." },
      { name: "Content Strategy", level: "Advanced", years: 6, description: "Planning narrative workflows that convert audiences into advocates." },
    ],
    availability: [
      { day: "Wednesday", start: "4:00 PM", end: "6:00 PM", label: "4:00 PM - 6:00 PM" },
      { day: "Friday", start: "10:00 AM", end: "12:00 PM", label: "10:00 AM - 12:00 PM" },
    ],
  },
  {
    id: "jordan-alvarez",
    name: "Jordan Alvarez",
    role: "AI Product Design",
    experience: "6 years",
    rating: 4.8,
    reviews: 184,
    location: "Austin, TX",
    price: "$56/session",
    bio: "I support teams building AI-first products with user research, prototyping, and ethical execution.",
    skills: [
      { name: "AI", level: "Expert", years: 6, description: "Mentoring AI strategy, model selection, and feature design." },
      { name: "Product Design", level: "Advanced", years: 6, description: "End-to-end product workflows for discovery, design, and launch." },
    ],
    availability: [
      { day: "Monday", start: "2:00 PM", end: "4:00 PM", label: "2:00 PM - 4:00 PM" },
      { day: "Thursday", start: "5:00 PM", end: "7:00 PM", label: "5:00 PM - 7:00 PM" },
    ],
  },
  {
    id: "sofia-patel",
    name: "Sofia Patel",
    role: "Public Speaking",
    experience: "10 years",
    rating: 5.0,
    reviews: 312,
    location: "Chicago, IL",
    price: "$39/session",
    bio: "I coach leaders and performers to speak with clarity, credibility, and presence in any room.",
    skills: [
      { name: "Communication", level: "Expert", years: 10, description: "Confidence coaching, announcement delivery, and pitch preparation." },
      { name: "Leadership", level: "Advanced", years: 9, description: "Story-led leadership presence for team alignment and influence." },
    ],
    availability: [
      { day: "Tuesday", start: "9:00 AM", end: "11:00 AM", label: "9:00 AM - 11:00 AM" },
      { day: "Saturday", start: "1:00 PM", end: "3:00 PM", label: "1:00 PM - 3:00 PM" },
    ],
  },
];

export const upcomingSessions = [
  { title: "AI for creators", time: "Today · 7:00 PM", mentor: "Jordan Alvarez" },
  { title: "Visual storytelling lab", time: "Tomorrow · 6:30 PM", mentor: "Maya Chen" },
  { title: "Confidence in public speaking", time: "Wed · 8:00 PM", mentor: "Sofia Patel" },
];

export const communities = [
  { name: "Creative Exchange", members: 1800, focus: "Photography, Design, Film" },
  { name: "AI Builders Circle", members: 920, focus: "Prompting, Product, Automation" },
  { name: "Confident Voices", members: 640, focus: "Public speaking, Storytelling" },
];
