import { graphql } from '@/lib/graphql/__generated__';

export const HISTORY_DOC = graphql(`
  query History {
    chapters(
      filter: { lastReadAt: { greaterThan: "0" } }
      orderBy: LAST_READ_AT
      orderByType: DESC
      first: 200
    ) {
      nodes {
        id
        name
        chapterNumber
        lastReadAt
        lastPageRead
        pageCount
        mangaId
        manga {
          id
          title
        }
      }
    }
  }
`);
