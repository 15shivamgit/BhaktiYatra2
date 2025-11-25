import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'bhaktiyatra',
  location: 'us-east4'
};

export const createNewItineraryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewItinerary', inputVars);
}
createNewItineraryRef.operationName = 'CreateNewItinerary';

export function createNewItinerary(dcOrVars, vars) {
  return executeMutation(createNewItineraryRef(dcOrVars, vars));
}

export const getMyItinerariesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyItineraries');
}
getMyItinerariesRef.operationName = 'GetMyItineraries';

export function getMyItineraries(dc) {
  return executeQuery(getMyItinerariesRef(dc));
}

export const addReligiousPlaceToItineraryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddReligiousPlaceToItinerary', inputVars);
}
addReligiousPlaceToItineraryRef.operationName = 'AddReligiousPlaceToItinerary';

export function addReligiousPlaceToItinerary(dcOrVars, vars) {
  return executeMutation(addReligiousPlaceToItineraryRef(dcOrVars, vars));
}

export const listPublicReligiousPlacesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPublicReligiousPlaces');
}
listPublicReligiousPlacesRef.operationName = 'ListPublicReligiousPlaces';

export function listPublicReligiousPlaces(dc) {
  return executeQuery(listPublicReligiousPlacesRef(dc));
}

