import {LightningElement, api, track} from 'lwc';
import getFieldInfos from '@salesforce/apex/FieldMappingController.getFieldInfos';

export default class FieldMappingEntryForm extends LightningElement {

    @track error;

    sourceObjectName = 'DataImport__c';
    @track sourceOptions = [];
    @track selectedSourceFieldName = '';
    displayTypeBySourceFieldNameMap;

    @api targetObjectName; //initialize this public property from parent,
                            //currently uses Account as default if not set
    targetOptions = [];
    @track selectedTargetFieldName = '';
    @track validTargetOptions = [];

    constructor() {
        super();

        getFieldInfos({objectNames:[this.sourceObjectName, this.targetObjectName || 'Account']})
            .then(data => {
                this.sourceOptions = this.getOptions(data[this.sourceObjectName]);
                this.targetOptions = this.getOptions(data[this.targetObjectName || 'Account']);
                this.setDisplayTypeByFieldName();
            })
            .catch(error => {
                this.error = error;
            });
    }

    setDisplayTypeByFieldName() {
        this.displayTypeBySourceFieldNameMap = new Map();
        this.sourceOptions.forEach(sourceFieldOption => {
            this.displayTypeBySourceFieldNameMap.set(
                sourceFieldOption.value, sourceFieldOption.displayType);
        });
    }

    getOptions(data) {
        let x = [];
        data.forEach(item => {
            let option = {
                label: item.label,
                value: item.name,
                displayType: item.displayType
            };
            x.push(option);
        });
        return x;
    }

    handleSourceFieldChange(event) {
        this.selectedTargetFieldName = '';

        console.log('*** ' + 'in handleSourceFieldChange' + ' ***');
        console.log('event.detail.value: ', event.detail.value);
        this.selectedSourceFieldName = event.detail.value;

        console.log(this.displayTypeBySourceFieldNameMap); //undefined?
        let sourceFieldType = this.displayTypeBySourceFieldNameMap.get(this.selectedSourceFieldName);
        console.log('sourceFieldType: ', sourceFieldType);

        this.validTargetOptions = this.targetOptions.filter(this.isValidTargetMapping(sourceFieldType));
        console.log('*** ' + 'after filtering' + ' ***');
        console.log('this.validTargetOptions: ', this.validTargetOptions);
        console.log('*** ' + 'end handleSourceFieldChange' + ' ***');
    }

    handleTargetFieldChange(event) {
        this.selectedTargetFieldName = event.detail.value;
    }

    isValidTargetMapping(sourceType) {
        return targetFieldInfo => {
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