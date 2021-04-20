/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { base64 } from './crypt';

// Firebase Auth tokens contain snake_case claims following the JWT standard / convention.
/* eslint-disable camelcase */

export type FirebaseSignInProvider =
  | 'custom'
  | 'email'
  | 'password'
  | 'phone'
  | 'anonymous'
  | 'google.com'
  | 'facebook.com'
  | 'github.com'
  | 'twitter.com'
  | 'microsoft.com'
  | 'apple.com';

export interface FirebaseIdToken {
  // Always set to https://securetoken.google.com/PROJECT_ID
  iss: string;

  // Always set to PROJECT_ID
  aud: string;

  // The user's unique id
  sub: string;

  // The token issue time, in seconds since epoch
  iat: number;

  // The token expiry time, normally 'iat' + 3600
  exp: number;

  // The user's unique id, must be equal to 'sub'
  user_id: string;

  // The time the user authenticated, normally 'iat'
  auth_time: number;

  // The sign in provider, only set when the provider is 'anonymous'
  provider_id?: 'anonymous';

  // The user's primary email
  email?: string;

  // The user's email verification status
  email_verified?: boolean;

  // The user's primary phone number
  phone_number?: string;

  // The user's display name
  name?: string;

  // The user's profile photo URL
  picture?: string;

  // Information on all identities linked to this user
  firebase: {
    // The primary sign-in provider
    sign_in_provider: FirebaseSignInProvider;

    // A map of providers to the user's list of unique identifiers from
    // each provider
    identities?: { [provider in FirebaseSignInProvider]?: string[] };
  };

  // Custom claims set by the developer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [claim: string]: any;

  uid?: never; // Try to catch a common mistake of "uid" (should be "sub" instead).
}

export function createMockUserToken(
  token: Partial<FirebaseIdToken>,
  projectId?: string
): string {
  if (token.uid) {
    throw new Error(
      'Invalid Firebase token field "uid". Did you mean "sub" (for Firebase Auth User ID)?'
    );
  }
  // Unsecured JWTs use "none" as the algorithm.
  const header = {
    alg: 'none',
    type: 'JWT'
  };

  const project = projectId || 'demo-project';
  const iat = token.iat || 0;
  const uid = token.uid || token.user_id;
  if (!uid) {
    throw new Error("Auth must contain 'sub' or 'user_id' field!");
  }

  const payload: FirebaseIdToken = {
    // Set all required fields to decent defaults
    iss: `https://securetoken.google.com/${project}`,
    aud: project,
    iat,
    exp: iat + 3600,
    auth_time: iat,
    sub: uid,
    user_id: uid,
    firebase: {
      sign_in_provider: 'custom',
      identities: {}
    },

    // Override with user options
    ...token
  };

  // Unsecured JWTs use the empty string as a signature.
  const signature = '';
  return [
    base64.encodeString(JSON.stringify(header), /*webSafe=*/ false),
    base64.encodeString(JSON.stringify(payload), /*webSafe=*/ false),
    signature
  ].join('.');
}
