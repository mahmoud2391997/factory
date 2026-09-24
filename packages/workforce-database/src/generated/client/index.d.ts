
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model WorkforceEmployee
 * 
 */
export type WorkforceEmployee = $Result.DefaultSelection<Prisma.$WorkforceEmployeePayload>
/**
 * Model WorkforceTeam
 * 
 */
export type WorkforceTeam = $Result.DefaultSelection<Prisma.$WorkforceTeamPayload>
/**
 * Model WorkforceTeamMember
 * 
 */
export type WorkforceTeamMember = $Result.DefaultSelection<Prisma.$WorkforceTeamMemberPayload>
/**
 * Model WorkforceTask
 * 
 */
export type WorkforceTask = $Result.DefaultSelection<Prisma.$WorkforceTaskPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const WorkforceTaskStatus: {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED'
};

export type WorkforceTaskStatus = (typeof WorkforceTaskStatus)[keyof typeof WorkforceTaskStatus]

}

export type WorkforceTaskStatus = $Enums.WorkforceTaskStatus

export const WorkforceTaskStatus: typeof $Enums.WorkforceTaskStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more WorkforceEmployees
 * const workforceEmployees = await prisma.workforceEmployee.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more WorkforceEmployees
   * const workforceEmployees = await prisma.workforceEmployee.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.workforceEmployee`: Exposes CRUD operations for the **WorkforceEmployee** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WorkforceEmployees
    * const workforceEmployees = await prisma.workforceEmployee.findMany()
    * ```
    */
  get workforceEmployee(): Prisma.WorkforceEmployeeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.workforceTeam`: Exposes CRUD operations for the **WorkforceTeam** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WorkforceTeams
    * const workforceTeams = await prisma.workforceTeam.findMany()
    * ```
    */
  get workforceTeam(): Prisma.WorkforceTeamDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.workforceTeamMember`: Exposes CRUD operations for the **WorkforceTeamMember** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WorkforceTeamMembers
    * const workforceTeamMembers = await prisma.workforceTeamMember.findMany()
    * ```
    */
  get workforceTeamMember(): Prisma.WorkforceTeamMemberDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.workforceTask`: Exposes CRUD operations for the **WorkforceTask** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WorkforceTasks
    * const workforceTasks = await prisma.workforceTask.findMany()
    * ```
    */
  get workforceTask(): Prisma.WorkforceTaskDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    WorkforceEmployee: 'WorkforceEmployee',
    WorkforceTeam: 'WorkforceTeam',
    WorkforceTeamMember: 'WorkforceTeamMember',
    WorkforceTask: 'WorkforceTask'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "workforceEmployee" | "workforceTeam" | "workforceTeamMember" | "workforceTask"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      WorkforceEmployee: {
        payload: Prisma.$WorkforceEmployeePayload<ExtArgs>
        fields: Prisma.WorkforceEmployeeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WorkforceEmployeeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceEmployeePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WorkforceEmployeeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceEmployeePayload>
          }
          findFirst: {
            args: Prisma.WorkforceEmployeeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceEmployeePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WorkforceEmployeeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceEmployeePayload>
          }
          findMany: {
            args: Prisma.WorkforceEmployeeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceEmployeePayload>[]
          }
          create: {
            args: Prisma.WorkforceEmployeeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceEmployeePayload>
          }
          createMany: {
            args: Prisma.WorkforceEmployeeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WorkforceEmployeeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceEmployeePayload>[]
          }
          delete: {
            args: Prisma.WorkforceEmployeeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceEmployeePayload>
          }
          update: {
            args: Prisma.WorkforceEmployeeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceEmployeePayload>
          }
          deleteMany: {
            args: Prisma.WorkforceEmployeeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WorkforceEmployeeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WorkforceEmployeeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceEmployeePayload>[]
          }
          upsert: {
            args: Prisma.WorkforceEmployeeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceEmployeePayload>
          }
          aggregate: {
            args: Prisma.WorkforceEmployeeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWorkforceEmployee>
          }
          groupBy: {
            args: Prisma.WorkforceEmployeeGroupByArgs<ExtArgs>
            result: $Utils.Optional<WorkforceEmployeeGroupByOutputType>[]
          }
          count: {
            args: Prisma.WorkforceEmployeeCountArgs<ExtArgs>
            result: $Utils.Optional<WorkforceEmployeeCountAggregateOutputType> | number
          }
        }
      }
      WorkforceTeam: {
        payload: Prisma.$WorkforceTeamPayload<ExtArgs>
        fields: Prisma.WorkforceTeamFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WorkforceTeamFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WorkforceTeamFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamPayload>
          }
          findFirst: {
            args: Prisma.WorkforceTeamFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WorkforceTeamFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamPayload>
          }
          findMany: {
            args: Prisma.WorkforceTeamFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamPayload>[]
          }
          create: {
            args: Prisma.WorkforceTeamCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamPayload>
          }
          createMany: {
            args: Prisma.WorkforceTeamCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WorkforceTeamCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamPayload>[]
          }
          delete: {
            args: Prisma.WorkforceTeamDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamPayload>
          }
          update: {
            args: Prisma.WorkforceTeamUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamPayload>
          }
          deleteMany: {
            args: Prisma.WorkforceTeamDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WorkforceTeamUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WorkforceTeamUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamPayload>[]
          }
          upsert: {
            args: Prisma.WorkforceTeamUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamPayload>
          }
          aggregate: {
            args: Prisma.WorkforceTeamAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWorkforceTeam>
          }
          groupBy: {
            args: Prisma.WorkforceTeamGroupByArgs<ExtArgs>
            result: $Utils.Optional<WorkforceTeamGroupByOutputType>[]
          }
          count: {
            args: Prisma.WorkforceTeamCountArgs<ExtArgs>
            result: $Utils.Optional<WorkforceTeamCountAggregateOutputType> | number
          }
        }
      }
      WorkforceTeamMember: {
        payload: Prisma.$WorkforceTeamMemberPayload<ExtArgs>
        fields: Prisma.WorkforceTeamMemberFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WorkforceTeamMemberFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamMemberPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WorkforceTeamMemberFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamMemberPayload>
          }
          findFirst: {
            args: Prisma.WorkforceTeamMemberFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamMemberPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WorkforceTeamMemberFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamMemberPayload>
          }
          findMany: {
            args: Prisma.WorkforceTeamMemberFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamMemberPayload>[]
          }
          create: {
            args: Prisma.WorkforceTeamMemberCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamMemberPayload>
          }
          createMany: {
            args: Prisma.WorkforceTeamMemberCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WorkforceTeamMemberCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamMemberPayload>[]
          }
          delete: {
            args: Prisma.WorkforceTeamMemberDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamMemberPayload>
          }
          update: {
            args: Prisma.WorkforceTeamMemberUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamMemberPayload>
          }
          deleteMany: {
            args: Prisma.WorkforceTeamMemberDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WorkforceTeamMemberUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WorkforceTeamMemberUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamMemberPayload>[]
          }
          upsert: {
            args: Prisma.WorkforceTeamMemberUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTeamMemberPayload>
          }
          aggregate: {
            args: Prisma.WorkforceTeamMemberAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWorkforceTeamMember>
          }
          groupBy: {
            args: Prisma.WorkforceTeamMemberGroupByArgs<ExtArgs>
            result: $Utils.Optional<WorkforceTeamMemberGroupByOutputType>[]
          }
          count: {
            args: Prisma.WorkforceTeamMemberCountArgs<ExtArgs>
            result: $Utils.Optional<WorkforceTeamMemberCountAggregateOutputType> | number
          }
        }
      }
      WorkforceTask: {
        payload: Prisma.$WorkforceTaskPayload<ExtArgs>
        fields: Prisma.WorkforceTaskFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WorkforceTaskFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTaskPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WorkforceTaskFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTaskPayload>
          }
          findFirst: {
            args: Prisma.WorkforceTaskFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTaskPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WorkforceTaskFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTaskPayload>
          }
          findMany: {
            args: Prisma.WorkforceTaskFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTaskPayload>[]
          }
          create: {
            args: Prisma.WorkforceTaskCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTaskPayload>
          }
          createMany: {
            args: Prisma.WorkforceTaskCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WorkforceTaskCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTaskPayload>[]
          }
          delete: {
            args: Prisma.WorkforceTaskDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTaskPayload>
          }
          update: {
            args: Prisma.WorkforceTaskUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTaskPayload>
          }
          deleteMany: {
            args: Prisma.WorkforceTaskDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WorkforceTaskUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WorkforceTaskUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTaskPayload>[]
          }
          upsert: {
            args: Prisma.WorkforceTaskUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkforceTaskPayload>
          }
          aggregate: {
            args: Prisma.WorkforceTaskAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWorkforceTask>
          }
          groupBy: {
            args: Prisma.WorkforceTaskGroupByArgs<ExtArgs>
            result: $Utils.Optional<WorkforceTaskGroupByOutputType>[]
          }
          count: {
            args: Prisma.WorkforceTaskCountArgs<ExtArgs>
            result: $Utils.Optional<WorkforceTaskCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    workforceEmployee?: WorkforceEmployeeOmit
    workforceTeam?: WorkforceTeamOmit
    workforceTeamMember?: WorkforceTeamMemberOmit
    workforceTask?: WorkforceTaskOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type WorkforceEmployeeCountOutputType
   */

  export type WorkforceEmployeeCountOutputType = {
    memberships: number
    tasksAssigned: number
  }

  export type WorkforceEmployeeCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    memberships?: boolean | WorkforceEmployeeCountOutputTypeCountMembershipsArgs
    tasksAssigned?: boolean | WorkforceEmployeeCountOutputTypeCountTasksAssignedArgs
  }

  // Custom InputTypes
  /**
   * WorkforceEmployeeCountOutputType without action
   */
  export type WorkforceEmployeeCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceEmployeeCountOutputType
     */
    select?: WorkforceEmployeeCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * WorkforceEmployeeCountOutputType without action
   */
  export type WorkforceEmployeeCountOutputTypeCountMembershipsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkforceTeamMemberWhereInput
  }

  /**
   * WorkforceEmployeeCountOutputType without action
   */
  export type WorkforceEmployeeCountOutputTypeCountTasksAssignedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkforceTaskWhereInput
  }


  /**
   * Count Type WorkforceTeamCountOutputType
   */

  export type WorkforceTeamCountOutputType = {
    members: number
    tasks: number
  }

  export type WorkforceTeamCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    members?: boolean | WorkforceTeamCountOutputTypeCountMembersArgs
    tasks?: boolean | WorkforceTeamCountOutputTypeCountTasksArgs
  }

  // Custom InputTypes
  /**
   * WorkforceTeamCountOutputType without action
   */
  export type WorkforceTeamCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeamCountOutputType
     */
    select?: WorkforceTeamCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * WorkforceTeamCountOutputType without action
   */
  export type WorkforceTeamCountOutputTypeCountMembersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkforceTeamMemberWhereInput
  }

  /**
   * WorkforceTeamCountOutputType without action
   */
  export type WorkforceTeamCountOutputTypeCountTasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkforceTaskWhereInput
  }


  /**
   * Models
   */

  /**
   * Model WorkforceEmployee
   */

  export type AggregateWorkforceEmployee = {
    _count: WorkforceEmployeeCountAggregateOutputType | null
    _min: WorkforceEmployeeMinAggregateOutputType | null
    _max: WorkforceEmployeeMaxAggregateOutputType | null
  }

  export type WorkforceEmployeeMinAggregateOutputType = {
    id: string | null
    code: string | null
    nameAr: string | null
    department: string | null
    jobTitle: string | null
    active: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WorkforceEmployeeMaxAggregateOutputType = {
    id: string | null
    code: string | null
    nameAr: string | null
    department: string | null
    jobTitle: string | null
    active: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WorkforceEmployeeCountAggregateOutputType = {
    id: number
    code: number
    nameAr: number
    department: number
    jobTitle: number
    active: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type WorkforceEmployeeMinAggregateInputType = {
    id?: true
    code?: true
    nameAr?: true
    department?: true
    jobTitle?: true
    active?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WorkforceEmployeeMaxAggregateInputType = {
    id?: true
    code?: true
    nameAr?: true
    department?: true
    jobTitle?: true
    active?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WorkforceEmployeeCountAggregateInputType = {
    id?: true
    code?: true
    nameAr?: true
    department?: true
    jobTitle?: true
    active?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type WorkforceEmployeeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkforceEmployee to aggregate.
     */
    where?: WorkforceEmployeeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkforceEmployees to fetch.
     */
    orderBy?: WorkforceEmployeeOrderByWithRelationInput | WorkforceEmployeeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WorkforceEmployeeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkforceEmployees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkforceEmployees.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WorkforceEmployees
    **/
    _count?: true | WorkforceEmployeeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WorkforceEmployeeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WorkforceEmployeeMaxAggregateInputType
  }

  export type GetWorkforceEmployeeAggregateType<T extends WorkforceEmployeeAggregateArgs> = {
        [P in keyof T & keyof AggregateWorkforceEmployee]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWorkforceEmployee[P]>
      : GetScalarType<T[P], AggregateWorkforceEmployee[P]>
  }




  export type WorkforceEmployeeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkforceEmployeeWhereInput
    orderBy?: WorkforceEmployeeOrderByWithAggregationInput | WorkforceEmployeeOrderByWithAggregationInput[]
    by: WorkforceEmployeeScalarFieldEnum[] | WorkforceEmployeeScalarFieldEnum
    having?: WorkforceEmployeeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WorkforceEmployeeCountAggregateInputType | true
    _min?: WorkforceEmployeeMinAggregateInputType
    _max?: WorkforceEmployeeMaxAggregateInputType
  }

  export type WorkforceEmployeeGroupByOutputType = {
    id: string
    code: string
    nameAr: string
    department: string
    jobTitle: string
    active: boolean
    createdAt: Date
    updatedAt: Date
    _count: WorkforceEmployeeCountAggregateOutputType | null
    _min: WorkforceEmployeeMinAggregateOutputType | null
    _max: WorkforceEmployeeMaxAggregateOutputType | null
  }

  type GetWorkforceEmployeeGroupByPayload<T extends WorkforceEmployeeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WorkforceEmployeeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WorkforceEmployeeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WorkforceEmployeeGroupByOutputType[P]>
            : GetScalarType<T[P], WorkforceEmployeeGroupByOutputType[P]>
        }
      >
    >


  export type WorkforceEmployeeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    code?: boolean
    nameAr?: boolean
    department?: boolean
    jobTitle?: boolean
    active?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    memberships?: boolean | WorkforceEmployee$membershipsArgs<ExtArgs>
    tasksAssigned?: boolean | WorkforceEmployee$tasksAssignedArgs<ExtArgs>
    _count?: boolean | WorkforceEmployeeCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workforceEmployee"]>

  export type WorkforceEmployeeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    code?: boolean
    nameAr?: boolean
    department?: boolean
    jobTitle?: boolean
    active?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["workforceEmployee"]>

  export type WorkforceEmployeeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    code?: boolean
    nameAr?: boolean
    department?: boolean
    jobTitle?: boolean
    active?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["workforceEmployee"]>

  export type WorkforceEmployeeSelectScalar = {
    id?: boolean
    code?: boolean
    nameAr?: boolean
    department?: boolean
    jobTitle?: boolean
    active?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type WorkforceEmployeeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "code" | "nameAr" | "department" | "jobTitle" | "active" | "createdAt" | "updatedAt", ExtArgs["result"]["workforceEmployee"]>
  export type WorkforceEmployeeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    memberships?: boolean | WorkforceEmployee$membershipsArgs<ExtArgs>
    tasksAssigned?: boolean | WorkforceEmployee$tasksAssignedArgs<ExtArgs>
    _count?: boolean | WorkforceEmployeeCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type WorkforceEmployeeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type WorkforceEmployeeIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $WorkforceEmployeePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WorkforceEmployee"
    objects: {
      memberships: Prisma.$WorkforceTeamMemberPayload<ExtArgs>[]
      tasksAssigned: Prisma.$WorkforceTaskPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      code: string
      nameAr: string
      department: string
      jobTitle: string
      active: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["workforceEmployee"]>
    composites: {}
  }

  type WorkforceEmployeeGetPayload<S extends boolean | null | undefined | WorkforceEmployeeDefaultArgs> = $Result.GetResult<Prisma.$WorkforceEmployeePayload, S>

  type WorkforceEmployeeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WorkforceEmployeeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WorkforceEmployeeCountAggregateInputType | true
    }

  export interface WorkforceEmployeeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WorkforceEmployee'], meta: { name: 'WorkforceEmployee' } }
    /**
     * Find zero or one WorkforceEmployee that matches the filter.
     * @param {WorkforceEmployeeFindUniqueArgs} args - Arguments to find a WorkforceEmployee
     * @example
     * // Get one WorkforceEmployee
     * const workforceEmployee = await prisma.workforceEmployee.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WorkforceEmployeeFindUniqueArgs>(args: SelectSubset<T, WorkforceEmployeeFindUniqueArgs<ExtArgs>>): Prisma__WorkforceEmployeeClient<$Result.GetResult<Prisma.$WorkforceEmployeePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WorkforceEmployee that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WorkforceEmployeeFindUniqueOrThrowArgs} args - Arguments to find a WorkforceEmployee
     * @example
     * // Get one WorkforceEmployee
     * const workforceEmployee = await prisma.workforceEmployee.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WorkforceEmployeeFindUniqueOrThrowArgs>(args: SelectSubset<T, WorkforceEmployeeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WorkforceEmployeeClient<$Result.GetResult<Prisma.$WorkforceEmployeePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorkforceEmployee that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceEmployeeFindFirstArgs} args - Arguments to find a WorkforceEmployee
     * @example
     * // Get one WorkforceEmployee
     * const workforceEmployee = await prisma.workforceEmployee.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WorkforceEmployeeFindFirstArgs>(args?: SelectSubset<T, WorkforceEmployeeFindFirstArgs<ExtArgs>>): Prisma__WorkforceEmployeeClient<$Result.GetResult<Prisma.$WorkforceEmployeePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorkforceEmployee that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceEmployeeFindFirstOrThrowArgs} args - Arguments to find a WorkforceEmployee
     * @example
     * // Get one WorkforceEmployee
     * const workforceEmployee = await prisma.workforceEmployee.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WorkforceEmployeeFindFirstOrThrowArgs>(args?: SelectSubset<T, WorkforceEmployeeFindFirstOrThrowArgs<ExtArgs>>): Prisma__WorkforceEmployeeClient<$Result.GetResult<Prisma.$WorkforceEmployeePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WorkforceEmployees that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceEmployeeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WorkforceEmployees
     * const workforceEmployees = await prisma.workforceEmployee.findMany()
     * 
     * // Get first 10 WorkforceEmployees
     * const workforceEmployees = await prisma.workforceEmployee.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const workforceEmployeeWithIdOnly = await prisma.workforceEmployee.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WorkforceEmployeeFindManyArgs>(args?: SelectSubset<T, WorkforceEmployeeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkforceEmployeePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WorkforceEmployee.
     * @param {WorkforceEmployeeCreateArgs} args - Arguments to create a WorkforceEmployee.
     * @example
     * // Create one WorkforceEmployee
     * const WorkforceEmployee = await prisma.workforceEmployee.create({
     *   data: {
     *     // ... data to create a WorkforceEmployee
     *   }
     * })
     * 
     */
    create<T extends WorkforceEmployeeCreateArgs>(args: SelectSubset<T, WorkforceEmployeeCreateArgs<ExtArgs>>): Prisma__WorkforceEmployeeClient<$Result.GetResult<Prisma.$WorkforceEmployeePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WorkforceEmployees.
     * @param {WorkforceEmployeeCreateManyArgs} args - Arguments to create many WorkforceEmployees.
     * @example
     * // Create many WorkforceEmployees
     * const workforceEmployee = await prisma.workforceEmployee.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WorkforceEmployeeCreateManyArgs>(args?: SelectSubset<T, WorkforceEmployeeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WorkforceEmployees and returns the data saved in the database.
     * @param {WorkforceEmployeeCreateManyAndReturnArgs} args - Arguments to create many WorkforceEmployees.
     * @example
     * // Create many WorkforceEmployees
     * const workforceEmployee = await prisma.workforceEmployee.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WorkforceEmployees and only return the `id`
     * const workforceEmployeeWithIdOnly = await prisma.workforceEmployee.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WorkforceEmployeeCreateManyAndReturnArgs>(args?: SelectSubset<T, WorkforceEmployeeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkforceEmployeePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WorkforceEmployee.
     * @param {WorkforceEmployeeDeleteArgs} args - Arguments to delete one WorkforceEmployee.
     * @example
     * // Delete one WorkforceEmployee
     * const WorkforceEmployee = await prisma.workforceEmployee.delete({
     *   where: {
     *     // ... filter to delete one WorkforceEmployee
     *   }
     * })
     * 
     */
    delete<T extends WorkforceEmployeeDeleteArgs>(args: SelectSubset<T, WorkforceEmployeeDeleteArgs<ExtArgs>>): Prisma__WorkforceEmployeeClient<$Result.GetResult<Prisma.$WorkforceEmployeePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WorkforceEmployee.
     * @param {WorkforceEmployeeUpdateArgs} args - Arguments to update one WorkforceEmployee.
     * @example
     * // Update one WorkforceEmployee
     * const workforceEmployee = await prisma.workforceEmployee.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WorkforceEmployeeUpdateArgs>(args: SelectSubset<T, WorkforceEmployeeUpdateArgs<ExtArgs>>): Prisma__WorkforceEmployeeClient<$Result.GetResult<Prisma.$WorkforceEmployeePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WorkforceEmployees.
     * @param {WorkforceEmployeeDeleteManyArgs} args - Arguments to filter WorkforceEmployees to delete.
     * @example
     * // Delete a few WorkforceEmployees
     * const { count } = await prisma.workforceEmployee.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WorkforceEmployeeDeleteManyArgs>(args?: SelectSubset<T, WorkforceEmployeeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkforceEmployees.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceEmployeeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WorkforceEmployees
     * const workforceEmployee = await prisma.workforceEmployee.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WorkforceEmployeeUpdateManyArgs>(args: SelectSubset<T, WorkforceEmployeeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkforceEmployees and returns the data updated in the database.
     * @param {WorkforceEmployeeUpdateManyAndReturnArgs} args - Arguments to update many WorkforceEmployees.
     * @example
     * // Update many WorkforceEmployees
     * const workforceEmployee = await prisma.workforceEmployee.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WorkforceEmployees and only return the `id`
     * const workforceEmployeeWithIdOnly = await prisma.workforceEmployee.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WorkforceEmployeeUpdateManyAndReturnArgs>(args: SelectSubset<T, WorkforceEmployeeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkforceEmployeePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WorkforceEmployee.
     * @param {WorkforceEmployeeUpsertArgs} args - Arguments to update or create a WorkforceEmployee.
     * @example
     * // Update or create a WorkforceEmployee
     * const workforceEmployee = await prisma.workforceEmployee.upsert({
     *   create: {
     *     // ... data to create a WorkforceEmployee
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WorkforceEmployee we want to update
     *   }
     * })
     */
    upsert<T extends WorkforceEmployeeUpsertArgs>(args: SelectSubset<T, WorkforceEmployeeUpsertArgs<ExtArgs>>): Prisma__WorkforceEmployeeClient<$Result.GetResult<Prisma.$WorkforceEmployeePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WorkforceEmployees.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceEmployeeCountArgs} args - Arguments to filter WorkforceEmployees to count.
     * @example
     * // Count the number of WorkforceEmployees
     * const count = await prisma.workforceEmployee.count({
     *   where: {
     *     // ... the filter for the WorkforceEmployees we want to count
     *   }
     * })
    **/
    count<T extends WorkforceEmployeeCountArgs>(
      args?: Subset<T, WorkforceEmployeeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WorkforceEmployeeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WorkforceEmployee.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceEmployeeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorkforceEmployeeAggregateArgs>(args: Subset<T, WorkforceEmployeeAggregateArgs>): Prisma.PrismaPromise<GetWorkforceEmployeeAggregateType<T>>

    /**
     * Group by WorkforceEmployee.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceEmployeeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WorkforceEmployeeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WorkforceEmployeeGroupByArgs['orderBy'] }
        : { orderBy?: WorkforceEmployeeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WorkforceEmployeeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkforceEmployeeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WorkforceEmployee model
   */
  readonly fields: WorkforceEmployeeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WorkforceEmployee.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WorkforceEmployeeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    memberships<T extends WorkforceEmployee$membershipsArgs<ExtArgs> = {}>(args?: Subset<T, WorkforceEmployee$membershipsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkforceTeamMemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    tasksAssigned<T extends WorkforceEmployee$tasksAssignedArgs<ExtArgs> = {}>(args?: Subset<T, WorkforceEmployee$tasksAssignedArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkforceTaskPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WorkforceEmployee model
   */
  interface WorkforceEmployeeFieldRefs {
    readonly id: FieldRef<"WorkforceEmployee", 'String'>
    readonly code: FieldRef<"WorkforceEmployee", 'String'>
    readonly nameAr: FieldRef<"WorkforceEmployee", 'String'>
    readonly department: FieldRef<"WorkforceEmployee", 'String'>
    readonly jobTitle: FieldRef<"WorkforceEmployee", 'String'>
    readonly active: FieldRef<"WorkforceEmployee", 'Boolean'>
    readonly createdAt: FieldRef<"WorkforceEmployee", 'DateTime'>
    readonly updatedAt: FieldRef<"WorkforceEmployee", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WorkforceEmployee findUnique
   */
  export type WorkforceEmployeeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceEmployee
     */
    select?: WorkforceEmployeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceEmployee
     */
    omit?: WorkforceEmployeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceEmployeeInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceEmployee to fetch.
     */
    where: WorkforceEmployeeWhereUniqueInput
  }

  /**
   * WorkforceEmployee findUniqueOrThrow
   */
  export type WorkforceEmployeeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceEmployee
     */
    select?: WorkforceEmployeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceEmployee
     */
    omit?: WorkforceEmployeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceEmployeeInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceEmployee to fetch.
     */
    where: WorkforceEmployeeWhereUniqueInput
  }

  /**
   * WorkforceEmployee findFirst
   */
  export type WorkforceEmployeeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceEmployee
     */
    select?: WorkforceEmployeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceEmployee
     */
    omit?: WorkforceEmployeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceEmployeeInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceEmployee to fetch.
     */
    where?: WorkforceEmployeeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkforceEmployees to fetch.
     */
    orderBy?: WorkforceEmployeeOrderByWithRelationInput | WorkforceEmployeeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkforceEmployees.
     */
    cursor?: WorkforceEmployeeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkforceEmployees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkforceEmployees.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkforceEmployees.
     */
    distinct?: WorkforceEmployeeScalarFieldEnum | WorkforceEmployeeScalarFieldEnum[]
  }

  /**
   * WorkforceEmployee findFirstOrThrow
   */
  export type WorkforceEmployeeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceEmployee
     */
    select?: WorkforceEmployeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceEmployee
     */
    omit?: WorkforceEmployeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceEmployeeInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceEmployee to fetch.
     */
    where?: WorkforceEmployeeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkforceEmployees to fetch.
     */
    orderBy?: WorkforceEmployeeOrderByWithRelationInput | WorkforceEmployeeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkforceEmployees.
     */
    cursor?: WorkforceEmployeeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkforceEmployees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkforceEmployees.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkforceEmployees.
     */
    distinct?: WorkforceEmployeeScalarFieldEnum | WorkforceEmployeeScalarFieldEnum[]
  }

  /**
   * WorkforceEmployee findMany
   */
  export type WorkforceEmployeeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceEmployee
     */
    select?: WorkforceEmployeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceEmployee
     */
    omit?: WorkforceEmployeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceEmployeeInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceEmployees to fetch.
     */
    where?: WorkforceEmployeeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkforceEmployees to fetch.
     */
    orderBy?: WorkforceEmployeeOrderByWithRelationInput | WorkforceEmployeeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WorkforceEmployees.
     */
    cursor?: WorkforceEmployeeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkforceEmployees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkforceEmployees.
     */
    skip?: number
    distinct?: WorkforceEmployeeScalarFieldEnum | WorkforceEmployeeScalarFieldEnum[]
  }

  /**
   * WorkforceEmployee create
   */
  export type WorkforceEmployeeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceEmployee
     */
    select?: WorkforceEmployeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceEmployee
     */
    omit?: WorkforceEmployeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceEmployeeInclude<ExtArgs> | null
    /**
     * The data needed to create a WorkforceEmployee.
     */
    data: XOR<WorkforceEmployeeCreateInput, WorkforceEmployeeUncheckedCreateInput>
  }

  /**
   * WorkforceEmployee createMany
   */
  export type WorkforceEmployeeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WorkforceEmployees.
     */
    data: WorkforceEmployeeCreateManyInput | WorkforceEmployeeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorkforceEmployee createManyAndReturn
   */
  export type WorkforceEmployeeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceEmployee
     */
    select?: WorkforceEmployeeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceEmployee
     */
    omit?: WorkforceEmployeeOmit<ExtArgs> | null
    /**
     * The data used to create many WorkforceEmployees.
     */
    data: WorkforceEmployeeCreateManyInput | WorkforceEmployeeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorkforceEmployee update
   */
  export type WorkforceEmployeeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceEmployee
     */
    select?: WorkforceEmployeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceEmployee
     */
    omit?: WorkforceEmployeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceEmployeeInclude<ExtArgs> | null
    /**
     * The data needed to update a WorkforceEmployee.
     */
    data: XOR<WorkforceEmployeeUpdateInput, WorkforceEmployeeUncheckedUpdateInput>
    /**
     * Choose, which WorkforceEmployee to update.
     */
    where: WorkforceEmployeeWhereUniqueInput
  }

  /**
   * WorkforceEmployee updateMany
   */
  export type WorkforceEmployeeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WorkforceEmployees.
     */
    data: XOR<WorkforceEmployeeUpdateManyMutationInput, WorkforceEmployeeUncheckedUpdateManyInput>
    /**
     * Filter which WorkforceEmployees to update
     */
    where?: WorkforceEmployeeWhereInput
    /**
     * Limit how many WorkforceEmployees to update.
     */
    limit?: number
  }

  /**
   * WorkforceEmployee updateManyAndReturn
   */
  export type WorkforceEmployeeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceEmployee
     */
    select?: WorkforceEmployeeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceEmployee
     */
    omit?: WorkforceEmployeeOmit<ExtArgs> | null
    /**
     * The data used to update WorkforceEmployees.
     */
    data: XOR<WorkforceEmployeeUpdateManyMutationInput, WorkforceEmployeeUncheckedUpdateManyInput>
    /**
     * Filter which WorkforceEmployees to update
     */
    where?: WorkforceEmployeeWhereInput
    /**
     * Limit how many WorkforceEmployees to update.
     */
    limit?: number
  }

  /**
   * WorkforceEmployee upsert
   */
  export type WorkforceEmployeeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceEmployee
     */
    select?: WorkforceEmployeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceEmployee
     */
    omit?: WorkforceEmployeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceEmployeeInclude<ExtArgs> | null
    /**
     * The filter to search for the WorkforceEmployee to update in case it exists.
     */
    where: WorkforceEmployeeWhereUniqueInput
    /**
     * In case the WorkforceEmployee found by the `where` argument doesn't exist, create a new WorkforceEmployee with this data.
     */
    create: XOR<WorkforceEmployeeCreateInput, WorkforceEmployeeUncheckedCreateInput>
    /**
     * In case the WorkforceEmployee was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WorkforceEmployeeUpdateInput, WorkforceEmployeeUncheckedUpdateInput>
  }

  /**
   * WorkforceEmployee delete
   */
  export type WorkforceEmployeeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceEmployee
     */
    select?: WorkforceEmployeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceEmployee
     */
    omit?: WorkforceEmployeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceEmployeeInclude<ExtArgs> | null
    /**
     * Filter which WorkforceEmployee to delete.
     */
    where: WorkforceEmployeeWhereUniqueInput
  }

  /**
   * WorkforceEmployee deleteMany
   */
  export type WorkforceEmployeeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkforceEmployees to delete
     */
    where?: WorkforceEmployeeWhereInput
    /**
     * Limit how many WorkforceEmployees to delete.
     */
    limit?: number
  }

  /**
   * WorkforceEmployee.memberships
   */
  export type WorkforceEmployee$membershipsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeamMember
     */
    select?: WorkforceTeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeamMember
     */
    omit?: WorkforceTeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamMemberInclude<ExtArgs> | null
    where?: WorkforceTeamMemberWhereInput
    orderBy?: WorkforceTeamMemberOrderByWithRelationInput | WorkforceTeamMemberOrderByWithRelationInput[]
    cursor?: WorkforceTeamMemberWhereUniqueInput
    take?: number
    skip?: number
    distinct?: WorkforceTeamMemberScalarFieldEnum | WorkforceTeamMemberScalarFieldEnum[]
  }

  /**
   * WorkforceEmployee.tasksAssigned
   */
  export type WorkforceEmployee$tasksAssignedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTask
     */
    select?: WorkforceTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTask
     */
    omit?: WorkforceTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTaskInclude<ExtArgs> | null
    where?: WorkforceTaskWhereInput
    orderBy?: WorkforceTaskOrderByWithRelationInput | WorkforceTaskOrderByWithRelationInput[]
    cursor?: WorkforceTaskWhereUniqueInput
    take?: number
    skip?: number
    distinct?: WorkforceTaskScalarFieldEnum | WorkforceTaskScalarFieldEnum[]
  }

  /**
   * WorkforceEmployee without action
   */
  export type WorkforceEmployeeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceEmployee
     */
    select?: WorkforceEmployeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceEmployee
     */
    omit?: WorkforceEmployeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceEmployeeInclude<ExtArgs> | null
  }


  /**
   * Model WorkforceTeam
   */

  export type AggregateWorkforceTeam = {
    _count: WorkforceTeamCountAggregateOutputType | null
    _min: WorkforceTeamMinAggregateOutputType | null
    _max: WorkforceTeamMaxAggregateOutputType | null
  }

  export type WorkforceTeamMinAggregateOutputType = {
    id: string | null
    key: string | null
    nameAr: string | null
    description: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WorkforceTeamMaxAggregateOutputType = {
    id: string | null
    key: string | null
    nameAr: string | null
    description: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WorkforceTeamCountAggregateOutputType = {
    id: number
    key: number
    nameAr: number
    description: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type WorkforceTeamMinAggregateInputType = {
    id?: true
    key?: true
    nameAr?: true
    description?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WorkforceTeamMaxAggregateInputType = {
    id?: true
    key?: true
    nameAr?: true
    description?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WorkforceTeamCountAggregateInputType = {
    id?: true
    key?: true
    nameAr?: true
    description?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type WorkforceTeamAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkforceTeam to aggregate.
     */
    where?: WorkforceTeamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkforceTeams to fetch.
     */
    orderBy?: WorkforceTeamOrderByWithRelationInput | WorkforceTeamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WorkforceTeamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkforceTeams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkforceTeams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WorkforceTeams
    **/
    _count?: true | WorkforceTeamCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WorkforceTeamMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WorkforceTeamMaxAggregateInputType
  }

  export type GetWorkforceTeamAggregateType<T extends WorkforceTeamAggregateArgs> = {
        [P in keyof T & keyof AggregateWorkforceTeam]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWorkforceTeam[P]>
      : GetScalarType<T[P], AggregateWorkforceTeam[P]>
  }




  export type WorkforceTeamGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkforceTeamWhereInput
    orderBy?: WorkforceTeamOrderByWithAggregationInput | WorkforceTeamOrderByWithAggregationInput[]
    by: WorkforceTeamScalarFieldEnum[] | WorkforceTeamScalarFieldEnum
    having?: WorkforceTeamScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WorkforceTeamCountAggregateInputType | true
    _min?: WorkforceTeamMinAggregateInputType
    _max?: WorkforceTeamMaxAggregateInputType
  }

  export type WorkforceTeamGroupByOutputType = {
    id: string
    key: string
    nameAr: string
    description: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: WorkforceTeamCountAggregateOutputType | null
    _min: WorkforceTeamMinAggregateOutputType | null
    _max: WorkforceTeamMaxAggregateOutputType | null
  }

  type GetWorkforceTeamGroupByPayload<T extends WorkforceTeamGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WorkforceTeamGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WorkforceTeamGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WorkforceTeamGroupByOutputType[P]>
            : GetScalarType<T[P], WorkforceTeamGroupByOutputType[P]>
        }
      >
    >


  export type WorkforceTeamSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    key?: boolean
    nameAr?: boolean
    description?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    members?: boolean | WorkforceTeam$membersArgs<ExtArgs>
    tasks?: boolean | WorkforceTeam$tasksArgs<ExtArgs>
    _count?: boolean | WorkforceTeamCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workforceTeam"]>

  export type WorkforceTeamSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    key?: boolean
    nameAr?: boolean
    description?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["workforceTeam"]>

  export type WorkforceTeamSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    key?: boolean
    nameAr?: boolean
    description?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["workforceTeam"]>

  export type WorkforceTeamSelectScalar = {
    id?: boolean
    key?: boolean
    nameAr?: boolean
    description?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type WorkforceTeamOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "key" | "nameAr" | "description" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["workforceTeam"]>
  export type WorkforceTeamInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    members?: boolean | WorkforceTeam$membersArgs<ExtArgs>
    tasks?: boolean | WorkforceTeam$tasksArgs<ExtArgs>
    _count?: boolean | WorkforceTeamCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type WorkforceTeamIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type WorkforceTeamIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $WorkforceTeamPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WorkforceTeam"
    objects: {
      members: Prisma.$WorkforceTeamMemberPayload<ExtArgs>[]
      tasks: Prisma.$WorkforceTaskPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      key: string
      nameAr: string
      description: string | null
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["workforceTeam"]>
    composites: {}
  }

  type WorkforceTeamGetPayload<S extends boolean | null | undefined | WorkforceTeamDefaultArgs> = $Result.GetResult<Prisma.$WorkforceTeamPayload, S>

  type WorkforceTeamCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WorkforceTeamFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WorkforceTeamCountAggregateInputType | true
    }

  export interface WorkforceTeamDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WorkforceTeam'], meta: { name: 'WorkforceTeam' } }
    /**
     * Find zero or one WorkforceTeam that matches the filter.
     * @param {WorkforceTeamFindUniqueArgs} args - Arguments to find a WorkforceTeam
     * @example
     * // Get one WorkforceTeam
     * const workforceTeam = await prisma.workforceTeam.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WorkforceTeamFindUniqueArgs>(args: SelectSubset<T, WorkforceTeamFindUniqueArgs<ExtArgs>>): Prisma__WorkforceTeamClient<$Result.GetResult<Prisma.$WorkforceTeamPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WorkforceTeam that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WorkforceTeamFindUniqueOrThrowArgs} args - Arguments to find a WorkforceTeam
     * @example
     * // Get one WorkforceTeam
     * const workforceTeam = await prisma.workforceTeam.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WorkforceTeamFindUniqueOrThrowArgs>(args: SelectSubset<T, WorkforceTeamFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WorkforceTeamClient<$Result.GetResult<Prisma.$WorkforceTeamPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorkforceTeam that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTeamFindFirstArgs} args - Arguments to find a WorkforceTeam
     * @example
     * // Get one WorkforceTeam
     * const workforceTeam = await prisma.workforceTeam.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WorkforceTeamFindFirstArgs>(args?: SelectSubset<T, WorkforceTeamFindFirstArgs<ExtArgs>>): Prisma__WorkforceTeamClient<$Result.GetResult<Prisma.$WorkforceTeamPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorkforceTeam that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTeamFindFirstOrThrowArgs} args - Arguments to find a WorkforceTeam
     * @example
     * // Get one WorkforceTeam
     * const workforceTeam = await prisma.workforceTeam.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WorkforceTeamFindFirstOrThrowArgs>(args?: SelectSubset<T, WorkforceTeamFindFirstOrThrowArgs<ExtArgs>>): Prisma__WorkforceTeamClient<$Result.GetResult<Prisma.$WorkforceTeamPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WorkforceTeams that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTeamFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WorkforceTeams
     * const workforceTeams = await prisma.workforceTeam.findMany()
     * 
     * // Get first 10 WorkforceTeams
     * const workforceTeams = await prisma.workforceTeam.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const workforceTeamWithIdOnly = await prisma.workforceTeam.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WorkforceTeamFindManyArgs>(args?: SelectSubset<T, WorkforceTeamFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkforceTeamPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WorkforceTeam.
     * @param {WorkforceTeamCreateArgs} args - Arguments to create a WorkforceTeam.
     * @example
     * // Create one WorkforceTeam
     * const WorkforceTeam = await prisma.workforceTeam.create({
     *   data: {
     *     // ... data to create a WorkforceTeam
     *   }
     * })
     * 
     */
    create<T extends WorkforceTeamCreateArgs>(args: SelectSubset<T, WorkforceTeamCreateArgs<ExtArgs>>): Prisma__WorkforceTeamClient<$Result.GetResult<Prisma.$WorkforceTeamPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WorkforceTeams.
     * @param {WorkforceTeamCreateManyArgs} args - Arguments to create many WorkforceTeams.
     * @example
     * // Create many WorkforceTeams
     * const workforceTeam = await prisma.workforceTeam.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WorkforceTeamCreateManyArgs>(args?: SelectSubset<T, WorkforceTeamCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WorkforceTeams and returns the data saved in the database.
     * @param {WorkforceTeamCreateManyAndReturnArgs} args - Arguments to create many WorkforceTeams.
     * @example
     * // Create many WorkforceTeams
     * const workforceTeam = await prisma.workforceTeam.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WorkforceTeams and only return the `id`
     * const workforceTeamWithIdOnly = await prisma.workforceTeam.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WorkforceTeamCreateManyAndReturnArgs>(args?: SelectSubset<T, WorkforceTeamCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkforceTeamPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WorkforceTeam.
     * @param {WorkforceTeamDeleteArgs} args - Arguments to delete one WorkforceTeam.
     * @example
     * // Delete one WorkforceTeam
     * const WorkforceTeam = await prisma.workforceTeam.delete({
     *   where: {
     *     // ... filter to delete one WorkforceTeam
     *   }
     * })
     * 
     */
    delete<T extends WorkforceTeamDeleteArgs>(args: SelectSubset<T, WorkforceTeamDeleteArgs<ExtArgs>>): Prisma__WorkforceTeamClient<$Result.GetResult<Prisma.$WorkforceTeamPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WorkforceTeam.
     * @param {WorkforceTeamUpdateArgs} args - Arguments to update one WorkforceTeam.
     * @example
     * // Update one WorkforceTeam
     * const workforceTeam = await prisma.workforceTeam.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WorkforceTeamUpdateArgs>(args: SelectSubset<T, WorkforceTeamUpdateArgs<ExtArgs>>): Prisma__WorkforceTeamClient<$Result.GetResult<Prisma.$WorkforceTeamPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WorkforceTeams.
     * @param {WorkforceTeamDeleteManyArgs} args - Arguments to filter WorkforceTeams to delete.
     * @example
     * // Delete a few WorkforceTeams
     * const { count } = await prisma.workforceTeam.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WorkforceTeamDeleteManyArgs>(args?: SelectSubset<T, WorkforceTeamDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkforceTeams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTeamUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WorkforceTeams
     * const workforceTeam = await prisma.workforceTeam.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WorkforceTeamUpdateManyArgs>(args: SelectSubset<T, WorkforceTeamUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkforceTeams and returns the data updated in the database.
     * @param {WorkforceTeamUpdateManyAndReturnArgs} args - Arguments to update many WorkforceTeams.
     * @example
     * // Update many WorkforceTeams
     * const workforceTeam = await prisma.workforceTeam.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WorkforceTeams and only return the `id`
     * const workforceTeamWithIdOnly = await prisma.workforceTeam.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WorkforceTeamUpdateManyAndReturnArgs>(args: SelectSubset<T, WorkforceTeamUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkforceTeamPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WorkforceTeam.
     * @param {WorkforceTeamUpsertArgs} args - Arguments to update or create a WorkforceTeam.
     * @example
     * // Update or create a WorkforceTeam
     * const workforceTeam = await prisma.workforceTeam.upsert({
     *   create: {
     *     // ... data to create a WorkforceTeam
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WorkforceTeam we want to update
     *   }
     * })
     */
    upsert<T extends WorkforceTeamUpsertArgs>(args: SelectSubset<T, WorkforceTeamUpsertArgs<ExtArgs>>): Prisma__WorkforceTeamClient<$Result.GetResult<Prisma.$WorkforceTeamPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WorkforceTeams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTeamCountArgs} args - Arguments to filter WorkforceTeams to count.
     * @example
     * // Count the number of WorkforceTeams
     * const count = await prisma.workforceTeam.count({
     *   where: {
     *     // ... the filter for the WorkforceTeams we want to count
     *   }
     * })
    **/
    count<T extends WorkforceTeamCountArgs>(
      args?: Subset<T, WorkforceTeamCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WorkforceTeamCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WorkforceTeam.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTeamAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorkforceTeamAggregateArgs>(args: Subset<T, WorkforceTeamAggregateArgs>): Prisma.PrismaPromise<GetWorkforceTeamAggregateType<T>>

    /**
     * Group by WorkforceTeam.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTeamGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WorkforceTeamGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WorkforceTeamGroupByArgs['orderBy'] }
        : { orderBy?: WorkforceTeamGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WorkforceTeamGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkforceTeamGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WorkforceTeam model
   */
  readonly fields: WorkforceTeamFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WorkforceTeam.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WorkforceTeamClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    members<T extends WorkforceTeam$membersArgs<ExtArgs> = {}>(args?: Subset<T, WorkforceTeam$membersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkforceTeamMemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    tasks<T extends WorkforceTeam$tasksArgs<ExtArgs> = {}>(args?: Subset<T, WorkforceTeam$tasksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkforceTaskPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WorkforceTeam model
   */
  interface WorkforceTeamFieldRefs {
    readonly id: FieldRef<"WorkforceTeam", 'String'>
    readonly key: FieldRef<"WorkforceTeam", 'String'>
    readonly nameAr: FieldRef<"WorkforceTeam", 'String'>
    readonly description: FieldRef<"WorkforceTeam", 'String'>
    readonly isActive: FieldRef<"WorkforceTeam", 'Boolean'>
    readonly createdAt: FieldRef<"WorkforceTeam", 'DateTime'>
    readonly updatedAt: FieldRef<"WorkforceTeam", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WorkforceTeam findUnique
   */
  export type WorkforceTeamFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeam
     */
    select?: WorkforceTeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeam
     */
    omit?: WorkforceTeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceTeam to fetch.
     */
    where: WorkforceTeamWhereUniqueInput
  }

  /**
   * WorkforceTeam findUniqueOrThrow
   */
  export type WorkforceTeamFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeam
     */
    select?: WorkforceTeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeam
     */
    omit?: WorkforceTeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceTeam to fetch.
     */
    where: WorkforceTeamWhereUniqueInput
  }

  /**
   * WorkforceTeam findFirst
   */
  export type WorkforceTeamFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeam
     */
    select?: WorkforceTeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeam
     */
    omit?: WorkforceTeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceTeam to fetch.
     */
    where?: WorkforceTeamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkforceTeams to fetch.
     */
    orderBy?: WorkforceTeamOrderByWithRelationInput | WorkforceTeamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkforceTeams.
     */
    cursor?: WorkforceTeamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkforceTeams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkforceTeams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkforceTeams.
     */
    distinct?: WorkforceTeamScalarFieldEnum | WorkforceTeamScalarFieldEnum[]
  }

  /**
   * WorkforceTeam findFirstOrThrow
   */
  export type WorkforceTeamFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeam
     */
    select?: WorkforceTeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeam
     */
    omit?: WorkforceTeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceTeam to fetch.
     */
    where?: WorkforceTeamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkforceTeams to fetch.
     */
    orderBy?: WorkforceTeamOrderByWithRelationInput | WorkforceTeamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkforceTeams.
     */
    cursor?: WorkforceTeamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkforceTeams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkforceTeams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkforceTeams.
     */
    distinct?: WorkforceTeamScalarFieldEnum | WorkforceTeamScalarFieldEnum[]
  }

  /**
   * WorkforceTeam findMany
   */
  export type WorkforceTeamFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeam
     */
    select?: WorkforceTeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeam
     */
    omit?: WorkforceTeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceTeams to fetch.
     */
    where?: WorkforceTeamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkforceTeams to fetch.
     */
    orderBy?: WorkforceTeamOrderByWithRelationInput | WorkforceTeamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WorkforceTeams.
     */
    cursor?: WorkforceTeamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkforceTeams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkforceTeams.
     */
    skip?: number
    distinct?: WorkforceTeamScalarFieldEnum | WorkforceTeamScalarFieldEnum[]
  }

  /**
   * WorkforceTeam create
   */
  export type WorkforceTeamCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeam
     */
    select?: WorkforceTeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeam
     */
    omit?: WorkforceTeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamInclude<ExtArgs> | null
    /**
     * The data needed to create a WorkforceTeam.
     */
    data: XOR<WorkforceTeamCreateInput, WorkforceTeamUncheckedCreateInput>
  }

  /**
   * WorkforceTeam createMany
   */
  export type WorkforceTeamCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WorkforceTeams.
     */
    data: WorkforceTeamCreateManyInput | WorkforceTeamCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorkforceTeam createManyAndReturn
   */
  export type WorkforceTeamCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeam
     */
    select?: WorkforceTeamSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeam
     */
    omit?: WorkforceTeamOmit<ExtArgs> | null
    /**
     * The data used to create many WorkforceTeams.
     */
    data: WorkforceTeamCreateManyInput | WorkforceTeamCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorkforceTeam update
   */
  export type WorkforceTeamUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeam
     */
    select?: WorkforceTeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeam
     */
    omit?: WorkforceTeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamInclude<ExtArgs> | null
    /**
     * The data needed to update a WorkforceTeam.
     */
    data: XOR<WorkforceTeamUpdateInput, WorkforceTeamUncheckedUpdateInput>
    /**
     * Choose, which WorkforceTeam to update.
     */
    where: WorkforceTeamWhereUniqueInput
  }

  /**
   * WorkforceTeam updateMany
   */
  export type WorkforceTeamUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WorkforceTeams.
     */
    data: XOR<WorkforceTeamUpdateManyMutationInput, WorkforceTeamUncheckedUpdateManyInput>
    /**
     * Filter which WorkforceTeams to update
     */
    where?: WorkforceTeamWhereInput
    /**
     * Limit how many WorkforceTeams to update.
     */
    limit?: number
  }

  /**
   * WorkforceTeam updateManyAndReturn
   */
  export type WorkforceTeamUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeam
     */
    select?: WorkforceTeamSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeam
     */
    omit?: WorkforceTeamOmit<ExtArgs> | null
    /**
     * The data used to update WorkforceTeams.
     */
    data: XOR<WorkforceTeamUpdateManyMutationInput, WorkforceTeamUncheckedUpdateManyInput>
    /**
     * Filter which WorkforceTeams to update
     */
    where?: WorkforceTeamWhereInput
    /**
     * Limit how many WorkforceTeams to update.
     */
    limit?: number
  }

  /**
   * WorkforceTeam upsert
   */
  export type WorkforceTeamUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeam
     */
    select?: WorkforceTeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeam
     */
    omit?: WorkforceTeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamInclude<ExtArgs> | null
    /**
     * The filter to search for the WorkforceTeam to update in case it exists.
     */
    where: WorkforceTeamWhereUniqueInput
    /**
     * In case the WorkforceTeam found by the `where` argument doesn't exist, create a new WorkforceTeam with this data.
     */
    create: XOR<WorkforceTeamCreateInput, WorkforceTeamUncheckedCreateInput>
    /**
     * In case the WorkforceTeam was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WorkforceTeamUpdateInput, WorkforceTeamUncheckedUpdateInput>
  }

  /**
   * WorkforceTeam delete
   */
  export type WorkforceTeamDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeam
     */
    select?: WorkforceTeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeam
     */
    omit?: WorkforceTeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamInclude<ExtArgs> | null
    /**
     * Filter which WorkforceTeam to delete.
     */
    where: WorkforceTeamWhereUniqueInput
  }

  /**
   * WorkforceTeam deleteMany
   */
  export type WorkforceTeamDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkforceTeams to delete
     */
    where?: WorkforceTeamWhereInput
    /**
     * Limit how many WorkforceTeams to delete.
     */
    limit?: number
  }

  /**
   * WorkforceTeam.members
   */
  export type WorkforceTeam$membersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeamMember
     */
    select?: WorkforceTeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeamMember
     */
    omit?: WorkforceTeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamMemberInclude<ExtArgs> | null
    where?: WorkforceTeamMemberWhereInput
    orderBy?: WorkforceTeamMemberOrderByWithRelationInput | WorkforceTeamMemberOrderByWithRelationInput[]
    cursor?: WorkforceTeamMemberWhereUniqueInput
    take?: number
    skip?: number
    distinct?: WorkforceTeamMemberScalarFieldEnum | WorkforceTeamMemberScalarFieldEnum[]
  }

  /**
   * WorkforceTeam.tasks
   */
  export type WorkforceTeam$tasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTask
     */
    select?: WorkforceTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTask
     */
    omit?: WorkforceTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTaskInclude<ExtArgs> | null
    where?: WorkforceTaskWhereInput
    orderBy?: WorkforceTaskOrderByWithRelationInput | WorkforceTaskOrderByWithRelationInput[]
    cursor?: WorkforceTaskWhereUniqueInput
    take?: number
    skip?: number
    distinct?: WorkforceTaskScalarFieldEnum | WorkforceTaskScalarFieldEnum[]
  }

  /**
   * WorkforceTeam without action
   */
  export type WorkforceTeamDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeam
     */
    select?: WorkforceTeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeam
     */
    omit?: WorkforceTeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamInclude<ExtArgs> | null
  }


  /**
   * Model WorkforceTeamMember
   */

  export type AggregateWorkforceTeamMember = {
    _count: WorkforceTeamMemberCountAggregateOutputType | null
    _min: WorkforceTeamMemberMinAggregateOutputType | null
    _max: WorkforceTeamMemberMaxAggregateOutputType | null
  }

  export type WorkforceTeamMemberMinAggregateOutputType = {
    teamId: string | null
    employeeId: string | null
    role: string | null
    joinedAt: Date | null
  }

  export type WorkforceTeamMemberMaxAggregateOutputType = {
    teamId: string | null
    employeeId: string | null
    role: string | null
    joinedAt: Date | null
  }

  export type WorkforceTeamMemberCountAggregateOutputType = {
    teamId: number
    employeeId: number
    role: number
    joinedAt: number
    _all: number
  }


  export type WorkforceTeamMemberMinAggregateInputType = {
    teamId?: true
    employeeId?: true
    role?: true
    joinedAt?: true
  }

  export type WorkforceTeamMemberMaxAggregateInputType = {
    teamId?: true
    employeeId?: true
    role?: true
    joinedAt?: true
  }

  export type WorkforceTeamMemberCountAggregateInputType = {
    teamId?: true
    employeeId?: true
    role?: true
    joinedAt?: true
    _all?: true
  }

  export type WorkforceTeamMemberAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkforceTeamMember to aggregate.
     */
    where?: WorkforceTeamMemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkforceTeamMembers to fetch.
     */
    orderBy?: WorkforceTeamMemberOrderByWithRelationInput | WorkforceTeamMemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WorkforceTeamMemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkforceTeamMembers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkforceTeamMembers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WorkforceTeamMembers
    **/
    _count?: true | WorkforceTeamMemberCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WorkforceTeamMemberMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WorkforceTeamMemberMaxAggregateInputType
  }

  export type GetWorkforceTeamMemberAggregateType<T extends WorkforceTeamMemberAggregateArgs> = {
        [P in keyof T & keyof AggregateWorkforceTeamMember]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWorkforceTeamMember[P]>
      : GetScalarType<T[P], AggregateWorkforceTeamMember[P]>
  }




  export type WorkforceTeamMemberGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkforceTeamMemberWhereInput
    orderBy?: WorkforceTeamMemberOrderByWithAggregationInput | WorkforceTeamMemberOrderByWithAggregationInput[]
    by: WorkforceTeamMemberScalarFieldEnum[] | WorkforceTeamMemberScalarFieldEnum
    having?: WorkforceTeamMemberScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WorkforceTeamMemberCountAggregateInputType | true
    _min?: WorkforceTeamMemberMinAggregateInputType
    _max?: WorkforceTeamMemberMaxAggregateInputType
  }

  export type WorkforceTeamMemberGroupByOutputType = {
    teamId: string
    employeeId: string
    role: string
    joinedAt: Date
    _count: WorkforceTeamMemberCountAggregateOutputType | null
    _min: WorkforceTeamMemberMinAggregateOutputType | null
    _max: WorkforceTeamMemberMaxAggregateOutputType | null
  }

  type GetWorkforceTeamMemberGroupByPayload<T extends WorkforceTeamMemberGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WorkforceTeamMemberGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WorkforceTeamMemberGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WorkforceTeamMemberGroupByOutputType[P]>
            : GetScalarType<T[P], WorkforceTeamMemberGroupByOutputType[P]>
        }
      >
    >


  export type WorkforceTeamMemberSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    teamId?: boolean
    employeeId?: boolean
    role?: boolean
    joinedAt?: boolean
    team?: boolean | WorkforceTeamDefaultArgs<ExtArgs>
    employee?: boolean | WorkforceEmployeeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workforceTeamMember"]>

  export type WorkforceTeamMemberSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    teamId?: boolean
    employeeId?: boolean
    role?: boolean
    joinedAt?: boolean
    team?: boolean | WorkforceTeamDefaultArgs<ExtArgs>
    employee?: boolean | WorkforceEmployeeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workforceTeamMember"]>

  export type WorkforceTeamMemberSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    teamId?: boolean
    employeeId?: boolean
    role?: boolean
    joinedAt?: boolean
    team?: boolean | WorkforceTeamDefaultArgs<ExtArgs>
    employee?: boolean | WorkforceEmployeeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workforceTeamMember"]>

  export type WorkforceTeamMemberSelectScalar = {
    teamId?: boolean
    employeeId?: boolean
    role?: boolean
    joinedAt?: boolean
  }

  export type WorkforceTeamMemberOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"teamId" | "employeeId" | "role" | "joinedAt", ExtArgs["result"]["workforceTeamMember"]>
  export type WorkforceTeamMemberInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    team?: boolean | WorkforceTeamDefaultArgs<ExtArgs>
    employee?: boolean | WorkforceEmployeeDefaultArgs<ExtArgs>
  }
  export type WorkforceTeamMemberIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    team?: boolean | WorkforceTeamDefaultArgs<ExtArgs>
    employee?: boolean | WorkforceEmployeeDefaultArgs<ExtArgs>
  }
  export type WorkforceTeamMemberIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    team?: boolean | WorkforceTeamDefaultArgs<ExtArgs>
    employee?: boolean | WorkforceEmployeeDefaultArgs<ExtArgs>
  }

  export type $WorkforceTeamMemberPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WorkforceTeamMember"
    objects: {
      team: Prisma.$WorkforceTeamPayload<ExtArgs>
      employee: Prisma.$WorkforceEmployeePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      teamId: string
      employeeId: string
      role: string
      joinedAt: Date
    }, ExtArgs["result"]["workforceTeamMember"]>
    composites: {}
  }

  type WorkforceTeamMemberGetPayload<S extends boolean | null | undefined | WorkforceTeamMemberDefaultArgs> = $Result.GetResult<Prisma.$WorkforceTeamMemberPayload, S>

  type WorkforceTeamMemberCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WorkforceTeamMemberFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WorkforceTeamMemberCountAggregateInputType | true
    }

  export interface WorkforceTeamMemberDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WorkforceTeamMember'], meta: { name: 'WorkforceTeamMember' } }
    /**
     * Find zero or one WorkforceTeamMember that matches the filter.
     * @param {WorkforceTeamMemberFindUniqueArgs} args - Arguments to find a WorkforceTeamMember
     * @example
     * // Get one WorkforceTeamMember
     * const workforceTeamMember = await prisma.workforceTeamMember.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WorkforceTeamMemberFindUniqueArgs>(args: SelectSubset<T, WorkforceTeamMemberFindUniqueArgs<ExtArgs>>): Prisma__WorkforceTeamMemberClient<$Result.GetResult<Prisma.$WorkforceTeamMemberPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WorkforceTeamMember that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WorkforceTeamMemberFindUniqueOrThrowArgs} args - Arguments to find a WorkforceTeamMember
     * @example
     * // Get one WorkforceTeamMember
     * const workforceTeamMember = await prisma.workforceTeamMember.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WorkforceTeamMemberFindUniqueOrThrowArgs>(args: SelectSubset<T, WorkforceTeamMemberFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WorkforceTeamMemberClient<$Result.GetResult<Prisma.$WorkforceTeamMemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorkforceTeamMember that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTeamMemberFindFirstArgs} args - Arguments to find a WorkforceTeamMember
     * @example
     * // Get one WorkforceTeamMember
     * const workforceTeamMember = await prisma.workforceTeamMember.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WorkforceTeamMemberFindFirstArgs>(args?: SelectSubset<T, WorkforceTeamMemberFindFirstArgs<ExtArgs>>): Prisma__WorkforceTeamMemberClient<$Result.GetResult<Prisma.$WorkforceTeamMemberPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorkforceTeamMember that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTeamMemberFindFirstOrThrowArgs} args - Arguments to find a WorkforceTeamMember
     * @example
     * // Get one WorkforceTeamMember
     * const workforceTeamMember = await prisma.workforceTeamMember.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WorkforceTeamMemberFindFirstOrThrowArgs>(args?: SelectSubset<T, WorkforceTeamMemberFindFirstOrThrowArgs<ExtArgs>>): Prisma__WorkforceTeamMemberClient<$Result.GetResult<Prisma.$WorkforceTeamMemberPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WorkforceTeamMembers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTeamMemberFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WorkforceTeamMembers
     * const workforceTeamMembers = await prisma.workforceTeamMember.findMany()
     * 
     * // Get first 10 WorkforceTeamMembers
     * const workforceTeamMembers = await prisma.workforceTeamMember.findMany({ take: 10 })
     * 
     * // Only select the `teamId`
     * const workforceTeamMemberWithTeamIdOnly = await prisma.workforceTeamMember.findMany({ select: { teamId: true } })
     * 
     */
    findMany<T extends WorkforceTeamMemberFindManyArgs>(args?: SelectSubset<T, WorkforceTeamMemberFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkforceTeamMemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WorkforceTeamMember.
     * @param {WorkforceTeamMemberCreateArgs} args - Arguments to create a WorkforceTeamMember.
     * @example
     * // Create one WorkforceTeamMember
     * const WorkforceTeamMember = await prisma.workforceTeamMember.create({
     *   data: {
     *     // ... data to create a WorkforceTeamMember
     *   }
     * })
     * 
     */
    create<T extends WorkforceTeamMemberCreateArgs>(args: SelectSubset<T, WorkforceTeamMemberCreateArgs<ExtArgs>>): Prisma__WorkforceTeamMemberClient<$Result.GetResult<Prisma.$WorkforceTeamMemberPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WorkforceTeamMembers.
     * @param {WorkforceTeamMemberCreateManyArgs} args - Arguments to create many WorkforceTeamMembers.
     * @example
     * // Create many WorkforceTeamMembers
     * const workforceTeamMember = await prisma.workforceTeamMember.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WorkforceTeamMemberCreateManyArgs>(args?: SelectSubset<T, WorkforceTeamMemberCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WorkforceTeamMembers and returns the data saved in the database.
     * @param {WorkforceTeamMemberCreateManyAndReturnArgs} args - Arguments to create many WorkforceTeamMembers.
     * @example
     * // Create many WorkforceTeamMembers
     * const workforceTeamMember = await prisma.workforceTeamMember.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WorkforceTeamMembers and only return the `teamId`
     * const workforceTeamMemberWithTeamIdOnly = await prisma.workforceTeamMember.createManyAndReturn({
     *   select: { teamId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WorkforceTeamMemberCreateManyAndReturnArgs>(args?: SelectSubset<T, WorkforceTeamMemberCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkforceTeamMemberPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WorkforceTeamMember.
     * @param {WorkforceTeamMemberDeleteArgs} args - Arguments to delete one WorkforceTeamMember.
     * @example
     * // Delete one WorkforceTeamMember
     * const WorkforceTeamMember = await prisma.workforceTeamMember.delete({
     *   where: {
     *     // ... filter to delete one WorkforceTeamMember
     *   }
     * })
     * 
     */
    delete<T extends WorkforceTeamMemberDeleteArgs>(args: SelectSubset<T, WorkforceTeamMemberDeleteArgs<ExtArgs>>): Prisma__WorkforceTeamMemberClient<$Result.GetResult<Prisma.$WorkforceTeamMemberPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WorkforceTeamMember.
     * @param {WorkforceTeamMemberUpdateArgs} args - Arguments to update one WorkforceTeamMember.
     * @example
     * // Update one WorkforceTeamMember
     * const workforceTeamMember = await prisma.workforceTeamMember.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WorkforceTeamMemberUpdateArgs>(args: SelectSubset<T, WorkforceTeamMemberUpdateArgs<ExtArgs>>): Prisma__WorkforceTeamMemberClient<$Result.GetResult<Prisma.$WorkforceTeamMemberPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WorkforceTeamMembers.
     * @param {WorkforceTeamMemberDeleteManyArgs} args - Arguments to filter WorkforceTeamMembers to delete.
     * @example
     * // Delete a few WorkforceTeamMembers
     * const { count } = await prisma.workforceTeamMember.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WorkforceTeamMemberDeleteManyArgs>(args?: SelectSubset<T, WorkforceTeamMemberDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkforceTeamMembers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTeamMemberUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WorkforceTeamMembers
     * const workforceTeamMember = await prisma.workforceTeamMember.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WorkforceTeamMemberUpdateManyArgs>(args: SelectSubset<T, WorkforceTeamMemberUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkforceTeamMembers and returns the data updated in the database.
     * @param {WorkforceTeamMemberUpdateManyAndReturnArgs} args - Arguments to update many WorkforceTeamMembers.
     * @example
     * // Update many WorkforceTeamMembers
     * const workforceTeamMember = await prisma.workforceTeamMember.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WorkforceTeamMembers and only return the `teamId`
     * const workforceTeamMemberWithTeamIdOnly = await prisma.workforceTeamMember.updateManyAndReturn({
     *   select: { teamId: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WorkforceTeamMemberUpdateManyAndReturnArgs>(args: SelectSubset<T, WorkforceTeamMemberUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkforceTeamMemberPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WorkforceTeamMember.
     * @param {WorkforceTeamMemberUpsertArgs} args - Arguments to update or create a WorkforceTeamMember.
     * @example
     * // Update or create a WorkforceTeamMember
     * const workforceTeamMember = await prisma.workforceTeamMember.upsert({
     *   create: {
     *     // ... data to create a WorkforceTeamMember
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WorkforceTeamMember we want to update
     *   }
     * })
     */
    upsert<T extends WorkforceTeamMemberUpsertArgs>(args: SelectSubset<T, WorkforceTeamMemberUpsertArgs<ExtArgs>>): Prisma__WorkforceTeamMemberClient<$Result.GetResult<Prisma.$WorkforceTeamMemberPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WorkforceTeamMembers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTeamMemberCountArgs} args - Arguments to filter WorkforceTeamMembers to count.
     * @example
     * // Count the number of WorkforceTeamMembers
     * const count = await prisma.workforceTeamMember.count({
     *   where: {
     *     // ... the filter for the WorkforceTeamMembers we want to count
     *   }
     * })
    **/
    count<T extends WorkforceTeamMemberCountArgs>(
      args?: Subset<T, WorkforceTeamMemberCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WorkforceTeamMemberCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WorkforceTeamMember.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTeamMemberAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorkforceTeamMemberAggregateArgs>(args: Subset<T, WorkforceTeamMemberAggregateArgs>): Prisma.PrismaPromise<GetWorkforceTeamMemberAggregateType<T>>

    /**
     * Group by WorkforceTeamMember.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTeamMemberGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WorkforceTeamMemberGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WorkforceTeamMemberGroupByArgs['orderBy'] }
        : { orderBy?: WorkforceTeamMemberGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WorkforceTeamMemberGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkforceTeamMemberGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WorkforceTeamMember model
   */
  readonly fields: WorkforceTeamMemberFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WorkforceTeamMember.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WorkforceTeamMemberClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    team<T extends WorkforceTeamDefaultArgs<ExtArgs> = {}>(args?: Subset<T, WorkforceTeamDefaultArgs<ExtArgs>>): Prisma__WorkforceTeamClient<$Result.GetResult<Prisma.$WorkforceTeamPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    employee<T extends WorkforceEmployeeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, WorkforceEmployeeDefaultArgs<ExtArgs>>): Prisma__WorkforceEmployeeClient<$Result.GetResult<Prisma.$WorkforceEmployeePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WorkforceTeamMember model
   */
  interface WorkforceTeamMemberFieldRefs {
    readonly teamId: FieldRef<"WorkforceTeamMember", 'String'>
    readonly employeeId: FieldRef<"WorkforceTeamMember", 'String'>
    readonly role: FieldRef<"WorkforceTeamMember", 'String'>
    readonly joinedAt: FieldRef<"WorkforceTeamMember", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WorkforceTeamMember findUnique
   */
  export type WorkforceTeamMemberFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeamMember
     */
    select?: WorkforceTeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeamMember
     */
    omit?: WorkforceTeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamMemberInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceTeamMember to fetch.
     */
    where: WorkforceTeamMemberWhereUniqueInput
  }

  /**
   * WorkforceTeamMember findUniqueOrThrow
   */
  export type WorkforceTeamMemberFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeamMember
     */
    select?: WorkforceTeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeamMember
     */
    omit?: WorkforceTeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamMemberInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceTeamMember to fetch.
     */
    where: WorkforceTeamMemberWhereUniqueInput
  }

  /**
   * WorkforceTeamMember findFirst
   */
  export type WorkforceTeamMemberFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeamMember
     */
    select?: WorkforceTeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeamMember
     */
    omit?: WorkforceTeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamMemberInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceTeamMember to fetch.
     */
    where?: WorkforceTeamMemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkforceTeamMembers to fetch.
     */
    orderBy?: WorkforceTeamMemberOrderByWithRelationInput | WorkforceTeamMemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkforceTeamMembers.
     */
    cursor?: WorkforceTeamMemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkforceTeamMembers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkforceTeamMembers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkforceTeamMembers.
     */
    distinct?: WorkforceTeamMemberScalarFieldEnum | WorkforceTeamMemberScalarFieldEnum[]
  }

  /**
   * WorkforceTeamMember findFirstOrThrow
   */
  export type WorkforceTeamMemberFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeamMember
     */
    select?: WorkforceTeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeamMember
     */
    omit?: WorkforceTeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamMemberInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceTeamMember to fetch.
     */
    where?: WorkforceTeamMemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkforceTeamMembers to fetch.
     */
    orderBy?: WorkforceTeamMemberOrderByWithRelationInput | WorkforceTeamMemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkforceTeamMembers.
     */
    cursor?: WorkforceTeamMemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkforceTeamMembers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkforceTeamMembers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkforceTeamMembers.
     */
    distinct?: WorkforceTeamMemberScalarFieldEnum | WorkforceTeamMemberScalarFieldEnum[]
  }

  /**
   * WorkforceTeamMember findMany
   */
  export type WorkforceTeamMemberFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeamMember
     */
    select?: WorkforceTeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeamMember
     */
    omit?: WorkforceTeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamMemberInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceTeamMembers to fetch.
     */
    where?: WorkforceTeamMemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkforceTeamMembers to fetch.
     */
    orderBy?: WorkforceTeamMemberOrderByWithRelationInput | WorkforceTeamMemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WorkforceTeamMembers.
     */
    cursor?: WorkforceTeamMemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkforceTeamMembers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkforceTeamMembers.
     */
    skip?: number
    distinct?: WorkforceTeamMemberScalarFieldEnum | WorkforceTeamMemberScalarFieldEnum[]
  }

  /**
   * WorkforceTeamMember create
   */
  export type WorkforceTeamMemberCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeamMember
     */
    select?: WorkforceTeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeamMember
     */
    omit?: WorkforceTeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamMemberInclude<ExtArgs> | null
    /**
     * The data needed to create a WorkforceTeamMember.
     */
    data: XOR<WorkforceTeamMemberCreateInput, WorkforceTeamMemberUncheckedCreateInput>
  }

  /**
   * WorkforceTeamMember createMany
   */
  export type WorkforceTeamMemberCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WorkforceTeamMembers.
     */
    data: WorkforceTeamMemberCreateManyInput | WorkforceTeamMemberCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorkforceTeamMember createManyAndReturn
   */
  export type WorkforceTeamMemberCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeamMember
     */
    select?: WorkforceTeamMemberSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeamMember
     */
    omit?: WorkforceTeamMemberOmit<ExtArgs> | null
    /**
     * The data used to create many WorkforceTeamMembers.
     */
    data: WorkforceTeamMemberCreateManyInput | WorkforceTeamMemberCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamMemberIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * WorkforceTeamMember update
   */
  export type WorkforceTeamMemberUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeamMember
     */
    select?: WorkforceTeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeamMember
     */
    omit?: WorkforceTeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamMemberInclude<ExtArgs> | null
    /**
     * The data needed to update a WorkforceTeamMember.
     */
    data: XOR<WorkforceTeamMemberUpdateInput, WorkforceTeamMemberUncheckedUpdateInput>
    /**
     * Choose, which WorkforceTeamMember to update.
     */
    where: WorkforceTeamMemberWhereUniqueInput
  }

  /**
   * WorkforceTeamMember updateMany
   */
  export type WorkforceTeamMemberUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WorkforceTeamMembers.
     */
    data: XOR<WorkforceTeamMemberUpdateManyMutationInput, WorkforceTeamMemberUncheckedUpdateManyInput>
    /**
     * Filter which WorkforceTeamMembers to update
     */
    where?: WorkforceTeamMemberWhereInput
    /**
     * Limit how many WorkforceTeamMembers to update.
     */
    limit?: number
  }

  /**
   * WorkforceTeamMember updateManyAndReturn
   */
  export type WorkforceTeamMemberUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeamMember
     */
    select?: WorkforceTeamMemberSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeamMember
     */
    omit?: WorkforceTeamMemberOmit<ExtArgs> | null
    /**
     * The data used to update WorkforceTeamMembers.
     */
    data: XOR<WorkforceTeamMemberUpdateManyMutationInput, WorkforceTeamMemberUncheckedUpdateManyInput>
    /**
     * Filter which WorkforceTeamMembers to update
     */
    where?: WorkforceTeamMemberWhereInput
    /**
     * Limit how many WorkforceTeamMembers to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamMemberIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * WorkforceTeamMember upsert
   */
  export type WorkforceTeamMemberUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeamMember
     */
    select?: WorkforceTeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeamMember
     */
    omit?: WorkforceTeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamMemberInclude<ExtArgs> | null
    /**
     * The filter to search for the WorkforceTeamMember to update in case it exists.
     */
    where: WorkforceTeamMemberWhereUniqueInput
    /**
     * In case the WorkforceTeamMember found by the `where` argument doesn't exist, create a new WorkforceTeamMember with this data.
     */
    create: XOR<WorkforceTeamMemberCreateInput, WorkforceTeamMemberUncheckedCreateInput>
    /**
     * In case the WorkforceTeamMember was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WorkforceTeamMemberUpdateInput, WorkforceTeamMemberUncheckedUpdateInput>
  }

  /**
   * WorkforceTeamMember delete
   */
  export type WorkforceTeamMemberDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeamMember
     */
    select?: WorkforceTeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeamMember
     */
    omit?: WorkforceTeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamMemberInclude<ExtArgs> | null
    /**
     * Filter which WorkforceTeamMember to delete.
     */
    where: WorkforceTeamMemberWhereUniqueInput
  }

  /**
   * WorkforceTeamMember deleteMany
   */
  export type WorkforceTeamMemberDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkforceTeamMembers to delete
     */
    where?: WorkforceTeamMemberWhereInput
    /**
     * Limit how many WorkforceTeamMembers to delete.
     */
    limit?: number
  }

  /**
   * WorkforceTeamMember without action
   */
  export type WorkforceTeamMemberDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeamMember
     */
    select?: WorkforceTeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeamMember
     */
    omit?: WorkforceTeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamMemberInclude<ExtArgs> | null
  }


  /**
   * Model WorkforceTask
   */

  export type AggregateWorkforceTask = {
    _count: WorkforceTaskCountAggregateOutputType | null
    _avg: WorkforceTaskAvgAggregateOutputType | null
    _sum: WorkforceTaskSumAggregateOutputType | null
    _min: WorkforceTaskMinAggregateOutputType | null
    _max: WorkforceTaskMaxAggregateOutputType | null
  }

  export type WorkforceTaskAvgAggregateOutputType = {
    priority: number | null
  }

  export type WorkforceTaskSumAggregateOutputType = {
    priority: number | null
  }

  export type WorkforceTaskMinAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    status: $Enums.WorkforceTaskStatus | null
    dueDate: Date | null
    priority: number | null
    teamId: string | null
    assigneeEmployeeId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WorkforceTaskMaxAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    status: $Enums.WorkforceTaskStatus | null
    dueDate: Date | null
    priority: number | null
    teamId: string | null
    assigneeEmployeeId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WorkforceTaskCountAggregateOutputType = {
    id: number
    title: number
    description: number
    status: number
    dueDate: number
    priority: number
    teamId: number
    assigneeEmployeeId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type WorkforceTaskAvgAggregateInputType = {
    priority?: true
  }

  export type WorkforceTaskSumAggregateInputType = {
    priority?: true
  }

  export type WorkforceTaskMinAggregateInputType = {
    id?: true
    title?: true
    description?: true
    status?: true
    dueDate?: true
    priority?: true
    teamId?: true
    assigneeEmployeeId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WorkforceTaskMaxAggregateInputType = {
    id?: true
    title?: true
    description?: true
    status?: true
    dueDate?: true
    priority?: true
    teamId?: true
    assigneeEmployeeId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WorkforceTaskCountAggregateInputType = {
    id?: true
    title?: true
    description?: true
    status?: true
    dueDate?: true
    priority?: true
    teamId?: true
    assigneeEmployeeId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type WorkforceTaskAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkforceTask to aggregate.
     */
    where?: WorkforceTaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkforceTasks to fetch.
     */
    orderBy?: WorkforceTaskOrderByWithRelationInput | WorkforceTaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WorkforceTaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkforceTasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkforceTasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WorkforceTasks
    **/
    _count?: true | WorkforceTaskCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WorkforceTaskAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WorkforceTaskSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WorkforceTaskMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WorkforceTaskMaxAggregateInputType
  }

  export type GetWorkforceTaskAggregateType<T extends WorkforceTaskAggregateArgs> = {
        [P in keyof T & keyof AggregateWorkforceTask]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWorkforceTask[P]>
      : GetScalarType<T[P], AggregateWorkforceTask[P]>
  }




  export type WorkforceTaskGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkforceTaskWhereInput
    orderBy?: WorkforceTaskOrderByWithAggregationInput | WorkforceTaskOrderByWithAggregationInput[]
    by: WorkforceTaskScalarFieldEnum[] | WorkforceTaskScalarFieldEnum
    having?: WorkforceTaskScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WorkforceTaskCountAggregateInputType | true
    _avg?: WorkforceTaskAvgAggregateInputType
    _sum?: WorkforceTaskSumAggregateInputType
    _min?: WorkforceTaskMinAggregateInputType
    _max?: WorkforceTaskMaxAggregateInputType
  }

  export type WorkforceTaskGroupByOutputType = {
    id: string
    title: string
    description: string | null
    status: $Enums.WorkforceTaskStatus
    dueDate: Date | null
    priority: number
    teamId: string | null
    assigneeEmployeeId: string | null
    createdAt: Date
    updatedAt: Date
    _count: WorkforceTaskCountAggregateOutputType | null
    _avg: WorkforceTaskAvgAggregateOutputType | null
    _sum: WorkforceTaskSumAggregateOutputType | null
    _min: WorkforceTaskMinAggregateOutputType | null
    _max: WorkforceTaskMaxAggregateOutputType | null
  }

  type GetWorkforceTaskGroupByPayload<T extends WorkforceTaskGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WorkforceTaskGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WorkforceTaskGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WorkforceTaskGroupByOutputType[P]>
            : GetScalarType<T[P], WorkforceTaskGroupByOutputType[P]>
        }
      >
    >


  export type WorkforceTaskSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    dueDate?: boolean
    priority?: boolean
    teamId?: boolean
    assigneeEmployeeId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    team?: boolean | WorkforceTask$teamArgs<ExtArgs>
    assignee?: boolean | WorkforceTask$assigneeArgs<ExtArgs>
  }, ExtArgs["result"]["workforceTask"]>

  export type WorkforceTaskSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    dueDate?: boolean
    priority?: boolean
    teamId?: boolean
    assigneeEmployeeId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    team?: boolean | WorkforceTask$teamArgs<ExtArgs>
    assignee?: boolean | WorkforceTask$assigneeArgs<ExtArgs>
  }, ExtArgs["result"]["workforceTask"]>

  export type WorkforceTaskSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    dueDate?: boolean
    priority?: boolean
    teamId?: boolean
    assigneeEmployeeId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    team?: boolean | WorkforceTask$teamArgs<ExtArgs>
    assignee?: boolean | WorkforceTask$assigneeArgs<ExtArgs>
  }, ExtArgs["result"]["workforceTask"]>

  export type WorkforceTaskSelectScalar = {
    id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    dueDate?: boolean
    priority?: boolean
    teamId?: boolean
    assigneeEmployeeId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type WorkforceTaskOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "description" | "status" | "dueDate" | "priority" | "teamId" | "assigneeEmployeeId" | "createdAt" | "updatedAt", ExtArgs["result"]["workforceTask"]>
  export type WorkforceTaskInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    team?: boolean | WorkforceTask$teamArgs<ExtArgs>
    assignee?: boolean | WorkforceTask$assigneeArgs<ExtArgs>
  }
  export type WorkforceTaskIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    team?: boolean | WorkforceTask$teamArgs<ExtArgs>
    assignee?: boolean | WorkforceTask$assigneeArgs<ExtArgs>
  }
  export type WorkforceTaskIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    team?: boolean | WorkforceTask$teamArgs<ExtArgs>
    assignee?: boolean | WorkforceTask$assigneeArgs<ExtArgs>
  }

  export type $WorkforceTaskPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WorkforceTask"
    objects: {
      team: Prisma.$WorkforceTeamPayload<ExtArgs> | null
      assignee: Prisma.$WorkforceEmployeePayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      description: string | null
      status: $Enums.WorkforceTaskStatus
      dueDate: Date | null
      priority: number
      teamId: string | null
      assigneeEmployeeId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["workforceTask"]>
    composites: {}
  }

  type WorkforceTaskGetPayload<S extends boolean | null | undefined | WorkforceTaskDefaultArgs> = $Result.GetResult<Prisma.$WorkforceTaskPayload, S>

  type WorkforceTaskCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WorkforceTaskFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WorkforceTaskCountAggregateInputType | true
    }

  export interface WorkforceTaskDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WorkforceTask'], meta: { name: 'WorkforceTask' } }
    /**
     * Find zero or one WorkforceTask that matches the filter.
     * @param {WorkforceTaskFindUniqueArgs} args - Arguments to find a WorkforceTask
     * @example
     * // Get one WorkforceTask
     * const workforceTask = await prisma.workforceTask.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WorkforceTaskFindUniqueArgs>(args: SelectSubset<T, WorkforceTaskFindUniqueArgs<ExtArgs>>): Prisma__WorkforceTaskClient<$Result.GetResult<Prisma.$WorkforceTaskPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WorkforceTask that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WorkforceTaskFindUniqueOrThrowArgs} args - Arguments to find a WorkforceTask
     * @example
     * // Get one WorkforceTask
     * const workforceTask = await prisma.workforceTask.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WorkforceTaskFindUniqueOrThrowArgs>(args: SelectSubset<T, WorkforceTaskFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WorkforceTaskClient<$Result.GetResult<Prisma.$WorkforceTaskPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorkforceTask that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTaskFindFirstArgs} args - Arguments to find a WorkforceTask
     * @example
     * // Get one WorkforceTask
     * const workforceTask = await prisma.workforceTask.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WorkforceTaskFindFirstArgs>(args?: SelectSubset<T, WorkforceTaskFindFirstArgs<ExtArgs>>): Prisma__WorkforceTaskClient<$Result.GetResult<Prisma.$WorkforceTaskPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorkforceTask that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTaskFindFirstOrThrowArgs} args - Arguments to find a WorkforceTask
     * @example
     * // Get one WorkforceTask
     * const workforceTask = await prisma.workforceTask.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WorkforceTaskFindFirstOrThrowArgs>(args?: SelectSubset<T, WorkforceTaskFindFirstOrThrowArgs<ExtArgs>>): Prisma__WorkforceTaskClient<$Result.GetResult<Prisma.$WorkforceTaskPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WorkforceTasks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTaskFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WorkforceTasks
     * const workforceTasks = await prisma.workforceTask.findMany()
     * 
     * // Get first 10 WorkforceTasks
     * const workforceTasks = await prisma.workforceTask.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const workforceTaskWithIdOnly = await prisma.workforceTask.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WorkforceTaskFindManyArgs>(args?: SelectSubset<T, WorkforceTaskFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkforceTaskPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WorkforceTask.
     * @param {WorkforceTaskCreateArgs} args - Arguments to create a WorkforceTask.
     * @example
     * // Create one WorkforceTask
     * const WorkforceTask = await prisma.workforceTask.create({
     *   data: {
     *     // ... data to create a WorkforceTask
     *   }
     * })
     * 
     */
    create<T extends WorkforceTaskCreateArgs>(args: SelectSubset<T, WorkforceTaskCreateArgs<ExtArgs>>): Prisma__WorkforceTaskClient<$Result.GetResult<Prisma.$WorkforceTaskPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WorkforceTasks.
     * @param {WorkforceTaskCreateManyArgs} args - Arguments to create many WorkforceTasks.
     * @example
     * // Create many WorkforceTasks
     * const workforceTask = await prisma.workforceTask.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WorkforceTaskCreateManyArgs>(args?: SelectSubset<T, WorkforceTaskCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WorkforceTasks and returns the data saved in the database.
     * @param {WorkforceTaskCreateManyAndReturnArgs} args - Arguments to create many WorkforceTasks.
     * @example
     * // Create many WorkforceTasks
     * const workforceTask = await prisma.workforceTask.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WorkforceTasks and only return the `id`
     * const workforceTaskWithIdOnly = await prisma.workforceTask.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WorkforceTaskCreateManyAndReturnArgs>(args?: SelectSubset<T, WorkforceTaskCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkforceTaskPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WorkforceTask.
     * @param {WorkforceTaskDeleteArgs} args - Arguments to delete one WorkforceTask.
     * @example
     * // Delete one WorkforceTask
     * const WorkforceTask = await prisma.workforceTask.delete({
     *   where: {
     *     // ... filter to delete one WorkforceTask
     *   }
     * })
     * 
     */
    delete<T extends WorkforceTaskDeleteArgs>(args: SelectSubset<T, WorkforceTaskDeleteArgs<ExtArgs>>): Prisma__WorkforceTaskClient<$Result.GetResult<Prisma.$WorkforceTaskPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WorkforceTask.
     * @param {WorkforceTaskUpdateArgs} args - Arguments to update one WorkforceTask.
     * @example
     * // Update one WorkforceTask
     * const workforceTask = await prisma.workforceTask.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WorkforceTaskUpdateArgs>(args: SelectSubset<T, WorkforceTaskUpdateArgs<ExtArgs>>): Prisma__WorkforceTaskClient<$Result.GetResult<Prisma.$WorkforceTaskPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WorkforceTasks.
     * @param {WorkforceTaskDeleteManyArgs} args - Arguments to filter WorkforceTasks to delete.
     * @example
     * // Delete a few WorkforceTasks
     * const { count } = await prisma.workforceTask.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WorkforceTaskDeleteManyArgs>(args?: SelectSubset<T, WorkforceTaskDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkforceTasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTaskUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WorkforceTasks
     * const workforceTask = await prisma.workforceTask.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WorkforceTaskUpdateManyArgs>(args: SelectSubset<T, WorkforceTaskUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkforceTasks and returns the data updated in the database.
     * @param {WorkforceTaskUpdateManyAndReturnArgs} args - Arguments to update many WorkforceTasks.
     * @example
     * // Update many WorkforceTasks
     * const workforceTask = await prisma.workforceTask.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WorkforceTasks and only return the `id`
     * const workforceTaskWithIdOnly = await prisma.workforceTask.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WorkforceTaskUpdateManyAndReturnArgs>(args: SelectSubset<T, WorkforceTaskUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkforceTaskPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WorkforceTask.
     * @param {WorkforceTaskUpsertArgs} args - Arguments to update or create a WorkforceTask.
     * @example
     * // Update or create a WorkforceTask
     * const workforceTask = await prisma.workforceTask.upsert({
     *   create: {
     *     // ... data to create a WorkforceTask
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WorkforceTask we want to update
     *   }
     * })
     */
    upsert<T extends WorkforceTaskUpsertArgs>(args: SelectSubset<T, WorkforceTaskUpsertArgs<ExtArgs>>): Prisma__WorkforceTaskClient<$Result.GetResult<Prisma.$WorkforceTaskPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WorkforceTasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTaskCountArgs} args - Arguments to filter WorkforceTasks to count.
     * @example
     * // Count the number of WorkforceTasks
     * const count = await prisma.workforceTask.count({
     *   where: {
     *     // ... the filter for the WorkforceTasks we want to count
     *   }
     * })
    **/
    count<T extends WorkforceTaskCountArgs>(
      args?: Subset<T, WorkforceTaskCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WorkforceTaskCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WorkforceTask.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTaskAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorkforceTaskAggregateArgs>(args: Subset<T, WorkforceTaskAggregateArgs>): Prisma.PrismaPromise<GetWorkforceTaskAggregateType<T>>

    /**
     * Group by WorkforceTask.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkforceTaskGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WorkforceTaskGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WorkforceTaskGroupByArgs['orderBy'] }
        : { orderBy?: WorkforceTaskGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WorkforceTaskGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkforceTaskGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WorkforceTask model
   */
  readonly fields: WorkforceTaskFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WorkforceTask.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WorkforceTaskClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    team<T extends WorkforceTask$teamArgs<ExtArgs> = {}>(args?: Subset<T, WorkforceTask$teamArgs<ExtArgs>>): Prisma__WorkforceTeamClient<$Result.GetResult<Prisma.$WorkforceTeamPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    assignee<T extends WorkforceTask$assigneeArgs<ExtArgs> = {}>(args?: Subset<T, WorkforceTask$assigneeArgs<ExtArgs>>): Prisma__WorkforceEmployeeClient<$Result.GetResult<Prisma.$WorkforceEmployeePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WorkforceTask model
   */
  interface WorkforceTaskFieldRefs {
    readonly id: FieldRef<"WorkforceTask", 'String'>
    readonly title: FieldRef<"WorkforceTask", 'String'>
    readonly description: FieldRef<"WorkforceTask", 'String'>
    readonly status: FieldRef<"WorkforceTask", 'WorkforceTaskStatus'>
    readonly dueDate: FieldRef<"WorkforceTask", 'DateTime'>
    readonly priority: FieldRef<"WorkforceTask", 'Int'>
    readonly teamId: FieldRef<"WorkforceTask", 'String'>
    readonly assigneeEmployeeId: FieldRef<"WorkforceTask", 'String'>
    readonly createdAt: FieldRef<"WorkforceTask", 'DateTime'>
    readonly updatedAt: FieldRef<"WorkforceTask", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WorkforceTask findUnique
   */
  export type WorkforceTaskFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTask
     */
    select?: WorkforceTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTask
     */
    omit?: WorkforceTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTaskInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceTask to fetch.
     */
    where: WorkforceTaskWhereUniqueInput
  }

  /**
   * WorkforceTask findUniqueOrThrow
   */
  export type WorkforceTaskFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTask
     */
    select?: WorkforceTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTask
     */
    omit?: WorkforceTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTaskInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceTask to fetch.
     */
    where: WorkforceTaskWhereUniqueInput
  }

  /**
   * WorkforceTask findFirst
   */
  export type WorkforceTaskFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTask
     */
    select?: WorkforceTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTask
     */
    omit?: WorkforceTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTaskInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceTask to fetch.
     */
    where?: WorkforceTaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkforceTasks to fetch.
     */
    orderBy?: WorkforceTaskOrderByWithRelationInput | WorkforceTaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkforceTasks.
     */
    cursor?: WorkforceTaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkforceTasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkforceTasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkforceTasks.
     */
    distinct?: WorkforceTaskScalarFieldEnum | WorkforceTaskScalarFieldEnum[]
  }

  /**
   * WorkforceTask findFirstOrThrow
   */
  export type WorkforceTaskFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTask
     */
    select?: WorkforceTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTask
     */
    omit?: WorkforceTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTaskInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceTask to fetch.
     */
    where?: WorkforceTaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkforceTasks to fetch.
     */
    orderBy?: WorkforceTaskOrderByWithRelationInput | WorkforceTaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkforceTasks.
     */
    cursor?: WorkforceTaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkforceTasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkforceTasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkforceTasks.
     */
    distinct?: WorkforceTaskScalarFieldEnum | WorkforceTaskScalarFieldEnum[]
  }

  /**
   * WorkforceTask findMany
   */
  export type WorkforceTaskFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTask
     */
    select?: WorkforceTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTask
     */
    omit?: WorkforceTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTaskInclude<ExtArgs> | null
    /**
     * Filter, which WorkforceTasks to fetch.
     */
    where?: WorkforceTaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkforceTasks to fetch.
     */
    orderBy?: WorkforceTaskOrderByWithRelationInput | WorkforceTaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WorkforceTasks.
     */
    cursor?: WorkforceTaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkforceTasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkforceTasks.
     */
    skip?: number
    distinct?: WorkforceTaskScalarFieldEnum | WorkforceTaskScalarFieldEnum[]
  }

  /**
   * WorkforceTask create
   */
  export type WorkforceTaskCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTask
     */
    select?: WorkforceTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTask
     */
    omit?: WorkforceTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTaskInclude<ExtArgs> | null
    /**
     * The data needed to create a WorkforceTask.
     */
    data: XOR<WorkforceTaskCreateInput, WorkforceTaskUncheckedCreateInput>
  }

  /**
   * WorkforceTask createMany
   */
  export type WorkforceTaskCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WorkforceTasks.
     */
    data: WorkforceTaskCreateManyInput | WorkforceTaskCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorkforceTask createManyAndReturn
   */
  export type WorkforceTaskCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTask
     */
    select?: WorkforceTaskSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTask
     */
    omit?: WorkforceTaskOmit<ExtArgs> | null
    /**
     * The data used to create many WorkforceTasks.
     */
    data: WorkforceTaskCreateManyInput | WorkforceTaskCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTaskIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * WorkforceTask update
   */
  export type WorkforceTaskUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTask
     */
    select?: WorkforceTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTask
     */
    omit?: WorkforceTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTaskInclude<ExtArgs> | null
    /**
     * The data needed to update a WorkforceTask.
     */
    data: XOR<WorkforceTaskUpdateInput, WorkforceTaskUncheckedUpdateInput>
    /**
     * Choose, which WorkforceTask to update.
     */
    where: WorkforceTaskWhereUniqueInput
  }

  /**
   * WorkforceTask updateMany
   */
  export type WorkforceTaskUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WorkforceTasks.
     */
    data: XOR<WorkforceTaskUpdateManyMutationInput, WorkforceTaskUncheckedUpdateManyInput>
    /**
     * Filter which WorkforceTasks to update
     */
    where?: WorkforceTaskWhereInput
    /**
     * Limit how many WorkforceTasks to update.
     */
    limit?: number
  }

  /**
   * WorkforceTask updateManyAndReturn
   */
  export type WorkforceTaskUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTask
     */
    select?: WorkforceTaskSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTask
     */
    omit?: WorkforceTaskOmit<ExtArgs> | null
    /**
     * The data used to update WorkforceTasks.
     */
    data: XOR<WorkforceTaskUpdateManyMutationInput, WorkforceTaskUncheckedUpdateManyInput>
    /**
     * Filter which WorkforceTasks to update
     */
    where?: WorkforceTaskWhereInput
    /**
     * Limit how many WorkforceTasks to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTaskIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * WorkforceTask upsert
   */
  export type WorkforceTaskUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTask
     */
    select?: WorkforceTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTask
     */
    omit?: WorkforceTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTaskInclude<ExtArgs> | null
    /**
     * The filter to search for the WorkforceTask to update in case it exists.
     */
    where: WorkforceTaskWhereUniqueInput
    /**
     * In case the WorkforceTask found by the `where` argument doesn't exist, create a new WorkforceTask with this data.
     */
    create: XOR<WorkforceTaskCreateInput, WorkforceTaskUncheckedCreateInput>
    /**
     * In case the WorkforceTask was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WorkforceTaskUpdateInput, WorkforceTaskUncheckedUpdateInput>
  }

  /**
   * WorkforceTask delete
   */
  export type WorkforceTaskDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTask
     */
    select?: WorkforceTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTask
     */
    omit?: WorkforceTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTaskInclude<ExtArgs> | null
    /**
     * Filter which WorkforceTask to delete.
     */
    where: WorkforceTaskWhereUniqueInput
  }

  /**
   * WorkforceTask deleteMany
   */
  export type WorkforceTaskDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkforceTasks to delete
     */
    where?: WorkforceTaskWhereInput
    /**
     * Limit how many WorkforceTasks to delete.
     */
    limit?: number
  }

  /**
   * WorkforceTask.team
   */
  export type WorkforceTask$teamArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTeam
     */
    select?: WorkforceTeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTeam
     */
    omit?: WorkforceTeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTeamInclude<ExtArgs> | null
    where?: WorkforceTeamWhereInput
  }

  /**
   * WorkforceTask.assignee
   */
  export type WorkforceTask$assigneeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceEmployee
     */
    select?: WorkforceEmployeeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceEmployee
     */
    omit?: WorkforceEmployeeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceEmployeeInclude<ExtArgs> | null
    where?: WorkforceEmployeeWhereInput
  }

  /**
   * WorkforceTask without action
   */
  export type WorkforceTaskDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkforceTask
     */
    select?: WorkforceTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkforceTask
     */
    omit?: WorkforceTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkforceTaskInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const WorkforceEmployeeScalarFieldEnum: {
    id: 'id',
    code: 'code',
    nameAr: 'nameAr',
    department: 'department',
    jobTitle: 'jobTitle',
    active: 'active',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type WorkforceEmployeeScalarFieldEnum = (typeof WorkforceEmployeeScalarFieldEnum)[keyof typeof WorkforceEmployeeScalarFieldEnum]


  export const WorkforceTeamScalarFieldEnum: {
    id: 'id',
    key: 'key',
    nameAr: 'nameAr',
    description: 'description',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type WorkforceTeamScalarFieldEnum = (typeof WorkforceTeamScalarFieldEnum)[keyof typeof WorkforceTeamScalarFieldEnum]


  export const WorkforceTeamMemberScalarFieldEnum: {
    teamId: 'teamId',
    employeeId: 'employeeId',
    role: 'role',
    joinedAt: 'joinedAt'
  };

  export type WorkforceTeamMemberScalarFieldEnum = (typeof WorkforceTeamMemberScalarFieldEnum)[keyof typeof WorkforceTeamMemberScalarFieldEnum]


  export const WorkforceTaskScalarFieldEnum: {
    id: 'id',
    title: 'title',
    description: 'description',
    status: 'status',
    dueDate: 'dueDate',
    priority: 'priority',
    teamId: 'teamId',
    assigneeEmployeeId: 'assigneeEmployeeId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type WorkforceTaskScalarFieldEnum = (typeof WorkforceTaskScalarFieldEnum)[keyof typeof WorkforceTaskScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'WorkforceTaskStatus'
   */
  export type EnumWorkforceTaskStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WorkforceTaskStatus'>
    


  /**
   * Reference to a field of type 'WorkforceTaskStatus[]'
   */
  export type ListEnumWorkforceTaskStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WorkforceTaskStatus[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type WorkforceEmployeeWhereInput = {
    AND?: WorkforceEmployeeWhereInput | WorkforceEmployeeWhereInput[]
    OR?: WorkforceEmployeeWhereInput[]
    NOT?: WorkforceEmployeeWhereInput | WorkforceEmployeeWhereInput[]
    id?: StringFilter<"WorkforceEmployee"> | string
    code?: StringFilter<"WorkforceEmployee"> | string
    nameAr?: StringFilter<"WorkforceEmployee"> | string
    department?: StringFilter<"WorkforceEmployee"> | string
    jobTitle?: StringFilter<"WorkforceEmployee"> | string
    active?: BoolFilter<"WorkforceEmployee"> | boolean
    createdAt?: DateTimeFilter<"WorkforceEmployee"> | Date | string
    updatedAt?: DateTimeFilter<"WorkforceEmployee"> | Date | string
    memberships?: WorkforceTeamMemberListRelationFilter
    tasksAssigned?: WorkforceTaskListRelationFilter
  }

  export type WorkforceEmployeeOrderByWithRelationInput = {
    id?: SortOrder
    code?: SortOrder
    nameAr?: SortOrder
    department?: SortOrder
    jobTitle?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    memberships?: WorkforceTeamMemberOrderByRelationAggregateInput
    tasksAssigned?: WorkforceTaskOrderByRelationAggregateInput
  }

  export type WorkforceEmployeeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    code?: string
    AND?: WorkforceEmployeeWhereInput | WorkforceEmployeeWhereInput[]
    OR?: WorkforceEmployeeWhereInput[]
    NOT?: WorkforceEmployeeWhereInput | WorkforceEmployeeWhereInput[]
    nameAr?: StringFilter<"WorkforceEmployee"> | string
    department?: StringFilter<"WorkforceEmployee"> | string
    jobTitle?: StringFilter<"WorkforceEmployee"> | string
    active?: BoolFilter<"WorkforceEmployee"> | boolean
    createdAt?: DateTimeFilter<"WorkforceEmployee"> | Date | string
    updatedAt?: DateTimeFilter<"WorkforceEmployee"> | Date | string
    memberships?: WorkforceTeamMemberListRelationFilter
    tasksAssigned?: WorkforceTaskListRelationFilter
  }, "id" | "code">

  export type WorkforceEmployeeOrderByWithAggregationInput = {
    id?: SortOrder
    code?: SortOrder
    nameAr?: SortOrder
    department?: SortOrder
    jobTitle?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: WorkforceEmployeeCountOrderByAggregateInput
    _max?: WorkforceEmployeeMaxOrderByAggregateInput
    _min?: WorkforceEmployeeMinOrderByAggregateInput
  }

  export type WorkforceEmployeeScalarWhereWithAggregatesInput = {
    AND?: WorkforceEmployeeScalarWhereWithAggregatesInput | WorkforceEmployeeScalarWhereWithAggregatesInput[]
    OR?: WorkforceEmployeeScalarWhereWithAggregatesInput[]
    NOT?: WorkforceEmployeeScalarWhereWithAggregatesInput | WorkforceEmployeeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WorkforceEmployee"> | string
    code?: StringWithAggregatesFilter<"WorkforceEmployee"> | string
    nameAr?: StringWithAggregatesFilter<"WorkforceEmployee"> | string
    department?: StringWithAggregatesFilter<"WorkforceEmployee"> | string
    jobTitle?: StringWithAggregatesFilter<"WorkforceEmployee"> | string
    active?: BoolWithAggregatesFilter<"WorkforceEmployee"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"WorkforceEmployee"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"WorkforceEmployee"> | Date | string
  }

  export type WorkforceTeamWhereInput = {
    AND?: WorkforceTeamWhereInput | WorkforceTeamWhereInput[]
    OR?: WorkforceTeamWhereInput[]
    NOT?: WorkforceTeamWhereInput | WorkforceTeamWhereInput[]
    id?: StringFilter<"WorkforceTeam"> | string
    key?: StringFilter<"WorkforceTeam"> | string
    nameAr?: StringFilter<"WorkforceTeam"> | string
    description?: StringNullableFilter<"WorkforceTeam"> | string | null
    isActive?: BoolFilter<"WorkforceTeam"> | boolean
    createdAt?: DateTimeFilter<"WorkforceTeam"> | Date | string
    updatedAt?: DateTimeFilter<"WorkforceTeam"> | Date | string
    members?: WorkforceTeamMemberListRelationFilter
    tasks?: WorkforceTaskListRelationFilter
  }

  export type WorkforceTeamOrderByWithRelationInput = {
    id?: SortOrder
    key?: SortOrder
    nameAr?: SortOrder
    description?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    members?: WorkforceTeamMemberOrderByRelationAggregateInput
    tasks?: WorkforceTaskOrderByRelationAggregateInput
  }

  export type WorkforceTeamWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    key?: string
    AND?: WorkforceTeamWhereInput | WorkforceTeamWhereInput[]
    OR?: WorkforceTeamWhereInput[]
    NOT?: WorkforceTeamWhereInput | WorkforceTeamWhereInput[]
    nameAr?: StringFilter<"WorkforceTeam"> | string
    description?: StringNullableFilter<"WorkforceTeam"> | string | null
    isActive?: BoolFilter<"WorkforceTeam"> | boolean
    createdAt?: DateTimeFilter<"WorkforceTeam"> | Date | string
    updatedAt?: DateTimeFilter<"WorkforceTeam"> | Date | string
    members?: WorkforceTeamMemberListRelationFilter
    tasks?: WorkforceTaskListRelationFilter
  }, "id" | "key">

  export type WorkforceTeamOrderByWithAggregationInput = {
    id?: SortOrder
    key?: SortOrder
    nameAr?: SortOrder
    description?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: WorkforceTeamCountOrderByAggregateInput
    _max?: WorkforceTeamMaxOrderByAggregateInput
    _min?: WorkforceTeamMinOrderByAggregateInput
  }

  export type WorkforceTeamScalarWhereWithAggregatesInput = {
    AND?: WorkforceTeamScalarWhereWithAggregatesInput | WorkforceTeamScalarWhereWithAggregatesInput[]
    OR?: WorkforceTeamScalarWhereWithAggregatesInput[]
    NOT?: WorkforceTeamScalarWhereWithAggregatesInput | WorkforceTeamScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WorkforceTeam"> | string
    key?: StringWithAggregatesFilter<"WorkforceTeam"> | string
    nameAr?: StringWithAggregatesFilter<"WorkforceTeam"> | string
    description?: StringNullableWithAggregatesFilter<"WorkforceTeam"> | string | null
    isActive?: BoolWithAggregatesFilter<"WorkforceTeam"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"WorkforceTeam"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"WorkforceTeam"> | Date | string
  }

  export type WorkforceTeamMemberWhereInput = {
    AND?: WorkforceTeamMemberWhereInput | WorkforceTeamMemberWhereInput[]
    OR?: WorkforceTeamMemberWhereInput[]
    NOT?: WorkforceTeamMemberWhereInput | WorkforceTeamMemberWhereInput[]
    teamId?: StringFilter<"WorkforceTeamMember"> | string
    employeeId?: StringFilter<"WorkforceTeamMember"> | string
    role?: StringFilter<"WorkforceTeamMember"> | string
    joinedAt?: DateTimeFilter<"WorkforceTeamMember"> | Date | string
    team?: XOR<WorkforceTeamScalarRelationFilter, WorkforceTeamWhereInput>
    employee?: XOR<WorkforceEmployeeScalarRelationFilter, WorkforceEmployeeWhereInput>
  }

  export type WorkforceTeamMemberOrderByWithRelationInput = {
    teamId?: SortOrder
    employeeId?: SortOrder
    role?: SortOrder
    joinedAt?: SortOrder
    team?: WorkforceTeamOrderByWithRelationInput
    employee?: WorkforceEmployeeOrderByWithRelationInput
  }

  export type WorkforceTeamMemberWhereUniqueInput = Prisma.AtLeast<{
    teamId_employeeId?: WorkforceTeamMemberTeamIdEmployeeIdCompoundUniqueInput
    AND?: WorkforceTeamMemberWhereInput | WorkforceTeamMemberWhereInput[]
    OR?: WorkforceTeamMemberWhereInput[]
    NOT?: WorkforceTeamMemberWhereInput | WorkforceTeamMemberWhereInput[]
    teamId?: StringFilter<"WorkforceTeamMember"> | string
    employeeId?: StringFilter<"WorkforceTeamMember"> | string
    role?: StringFilter<"WorkforceTeamMember"> | string
    joinedAt?: DateTimeFilter<"WorkforceTeamMember"> | Date | string
    team?: XOR<WorkforceTeamScalarRelationFilter, WorkforceTeamWhereInput>
    employee?: XOR<WorkforceEmployeeScalarRelationFilter, WorkforceEmployeeWhereInput>
  }, "teamId_employeeId">

  export type WorkforceTeamMemberOrderByWithAggregationInput = {
    teamId?: SortOrder
    employeeId?: SortOrder
    role?: SortOrder
    joinedAt?: SortOrder
    _count?: WorkforceTeamMemberCountOrderByAggregateInput
    _max?: WorkforceTeamMemberMaxOrderByAggregateInput
    _min?: WorkforceTeamMemberMinOrderByAggregateInput
  }

  export type WorkforceTeamMemberScalarWhereWithAggregatesInput = {
    AND?: WorkforceTeamMemberScalarWhereWithAggregatesInput | WorkforceTeamMemberScalarWhereWithAggregatesInput[]
    OR?: WorkforceTeamMemberScalarWhereWithAggregatesInput[]
    NOT?: WorkforceTeamMemberScalarWhereWithAggregatesInput | WorkforceTeamMemberScalarWhereWithAggregatesInput[]
    teamId?: StringWithAggregatesFilter<"WorkforceTeamMember"> | string
    employeeId?: StringWithAggregatesFilter<"WorkforceTeamMember"> | string
    role?: StringWithAggregatesFilter<"WorkforceTeamMember"> | string
    joinedAt?: DateTimeWithAggregatesFilter<"WorkforceTeamMember"> | Date | string
  }

  export type WorkforceTaskWhereInput = {
    AND?: WorkforceTaskWhereInput | WorkforceTaskWhereInput[]
    OR?: WorkforceTaskWhereInput[]
    NOT?: WorkforceTaskWhereInput | WorkforceTaskWhereInput[]
    id?: StringFilter<"WorkforceTask"> | string
    title?: StringFilter<"WorkforceTask"> | string
    description?: StringNullableFilter<"WorkforceTask"> | string | null
    status?: EnumWorkforceTaskStatusFilter<"WorkforceTask"> | $Enums.WorkforceTaskStatus
    dueDate?: DateTimeNullableFilter<"WorkforceTask"> | Date | string | null
    priority?: IntFilter<"WorkforceTask"> | number
    teamId?: StringNullableFilter<"WorkforceTask"> | string | null
    assigneeEmployeeId?: StringNullableFilter<"WorkforceTask"> | string | null
    createdAt?: DateTimeFilter<"WorkforceTask"> | Date | string
    updatedAt?: DateTimeFilter<"WorkforceTask"> | Date | string
    team?: XOR<WorkforceTeamNullableScalarRelationFilter, WorkforceTeamWhereInput> | null
    assignee?: XOR<WorkforceEmployeeNullableScalarRelationFilter, WorkforceEmployeeWhereInput> | null
  }

  export type WorkforceTaskOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    dueDate?: SortOrderInput | SortOrder
    priority?: SortOrder
    teamId?: SortOrderInput | SortOrder
    assigneeEmployeeId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    team?: WorkforceTeamOrderByWithRelationInput
    assignee?: WorkforceEmployeeOrderByWithRelationInput
  }

  export type WorkforceTaskWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: WorkforceTaskWhereInput | WorkforceTaskWhereInput[]
    OR?: WorkforceTaskWhereInput[]
    NOT?: WorkforceTaskWhereInput | WorkforceTaskWhereInput[]
    title?: StringFilter<"WorkforceTask"> | string
    description?: StringNullableFilter<"WorkforceTask"> | string | null
    status?: EnumWorkforceTaskStatusFilter<"WorkforceTask"> | $Enums.WorkforceTaskStatus
    dueDate?: DateTimeNullableFilter<"WorkforceTask"> | Date | string | null
    priority?: IntFilter<"WorkforceTask"> | number
    teamId?: StringNullableFilter<"WorkforceTask"> | string | null
    assigneeEmployeeId?: StringNullableFilter<"WorkforceTask"> | string | null
    createdAt?: DateTimeFilter<"WorkforceTask"> | Date | string
    updatedAt?: DateTimeFilter<"WorkforceTask"> | Date | string
    team?: XOR<WorkforceTeamNullableScalarRelationFilter, WorkforceTeamWhereInput> | null
    assignee?: XOR<WorkforceEmployeeNullableScalarRelationFilter, WorkforceEmployeeWhereInput> | null
  }, "id">

  export type WorkforceTaskOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    dueDate?: SortOrderInput | SortOrder
    priority?: SortOrder
    teamId?: SortOrderInput | SortOrder
    assigneeEmployeeId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: WorkforceTaskCountOrderByAggregateInput
    _avg?: WorkforceTaskAvgOrderByAggregateInput
    _max?: WorkforceTaskMaxOrderByAggregateInput
    _min?: WorkforceTaskMinOrderByAggregateInput
    _sum?: WorkforceTaskSumOrderByAggregateInput
  }

  export type WorkforceTaskScalarWhereWithAggregatesInput = {
    AND?: WorkforceTaskScalarWhereWithAggregatesInput | WorkforceTaskScalarWhereWithAggregatesInput[]
    OR?: WorkforceTaskScalarWhereWithAggregatesInput[]
    NOT?: WorkforceTaskScalarWhereWithAggregatesInput | WorkforceTaskScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WorkforceTask"> | string
    title?: StringWithAggregatesFilter<"WorkforceTask"> | string
    description?: StringNullableWithAggregatesFilter<"WorkforceTask"> | string | null
    status?: EnumWorkforceTaskStatusWithAggregatesFilter<"WorkforceTask"> | $Enums.WorkforceTaskStatus
    dueDate?: DateTimeNullableWithAggregatesFilter<"WorkforceTask"> | Date | string | null
    priority?: IntWithAggregatesFilter<"WorkforceTask"> | number
    teamId?: StringNullableWithAggregatesFilter<"WorkforceTask"> | string | null
    assigneeEmployeeId?: StringNullableWithAggregatesFilter<"WorkforceTask"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"WorkforceTask"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"WorkforceTask"> | Date | string
  }

  export type WorkforceEmployeeCreateInput = {
    id?: string
    code: string
    nameAr: string
    department: string
    jobTitle: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    memberships?: WorkforceTeamMemberCreateNestedManyWithoutEmployeeInput
    tasksAssigned?: WorkforceTaskCreateNestedManyWithoutAssigneeInput
  }

  export type WorkforceEmployeeUncheckedCreateInput = {
    id?: string
    code: string
    nameAr: string
    department: string
    jobTitle: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    memberships?: WorkforceTeamMemberUncheckedCreateNestedManyWithoutEmployeeInput
    tasksAssigned?: WorkforceTaskUncheckedCreateNestedManyWithoutAssigneeInput
  }

  export type WorkforceEmployeeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    nameAr?: StringFieldUpdateOperationsInput | string
    department?: StringFieldUpdateOperationsInput | string
    jobTitle?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    memberships?: WorkforceTeamMemberUpdateManyWithoutEmployeeNestedInput
    tasksAssigned?: WorkforceTaskUpdateManyWithoutAssigneeNestedInput
  }

  export type WorkforceEmployeeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    nameAr?: StringFieldUpdateOperationsInput | string
    department?: StringFieldUpdateOperationsInput | string
    jobTitle?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    memberships?: WorkforceTeamMemberUncheckedUpdateManyWithoutEmployeeNestedInput
    tasksAssigned?: WorkforceTaskUncheckedUpdateManyWithoutAssigneeNestedInput
  }

  export type WorkforceEmployeeCreateManyInput = {
    id?: string
    code: string
    nameAr: string
    department: string
    jobTitle: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkforceEmployeeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    nameAr?: StringFieldUpdateOperationsInput | string
    department?: StringFieldUpdateOperationsInput | string
    jobTitle?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkforceEmployeeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    nameAr?: StringFieldUpdateOperationsInput | string
    department?: StringFieldUpdateOperationsInput | string
    jobTitle?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkforceTeamCreateInput = {
    id?: string
    key: string
    nameAr: string
    description?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    members?: WorkforceTeamMemberCreateNestedManyWithoutTeamInput
    tasks?: WorkforceTaskCreateNestedManyWithoutTeamInput
  }

  export type WorkforceTeamUncheckedCreateInput = {
    id?: string
    key: string
    nameAr: string
    description?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    members?: WorkforceTeamMemberUncheckedCreateNestedManyWithoutTeamInput
    tasks?: WorkforceTaskUncheckedCreateNestedManyWithoutTeamInput
  }

  export type WorkforceTeamUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    nameAr?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    members?: WorkforceTeamMemberUpdateManyWithoutTeamNestedInput
    tasks?: WorkforceTaskUpdateManyWithoutTeamNestedInput
  }

  export type WorkforceTeamUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    nameAr?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    members?: WorkforceTeamMemberUncheckedUpdateManyWithoutTeamNestedInput
    tasks?: WorkforceTaskUncheckedUpdateManyWithoutTeamNestedInput
  }

  export type WorkforceTeamCreateManyInput = {
    id?: string
    key: string
    nameAr: string
    description?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkforceTeamUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    nameAr?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkforceTeamUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    nameAr?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkforceTeamMemberCreateInput = {
    role?: string
    joinedAt?: Date | string
    team: WorkforceTeamCreateNestedOneWithoutMembersInput
    employee: WorkforceEmployeeCreateNestedOneWithoutMembershipsInput
  }

  export type WorkforceTeamMemberUncheckedCreateInput = {
    teamId: string
    employeeId: string
    role?: string
    joinedAt?: Date | string
  }

  export type WorkforceTeamMemberUpdateInput = {
    role?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    team?: WorkforceTeamUpdateOneRequiredWithoutMembersNestedInput
    employee?: WorkforceEmployeeUpdateOneRequiredWithoutMembershipsNestedInput
  }

  export type WorkforceTeamMemberUncheckedUpdateInput = {
    teamId?: StringFieldUpdateOperationsInput | string
    employeeId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkforceTeamMemberCreateManyInput = {
    teamId: string
    employeeId: string
    role?: string
    joinedAt?: Date | string
  }

  export type WorkforceTeamMemberUpdateManyMutationInput = {
    role?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkforceTeamMemberUncheckedUpdateManyInput = {
    teamId?: StringFieldUpdateOperationsInput | string
    employeeId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkforceTaskCreateInput = {
    id?: string
    title: string
    description?: string | null
    status?: $Enums.WorkforceTaskStatus
    dueDate?: Date | string | null
    priority?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    team?: WorkforceTeamCreateNestedOneWithoutTasksInput
    assignee?: WorkforceEmployeeCreateNestedOneWithoutTasksAssignedInput
  }

  export type WorkforceTaskUncheckedCreateInput = {
    id?: string
    title: string
    description?: string | null
    status?: $Enums.WorkforceTaskStatus
    dueDate?: Date | string | null
    priority?: number
    teamId?: string | null
    assigneeEmployeeId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkforceTaskUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumWorkforceTaskStatusFieldUpdateOperationsInput | $Enums.WorkforceTaskStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    team?: WorkforceTeamUpdateOneWithoutTasksNestedInput
    assignee?: WorkforceEmployeeUpdateOneWithoutTasksAssignedNestedInput
  }

  export type WorkforceTaskUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumWorkforceTaskStatusFieldUpdateOperationsInput | $Enums.WorkforceTaskStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: IntFieldUpdateOperationsInput | number
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    assigneeEmployeeId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkforceTaskCreateManyInput = {
    id?: string
    title: string
    description?: string | null
    status?: $Enums.WorkforceTaskStatus
    dueDate?: Date | string | null
    priority?: number
    teamId?: string | null
    assigneeEmployeeId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkforceTaskUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumWorkforceTaskStatusFieldUpdateOperationsInput | $Enums.WorkforceTaskStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkforceTaskUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumWorkforceTaskStatusFieldUpdateOperationsInput | $Enums.WorkforceTaskStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: IntFieldUpdateOperationsInput | number
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    assigneeEmployeeId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type WorkforceTeamMemberListRelationFilter = {
    every?: WorkforceTeamMemberWhereInput
    some?: WorkforceTeamMemberWhereInput
    none?: WorkforceTeamMemberWhereInput
  }

  export type WorkforceTaskListRelationFilter = {
    every?: WorkforceTaskWhereInput
    some?: WorkforceTaskWhereInput
    none?: WorkforceTaskWhereInput
  }

  export type WorkforceTeamMemberOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type WorkforceTaskOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type WorkforceEmployeeCountOrderByAggregateInput = {
    id?: SortOrder
    code?: SortOrder
    nameAr?: SortOrder
    department?: SortOrder
    jobTitle?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorkforceEmployeeMaxOrderByAggregateInput = {
    id?: SortOrder
    code?: SortOrder
    nameAr?: SortOrder
    department?: SortOrder
    jobTitle?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorkforceEmployeeMinOrderByAggregateInput = {
    id?: SortOrder
    code?: SortOrder
    nameAr?: SortOrder
    department?: SortOrder
    jobTitle?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type WorkforceTeamCountOrderByAggregateInput = {
    id?: SortOrder
    key?: SortOrder
    nameAr?: SortOrder
    description?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorkforceTeamMaxOrderByAggregateInput = {
    id?: SortOrder
    key?: SortOrder
    nameAr?: SortOrder
    description?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorkforceTeamMinOrderByAggregateInput = {
    id?: SortOrder
    key?: SortOrder
    nameAr?: SortOrder
    description?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type WorkforceTeamScalarRelationFilter = {
    is?: WorkforceTeamWhereInput
    isNot?: WorkforceTeamWhereInput
  }

  export type WorkforceEmployeeScalarRelationFilter = {
    is?: WorkforceEmployeeWhereInput
    isNot?: WorkforceEmployeeWhereInput
  }

  export type WorkforceTeamMemberTeamIdEmployeeIdCompoundUniqueInput = {
    teamId: string
    employeeId: string
  }

  export type WorkforceTeamMemberCountOrderByAggregateInput = {
    teamId?: SortOrder
    employeeId?: SortOrder
    role?: SortOrder
    joinedAt?: SortOrder
  }

  export type WorkforceTeamMemberMaxOrderByAggregateInput = {
    teamId?: SortOrder
    employeeId?: SortOrder
    role?: SortOrder
    joinedAt?: SortOrder
  }

  export type WorkforceTeamMemberMinOrderByAggregateInput = {
    teamId?: SortOrder
    employeeId?: SortOrder
    role?: SortOrder
    joinedAt?: SortOrder
  }

  export type EnumWorkforceTaskStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkforceTaskStatus | EnumWorkforceTaskStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WorkforceTaskStatus[] | ListEnumWorkforceTaskStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WorkforceTaskStatus[] | ListEnumWorkforceTaskStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWorkforceTaskStatusFilter<$PrismaModel> | $Enums.WorkforceTaskStatus
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type WorkforceTeamNullableScalarRelationFilter = {
    is?: WorkforceTeamWhereInput | null
    isNot?: WorkforceTeamWhereInput | null
  }

  export type WorkforceEmployeeNullableScalarRelationFilter = {
    is?: WorkforceEmployeeWhereInput | null
    isNot?: WorkforceEmployeeWhereInput | null
  }

  export type WorkforceTaskCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    dueDate?: SortOrder
    priority?: SortOrder
    teamId?: SortOrder
    assigneeEmployeeId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorkforceTaskAvgOrderByAggregateInput = {
    priority?: SortOrder
  }

  export type WorkforceTaskMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    dueDate?: SortOrder
    priority?: SortOrder
    teamId?: SortOrder
    assigneeEmployeeId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorkforceTaskMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    dueDate?: SortOrder
    priority?: SortOrder
    teamId?: SortOrder
    assigneeEmployeeId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorkforceTaskSumOrderByAggregateInput = {
    priority?: SortOrder
  }

  export type EnumWorkforceTaskStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkforceTaskStatus | EnumWorkforceTaskStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WorkforceTaskStatus[] | ListEnumWorkforceTaskStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WorkforceTaskStatus[] | ListEnumWorkforceTaskStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWorkforceTaskStatusWithAggregatesFilter<$PrismaModel> | $Enums.WorkforceTaskStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWorkforceTaskStatusFilter<$PrismaModel>
    _max?: NestedEnumWorkforceTaskStatusFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type WorkforceTeamMemberCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<WorkforceTeamMemberCreateWithoutEmployeeInput, WorkforceTeamMemberUncheckedCreateWithoutEmployeeInput> | WorkforceTeamMemberCreateWithoutEmployeeInput[] | WorkforceTeamMemberUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: WorkforceTeamMemberCreateOrConnectWithoutEmployeeInput | WorkforceTeamMemberCreateOrConnectWithoutEmployeeInput[]
    createMany?: WorkforceTeamMemberCreateManyEmployeeInputEnvelope
    connect?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
  }

  export type WorkforceTaskCreateNestedManyWithoutAssigneeInput = {
    create?: XOR<WorkforceTaskCreateWithoutAssigneeInput, WorkforceTaskUncheckedCreateWithoutAssigneeInput> | WorkforceTaskCreateWithoutAssigneeInput[] | WorkforceTaskUncheckedCreateWithoutAssigneeInput[]
    connectOrCreate?: WorkforceTaskCreateOrConnectWithoutAssigneeInput | WorkforceTaskCreateOrConnectWithoutAssigneeInput[]
    createMany?: WorkforceTaskCreateManyAssigneeInputEnvelope
    connect?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
  }

  export type WorkforceTeamMemberUncheckedCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<WorkforceTeamMemberCreateWithoutEmployeeInput, WorkforceTeamMemberUncheckedCreateWithoutEmployeeInput> | WorkforceTeamMemberCreateWithoutEmployeeInput[] | WorkforceTeamMemberUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: WorkforceTeamMemberCreateOrConnectWithoutEmployeeInput | WorkforceTeamMemberCreateOrConnectWithoutEmployeeInput[]
    createMany?: WorkforceTeamMemberCreateManyEmployeeInputEnvelope
    connect?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
  }

  export type WorkforceTaskUncheckedCreateNestedManyWithoutAssigneeInput = {
    create?: XOR<WorkforceTaskCreateWithoutAssigneeInput, WorkforceTaskUncheckedCreateWithoutAssigneeInput> | WorkforceTaskCreateWithoutAssigneeInput[] | WorkforceTaskUncheckedCreateWithoutAssigneeInput[]
    connectOrCreate?: WorkforceTaskCreateOrConnectWithoutAssigneeInput | WorkforceTaskCreateOrConnectWithoutAssigneeInput[]
    createMany?: WorkforceTaskCreateManyAssigneeInputEnvelope
    connect?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type WorkforceTeamMemberUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<WorkforceTeamMemberCreateWithoutEmployeeInput, WorkforceTeamMemberUncheckedCreateWithoutEmployeeInput> | WorkforceTeamMemberCreateWithoutEmployeeInput[] | WorkforceTeamMemberUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: WorkforceTeamMemberCreateOrConnectWithoutEmployeeInput | WorkforceTeamMemberCreateOrConnectWithoutEmployeeInput[]
    upsert?: WorkforceTeamMemberUpsertWithWhereUniqueWithoutEmployeeInput | WorkforceTeamMemberUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: WorkforceTeamMemberCreateManyEmployeeInputEnvelope
    set?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
    disconnect?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
    delete?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
    connect?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
    update?: WorkforceTeamMemberUpdateWithWhereUniqueWithoutEmployeeInput | WorkforceTeamMemberUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: WorkforceTeamMemberUpdateManyWithWhereWithoutEmployeeInput | WorkforceTeamMemberUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: WorkforceTeamMemberScalarWhereInput | WorkforceTeamMemberScalarWhereInput[]
  }

  export type WorkforceTaskUpdateManyWithoutAssigneeNestedInput = {
    create?: XOR<WorkforceTaskCreateWithoutAssigneeInput, WorkforceTaskUncheckedCreateWithoutAssigneeInput> | WorkforceTaskCreateWithoutAssigneeInput[] | WorkforceTaskUncheckedCreateWithoutAssigneeInput[]
    connectOrCreate?: WorkforceTaskCreateOrConnectWithoutAssigneeInput | WorkforceTaskCreateOrConnectWithoutAssigneeInput[]
    upsert?: WorkforceTaskUpsertWithWhereUniqueWithoutAssigneeInput | WorkforceTaskUpsertWithWhereUniqueWithoutAssigneeInput[]
    createMany?: WorkforceTaskCreateManyAssigneeInputEnvelope
    set?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
    disconnect?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
    delete?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
    connect?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
    update?: WorkforceTaskUpdateWithWhereUniqueWithoutAssigneeInput | WorkforceTaskUpdateWithWhereUniqueWithoutAssigneeInput[]
    updateMany?: WorkforceTaskUpdateManyWithWhereWithoutAssigneeInput | WorkforceTaskUpdateManyWithWhereWithoutAssigneeInput[]
    deleteMany?: WorkforceTaskScalarWhereInput | WorkforceTaskScalarWhereInput[]
  }

  export type WorkforceTeamMemberUncheckedUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<WorkforceTeamMemberCreateWithoutEmployeeInput, WorkforceTeamMemberUncheckedCreateWithoutEmployeeInput> | WorkforceTeamMemberCreateWithoutEmployeeInput[] | WorkforceTeamMemberUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: WorkforceTeamMemberCreateOrConnectWithoutEmployeeInput | WorkforceTeamMemberCreateOrConnectWithoutEmployeeInput[]
    upsert?: WorkforceTeamMemberUpsertWithWhereUniqueWithoutEmployeeInput | WorkforceTeamMemberUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: WorkforceTeamMemberCreateManyEmployeeInputEnvelope
    set?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
    disconnect?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
    delete?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
    connect?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
    update?: WorkforceTeamMemberUpdateWithWhereUniqueWithoutEmployeeInput | WorkforceTeamMemberUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: WorkforceTeamMemberUpdateManyWithWhereWithoutEmployeeInput | WorkforceTeamMemberUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: WorkforceTeamMemberScalarWhereInput | WorkforceTeamMemberScalarWhereInput[]
  }

  export type WorkforceTaskUncheckedUpdateManyWithoutAssigneeNestedInput = {
    create?: XOR<WorkforceTaskCreateWithoutAssigneeInput, WorkforceTaskUncheckedCreateWithoutAssigneeInput> | WorkforceTaskCreateWithoutAssigneeInput[] | WorkforceTaskUncheckedCreateWithoutAssigneeInput[]
    connectOrCreate?: WorkforceTaskCreateOrConnectWithoutAssigneeInput | WorkforceTaskCreateOrConnectWithoutAssigneeInput[]
    upsert?: WorkforceTaskUpsertWithWhereUniqueWithoutAssigneeInput | WorkforceTaskUpsertWithWhereUniqueWithoutAssigneeInput[]
    createMany?: WorkforceTaskCreateManyAssigneeInputEnvelope
    set?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
    disconnect?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
    delete?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
    connect?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
    update?: WorkforceTaskUpdateWithWhereUniqueWithoutAssigneeInput | WorkforceTaskUpdateWithWhereUniqueWithoutAssigneeInput[]
    updateMany?: WorkforceTaskUpdateManyWithWhereWithoutAssigneeInput | WorkforceTaskUpdateManyWithWhereWithoutAssigneeInput[]
    deleteMany?: WorkforceTaskScalarWhereInput | WorkforceTaskScalarWhereInput[]
  }

  export type WorkforceTeamMemberCreateNestedManyWithoutTeamInput = {
    create?: XOR<WorkforceTeamMemberCreateWithoutTeamInput, WorkforceTeamMemberUncheckedCreateWithoutTeamInput> | WorkforceTeamMemberCreateWithoutTeamInput[] | WorkforceTeamMemberUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: WorkforceTeamMemberCreateOrConnectWithoutTeamInput | WorkforceTeamMemberCreateOrConnectWithoutTeamInput[]
    createMany?: WorkforceTeamMemberCreateManyTeamInputEnvelope
    connect?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
  }

  export type WorkforceTaskCreateNestedManyWithoutTeamInput = {
    create?: XOR<WorkforceTaskCreateWithoutTeamInput, WorkforceTaskUncheckedCreateWithoutTeamInput> | WorkforceTaskCreateWithoutTeamInput[] | WorkforceTaskUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: WorkforceTaskCreateOrConnectWithoutTeamInput | WorkforceTaskCreateOrConnectWithoutTeamInput[]
    createMany?: WorkforceTaskCreateManyTeamInputEnvelope
    connect?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
  }

  export type WorkforceTeamMemberUncheckedCreateNestedManyWithoutTeamInput = {
    create?: XOR<WorkforceTeamMemberCreateWithoutTeamInput, WorkforceTeamMemberUncheckedCreateWithoutTeamInput> | WorkforceTeamMemberCreateWithoutTeamInput[] | WorkforceTeamMemberUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: WorkforceTeamMemberCreateOrConnectWithoutTeamInput | WorkforceTeamMemberCreateOrConnectWithoutTeamInput[]
    createMany?: WorkforceTeamMemberCreateManyTeamInputEnvelope
    connect?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
  }

  export type WorkforceTaskUncheckedCreateNestedManyWithoutTeamInput = {
    create?: XOR<WorkforceTaskCreateWithoutTeamInput, WorkforceTaskUncheckedCreateWithoutTeamInput> | WorkforceTaskCreateWithoutTeamInput[] | WorkforceTaskUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: WorkforceTaskCreateOrConnectWithoutTeamInput | WorkforceTaskCreateOrConnectWithoutTeamInput[]
    createMany?: WorkforceTaskCreateManyTeamInputEnvelope
    connect?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type WorkforceTeamMemberUpdateManyWithoutTeamNestedInput = {
    create?: XOR<WorkforceTeamMemberCreateWithoutTeamInput, WorkforceTeamMemberUncheckedCreateWithoutTeamInput> | WorkforceTeamMemberCreateWithoutTeamInput[] | WorkforceTeamMemberUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: WorkforceTeamMemberCreateOrConnectWithoutTeamInput | WorkforceTeamMemberCreateOrConnectWithoutTeamInput[]
    upsert?: WorkforceTeamMemberUpsertWithWhereUniqueWithoutTeamInput | WorkforceTeamMemberUpsertWithWhereUniqueWithoutTeamInput[]
    createMany?: WorkforceTeamMemberCreateManyTeamInputEnvelope
    set?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
    disconnect?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
    delete?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
    connect?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
    update?: WorkforceTeamMemberUpdateWithWhereUniqueWithoutTeamInput | WorkforceTeamMemberUpdateWithWhereUniqueWithoutTeamInput[]
    updateMany?: WorkforceTeamMemberUpdateManyWithWhereWithoutTeamInput | WorkforceTeamMemberUpdateManyWithWhereWithoutTeamInput[]
    deleteMany?: WorkforceTeamMemberScalarWhereInput | WorkforceTeamMemberScalarWhereInput[]
  }

  export type WorkforceTaskUpdateManyWithoutTeamNestedInput = {
    create?: XOR<WorkforceTaskCreateWithoutTeamInput, WorkforceTaskUncheckedCreateWithoutTeamInput> | WorkforceTaskCreateWithoutTeamInput[] | WorkforceTaskUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: WorkforceTaskCreateOrConnectWithoutTeamInput | WorkforceTaskCreateOrConnectWithoutTeamInput[]
    upsert?: WorkforceTaskUpsertWithWhereUniqueWithoutTeamInput | WorkforceTaskUpsertWithWhereUniqueWithoutTeamInput[]
    createMany?: WorkforceTaskCreateManyTeamInputEnvelope
    set?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
    disconnect?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
    delete?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
    connect?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
    update?: WorkforceTaskUpdateWithWhereUniqueWithoutTeamInput | WorkforceTaskUpdateWithWhereUniqueWithoutTeamInput[]
    updateMany?: WorkforceTaskUpdateManyWithWhereWithoutTeamInput | WorkforceTaskUpdateManyWithWhereWithoutTeamInput[]
    deleteMany?: WorkforceTaskScalarWhereInput | WorkforceTaskScalarWhereInput[]
  }

  export type WorkforceTeamMemberUncheckedUpdateManyWithoutTeamNestedInput = {
    create?: XOR<WorkforceTeamMemberCreateWithoutTeamInput, WorkforceTeamMemberUncheckedCreateWithoutTeamInput> | WorkforceTeamMemberCreateWithoutTeamInput[] | WorkforceTeamMemberUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: WorkforceTeamMemberCreateOrConnectWithoutTeamInput | WorkforceTeamMemberCreateOrConnectWithoutTeamInput[]
    upsert?: WorkforceTeamMemberUpsertWithWhereUniqueWithoutTeamInput | WorkforceTeamMemberUpsertWithWhereUniqueWithoutTeamInput[]
    createMany?: WorkforceTeamMemberCreateManyTeamInputEnvelope
    set?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
    disconnect?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
    delete?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
    connect?: WorkforceTeamMemberWhereUniqueInput | WorkforceTeamMemberWhereUniqueInput[]
    update?: WorkforceTeamMemberUpdateWithWhereUniqueWithoutTeamInput | WorkforceTeamMemberUpdateWithWhereUniqueWithoutTeamInput[]
    updateMany?: WorkforceTeamMemberUpdateManyWithWhereWithoutTeamInput | WorkforceTeamMemberUpdateManyWithWhereWithoutTeamInput[]
    deleteMany?: WorkforceTeamMemberScalarWhereInput | WorkforceTeamMemberScalarWhereInput[]
  }

  export type WorkforceTaskUncheckedUpdateManyWithoutTeamNestedInput = {
    create?: XOR<WorkforceTaskCreateWithoutTeamInput, WorkforceTaskUncheckedCreateWithoutTeamInput> | WorkforceTaskCreateWithoutTeamInput[] | WorkforceTaskUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: WorkforceTaskCreateOrConnectWithoutTeamInput | WorkforceTaskCreateOrConnectWithoutTeamInput[]
    upsert?: WorkforceTaskUpsertWithWhereUniqueWithoutTeamInput | WorkforceTaskUpsertWithWhereUniqueWithoutTeamInput[]
    createMany?: WorkforceTaskCreateManyTeamInputEnvelope
    set?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
    disconnect?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
    delete?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
    connect?: WorkforceTaskWhereUniqueInput | WorkforceTaskWhereUniqueInput[]
    update?: WorkforceTaskUpdateWithWhereUniqueWithoutTeamInput | WorkforceTaskUpdateWithWhereUniqueWithoutTeamInput[]
    updateMany?: WorkforceTaskUpdateManyWithWhereWithoutTeamInput | WorkforceTaskUpdateManyWithWhereWithoutTeamInput[]
    deleteMany?: WorkforceTaskScalarWhereInput | WorkforceTaskScalarWhereInput[]
  }

  export type WorkforceTeamCreateNestedOneWithoutMembersInput = {
    create?: XOR<WorkforceTeamCreateWithoutMembersInput, WorkforceTeamUncheckedCreateWithoutMembersInput>
    connectOrCreate?: WorkforceTeamCreateOrConnectWithoutMembersInput
    connect?: WorkforceTeamWhereUniqueInput
  }

  export type WorkforceEmployeeCreateNestedOneWithoutMembershipsInput = {
    create?: XOR<WorkforceEmployeeCreateWithoutMembershipsInput, WorkforceEmployeeUncheckedCreateWithoutMembershipsInput>
    connectOrCreate?: WorkforceEmployeeCreateOrConnectWithoutMembershipsInput
    connect?: WorkforceEmployeeWhereUniqueInput
  }

  export type WorkforceTeamUpdateOneRequiredWithoutMembersNestedInput = {
    create?: XOR<WorkforceTeamCreateWithoutMembersInput, WorkforceTeamUncheckedCreateWithoutMembersInput>
    connectOrCreate?: WorkforceTeamCreateOrConnectWithoutMembersInput
    upsert?: WorkforceTeamUpsertWithoutMembersInput
    connect?: WorkforceTeamWhereUniqueInput
    update?: XOR<XOR<WorkforceTeamUpdateToOneWithWhereWithoutMembersInput, WorkforceTeamUpdateWithoutMembersInput>, WorkforceTeamUncheckedUpdateWithoutMembersInput>
  }

  export type WorkforceEmployeeUpdateOneRequiredWithoutMembershipsNestedInput = {
    create?: XOR<WorkforceEmployeeCreateWithoutMembershipsInput, WorkforceEmployeeUncheckedCreateWithoutMembershipsInput>
    connectOrCreate?: WorkforceEmployeeCreateOrConnectWithoutMembershipsInput
    upsert?: WorkforceEmployeeUpsertWithoutMembershipsInput
    connect?: WorkforceEmployeeWhereUniqueInput
    update?: XOR<XOR<WorkforceEmployeeUpdateToOneWithWhereWithoutMembershipsInput, WorkforceEmployeeUpdateWithoutMembershipsInput>, WorkforceEmployeeUncheckedUpdateWithoutMembershipsInput>
  }

  export type WorkforceTeamCreateNestedOneWithoutTasksInput = {
    create?: XOR<WorkforceTeamCreateWithoutTasksInput, WorkforceTeamUncheckedCreateWithoutTasksInput>
    connectOrCreate?: WorkforceTeamCreateOrConnectWithoutTasksInput
    connect?: WorkforceTeamWhereUniqueInput
  }

  export type WorkforceEmployeeCreateNestedOneWithoutTasksAssignedInput = {
    create?: XOR<WorkforceEmployeeCreateWithoutTasksAssignedInput, WorkforceEmployeeUncheckedCreateWithoutTasksAssignedInput>
    connectOrCreate?: WorkforceEmployeeCreateOrConnectWithoutTasksAssignedInput
    connect?: WorkforceEmployeeWhereUniqueInput
  }

  export type EnumWorkforceTaskStatusFieldUpdateOperationsInput = {
    set?: $Enums.WorkforceTaskStatus
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type WorkforceTeamUpdateOneWithoutTasksNestedInput = {
    create?: XOR<WorkforceTeamCreateWithoutTasksInput, WorkforceTeamUncheckedCreateWithoutTasksInput>
    connectOrCreate?: WorkforceTeamCreateOrConnectWithoutTasksInput
    upsert?: WorkforceTeamUpsertWithoutTasksInput
    disconnect?: WorkforceTeamWhereInput | boolean
    delete?: WorkforceTeamWhereInput | boolean
    connect?: WorkforceTeamWhereUniqueInput
    update?: XOR<XOR<WorkforceTeamUpdateToOneWithWhereWithoutTasksInput, WorkforceTeamUpdateWithoutTasksInput>, WorkforceTeamUncheckedUpdateWithoutTasksInput>
  }

  export type WorkforceEmployeeUpdateOneWithoutTasksAssignedNestedInput = {
    create?: XOR<WorkforceEmployeeCreateWithoutTasksAssignedInput, WorkforceEmployeeUncheckedCreateWithoutTasksAssignedInput>
    connectOrCreate?: WorkforceEmployeeCreateOrConnectWithoutTasksAssignedInput
    upsert?: WorkforceEmployeeUpsertWithoutTasksAssignedInput
    disconnect?: WorkforceEmployeeWhereInput | boolean
    delete?: WorkforceEmployeeWhereInput | boolean
    connect?: WorkforceEmployeeWhereUniqueInput
    update?: XOR<XOR<WorkforceEmployeeUpdateToOneWithWhereWithoutTasksAssignedInput, WorkforceEmployeeUpdateWithoutTasksAssignedInput>, WorkforceEmployeeUncheckedUpdateWithoutTasksAssignedInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumWorkforceTaskStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkforceTaskStatus | EnumWorkforceTaskStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WorkforceTaskStatus[] | ListEnumWorkforceTaskStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WorkforceTaskStatus[] | ListEnumWorkforceTaskStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWorkforceTaskStatusFilter<$PrismaModel> | $Enums.WorkforceTaskStatus
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedEnumWorkforceTaskStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkforceTaskStatus | EnumWorkforceTaskStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WorkforceTaskStatus[] | ListEnumWorkforceTaskStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WorkforceTaskStatus[] | ListEnumWorkforceTaskStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWorkforceTaskStatusWithAggregatesFilter<$PrismaModel> | $Enums.WorkforceTaskStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWorkforceTaskStatusFilter<$PrismaModel>
    _max?: NestedEnumWorkforceTaskStatusFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type WorkforceTeamMemberCreateWithoutEmployeeInput = {
    role?: string
    joinedAt?: Date | string
    team: WorkforceTeamCreateNestedOneWithoutMembersInput
  }

  export type WorkforceTeamMemberUncheckedCreateWithoutEmployeeInput = {
    teamId: string
    role?: string
    joinedAt?: Date | string
  }

  export type WorkforceTeamMemberCreateOrConnectWithoutEmployeeInput = {
    where: WorkforceTeamMemberWhereUniqueInput
    create: XOR<WorkforceTeamMemberCreateWithoutEmployeeInput, WorkforceTeamMemberUncheckedCreateWithoutEmployeeInput>
  }

  export type WorkforceTeamMemberCreateManyEmployeeInputEnvelope = {
    data: WorkforceTeamMemberCreateManyEmployeeInput | WorkforceTeamMemberCreateManyEmployeeInput[]
    skipDuplicates?: boolean
  }

  export type WorkforceTaskCreateWithoutAssigneeInput = {
    id?: string
    title: string
    description?: string | null
    status?: $Enums.WorkforceTaskStatus
    dueDate?: Date | string | null
    priority?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    team?: WorkforceTeamCreateNestedOneWithoutTasksInput
  }

  export type WorkforceTaskUncheckedCreateWithoutAssigneeInput = {
    id?: string
    title: string
    description?: string | null
    status?: $Enums.WorkforceTaskStatus
    dueDate?: Date | string | null
    priority?: number
    teamId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkforceTaskCreateOrConnectWithoutAssigneeInput = {
    where: WorkforceTaskWhereUniqueInput
    create: XOR<WorkforceTaskCreateWithoutAssigneeInput, WorkforceTaskUncheckedCreateWithoutAssigneeInput>
  }

  export type WorkforceTaskCreateManyAssigneeInputEnvelope = {
    data: WorkforceTaskCreateManyAssigneeInput | WorkforceTaskCreateManyAssigneeInput[]
    skipDuplicates?: boolean
  }

  export type WorkforceTeamMemberUpsertWithWhereUniqueWithoutEmployeeInput = {
    where: WorkforceTeamMemberWhereUniqueInput
    update: XOR<WorkforceTeamMemberUpdateWithoutEmployeeInput, WorkforceTeamMemberUncheckedUpdateWithoutEmployeeInput>
    create: XOR<WorkforceTeamMemberCreateWithoutEmployeeInput, WorkforceTeamMemberUncheckedCreateWithoutEmployeeInput>
  }

  export type WorkforceTeamMemberUpdateWithWhereUniqueWithoutEmployeeInput = {
    where: WorkforceTeamMemberWhereUniqueInput
    data: XOR<WorkforceTeamMemberUpdateWithoutEmployeeInput, WorkforceTeamMemberUncheckedUpdateWithoutEmployeeInput>
  }

  export type WorkforceTeamMemberUpdateManyWithWhereWithoutEmployeeInput = {
    where: WorkforceTeamMemberScalarWhereInput
    data: XOR<WorkforceTeamMemberUpdateManyMutationInput, WorkforceTeamMemberUncheckedUpdateManyWithoutEmployeeInput>
  }

  export type WorkforceTeamMemberScalarWhereInput = {
    AND?: WorkforceTeamMemberScalarWhereInput | WorkforceTeamMemberScalarWhereInput[]
    OR?: WorkforceTeamMemberScalarWhereInput[]
    NOT?: WorkforceTeamMemberScalarWhereInput | WorkforceTeamMemberScalarWhereInput[]
    teamId?: StringFilter<"WorkforceTeamMember"> | string
    employeeId?: StringFilter<"WorkforceTeamMember"> | string
    role?: StringFilter<"WorkforceTeamMember"> | string
    joinedAt?: DateTimeFilter<"WorkforceTeamMember"> | Date | string
  }

  export type WorkforceTaskUpsertWithWhereUniqueWithoutAssigneeInput = {
    where: WorkforceTaskWhereUniqueInput
    update: XOR<WorkforceTaskUpdateWithoutAssigneeInput, WorkforceTaskUncheckedUpdateWithoutAssigneeInput>
    create: XOR<WorkforceTaskCreateWithoutAssigneeInput, WorkforceTaskUncheckedCreateWithoutAssigneeInput>
  }

  export type WorkforceTaskUpdateWithWhereUniqueWithoutAssigneeInput = {
    where: WorkforceTaskWhereUniqueInput
    data: XOR<WorkforceTaskUpdateWithoutAssigneeInput, WorkforceTaskUncheckedUpdateWithoutAssigneeInput>
  }

  export type WorkforceTaskUpdateManyWithWhereWithoutAssigneeInput = {
    where: WorkforceTaskScalarWhereInput
    data: XOR<WorkforceTaskUpdateManyMutationInput, WorkforceTaskUncheckedUpdateManyWithoutAssigneeInput>
  }

  export type WorkforceTaskScalarWhereInput = {
    AND?: WorkforceTaskScalarWhereInput | WorkforceTaskScalarWhereInput[]
    OR?: WorkforceTaskScalarWhereInput[]
    NOT?: WorkforceTaskScalarWhereInput | WorkforceTaskScalarWhereInput[]
    id?: StringFilter<"WorkforceTask"> | string
    title?: StringFilter<"WorkforceTask"> | string
    description?: StringNullableFilter<"WorkforceTask"> | string | null
    status?: EnumWorkforceTaskStatusFilter<"WorkforceTask"> | $Enums.WorkforceTaskStatus
    dueDate?: DateTimeNullableFilter<"WorkforceTask"> | Date | string | null
    priority?: IntFilter<"WorkforceTask"> | number
    teamId?: StringNullableFilter<"WorkforceTask"> | string | null
    assigneeEmployeeId?: StringNullableFilter<"WorkforceTask"> | string | null
    createdAt?: DateTimeFilter<"WorkforceTask"> | Date | string
    updatedAt?: DateTimeFilter<"WorkforceTask"> | Date | string
  }

  export type WorkforceTeamMemberCreateWithoutTeamInput = {
    role?: string
    joinedAt?: Date | string
    employee: WorkforceEmployeeCreateNestedOneWithoutMembershipsInput
  }

  export type WorkforceTeamMemberUncheckedCreateWithoutTeamInput = {
    employeeId: string
    role?: string
    joinedAt?: Date | string
  }

  export type WorkforceTeamMemberCreateOrConnectWithoutTeamInput = {
    where: WorkforceTeamMemberWhereUniqueInput
    create: XOR<WorkforceTeamMemberCreateWithoutTeamInput, WorkforceTeamMemberUncheckedCreateWithoutTeamInput>
  }

  export type WorkforceTeamMemberCreateManyTeamInputEnvelope = {
    data: WorkforceTeamMemberCreateManyTeamInput | WorkforceTeamMemberCreateManyTeamInput[]
    skipDuplicates?: boolean
  }

  export type WorkforceTaskCreateWithoutTeamInput = {
    id?: string
    title: string
    description?: string | null
    status?: $Enums.WorkforceTaskStatus
    dueDate?: Date | string | null
    priority?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    assignee?: WorkforceEmployeeCreateNestedOneWithoutTasksAssignedInput
  }

  export type WorkforceTaskUncheckedCreateWithoutTeamInput = {
    id?: string
    title: string
    description?: string | null
    status?: $Enums.WorkforceTaskStatus
    dueDate?: Date | string | null
    priority?: number
    assigneeEmployeeId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkforceTaskCreateOrConnectWithoutTeamInput = {
    where: WorkforceTaskWhereUniqueInput
    create: XOR<WorkforceTaskCreateWithoutTeamInput, WorkforceTaskUncheckedCreateWithoutTeamInput>
  }

  export type WorkforceTaskCreateManyTeamInputEnvelope = {
    data: WorkforceTaskCreateManyTeamInput | WorkforceTaskCreateManyTeamInput[]
    skipDuplicates?: boolean
  }

  export type WorkforceTeamMemberUpsertWithWhereUniqueWithoutTeamInput = {
    where: WorkforceTeamMemberWhereUniqueInput
    update: XOR<WorkforceTeamMemberUpdateWithoutTeamInput, WorkforceTeamMemberUncheckedUpdateWithoutTeamInput>
    create: XOR<WorkforceTeamMemberCreateWithoutTeamInput, WorkforceTeamMemberUncheckedCreateWithoutTeamInput>
  }

  export type WorkforceTeamMemberUpdateWithWhereUniqueWithoutTeamInput = {
    where: WorkforceTeamMemberWhereUniqueInput
    data: XOR<WorkforceTeamMemberUpdateWithoutTeamInput, WorkforceTeamMemberUncheckedUpdateWithoutTeamInput>
  }

  export type WorkforceTeamMemberUpdateManyWithWhereWithoutTeamInput = {
    where: WorkforceTeamMemberScalarWhereInput
    data: XOR<WorkforceTeamMemberUpdateManyMutationInput, WorkforceTeamMemberUncheckedUpdateManyWithoutTeamInput>
  }

  export type WorkforceTaskUpsertWithWhereUniqueWithoutTeamInput = {
    where: WorkforceTaskWhereUniqueInput
    update: XOR<WorkforceTaskUpdateWithoutTeamInput, WorkforceTaskUncheckedUpdateWithoutTeamInput>
    create: XOR<WorkforceTaskCreateWithoutTeamInput, WorkforceTaskUncheckedCreateWithoutTeamInput>
  }

  export type WorkforceTaskUpdateWithWhereUniqueWithoutTeamInput = {
    where: WorkforceTaskWhereUniqueInput
    data: XOR<WorkforceTaskUpdateWithoutTeamInput, WorkforceTaskUncheckedUpdateWithoutTeamInput>
  }

  export type WorkforceTaskUpdateManyWithWhereWithoutTeamInput = {
    where: WorkforceTaskScalarWhereInput
    data: XOR<WorkforceTaskUpdateManyMutationInput, WorkforceTaskUncheckedUpdateManyWithoutTeamInput>
  }

  export type WorkforceTeamCreateWithoutMembersInput = {
    id?: string
    key: string
    nameAr: string
    description?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    tasks?: WorkforceTaskCreateNestedManyWithoutTeamInput
  }

  export type WorkforceTeamUncheckedCreateWithoutMembersInput = {
    id?: string
    key: string
    nameAr: string
    description?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    tasks?: WorkforceTaskUncheckedCreateNestedManyWithoutTeamInput
  }

  export type WorkforceTeamCreateOrConnectWithoutMembersInput = {
    where: WorkforceTeamWhereUniqueInput
    create: XOR<WorkforceTeamCreateWithoutMembersInput, WorkforceTeamUncheckedCreateWithoutMembersInput>
  }

  export type WorkforceEmployeeCreateWithoutMembershipsInput = {
    id?: string
    code: string
    nameAr: string
    department: string
    jobTitle: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    tasksAssigned?: WorkforceTaskCreateNestedManyWithoutAssigneeInput
  }

  export type WorkforceEmployeeUncheckedCreateWithoutMembershipsInput = {
    id?: string
    code: string
    nameAr: string
    department: string
    jobTitle: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    tasksAssigned?: WorkforceTaskUncheckedCreateNestedManyWithoutAssigneeInput
  }

  export type WorkforceEmployeeCreateOrConnectWithoutMembershipsInput = {
    where: WorkforceEmployeeWhereUniqueInput
    create: XOR<WorkforceEmployeeCreateWithoutMembershipsInput, WorkforceEmployeeUncheckedCreateWithoutMembershipsInput>
  }

  export type WorkforceTeamUpsertWithoutMembersInput = {
    update: XOR<WorkforceTeamUpdateWithoutMembersInput, WorkforceTeamUncheckedUpdateWithoutMembersInput>
    create: XOR<WorkforceTeamCreateWithoutMembersInput, WorkforceTeamUncheckedCreateWithoutMembersInput>
    where?: WorkforceTeamWhereInput
  }

  export type WorkforceTeamUpdateToOneWithWhereWithoutMembersInput = {
    where?: WorkforceTeamWhereInput
    data: XOR<WorkforceTeamUpdateWithoutMembersInput, WorkforceTeamUncheckedUpdateWithoutMembersInput>
  }

  export type WorkforceTeamUpdateWithoutMembersInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    nameAr?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasks?: WorkforceTaskUpdateManyWithoutTeamNestedInput
  }

  export type WorkforceTeamUncheckedUpdateWithoutMembersInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    nameAr?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasks?: WorkforceTaskUncheckedUpdateManyWithoutTeamNestedInput
  }

  export type WorkforceEmployeeUpsertWithoutMembershipsInput = {
    update: XOR<WorkforceEmployeeUpdateWithoutMembershipsInput, WorkforceEmployeeUncheckedUpdateWithoutMembershipsInput>
    create: XOR<WorkforceEmployeeCreateWithoutMembershipsInput, WorkforceEmployeeUncheckedCreateWithoutMembershipsInput>
    where?: WorkforceEmployeeWhereInput
  }

  export type WorkforceEmployeeUpdateToOneWithWhereWithoutMembershipsInput = {
    where?: WorkforceEmployeeWhereInput
    data: XOR<WorkforceEmployeeUpdateWithoutMembershipsInput, WorkforceEmployeeUncheckedUpdateWithoutMembershipsInput>
  }

  export type WorkforceEmployeeUpdateWithoutMembershipsInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    nameAr?: StringFieldUpdateOperationsInput | string
    department?: StringFieldUpdateOperationsInput | string
    jobTitle?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasksAssigned?: WorkforceTaskUpdateManyWithoutAssigneeNestedInput
  }

  export type WorkforceEmployeeUncheckedUpdateWithoutMembershipsInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    nameAr?: StringFieldUpdateOperationsInput | string
    department?: StringFieldUpdateOperationsInput | string
    jobTitle?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasksAssigned?: WorkforceTaskUncheckedUpdateManyWithoutAssigneeNestedInput
  }

  export type WorkforceTeamCreateWithoutTasksInput = {
    id?: string
    key: string
    nameAr: string
    description?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    members?: WorkforceTeamMemberCreateNestedManyWithoutTeamInput
  }

  export type WorkforceTeamUncheckedCreateWithoutTasksInput = {
    id?: string
    key: string
    nameAr: string
    description?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    members?: WorkforceTeamMemberUncheckedCreateNestedManyWithoutTeamInput
  }

  export type WorkforceTeamCreateOrConnectWithoutTasksInput = {
    where: WorkforceTeamWhereUniqueInput
    create: XOR<WorkforceTeamCreateWithoutTasksInput, WorkforceTeamUncheckedCreateWithoutTasksInput>
  }

  export type WorkforceEmployeeCreateWithoutTasksAssignedInput = {
    id?: string
    code: string
    nameAr: string
    department: string
    jobTitle: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    memberships?: WorkforceTeamMemberCreateNestedManyWithoutEmployeeInput
  }

  export type WorkforceEmployeeUncheckedCreateWithoutTasksAssignedInput = {
    id?: string
    code: string
    nameAr: string
    department: string
    jobTitle: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    memberships?: WorkforceTeamMemberUncheckedCreateNestedManyWithoutEmployeeInput
  }

  export type WorkforceEmployeeCreateOrConnectWithoutTasksAssignedInput = {
    where: WorkforceEmployeeWhereUniqueInput
    create: XOR<WorkforceEmployeeCreateWithoutTasksAssignedInput, WorkforceEmployeeUncheckedCreateWithoutTasksAssignedInput>
  }

  export type WorkforceTeamUpsertWithoutTasksInput = {
    update: XOR<WorkforceTeamUpdateWithoutTasksInput, WorkforceTeamUncheckedUpdateWithoutTasksInput>
    create: XOR<WorkforceTeamCreateWithoutTasksInput, WorkforceTeamUncheckedCreateWithoutTasksInput>
    where?: WorkforceTeamWhereInput
  }

  export type WorkforceTeamUpdateToOneWithWhereWithoutTasksInput = {
    where?: WorkforceTeamWhereInput
    data: XOR<WorkforceTeamUpdateWithoutTasksInput, WorkforceTeamUncheckedUpdateWithoutTasksInput>
  }

  export type WorkforceTeamUpdateWithoutTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    nameAr?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    members?: WorkforceTeamMemberUpdateManyWithoutTeamNestedInput
  }

  export type WorkforceTeamUncheckedUpdateWithoutTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    nameAr?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    members?: WorkforceTeamMemberUncheckedUpdateManyWithoutTeamNestedInput
  }

  export type WorkforceEmployeeUpsertWithoutTasksAssignedInput = {
    update: XOR<WorkforceEmployeeUpdateWithoutTasksAssignedInput, WorkforceEmployeeUncheckedUpdateWithoutTasksAssignedInput>
    create: XOR<WorkforceEmployeeCreateWithoutTasksAssignedInput, WorkforceEmployeeUncheckedCreateWithoutTasksAssignedInput>
    where?: WorkforceEmployeeWhereInput
  }

  export type WorkforceEmployeeUpdateToOneWithWhereWithoutTasksAssignedInput = {
    where?: WorkforceEmployeeWhereInput
    data: XOR<WorkforceEmployeeUpdateWithoutTasksAssignedInput, WorkforceEmployeeUncheckedUpdateWithoutTasksAssignedInput>
  }

  export type WorkforceEmployeeUpdateWithoutTasksAssignedInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    nameAr?: StringFieldUpdateOperationsInput | string
    department?: StringFieldUpdateOperationsInput | string
    jobTitle?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    memberships?: WorkforceTeamMemberUpdateManyWithoutEmployeeNestedInput
  }

  export type WorkforceEmployeeUncheckedUpdateWithoutTasksAssignedInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    nameAr?: StringFieldUpdateOperationsInput | string
    department?: StringFieldUpdateOperationsInput | string
    jobTitle?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    memberships?: WorkforceTeamMemberUncheckedUpdateManyWithoutEmployeeNestedInput
  }

  export type WorkforceTeamMemberCreateManyEmployeeInput = {
    teamId: string
    role?: string
    joinedAt?: Date | string
  }

  export type WorkforceTaskCreateManyAssigneeInput = {
    id?: string
    title: string
    description?: string | null
    status?: $Enums.WorkforceTaskStatus
    dueDate?: Date | string | null
    priority?: number
    teamId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkforceTeamMemberUpdateWithoutEmployeeInput = {
    role?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    team?: WorkforceTeamUpdateOneRequiredWithoutMembersNestedInput
  }

  export type WorkforceTeamMemberUncheckedUpdateWithoutEmployeeInput = {
    teamId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkforceTeamMemberUncheckedUpdateManyWithoutEmployeeInput = {
    teamId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkforceTaskUpdateWithoutAssigneeInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumWorkforceTaskStatusFieldUpdateOperationsInput | $Enums.WorkforceTaskStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    team?: WorkforceTeamUpdateOneWithoutTasksNestedInput
  }

  export type WorkforceTaskUncheckedUpdateWithoutAssigneeInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumWorkforceTaskStatusFieldUpdateOperationsInput | $Enums.WorkforceTaskStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: IntFieldUpdateOperationsInput | number
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkforceTaskUncheckedUpdateManyWithoutAssigneeInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumWorkforceTaskStatusFieldUpdateOperationsInput | $Enums.WorkforceTaskStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: IntFieldUpdateOperationsInput | number
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkforceTeamMemberCreateManyTeamInput = {
    employeeId: string
    role?: string
    joinedAt?: Date | string
  }

  export type WorkforceTaskCreateManyTeamInput = {
    id?: string
    title: string
    description?: string | null
    status?: $Enums.WorkforceTaskStatus
    dueDate?: Date | string | null
    priority?: number
    assigneeEmployeeId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkforceTeamMemberUpdateWithoutTeamInput = {
    role?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    employee?: WorkforceEmployeeUpdateOneRequiredWithoutMembershipsNestedInput
  }

  export type WorkforceTeamMemberUncheckedUpdateWithoutTeamInput = {
    employeeId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkforceTeamMemberUncheckedUpdateManyWithoutTeamInput = {
    employeeId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkforceTaskUpdateWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumWorkforceTaskStatusFieldUpdateOperationsInput | $Enums.WorkforceTaskStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    assignee?: WorkforceEmployeeUpdateOneWithoutTasksAssignedNestedInput
  }

  export type WorkforceTaskUncheckedUpdateWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumWorkforceTaskStatusFieldUpdateOperationsInput | $Enums.WorkforceTaskStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: IntFieldUpdateOperationsInput | number
    assigneeEmployeeId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkforceTaskUncheckedUpdateManyWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumWorkforceTaskStatusFieldUpdateOperationsInput | $Enums.WorkforceTaskStatus
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    priority?: IntFieldUpdateOperationsInput | number
    assigneeEmployeeId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}