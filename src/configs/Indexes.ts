const indexes = [
  { label: "Publications", name: process.env.INDEX_PUBLICATION || "" },
  { label: "People", name: process.env.INDEX_PERSON || "" },
  { label: "Journals", name: process.env.INDEX_JOURNAL || "" },
  { label: "Organizations", name: process.env.INDEX_ORGUNIT || "" },
  { label: "Patents", name: process.env.INDEX_PATENT || "" },
  { label: "Programs", name: process.env.INDEX_PROGRAM || "" },
  { label: "Research groups", name: process.env.INDEX_GROUP || "" },
  { label: "Software", name: process.env.INDEX_SOFTWARE || "" },
  { label: "Course", name: process.env.INDEX_COURSE || "" },
];

export default indexes;
