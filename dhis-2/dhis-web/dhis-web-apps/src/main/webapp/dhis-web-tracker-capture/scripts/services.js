'use strict';

/* Services */

var trackerCaptureServices = angular.module('trackerCaptureServices', ['ngResource'])

.factory('StorageService', function(){
    var store = new dhis2.storage.Store({
        name: "dhis2tc",
        adapters: [dhis2.storage.IndexedDBAdapter, dhis2.storage.DomSessionStorageAdapter, dhis2.storage.InMemoryAdapter],
        objectStores: ['tcPrograms', 'programStages', 'trackedEntities', 'trackedEntityForms', 'attributes','optionSets']
    });
    return{
        currentStore: store
    };
})

/* Factory to fetch relationships */
.factory('RelationshipFactory', function($q, $rootScope, StorageService) { 
    return {
        getAll: function(){
            
            var def = $q.defer();
            
            StorageService.currentStore.open().done(function(){
                StorageService.currentStore.getAll('relationshipTypes').done(function(relationshipTypes){
                    $rootScope.$apply(function(){
                        def.resolve(relationshipTypes);
                    });                    
                });
            });            
            
            return def.promise;            
        },
        get: function(uid){
            
            var def = $q.defer();
            
            StorageService.currentStore.open().done(function(){
                StorageService.currentStore.get('relationshipTypes', uid).done(function(relationshipType){                    
                    $rootScope.$apply(function(){
                        def.resolve(relationshipType);
                    });
                });
            });                        
            return def.promise;            
        }
    };
})

/* Factory to fetch programs */
.factory('ProgramFactory', function($q, $rootScope, StorageService) { 
    return {
        getAll: function(){
            
            var def = $q.defer();
            
            StorageService.currentStore.open().done(function(){
                StorageService.currentStore.getAll('tcPrograms').done(function(programs){
                    $rootScope.$apply(function(){
                        def.resolve(programs);
                    });                    
                });
            });            
            
            return def.promise;            
        },
        get: function(uid){
            
            var def = $q.defer();
            
            StorageService.currentStore.open().done(function(){
                StorageService.currentStore.get('tcPrograms', uid).done(function(pr){                    
                    $rootScope.$apply(function(){
                        def.resolve(pr);
                    });
                });
            });                        
            return def.promise;            
        }
    };
})

/* Factory to fetch programStages */
.factory('ProgramStageFactory', function($q, $rootScope, StorageService) {  
    
    return {        
        get: function(uid){            
            var def = $q.defer();
            StorageService.currentStore.open().done(function(){
                StorageService.currentStore.get('programStages', uid).done(function(pst){                    
                    $rootScope.$apply(function(){
                        def.resolve(pst);
                    });
                });
            });            
            return def.promise;
        },
        getByProgram: function(program){
            var def = $q.defer();
            var stageIds = [];
            var programStages = [];
            angular.forEach(program.programStages, function(stage){
                stageIds.push(stage.id);
            });
            
            StorageService.currentStore.open().done(function(){
                StorageService.currentStore.getAll('programStages').done(function(stages){   
                    angular.forEach(stages, function(stage){
                        if(stageIds.indexOf(stage.id) !== -1){                            
                            programStages.push(stage);                               
                        }                        
                    });
                    $rootScope.$apply(function(){
                        def.resolve(programStages);
                    });
                });                
            });            
            return def.promise;
        }
    };    
})

/*Orgunit service for local db */
.service('OrgUnitService', function($window, $q){
    
    var indexedDB = $window.indexedDB;
    var db = null;
    
    var open = function(){
        var deferred = $q.defer();
        
        var request = indexedDB.open("dhis2ou");
        
        request.onsuccess = function(e) {
          db = e.target.result;
          deferred.resolve();
        };

        request.onerror = function(){
          deferred.reject();
        };

        return deferred.promise;
    };
    
    var get = function(uid){
        
        var deferred = $q.defer();
        
        if( db === null){
            deferred.reject("DB not opened");
        }
        else{
            var tx = db.transaction(["ou"]);
            var store = tx.objectStore("ou");
            var query = store.get(uid);
                
            query.onsuccess = function(e){
                deferred.resolve(e.target.result);
            };
        }
        return deferred.promise;
    };
    
    return {
        open: open,
        get: get
    };    
})

