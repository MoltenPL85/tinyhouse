import React, { useEffect, useRef } from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import { Card, Layout, Spin, Typography } from 'antd';
import { useApolloClient, useMutation } from '@apollo/client';
import { LOG_IN } from '../../lib/graphql/mutations';
import { AUTH_URL } from '../../lib/graphql/queries';
import {
  LogIn as LogInData,
  LogInVariables,
} from '../../lib/graphql/mutations/LogIn/__generated__/LogIn';
import { AuthUrl as AuthUrlData } from '../../lib/graphql/queries/AuthUrl/__generated__/AuthUrl';
import { Viewer } from '../../lib/types';
import { useScrollToTop } from '../../lib/hooks';

import googleLogo from './assets/google_logo.jpg';
import {
  displayErrorMessage,
  displaySuccessNotification,
} from '../../lib/utils';
import { ErrorBanner } from '../../lib/components';

interface Props {
  setViewer: (viewer: Viewer) => void;
}

const { Content } = Layout;
const { Text, Title } = Typography;

export const Login = ({ setViewer }: Props) => {
  const client = useApolloClient();
  const [
    logIn,
    { data: logInData, loading: logInLoading, error: logInError },
  ] = useMutation<LogInData, LogInVariables>(LOG_IN, {
    onCompleted: (data) => {
      if (data?.logIn?.token) {
        setViewer(data.logIn);
        sessionStorage.setItem('token', data.logIn.token);
        displaySuccessNotification("You've successfully logged in!");
      }
    },
    onError: () => {}, //necessary to test error state of component
  });

  const logInRef = useRef(logIn);
  const location = useLocation();

  useScrollToTop();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');

    if (code) {
      logInRef.current({
        variables: {
          input: { code },
        },
      });
    }
  }, []);

  const handleAuthorize = async () => {
    try {
      const { data } = await client.query<AuthUrlData>({
        query: AUTH_URL,
      });

      if (!data) {
        throw new Error('Unable to authenticate');
      }

      window.location.assign(data.authUrl);
    } catch {
      displayErrorMessage(
        "Sorry! We weren't able to log you in. Please try again later!"
      );
    }
  };

  if (logInLoading) {
    return (
      <Content className="log-in">
        <Spin size="large" tip="Logging you in..." />
      </Content>
    );
  }

  if (logInData?.logIn) {
    const { id: viewerId } = logInData.logIn;
    return <Redirect to={`/user/${viewerId}`} />;
  }

  const logInErrorBannerElement = logInError && (
    <ErrorBanner description="Sorry! We weren't able to log you in. Please try again later!" />
  );

  return (
    <Content className="log-in">
      {logInErrorBannerElement}
      <Card className="log-in-card">
        <div className="log-in-card__intro">
          <Title level={3} className="log-in-card__intro-title">
            <span role="img" aria-label="wave">
              👋
            </span>
          </Title>
          <Title level={3} className="log-in-card__intro-title">
            Log in to TinyHouse!
          </Title>
          <Text>Sign in with Google to start booking available rentals!</Text>
        </div>
        <button
          className="log-in-card__google-button"
          onClick={handleAuthorize}
        >
          <img
            src={googleLogo}
            alt="Google Logo"
            className="log-in-card__google-button-logo"
          />
          <span className="log-in-card__google-button-text">
            Sign in with Google
          </span>
        </button>
        <Text type="secondary">
          Note: By signing in, you'll be redirected to the Google consent form
          to sign in with Google account.
        </Text>
      </Card>
    </Content>
  );
};
