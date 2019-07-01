import { Component } from 'react';
import { connect } from 'react-redux';
import map from 'lodash/map';
import { get } from 'lodash';
import update from 'lodash/update';
import filter from 'lodash/filter';
import { isAndroid, isIOS, osVersion, mobileModel, compareVersions } from '@/utils/device';

import { AppVersion, Settings, IosSettings, AndroidSettings } from '@/models';
import { RootState } from '@/store';
import { updateAppVersion, uploadScreenshots, publishAppVersion, appVersion } from '@/ducks/appVersion';
import { fetchSettings } from '@/ducks/settings';
import settingService from '@/services/settings';

import View from './view';
import { Uploadable } from '@/models/uploadable';

type Props = {
  appVersion: AppVersion;
  settings: Settings;
  updateAppVersion: typeof updateAppVersion;
  uploadScreenshots: typeof uploadScreenshots;
};

export type State = {
  showTooltips: boolean;
  updatedAppVersion: AppVersion | null;
  screenshotList: { [deviceId: string]: DeviceScreenshots };
  featureGraphic?: File;
  selectedDeviceIdForScreenshots: string;
  readyForPublish?: boolean;
  publishInProgress: boolean;
};

type DeviceScreenshots = {
  deviceName: string;
  screenshots?: File[];
};

export class AppVersionDetails extends Component<Props, State> {
  state: State = {
    showTooltips: false,
    updatedAppVersion: null,
    screenshotList: {
      iphone65: {
        deviceName: 'iPhone 6.5”'
      },
      iphone58: {
        deviceName: 'iPhone 5.8”'
      },
      iphone55: {
        deviceName: 'iPhone 5.5”'
      },
      iphone47: {
        deviceName: 'iPhone 4.7”'
      },
      iphone4: {
        deviceName: 'iPhone 4”'
      },
      ipad: {
        deviceName: 'iPad'
      },
      ipadpro: {
        deviceName: 'iPad Pro'
      },
      ipadpro105: {
        deviceName: 'iPad Pro 10.5”'
      },
      ipadpro129: {
        deviceName: 'iPad Pro 12.9”'
      },
      applewatch: {
        deviceName: 'Apple Watch'
      },
      applewatch4: {
        deviceName: 'Apple Watch 4'
      }
    },
    featureGraphic: undefined,
    selectedDeviceIdForScreenshots: 'iphone65',
    publishInProgress: false
  };

  componentDidMount() {
    const { appVersion } = this.props;

    this.setState({ showTooltips: true, updatedAppVersion: appVersion });
  }

  onChange = (key: string, newValue: string) => {
    if (!key) return;

    const { appVersion } = this.props;

    const updatedAppVersion = {
      ...appVersion,
      [key]: newValue
    };

    this.setState({ updatedAppVersion });
  };

  getUploadableScreenshots = (): [Uploadable[], File[]] => {
    const { screenshotList } = this.state;

    const uploadables: Uploadable[] = [],
      files: File[] = [];

    filter(screenshotList, 'screenshots').forEach(({ deviceName, screenshots }) => {
      uploadables.push(
        ...(screenshots as File[]).map(s => ({
          filename: s.name,
          filesize: s.size,
          deviceType: deviceName,
          screenSize: deviceName
        }))
      );

      files.push(...(screenshots as File[]));
    });

    return [uploadables, files];
  };

  onSave = () => {
    const {
      appVersion: { appSlug, id },
      updateAppVersion,
      uploadScreenshots
    } = this.props;
    const { updatedAppVersion } = this.state;

    updateAppVersion(updatedAppVersion as AppVersion);

    const [uploadable, files] = this.getUploadableScreenshots();

    uploadScreenshots(appSlug, id.toString(), uploadable, files);
  };

  onPublish = async () => {
    const { appVersion } = this.props;

    this.setState({ publishInProgress: true });
    await publishAppVersion(appVersion);
    this.setState({ publishInProgress: false });
  };

  onScreenshotAdded = (deviceId: string, newScreenshots: File[]) => {
    const screenshotList = update({ ...this.state.screenshotList }, `${deviceId}.screenshots`, (screenshots = []) =>
      screenshots.concat(newScreenshots)
    );

    this.setState({ screenshotList });
  };

  removeScreenshot = (deviceId: string, screenshot: File) => {
    const screenshotList = update({ ...this.state.screenshotList }, `${deviceId}.screenshots`, (screenshots = []) =>
      screenshots.filter((file: File) => file !== screenshot)
    );

    this.setState({ screenshotList });
  };

  onFeatureGraphicAdded = (newFeatureGraphic: File) => {
    this.setState({ featureGraphic: newFeatureGraphic });
  };

  removeFeatureGraphic = () => {
    this.setState({ featureGraphic: undefined });
  };

  onDeviceSelected = (deviceId: string) => {
    this.setState({ selectedDeviceIdForScreenshots: deviceId });
  };

  shouldEnableInstall = () => {
    const { appVersion } = this.props;
    if (!appVersion.publicInstallPageURL) {
      return false;
    }

    if ((appVersion.platform === 'android' && !isAndroid()) || (appVersion.platform === 'ios' && !isIOS())) {
      return false;
    }

    if (compareVersions(appVersion.version, osVersion()) < 0) {
      return false;
    }

    if (!appVersion.supportedDeviceTypes.includes(mobileModel())) {
      return false;
    }

    return true;
  };

  readyForPublish = () => {
    const { appVersion, settings } = this.props;

    return settingService.isComplete(appVersion, settings as {
      iosSettings: IosSettings;
      androidSettings: AndroidSettings;
    });
  };

  render() {
    const { appVersion } = this.props;
    const {
      showTooltips,
      selectedDeviceIdForScreenshots,
      screenshotList,
      featureGraphic,
      publishInProgress
    } = this.state;

    const viewProps = {
      appVersion,
      showTooltips,
      onChange: this.onChange,
      onSave: this.onSave,
      onPublish: this.onPublish,
      onScreenshotAdded: this.onScreenshotAdded,
      availableDevices: map(screenshotList, ({ deviceName: value }, key) => ({
        key,
        value,
        isMarked: ((get(get(screenshotList, key), 'screenshots') || []).length > 0) as boolean
      })),
      selectedDeviceIdForScreenshots,
      screenshots: screenshotList[selectedDeviceIdForScreenshots].screenshots,
      removeScreenshot: this.removeScreenshot,
      featureGraphic: featureGraphic,
      onFeatureGraphicAdded: this.onFeatureGraphicAdded,
      removeFeatureGraphic: this.removeFeatureGraphic,
      onDeviceSelected: this.onDeviceSelected,
      shouldEnableInstall: this.shouldEnableInstall(),
      readyForPublish: this.readyForPublish(),
      publishInProgress,
      publishTarget:
        (appVersion.platform === 'ios' && 'App Store Connect') ||
        (appVersion.platform === 'android' && 'Google Play Store') ||
        'production',
      settingsPath: `/apps/${appVersion.appSlug}/settings`
    };

    return <View {...viewProps} />;
  }
}

const mapStateToProps = ({ appVersion, settings }: RootState) => ({ appVersion, settings });
const mapDispatchToProps = {
  updateAppVersion,
  uploadScreenshots
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AppVersionDetails as any);
