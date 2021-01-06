import { IResolvers } from 'apollo-server-express';
import { Request } from 'express';
import crypto from 'crypto';
import { Cloudinary, HereGeo } from '../../../lib/api';
import { Database, Listing, ListingType, User } from '../../../lib/types';
import { authorize } from '../../../lib/utils';
import {
  HostListingArgs,
  HostListingInput,
  ListingArgs,
  ListingBookingsArgs,
  ListingBookingsData,
  ListingsArgs,
  ListingsData,
  ListingsFilter,
  ListingsQuery,
  Order,
} from './types';

const verifyHostListingInput = ({
  title,
  description,
  type,
  price,
}: HostListingInput) => {
  if (title.length > 100) {
    throw new Error('listings title must be under 100 characters');
  }
  if (description.length > 5000) {
    throw new Error('listings description must be under 5000 characters');
  }
  if (type !== ListingType.Apartment && type !== ListingType.House) {
    throw new Error('listings type must be either an apartment or house');
  }
  if (price < 0) {
    throw new Error('price must be greater than 0');
  }
};

export const listingResolvers: IResolvers = {
  Query: {
    listing: async (
      _root: undefined,
      { id }: ListingArgs,
      { db, req }: { db: Database; req: Request }
    ): Promise<Listing> => {
      try {
        const listing = (await db.listings.findOne({ id })) as Listing;
        if (!listing) {
          throw new Error("Listing can't be found");
        }

        const viewer = await authorize(db, req);
        if (viewer?.id === listing.host) {
          listing.authorized = true;
        }

        return listing;
      } catch (error) {
        throw new Error(`Failed to query listing: ${error}`);
      }
    },
    listings: async (
      _root: undefined,
      { location, filter, limit, page }: ListingsArgs,
      { db }: { db: Database }
    ): Promise<ListingsData> => {
      try {
        const query: ListingsQuery = {};
        const data: ListingsData = {
          region: null,
          total: 0,
          result: [],
        };

        if (location) {
          const addressRes = await HereGeo.fetchGeo(location);
          if (addressRes) {
            const { country, admin, city } = HereGeo.formatGeoResponse(
              addressRes
            );

            if (city) query.city = city;
            if (admin) query.admin = admin;
            if (country) {
              query.country = country;
            } else {
              throw new Error('No country found');
            }

            const cityText = city ? `${city}, ` : '';
            const adminText = admin ? `${admin}, ` : '';
            data.region = `${cityText}${adminText}${country}`;
          }
        }

        let order: Order | null = null;

        if (filter && filter === ListingsFilter.PRICE_LOW_TO_HIGH) {
          order = { price: 'ASC' };
        }

        if (filter && filter === ListingsFilter.PRICE_HIGH_TO_LOW) {
          order = { price: 'DESC' };
        }

        const count = await db.listings.count(query);
        const listings = await db.listings.find({
          where: { ...query },
          order: { ...order },
          skip: page > 0 ? (page - 1) * limit : 0,
          take: limit,
        });

        data.total = count;
        data.result = listings;

        return data;
      } catch (error) {
        throw new Error(`Failed to query listings: ${error}`);
      }
    },
  },
  Mutation: {
    hostListing: async (
      _root: undefined,
      { input }: HostListingArgs,
      { db, req }: { db: Database; req: Request }
    ): Promise<Listing | undefined> => {
      verifyHostListingInput(input);

      const viewer = await authorize(db, req);
      if (!viewer) {
        throw new Error('viewer cannot be found');
      }

      const geoRes = await HereGeo.fetchGeo(input.address);
      if (geoRes) {
        const { country, admin, city } = HereGeo.formatGeoResponse(geoRes);
        if (!country || !admin || !city) {
          throw new Error('invalid address input');
        }

        const imageUrl = await Cloudinary.upload(input.image);

        const newListing: Listing = {
          id: crypto.randomBytes(16).toString('hex'),
          ...input,
          image: imageUrl,
          bookings: [],
          bookingsIndex: {},
          country,
          admin,
          city,
          host: viewer.id,
        };

        const insertedListing = await db.listings.create(newListing).save();

        viewer.listings.push(insertedListing.id);
        await viewer.save();

        return insertedListing;
      }

      return;
    },
  },
  Listing: {
    host: async (
      listing: Listing,
      _args: Record<string, unknown>,
      { db }: { db: Database }
    ): Promise<User> => {
      const host = await db.users.findOne({ id: listing.host });
      if (!host) {
        throw new Error("Host can't be found");
      }
      return host;
    },
    bookingsIndex: (listing: Listing): string => {
      return JSON.stringify(listing.bookingsIndex);
    },
    bookings: async (
      listing: Listing,
      { limit, page }: ListingBookingsArgs,
      { db }: { db: Database }
    ): Promise<ListingBookingsData | null> => {
      try {
        if (!listing.authorized) {
          return null;
        }

        const data: ListingBookingsData = {
          total: 0,
          result: [],
        };

        const bookings = await db.bookings.findByIds(listing.bookings, {
          skip: page > 0 ? (page - 1) * limit : 0,
          take: limit,
        });

        data.total = listing.bookings.length;
        data.result = bookings;

        return data;
      } catch (error) {
        throw new Error(`Failed to query listing bookings: ${error}`);
      }
    },
  },
};
