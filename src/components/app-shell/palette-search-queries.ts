import { graphql } from '@/lib/graphql/__generated__';

export const PALETTE_LIBRARY_SEARCH_DOC = graphql(`
  query PaletteLibrarySearch($q: String!) {
    mangas(
      condition: { inLibrary: true }
      filter: { title: { likeInsensitive: $q } }
      first: 8
      orderBy: TITLE
      orderByType: ASC
    ) {
      nodes {
        id
        title
      }
    }
  }
`);
