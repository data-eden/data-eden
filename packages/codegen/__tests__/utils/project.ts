import { Project } from 'fixturify-project';
import * as path from 'node:path';
import { URL } from 'node:url';
import { rimraf } from 'rimraf';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

interface DirJSON {
  [filename: string]: DirJSON | string | null;
}

export async function createFixtures(filesMap: DirJSON): Promise<Project> {
  const projectPath = path.join(__dirname, '..', '__graphql-project');
  await rimraf(projectPath);

  const project = new Project();
  project.baseDir = projectPath;
  delete project.files['index.js'];
  delete project.files['package.json'];
  project.mergeFiles(filesMap);

  await project.write();

  return project;
}

export const graphqlFilesMap = {
  'schema.graphql': `scalar Date

schema {
  query: Query
}

type Query {
  me: User!
  user(id: ID!): User
  allUsers: [User]
  search(term: String!): [SearchResult!]!
  myChats: [Chat!]!
}

enum Role {
  USER
  ADMIN
}

interface Node {
  id: ID!
}

union SearchResult = User | Chat | ChatMessage

type User implements Node {
  id: ID!
  chats: [Chat]!
  username: String!
  email: String!
  role: Role!
}

type Chat implements Node {
  id: ID!
  users: [User!]!
  messages: [ChatMessage!]!
}

type ChatMessage implements Node {
  id: ID!
  content: String!
  time: Date!
  user: User!
}
`,
  fragments: {
    'chat-fields-fragment.graphql': `# import UserFields from "./user-fragment.graphql"

  fragment ChatFields on Chat {
    id
    users {
      ...UserFields
    }
    messages {
      id
      content
      user {
        id
        username
      }
    }
  }
  `,
    'user-fragment.graphql': `fragment UserFields on User {
  id
  username
  role
}
`,
  },
  queries: {
    'find-user.graphql': `# import UserFields from "../fragments/user-fragment.graphql"

query findUser($userId: ID!) {
  user(id: $userId) {
    ...UserFields
  }
}
`,
    'my-chats.graphql': `# import ChatFields from "../fragments/chat-fields-fragment.graphql"

query chats($userId: ID!) {
  myChats {
    ...ChatFields
  }
}
`,
  },
  mutations: {},
};

export const gqlFilesMap = {
  'schema.graphql': graphqlFilesMap['schema.graphql'],
  'User.tsx': `import { gql } from '@data-eden/codegen/gql';

  const userFieldsFragment = gql\`fragment UserFields on User {
    id
    username
    role
  }
  \`;

  const findUserQuery = gql\`query findUser($userId: ID!) {
    user(id: $userId) {
      \${userFieldsFragment}
    }
  }
  \`
`,
};

export const gqlFilesMapWithSharedFragments = {
  'schema.graphql': graphqlFilesMap['schema.graphql'],
  'UserView.tsx': `
    import { gql } from '@data-eden/codegen/gql';

    export const userFieldsFragment = gql\`fragment UserFields on User {
      id
      username
      email
      role
    }\`
  `,
  'User.tsx': `
    import { gql } from '@data-eden/codegen/gql';
    import { userFieldsFragment } from './UserView.tsx';

    const findUserQuery = gql\`query findUser($userId: ID!) {
      user(id: $userId) {
        \${userFieldsFragment}
      }
    }\`\
  `,
};

export const gqlFilesMapWithSharedFragmentsTransitive = {
  'schema.graphql': graphqlFilesMap['schema.graphql'],
  'MessageView.tsx': `
    import { gql } from '@data-eden/codegen/gql';

    export const messageFieldsFragment = gql\`fragment MessageFields on ChatMessage {
      id
      content
      time
    }\`
  `,
  'ChatView.tsx': `
    import { gql } from '@data-eden/codegen/gql';

    import { messageFieldsFragment } from './MessageView.tsx';

    export const chatFieldsFragment = gql\`fragment ChatFields on Chat {
      id
      users {
        id
        username
      }
      messages {
        \${messageFieldsFragment}
      }
    }\`
  `,
  'UserView.tsx': `
    import { gql } from '@data-eden/codegen/gql';

    import { chatFieldsFragment } from './ChatView.tsx';

    export const userFieldsFragment = gql\`fragment UserFields on User {
      id
      username
      role
      chats {
        \${chatFieldsFragment}
      }
    }\`
  `,
  'User.tsx': `
    import { gql } from '@data-eden/codegen/gql';
    import { userFieldsFragment } from './UserView.tsx';

    const findUserQuery = gql\`query findUser($userId: ID!) {
      user(id: $userId) {
        \${userFieldsFragment}
      }
    }\`
  `,
};

export const gqlFilesIgnoreMap = {
  'schema.graphql': graphqlFilesMap['schema.graphql'],
  'ignore.tsx': `import { gql } from '@something/else';

  const userFieldsFragment = gql\`fragment UserFields on User {
    id
    username
    role
  }
  \`;

  const findUserQuery = gql\`query findUser($userId: ID!) {
    user(id: $userId) {
      \${userFieldsFragment}
    }
  }
  \`
`,
};

export const gqlFilesMapWithReExportedFragments = {
  'schema.graphql': graphqlFilesMap['schema.graphql'],
  'ChatView.tsx': `
    import { gql } from '@data-eden/codegen/gql';

    export const chatFieldsFragment = gql\`fragment ChatFields on Chat {
      id
      users {
        id
        username
      }
    }\`
  `,
  'UserView.tsx': `
    export { chatFieldsFragment } from './ChatView.tsx';
  `,
  'User.tsx': `
    import { gql } from '@data-eden/codegen/gql';
    import { chatFieldsFragment } from './UserView.tsx';

    const findUserQuery = gql\`query findUser($userId: ID!) {
      user(id: $userId) {
        chats {
          \${chatFieldsFragment}
        }
      }
    }\`
  `,
};

export const gqlFilesMapWithSharedFragmentsUsedAndExported = {
  'schema.graphql': graphqlFilesMap['schema.graphql'],
  'ChatView.tsx': `
    import { gql } from '@data-eden/codegen/gql';

    export const chatFieldsFragment = gql\`fragment ChatFields on Chat {
      id
      users {
        id
        username
      }
    }\`

    export const findMyChatsQuery = gql\`query findMyChats {
      myChats {
        \${chatFieldsFragment}
      }
    }\`
  `,
  'User.tsx': `
    import { gql } from '@data-eden/codegen/gql';
    import { chatFieldsFragment } from './ChatView.tsx';

    const findUserQuery = gql\`query findUser($userId: ID!) {
      user(id: $userId) {
        chats {
          \${chatFieldsFragment}
        }
      }
    }\`
  `,
};

export const gqlFilesMapWithAliasedPaths = {
  'schema.graphql': graphqlFilesMap['schema.graphql'],
  'UserView.tsx': `
    import { gql } from '@data-eden/codegen/gql';

    export const userFieldsFragment = gql\`fragment UserFields on User {
      id
      username
      email
      role
    }\`
  `,
  'User.tsx': `
    import { gql } from '@data-eden/codegen/gql';
    import { userFieldsFragment } from '@components/UserView.tsx';

    const findUserQuery = gql\`query findUser($userId: ID!) {
      user(id: $userId) {
        \${userFieldsFragment}
      }
    }\`\
  `,
};
