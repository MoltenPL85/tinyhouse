import { MockedProvider } from '@apollo/client/testing';
import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { Route, Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { GraphQLError } from 'graphql';
import { Login } from '../index';
import { AUTH_URL } from '../../../lib/graphql/queries';
import { LOG_IN } from '../../../lib/graphql/mutations';

const defaultProps = {
  setViewer: () => {},
};

describe('Login', () => {
  window.scrollTo = () => {};

  describe('AUTH_URL Query', () => {
    it('Redirects the user when query is successfull', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { assign: jest.fn() },
      });

      const authUrlMock = {
        request: {
          query: AUTH_URL,
        },
        result: {
          data: {
            authUrl: 'https://google.com/signin',
          },
        },
      };

      const history = createMemoryHistory({
        initialEntries: ['/login'],
      });
      const { queryByText, getByRole } = render(
        <MockedProvider mocks={[authUrlMock]} addTypename={false}>
          <Router history={history}>
            <Route path="/login">
              <Login {...defaultProps} />
            </Route>
          </Router>
        </MockedProvider>
      );

      const authUrlButton = getByRole('button');
      fireEvent.click(authUrlButton);

      await waitFor(() => {
        expect(window.location.assign).toHaveBeenCalledWith(
          'https://google.com/signin'
        );
        expect(
          queryByText(
            "Sorry! We weren't able to log you in. Please try again later!"
          )
        ).toBeNull();
      });
    });

    it('Does not redirect the user when query is unsuccessfull', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { assign: jest.fn() },
      });

      const authUrlMock = {
        request: {
          query: AUTH_URL,
        },
        errors: [new GraphQLError('Something went wrong')],
      };

      const history = createMemoryHistory({
        initialEntries: ['/login'],
      });
      const { queryByText, getByRole } = render(
        <MockedProvider mocks={[authUrlMock]} addTypename={false}>
          <Router history={history}>
            <Route path="/login">
              <Login {...defaultProps} />
            </Route>
          </Router>
        </MockedProvider>
      );

      const authUrlButton = getByRole('button');
      fireEvent.click(authUrlButton);

      await waitFor(() => {
        expect(window.location.assign).not.toHaveBeenCalledWith(
          'https://google.com/signin'
        );
        expect(
          queryByText(
            "Sorry! We weren't able to log you in. Please try again later!"
          )
        ).not.toBeNull();
      });
    });
  });

  describe('LOGIN Mutation', () => {
    it('When no code exist in the /login route, the mutation is not fired', async () => {
      const logInMock = {
        request: {
          query: LOG_IN,
          variables: {
            input: {
              code: '1234',
            },
          },
        },
        result: {
          data: {
            logIn: {
              id: '1111',
              token: '4321',
              avatar: 'image.png',
              hasWallet: false,
              didRequest: true,
            },
          },
        },
      };

      const history = createMemoryHistory({
        initialEntries: ['/login'],
      });
      render(
        <MockedProvider mocks={[logInMock]} addTypename={false}>
          <Router history={history}>
            <Route path="/login">
              <Login {...defaultProps} />
            </Route>
          </Router>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(history.location.pathname).not.toBe('/user/1111');
      });
    });

    describe('when code exists in the /login route as a query parameter', () => {
      it('redirects the uset to their user page when the mutation is successful', async () => {
        const logInMock = {
          request: {
            query: LOG_IN,
            variables: {
              input: {
                code: '1234',
              },
            },
          },
          result: {
            data: {
              logIn: {
                id: '1111',
                token: '4321',
                avatar: 'image.png',
                hasWallet: false,
                didRequest: true,
              },
            },
          },
        };

        const history = createMemoryHistory({
          initialEntries: ['/login?code=1234'],
        });
        render(
          <MockedProvider mocks={[logInMock]} addTypename={false}>
            <Router history={history}>
              <Route path="/login">
                <Login {...defaultProps} />
              </Route>
            </Router>
          </MockedProvider>
        );

        await waitFor(() => {
          expect(history.location.pathname).toBe('/user/1111');
        });
      });

      it('does not redirects the uset to their user page and displays an error message when the mutation is unsuccessful', async () => {
        const logInMock = {
          request: {
            query: LOG_IN,
            variables: {
              input: {
                code: '1234',
              },
            },
          },
          errors: [new GraphQLError('Something went wrong')],
        };

        const history = createMemoryHistory({
          initialEntries: ['/login?code=1234'],
        });
        const { queryByText } = render(
          <MockedProvider mocks={[logInMock]} addTypename={false}>
            <Router history={history}>
              <Route path="/login">
                <Login {...defaultProps} />
              </Route>
            </Router>
          </MockedProvider>
        );

        await waitFor(() => {
          expect(history.location.pathname).not.toBe('/user/1111');
          expect(
            queryByText(
              "Sorry! We weren't able to log you in. Please try again later!"
            )
          ).not.toBeNull();
        });
      });
    });
  });
});
