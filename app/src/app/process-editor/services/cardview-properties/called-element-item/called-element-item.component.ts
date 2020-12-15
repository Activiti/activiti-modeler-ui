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

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CardItemTypeService, CardViewUpdateService, CardViewArrayItemModel } from '@alfresco/adf-core';
import { Store } from '@ngrx/store';
import { CalledElementItemModel } from './called-element-item.model';
import { Subject, Observable } from 'rxjs';
import { takeUntil, distinctUntilChanged, tap, map } from 'rxjs/operators';
import { selectProcessesArray } from './../../../store/process-editor.selectors';
import {
    AmaState,
    Process,
    selectProcessPropertiesArrayFor,
    selectProcessMappingsFor,
    UpdateServiceParametersAction,
    selectSelectedProcess,
    ServiceParameterMapping,
    ProcessExtensionsModel,
    EntityProperty,
    OpenDialogAction,
    ServiceParameterMappings,
    VariableMappingBehavior,
    VariableMappingTypeService
} from '@alfresco-dbp/modeling-shared/sdk';
import { UpdateCalledElementAction, UPDATE_CALLED_ELEMENT } from '../../../store/called-element.actions';
import { CalledElementDialogComponent, CalledElementModel } from './called-element-dialog/called-element-dialog.component';
import { ofType, Actions } from '@ngrx/effects';
import { CalledElementService, CalledElementTypes } from './called-element.service';

@Component({
    selector: 'ama-process-called-element',
    templateUrl: './called-element-item.component.html',
    providers: [CardItemTypeService]
})
export class CalledElementComponent implements OnInit, OnDestroy {
    @Input() property: CalledElementItemModel;

    cardViewArrayItem: CardViewArrayItemModel;
    onDestroy$: Subject<void> = new Subject<void>();
    externalProcesses: Process[];
    selectedProcess: Process;
    selectedExternalProcess: Process;
    calledElement = '';
    calledElementType: string;
    sendNoVariables: boolean;
    processVariables: EntityProperty[] = [];
    subProcessVariables: EntityProperty[] = [];
    mappings$: Observable<ServiceParameterMappings>;
    mappingBehavior$: Observable<VariableMappingBehavior>;
    canMapVariable$: Observable<boolean>;
    parameterMappings: ServiceParameterMappings = {};
    loading = false;

    constructor(
        private cardViewUpdateService: CardViewUpdateService,
        private calledElementService: CalledElementService,
        private actions$: Actions,
        private store: Store<AmaState>
    ) { }

    ngOnInit() {
        this.setCalledElement(this.property.value);
        this.cardViewArrayItem = this.calledElementService.createCardViewArrayItem(this.calledElement);
        this.initCallActivity();
        this.initMapping();

        this.cardViewUpdateService.itemClicked$
            .pipe(distinctUntilChanged(), takeUntil(this.onDestroy$))
            .subscribe(this.openDialog.bind(this));

        this.actions$.pipe(
            ofType<UpdateCalledElementAction>(UPDATE_CALLED_ELEMENT),
            distinctUntilChanged(),
            takeUntil(this.onDestroy$))
            .subscribe((action) => {
                this.loading = true;
                this.setCalledElement(action.payload.calledElement);
                this.cardViewArrayItem = this.calledElementService.createCardViewArrayItem(this.calledElement);
                this.cardViewUpdateService.update(this.property, this.calledElement);
                this.loadCallActivity();
                this.loading = false;
                this.parameterMappings = {};
                this.updateMapping();
            });
    }

    initMapping() {
        this.mappings$ = this.store.select(selectProcessMappingsFor(this.property.data.processId, this.property.data.id));
        this.mappingBehavior$ = this.mappings$.pipe(
            tap(mappings => this.parameterMappings = mappings),
            map(mappings => VariableMappingTypeService.getDefaultMappingBehavior(mappings)));
        this.canMapVariable$ = this.mappingBehavior$.pipe(map(mapBehavior => mapBehavior === VariableMappingBehavior.MAP_VARIABLE));
    }

    initCallActivity() {
        this.store.select(selectProcessesArray).pipe(
            takeUntil(this.onDestroy$)
        ).subscribe((processes) => {
            this.externalProcesses = processes;
            this.loadCallActivity();
            this.loadVariables();
        });

        this.store.select(selectSelectedProcess).pipe(
            takeUntil(this.onDestroy$)
        ).subscribe((selectedProcess) => this.selectedProcess = selectedProcess);

    }

    setCalledElement(calledElement: string = '') {
        this.calledElement = calledElement;
        this.calledElementType = this.calledElementService.getCalledElementType(this.calledElement);
    }

    openDialog() {
        this.store.dispatch(new OpenDialogAction(CalledElementDialogComponent, {
            disableClose: true,
            height: '300px',
            width: '500px',
            data: <CalledElementModel>{
                processName: this.selectedProcess.name,
                calledElement: this.calledElement,
                calledElementType: this.calledElementType,
                processVariables: this.processVariables
            }
        }));
    }

    onChangeMappingBehavior(mappingBehavior: VariableMappingBehavior): void {
        this.parameterMappings = VariableMappingTypeService.getMappingValue(mappingBehavior);
        this.updateMapping();
    }

    loadCallActivity() {
        if (this.calledElement && this.isStaticCalledElement()) {
            this.selectedExternalProcess = this.externalProcesses.find((process) => !!process.extensions[this.calledElement]);
            this.loadCalledElementVariables();
        }
    }

    loadVariables() {
        this.store.select(selectProcessPropertiesArrayFor(this.property.data.processId)).subscribe((processVariables) => {
            this.processVariables = processVariables;
        });
    }

    loadCalledElementVariables() {
        if (this.selectedExternalProcess) {
            this.subProcessVariables = Object.values(new ProcessExtensionsModel(this.selectedExternalProcess.extensions).getProperties(this.calledElement));
        }
    }

    changeMapping(mapping: ServiceParameterMapping, type: string): void {
        this.parameterMappings = { ...this.parameterMappings, [type]: mapping };
        this.updateMapping();
    }

    updateMapping(): void {
        this.store.dispatch(
            new UpdateServiceParametersAction(
                this.selectedProcess.id,
                this.property.data.processId,
                this.property.data.id,
                this.parameterMappings
            ));
    }

    isStaticCalledElement(): boolean {
        return this.calledElementType === CalledElementTypes.Static;
    }

    ngOnDestroy() {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }
}
