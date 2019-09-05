import { Component } from 'react';
import { connect } from 'react-redux';
import map from 'lodash/map';
import get from 'lodash/get';
import update from 'lodash/update';
import filter from 'lodash/filter';
import { Flex, ProgressBitbot } from '@bitrise/bitkit';

import { isAndroid, isIOS, osVersion, mobileModel, compareVersions } from '@/utils/device';
import { AppVersion, AppVersionEvent, FeatureGraphic, Screenshot, AppVersionEventStatus } from '@/models';
import { Settings, IosSettings, AndroidSettings } from '@/models/settings';
import { Uploadable, ScreenshotResponse } from '@/models/uploadable';
import { RootState } from '@/store';
import {
  updateAppVersion,
  uploadScreenshots,
  deleteScreenshot,
  uploadFeatureGraphic,
  deleteFeatureGraphic,
  publishAppVersion,
  pollPublishStatus
} from '@/ducks/appVersion';
import { fetchSettings } from '@/ducks/settings';
import { orderedAppVersionEvents } from '@/ducks/selectors';
import settingService from '@/services/settings';

import View from './view';

export type Props = {
  appSlug: string;
  versionId: string;
  isSaving: boolean;
  appVersion: AppVersion | null;
  settings: Settings;
  appVersionEvents: AppVersionEvent[];
  updateAppVersion: typeof updateAppVersion;
  uploadScreenshots: typeof uploadScreenshots;
  deleteScreenshot: typeof deleteScreenshot;
  uploadFeatureGraphic: typeof uploadFeatureGraphic;
  deleteFeatureGraphic: typeof deleteFeatureGraphic;

  publishAppVersion: typeof publishAppVersion;
  startPollPublishStatus: typeof pollPublishStatus.start;
  cancelPollPublishStatus: typeof pollPublishStatus.cancel;
  fetchSettings: typeof fetchSettings;
};

export type State = {
  hasMounted: boolean;
  updatedAppVersion: AppVersion | null;
  screenshotList: { [deviceId: string]: DeviceScreenshots };
  featureGraphic?: FeatureGraphic;
  selectedDeviceIdForScreenshots: string;
  readyForPublish?: boolean;
  latestEvent: AppVersionEvent | null;
  isPublishInProgress: boolean;
  screenshotIdsToDelete: string[];
  isFeatureGraphicMarkedForDelete: boolean;
};

type DeviceScreenshots = {
  deviceName: string;
  screenshots?: Screenshot[];
};

export class AppVersionDetails extends Component<Props, State> {
  state: State = {
    hasMounted: false,
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
    latestEvent: null,
    isPublishInProgress: false,
    screenshotIdsToDelete: [],
    isFeatureGraphicMarkedForDelete: false
  };

  componentDidMount() {
    const { appSlug, fetchSettings } = this.props;

    fetchSettings(appSlug);
    this.init();
  }

  componentDidUpdate({ appVersionEvents: prevEvents, appVersion: prevAppVersion }: Props) {
    const { appVersionEvents: events, cancelPollPublishStatus, appVersion } = this.props;

    if (events.length && prevEvents.length !== events.length) {
      const latestEvent = events[0];

      if (latestEvent) {
        const isPublishInProgress = latestEvent.status === AppVersionEventStatus.InProgress;

        this.setState({ latestEvent, isPublishInProgress });

        if (!isPublishInProgress) {
          cancelPollPublishStatus();
        }
      }
    }

    if (prevAppVersion === null && appVersion) {
      this.init();
    }
  }

  componentWillUnmount() {
    const { cancelPollPublishStatus } = this.props;

    cancelPollPublishStatus();
  }

