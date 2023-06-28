# Required

- tighter integration between data-eden integration and signal cache
  - should just be one cache at the top layer
- be able to run on the server and the client
  - allow configuration so that we can accomodate cases where server and client modes are set
    - an example is on the server we could update a cache that we can seralize to the client to use when we rehydrate.
- we still want an entity and document store for normalizing data so that share entities are updated (e.g urn:li:user1234) should be the same signal instead of just a large json blog tied to a signal document (entity based cache allow you to have relational data)
- try and design athena to be more extensible (look at urql for exchanges to see middleware based extensions) - cache and ssr mode are just exchanges it will come in handy when we need to deal with different use cases. Being able to author an exchange rather than change core functionality everytime.
  - the signal cache is basically a middleware but because there is no standard API to make it such
- having a better answer for keys (getCacheKey right now is too rigid) - just wholesale using the function provided is not good enough for cases like what if there is no cacheKey we will have to resolve our own synthetic key
  - types should passed down to avoid having to type narrow in the callback
    ```
    cacheExchange({
        keys: {
            Item: data => data.uuid,
        },
    });
    ```
- we need an answer for local resolvers, we tried to avoid having it, but it is not realistic long term.
  - this is not the same as executing fragments
  - we don't have to support @client only fields right away

## Ideas

- process entities is currently a runtime concern, we could parse the entities at codegen time and have that be inlined that we pass to client as compiled code. (could be something that you could turn on as a part of codegen, by default the processEntities function would just be an unoptimized version of this)
- better debug tooling for seeing the life cycle of a certain entity (could be a middleware?)
- being able to see what request change the field and have a histogram of all the data the field used to have
- relay like build abilities request stitching from external process back to the host
  - server rendered requests should be serialized as a document
  - be able to pull queries out and make the calls in an external process and serialize that back to the host and use at initial data form the client
    '/graphql/someserializedstring': 'document body from request'
- support @client only fields in local resolver
