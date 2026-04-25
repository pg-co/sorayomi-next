import { graphql } from '@/lib/graphql/__generated__';

export const CATEGORIES_DOC = graphql(`
  query LibraryCategories {
    categories(orderBy: ORDER, orderByType: ASC) {
      totalCount
      nodes {
        id
        name
        order
        default
      }
    }
  }
`);

export const CATEGORY_MANGAS_DOC = graphql(`
  query CategoryMangas($id: Int!) {
    category(id: $id) {
      id
      name
      mangas {
        totalCount
        nodes {
          id
          title
          thumbnailUrl
          inLibrary
          unreadCount
          downloadCount
          sourceId
        }
      }
    }
  }
`);
