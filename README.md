# data-eden

Data-Eden is a collection of reactive web application libraries designed to make it easy to build fast, responsive web applications that scale to meet the demands of modern users. The libraries are built on top of popular technologies like GraphQL and React, and they provide powerful abstractions for managing data, caching, and reactivity.

## Libraries

Here are some of the key libraries included in the Data-Eden collection:

`@data-eden/athena`: This is a minimal GraphQL client with a caching layer and reactivity support, focused exclusively on pre-registered queries. By providing a smaller and simpler API surface area, it enables a smaller bundle size, not just for the library, but also for your application's queries. In addition, since all queries are known at build time, it enables static analysis of your application's data usage. This library provides a powerful way to manage data in a reactive way, ensuring that all changes to the data are automatically synchronized across your application.

`@data-eden/cache`: A caching library that provides a flexible, configurable cache for your data. This library is designed to work seamlessly with other Data-Eden libraries, but it can also be used as a standalone library.

`@data-eden/network`: A fetch replacement that is request and response aware and supports middlewares for observing or altering requests or responses, either alone or in combination. Additionally, it adds middleware support without eager body consumption, making it compatible with streaming as long as your middlewares are written to be streaming-aware.

`@data-eden/ember`: #write-me

`@data-eden/react`: #write-me

## Conclusion

If you're looking for a powerful, flexible way to build web applications, the Data-Eden collection is a great place to start. With its powerful abstractions for managing data, caching, and reactivity, Data-Eden makes it easy to build fast, responsive web applications that can scale to meet the demands of modern users.
