import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Col, Row } from 'antd';
import { useQuery } from '@apollo/client';
import { USER } from '../../lib/graphql/queries';
import {
  User as UserData,
  UserVariables,
} from '../../lib/graphql/queries/User/__generated__/User';
import { UserBookings, UserListings, UserProfile } from './components';
import { Viewer } from '../../lib/types';
import { PageSkeleton, ErrorBanner } from '../../lib/components';
import { useScrollToTop } from '../../lib/hooks';

interface Props {
  viewer: Viewer;
  setViewer: (viewer: Viewer) => void;
}
interface MatchParams {
  id: string;
}

const { Content } = Layout;
const PAGE_LIMIT = 4;

export const User = ({ viewer, setViewer }: Props) => {
  const [listingsPage, setListingsPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);
  const { id } = useParams<MatchParams>();
  const { data, loading, error, refetch } = useQuery<UserData, UserVariables>(
    USER,
    {
      variables: {
        id,
        bookingsPage,
        listingsPage,
        limit: PAGE_LIMIT,
      },
      fetchPolicy: 'cache-and-network',
    }
  );

  useScrollToTop();

  const handleUserRefetch = async () => {
    await refetch();
  };

  const stripeError = new URL(window.location.href).searchParams.get(
    'stripe_error'
  );
  const stripeErrorBanner = stripeError && (
    <ErrorBanner description='We had an issue connecting with Stripe. Please try again soon.' />
  );

  if (loading) {
    return (
      <Content className='user'>
        <PageSkeleton />
      </Content>
    );
  }

  if (error) {
    return (
      <Content className='user'>
        <ErrorBanner description='This user may not exists or we-ve encountered an error. Please try again soon.' />
        <PageSkeleton />
      </Content>
    );
  }

  const user = data ? data.user : null;
  const viewerIsUser = viewer.id === id;

  const userListings = user ? user.listings : null;
  const userBookings = user ? user.bookings : null;

  const userProfileElement = user ? (
    <UserProfile
      user={user}
      viewer={viewer}
      viewerIsUser={viewerIsUser}
      setViewer={setViewer}
      handleUserRefetch={handleUserRefetch}
    />
  ) : null;

  const userListingsElement = userListings && (
    <UserListings
      userListings={userListings}
      listingsPage={listingsPage}
      limit={PAGE_LIMIT}
      setListingsPage={setListingsPage}
    />
  );
  const userBookingsElement = userBookings && (
    <UserBookings
      userBookings={userBookings}
      bookingsPage={bookingsPage}
      limit={PAGE_LIMIT}
      setBookingsPage={setBookingsPage}
    />
  );

  return (
    <Content className='user'>
      {stripeErrorBanner}
      <Row gutter={12} justify='space-between'>
        <Col xs={24}>{userProfileElement}</Col>
        <Col xs={24}>
          {userListingsElement}
          {userBookingsElement}
        </Col>
      </Row>
    </Content>
  );
};
