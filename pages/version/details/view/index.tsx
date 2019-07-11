import formatDate from 'date-fns/format';
import { Base, Flex, Text, Icon, Image, Notification, Button } from '@bitrise/bitkit';
import { TypeIconName } from '@bitrise/bitkit/lib/esm/Icon/tsx';

import { AppVersion, AppVersionEvent } from '@/models';
import { mediaQuery } from '@/utils/media';

import Sidebar from './sidebar';
import FormIos from './form-ios';
import FormAndroid from './form-android';

type DeviceInfo = {
  key: string;
  value: string;
  isMarked: boolean;
};

type Props = {
  appVersion: AppVersion;
  hasMounted: boolean;
  selectedDeviceIdForScreenshots: string;
  availableDevices: DeviceInfo[];
  screenshots?: File[];
  onScreenshotAdded: (deviceId: string, screenshots: File[]) => void;
  removeScreenshot: (deviceId: string, screenshot: File) => void;
  featureGraphic?: File;
  onFeatureGraphicAdded: (featureGraphic: File) => void;
  removeFeatureGraphic: () => void;
  onDeviceSelected: (key: string) => void;
  onSave?: () => void;
  onPublish?: () => void;
  onChange?: (key: string, newValue: string) => void;
  shouldEnableInstall: boolean;
  readyForPublish: boolean;
  isPublishInProgress: boolean;
  publishTarget: string;
  settingsPath: string;
  latestEventStatus: AppVersionEvent['status'] | null;
};

const publishNotification = (
  publishStatus: AppVersionEvent['status'] | null,
  readyForPublish: boolean,
  publishTarget: string,
  settingsPath: string
) => {
  if (!readyForPublish) {
    return (
      <Notification margin="x2" type="alert" icon="Warning">
        You need to setup publishing at the <a href={settingsPath}>Settings page.</a>
      </Notification>
    );
  }

  switch (publishStatus) {
    case 'in-progress':
      return (
        <Notification margin="x2" type="progress">
          Publishing to {publishTarget} is in progress.
        </Notification>
      );
    case 'finished':
      return (
        <Notification margin="x2" type="success">
          Your app has been successfully published to {publishTarget}.
        </Notification>
      );
    case 'failed':
      return (
        <Notification margin="x2" type="alert">
          Failed to publish you app. See the error log on the Activity tab.
        </Notification>
      );
    default:
      return (
        <Notification margin="x2" type="inform" icon="Deployment">
          App is ready for publishing to {publishTarget}.
        </Notification>
      );
  }
};

export default ({
  appVersion,
  selectedDeviceIdForScreenshots: deviceId,
  onSave,
  onPublish,
  onChange,
  shouldEnableInstall,
  readyForPublish,
  isPublishInProgress,
  publishTarget,
  settingsPath,
  availableDevices,
  latestEventStatus,
  ...props
}: Props) => {
  const iconName: TypeIconName = appVersion.platform === 'ios' ? 'PlatformsApple' : 'PlatformsAndroid';

  const [isDesktop] = mediaQuery('60rem');

  const onFormChange = ({ target: { name, value } }: any) => {
    onChange && onChange(name, value);
  };

  const deviceInfo = availableDevices.find(device => device.key === deviceId) as DeviceInfo;

  return (
    <Base>
      <Flex direction="vertical" alignChildren="middle" paddingVertical="x6">
        <Flex maxWidth={isDesktop ? '100%' : 688}>
          {publishNotification(latestEventStatus, readyForPublish, publishTarget, settingsPath)}
        </Flex>
      </Flex>
      <Flex direction="horizontal" alignChildrenHorizontal={isDesktop ? 'start' : 'middle'} gap="x4">
        <Flex maxWidth={688}>
          <form onChange={onFormChange}>
            <Flex direction="horizontal" margin="x4">
              <Image src={appVersion.iconUrl} borderRadius="x2" />

              <Flex direction="vertical" alignChildrenVertical="middle" paddingHorizontal="x6">
                <Flex direction="horizontal" alignChildren="middle">
                  <Icon color="grape-4" name={iconName} size="1.5rem" />
                  <Text letterSpacing="x2" size="x6" weight="bold" color="grape-4" paddingHorizontal="x2">
                    {appVersion.appName}
                  </Text>
                </Flex>
                <Text letterSpacing="x2" size="x5" weight="bold" color="grape-4" margin="x2">
                  v{appVersion.version} ({appVersion.buildNumber})
                </Text>
                <Text letterSpacing="x1" size="x4" weight="medium" color="gray-6">
                  Updated on {formatDate(appVersion.lastUpdate, 'MMMM D, YYYY')}
                </Text>
              </Flex>
            </Flex>
            <Flex direction="horizontal" alignChildren="start" gap="x4" margin="x8">
              <Button level="primary" onClick={onSave}>
                <Icon name="Bug" />
                <Text>Save</Text>
              </Button>
              <Button level="secondary" disabled={!shouldEnableInstall}>
                <Icon name="Download" />
                <Text>Install</Text>
              </Button>
            </Flex>
            {appVersion.platform === 'ios' && (
              <FormIos
                appVersion={appVersion}
                deviceId={deviceId}
                deviceName={deviceInfo.value}
                availableDevices={availableDevices}
                {...props}
              />
            )}
            {appVersion.platform === 'android' && (
              <FormAndroid
                appVersion={appVersion}
                deviceId={deviceId}
                deviceName={deviceInfo.value}
                availableDevices={availableDevices}
                {...props}
              />
            )}
          </form>
        </Flex>

        {isDesktop && (
          <Sidebar
            publicInstallPageURL={appVersion.publicInstallPageURL}
            shouldEnablePublish={readyForPublish && !isPublishInProgress}
            onSave={onSave}
            onPublish={onPublish}
            buildSlug={appVersion.buildSlug}
          />
        )}
      </Flex>
    </Base>
  );
};
