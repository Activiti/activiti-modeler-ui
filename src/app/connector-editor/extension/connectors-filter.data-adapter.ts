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

import { Injectable } from '@angular/core';
import { Observable, zip, of } from 'rxjs';
import { Connector, CONNECTOR, FilterDataAdaper, AmaState, selectProjectConnectorsArray } from 'ama-sdk';
import { Store } from '@ngrx/store';
import { selectConnectorsLoading } from '../store/connector-editor.selectors';
import { ShowConnectorsAction } from '../store/connector-editor.actions';
import { selectConnectorsSettings } from './../../store/selectors/settings.selectors';
import { map, mergeMap } from 'rxjs/operators';

@Injectable()
export class ConnectorsFilterDataAdapter implements FilterDataAdaper {
    connectorSettings$: Observable<boolean>;

    constructor(private store: Store<AmaState>) {}

    get expandedPredicate() {
        return (filters) => filters.indexOf(CONNECTOR) !== -1;
    }

    get contents(): Observable<Connector[]> {
        return this.store.select(selectProjectConnectorsArray).pipe(
            mergeMap((connectors) => zip(of(connectors), this.store.select(selectConnectorsSettings))),
            map(([connectors, showWithTemplate]) => {
                if (!showWithTemplate) {
                    return  connectors.filter(connector => !connector.template);
                } else {
                    return connectors;
                }
            }
        ));
    }

    get loading(): Observable<boolean> {
        return this.store.select(selectConnectorsLoading);
    }

    load(projectId: string): void {
        this.store.dispatch(new ShowConnectorsAction(projectId));
    }
}
