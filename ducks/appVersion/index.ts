import { createReducer } from 'deox';

import { AppVersion, AppVersionEvent } from '@/models';

import fetchAppVersion from './fetchAppVersion';
import updateAppVersion from './updateAppVersion';
import uploadScreenshots from './uploadScreenshots';
import publishAppVersion from './publishAppVersion';
import pollPublishStatus, { pollPublishStatusEpic } from './pollPublishStatus';
import fetchAppVersionEvents from './fetchAppVersionEvents';

export type AppVersionState = {
  appVersion: AppVersion | null;
  isPublishInProgress?: boolean;
  events: AppVersionEvent[];
};

const defaultState: AppVersionState = { appVersion: null, isPublishInProgress: false, events: [] };

export {
  fetchAppVersion,
  updateAppVersion,
  uploadScreenshots,
  publishAppVersion,
  pollPublishStatus,
  pollPublishStatusEpic
};
export default createReducer(defaultState, handleAction => [
  handleAction([fetchAppVersion.complete, updateAppVersion.complete], (state, { payload }) => ({
    ...state,
    appVersion: payload
  })),
  handleAction(publishAppVersion.next, state => ({ ...state, isPublishInProgress: true })),
  handleAction([publishAppVersion.complete, publishAppVersion.error], state => ({
    ...state,
    isPublishInProgress: false
  })),
  handleAction([pollPublishStatus.complete, fetchAppVersionEvents.complete], (state, { payload }) => ({
    ...state,
    events: payload
  }))
]);
