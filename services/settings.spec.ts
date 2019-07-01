import { mockAppVersion, mockSettings, mockAndroidAppVersion } from '@/mocks';

import settingsService from './settings';
import { IosSettings, AndroidSettings, Settings } from '@/models';

jest.mock('@/utils/media');
jest.mock('@/utils/device');
describe('SettingsService', () => {
  describe('isComplete', () => {
    describe('when all settings are filled out', () => {
      it('returns true', () => {
        expect(
          settingsService.isComplete(mockAppVersion, mockSettings as {
            iosSettings: IosSettings;
            androidSettings: AndroidSettings;
          })
        ).toBeTruthy();
      });
    });

    [
      'artifactExposingWorkflows',
      'appleDeveloperAccountEmail',
      'appSku',
      'appSpecificPassword',
      'selectedProvProfile',
      'selectedCertificate'
    ].forEach(setting => {
      describe(`when iOS setting ${setting} is missing`, () => {
        let settings: {
          iosSettings: IosSettings;
          androidSettings: AndroidSettings;
        };

        beforeEach(() => {
          settings = {
            iosSettings: { ...(mockSettings.iosSettings as IosSettings), [setting]: '' },
            androidSettings: mockSettings.androidSettings as AndroidSettings
          };
        });

        describe('and app version is iOS', () => {
          it('returns false', () => {
            expect(settingsService.isComplete(mockAppVersion, settings)).toBeFalsy();
          });
        });

        describe('but app version is Android', () => {
          it('returns true', () => {
            expect(settingsService.isComplete(mockAndroidAppVersion, settings)).toBeTruthy();
          });
        });
      });
    });

    ['artifactExposingWorkflows', 'track', 'selectedKeystoreFile', 'selectedServiceAccountJsonFile'].forEach(
      setting => {
        describe(`when Android setting ${setting} is missing`, () => {
          let settings: {
            iosSettings: IosSettings;
            androidSettings: AndroidSettings;
          };

          beforeEach(() => {
            settings = {
              iosSettings: mockSettings.iosSettings as IosSettings,
              androidSettings: { ...(mockSettings.androidSettings as AndroidSettings), [setting]: '' }
            };
          });

          describe('and app version is Android', () => {
            it('returns false', () => {
              expect(settingsService.isComplete(mockAndroidAppVersion, settings)).toBeFalsy();
            });
          });

          describe('but app version is iOS', () => {
            it('returns true', () => {
              expect(settingsService.isComplete(mockAppVersion, settings)).toBeTruthy();
            });
          });
        });
      }
    );
  });
});
