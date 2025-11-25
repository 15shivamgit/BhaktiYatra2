const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'bhaktiyatra',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createNewItineraryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewItinerary', inputVars);
}
createNewItineraryRef.operationName = 'CreateNewItinerary';
exports.createNewItineraryRef = createNewItineraryRef;

exports.createNewItinerary = function createNewItinerary(dcOrVars, vars) {
  return executeMutation(createNewItineraryRef(dcOrVars, vars));
};

const getMyItinerariesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyItineraries');
}
getMyItinerariesRef.operationName = 'GetMyItineraries';
exports.getMyItinerariesRef = getMyItinerariesRef;

exports.getMyItineraries = function getMyItineraries(dc) {
  return executeQuery(getMyItinerariesRef(dc));
};

const addReligiousPlaceToItineraryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddReligiousPlaceToItinerary', inputVars);
}
addReligiousPlaceToItineraryRef.operationName = 'AddReligiousPlaceToItinerary';
exports.addReligiousPlaceToItineraryRef = addReligiousPlaceToItineraryRef;

exports.addReligiousPlaceToItinerary = function addReligiousPlaceToItinerary(dcOrVars, vars) {
  return executeMutation(addReligiousPlaceToItineraryRef(dcOrVars, vars));
};

const listPublicReligiousPlacesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPublicReligiousPlaces');
}
listPublicReligiousPlacesRef.operationName = 'ListPublicReligiousPlaces';
exports.listPublicReligiousPlacesRef = listPublicReligiousPlacesRef;

exports.listPublicReligiousPlaces = function listPublicReligiousPlaces(dc) {
  return executeQuery(listPublicReligiousPlacesRef(dc));
};
