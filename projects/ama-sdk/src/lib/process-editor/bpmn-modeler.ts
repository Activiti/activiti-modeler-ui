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

import { Observable } from 'rxjs';
import { InjectionToken } from '@angular/core';

export interface ModelerInitOptions {
    clickHandler: (event) => any | void;
    changeHandler: (event) => any | void;
    removeHandler: (event) => any | void;
    selectHandler: (event) => any | void;
}

export interface ProcessModelerService {
    init(modelerInitOptions: ModelerInitOptions): void;
    render(container): void;
    getFromModeler(token: string): any;
    getElement(shapeId: string): Bpmn.DiagramElement;
    getRootProcessElement(): Bpmn.DiagramElement;
    updateElementProperty(shapeId: string, propertyName: string, value: any): void;
    loadXml(xml: string): Observable<any>;
    export(): Promise<any>;
    zoomIn(): void;
    zoomOut(): void;
    fitViewPort(): void;
    undo(): void;
    redo(): void;
    destroy();
}

export interface BpmnFactory {
    create(modelerInitOptions: ModelerInitOptions): Bpmn.Modeler;
}

export const BpmnFactoryToken = new InjectionToken('bpmn-factory-token');
export const ProcessModelerServiceToken = new InjectionToken<ProcessModelerService>('process-modeler-service');