/* Service to deal with enrollment */
.service('EnrollmentService', function($http) {
    
    return {        
        get: function( enrollmentUid ){
            var promise = $http.get(  '../api/enrollments/' + enrollmentUid ).then(function(response){
                return response.data;
            });
            return promise;
        },
        getByEntity: function( entity ){
            var promise = $http.get(  '../api/enrollments?trackedEntityInstance=' + entity ).then(function(response){
                return response.data;
            });
            return promise;
        },
        getByEntityAndProgram: function( entity, program ){
            var promise = $http.get(  '../api/enrollments?trackedEntityInstance=' + entity + '&program=' + program ).then(function(response){
                return response.data;
            });
            return promise;
        },
        getByStartAndEndDate: function( program, orgUnit, ouMode, startDate, endDate ){
            var promise = $http.get(  '../api/enrollments.json?program=' + program + '&orgUnit=' + orgUnit + '&ouMode='+ ouMode + '&startDate=' + startDate + '&endDate=' + endDate + '&paging=false').then(function(response){
                return response.data;
            });
            return promise;
        },
        enroll: function( enrollment ){
            var promise = $http.post(  '../api/enrollments', enrollment ).then(function(response){
                return response.data;
            });
            return promise;
        },
        update: function( enrollment){
            var promise = $http.put( '../api/enrollments/' + enrollment.enrollment , enrollment).then(function(response){
                return response.data;
            });
            return promise;
        },
        cancel: function(enrollment){
            var promise = $http.put('../api/enrollments/' + enrollment.enrollment + '/cancelled').then(function(response){
                return response.data;               
            });
            return promise;           
        },
        complete: function(enrollment){
            var promise = $http.put('../api/enrollments/' + enrollment.enrollment + '/completed').then(function(response){
                return response.data;               
            });
            return promise;           
        }        
    };   
})

/* Service for getting tracked entity */
.factory('TEService', function(StorageService, $q, $rootScope) {

    return {
        
        getAll: function(){            
            var def = $q.defer();
            
            StorageService.currentStore.open().done(function(){
                StorageService.currentStore.getAll('trackedEntities').done(function(entities){
                    $rootScope.$apply(function(){
                        def.resolve(entities);
                    });                    
                });
            });            
            return def.promise;
        },
        get: function(uid){            
            var def = $q.defer();
            
            StorageService.currentStore.open().done(function(){
                StorageService.currentStore.get('trackedEntities', uid).done(function(te){                    
                    $rootScope.$apply(function(){
                        def.resolve(te);
                    });
                });
            });                        
            return def.promise;            
        }
    };
})

/* Service for getting tracked entity Form */
.factory('TEFormService', function(StorageService, $q, $rootScope) {

    return {
        getByProgram: function(programUid){            
            var def = $q.defer();
            
            StorageService.currentStore.open().done(function(){
                StorageService.currentStore.get('trackedEntityForms', programUid).done(function(te){                    
                    $rootScope.$apply(function(){
                        def.resolve(te);
                    });
                });
            });                        
            return def.promise;            
        }
    };
})

