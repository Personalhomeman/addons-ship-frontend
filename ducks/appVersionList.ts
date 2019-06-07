import { Dispatch } from 'redux';
import { createAction, createReducer } from 'deox';

import api from '@/services/ship-api';
import { actionTypeCreator } from '@/utils';
import { AppVersion } from '@/models';

const $ = actionTypeCreator('APP_VERSION_LIST');

const _fetchAppVersionList = (appSlug: string) => async (dispatch: Dispatch) => {
  dispatch(fetchAppVersionList.next());

  try {
    const appVersionList = await api.getAppVersionList(appSlug);

    dispatch(fetchAppVersionList.complete(appVersionList));
  } catch (error) {
    dispatch(fetchAppVersionList.error(error));
  }
};

export const fetchAppVersionList = Object.assign(_fetchAppVersionList, {
  next: createAction($`GET_NEXT`),
  complete: createAction($`GET_COMPLETE`, resolve => (appVersionList: AppVersion[]) => resolve(appVersionList)),
  error: createAction($`GET_ERROR`, resolve => (error: Error) => resolve(error))
});

const defaultState = null as AppVersionListState;

export type AppVersionListState = null | AppVersion[];
export const appVersionList = createReducer(defaultState, handleAction => [
  handleAction(fetchAppVersionList.complete, (_, { payload }) => payload)
]);
