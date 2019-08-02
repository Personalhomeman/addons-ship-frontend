import fetch, { RequestInit } from 'node-fetch';

import getConfig from 'next/config';

const {
  publicRuntimeConfig: { VERBOSE_LOGGING }
} = getConfig();

const verboseLogging = Boolean(VERBOSE_LOGGING);

const getHeaders = (token: string) => ({
  Authorization: token
});

interface RequestParams extends RequestInit {
  url: string;
  token?: string;
}

export const request = ({ url, method, token, body }: RequestParams) =>
  fetch(url, {
    method,
    headers: token ? getHeaders(token) : undefined,
    body
  }).then(res => {
    if (verboseLogging) {
      console.log('Request', { url, method, token, body });
    }

    if (!res.ok) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }

    return res;
  });

export const get = (url: string, token: string) => request({ method: 'GET', url, token });
export const del = (url: string, token: string) => request({ method: 'DELETE', url, token });
export const patch = (url: string, token: string, body?: RequestInit['body']) =>
  request({ method: 'PATCH', url, token, body });
export const post = (url: string, token: string, body: RequestInit['body']) =>
  request({ method: 'POST', url, token, body });
export const put = (url: string, token: string, body: RequestInit['body']) =>
  request({ method: 'PUT', url, token, body });