/* Service for getting tracked entity instances */
.factory('TEIService', function($http, $q, AttributesFactory, DateUtils) {

    return {
        
        get: function(entityUid) {
            var promise = $http.get(  '../api/trackedEntityInstances/' +  entityUid ).then(function(response){     
                return response.data;
            });            
            return promise;
        },        
        getByOrgUnitAndProgram: function(orgUnitUid, programUid) {

            var url = '../api/trackedEntityInstances.json?ou=' + orgUnitUid + '&program=' + programUid;
            
            var promise = $http.get( url ).then(function(response){
                return response.data;
            });            
            return promise;
        },
        getByOrgUnit: function(orgUnitUid) {           
            
            var url =  '../api/trackedEntityInstances.json?ou=' + orgUnitUid;
            
            var promise = $http.get( url ).then(function(response){
                return response.data;
            });            
            return promise;
        },        
        search: function(ouId, ouMode, queryUrl, programUrl, attributeUrl, pager, paging) {
                
            var url =  '../api/trackedEntityInstances.json?ou=' + ouId + '&ouMode='+ ouMode;
            
            if(queryUrl){
                url = url + '&'+ queryUrl;
            }
            if(programUrl){
                url = url + '&' + programUrl;
            }
            if(attributeUrl){
                url = url + '&' + attributeUrl;
            }
            
            if(paging){
                var pgSize = pager ? pager.pageSize : 50;
                var pg = pager ? pager.page : 1;
                url = url + '&pageSize=' + pgSize + '&page=' + pg;
            }
            else{
                url = url + '&paging=false';
            }
            
            var promise = $http.get( url ).then(function(response){                                
                return response.data;
            });            
            return promise;
        },                
        update: function(tei){
            
            var url = '../api/trackedEntityInstances';
            var promise = $http.put( url + '/' + tei.trackedEntityInstance , tei).then(function(response){
                return response.data;
            });
            return promise;
        },
        register: function(tei){
            
            var url = '../api/trackedEntityInstances';
            
            var promise = $http.post(url, tei).then(function(response){
                return response.data;
            });
            return promise;
        },
        processAttributes: function(selectedTei, selectedProgram, selectedEnrollment, optionSets){
            var def = $q.defer();            
            if(selectedTei.attributes){
                if(selectedProgram && selectedEnrollment){
                    //show attribute for selected program and enrollment
                    AttributesFactory.getByProgram(selectedProgram).then(function(atts){
                        selectedTei.attributes = AttributesFactory.showRequiredAttributes(atts,selectedTei.attributes, true, optionSets);
                        def.resolve(selectedTei);
                    }); 
                }
                if(selectedProgram && !selectedEnrollment){
                    //show attributes for selected program            
                    AttributesFactory.getByProgram(selectedProgram).then(function(atts){    
                        selectedTei.attributes = AttributesFactory.showRequiredAttributes(atts,selectedTei.attributes, false, optionSets);
                        def.resolve(selectedTei);
                    }); 
                }
                if(!selectedProgram && !selectedEnrollment){
                    //show attributes in no program            
                    AttributesFactory.getWithoutProgram().then(function(atts){                
                        selectedTei.attributes = AttributesFactory.showRequiredAttributes(atts,selectedTei.attributes, false, optionSets);     
                        def.resolve(selectedTei);
                    });
                }
            }       
            return def.promise;
        }
    };
})

/* Factory for getting tracked entity attributes */
.factory('AttributesFactory', function($q, $rootScope, StorageService, orderByFilter, DateUtils) {      

    return {
        getAll: function(){
            
            var def = $q.defer();
            
            StorageService.currentStore.open().done(function(){
                StorageService.currentStore.getAll('attributes').done(function(attributes){                    
                    $rootScope.$apply(function(){
                        def.resolve(attributes);
                    });
                });
            });            
            return def.promise;            
        }, 
        getByProgram: function(program){
            
            var attributes = [];
            var programAttributes = [];

            var def = $q.defer();
            this.getAll().then(function(atts){
                angular.forEach(atts, function(attribute){
                    attributes[attribute.id] = attribute;
                });

                angular.forEach(program.programTrackedEntityAttributes, function(pAttribute){
                    var att = attributes[pAttribute.trackedEntityAttribute.id];
                    att.mandatory = pAttribute.mandatory;
                    if(pAttribute.displayInList){
                        att.displayInListNoProgram = true;
                    }                    
                    programAttributes.push(att);                
                });
                def.resolve(programAttributes);                                  
            });
            return def.promise;    
        },
        getWithoutProgram: function(){   
            
            var def = $q.defer();
            this.getAll().then(function(atts){
                var attributes = [];
                angular.forEach(atts, function(attribute){
                    if (attribute.displayInListNoProgram) {
                        attributes.push(attribute);
                    }
                });     
                def.resolve(attributes);             
            });     
            return def.promise;
        },        
        getMissingAttributesForEnrollment: function(tei, program){
            var def = $q.defer();
            this.getByProgram(program).then(function(atts){
                var programAttributes = atts;
                var existingAttributes = tei.attributes;
                var missingAttributes = [];
                
                for(var i=0; i<programAttributes.length; i++){
                    var exists = false;
                    for(var j=0; j<existingAttributes.length && !exists; j++){
                        if(programAttributes[i].id === existingAttributes[j].attribute){
                            exists = true;
                        }
                    }
                    if(!exists){
                        missingAttributes.push(programAttributes[i]);
                    }
                }
                def.resolve(missingAttributes);
            });            
            return def.promise();            
        },
        showRequiredAttributes: function(requiredAttributes, teiAttributes, fromEnrollment, optionSets){        
            
            console.log('required attribtues:  ', requiredAttributes);
            console.log('tei attribtue:  ', teiAttributes);
            //first reset teiAttributes
            for(var j=0; j<teiAttributes.length; j++){
                teiAttributes[j].show = false;                
                if(teiAttributes[j].value){                    
                    if(teiAttributes[j].type === 'number' && !isNaN(parseInt(teiAttributes[j].value))){
                        teiAttributes[j].value = parseInt(teiAttributes[j].value);                        
                    }                    
                }               
            }

            //identify which ones to show
            for(var i=0; i<requiredAttributes.length; i++){
                var processed = false;
                for(var j=0; j<teiAttributes.length && !processed; j++){
                    if(requiredAttributes[i].id === teiAttributes[j].attribute){                    
                        processed = true;
                        teiAttributes[j].show = true;
                        teiAttributes[j].order = i;
                        teiAttributes[j].mandatory = requiredAttributes[i].mandatory ? requiredAttributes[i].mandatory : false;
                        teiAttributes[j].allowFutureDate = requiredAttributes[i].allowFutureDate ? requiredAttributes[i].allowFutureDate : false;
                    }
                }

                if(!processed && fromEnrollment){//attribute was empty, so a chance to put some value
                    teiAttributes.push({show: true, order: i, allowFutureDate: requiredAttributes[i].allowFutureDate ? requiredAttributes[i].allowFutureDate : false, mandatory: requiredAttributes[i].mandatory ? requiredAttributes[i].mandatory : false, attribute: requiredAttributes[i].id, displayName: requiredAttributes[i].name, type: requiredAttributes[i].valueType, value: ''});
                }                   
            }

            teiAttributes = orderByFilter(teiAttributes, '-order');
            teiAttributes.reverse();
            return teiAttributes;
        }
    };
})