  init = () => {
    const { appVersion, startPollPublishStatus } = this.props;
    const { screenshotList } = this.state;
    if (appVersion) {
      const newScreenshotList = { ...screenshotList };

      this.setState({
        hasMounted: true,
        updatedAppVersion: appVersion
      });
      startPollPublishStatus(appVersion);

      appVersion.screenshotDatas.forEach(({ id, filename, downloadUrl, filesize, deviceType }: ScreenshotResponse) => {
        const screenshot = new Screenshot(id, filename, downloadUrl, filesize, deviceType);

        let deviceId = Object.keys(newScreenshotList).find(
          key => newScreenshotList[key].deviceName === screenshot.deviceType
        ) as string;
        if (!deviceId) {
          deviceId = screenshot.deviceType as string;
        }

        if (!newScreenshotList[deviceId]) {
          newScreenshotList[deviceId] = {
            deviceName: deviceId
          };
        }
        if (!newScreenshotList[deviceId].screenshots) {
          newScreenshotList[deviceId].screenshots = [];
        }

        (newScreenshotList[deviceId].screenshots as Screenshot[]).push(screenshot);
      });
      this.setState({
        screenshotList: newScreenshotList
      });

      if (appVersion.featureGraphicData) {
        const { id, filename, downloadUrl } = appVersion.featureGraphicData;
        this.setState({ featureGraphic: new FeatureGraphic(id, filename, downloadUrl) });
      }
    }
  };

  onChange = (key: string, newValue: string) => {
    if (!key) return;

    const { updatedAppVersion } = this.state;

    this.setState({
      updatedAppVersion: { ...updatedAppVersion, [key]: newValue } as AppVersion
    });
  };

  getUploadableScreenshots = (): [Uploadable[], File[]] => {
    const { screenshotList } = this.state;

    const uploadables: Uploadable[] = [],
      files: File[] = [];

    filter(screenshotList, 'screenshots').forEach(({ deviceName, screenshots }) => {
      const pendingScreenshots = (screenshots as Screenshot[]).filter(screenshot => screenshot.type() === 'pending');
      uploadables.push(
        ...pendingScreenshots.map(s => ({
          filename: s.name,
          filesize: s.size as number,
          deviceType: deviceName as string,
          screenSize: deviceName as string
        }))
      );

      files.push(...pendingScreenshots.map(screenshot => screenshot.file));
    });

    return [uploadables, files];
  };

  onSave = () => {
    const {
      appVersion,
      updateAppVersion,
      uploadScreenshots,
      deleteScreenshot,
      uploadFeatureGraphic,
      deleteFeatureGraphic
    } = this.props;

    if (!appVersion) {
      return;
    }

    const { appSlug, id } = appVersion;
    const { updatedAppVersion, screenshotIdsToDelete, featureGraphic, isFeatureGraphicMarkedForDelete } = this.state;

    if (window.analytics) {
      window.analytics.track('AppVersionDetails Save', { addonId: 'addons-ship', appSlug, appVersionId: id });
    }

    if (screenshotIdsToDelete.length > 0) {
      screenshotIdsToDelete.forEach(screenshotId => deleteScreenshot(appSlug, id.toString(), screenshotId));
    }

    updateAppVersion(updatedAppVersion as AppVersion);

    const [uploadables, files] = this.getUploadableScreenshots();

    if (uploadables.length > 0) {
      uploadScreenshots(appSlug, id.toString(), uploadables, files);
    }

    if (featureGraphic && featureGraphic.type() === 'pending') {
      uploadFeatureGraphic(appSlug, id.toString(), featureGraphic);
    } else if (isFeatureGraphicMarkedForDelete) {
      deleteFeatureGraphic(appSlug, id.toString());
    }
  };

  onPublish = async () => {
    const { appVersion, publishAppVersion } = this.props;

    if (!appVersion) {
      return;
    }

    const { appSlug, id } = appVersion;

    if (window.analytics) {
      window.analytics.track('AppVersionDetails Publish', { addonId: 'addons-ship', appSlug, appVersionId: id });
    }

    await publishAppVersion(appVersion);
  };

  onScreenshotAdded = (deviceId: string, files: File[]) => {
    const { appVersion } = this.props;

    if (!appVersion) {
      return;
    }

    const { appSlug, id } = appVersion;

    if (window.analytics) {
      window.analytics.track('AppVersionDetails Added Screenshot', {
        addonId: 'addons-ship',
        appSlug,
        appVersionId: id,
        deviceId
      });
    }

    const screenshotList = update({ ...this.state.screenshotList }, `${deviceId}.screenshots`, (screenshots = []) =>
      screenshots.concat(
        files.map(
          (file: File) => new Screenshot('', file.name, file, file.size, this.state.screenshotList[deviceId].deviceName)
        )
      )
    );

    this.setState({ screenshotList });
  };

