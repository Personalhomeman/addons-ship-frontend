import { Dispatch } from 'redux';
import { createAction, createReducer } from 'deox';

import api from '@/services/ship-api';
import { actionTypeCreator } from '@/utils';
import { uploadFileToS3 } from '@/utils/file';
import { AppVersion } from '@/models';
import { Uploadable } from '@/models/uploadable';
import { RootState } from '@/store';

const $ = actionTypeCreator('APP_VERSION');

const _fetchAppVersion = (appSlug: string, versionId: string) => async (
  dispatch: Dispatch,
  getState: () => RootState
) => {
  const {
    auth: { token }
  } = getState();

  api.setToken(token);
  dispatch(fetchAppVersion.next());

  try {
    const appVersion = await api.getAppVersion(appSlug, versionId);

    dispatch(fetchAppVersion.complete(appVersion));
  } catch (error) {
    dispatch(fetchAppVersion.error(error));
  }
};

export const fetchAppVersion = Object.assign(_fetchAppVersion, {
  next: createAction($`GET_NEXT`),
  complete: createAction($`GET_COMPLETE`, resolve => (appVersion: AppVersion) => resolve(appVersion)),
  error: createAction($`GET_ERROR`, resolve => (error: Error) => resolve(error))
});

const _updateAppVersion = (appVersion: AppVersion) => async (dispatch: Dispatch, getState: () => RootState) => {
  const {
    auth: { token }
  } = getState();

  api.setToken(token);

  dispatch(updateAppVersion.next());

  try {
    const newAppVersion = await api.updateAppVersion(appVersion);

    dispatch(updateAppVersion.complete(newAppVersion));
  } catch (error) {
    dispatch(updateAppVersion.error(error));
  }
};

export const updateAppVersion = Object.assign(_updateAppVersion, {
  next: createAction($`UPDATE_NEXT`),
  complete: createAction($`UPDATE_COMPLETE`, resolve => (appVersion: AppVersion) => resolve(appVersion)),
  error: createAction($`UPDATE_ERROR`, resolve => (error: Error) => resolve(error))
});

// Upload screenshots
const _uploadScreenshots = (appSlug: string, versionId: string, screenshots: Uploadable[], files: File[]) => async (
  dispatch: Dispatch,
  getState: () => RootState
) => {
  const {
    auth: { token }
  } = getState();

  api.setToken(token);

  dispatch(uploadScreenshots.next());

  try {
    // Get presigned Urls
    const withPresignedUrl = await api.uploadScreenshots(appSlug, versionId, screenshots);

    // Upload images to S3
    await Promise.all(
      withPresignedUrl.map(({ filename, filesize, uploadUrl }) => {
        const file = files.find(({ name, size }) => name === filename && size === filesize);

        return uploadFileToS3(file, uploadUrl);
      })
    );

    // Mark screenshots as uploaded
    await api.uploadedScreenshots(appSlug, versionId);
    dispatch(uploadScreenshots.complete());
  } catch (error) {
    dispatch(uploadScreenshots.error(error));
  }
};

export const uploadScreenshots = Object.assign(_uploadScreenshots, {
  next: createAction($`UPLOAD_SCREENSHOTS_NEXT`),
  complete: createAction($`UPLOAD_SCREENSHOTS_COMPLETE`),
  error: createAction($`UPLOAD_SCREENSHOTS_ERROR`, resolve => (error: Error) => resolve(error))
});

const _publishAppVersion = (appVersion: AppVersion) => async (dispatch: Dispatch, getState: () => RootState) => {
  const {
    auth: { token }
  } = getState();

  api.setToken(token);

  dispatch(publishAppVersion.next());

  try {
    await api.publishAppVersion(appVersion);

    dispatch(publishAppVersion.complete());
  } catch (error) {
    dispatch(publishAppVersion.error(error));
  }
};

export const publishAppVersion = Object.assign(_publishAppVersion, {
  next: createAction($`PUBLISH_NEXT`),
  complete: createAction($`PUBLISH_COMPLETE`, resolve => () => resolve()),
  error: createAction($`PUBLISH_ERROR`, resolve => (error: Error) => resolve(error))
});

const defaultState: AppVersionState = { appVersion: null, isPublishInProgress: false };

export type AppVersionState = {
  appVersion: AppVersion | null;
  isPublishInProgress?: boolean;
};
export const appVersion = createReducer(defaultState, handleAction => [
  handleAction([fetchAppVersion.complete, updateAppVersion.complete], (state, { payload }) => ({
    ...state,
    appVersion: payload
  })),
  handleAction(publishAppVersion.next, state => ({ ...state, isPublishInProgress: true })),
  handleAction([publishAppVersion.complete, publishAppVersion.error], state => ({
    ...state,
    isPublishInProgress: false
  }))
]);
