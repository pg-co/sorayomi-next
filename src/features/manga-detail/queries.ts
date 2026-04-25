import { graphql } from '@/lib/graphql/__generated__';

export const MANGA_DETAIL_DOC = graphql(`
  query MangaDetail($id: Int!) {
    manga(id: $id) {
      id
      title
      author
      artist
      description
      genre
      status
      thumbnailUrl
      inLibrary
      unreadCount
      downloadCount
      sourceId
      source {
        id
        displayName
        lang
      }
      chapters {
        totalCount
      }
      categories {
        nodes {
          id
        }
      }
    }
  }
`);

export const MANGA_CHAPTERS_DOC = graphql(`
  query MangaChapters($mangaId: Int!) {
    chapters(
      condition: { mangaId: $mangaId }
      orderBy: SOURCE_ORDER
      orderByType: DESC
    ) {
      totalCount
      nodes {
        id
        name
        chapterNumber
        scanlator
        uploadDate
        sourceOrder
        isRead
        isDownloaded
        isBookmarked
        lastPageRead
        pageCount
        mangaId
      }
    }
  }
`);

export const UPDATE_MANGA_LIBRARY_DOC = graphql(`
  mutation UpdateMangaLibrary($id: Int!, $inLibrary: Boolean!) {
    updateManga(input: { id: $id, patch: { inLibrary: $inLibrary } }) {
      manga {
        id
        inLibrary
      }
    }
  }
`);

export const UPDATE_MANGA_CATEGORIES_DOC = graphql(`
  mutation UpdateMangaCategories(
    $id: Int!
    $addToCategories: [Int!]
    $removeFromCategories: [Int!]
  ) {
    updateMangaCategories(
      input: {
        id: $id
        patch: { addToCategories: $addToCategories, removeFromCategories: $removeFromCategories }
      }
    ) {
      manga {
        id
        categories {
          nodes {
            id
          }
        }
      }
    }
  }
`);