  removeScreenshot = (deviceId: string, screenshot: Screenshot) => {
    if (screenshot.src) {
      this.setState({ screenshotIdsToDelete: [...this.state.screenshotIdsToDelete, screenshot.id] });
    }
    const screenshotList = update({ ...this.state.screenshotList }, `${deviceId}.screenshots`, (screenshots = []) =>
      screenshots.filter((file: Screenshot) => file !== screenshot)
    );

    this.setState({ screenshotList });
  };

  onFeatureGraphicAdded = (file: File) => {
    this.setState({ featureGraphic: new FeatureGraphic('', file.name, file, file.size) });
  };

  removeFeatureGraphic = () => {
    const { featureGraphic } = this.state;
    let deleteFeatureGraphic = false;
    if ((featureGraphic as FeatureGraphic).type() === 'uploaded' || this.state.isFeatureGraphicMarkedForDelete) {
      deleteFeatureGraphic = true;
    }

    this.setState({ featureGraphic: undefined, isFeatureGraphicMarkedForDelete: deleteFeatureGraphic });
  };

  onDeviceSelected = (deviceId: string) => {
    this.setState({ selectedDeviceIdForScreenshots: deviceId });
  };

  shouldEnableInstall = () => {
    const { appVersion } = this.props;
    if (!appVersion) {
      return false;
    }

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

  readyForPublish = (): boolean => {
    const { appVersion, settings } = this.props;

    if (!appVersion) {
      return false;
    }

    return settingService.isComplete(appVersion, settings as {
      iosSettings: IosSettings;
      androidSettings: AndroidSettings;
    });
  };

  render() {
    const { versionId, appVersion, isSaving } = this.props;

    if (!appVersion || versionId !== appVersion.id) {
      return (
        <Flex direction="horizontal" container grow>
          <ProgressBitbot color="grape-3" absolute="center" />
        </Flex>
      );
    }

    const {
      hasMounted,
      selectedDeviceIdForScreenshots,
      screenshotList,
      featureGraphic,
      latestEvent,
      isPublishInProgress
    } = this.state;

    const viewProps = {
      appVersion,
      hasMounted,
      isSaving,
      onChange: this.onChange,
      onSave: this.onSave,
      onPublish: this.onPublish,
      onScreenshotAdded: this.onScreenshotAdded,
      availableDevices: map(screenshotList, ({ deviceName: value }, key) => ({
        key,
        value,
        isMarked: !!(((get(screenshotList, `${key}.screenshots`) as unknown) || []) as any[]).length
      })),
      selectedDeviceIdForScreenshots,
      screenshots: screenshotList[selectedDeviceIdForScreenshots].screenshots,
      removeScreenshot: this.removeScreenshot,
      featureGraphic,
      onFeatureGraphicAdded: this.onFeatureGraphicAdded,
      removeFeatureGraphic: this.removeFeatureGraphic,
      onDeviceSelected: this.onDeviceSelected,
      shouldEnableInstall: this.shouldEnableInstall(),
      readyForPublish: this.readyForPublish(),
      isPublishInProgress,
      publishTarget:
        (appVersion.platform === 'ios' && 'App Store Connect') ||
        (appVersion.platform === 'android' && 'Google Play Store') ||
        'production',
      settingsPath: `/apps/${appVersion.appSlug}/settings`,
      activityPath: `/apps/${appVersion.appSlug}/versions/${appVersion.id}/activity`,
      latestEventStatus: get(latestEvent, 'status', null)
    };

    return <View {...viewProps} />;
  }
}

const mapStateToProps = ({ appVersion: { appVersion, events, isSaving }, settings: { settings } }: RootState) => ({
  appVersion,
  settings,
  appVersionEvents: orderedAppVersionEvents(events),
  isSaving: isSaving > 0
});
const mapDispatchToProps = {
  updateAppVersion,
  uploadScreenshots,
  deleteScreenshot,
  uploadFeatureGraphic,
  deleteFeatureGraphic,
  publishAppVersion,
  startPollPublishStatus: pollPublishStatus.start,
  cancelPollPublishStatus: pollPublishStatus.cancel,
  fetchSettings
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
  // @ts-ignore
)(AppVersionDetails);
