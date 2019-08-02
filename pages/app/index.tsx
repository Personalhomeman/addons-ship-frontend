import { Component } from 'react';
import { connect } from 'react-redux';
import find from 'lodash/find';

import { AppPageQuery, PageContext, AppVersion } from '@/models';
import { RootState } from '@/store';
import { fetchAppVersionList } from '@/ducks/appVersionList';
import { getAppVersionsByVersion, getAppVersionsByBuildNumber } from '@/ducks/selectors';
import EmptyPage from '@/components/EmptyPage';

import View from './view';

export interface AppPageProps extends AppPageQuery {
  appVersionsByVersion: Array<{
    groupName: string;
    appVersions: AppVersion[];
  }>;
  appVersionsByBuildNumber: Array<{
    groupName: string;
    appVersions: AppVersion[];
  }>;
}

type AppPageState = {
  selectedVersionSortingOptionValue: string | null;
};

export class AppPage extends Component<AppPageProps, AppPageState> {
  state: AppPageState = {
    selectedVersionSortingOptionValue: null
  };

  versionSortingOptions = [
    {
      text: 'Latest Build',
      value: 'latest-build'
    },
    {
      text: 'Latest version',
      value: 'latest-version'
    }
  ];

  componentDidMount() {
    this.setState({
      selectedVersionSortingOptionValue: 'latest-build'
    });
  }

  static async getInitialProps({ query: { appSlug }, store }: PageContext) {
    await store.dispatch(fetchAppVersionList(appSlug as string) as any);

    return { appSlug };
  }

  versionSortOptionWithValueSelected = (value: string) => {
    this.setState({
      selectedVersionSortingOptionValue: value
    });
  };

  render() {
    const { appVersionsByVersion, appVersionsByBuildNumber } = this.props;
    const { selectedVersionSortingOptionValue } = this.state;

    const groupedAppVersionList =
      selectedVersionSortingOptionValue && selectedVersionSortingOptionValue === 'latest-version'
        ? appVersionsByVersion
        : appVersionsByBuildNumber;

    if (groupedAppVersionList.length === 0) {
      return <EmptyPage />;
    }

    const {
      appVersions: [latestAppVersion]
    } = groupedAppVersionList[0];

    const viewProps = {
      latestAppVersion,
      versionSortingOptions: this.versionSortingOptions,
      versionSortOptionWithValueSelected: this.versionSortOptionWithValueSelected,
      selectedVersionSortingOption: find(this.versionSortingOptions, {
        value: selectedVersionSortingOptionValue as string
      }),
      groupedAppVersionList
    };

    return <View {...viewProps} />;
  }
}

const mapStateToProps = (rootState: RootState) => ({
  appVersionsByVersion: getAppVersionsByVersion(rootState),
  appVersionsByBuildNumber: getAppVersionsByBuildNumber(rootState)
});

export default connect(mapStateToProps)(AppPage as any);
