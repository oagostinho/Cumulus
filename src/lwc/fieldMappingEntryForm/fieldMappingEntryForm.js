/**
 * Created by kenneth.lewis on 2019-06-24.
 */

import {LightningElement, track, wire} from 'lwc';
import getSourceFieldInfos from '@salesforce/apex/FieldMappingController.getSourceFieldInfos';
import getTargetFieldInfos from '@salesforce/apex/FieldMappingController.getTargetFieldInfos';

export default class FieldMappingEntryForm extends LightningElement {
    @track sourceFieldName = '';
    @track sourceFieldOptions = getSourceFieldInfos({objectApiName:'DataImport__c'});

    @track value = 'Select a source field';
    @track options = [];

    constructor(){
        super();
        getSourceFieldInfos({objectApiName: 'DataImport__c'})
            .then((data) => {
                this.options = this.getOptions(data);
            });

        getTargetFieldInfos(
            {
                sourceObjectName: 'DataImport__c',
                sourceFieldName: 'Name',
                targetObjectName: 'Contact'
            })
            .then((data) => {
                // todo: this.initialize(data); //avoid looping twice
                this.targetOptions = this.getOptions(data);
                this.setDisplayTypeByFieldName();
            });
    }

    setDisplayTypeByFieldName = () => {
        console.log('*** ' + 'setting displaytypesbyfieldname' + ' ***');
            this.displayTypesByFieldName = new Map();
        this.targetOptions.forEach((item) => {
            console.log(item);
            // this.displayTypesByFieldName[item.value] = item.displayType;
            this.displayTypesByFieldName.set(item.value, item.displayType);
        });
        console.log('this.displayTypesByFieldName: ', this.displayTypesByFieldName);
    }

    getOptions = (data) => {
        let x = [];
        data.forEach((item) => {
            let option = {
                label: item.label,
                value: item.name,
                displayType: item.displayType
            };
            x.push(option);
        });
        return x;
    }

    // getOptionsByName =

    handleChange(event) {
        // console.log(JSON.stringify(event));
        console.log('*** ' + 'in handleChange' + ' ***');
        console.log('event.detail.value: ', event.detail.value);
        this.value = event.detail.value;
        console.log('this.displayTypesByFieldName: ' + this.displayTypesByFieldName);
        let sourceFieldType = this.displayTypesByFieldName.get(this.value);
        console.log('sourceFieldType: ', sourceFieldType);
        this.validTargetOptions = this.targetOptions.filter(this.isValidTargetMapping(sourceFieldType));
        console.log('*** ' + 'after filtering' + ' ***');
        console.log('this.validTargetOptions: ', this.validTargetOptions);
        console.log('*** ' + 'end handleChange' + ' ***');
    }

    @track value2 = 'target field options...';
    targetOptions = [];
    displayTypesByFieldName;
    @track validTargetOptions = [];

    handleChange2(event) {
        this.value2 = event.detail.value;
    }

    isValidTargetMapping = (sourceType) => {
        return (targetFieldInfo) => {
            console.log('*** ' + 'in returned function' + ' ***');
            console.log(sourceType);
            console.log(targetFieldInfo);
            if (targetFieldInfo.displayType === sourceType) {
                return true;
            }
            //future implementation of multiple target field types
            switch (targetFieldInfo.displayType) {
                case 'ADDRESS':
                case 'BASE64':
                case 'BOOLEAN':
                case 'LIST':
                case 'CURRENCY':
                case 'DATACATEGORYGROUPREFERENCE':
                case 'DATE':
                case 'DATETIME':
                case 'DOUBLE':
                case 'EMAIL':
                case 'ENCRYPTEDSTRING':
                case 'ID':
                case 'INTEGER':
                case 'LONG':
                case 'SELECTED':
                case 'PERCENT':
                case 'NUMBER':
                case 'SELECTED':
                case 'REFERENCE':
                case 'STRING':
                case 'TEXTAREA':
                case 'TIME':
                case 'URLCASE':
                default:
            }
        }
    }

}