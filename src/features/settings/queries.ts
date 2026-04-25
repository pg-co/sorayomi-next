import { graphql } from '@/lib/graphql/__generated__';

export const SETTINGS_DOC = graphql(`
  query AppSettings {
    settings {
      extensionRepos
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
