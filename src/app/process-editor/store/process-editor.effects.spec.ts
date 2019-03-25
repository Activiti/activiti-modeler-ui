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

import { TestBed } from '@angular/core/testing';
import { ProcessEditorEffects } from './process-editor.effects';
import { cold, hot, getTestScheduler } from 'jasmine-marbles';
import { Store } from '@ngrx/store';
import { EffectsMetadata, getEffectsMetadata } from '@ngrx/effects';
import { Router } from '@angular/router';
import { LogService, CoreModule } from '@alfresco/adf-core';
import { provideMockActions } from '@ngrx/effects/testing';
import { ProcessModelerServiceImplementation } from '../services/process-modeler.service';
import { ProcessEditorService } from '../services/process-editor.service';
import { selectSelectedElement, selectProcessesLoaded } from './process-editor.selectors';
import { BpmnFactoryMock } from '../services/bpmn-js/bpmn-js.mock';
import {
    ChangedProcessAction,
    SelectModelerElementAction,
    UpdateProcessAttemptAction,
    UpdateProcessSuccessAction,
    ShowProcessesAction,
    GET_PROCESSES_ATTEMPT,
    CreateProcessSuccessAction,
    UploadProcessAttemptAction
} from './process-editor.actions';
import { throwError, of, Observable } from 'rxjs';
import { mockProcess } from './process.mock';
import {
    AmaApi,
    AmaAuthenticationService,
    DownloadResourceService,
    Process,
    SnackbarErrorAction,
    SnackbarInfoAction,
    SetAppDirtyStateAction,
    AmaTitleService,
    selectSelectedProcess,
    UploadFileAttemptPayload,
    BpmnFactoryToken,
    ProcessModelerServiceToken,
    selectSelectedProjectId
} from 'ama-sdk';
import { ProcessEntitiesState } from './process-entities.state';

