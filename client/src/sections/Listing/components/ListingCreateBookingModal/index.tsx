import React from 'react';
import { Button, Divider, Typography, Modal } from 'antd';
import moment, { Moment } from 'moment';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { KeyOutlined } from '@ant-design/icons';
import { useMutation } from '@apollo/client';
import {
  displayErrorMessage,
  displaySuccessNotification,
  formatListingPrice,
} from '../../../../lib/utils';
import {
  CreateBooking as CreateBookingData,
  CreateBookingVariables,
} from '../../../../lib/graphql/mutations/CreateBooking/__generated__/CreateBooking';
import { CREATE_BOOKING } from '../../../../lib/graphql/mutations';

interface Props {
  id: string;
  price: number;
  modalVisible: boolean;
  checkInDate: Moment;
  checkOutDate: Moment;
  setModalVisible: (modalVisible: boolean) => void;
  clearBookingData: () => void;
  handleListingRefetch: () => Promise<void>;
}

const { Paragraph, Text, Title } = Typography;
export const ListingCreateBookingModal = ({
  id,
  price,
  modalVisible,
  checkInDate,
  checkOutDate,
  setModalVisible,
  clearBookingData,
  handleListingRefetch,
}: Props) => {
  const [createBooking, { loading }] = useMutation<
    CreateBookingData,
    CreateBookingVariables
  >(CREATE_BOOKING, {
    onCompleted: () => {
      clearBookingData();
      displaySuccessNotification(
        "You've successfully booked the listing!",
        'Booking history can always be found in your User page.'
      );
      handleListingRefetch();
    },
    onError: () => {
      displayErrorMessage(
        "Sorry! We weren't able to successfully book the listing. Please try again later!"
      );
    },
  });

  const stripe = useStripe();
  const elements = useElements();

  const daysBooked = checkOutDate.diff(checkInDate, 'days') + 1;
  const listingPrice = price * daysBooked;

  const handleCreateBooking = async () => {
    if (!stripe || !elements) {
      return displayErrorMessage(
        "Sorry! We weren't able to connect with Stripe."
      );
    }

    const cardElement = elements.getElement(CardElement)!;

    const { token: stripeToken, error } = await stripe.createToken(cardElement);

    if (stripeToken) {
      createBooking({
        variables: {
          input: {
            id,
            source: stripeToken.id,
            checkIn: moment(checkInDate).format('YYYY-MM-DD'),
            checkOut: moment(checkOutDate).format('YYYY-MM-DD'),
          },
        },
      });
    } else {
      displayErrorMessage(
        error?.message ||
          "Sorry! We weren't able to book the listing. Please try again later."
      );
    }
  };

  return (
    <Modal
      visible={modalVisible}
      centered
      footer={null}
      onCancel={() => setModalVisible(false)}
    >
      <div className='listing-booking-modal'>
        <div className='listing-booking-modal__intro'>
          <Title className='listing-booking-modal__intro-title'>
            <KeyOutlined />
          </Title>
          <Title level={3} className='listing-booking-modal__intro-title'>
            Book your trip
          </Title>
          <Paragraph>
            Enter your payment information to book the listing from the dates
            between{' '}
            <Text mark strong>
              {moment(checkInDate).format('MMMM Do YYYY')}
            </Text>{' '}
            and{' '}
            <Text mark strong>
              {moment(checkOutDate).format('MMMM Do YYYY')}
            </Text>
            , inclusive.
          </Paragraph>
        </div>

        <Divider />

        <div className='listing-booking-modal__charge-summary'>
          <Paragraph>
            {formatListingPrice(price, false)} * {daysBooked} days ={' '}
            <Text strong>{formatListingPrice(listingPrice, false)}</Text>
          </Paragraph>
          <Paragraph className='listing-booking-modal__charge-summary-total'>
            Total = <Text mark>{formatListingPrice(listingPrice, false)}</Text>
          </Paragraph>
        </div>

        <Divider />

        <div className='listing-booking-modal__stripe-card-section'>
          <CardElement
            options={{ hidePostalCode: true }}
            className='listing-booking-modal__stripe-card'
          />
          <Button
            size='large'
            type='primary'
            className='listing-booking-modal__cta'
            loading={loading}
            onClick={handleCreateBooking}
          >
            Book
          </Button>
        </div>
      </div>
    </Modal>
  );
};