/* factory for handling events */
.factory('DHIS2EventFactory', function($http, $q) {   
    
    return {     
        
        getEventsByStatus: function(entity, orgUnit, program, programStatus){   
            var promise = $http.get( '../api/events.json?' + 'trackedEntityInstance=' + entity + '&orgUnit=' + orgUnit + '&program=' + program + '&programStatus=' + programStatus  + '&paging=false').then(function(response){
                return response.data.events;
            });            
            return promise;
        },
        getEventsByProgram: function(entity, orgUnit, program){   
            var promise = $http.get( '../api/events.json?' + 'trackedEntityInstance=' + entity + '&orgUnit=' + orgUnit + '&program=' + program + '&paging=false').then(function(response){
                return response.data.events;
            });            
            return promise;
        },
        getByOrgUnitAndProgram: function(orgUnit, ouMode, program, startDate, endDate){
            var url;
            if(startDate && endDate){
                url = '../api/events.json?' + 'orgUnit=' + orgUnit + '&ouMode='+ ouMode + '&program=' + program + '&startDate=' + startDate + '&endDate=' + endDate + '&paging=false';
            }
            else{
                url = '../api/events.json?' + 'orgUnit=' + orgUnit + '&ouMode='+ ouMode + '&program=' + program + '&paging=false';
            }
            var promise = $http.get( url ).then(function(response){
                return response.data.events;
            });            
            return promise;
        },
        get: function(eventUid){            
            var promise = $http.get('../api/events/' + eventUid + '.json').then(function(response){               
                return response.data;
            });            
            return promise;
        },        
        create: function(dhis2Event){    
            var promise = $http.post('../api/events.json', dhis2Event).then(function(response){
                return response.data;           
            });
            return promise;            
        },
        delete: function(dhis2Event){
            var promise = $http.delete('../api/events/' + dhis2Event.event).then(function(response){
                return response.data;               
            });
            return promise;           
        },
        update: function(dhis2Event){   
            var promise = $http.put('../api/events/' + dhis2Event.event, dhis2Event).then(function(response){
                return response.data;         
            });
            return promise;
        },        
        updateForSingleValue: function(singleValue){   
            var promise = $http.put('../api/events/' + singleValue.event + '/' + singleValue.dataValues[0].dataElement, singleValue ).then(function(response){
                return response.data;
            });
            return promise;
        },
        updateForNote: function(dhis2Event){   
            var promise = $http.put('../api/events/' + dhis2Event.event + '/addNote', dhis2Event).then(function(response){
                return response.data;         
            });
            return promise;
        },
        updateForEventDate: function(dhis2Event){
            var promise = $http.put('../api/events/' + dhis2Event.event + '/updateEventDate', dhis2Event).then(function(response){
                return response.data;         
            });
            return promise;
        }
    };    
})

