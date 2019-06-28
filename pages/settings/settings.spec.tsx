jest.mock('@/ducks/settings');

import { shallow } from 'enzyme';
import toJSON from 'enzyme-to-json';

import { fetchSettings } from '@/ducks/settings';
import { SettingsPage } from './';

describe('Settings', () => {
  it('renders the general tab correctly', () => {
    const tree = toJSON(shallow(<SettingsPage appSlug="some-app" pagePath="some/path" />));
    expect(tree).toMatchSnapshot();
  });

  it('renders the specified tab correctly', () => {
    const tree = toJSON(shallow(<SettingsPage appSlug="some-app" pagePath="some/path" selectedTab="other"/>));
    expect(tree).toMatchSnapshot();
  });

  describe('dispatches the proper actions', () => {
    const req = { path: 'some/path' };

    it('dispatches fetchSettings', async () => {
      await SettingsPage.getInitialProps({ query: {}, req, store: { dispatch: jest.fn() } } as any);

      expect(fetchSettings).toHaveBeenCalled();
    });
  });
});
