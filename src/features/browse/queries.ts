import { graphql } from '@/lib/graphql/__generated__';

export const SOURCES_DOC = graphql(`
  query Sources {
    sources(orderBy: NAME, orderByType: ASC) {
      totalCount
      nodes {
        id
        name
        displayName
        lang
        iconUrl
        isNsfw
        supportsLatest
      }
    }
  }
`);

export const SOURCE_DETAIL_DOC = graphql(`
  query SourceDetail($id: LongString!) {
    source(id: $id) {
      id
      name
      displayName
      lang
      iconUrl
      isNsfw
      supportsLatest
    }
  }
`);

export const EXTENSIONS_DOC = graphql(`
  query Extensions {
    extensions(orderBy: NAME, orderByType: ASC) {
      totalCount
      nodes {
        apkName
        pkgName
        name
        lang
        iconUrl
        versionName
        versionCode
        isInstalled
        isObsolete
        isNsfw
        hasUpdate
        repo
      }
    }
  }
`);

export const FETCH_EXTENSIONS_DOC = graphql(`
  mutation FetchExtensions {
    fetchExtensions(input: {}) {
      extensions {
        pkgName
        isInstalled
        hasUpdate
      }
    }
  }
`);

export const UPDATE_EXTENSION_DOC = graphql(`
  mutation UpdateExtension(
    $id: String!
    $install: Boolean
    $uninstall: Boolean
    $update: Boolean
  ) {
    updateExtension(
      input: { id: $id, patch: { install: $install, uninstall: $uninstall, update: $update } }
    ) {
      extension {
        pkgName
        isInstalled
        hasUpdate
      }
    }
  }
`);

export const FETCH_SOURCE_MANGA_DOC = graphql(`
  mutation FetchSourceManga(
    $source: LongString!
    $type: FetchSourceMangaType!
    $page: Int!
    $query: String
  ) {
    fetchSourceManga(input: { source: $source, type: $type, page: $page, query: $query }) {
      hasNextPage
      mangas {
        id
        title
        thumbnailUrl
        inLibrary
        unreadCount
        downloadCount
      }
    }
  }
`);