/* factory for handling event reports */
.factory('EventReportService', function($http, $q) {   
    
    return {        
        getEventReport: function(orgUnit, ouMode, program, startDate, endDate, programStatus, eventStatus, pager){ 
            var pgSize = pager ? pager.pageSize : 50;
        	var pg = pager ? pager.page : 1;
            var url = '../api/events/eventRows.json?' + 'orgUnit=' + orgUnit + '&ouMode='+ ouMode + '&program=' + program + '&programStatus=' + programStatus + '&eventStatus='+ eventStatus + '&pageSize=' + pgSize + '&page=' + pg;
            if(startDate && endDate){
                url = url + '&startDate=' + startDate + '&endDate=' + endDate ;
            }
            var promise = $http.get( url ).then(function(response){
                return response.data;
            });            
            return promise;
        }
    };    
})

.factory('OperatorFactory', function(){
    
    var defaultOperators = ['IS', 'RANGE' ];
    var boolOperators = ['yes', 'no'];
    return{
        defaultOperators: defaultOperators,
        boolOperators: boolOperators
    };  
})

.service('EntityQueryFactory', function(OperatorFactory, DateUtils){  
    
    this.getAttributesQuery = function(attributes, enrollment){

        var query = {url: null, hasValue: false};
        
        angular.forEach(attributes, function(attribute){           

            if(attribute.valueType === 'date' || attribute.valueType === 'number'){
                var q = '';
                
                if(attribute.operator === OperatorFactory.defaultOperators[0]){
                    if(attribute.exactValue && attribute.exactValue !== ''){
                        query.hasValue = true;
                        if(attribute.valueType === 'date'){
                            attribute.exactValue = DateUtils.formatFromUserToApi(attribute.exactValue);
                        }
                        q += 'EQ:' + attribute.exactValue + ':';
                    }
                }                
                if(attribute.operator === OperatorFactory.defaultOperators[1]){
                    if(attribute.startValue && attribute.startValue !== ''){
                        query.hasValue = true;
                        if(attribute.valueType === 'date'){
                            attribute.startValue = DateUtils.formatFromUserToApi(attribute.startValue);
                        }
                        q += 'GT:' + attribute.startValue + ':';
                    }
                    if(attribute.endValue && attribute.endValue !== ''){
                        query.hasValue = true;
                        if(attribute.valueType === 'date'){
                            attribute.endValue = DateUtils.formatFromUserToApi(attribute.endValue);
                        }
                        q += 'LT:' + attribute.endValue + ':';
                    }
                }                
                if(query.url){
                    if(q){
                        q = q.substr(0,q.length-1);
                        query.url = query.url + '&filter=' + attribute.id + ':' + q;
                    }
                }
                else{
                    if(q){
                        q = q.substr(0,q.length-1);
                        query.url = 'filter=' + attribute.id + ':' + q;
                    }
                }
            }
            else{
                if(attribute.value && attribute.value !== ''){                    
                    query.hasValue = true;                

                    if(angular.isArray(attribute.value)){
                        var q = '';
                        angular.forEach(attribute.value, function(val){                        
                            q += val + ';';
                        });

                        q = q.substr(0,q.length-1);

                        if(query.url){
                            if(q){
                                query.url = query.url + '&filter=' + attribute.id + ':IN:' + q;
                            }
                        }
                        else{
                            if(q){
                                query.url = 'filter=' + attribute.id + ':IN:' + q;
                            }
                        }                    
                    }
                    else{                        
                        if(query.url){
                            query.url = query.url + '&filter=' + attribute.id + ':LIKE:' + attribute.value;
                        }
                        else{
                            query.url = 'filter=' + attribute.id + ':LIKE:' + attribute.value;
                        }
                    }
                }
            }            
        });
        
        if(enrollment){
            var q = '';
            if(enrollment.operator === OperatorFactory.defaultOperators[0]){
                if(enrollment.programExactDate && enrollment.programExactDate !== ''){
                    query.hasValue = true;
                    q += '&programStartDate=' + DateUtils.formatFromUserToApi(enrollment.programExactDate) + '&programEndDate=' + DateUtils.formatFromUserToApi(enrollment.programExactDate);
                }
            }
            if(enrollment.operator === OperatorFactory.defaultOperators[1]){
                if(enrollment.programStartDate && enrollment.programStartDate !== ''){                
                    query.hasValue = true;
                    q += '&programStartDate=' + DateUtils.formatFromUserToApi(enrollment.programStartDate);
                }
                if(enrollment.programEndDate && enrollment.programEndDate !== ''){
                    query.hasValue = true;
                    q += '&programEndDate=' + DateUtils.formatFromUserToApi(enrollment.programEndDate);
                }
            }            
            if(q){
                if(query.url){
                    query.url = query.url + q;
                }
                else{
                    query.url = q;
                }
            }            
        }
        return query;
        
    };   
    
    this.resetAttributesQuery = function(attributes, enrollment){
        
        angular.forEach(attributes, function(attribute){
            attribute.exactValue = '';
            attribute.startValue = '';
            attribute.endValue = '';
            attribute.value = '';           
        });
        
        if(enrollment){
            enrollment.programStartDate = '';
            enrollment.programEndDate = '';          
        }        
        return attributes;        
    }; 
})

