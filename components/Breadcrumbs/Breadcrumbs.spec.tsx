import { shallow } from 'enzyme';
import toJSON from 'enzyme-to-json';

import Breadcrumbs from '.';

describe('Breadcrumbs', () => {
  it('renders correctly', () => {
    const tree = toJSON(
      shallow(
        <Breadcrumbs
          links={[{ name: 'Dashboard', url: '/' }, { name: 'My app', url: '/my-app/' }]}
          iconUrl="https://www.bitrise.io/assets/svg/logo-bitrise.svg"
        >
          My app version 1.0
        </Breadcrumbs>
      )
    );
    expect(tree).toMatchSnapshot();
  });
});