describe('ProcessEditorEffects', () => {
    let effects: ProcessEditorEffects;
    let metadata: EffectsMetadata<ProcessEditorEffects>;
    let actions$: Observable<any>;
    let store: Store<ProcessEntitiesState>;
    let process: Process;
    let processEditorService: ProcessEditorService;
    let router: Router;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [CoreModule.forRoot()],
            providers: [
                ProcessEditorEffects,
                { provide: ProcessModelerServiceToken, useClass: ProcessModelerServiceImplementation },
                AmaTitleService,
                DownloadResourceService,
                AmaAuthenticationService,
                AmaApi,
                provideMockActions(() => actions$),
                {
                    provide: BpmnFactoryToken,
                    useClass: BpmnFactoryMock
                },
                {
                    provide: Router,
                    useValue: { navigate: jest.fn() }
                },
                {
                    provide: LogService,
                    useValue: { error: jest.fn() }
                },
                {
                    provide: Store,
                    useValue: {
                        select: jest.fn().mockImplementation(selector => {
                            if (selector === selectSelectedElement) {
                                return of(false);
                            } else if (selector === selectSelectedProcess) {
                                return of(process);
                            } else if (selector === selectSelectedProjectId) {
                                return of('test1');
                            }

                            return of({});
                        })
                    }
                },
                {
                    provide: ProcessEditorService,
                    useValue: {
                        update: jest.fn().mockReturnValue(of(mockProcess)),
                        delete: jest.fn().mockReturnValue(of(mockProcess.id)),
                        getDetails: jest.fn(),
                        getContent: jest.fn(),
                        create: jest.fn().mockReturnValue(of(mockProcess)),
                        upload: jest.fn().mockReturnValue(of(mockProcess)),
                        fetchAll: jest.fn().mockReturnValue(of([mockProcess])),
                        validate: jest.fn().mockReturnValue(of([mockProcess]))
                    }
                }
            ]
        });

        effects = TestBed.get(ProcessEditorEffects);
        metadata = getEffectsMetadata(effects);
        store = TestBed.get(Store);
        router = TestBed.get(Router);
        processEditorService = TestBed.get(ProcessEditorService);
    });

    describe('updateProcessEffect', () => {
        beforeEach(() => {
            process = <Process>mockProcess;
        });

        it('ShowProcesses effect should dispatch an action', () => {
            expect(metadata.showProcessesEffect).toEqual({ dispatch: true });
        });

        it('ShowProcesses effect should dispatch a GetProcessesAtteptAction if there are no processes loaded', () => {
            actions$ = hot('a', { a: new ShowProcessesAction('test') });
            store.select = jest.fn(selectProcessesLoaded).mockReturnValue(of(false));
            const expected = cold('b', { b: { projectId: 'test', type: GET_PROCESSES_ATTEMPT } });
            expect(effects.showProcessesEffect).toBeObservable(expected);
        });

        it('ShowProcesses effect should not dispatch a new GetProjectAtteptAction if there are apps loaded', () => {
            actions$ = hot('a', { a: new ShowProcessesAction('test') });
            const expected = cold('');
            store.select = jest.fn(selectProcessesLoaded).mockReturnValue(of(true));
            expect(effects.showProcessesEffect).toBeObservable(expected);
        });
    });

    describe('uploadProcessEffect', () => {
        beforeEach(() => {
            process = <Process>mockProcess;
        });

        it('uploadProcessEffect should dispatch an action', () => {
            expect(metadata.uploadProcessEffect).toEqual({ dispatch: true });
        });

        it('uploadProcessEffect should dispatch the CreateConnectorSuccessAction', () => {
            actions$ = hot('a', { a: new UploadProcessAttemptAction(<UploadFileAttemptPayload>{file: new File([''], 'filename')}) });
            const expected = cold('(bc)', {
                b: new CreateProcessSuccessAction(process, true),
                c: new SnackbarInfoAction('PROCESS_EDITOR.UPLOAD_SUCCESS'),
            });

            expect(effects.uploadProcessEffect).toBeObservable(expected);
        });
    });

    describe('updateProcessEffect', () => {

        const mockActionPayload = {
            processId: mockProcess.id,
            content: 'diagramData',
            metadata: { name: mockProcess.name, description: mockProcess.description }
        };

        beforeEach(() => {
            process = <Process>mockProcess;
        });

        it('updateProcessEffect should dispatch an action', () => {
            expect(metadata.updateProcessEffect).toEqual({ dispatch: true });
        });

        it('should call the update process endpoint with the proper parameters', () => {
            processEditorService.update = jest.fn().mockReturnValue(of(process));
            actions$ = hot('a', { a: new UpdateProcessAttemptAction(mockActionPayload) });

            effects.updateProcessEffect.subscribe(() => {});
            getTestScheduler().flush();

            expect(processEditorService.update).toHaveBeenCalledWith(
                mockActionPayload.processId,
                { ...mockProcess, ...mockActionPayload.metadata },
                mockActionPayload.content,
                'test1'
            );
        });

        it('should trigger the right action on successful update', () => {
            processEditorService.update = jest.fn().mockReturnValue(of(process));
            actions$ = hot('a', { a: new UpdateProcessAttemptAction(mockActionPayload) });

            const expected = cold('(bcd)', {
                b: new UpdateProcessSuccessAction({id: mockProcess.id, changes: mockActionPayload.metadata}, mockActionPayload.content),
                c: new SetAppDirtyStateAction(false),
                d: new SnackbarInfoAction('PROCESS_EDITOR.PROCESS_UPDATED')
            });

            expect(effects.updateProcessEffect).toBeObservable(expected);
        });

        it('should trigger the right action on unsuccessful update', () => {
            processEditorService.update = jest.fn().mockReturnValue(throwError(new Error()));
            actions$ = hot('a', { a: new UpdateProcessAttemptAction(mockActionPayload) });

            const expected = cold('b', {
                b: new SnackbarErrorAction('APP.PROJECT.ERROR.UPDATE_PROCESS.GENERAL')
            });

            expect(effects.updateProcessEffect).toBeObservable(expected);
        });
    });

    describe('changedElementEffect', () => {
        const mockElement = {
            id: 'mock-element-id',
            type: 'mock-element-type',
            name: 'mock-element-name'
        };

        beforeEach(() => {
            process = <Process>mockProcess;
        });

        it('should dispatch an action', () => {
            expect(metadata.changedElementEffect).toEqual({ dispatch: true });
        });

        it('should dispatch an action if element is different', () => {
            actions$ = hot('a', { a: new ChangedProcessAction(mockElement) });

            const mockElement2 = {
                id: 'mock-element-id',
                type: 'mock-element-type2',
                name: 'mock-element-name'
            };

            store.select = jest.fn(selectSelectedElement).mockReturnValue(of(mockElement2));

            const expected = cold('b', { b: new SelectModelerElementAction(mockElement) });
            expect(effects.changedElementEffect).toBeObservable(expected);
        });

        it('should not dispatch an action if element is the same', () => {
            actions$ = hot('a', { a: new ChangedProcessAction(mockElement) });

            store.select = jest.fn(selectSelectedElement).mockReturnValue(of(mockElement));

            const expected = cold('');
            expect(effects.changedElementEffect).toBeObservable(expected);
        });

        it('should not dispatch an action if selected element is null', () => {
            actions$ = hot('a', { a: new ChangedProcessAction(mockElement) });

            store.select = jest.fn(selectSelectedElement).mockReturnValue(of(null));

            const expected = cold('');
            expect(effects.changedElementEffect).toBeObservable(expected);
        });
    });

    describe('createProcessSuccessEffect Effect', () => {
        it('createProcessSuccessEffect should  not dispatch an action', () => {
            expect(metadata.createProcessSuccessEffect).toEqual({ dispatch: false});
        });

        it('should redirect to the new process page if the payload received is true', () => {
            actions$ = hot('a', { a: new CreateProcessSuccessAction(process, true) });
            effects.createProcessSuccessEffect.subscribe(() => {});
            getTestScheduler().flush();
            expect(router.navigate).toHaveBeenCalledWith(['/projects', 'test1', 'process', process.id]);
        });

        it('should not redirect to the new process page if the payload received is false', () => {
            actions$ = hot('a', { a: new CreateProcessSuccessAction(process, false) });
            effects.createProcessSuccessEffect.subscribe(() => {});
            getTestScheduler().flush();
            expect(router.navigate).not.toHaveBeenCalled();
        });
    });
});