/* current selections */
.service('CurrentSelection', function(){
    this.currentSelection = '';
    this.relationshipInfo = '';
    
    this.set = function(currentSelection){  
        this.currentSelection = currentSelection;        
    };
    
    this.get = function(){
        return this.currentSelection;
    };
    
    this.setRelationshipInfo = function(relationshipInfo){  
        this.relationshipInfo = relationshipInfo;        
    };
    
    this.getRelationshipInfo = function(){
        return this.relationshipInfo;
    };
})

.service('TEIGridService', function(OrgUnitService, DateUtils, $translate, AttributesFactory){
    
    return {
        format: function(grid, map, optionNamesByCode){
            if(!grid || !grid.rows){
                return;
            }
            
            //grid.headers[0-4] = Instance, Created, Last updated, Org unit, Tracked entity
            //grid.headers[5..] = Attribute, Attribute,.... 
            var attributes = [];
            for(var i=5; i<grid.headers.length; i++){
                attributes.push({id: grid.headers[i].name, name: grid.headers[i].column, type: grid.headers[i].type});
            }

            var entityList = [];
            
            AttributesFactory.getAll().then(function(atts){
                
                var attributes = [];
                angular.forEach(atts, function(att){
                    attributes[att.id] = att;
                });
            
                OrgUnitService.open().then(function(){

                    angular.forEach(grid.rows, function(row){
                        var entity = {};
                        var isEmpty = true;

                        entity.id = row[0];
                        entity.created = DateUtils.formatFromApiToUser( row[1] );
                        entity.orgUnit = row[3];                              
                        entity.type = row[4];

                        OrgUnitService.get(row[3]).then(function(ou){
                            if(ou){
                                entity.orgUnitName = ou.n;
                            }                                                       
                        });

                        for(var i=5; i<row.length; i++){
                            if(row[i] && row[i] !== ''){
                                isEmpty = false;
                                var val = row[i];
                                if(attributes[grid.headers[i].name] && 
                                        attributes[grid.headers[i].name].valueType === 'optionSet' && 
                                        optionNamesByCode &&    
                                        optionNamesByCode[  '"' + val + '"']){
                                    val = optionNamesByCode[  '"' + val + '"'];
                                }
                                if(attributes[grid.headers[i].name] && attributes[grid.headers[i].name].valueType === 'date'){                                    
                                    val = DateUtils.formatFromApiToUser( val );
                                }
                                
                                entity[grid.headers[i].name] = val;
                            }
                        }

                        if(!isEmpty){
                            if(map){
                                entityList[entity.id] = entity;
                            }
                            else{
                                entityList.push(entity);
                            }
                        }        
                    });                
                });
            }); 
            return {headers: attributes, rows: entityList, pager: grid.metaData.pager};                                    
        },
        generateGridColumns: function(attributes, ouMode){
            
            var columns = attributes ? angular.copy(attributes) : [];
       
            //also add extra columns which are not part of attributes (orgunit for example)
            columns.push({id: 'orgUnitName', name: $translate('registering_unit'), valueType: 'string', displayInListNoProgram: false});
            columns.push({id: 'created', name: $translate('registration_date'), valueType: 'date', displayInListNoProgram: false});

            //generate grid column for the selected program/attributes
            angular.forEach(columns, function(column){
                if(column.id === 'orgUnitName' && ouMode !== 'SELECTED'){
                    column.show = true;    
                }

                if(column.displayInListNoProgram || column.displayInList){
                    column.show = true;
                }  
                column.showFilter = false;
            });
            return columns;  
        },
        getData: function(rows, columns){
            var data = [];
            angular.forEach(rows, function(row){
                var d = {};
                angular.forEach(columns, function(col){
                    if(col.show){
                        d[col.name] = row[col.id];
                    }                
                });
                data.push(d);            
            });
            return data;
        },
        getHeader: function(columns){
            var header = []; 
            angular.forEach(columns, function(col){
                if(col.show){
                    header.push($translate(col.name));
                }
            });        
            return header;
        }
    };
})

