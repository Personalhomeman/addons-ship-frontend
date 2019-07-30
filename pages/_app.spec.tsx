jest.mock('@/ducks/auth');
jest.mock('@/ducks/app');
jest.mock('nookies');

import { AppProps } from 'next/app';
import { RouterProps } from 'next/router';
import { shallowToJson } from 'enzyme-to-json';
import { shallow } from 'enzyme';
import configureMockStore, { MockStoreCreator, MockStoreEnhanced } from 'redux-mock-store';
import thunk from 'redux-thunk';
import nookies from 'nookies';

import { setToken } from '@/ducks/auth';
import { fetchApp } from '@/ducks/app';

import { ShipApp, ShipAppProps } from './_app';
import { PageContext } from '@/models';

describe('ShipApp', () => {
  let store: MockStoreEnhanced, defaultProps: ShipAppProps & AppProps;
  const setTokenAction = { type: 'MOCK_AUTH_SET_TOKEN' },
    getAppAction = { type: 'MOCK_APP_GET' };

  beforeEach(() => {
    const mockStoreCreator: MockStoreCreator = configureMockStore([thunk]);
    store = mockStoreCreator();

    defaultProps = {
      store,
      appSlug: 'an-app-slug',
      token: 'auth-token',
      pageProps: {},
      Component: () => <h1>Ship Add-on</h1>,
      router: {} as RouterProps
    };

    ((setToken as any) as jest.Mock).mockReturnValue(setTokenAction);
    ((fetchApp as any) as jest.Mock).mockReturnValue(getAppAction);

    nookies.get = jest.fn().mockImplementation(() => ({}));
  });

  it('renders without errors', () => {
    const tree = shallowToJson(shallow(<ShipApp {...defaultProps} />));

    expect(tree).toMatchSnapshot();
  });

  describe('getInitialProps', () => {
    let spy: jest.SpyInstance;
    const Component = () => <h1>Ship Add-on</h1>;
    Component.getInitialProps = () => ({ page: 'props' });

    let ctx: PageContext;

    beforeEach(() => {
      spy = jest.spyOn(store, 'dispatch');
      ctx = ({
        store,
        isServer: true,
        query: { appSlug: 'an-app-slug' }
      } as any) as PageContext;
    });

    test('on the server', async () => {
      const result = await ShipApp.getInitialProps({ Component, ctx, router: {} as RouterProps });

      expect(result).toMatchSnapshot();
      expect(spy).toHaveBeenCalledWith(setTokenAction);
      expect(spy).toHaveBeenCalledWith(getAppAction);
    });

    test('on the client', async () => {
      const result = await ShipApp.getInitialProps({
        Component,
        ctx: { ...ctx, isServer: false },
        router: {} as RouterProps
      });

      expect(result).toMatchSnapshot();
      expect(spy).not.toHaveBeenCalledWith(setTokenAction);
      expect(spy).toHaveBeenCalledWith(getAppAction);
    });

    test('when settings onboarding has already been seen', async () => {
      nookies.get = jest.fn().mockImplementation(() => ({
        'settings-onboarding-seen': 'true'
      }));

      const result = await ShipApp.getInitialProps({
        Component,
        ctx: { ...ctx, isServer: false },
        router: {} as RouterProps
      });

      expect(result).toMatchSnapshot();
    });

    test('when no app slug is present', async () => {
      const result = await ShipApp.getInitialProps({
        Component,
        ctx: { ...ctx, query: {} },
        router: {} as RouterProps
      });

      expect(result).toMatchSnapshot();
      expect(spy).toHaveBeenCalledWith(setTokenAction);
      expect(spy).not.toHaveBeenCalledWith(getAppAction);
    });

    test('when the Component has no getInitialProps method', async () => {
      const result = await ShipApp.getInitialProps({
        Component: () => <h1>Ship Add-on</h1>,
        ctx,
        router: {} as RouterProps
      });

      expect(result).toMatchSnapshot();
    });
  });

  test('componentDidMount', async () => {
    const spy = jest.spyOn(store, 'dispatch');
    const wrapper = await shallow(<ShipApp {...defaultProps} />);

    expect(spy).toHaveBeenCalledWith(setTokenAction);
    expect(store.getActions()).toMatchSnapshot();
    expect(wrapper.state()).toMatchSnapshot();
  });
});
