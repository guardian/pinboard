import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  AWSJSON: string;
  AWSTimestamp: any;
};



export type Item = {
  __typename?: 'Item';
  id: Scalars['ID'];
  message?: Maybe<Scalars['String']>;
  payload?: Maybe<Scalars['AWSJSON']>;
  timestamp: Scalars['AWSTimestamp'];
  type: Scalars['String'];
  user: Scalars['AWSJSON'];
};

export type ItemConnection = {
  __typename?: 'ItemConnection';
  items?: Maybe<Array<Maybe<Item>>>;
  nextToken?: Maybe<Scalars['String']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createItem?: Maybe<Item>;
  deleteItem?: Maybe<Item>;
  updateItem?: Maybe<Item>;
};


export type MutationCreateItemArgs = {
  input: CreateItemInput;
};


export type MutationDeleteItemArgs = {
  input: DeleteItemInput;
};


export type MutationUpdateItemArgs = {
  input: UpdateItemInput;
};

export type Query = {
  __typename?: 'Query';
  getItem?: Maybe<Item>;
  listItems?: Maybe<ItemConnection>;
};


export type QueryGetItemArgs = {
  id: Scalars['ID'];
};


export type QueryListItemsArgs = {
  filter?: Maybe<TableItemFilterInput>;
  limit?: Maybe<Scalars['Int']>;
  nextToken?: Maybe<Scalars['String']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  onCreateItem?: Maybe<Item>;
  onDeleteItem?: Maybe<Item>;
  onUpdateItem?: Maybe<Item>;
};


export type SubscriptionOnCreateItemArgs = {
  id?: Maybe<Scalars['ID']>;
  message?: Maybe<Scalars['String']>;
  payload?: Maybe<Scalars['AWSJSON']>;
  timestamp?: Maybe<Scalars['AWSTimestamp']>;
  type?: Maybe<Scalars['String']>;
};


export type SubscriptionOnDeleteItemArgs = {
  id?: Maybe<Scalars['ID']>;
  message?: Maybe<Scalars['String']>;
  payload?: Maybe<Scalars['AWSJSON']>;
  timestamp?: Maybe<Scalars['AWSTimestamp']>;
  type?: Maybe<Scalars['String']>;
};


export type SubscriptionOnUpdateItemArgs = {
  id?: Maybe<Scalars['ID']>;
  message?: Maybe<Scalars['String']>;
  payload?: Maybe<Scalars['AWSJSON']>;
  timestamp?: Maybe<Scalars['AWSTimestamp']>;
  type?: Maybe<Scalars['String']>;
};

export type CreateItemInput = {
  message?: Maybe<Scalars['String']>;
  payload?: Maybe<Scalars['AWSJSON']>;
  timestamp: Scalars['AWSTimestamp'];
  type: Scalars['String'];
  user: Scalars['AWSJSON'];
};

export type DeleteItemInput = {
  id: Scalars['ID'];
};

export type TableBooleanFilterInput = {
  eq?: Maybe<Scalars['Boolean']>;
  ne?: Maybe<Scalars['Boolean']>;
};

export type TableFloatFilterInput = {
  between?: Maybe<Array<Maybe<Scalars['Float']>>>;
  contains?: Maybe<Scalars['Float']>;
  eq?: Maybe<Scalars['Float']>;
  ge?: Maybe<Scalars['Float']>;
  gt?: Maybe<Scalars['Float']>;
  le?: Maybe<Scalars['Float']>;
  lt?: Maybe<Scalars['Float']>;
  ne?: Maybe<Scalars['Float']>;
  notContains?: Maybe<Scalars['Float']>;
};

export type TableIdFilterInput = {
  beginsWith?: Maybe<Scalars['ID']>;
  between?: Maybe<Array<Maybe<Scalars['ID']>>>;
  contains?: Maybe<Scalars['ID']>;
  eq?: Maybe<Scalars['ID']>;
  ge?: Maybe<Scalars['ID']>;
  gt?: Maybe<Scalars['ID']>;
  le?: Maybe<Scalars['ID']>;
  lt?: Maybe<Scalars['ID']>;
  ne?: Maybe<Scalars['ID']>;
  notContains?: Maybe<Scalars['ID']>;
};

export type TableIntFilterInput = {
  between?: Maybe<Array<Maybe<Scalars['Int']>>>;
  contains?: Maybe<Scalars['Int']>;
  eq?: Maybe<Scalars['Int']>;
  ge?: Maybe<Scalars['Int']>;
  gt?: Maybe<Scalars['Int']>;
  le?: Maybe<Scalars['Int']>;
  lt?: Maybe<Scalars['Int']>;
  ne?: Maybe<Scalars['Int']>;
  notContains?: Maybe<Scalars['Int']>;
};

export type TableItemFilterInput = {
  id?: Maybe<TableIdFilterInput>;
  message?: Maybe<TableStringFilterInput>;
  timestamp?: Maybe<TableIntFilterInput>;
  type?: Maybe<TableStringFilterInput>;
};