.service('EventUtils', function(DateUtils, CalendarService, OrgUnitService, $filter, orderByFilter){
    return {
        createDummyEvent: function(events, programStage, orgUnit, enrollment){            
            var today = DateUtils.getToday();    
            var dueDate = this.getEventDueDate(events, programStage, enrollment);
            var dummyEvent = {programStage: programStage.id, 
                              orgUnit: orgUnit.id,
                              orgUnitName: orgUnit.name,
                              dueDate: dueDate,
                              sortingDate: dueDate,
                              name: programStage.name,
                              reportDateDescription: programStage.reportDateDescription,
                              status: 'SCHEDULED'};
            dummyEvent.statusColor = 'alert alert-warning';//'stage-on-time';
            if(moment(today).isAfter(dummyEvent.dueDate)){
                dummyEvent.statusColor = 'alert alert-danger';//'stage-overdue';
            }
            return dummyEvent;        
        },
        getEventStatusColor: function(dhis2Event){    
            var eventDate = DateUtils.getToday();
            var calendarSetting = CalendarService.getSetting();
            
            if(dhis2Event.eventDate){
                eventDate = dhis2Event.eventDate;
            }
    
            if(dhis2Event.status === 'COMPLETED'){
                return 'alert alert-success';//'stage-completed';
            }
            else if(dhis2Event.status === 'SKIPPED'){
                return 'alert alert-default'; //'stage-skipped';
            }
            else{                
                if(dhis2Event.eventDate){
                    return 'alert alert-info'; //'stage-executed';
                }
                else{
                    if(moment(eventDate, calendarSetting.momentFormat).isAfter(dhis2Event.dueDate)){
                        return 'alert alert-danger';//'stage-overdue';
                    }                
                    return 'alert alert-warning';//'stage-on-time';
                }               
            }            
        },
        getEventDueDate: function(events, programStage, enrollment){            
            var referenceDate = enrollment.dateOfIncident ? enrollment.dateOfIncident : enrollment.dateOfEnrollment,
                offset = programStage.minDaysFromStart,
                calendarSetting = CalendarService.getSetting();
        
            if(programStage.generatedByEnrollmentDate){
                referenceDate = enrollment.dateOfEnrollment;
            }
            
            if(programStage.repeatable){
                var eventsPerStage = [];
                angular.forEach(events, function(event){
                    if(event.programStage === programStage.id){
                        eventsPerStage.push(event);
                    }
                });

                if(eventsPerStage.length > 0){
                    eventsPerStage = orderByFilter(eventsPerStage, '-eventDate');
                    referenceDate = eventsPerStage[0].eventDate;
                    offset = programStage.standardInterval;
                }                
            }            
            
            var dueDate = moment(referenceDate, calendarSetting.momentFormat).add('d', offset)._d;
            dueDate = $filter('date')(dueDate, calendarSetting.keyDateFormat); 
            return dueDate;
        },
        getEventOrgUnitName: function(orgUnitId){            
            if(orgUnitId){
                OrgUnitService.open().then(function(){
                    OrgUnitService.get(orgUnitId).then(function(ou){
                        if(ou){
                            return ou.n;             
                        }                                                       
                    });                            
                }); 
            }
        },
        setEventOrgUnitName: function(dhis2Event){            
            if(dhis2Event.orgUnit){
                OrgUnitService.open().then(function(){
                    OrgUnitService.get(dhis2Event.orgUnit).then(function(ou){
                        if(ou){
                            dhis2Event.eventOrgUnitName = ou.n;
                            return dhis2Event;                            
                        }                                                       
                    });                            
                }); 
            }
        },
        reconstruct: function(dhis2Event, programStage){
            
            var e = {dataValues: [], 
                    event: dhis2Event.event, 
                    program: dhis2Event.program, 
                    programStage: dhis2Event.programStage, 
                    orgUnit: dhis2Event.orgUnit, 
                    trackedEntityInstance: dhis2Event.trackedEntityInstance,
                    status: dhis2Event.status,
                    dueDate: dhis2Event.dueDate
                };
                
            angular.forEach(programStage.programStageDataElements, function(prStDe){
                if(dhis2Event[prStDe.dataElement.id]){
                    var val = {value: dhis2Event[prStDe.dataElement.id], dataElement: prStDe.dataElement.id};
                    if(dhis2Event.providedElsewhere[prStDe.dataElement.id]){
                        val.providedElsewhere = dhis2Event.providedElsewhere[prStDe.dataElement.id];
                    }
                    e.dataValues.push(val);
                }                                
            });
                     
            return e;
        }
    }; 
})

