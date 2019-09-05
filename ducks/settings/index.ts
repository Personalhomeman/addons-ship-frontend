import { createReducer } from 'deox';

import { Settings, AppContact } from '@/models/settings';

import fetchSettings from './fetchSettings';
import updateSettings from './updateSettings';
import addAppContact from './addAppContact';
import listAppContacts from './listAppContacts';
import updateAppContact from './updateAppContact';
import deleteAppContact from './deleteAppContact';

import merge from 'lodash/merge';

const defaultState: SettingsState = {
  settings: {
    projectType: 'other',
    iosWorkflow: '',
    androidWorkflow: ''
  },
  appContacts: [],
  isSavingSettings: false
};

export { fetchSettings, updateSettings, addAppContact, listAppContacts, updateAppContact, deleteAppContact };

export type SettingsState = { settings: Settings; appContacts: AppContact[]; isSavingSettings?: boolean };
export default createReducer(defaultState, handleAction => [
  handleAction([fetchSettings.complete, updateSettings.complete], (state, { payload }) => ({
    ...state,
    settings: merge(state.settings, payload),
    isSavingSettings: false
  })),
  handleAction(addAppContact.complete, (state, { payload }) => ({
    ...state,
    appContacts: state.appContacts.concat(payload)
  })),
  handleAction(listAppContacts.complete, (state, { payload }) => ({
    ...state,
    appContacts: payload
  })),
  handleAction(updateAppContact.complete, ({ appContacts, ...state }, { payload }) => ({
    ...state,
    appContacts: appContacts.map(appContact => {
      if (appContact.id === payload.id) {
        return payload;
      }

      return appContact;
    })
  })),
  handleAction(deleteAppContact.complete, ({ appContacts, ...state }, { payload }) => ({
    ...state,
    appContacts: appContacts.filter(({ id }) => id !== payload)
  })),
  handleAction(updateSettings.next, state => ({ ...state, isSavingSettings: true }))
]);
