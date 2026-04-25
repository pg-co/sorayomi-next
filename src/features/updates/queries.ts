import { graphql } from '@/lib/graphql/__generated__';

export const RECENT_CHAPTERS_DOC = graphql(`
  query RecentChapters($first: Int!) {
    chapters(
      filter: { inLibrary: { equalTo: true } }
      orderBy: FETCHED_AT
      orderByType: DESC
      first: $first
    ) {
      totalCount
      nodes {
        id
        mangaId
        name
        chapterNumber
        scanlator
        fetchedAt
        isRead
        isDownloaded
        manga {
          id
          title
        }
      }
    }
  }
`);

export const UPDATE_STATUS_DOC = graphql(`
  query UpdateStatusSnapshot {
    updateStatus {
      isRunning
      completeJobs {
        mangas {
          totalCount
        }
      }
      failedJobs {
        mangas {
          totalCount
        }
      }
      pendingJobs {
        mangas {
          totalCount
        }
      }
      runningJobs {
        mangas {
          totalCount
          nodes {
            id
            title
          }
        }
      }
      skippedJobs {
        mangas {
          totalCount
        }
      }
    }
  }
`);

export const UPDATE_STATUS_CHANGED_SUB = graphql(`
  subscription UpdateStatusChanged {
    updateStatusChanged {
      isRunning
      completeJobs {
        mangas {
          totalCount
        }
      }
      failedJobs {
        mangas {
          totalCount
        }
      }
      pendingJobs {
        mangas {
          totalCount
        }
      }
      runningJobs {
        mangas {
          totalCount
          nodes {
            id
            title
          }
        }
      }
      skippedJobs {
        mangas {
          totalCount
        }
      }
    }
  }
`);

export const UPDATE_LIBRARY_DOC = graphql(`
  mutation UpdateLibraryMangaTrigger {
    updateLibraryManga(input: {}) {
      updateStatus {
        isRunning
      }
    }
  }
`);

export const UPDATE_STOP_DOC = graphql(`
  mutation UpdateLibraryStop {
    updateStop(input: {}) {
      clientMutationId
    }
  }
`);
