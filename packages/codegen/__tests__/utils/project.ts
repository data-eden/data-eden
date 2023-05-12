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
  'user.tsx': `import { graphql } from '@data-eden/athena';

  const userFieldsFragment = graphql\`fragment UserFields on User {
    id
    username
    role
  }
  \`;

  const findUserQuery = graphql\`query findUser($userId: ID!) {
    user(id: $userId) {
      \${userFieldsFragment}
    }
  }
  \`
`,
};