# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createNewItinerary, getMyItineraries, addReligiousPlaceToItinerary, listPublicReligiousPlaces } from '@dataconnect/generated';


// Operation CreateNewItinerary:  For variables, look at type CreateNewItineraryVars in ../index.d.ts
const { data } = await CreateNewItinerary(dataConnect, createNewItineraryVars);

// Operation GetMyItineraries: 
const { data } = await GetMyItineraries(dataConnect);

// Operation AddReligiousPlaceToItinerary:  For variables, look at type AddReligiousPlaceToItineraryVars in ../index.d.ts
const { data } = await AddReligiousPlaceToItinerary(dataConnect, addReligiousPlaceToItineraryVars);

// Operation ListPublicReligiousPlaces: 
const { data } = await ListPublicReligiousPlaces(dataConnect);


```