export type TableStringFilterInput = {
  beginsWith?: Maybe<Scalars['String']>;
  between?: Maybe<Array<Maybe<Scalars['String']>>>;
  contains?: Maybe<Scalars['String']>;
  eq?: Maybe<Scalars['String']>;
  ge?: Maybe<Scalars['String']>;
  gt?: Maybe<Scalars['String']>;
  le?: Maybe<Scalars['String']>;
  lt?: Maybe<Scalars['String']>;
  ne?: Maybe<Scalars['String']>;
  notContains?: Maybe<Scalars['String']>;
};

export type UpdateItemInput = {
  id: Scalars['ID'];
  message?: Maybe<Scalars['String']>;
  payload?: Maybe<Scalars['AWSJSON']>;
  timestamp?: Maybe<Scalars['AWSTimestamp']>;
  type?: Maybe<Scalars['String']>;
  user?: Maybe<Scalars['AWSJSON']>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
  selectionSet: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type StitchingResolver<TResult, TParent, TContext, TArgs> = LegacyStitchingResolver<TResult, TParent, TContext, TArgs> | NewStitchingResolver<TResult, TParent, TContext, TArgs>;
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AWSJSON: ResolverTypeWrapper<Scalars['AWSJSON']>;
  AWSTimestamp: ResolverTypeWrapper<Scalars['AWSTimestamp']>;
  Item: ResolverTypeWrapper<Item>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  String: ResolverTypeWrapper<Scalars['String']>;
  ItemConnection: ResolverTypeWrapper<ItemConnection>;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Subscription: ResolverTypeWrapper<{}>;
  CreateItemInput: CreateItemInput;
  DeleteItemInput: DeleteItemInput;
  TableBooleanFilterInput: TableBooleanFilterInput;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  TableFloatFilterInput: TableFloatFilterInput;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  TableIDFilterInput: TableIdFilterInput;
  TableIntFilterInput: TableIntFilterInput;
  TableItemFilterInput: TableItemFilterInput;
  TableStringFilterInput: TableStringFilterInput;
  UpdateItemInput: UpdateItemInput;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AWSJSON: Scalars['AWSJSON'];
  AWSTimestamp: Scalars['AWSTimestamp'];
  Item: Item;
  ID: Scalars['ID'];
  String: Scalars['String'];
  ItemConnection: ItemConnection;
  Mutation: {};
  Query: {};
  Int: Scalars['Int'];
  Subscription: {};
  CreateItemInput: CreateItemInput;
  DeleteItemInput: DeleteItemInput;
  TableBooleanFilterInput: TableBooleanFilterInput;
  Boolean: Scalars['Boolean'];
  TableFloatFilterInput: TableFloatFilterInput;
  Float: Scalars['Float'];
  TableIDFilterInput: TableIdFilterInput;
  TableIntFilterInput: TableIntFilterInput;
  TableItemFilterInput: TableItemFilterInput;
  TableStringFilterInput: TableStringFilterInput;
  UpdateItemInput: UpdateItemInput;
};

export interface AwsjsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['AWSJSON'], any> {
  name: 'AWSJSON';
}

export interface AwsTimestampScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['AWSTimestamp'], any> {
  name: 'AWSTimestamp';
}

export type ItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['Item'] = ResolversParentTypes['Item']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  payload?: Resolver<Maybe<ResolversTypes['AWSJSON']>, ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['AWSTimestamp'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['AWSJSON'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ItemConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['ItemConnection'] = ResolversParentTypes['ItemConnection']> = {
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Item']>>>, ParentType, ContextType>;
  nextToken?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  createItem?: Resolver<Maybe<ResolversTypes['Item']>, ParentType, ContextType, RequireFields<MutationCreateItemArgs, 'input'>>;
  deleteItem?: Resolver<Maybe<ResolversTypes['Item']>, ParentType, ContextType, RequireFields<MutationDeleteItemArgs, 'input'>>;
  updateItem?: Resolver<Maybe<ResolversTypes['Item']>, ParentType, ContextType, RequireFields<MutationUpdateItemArgs, 'input'>>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  getItem?: Resolver<Maybe<ResolversTypes['Item']>, ParentType, ContextType, RequireFields<QueryGetItemArgs, 'id'>>;
  listItems?: Resolver<Maybe<ResolversTypes['ItemConnection']>, ParentType, ContextType, RequireFields<QueryListItemsArgs, never>>;
};

export type SubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  onCreateItem?: SubscriptionResolver<Maybe<ResolversTypes['Item']>, "onCreateItem", ParentType, ContextType, RequireFields<SubscriptionOnCreateItemArgs, never>>;
  onDeleteItem?: SubscriptionResolver<Maybe<ResolversTypes['Item']>, "onDeleteItem", ParentType, ContextType, RequireFields<SubscriptionOnDeleteItemArgs, never>>;
  onUpdateItem?: SubscriptionResolver<Maybe<ResolversTypes['Item']>, "onUpdateItem", ParentType, ContextType, RequireFields<SubscriptionOnUpdateItemArgs, never>>;
};

export type Resolvers<ContextType = any> = {
  AWSJSON?: GraphQLScalarType;
  AWSTimestamp?: GraphQLScalarType;
  Item?: ItemResolvers<ContextType>;
  ItemConnection?: ItemConnectionResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
};


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>;
