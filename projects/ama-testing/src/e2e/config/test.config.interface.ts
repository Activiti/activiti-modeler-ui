 /*!
 * @license
 * Copyright 2019 Alfresco, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface APSBackendConfig {
    authType: 'OAUTH';
    oauth2: {
        host: string;
        clientId: string;
        scope: string;
        secret: string;
        implicitFlow: boolean;
        silentLogin: boolean;
        redirectUri: string;
        redirectUriLogout: string;
    };
    bpmHost: string;
}

export interface TestConfig {
    main: {
        default_timeout: number;
        presence_timeout: number;
        rootPath: string;
        browserWidth: number;
        browserHeight: number;
        paths: {
            tmp: string;
            screenShots: string;
            junitReport: string;
            reports: string;
            download: string;
        },
        screenshots: {
            url: string;
            user: string;
            password: string;
        }
    };
    ama: {
        url: string;
        port: string;
        backendConfig: APSBackendConfig;
        user: string;
        password: string;
        unauthorized_user: string,
        unauthorized_user_password: string,
        appTitle: string;
    };
}
