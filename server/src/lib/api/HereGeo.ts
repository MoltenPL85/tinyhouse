import fetch from 'node-fetch';

interface FormattedGeoObject {
  country: string;
  admin: string;
  city: string;
}

interface HereResponse {
  Response: {
    MetaInfo: {
      Timestamp: string;
    };
    View: Array<{
      Result: Array<{
        Location: {
          Address: {
            AdditionalData: Array<{
              key: string;
              value: string;
            }>;
            City: string;
            Country: string;
            County: string;
            District: string;
            HouseNumber: string;
            Label: string;
            PostalCode: string;
            State: string;
            Street: string;
          };
          DisplayPosition: {
            Latitude: number;
            Longitude: number;
          };
          LocationId: string;
          LocationType: string;
          MapView: {
            BottomRight: {
              Latitude: number;
              Longitude: number;
            };
            TopLeft: {
              Latitude: number;
              Longitude: number;
            };
          };
          NavigationPosition: Array<{
            Latitude: number;
            Longitude: number;
          }>;
        };
        MatchLevel: string;
        MatchQuality: {
          City: number;
          HouseNumber: number;
          Street: number[];
        };
        MatchType: string;
        Relevance: number;
      }>;
    }>;
  };
}

export const HereGeo = {
  formatGeoResponse: (addressComponents: HereResponse): FormattedGeoObject => {
    const addressInfo =
      addressComponents.Response.View[0].Result[0].Location.Address
        .AdditionalData;
    const formattedObject: FormattedGeoObject = {
      country: addressInfo[0]?.value,
      admin: addressInfo[1]?.value,
      city: addressInfo[2]?.value,
    };
    return formattedObject;
  },
  fetchGeo: async (query: string): Promise<HereResponse | undefined> => {
    try {
      const encodeString = encodeURIComponent(query);
      const res = await fetch(
        `https://geocoder.ls.hereapi.com/6.2/geocode.json?apiKey=${process.env.GEOLOCATION_KEY}=${encodeString}`
      );

      if (res.ok) {
        return res.json();
      } else {
        throw new Error(res.statusText);
      }
    } catch (err) {
      console.log(err.message);
    }
  },
};
