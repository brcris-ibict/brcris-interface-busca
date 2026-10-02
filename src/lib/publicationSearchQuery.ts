export function isPublicationIndex(index: string | undefined): boolean {
  return Boolean(index && index === process.env.INDEX_PUBLICATION);
}
