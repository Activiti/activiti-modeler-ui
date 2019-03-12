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

import { testConfig } from '../../test.config';
import { LoginPage, LoginPageImplementation } from '../../pages/login.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { DeleteEntityDialog } from '../../pages/dialog/delete-entity.dialog';
import { SnackBar } from '../../pages/snackbar';
import { NodeEntry } from 'alfresco-js-api-node';
import { Backend } from '../../api/api.interfaces';
import { getBackend } from '../../api/helpers';
import { AuthenticatedPage } from '../../pages/authenticated.page';

describe('Delete project', () => {
    const adminUser = {
        user: testConfig.ama.user,
        password: testConfig.ama.password
    };

    const loginPage: LoginPageImplementation = LoginPage.get();
    const authenticatedPage = new AuthenticatedPage();
    const dashboardPage = new DashboardPage();
    const snackBar = new SnackBar();
    const deleteEntityDialog = new DeleteEntityDialog();

    let backend: Backend;
    let app: NodeEntry;

    beforeAll(async () => {
        backend = await getBackend().setUp();
        app = await backend.project.createAndWaitUntilAvailable();
    });

    beforeAll(async () => {
        await loginPage.navigateTo();
        await loginPage.login(adminUser.user, adminUser.password);
        await authenticatedPage.isLoggedIn();
    });

    it('1. [C286407] Delete project with confirmation', async () => {
        const appId = app.entry.id;
        await dashboardPage.deleteProject(appId);
        await deleteEntityDialog.checkDialogAndConfirm('project');
        expect(await snackBar.isDeletedSuccessfully('project')).toBe(true);
        expect(await dashboardPage.isProjectNotInList(appId)).toBe(true);
    });

    afterAll(async () => {
        await backend.tearDown();
        await authenticatedPage.logout();
    });
});
