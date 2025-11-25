# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMyItineraries*](#getmyitineraries)
  - [*ListPublicReligiousPlaces*](#listpublicreligiousplaces)
- [**Mutations**](#mutations)
  - [*CreateNewItinerary*](#createnewitinerary)
  - [*AddReligiousPlaceToItinerary*](#addreligiousplacetoitinerary)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMyItineraries
You can execute the `GetMyItineraries` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyItineraries(): QueryPromise<GetMyItinerariesData, undefined>;

interface GetMyItinerariesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyItinerariesData, undefined>;
}
export const getMyItinerariesRef: GetMyItinerariesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyItineraries(dc: DataConnect): QueryPromise<GetMyItinerariesData, undefined>;

interface GetMyItinerariesRef {
  ...
  (dc: DataConnect): QueryRef<GetMyItinerariesData, undefined>;
}
export const getMyItinerariesRef: GetMyItinerariesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyItinerariesRef:
```typescript
const name = getMyItinerariesRef.operationName;
console.log(name);
```

### Variables
The `GetMyItineraries` query has no variables.
### Return Type
Recall that executing the `GetMyItineraries` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyItinerariesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetMyItinerariesData {
  itineraries: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    startDate: DateString;
    endDate: DateString;
    isPublic: boolean;
    coverImageUrl?: string | null;
  } & Itinerary_Key)[];
}
```
### Using `GetMyItineraries`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyItineraries } from '@dataconnect/generated';


// Call the `getMyItineraries()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyItineraries();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyItineraries(dataConnect);

console.log(data.itineraries);

// Or, you can use the `Promise` API.
getMyItineraries().then((response) => {
  const data = response.data;
  console.log(data.itineraries);
});
```

### Using `GetMyItineraries`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyItinerariesRef } from '@dataconnect/generated';


// Call the `getMyItinerariesRef()` function to get a reference to the query.
const ref = getMyItinerariesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyItinerariesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.itineraries);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.itineraries);
});
```

## ListPublicReligiousPlaces
You can execute the `ListPublicReligiousPlaces` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listPublicReligiousPlaces(): QueryPromise<ListPublicReligiousPlacesData, undefined>;

interface ListPublicReligiousPlacesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPublicReligiousPlacesData, undefined>;
}
export const listPublicReligiousPlacesRef: ListPublicReligiousPlacesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listPublicReligiousPlaces(dc: DataConnect): QueryPromise<ListPublicReligiousPlacesData, undefined>;

interface ListPublicReligiousPlacesRef {
  ...
  (dc: DataConnect): QueryRef<ListPublicReligiousPlacesData, undefined>;
}
export const listPublicReligiousPlacesRef: ListPublicReligiousPlacesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPublicReligiousPlacesRef:
```typescript
const name = listPublicReligiousPlacesRef.operationName;
console.log(name);
```

### Variables
The `ListPublicReligiousPlaces` query has no variables.
### Return Type
Recall that executing the `ListPublicReligiousPlaces` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPublicReligiousPlacesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListPublicReligiousPlacesData {
  religiousPlaces: ({
    id: UUIDString;
    name: string;
    description: string;
    location: string;
    imageUrls?: string[] | null;
    faith: string;
  } & ReligiousPlace_Key)[];
}
```
### Using `ListPublicReligiousPlaces`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listPublicReligiousPlaces } from '@dataconnect/generated';


// Call the `listPublicReligiousPlaces()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listPublicReligiousPlaces();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listPublicReligiousPlaces(dataConnect);

console.log(data.religiousPlaces);

// Or, you can use the `Promise` API.
listPublicReligiousPlaces().then((response) => {
  const data = response.data;
  console.log(data.religiousPlaces);
});
```

### Using `ListPublicReligiousPlaces`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPublicReligiousPlacesRef } from '@dataconnect/generated';


// Call the `listPublicReligiousPlacesRef()` function to get a reference to the query.
const ref = listPublicReligiousPlacesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPublicReligiousPlacesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.religiousPlaces);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.religiousPlaces);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateNewItinerary
You can execute the `CreateNewItinerary` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createNewItinerary(vars: CreateNewItineraryVariables): MutationPromise<CreateNewItineraryData, CreateNewItineraryVariables>;

interface CreateNewItineraryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewItineraryVariables): MutationRef<CreateNewItineraryData, CreateNewItineraryVariables>;
}
export const createNewItineraryRef: CreateNewItineraryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createNewItinerary(dc: DataConnect, vars: CreateNewItineraryVariables): MutationPromise<CreateNewItineraryData, CreateNewItineraryVariables>;

interface CreateNewItineraryRef {
  ...
  (dc: DataConnect, vars: CreateNewItineraryVariables): MutationRef<CreateNewItineraryData, CreateNewItineraryVariables>;
}
export const createNewItineraryRef: CreateNewItineraryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createNewItineraryRef:
```typescript
const name = createNewItineraryRef.operationName;
console.log(name);
```

### Variables
The `CreateNewItinerary` mutation requires an argument of type `CreateNewItineraryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateNewItineraryVariables {
  name: string;
  description: string;
  startDate: DateString;
  endDate: DateString;
  isPublic: boolean;
  coverImageUrl?: string | null;
}
```
### Return Type
Recall that executing the `CreateNewItinerary` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateNewItineraryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateNewItineraryData {
  itinerary_insert: Itinerary_Key;
}
```
### Using `CreateNewItinerary`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createNewItinerary, CreateNewItineraryVariables } from '@dataconnect/generated';

