import { graphql } from '@/lib/graphql/__generated__';

export const DOWNLOAD_STATUS_DOC = graphql(`
  query DownloadStatus {
    downloadStatus {
      state
      queue {
        position
        progress
        state
        tries
        chapter {
          id
          name
          chapterNumber
          mangaId
        }
        manga {
          id
          title
        }
      }
    }
  }
`);

export const DOWNLOAD_CHANGED_SUBSCRIPTION = graphql(`
  subscription DownloadChanged {
    downloadChanged {
      state
      queue {
        position
        progress
        state
        tries
        chapter {
          id
          name
          chapterNumber
          mangaId
        }
        manga {
          id
          title
        }
      }
    }
  }
`);

export const ENQUEUE_CHAPTER_DOC = graphql(`
  mutation EnqueueChapterDownload($id: Int!) {
    enqueueChapterDownload(input: { id: $id }) {
      downloadStatus {
        state
        queue {
          chapter { id }
          progress
          state
          position
        }
      }
    }
  }
`);

export const ENQUEUE_CHAPTERS_DOC = graphql(`
  mutation EnqueueChapterDownloads($ids: [Int!]!) {
    enqueueChapterDownloads(input: { ids: $ids }) {
      downloadStatus {
        state
        queue {
          chapter { id }
          progress
          state
          position
        }
      }
    }
  }
`);

export const DEQUEUE_CHAPTER_DOC = graphql(`
  mutation DequeueChapterDownload($id: Int!) {
    dequeueChapterDownload(input: { id: $id }) {
      downloadStatus {
        state
        queue {
          chapter { id }
          progress
          state
          position
        }
      }
    }
  }
`);

export const DELETE_DOWNLOADED_CHAPTER_DOC = graphql(`
  mutation DeleteDownloadedChapter($id: Int!) {
    deleteDownloadedChapter(input: { id: $id }) {
      chapters {
        id
        isDownloaded
      }
    }
  }
`);

export const DELETE_DOWNLOADED_CHAPTERS_DOC = graphql(`
  mutation DeleteDownloadedChapters($ids: [Int!]!) {
    deleteDownloadedChapters(input: { ids: $ids }) {
      chapters {
        id
        isDownloaded
      }
    }
  }
`);

export const REORDER_DOWNLOAD_DOC = graphql(`
  mutation ReorderChapterDownload($chapterId: Int!, $to: Int!) {
    reorderChapterDownload(input: { chapterId: $chapterId, to: $to }) {
      downloadStatus {
        state
        queue {
          chapter { id }
          progress
          state
          position
        }
      }
    }
  }
`);

export const START_DOWNLOADER_DOC = graphql(`
  mutation StartDownloader {
    startDownloader(input: {}) {
      downloadStatus {
        state
      }
    }
  }
`);

export const STOP_DOWNLOADER_DOC = graphql(`
  mutation StopDownloader {
    stopDownloader(input: {}) {
      downloadStatus {
        state
      }
    }
  }
`);

export const CLEAR_DOWNLOADER_DOC = graphql(`
  mutation ClearDownloader {
    clearDownloader(input: {}) {
      downloadStatus {
        state
        queue {
          chapter { id }
          progress
          state
          position
        }
      }
    }
  }
`);
