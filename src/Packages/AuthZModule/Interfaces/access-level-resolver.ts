export type AccessLevelResolver<Context, Resource> = (context: Context, resource: Resource) => boolean;