// The `CreateNewItinerary` mutation requires an argument of type `CreateNewItineraryVariables`:
const createNewItineraryVars: CreateNewItineraryVariables = {
  name: ..., 
  description: ..., 
  startDate: ..., 
  endDate: ..., 
  isPublic: ..., 
  coverImageUrl: ..., // optional
};

// Call the `createNewItinerary()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createNewItinerary(createNewItineraryVars);
// Variables can be defined inline as well.
const { data } = await createNewItinerary({ name: ..., description: ..., startDate: ..., endDate: ..., isPublic: ..., coverImageUrl: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createNewItinerary(dataConnect, createNewItineraryVars);

console.log(data.itinerary_insert);

// Or, you can use the `Promise` API.
createNewItinerary(createNewItineraryVars).then((response) => {
  const data = response.data;
  console.log(data.itinerary_insert);
});
```

### Using `CreateNewItinerary`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createNewItineraryRef, CreateNewItineraryVariables } from '@dataconnect/generated';

// The `CreateNewItinerary` mutation requires an argument of type `CreateNewItineraryVariables`:
const createNewItineraryVars: CreateNewItineraryVariables = {
  name: ..., 
  description: ..., 
  startDate: ..., 
  endDate: ..., 
  isPublic: ..., 
  coverImageUrl: ..., // optional
};

// Call the `createNewItineraryRef()` function to get a reference to the mutation.
const ref = createNewItineraryRef(createNewItineraryVars);
// Variables can be defined inline as well.
const ref = createNewItineraryRef({ name: ..., description: ..., startDate: ..., endDate: ..., isPublic: ..., coverImageUrl: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createNewItineraryRef(dataConnect, createNewItineraryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.itinerary_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.itinerary_insert);
});
```

## AddReligiousPlaceToItinerary
You can execute the `AddReligiousPlaceToItinerary` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
addReligiousPlaceToItinerary(vars: AddReligiousPlaceToItineraryVariables): MutationPromise<AddReligiousPlaceToItineraryData, AddReligiousPlaceToItineraryVariables>;

interface AddReligiousPlaceToItineraryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddReligiousPlaceToItineraryVariables): MutationRef<AddReligiousPlaceToItineraryData, AddReligiousPlaceToItineraryVariables>;
}
export const addReligiousPlaceToItineraryRef: AddReligiousPlaceToItineraryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
addReligiousPlaceToItinerary(dc: DataConnect, vars: AddReligiousPlaceToItineraryVariables): MutationPromise<AddReligiousPlaceToItineraryData, AddReligiousPlaceToItineraryVariables>;

interface AddReligiousPlaceToItineraryRef {
  ...
  (dc: DataConnect, vars: AddReligiousPlaceToItineraryVariables): MutationRef<AddReligiousPlaceToItineraryData, AddReligiousPlaceToItineraryVariables>;
}
export const addReligiousPlaceToItineraryRef: AddReligiousPlaceToItineraryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the addReligiousPlaceToItineraryRef:
```typescript
const name = addReligiousPlaceToItineraryRef.operationName;
console.log(name);
```

### Variables
The `AddReligiousPlaceToItinerary` mutation requires an argument of type `AddReligiousPlaceToItineraryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AddReligiousPlaceToItineraryVariables {
  itineraryId: UUIDString;
  religiousPlaceId: UUIDString;
  visitOrder: number;
}
```
### Return Type
Recall that executing the `AddReligiousPlaceToItinerary` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AddReligiousPlaceToItineraryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AddReligiousPlaceToItineraryData {
  itineraryPlace_insert: ItineraryPlace_Key;
}
```
### Using `AddReligiousPlaceToItinerary`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, addReligiousPlaceToItinerary, AddReligiousPlaceToItineraryVariables } from '@dataconnect/generated';

// The `AddReligiousPlaceToItinerary` mutation requires an argument of type `AddReligiousPlaceToItineraryVariables`:
const addReligiousPlaceToItineraryVars: AddReligiousPlaceToItineraryVariables = {
  itineraryId: ..., 
  religiousPlaceId: ..., 
  visitOrder: ..., 
};

// Call the `addReligiousPlaceToItinerary()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await addReligiousPlaceToItinerary(addReligiousPlaceToItineraryVars);
// Variables can be defined inline as well.
const { data } = await addReligiousPlaceToItinerary({ itineraryId: ..., religiousPlaceId: ..., visitOrder: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await addReligiousPlaceToItinerary(dataConnect, addReligiousPlaceToItineraryVars);

console.log(data.itineraryPlace_insert);

// Or, you can use the `Promise` API.
addReligiousPlaceToItinerary(addReligiousPlaceToItineraryVars).then((response) => {
  const data = response.data;
  console.log(data.itineraryPlace_insert);
});
```

### Using `AddReligiousPlaceToItinerary`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, addReligiousPlaceToItineraryRef, AddReligiousPlaceToItineraryVariables } from '@dataconnect/generated';

// The `AddReligiousPlaceToItinerary` mutation requires an argument of type `AddReligiousPlaceToItineraryVariables`:
const addReligiousPlaceToItineraryVars: AddReligiousPlaceToItineraryVariables = {
  itineraryId: ..., 
  religiousPlaceId: ..., 
  visitOrder: ..., 
};

// Call the `addReligiousPlaceToItineraryRef()` function to get a reference to the mutation.
const ref = addReligiousPlaceToItineraryRef(addReligiousPlaceToItineraryVars);
// Variables can be defined inline as well.
const ref = addReligiousPlaceToItineraryRef({ itineraryId: ..., religiousPlaceId: ..., visitOrder: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = addReligiousPlaceToItineraryRef(dataConnect, addReligiousPlaceToItineraryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.itineraryPlace_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.itineraryPlace_insert);
});
```

