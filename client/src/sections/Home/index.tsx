import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { Col, Row, Layout, Typography } from 'antd';
import {
  Listings as ListingsData,
  ListingsVariables,
} from '../../lib/graphql/queries/Listings/__generated__/Listings';
import { ListingsFilter } from '../../lib/graphql/globalTypes';
import { HomeHero, HomeListings, HomeListingsSkeleton } from './components';
import { displayErrorMessage } from '../../lib/utils';
import { LISTINGS } from '../../lib/graphql/queries';
import { useScrollToTop } from '../../lib/hooks';

import mapBackground from './assets/map-background.jpg';
import sanFranciscoImage from './assets/san-francisco.jpg';
import cancunImage from './assets/cancun.jpg';

const { Content } = Layout;
const { Paragraph, Title } = Typography;

const PAGE_LIMIT = 4;
const PAGE_NUMBER = 1;

export const Home = () => {
  const { loading, data } = useQuery<ListingsData, ListingsVariables>(
    LISTINGS,
    {
      variables: {
        filter: ListingsFilter.PRICE_HIGH_TO_LOW,
        limit: PAGE_LIMIT,
        page: PAGE_NUMBER,
      },
      fetchPolicy: 'cache-and-network',
    }
  );
  const history = useHistory();

  useScrollToTop();

  const onSearch = (value: string) => {
    const trimmedValue = value.trim();

    if (trimmedValue) {
      history.push(`/listings/${trimmedValue}`);
    } else {
      displayErrorMessage('Please enter a valid search!');
    }
  };

  const renderListingsSection = () => {
    if (loading) {
      return <HomeListingsSkeleton />;
    }

    if (data) {
      return (
        <HomeListings
          title='Premium Listings'
          listings={data.listings.result}
        />
      );
    }

    return null;
  };

  return (
    <Content
      className='home'
      style={{ backgroundImage: `url(${mapBackground})` }}
    >
      <HomeHero onSearch={onSearch} />

      <div className='home__cta-section'>
        <Title level={2} className='home__cta-section-title'>
          Your guide for all thongs rental
        </Title>
        <Paragraph>
          Helping you make the best decisions in renting your last minute
          locations.
        </Paragraph>
        <Link
          to='/listings/united%20states'
          className='ant-btn ant-btn-primary ant-btn-lg home__cta-section-button'
        >
          Populare listings in the United States
        </Link>
      </div>

      {renderListingsSection()}

      <div>
        <Title level={4} className='home__listings-title'>
          Listings of any kind
        </Title>
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Link to='/listings/san%20francisco'>
              <div className='home__listings-img-cover'>
                <img
                  src={sanFranciscoImage}
                  alt='San Francisco'
                  className='home__listings-img'
                />
              </div>
            </Link>
          </Col>
          <Col xs={24} sm={12}>
            <Link to='/listings/cancun'>
              <div className='home__listings-img-cover'>
                <img
                  src={cancunImage}
                  alt='Cancun'
                  className='home__listings-img'
                />
              </div>
            </Link>
          </Col>
        </Row>
      </div>
    </Content>
  );
};
