import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AddReligiousPlaceToItineraryData {
  itineraryPlace_insert: ItineraryPlace_Key;
}

export interface AddReligiousPlaceToItineraryVariables {
  itineraryId: UUIDString;
  religiousPlaceId: UUIDString;
  visitOrder: number;
}

export interface CreateNewItineraryData {
  itinerary_insert: Itinerary_Key;
}

export interface CreateNewItineraryVariables {
  name: string;
  description: string;
  startDate: DateString;
  endDate: DateString;
  isPublic: boolean;
  coverImageUrl?: string | null;
}

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

export interface ItineraryPlace_Key {
  itineraryId: UUIDString;
  religiousPlaceId: UUIDString;
  __typename?: 'ItineraryPlace_Key';
}

export interface Itinerary_Key {
  id: UUIDString;
  __typename?: 'Itinerary_Key';
}

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

export interface ReligiousPlace_Key {
  id: UUIDString;
  __typename?: 'ReligiousPlace_Key';
}

export interface Review_Key {
  id: UUIDString;
  __typename?: 'Review_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateNewItineraryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewItineraryVariables): MutationRef<CreateNewItineraryData, CreateNewItineraryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateNewItineraryVariables): MutationRef<CreateNewItineraryData, CreateNewItineraryVariables>;
  operationName: string;
}
export const createNewItineraryRef: CreateNewItineraryRef;

export function createNewItinerary(vars: CreateNewItineraryVariables): MutationPromise<CreateNewItineraryData, CreateNewItineraryVariables>;
export function createNewItinerary(dc: DataConnect, vars: CreateNewItineraryVariables): MutationPromise<CreateNewItineraryData, CreateNewItineraryVariables>;

interface GetMyItinerariesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyItinerariesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyItinerariesData, undefined>;
  operationName: string;
}
export const getMyItinerariesRef: GetMyItinerariesRef;

export function getMyItineraries(): QueryPromise<GetMyItinerariesData, undefined>;
export function getMyItineraries(dc: DataConnect): QueryPromise<GetMyItinerariesData, undefined>;

interface AddReligiousPlaceToItineraryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddReligiousPlaceToItineraryVariables): MutationRef<AddReligiousPlaceToItineraryData, AddReligiousPlaceToItineraryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddReligiousPlaceToItineraryVariables): MutationRef<AddReligiousPlaceToItineraryData, AddReligiousPlaceToItineraryVariables>;
  operationName: string;
}
export const addReligiousPlaceToItineraryRef: AddReligiousPlaceToItineraryRef;

export function addReligiousPlaceToItinerary(vars: AddReligiousPlaceToItineraryVariables): MutationPromise<AddReligiousPlaceToItineraryData, AddReligiousPlaceToItineraryVariables>;
export function addReligiousPlaceToItinerary(dc: DataConnect, vars: AddReligiousPlaceToItineraryVariables): MutationPromise<AddReligiousPlaceToItineraryData, AddReligiousPlaceToItineraryVariables>;

interface ListPublicReligiousPlacesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPublicReligiousPlacesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPublicReligiousPlacesData, undefined>;
  operationName: string;
}
export const listPublicReligiousPlacesRef: ListPublicReligiousPlacesRef;

export function listPublicReligiousPlaces(): QueryPromise<ListPublicReligiousPlacesData, undefined>;
export function listPublicReligiousPlaces(dc: DataConnect): QueryPromise<ListPublicReligiousPlacesData, undefined>;

