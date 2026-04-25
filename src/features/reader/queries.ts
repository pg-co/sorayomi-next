import { graphql } from '@/lib/graphql/__generated__';

export const READER_CHAPTER_DOC = graphql(`
  query ReaderChapter($id: Int!) {
    chapter(id: $id) {
      id
      mangaId
      name
      chapterNumber
      sourceOrder
      isRead
      isBookmarked
      lastPageRead
      pageCount
      scanlator
    }
  }
`);

export const READER_CHAPTER_LIST_DOC = graphql(`
  query ReaderChapterList($mangaId: Int!) {
    chapters(
      condition: { mangaId: $mangaId }
      orderBy: SOURCE_ORDER
      orderByType: ASC
    ) {
      nodes {
        id
        sourceOrder
        chapterNumber
        name
      }
    }
  }
`);

export const READER_MANGA_DOC = graphql(`
  query ReaderManga($id: Int!) {
    manga(id: $id) {
      id
      title
      meta {
        key
        value
      }
    }
  }
`);

export const FETCH_CHAPTER_PAGES_DOC = graphql(`
  mutation FetchChapterPages($chapterId: Int!) {
    fetchChapterPages(input: { chapterId: $chapterId }) {
      pages
      chapter {
        id
        pageCount
      }
    }
  }
`);

export const UPDATE_CHAPTER_DOC = graphql(`
  mutation ReaderUpdateChapter(
    $id: Int!
    $isRead: Boolean
    $isBookmarked: Boolean
    $lastPageRead: Int
  ) {
    updateChapter(
      input: {
        id: $id
        patch: { isRead: $isRead, isBookmarked: $isBookmarked, lastPageRead: $lastPageRead }
      }
    ) {
      chapter {
        id
        isRead
        isBookmarked
        lastPageRead
      }
    }
  }
`);

export const SET_MANGA_META_DOC = graphql(`
  mutation ReaderSetMangaMeta($mangaId: Int!, $key: String!, $value: String!) {
    setMangaMeta(input: { meta: { mangaId: $mangaId, key: $key, value: $value } }) {
      meta {
        mangaId
        key
        value
      }
    }
  }
`);
