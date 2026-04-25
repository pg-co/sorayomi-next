import { graphql } from '@/lib/graphql/__generated__';

export const SETTINGS_DOC = graphql(`
  query AppSettings {
    settings {
      extensionRepos
      flareSolverrEnabled
      flareSolverrSessionName
      flareSolverrSessionTtl
      flareSolverrTimeout
      flareSolverrUrl
    }
  }
`);

export const SET_EXTENSION_REPOS_DOC = graphql(`
  mutation SetExtensionRepos($extensionRepos: [String!]!) {
    setSettings(input: { settings: { extensionRepos: $extensionRepos } }) {
      settings {
        extensionRepos
      }
    }
  }
`);

export const SET_FLARESOLVERR_DOC = graphql(`
  mutation SetFlareSolverr(
    $flareSolverrEnabled: Boolean
    $flareSolverrSessionName: String
    $flareSolverrSessionTtl: Int
    $flareSolverrTimeout: Int
    $flareSolverrUrl: String
  ) {
    setSettings(
      input: {
        settings: {
          flareSolverrEnabled: $flareSolverrEnabled
          flareSolverrSessionName: $flareSolverrSessionName
          flareSolverrSessionTtl: $flareSolverrSessionTtl
          flareSolverrTimeout: $flareSolverrTimeout
          flareSolverrUrl: $flareSolverrUrl
        }
      }
    ) {
      settings {
        flareSolverrEnabled
        flareSolverrSessionName
        flareSolverrSessionTtl
        flareSolverrTimeout
        flareSolverrUrl
      }
    }
  }
`);
