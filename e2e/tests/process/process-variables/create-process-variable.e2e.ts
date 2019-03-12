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

import { testConfig } from '../../../test.config';
import { LoginPage, LoginPageImplementation } from '../../../pages/login.page';
import { NodeEntry } from 'alfresco-js-api-node';
import { Backend } from '../../../api/api.interfaces';
import { getBackend } from '../../../api/helpers';
import { AuthenticatedPage } from '../../../pages/authenticated.page';
import { ProcessContentPage } from '../../../pages/process-content.page';
import { ProcessPropertiesCard } from '../../../pages/process-properties.card';
import { ProcessVariablesDialog } from '../../../pages/dialog/process-variables.dialog';
import { CodeEditorWidget } from '../../../pages/code-editor.widget';

describe('Create process variable', async () => {
    const adminUser = {
        user: testConfig.ama.user,
        password: testConfig.ama.password
    };

    let backend: Backend;
    let loginPage: LoginPageImplementation;
    let project: NodeEntry;
    let process: NodeEntry;
    let processContentPage: ProcessContentPage;
    const processPropertiesCard = new ProcessPropertiesCard();
    const authenticatedPage = new AuthenticatedPage();
    const processVariablesDialog = new ProcessVariablesDialog();
    const codeEditorWidget = new CodeEditorWidget();

    beforeAll(async () => {
        backend = await getBackend().setUp();
        project = await backend.project.createAndWaitUntilAvailable();
    });

    beforeAll(async () => {
        loginPage = LoginPage.get();
        await loginPage.navigateTo();
        await loginPage.login(adminUser.user, adminUser.password);
        await authenticatedPage.isLoggedIn();
    });

    beforeEach(async () => {
        process = await backend.process.create(project.entry.id);
    });

    beforeEach(async () => {
        processContentPage = new ProcessContentPage(project.entry.id, process.entry.id);
        await processContentPage.navigateTo();
        await processPropertiesCard.isLoaded();
    });

    it('1. [C282018] Create process variable', async () => {
        await processPropertiesCard.editProcessVariables();
        await processVariablesDialog.isLoaded();
        await processVariablesDialog.addVariable();
        expect(await processVariablesDialog.isVariableDisplayed(0)).toBe(true, 'Variable added is not displayed in the list.');

        const variableId = await processVariablesDialog.getVariableIdByRow(0);
        const expectedVariable = {};
        expectedVariable[variableId] = {
            'id': variableId,
            'name': 'name',
            'type': 'string',
            'required': false,
            'value': ''
        };
        await processVariablesDialog.goTocodeEditor();

        expect(JSON.parse(await codeEditorWidget.getCodeEditorValue(1))).toEqual(expectedVariable, `Variables objects are not equal`);

        await processVariablesDialog.update();
        await processVariablesDialog.close();

        await processPropertiesCard.editProcessVariables();
        expect(await processVariablesDialog.isVariableDisplayed(0)).toBe(true, 'Variable added is not displayed in the list.');
    });

    it('2. [C299156] Verify icon from the button and the modal title', async () => {
        expect(await processPropertiesCard.isEditVariablesButtonIconDisplayed()).toBe(true, 'Icon is not displayed on the Edit Variables button.');
        await processPropertiesCard.editProcessVariables();
        expect(await processVariablesDialog.isTitleIconDisplayed()).toBe(true, 'Title icon is not displayed on the Edit Variables modal.');
    });

    afterAll(async () => {
        if ( processVariablesDialog.isLoaded() ) {
            await processVariablesDialog.close();
        }
        await backend.project.delete(project.entry.id);
        await backend.tearDown();
        await authenticatedPage.logout();
    });
});