/* service for getting calendar setting */
.service('CalendarService', function(storage, $rootScope){    

    return {
        getSetting: function() {
            
            var dhis2CalendarFormat = {keyDateFormat: 'yyyy-MM-dd', keyCalendar: 'gregorian', momentFormat: 'YYYY-MM-DD'};                
            var storedFormat = storage.get('CALENDAR_SETTING');
            if(angular.isObject(storedFormat) && storedFormat.keyDateFormat && storedFormat.keyCalendar){
                if(storedFormat.keyCalendar === 'iso8601'){
                    storedFormat.keyCalendar = 'gregorian';
                }

                if(storedFormat.keyDateFormat === 'dd-MM-yyyy'){
                    dhis2CalendarFormat.momentFormat = 'DD-MM-YYYY';
                }
                
                dhis2CalendarFormat.keyCalendar = storedFormat.keyCalendar;
                dhis2CalendarFormat.keyDateFormat = storedFormat.keyDateFormat;
            }
            $rootScope.dhis2CalendarFormat = dhis2CalendarFormat;
            return dhis2CalendarFormat;
        }
    };            
})

/* service for dealing with dates */
.service('DateUtils', function($filter, CalendarService){
    
    return {        
        getDate: function(dateValue){
            if(!dateValue){
                return;
            }            
            var calendarSetting = CalendarService.getSetting();
            dateValue = moment(dateValue, calendarSetting.momentFormat)._d;
            return Date.parse(dateValue);
        },
        format: function(dateValue) {            
            if(!dateValue){
                return;
            }
            
            if( isNaN( Date.parse(dateValue) ) ){
                return;
            }
            var calendarSetting = CalendarService.getSetting();            
            dateValue = moment(dateValue, calendarSetting.momentFormat)._d;
            dateValue = $filter('date')(dateValue, calendarSetting.keyDateFormat);            
            return dateValue;
        },
        formatToHrsMins: function(dateValue) {
            var calendarSetting = CalendarService.getSetting();
            var dateFormat = 'YYYY-MM-DD @ hh:mm A';
            if(calendarSetting.keyDateFormat === 'dd-MM-yyyy'){
                dateFormat = 'DD-MM-YYYY @ hh:mm A';
            }            
            return moment(dateValue).format(dateFormat);
        },
        getToday: function(){  
            var calendarSetting = CalendarService.getSetting();
            var tdy = $.calendars.instance(calendarSetting.keyCalendar).newDate();            
            var today = moment(tdy._year + '-' + tdy._month + '-' + tdy._day, 'YYYY-MM-DD')._d;            
            today = Date.parse(today);     
            today = $filter('date')(today,  calendarSetting.keyDateFormat);
            return today;
        },
        formatFromUserToApi: function(dateValue){            
            if(!dateValue){
                return;
            }
            var calendarSetting = CalendarService.getSetting();
            dateValue = moment(dateValue, calendarSetting.momentFormat)._d;
            dateValue = Date.parse(dateValue);     
            dateValue = $filter('date')(dateValue, 'yyyy-MM-dd'); 
            return dateValue;            
        },
        formatFromApiToUser: function(dateValue){            
            if(!dateValue){
                return;
            }            
            var calendarSetting = CalendarService.getSetting();
            dateValue = moment(dateValue, 'YYYY-MM-DD')._d;
            dateValue = Date.parse(dateValue);     
            dateValue = $filter('date')(dateValue, calendarSetting.keyDateFormat); 
            return dateValue;
        }
    };
});

